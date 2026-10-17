const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const source = fs.readFileSync(`${__dirname}/modalDismissalPolicy.js`, 'utf8')
  .replaceAll('export ', '').replace(/^if \(import\.meta\.hot\).*$/m, '')
const context = { document: { addEventListener() {} } }
vm.createContext(context)
vm.runInContext(source, context)
const node = (visible, tour = false) => ({ hidden: false, closest: () => tour ? {} : null, getClientRects: () => visible ? [{}] : [] })
function event(key) { return { key, prevented: false, stopped: false, preventDefault() { this.prevented = true }, stopImmediatePropagation() { this.stopped = true } } }
test('Escape cannot dismiss a visible modal', () => {
  const e = event('Escape')
  context.protectModalFromEscape(e, { querySelectorAll: () => [node(true)] })
  assert.equal(e.prevented, true); assert.equal(e.stopped, true)
})
test('hidden modals do not interfere with menu/sidebar Escape', () => {
  const e = event('Escape')
  context.protectModalFromEscape(e, { querySelectorAll: () => [node(false)] })
  assert.equal(e.prevented, false)
})
test('normal typing remains unaffected', () => {
  const e = event('Enter')
  context.protectModalFromEscape(e, { querySelectorAll: () => [node(true)] })
  assert.equal(e.prevented, false)
})
test('tour Escape remains unaffected', () => {
  const e = event('Escape')
  context.protectModalFromEscape(e, { querySelectorAll: () => [node(true, true)] })
  assert.equal(e.prevented, false)
})
test('modal templates have no outside-click dismissal bindings', () => {
  const path = require('node:path')
  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) scan(file)
      else if (file.endsWith('.vue')) {
        const template = fs.readFileSync(file, 'utf8').split('<script')[0]
        assert.doesNotMatch(template, /@click\.self=|@click="closeOnBackdrop"|class="modal-overlay"\s+@click=/, file)
      }
    }
  }
  scan(path.resolve(__dirname, '..'))
})
