// Run: node frontend/scripts/check-student-registry.cjs (or node scripts/check-student-registry.cjs from frontend).
// Executes the real Vue setup with mocked API/clipboard/downloads. No HTTP, emails or database writes.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const vue = require('../node_modules/vue')
const sfc = require('../node_modules/@vue/compiler-sfc')
const { File } = require('node:buffer')
const file = path.resolve(__dirname, '../src/views/headteacher/HeadTeacherStudentRegistry.vue')
const source = fs.readFileSync(file, 'utf8')
const descriptor = sfc.parse(source, { filename: file }).descriptor
const script = sfc.compileScript(descriptor, { id: 'registry-runtime' })
const template = sfc.compileTemplate({ source: descriptor.template.content, filename: file, id: 'registry-runtime', compilerOptions: { bindingMetadata: script.bindings } })
assert.deepEqual(template.errors, [])
let code = script.content
  .replace(/import \{([^}]+)\} from 'vue'/, 'const {$1} = vueApi')
  .replace("import axios from 'axios'", 'const axios = mockAxios')
  .replace(/import HeadTeacherSidebar from [^\n]+/, 'const HeadTeacherSidebar = {}')
  .replace(/import HeadTeacherNotifications from [^\n]+/, 'const HeadTeacherNotifications = {}')
  .replace(/import \{ useAuthStore \} from [^\n]+/, 'const useAuthStore = () => auth')
  .replace('import.meta.env.VITE_API_BASE_URL', "''")
  .replace('export default', 'module.exports =')
