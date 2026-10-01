// One-time, compiler-checked mechanical migration. See docs/tailwind-migration.md.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-sfc'
import { convertCss } from './tailwind-migration.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const scratch = path.join(root, '.tailwind-migration')
const baseline = path.join(scratch, 'baseline')
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

async function filesIn(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesIn(path.join(directory, entry.name))
    : path.join(directory, entry.name)))).flat()
}

function sourceImports(css, owner) {
  const imports = []
  const rewritten = css.replace(/(['"])\/css\/([^'"]+)\1/g, (_all, quote, name) => {
    if (!mappings[name]) throw new Error(`Unknown legacy stylesheet ${name}`)
    let relative = path.relative(path.dirname(owner), path.join(root, mappings[name])).replaceAll('\\', '/')
    if (!relative.startsWith('.')) relative = './' + relative
    return quote + relative + quote
  }).replace(/@import\s+url\((['"])(\.{1,2}\/[^'"]+\.tailwind\.css)\1\)\s*;/g,
    (_all, quote, file) => `@import ${quote}${file}${quote};`)
    .replace(/@import\s+url\((['"])https?:\/\/[^'"]+\1\)\s*;/g, match => {
      imports.push(match)
      return ''
    })
  // Vite hoisted these before local styles previously. Keep remote imports valid
  // now that Tailwind expands local component imports before Vite's CSS pass.
  return imports.length ? imports.join('\n') + '\n' + rewritten : rewritten
}

function conversionOptions(owner) {
  let reference = path.relative(path.dirname(owner), path.join(root, 'src/styles/tailwind.css')).replaceAll('\\', '/')
  if (!reference.startsWith('.')) reference = './' + reference
  return { reference, prefix: 'tw' }
}

if (process.argv[2] === 'snapshot') {
  try { await fs.access(path.join(baseline, 'index.html')); throw new Error('Baseline already exists; refusing to overwrite it') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  await fs.mkdir(baseline, { recursive: true })
  for (const directory of ['src', 'public']) {
    await fs.cp(path.join(root, directory), path.join(baseline, directory), { recursive: true })
  }
  await fs.copyFile(path.join(root, 'index.html'), path.join(baseline, 'index.html'))
  // The baseline has the original selectors and values, before conversion.
  const routerPath = path.join(baseline, 'src/router/index.js')
  let router = await fs.readFile(routerPath, 'utf8')
  router = router.replace(/^import \w+StylesheetUrl from .*\.tailwind\.css\?url['"]\r?\n/gm, '')
  for (const role of ['teacher', 'secretary', 'headteacher']) {
    router = router.replace(new RegExp(`const ${role.toUpperCase()}_STYLESHEET_HREF = ${role}StylesheetUrl`),
      `const ${role.toUpperCase()}_STYLESHEET_HREF = '/css/${role}.css'`)
  }
  await fs.writeFile(routerPath, router)
  const mainPath = path.join(baseline, 'src/main.js')
  await fs.writeFile(mainPath, (await fs.readFile(mainPath, 'utf8')).replace(/^import '\.\/styles\/tailwind\.css'\r?\n/m, ''))
  console.log('Original UI snapshot saved to .tailwind-migration/baseline (gitignored).')
} else if (process.argv[2] === 'convert') {
  const records = []
  for (const [oldName, newName] of Object.entries(mappings)) {
    const original = await fs.readFile(path.join(baseline, 'public/css', oldName), 'utf8')
    const outputPath = path.join(root, newName)
    const result = await convertCss(sourceImports(original, outputPath), conversionOptions(outputPath))
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, typeof result === 'string' ? result : result.css)
    records.push({ file: newName, source: `public/css/${oldName}` })
  }
  for (const file of await filesIn(path.join(root, 'src'))) {
    if (!file.endsWith('.vue')) continue
    // Re-run only the mechanical style conversion from the saved baseline.
    let source = await fs.readFile(path.join(baseline, path.relative(root, file)), 'utf8')
    const { descriptor, errors } = parse(source, { filename: file })
    if (errors.length) throw new Error(`${file}: ${errors.join(', ')}`)
    for (const block of [...descriptor.styles].reverse()) {
      const result = await convertCss(sourceImports(block.content, file), conversionOptions(file))
      source = source.slice(0, block.loc.start.offset)
        + '\n' + (typeof result === 'string' ? result : result.css) + '\n'
        + source.slice(block.loc.end.offset)
      records.push({ file: path.relative(root, file).replaceAll('\\', '/'), scoped: !!block.scoped })
    }
    if (descriptor.styles.length) await fs.writeFile(file, source)
  }
  const printPath = path.join(root, 'src/styles/export/archive-print.tailwind.css')
  const printResult = await convertCss(await fs.readFile(path.join(baseline, 'src/styles/export/archive-print.tailwind.css'), 'utf8'), conversionOptions(printPath))
  await fs.writeFile(printPath, typeof printResult === 'string' ? printResult : printResult.css)
  records.push({ file: 'src/styles/export/archive-print.tailwind.css' })
  await fs.writeFile(path.join(scratch, 'converted.json'), JSON.stringify(records, null, 2))
  console.log(`Converted ${records.length} stylesheet sources/blocks. Legacy public assets retained until verification.`)
} else {
  console.log('Usage: node scripts/migrate-styles.mjs snapshot|convert')
}
