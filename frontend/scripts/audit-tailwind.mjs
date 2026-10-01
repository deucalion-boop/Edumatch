// Repeatable on a clean checkout: require Tailwind for all application styling.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { parse } from '@vue/compiler-sfc'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const problems = []
let utilityApplications = 0
let primitives = 0
let dynamicStyles = 0

async function filesIn(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesIn(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat()
}

function audit(css, filename) {
  const ast = postcss.parse(css, { from: filename })
  ast.walkDecls(declaration => {
    let primitive = declaration.prop.startsWith('--')
    for (let parent = declaration.parent; parent; parent = parent.parent) {
      if (parent.type === 'atrule' && /keyframes$|^(theme|font-face|property|counter-style|font-feature-values|font-palette-values)$/.test(parent.name)) primitive = true
    }
    if (primitive) primitives++
    else problems.push(`${filename}:${declaration.source.start.line}: ordinary declaration ${declaration.prop}; use @apply tw: utilities`)
  })
  ast.walkAtRules('apply', rule => {
    utilityApplications++
    if (!rule.params.startsWith('tw:')) problems.push(`${filename}: unprefixed @apply ${rule.params}`)
  })
}

for (const filename of await filesIn(path.join(root, 'src'))) {
  const source = await fs.readFile(filename, 'utf8')
  const label = path.relative(root, filename).replaceAll('\\', '/')
  if (filename.endsWith('.css')) audit(source, label)
  if (filename.endsWith('.vue')) {
    const { descriptor, errors } = parse(source, { filename })
    problems.push(...errors.map(error => `${label}: ${error}`))
    descriptor.styles.forEach(style => audit(style.content, label))
    const template = descriptor.template?.content || ''
    if (/(?<![:\w-])style\s*=/.test(template)) problems.push(`${label}: static inline style remains`)
    dynamicStyles += (template.match(/:style\s*=/g) || []).length
  }
  if (['.vue', '.js', '.css'].includes(path.extname(filename)) && /['"]\/css\/(?:admin|auth|headteacher|iabcc|notifications|secretary|student|teacher)\.css/.test(source)) problems.push(`${label}: legacy public CSS reference`)
}
for (const filename of ['index.html', 'public/service-worker.js']) {
  if (/['"]\/css\//.test(await fs.readFile(path.join(root, filename), 'utf8'))) problems.push(`${filename}: legacy public CSS reference`)
}
try {
  const old = await fs.readdir(path.join(root, 'public/css'))
  if (old.some(file => file.endsWith('.css'))) problems.push('public/css still contains legacy stylesheets')
} catch (error) { if (error.code !== 'ENOENT') throw error }

if (process.argv.includes('--dist')) {
  for (const filename of await filesIn(path.join(root, 'dist'))) {
    if (!filename.endsWith('.css')) continue
    postcss.parse(await fs.readFile(filename, 'utf8')).walkAtRules(rule => {
      if (/^(apply|reference|theme|source|utility|variant|custom-variant)$/.test(rule.name)) problems.push(`${filename}: uncompiled @${rule.name}`)
    })
    if (path.relative(path.join(root, 'dist'), filename).startsWith('css' + path.sep)) problems.push(`${filename}: copied legacy stylesheet`)
  }
}

console.log(`Tailwind audit: ${utilityApplications} @apply rules; ${primitives} theme/animation primitives; ${dynamicStyles} runtime style bindings.`)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exitCode = 1
} else console.log('PASS: all application declaration rules use prefixed Tailwind utilities.')
