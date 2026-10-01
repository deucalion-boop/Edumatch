/**
 * Compare migrated Tailwind sources with the saved, pre-migration UI.
 * Run after conversion: node scripts/verify-tailwind-styles.mjs
 * Run after removing old public styles and rebuilding: add --final.
 * The only output file is .tailwind-migration/style-verification.json.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { compile } from 'tailwindcss'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { parse as parseTemplate } from '@vue/compiler-dom'
import { encodeArbitraryValue, verifyCss } from './tailwind-migration.mjs'
import { migrateFiniteStyleBindings } from './migrate-inline-styles.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const scratch = path.join(root, '.tailwind-migration')
const baseline = path.join(scratch, 'baseline')
const final = process.argv.includes('--final')
const mappings = {
  'iabcc.css': 'src/styles/foundation.tailwind.css',
  'student.css': 'src/styles/roles/student.tailwind.css',
  'notifications.css': 'src/styles/notifications.tailwind.css',
  'auth.css': 'src/styles/auth.tailwind.css',
  'admin.css': 'src/styles/roles/admin.tailwind.css',
  'teacher.css': 'src/styles/roles/teacher.tailwind.css',
  'secretary.css': 'src/styles/roles/secretary.tailwind.css',
  'headteacher.css': 'src/styles/roles/headteacher.tailwind.css',
}
const primitiveAtRules = /^(?:-\w+-)?keyframes$|^(?:font-face|property|counter-style|font-feature-values|font-palette-values)$/i
const report = {
  mode: final ? 'final' : 'sources',
  verifiedAt: new Date().toISOString(),
  passed: false,
  totals: { stylesheets: 0, vueComponents: 0, vueStyleBlocks: 0, declarations: 0, keyframes: 0, scopedBlocks: 0, staticInlineStyles: 0, inlineDeclarations: 0, finiteStyleBindings: 0, builtCssFiles: 0 },
  checks: [],
}

const normalizeText = text => text.replaceAll('\r\n', '\n').trim()
const relative = file => path.relative(root, file).replaceAll('\\', '/')
const read = file => fs.readFile(file, 'utf8')

async function filesIn(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesIn(path.join(directory, entry.name))
    : path.join(directory, entry.name)))).flat().sort()
}

async function check(name, action) {
  try {
    const details = await action()
    report.checks.push({ name, passed: true, ...details })
  } catch (error) {
    const message = String(error.message || error).slice(0, 2400)
    report.checks.push({ name, passed: false, error: message })
    console.error(`FAIL ${name}: ${message.split('\n')[0]}`)
  }
}

function withoutImports(css) {
  const tree = postcss.parse(css)
  tree.walkAtRules(rule => {
    if (['import', 'reference', 'source'].includes(rule.name)) rule.remove()
  })
  return tree.toString()
}

function imports(css, owner) {
  const result = []
  postcss.parse(css).walkAtRules('import', rule => {
    const match = rule.params.match(/^(?:url\(\s*)?(['"])(.*?)\1\s*\)?(.*)$/s)
    assert.ok(match, `Unrecognized import syntax: ${rule.params}`)
    let target = match[2]
    if (target.startsWith('/css/')) {
      const mapped = mappings[target.slice('/css/'.length)]
      assert.ok(mapped, `Unknown legacy CSS import: ${target}`)
      target = mapped
    } else if (!/^(?:https?:|data:|\/)/i.test(target)) {
      target = relative(path.resolve(path.dirname(owner), target))
    }
    result.push({ target, conditions: match[3].trim() })
  })
  // Browsers require remote imports before ordinary rules. Vite's existing
  // pipeline hoisted these; the migrated sources make that order explicit.
  const remote = item => /^(?:https?:)?\/\//i.test(item.target)
  return [...result.filter(remote), ...result.filter(item => !remote(item))]
}

function keyframes(css) {
  const result = []
  postcss.parse(css).walkAtRules(rule => {
    if (/^(?:-\w+-)?keyframes$/i.test(rule.name)) result.push(`${rule.name}:${rule.params}`)
  })
  return result
}

function assertTailwindDeclarations(css) {
  const remaining = []
  postcss.parse(css).walkDecls(declaration => {
    if (declaration.prop.startsWith('--')) return
    for (let parent = declaration.parent; parent; parent = parent.parent) {
      if (parent.type === 'atrule' && primitiveAtRules.test(parent.name)) return
    }
    remaining.push(declaration.toString())
  })
  assert.equal(remaining.length, 0, `Ordinary CSS declarations remain: ${remaining.slice(0, 5).join('; ')}`)
}

async function expanded(css) {
  const compiler = await compile('@theme prefix(tw) {}\n' + withoutImports(css), { polyfills: 0 })
  return compiler.build([])
}

async function verifyStyle(original, migrated, owner, scoped = false) {
  assert.deepEqual(imports(migrated, owner), imports(original, owner), 'Stylesheet imports or their order changed')
  const result = await verifyCss(original, migrated, { prefix: 'tw' })
  assertTailwindDeclarations(migrated)
  const compiled = await expanded(migrated)
  const originalKeyframes = keyframes(original)
  assert.deepEqual(keyframes(compiled), originalKeyframes, 'Declared keyframes changed')
  if (scoped) {
    const options = { filename: owner, id: 'data-v-tailwind-verification', scoped: true, isProd: true }
    const before = compileStyle({ ...options, source: withoutImports(original) })
    const after = compileStyle({ ...options, source: compiled })
    assert.deepEqual(before.errors, [], 'Original Vue style did not compile')
    assert.deepEqual(after.errors, [], 'Migrated Vue style did not compile')
    await verifyCss(before.code, after.code)
    assert.deepEqual(keyframes(after.code), keyframes(before.code), 'Vue scoped keyframe names changed')
    report.totals.scopedBlocks += 1
  }
  report.totals.declarations += result.declarations
  report.totals.keyframes += originalKeyframes.length
  return { declarations: result.declarations, keyframes: originalKeyframes.length, scoped }
}

function descriptor(source, filename) {
  const parsed = parse(source, { filename })
  assert.deepEqual(parsed.errors, [], `Invalid Vue component: ${filename}`)
  return parsed.descriptor
}

function blockUnchanged(before, after, name) {
  assert.equal(Boolean(after), Boolean(before), `${name} block added or removed`)
  if (!before) return
  assert.deepEqual(after.attrs, before.attrs, `${name} attributes changed`)
  assert.equal(normalizeText(after.content), normalizeText(before.content), `${name} contents changed`)
}

const staticAttribute = (node, name) => node.props?.find(prop => prop.type === 6 && prop.name === name)
const classTokens = node => (staticAttribute(node, 'class')?.value?.content || '').trim().split(/\s+/).filter(Boolean)

function templateElements(node, result = []) {
  if (node.type === 1) result.push(node)
  for (const child of node.children || []) templateElements(child, result)
  return result
}

function comparableTemplate(node) {
  if (node.type === 0) return { type: node.type, children: node.children.map(comparableTemplate) }
  if (node.type !== 1) return { type: node.type, source: node.loc.source }
  return {
    type: node.type,
    tag: node.tag,
    tagType: node.tagType,
    namespace: node.ns,
    selfClosing: Boolean(node.isSelfClosing),
    // Every binding and other attribute must remain byte-for-byte unchanged.
    // Only static class/style attributes are compared separately below.
    props: node.props.filter(prop => prop.type !== 6 || !['class', 'style'].includes(prop.name)).map(prop => prop.loc.source),
    classes: classTokens(node).filter(token => !token.startsWith('tw:inline:')),
    children: node.children.map(comparableTemplate),
  }
}

async function verifyTemplate(before, after) {
  assert.equal(Boolean(after), Boolean(before), 'Template block added or removed')
  if (!before) return { staticInlineStyles: 0, inlineDeclarations: 0, finiteStyleBindings: 0 }
  assert.deepEqual(after.attrs, before.attrs, 'Template block attributes changed')
  // Normalize only the independently tested confirmation-button finite style
  // choice. Its predicate is unchanged; every other binding stays byte-identical.
  const finite = migrateFiniteStyleBindings(`<template>${before.content}</template>`, 'template-verification.vue')
  const normalizedBefore = descriptor(finite.source, 'template-verification.vue').template.content
  const original = parseTemplate(normalizedBefore.replaceAll('\r\n', '\n'), { comments: true, whitespace: 'preserve' })
  const migrated = parseTemplate(after.content.replaceAll('\r\n', '\n'), { comments: true, whitespace: 'preserve' })
  assert.deepEqual(comparableTemplate(migrated), comparableTemplate(original), 'Template changed beyond static style-to-utility conversion')
  const originalElements = templateElements(original)
  const migratedElements = templateElements(migrated)
  let staticInlineStyles = 0
  let inlineDeclarations = finite.declarations
  for (let index = 0; index < originalElements.length; index += 1) {
    const element = originalElements[index]
    const style = staticAttribute(element, 'style')
    const nextElement = migratedElements[index]
    assert.ok(!staticAttribute(nextElement, 'style'), `Static style remains on <${element.tag}>`)
    const originalInline = classTokens(element).filter(token => token.startsWith('tw:inline:'))
    const actualInline = classTokens(nextElement).filter(token => token.startsWith('tw:inline:'))
    if (!style) {
      assert.deepEqual(actualInline, originalInline, `Unexpected inline utilities on <${element.tag}>`)
      continue
    }
    const declarations = []
    const css = `.inline-verification { ${style.value?.content || ''} }`
    postcss.parse(css).walkDecls(declaration => declarations.push(declaration))
    const expectedInline = declarations.map(declaration =>
      `tw:inline:[${declaration.prop}:${encodeArbitraryValue(declaration.value)}]${declaration.important ? '!' : ''}`)
    assert.deepEqual(actualInline, [...originalInline, ...expectedInline], `Inline utility values/order changed on <${element.tag}>`)
    const migratedCss = `.inline-verification { ${expectedInline.map(token => `@apply ${token.replace('tw:inline:', 'tw:')};`).join(' ')} }`
    await verifyCss(css, migratedCss, { prefix: 'tw' })
    staticInlineStyles += 1
    inlineDeclarations += declarations.length
  }
  report.totals.staticInlineStyles += staticInlineStyles
  report.totals.inlineDeclarations += inlineDeclarations
  report.totals.finiteStyleBindings += finite.count
  return { staticInlineStyles, inlineDeclarations, finiteStyleBindings: finite.count }
}

for (const [oldName, newName] of Object.entries(mappings)) {
  await check(newName, async () => {
    const details = await verifyStyle(
      await read(path.join(baseline, 'public/css', oldName)),
      await read(path.join(root, newName)),
      path.join(root, newName),
    )
    report.totals.stylesheets += 1
    return details
  })
}

await check('src/styles/export/archive-print.tailwind.css', async () => {
  const name = 'src/styles/export/archive-print.tailwind.css'
  const details = await verifyStyle(await read(path.join(baseline, name)), await read(path.join(root, name)), path.join(root, name))
  report.totals.stylesheets += 1
  return details
})

for (const originalFile of (await filesIn(path.join(baseline, 'src'))).filter(file => file.endsWith('.vue'))) {
  const name = path.relative(baseline, originalFile).replaceAll('\\', '/')
  const currentFile = path.join(root, name)
  await check(name, async () => {
    const before = descriptor(await read(originalFile), currentFile)
    const after = descriptor(await read(currentFile), currentFile)
    blockUnchanged(before.script, after.script, 'script')
    blockUnchanged(before.scriptSetup, after.scriptSetup, 'script setup')
    const template = await verifyTemplate(before.template, after.template)
    assert.deepEqual(after.customBlocks.map(block => [block.type, block.attrs, normalizeText(block.content)]),
      before.customBlocks.map(block => [block.type, block.attrs, normalizeText(block.content)]), 'Custom Vue blocks changed')
    assert.equal(after.styles.length, before.styles.length, 'Vue style block count changed')
    const styles = []
    for (let index = 0; index < before.styles.length; index += 1) {
      assert.deepEqual(after.styles[index].attrs, before.styles[index].attrs, `Style ${index} attributes/scoped flag changed`)
      styles.push(await verifyStyle(before.styles[index].content, after.styles[index].content, currentFile, Boolean(before.styles[index].scoped)))
      report.totals.vueStyleBlocks += 1
    }
    report.totals.vueComponents += 1
    return {
      styleBlocks: styles.length,
      declarations: styles.reduce((sum, style) => sum + style.declarations, 0),
      scriptsUnchanged: true,
      templateUnchangedExceptStaticStyles: true,
      ...template,
    }
  })
}

await check('no legacy stylesheet references in application sources', async () => {
  const files = [...await filesIn(path.join(root, 'src')), path.join(root, 'index.html'), path.join(root, 'public/service-worker.js')]
  const stale = []
  for (const file of files.filter(file => /\.(?:vue|[cm]?js|ts|css|html)$/.test(file))) {
    if (/['"`]\/css\/(?:admin|auth|headteacher|iabcc|notifications|secretary|student|teacher)\.css\b/.test(await read(file))) stale.push(relative(file))
  }
  assert.deepEqual(stale, [], 'Legacy stylesheet URLs remain')
  return { filesChecked: files.length }
})

if (final) {
  await check('obsolete public CSS files removed', async () => {
    const present = []
    for (const filename of Object.keys(mappings)) {
      try { await fs.access(path.join(root, 'public/css', filename)); present.push(filename) }
      catch (error) { if (error.code !== 'ENOENT') throw error }
    }
    assert.deepEqual(present, [], 'Legacy public CSS files remain')
    return { removed: Object.keys(mappings).length }
  })
  await check('production CSS is fully compiled', async () => {
    const cssFiles = (await filesIn(path.join(root, 'dist'))).filter(file => file.endsWith('.css'))
    assert.ok(cssFiles.length, 'Production CSS is missing; run npm run build first')
    for (const file of cssFiles) {
      assert.doesNotMatch(await read(file), /@(?:apply|reference|tailwind|utility|custom-variant|source)\b/, `Uncompiled Tailwind directive in ${relative(file)}`)
      assert.ok(!/^dist\/css\//.test(relative(file)), `Obsolete public CSS was copied to ${relative(file)}`)
    }
    report.totals.builtCssFiles = cssFiles.length
    return { filesChecked: cssFiles.length }
  })
  await check('production role stylesheets remain preload-only and discoverable offline', async () => {
    const html = await read(path.join(root, 'dist/index.html'))
    const links = html.match(/<link\b[^>]*>/g) || []
    for (const role of ['teacher', 'secretary', 'headteacher']) {
      const matching = links.filter(link => new RegExp(`/${role}\\.tailwind-[^"']+\\.css`).test(link))
      assert.equal(matching.length, 1, `Expected one compiled ${role} stylesheet preload`)
      assert.match(matching[0], /\brel=["']preload["']/, `${role} styles must not be activated globally`)
      assert.match(matching[0], /\bas=["']style["']/, `${role} preload must identify a stylesheet`)
      assert.match(matching[0], /\bhref=["']\/assets\//, `${role} stylesheet must be discoverable by the service worker`)
    }
    const activeAssets = links.filter(link => /\brel=["']stylesheet["']/.test(link))
      .map(link => link.match(/\bhref=["'](\/assets\/[^"']+)["']/)?.[1]).filter(Boolean)
    assert.ok(activeAssets.length, 'Missing application stylesheet')
    for (const href of activeAssets) {
      const css = await read(path.join(root, 'dist', href.replace(/^\//, '')))
      assert.doesNotMatch(css, /--(?:headteacher-bg|sidebar-active-bg)\s*:/,
        'A preloaded role stylesheet was eagerly merged into the global application stylesheet')
    }
    return { rolePreloads: 3, roleStylesRemainIsolated: true }
  })
}

report.passed = report.checks.every(result => result.passed)
await fs.mkdir(scratch, { recursive: true })
await fs.writeFile(path.join(scratch, 'style-verification.json'), JSON.stringify(report, null, 2) + '\n')
const failed = report.checks.filter(result => !result.passed).length
console.log(`Tailwind style verification ${report.passed ? 'passed' : 'FAILED'}: ${report.totals.stylesheets} stylesheets, ${report.totals.vueComponents} Vue components, ${report.totals.vueStyleBlocks} style blocks, ${report.totals.declarations} ordered declarations, ${report.totals.keyframes} keyframes; ${failed} failures.`)
console.log('Report: .tailwind-migration/style-verification.json')
if (!report.passed) process.exitCode = 1