const future = new Date(Date.now() + 86400000).toISOString()
const allClasses = [{ id: 'science', teacherId: 'teacher-a', teacherName: 'Maria', className: 'Science A', name: 'Science' }, { id: 'math', teacherId: 'teacher-b', teacherName: 'Jose', className: 'Math B', name: 'Mathematics' }]
let rows = Array.from({ length: 25 }, (_, i) => ({ id: `student-${i}`, firstName: 'Student', lastName: String(i), fullName: `Student ${i}`, status: i === 0 ? 'registered' : 'pending', registrationCode: i === 0 ? null : `CODE-${i}`, codeExpiresAt: future, createdAt: new Date().toISOString(), assignments: i === 0 ? [{ subjectId: 'science', teacherName: 'Maria', className: 'Science A' }] : [] }))
let registrationLink = { url: 'https://example.test/auth/student-register/school-link', expiresAt: future }
const preview = [
  { rowNumber: 2, firstName: 'Maria', lastName: 'Santos', status: 'valid', errors: [], warnings: [] },
  { rowNumber: 3, firstName: 'Marie', lastName: 'Santos', status: 'valid', errors: [], warnings: ['Similar name exists.'] },
  { rowNumber: 4, firstName: '', lastName: 'Cruz', status: 'invalid', errors: ['First name is required.'], warnings: [] },
  { rowNumber: 5, firstName: 'Maria', lastName: 'Santos', status: 'invalid', errors: ['Duplicate name.'], warnings: [] },
]
const posts = [], gets = [], copies = [], downloads = [], hooks = {}
let denied = false, selected = false, open = false
const input = { focus() {}, select() { selected = true } }
const mockAxios = {
  get: async (url, config) => {
    assert.equal(config.headers.Authorization, 'Bearer mocked-registry-token')
    gets.push({ url, params: structuredClone(config.params) })
    if (url.endsWith('/export') || url.endsWith('/template')) return { data: new Blob(['mock workbook'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) }
    const params = config.params || {}
    return { data: { students: structuredClone(rows.filter(row => (!params.status || row.status === params.status) && (!params.unassigned || !row.assignments.length) && (!params.search || row.fullName.toLowerCase().includes(params.search.toLowerCase())))), summary: { total: rows.length, registered: rows.filter(row => row.status === 'registered').length, pending: rows.filter(row => row.status !== 'registered').length, unassigned: rows.filter(row => !row.assignments.length).length }, classes: allClasses, registrationLink: structuredClone(registrationLink) } }
  },
  post: async (url, body, config) => {
    assert.equal(config.headers.Authorization, 'Bearer mocked-registry-token')
    posts.push({ url, body: body instanceof FormData ? body : structuredClone(body) })
    if (url.endsWith('/preview')) return { data: { records: preview, summary: { total: 4, valid: 2, invalid: 2, possibleDuplicates: 1 } } }
    if (url.endsWith('/import')) return { data: { imported: body.records.length, message: 'Imported two students.' } }
    if (url.endsWith('/assign')) { rows = rows.map(row => body.registryIds.includes(row.id) ? { ...row, assignments: body.subjectIds.map(id => ({ subjectId: id, ...allClasses.find(item => item.id === id) })) } : row); return { data: {} } }
    if (url.endsWith('/link')) { if (body.rotate) registrationLink = { ...registrationLink, url: 'https://example.test/auth/student-register/rotated-link' }; return { data: { registrationLink } } }
    const match = url.match(/\/([^/]+)\/(revoke|code)$/)
    assert.ok(match)
    rows = rows.map(row => row.id === match[1] ? { ...row, status: match[2] === 'revoke' ? 'revoked' : 'pending', registrationCode: match[2] === 'revoke' ? null : 'NEW-CODE', codeExpiresAt: future } : row)
    return { data: { student: rows.find(row => row.id === match[1]) } }
  },
}
const box = {
  module: { exports: {} }, vueApi: { ...vue, onMounted: fn => { hooks.mount = fn }, onBeforeUnmount: fn => { hooks.unmount = fn } }, mockAxios, auth: vue.reactive({ token: 'mocked-registry-token', user: { name: 'Head Teacher' } }), AbortController, Blob, FormData, console,
  navigator: { clipboard: { writeText: async text => { if (denied) throw new Error('clipboard denied'); copies.push(text) } } },
  window: { setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {}, addEventListener() {}, removeEventListener() {} },
  document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, getElementById: () => input, body: { appendChild() {} }, createElement: () => ({ href: '', download: '', click() { downloads.push(this.download) }, remove() {} }) },
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL() {} },
}
vm.runInNewContext(code, box, { filename: file })
const state = box.module.exports.setup({}, { expose() {} })
state.dialog.value = { get open() { return open }, showModal() { open = true }, close() { open = false } }
state.linkInput.value = input
state.fileInput.value = { value: '' }
async function run() {
  const css = await require('../node_modules/@tailwindcss/node/dist/index.js').compile(descriptor.styles[0].content, { base: path.dirname(file), from: file, onDependency() {} })
  assert.equal(css.build([]).includes('@apply'), false)
  await state.loadRegistry()
  assert.equal(state.summary.total, 25)
  assert.equal(state.summary.registered, 1)
  assert.equal(state.pagedStudents.value.length, 20)
  state.togglePageSelection(true)
  assert.equal(state.selectedIds.value.length, 20)
  state.currentPage.value = 2
  state.togglePageSelection(true)
  assert.equal(state.selectedIds.value.length, 25)
  state.togglePageSelection(false)
  assert.equal(state.selectedIds.value.length, 20)
  await state.openDialog('import')
  state.selectFile({ target: { files: [new File(['xlsx fixture'], 'students.xlsx')], value: 'students.xlsx' } })
  await state.previewImport()
  assert.equal(state.previewRecords.value.length, 4)
  assert.equal(state.validPreviewRecords.value.length, 2)
  assert.equal(state.possibleDuplicates.value, 1)
  const beforeImport = posts.length
  await state.commitImport()
  assert.equal(posts.length, beforeImport, 'Possible duplicates require acknowledgement')
  state.allowPossibleDuplicates.value = true
  await state.commitImport()
  assert.deepEqual(posts.find(call => call.url.endsWith('/import')).body, { records: [{ firstName: 'Maria', lastName: 'Santos' }, { firstName: 'Marie', lastName: 'Santos' }], allowPossibleDuplicates: true })
  assert.equal(open, false)
  state.selectedIds.value = ['student-0', 'student-1']
  await state.openDialog('assign')
  state.assignmentClassIds.value = ['science', 'math']
  const beforeAssign = posts.length
  await state.saveAssignments()
  assert.equal(posts.length, beforeAssign, 'Bulk replacement needs confirmation')
  state.assignmentConfirmed.value = true
  await state.saveAssignments()
  assert.deepEqual(posts.find(call => call.url.endsWith('/assign')).body, { registryIds: ['student-0', 'student-1'], subjectIds: ['science', 'math'] })
  assert.equal(rows[0].assignments.length, 2)
  assert.equal(rows[1].assignments.length, 2)
  state.selectedIds.value = ['student-0']
  await state.openDialog('assign')
  assert.equal(state.assignmentClassIds.value.length, 2)
  state.assignmentClassIds.value = []
  assert.equal(state.requiresAssignmentConfirmation.value, true)
  state.assignmentConfirmed.value = true
  await state.saveAssignments()
  assert.equal(rows[0].assignments.length, 0)
  await state.openDialog('revoke', rows[1])
  await state.confirmAction()
  assert.equal(rows[1].status, 'revoked')
  await state.openDialog('code', rows[1])
  await state.confirmAction()
  assert.equal(rows[1].registrationCode, 'NEW-CODE')
  await state.copyCode(rows[1])
  assert.equal(copies.at(-1), 'NEW-CODE')
  const registered = rows[0]
  await state.openDialog('code', registered)
  const beforeInvalidCode = posts.length
  await state.confirmAction()
  assert.equal(posts.length, beforeInvalidCode, 'Registered codes cannot be reissued')
  state.closeDialog()
  await state.copyRegistrationLink()
  assert.equal(copies.at(-1), registrationLink.url)
  denied = true
  await state.copyRegistrationLink()
  assert.equal(selected, true)
  assert.equal(state.notice.type, 'warning')
  await state.openDialog('link')
  await state.confirmAction()
  assert.ok(registrationLink.url.endsWith('rotated-link'))
  state.filters.search = 'Student'
  state.filters.status = 'pending'
  state.filters.unassigned = true
  await vue.nextTick()
  await state.loadRegistry({ force: true })
  assert.deepEqual(gets.at(-1).params, { search: 'Student', status: 'pending', unassigned: true })
  await state.downloadWorkbook('export')
  assert.deepEqual(gets.at(-1).params, { search: 'Student', status: 'pending', unassigned: true })
  assert.equal(downloads.at(-1), 'edumatch-student-registry.xlsx')
  await state.downloadWorkbook('template')
  assert.equal(downloads.at(-1), 'student-import-template.xlsx')
  hooks.unmount()
  assert.equal(open, false)
  console.log(JSON.stringify({ passed: true, checks: ['school summary', 'pagination and selection', 'missing/duplicate preview', 'similar-name acknowledgement', 'valid-only canonical import', 'pending and registered multi-class replacement', 'confirmed clear assignments', 'revoke/reissue unused code', 'registered code protected', 'copy/manual fallback', 'explicit school link rotation', 'matching list/export filters', 'Excel downloads', 'cleanup'], httpRequests: 0 }))
}
run().catch(error => { console.error(error.stack); process.exitCode = 1 })
