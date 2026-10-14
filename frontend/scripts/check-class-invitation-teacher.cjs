/* Teacher invitation smoke checks. Every API call is intercepted; no school data is modified. */
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium, expect } = require('@playwright/test')

const baseUrl = process.env.INVITATION_UI_URL || 'http://127.0.0.1:5173'
const artifactDirectory = path.resolve(__dirname, '../../.qa/class-invitations')
const results = []
const teacher = { id: 'teacher-smoke', name: 'Belle Hesi', role: 'teacher', subject: 'Araling Panlipunan', advisorySectionId: 'section-charity', advisorySection: { id: 'section-charity', name: 'Charity' }, hasCompletedTeacherTour: true }
const subjects = [
  { id: 'class-one', name: 'Araling Panlipunan', className: 'Araling Panlipunan 10', code: 'ARA-SMOKE', approvedStudentsCount: 1, lessonCount: 1, assessmentCount: 2 },
  { id: 'class-two', name: 'Araling Panlipunan', className: 'Grade 10 - Section B', code: 'ARA-CLASS2', approvedStudentsCount: 0, lessonCount: 0, assessmentCount: 1 },
]
const originalStudent = { id: 'student-one', name: 'Eric Cruz', email: 'eric@gmail.com', sectionName: 'Charity', progress: 20, averageScore: 20, completedChallenges: 2, totalChallenges: 3, status: 'active', subjects: [subjects[0]] }
const preview = { records: [
  { rowNumber: 2, fullName: 'Sarah Reyes', section: 'Charity', status: 'valid', errors: [] },
  { rowNumber: 3, fullName: 'Sarah Reyes', section: 'Charity', status: 'invalid', errors: ['This student name appears more than once in this spreadsheet.'] },
], validCount: 1, invalidCount: 1 }
const file = { name: 'student-roster.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('API-intercepted workbook fixture') }

const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
function newInvitation() {
  return { id: 'invitation-one', subjectId: 'class-one', className: subjects[0].className, invitationUrl: `${baseUrl}/auth/class-register/private-smoke-token`, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'active', registeredCount: 1, unregisteredCount: 1, totalCount: 2, students: [
    { id: 'entry-one', fullName: 'Eric Cruz', section: 'Charity', status: 'registered', studentId: 'student-one', registrationCode: 'USED-CODE' },
    { id: 'entry-two', fullName: 'Sarah Reyes', section: 'Charity', status: 'unregistered', studentId: null, registrationCode: 'ABCD-EFGH-JKLM' },
  ] }
}
async function openScenario(browser, options = {}) {
  const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, serviceWorkers: 'block', acceptDownloads: true })
  await context.addInitScript(user => {
    localStorage.setItem('edumatch_auth_token', 'intercepted-teacher-smoke-token')
    localStorage.setItem('edumatch_auth_user', JSON.stringify(user))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copiedInvitationLink = value } } })
  }, teacher)
  const page = await context.newPage()
  await page.clock.install()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const state = { invitation: options.invitation || null, students: [originalStudent], requests: [{ id: 'request-one', studentId: 'request-student', name: 'Pending Learner', email: 'pending@gmail.com', sectionName: 'Hope', subjectId: 'class-one', className: subjects[0].className, subjectCode: 'ARA-SMOKE', requestedAt: '2026-10-14T07:00:00Z' }], invitationFetches: 0, previewCalls: 0, create: [], renew: [], export: 0, failPreview: false, allInvalid: false }
  await page.route('**/api/**', async route => {
    const request = route.request()
    const endpoint = new URL(request.url()).pathname.replace(/^.*\/api/, '')
    if (endpoint === '/teacher/profile') return json(route, 200, { user: teacher })
    if (endpoint === '/teacher/sections') return json(route, 200, { advisorySection: teacher.advisorySection })
    if (endpoint === '/teacher/subjects') return json(route, 200, { subjects: subjects.map(subject => subject.id === 'class-one' ? { ...subject, approvedStudentsCount: state.students.length } : subject) })
    if (endpoint === '/teacher/students' && request.method() === 'GET') return json(route, 200, { students: state.students })
    if (endpoint === '/teacher/enrollment-requests') return json(route, 200, { requests: state.requests })
    if (endpoint === '/teacher/class-invitations/preview') {
      state.previewCalls += 1
      if (state.failPreview) return json(route, 400, { message: 'Unable to read this Excel workbook. Save it as .xlsx and try again.' })
      return json(route, 200, state.allInvalid ? { records: preview.records.map(record => ({ ...record, status: 'invalid', errors: ['Duplicate name in this spreadsheet.'] })), validCount: 0, invalidCount: 2 } : preview)
    }
    if (endpoint === '/teacher/class-invitations' && request.method() === 'POST') {
      state.create.push(request.postDataJSON())
      state.invitation = newInvitation()
      return json(route, 201, { invitation: state.invitation })
    }
    if (endpoint === '/teacher/class-invitations') { state.invitationFetches += 1; return json(route, 200, { invitations: state.invitation ? [state.invitation] : [] }) }
    if (endpoint === '/teacher/class-invitations/invitation-one/renew') {
      state.renew.push(request.postDataJSON())
      state.invitation = { ...state.invitation, status: 'active', expiresAt: new Date(Date.now() + state.renew[state.renew.length - 1].expiresInDays * 86400000).toISOString() }
      return json(route, 200, { invitation: state.invitation })
    }
    if (endpoint === '/teacher/class-invitations/invitation-one/codes') { state.export += 1; return route.fulfill({ status: 200, contentType: file.mimeType, body: Buffer.from('intercepted registration-code export') }) }
    if (endpoint === '/notifications') return json(route, 200, { notifications: [] })
    // Presence and public configuration are also intercepted to prevent live account access.
    return json(route, 200, {})
  })
  await page.goto(`${baseUrl}/teacher/students`)
  await expect(page.getByRole('heading', { name: 'Class Management', exact: true })).toBeVisible()
  await expect(page.locator('.subject-management-card')).toHaveCount(2)
  await expect(page.locator('.class-list-table tbody')).toContainText('Eric Cruz')
  return { context, page, state, errors }
}
async function openUpload(page) {
  await page.getByRole('button', { name: 'Invite Student', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Invite Students' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Choose a class').selectOption('class-one')
  await dialog.locator('input[type="file"]').setInputFiles(file)
  await dialog.getByRole('button', { name: 'Preview students' }).click()
  return dialog
}
async function runCase(name, operation) {
  if (process.env.SMOKE_CASE && !name.toLowerCase().includes(process.env.SMOKE_CASE.toLowerCase())) return
  await operation(); results.push({ name, passed: true }); process.stdout.write(`PASS ${name}\n`)
}

async function main() {
  await fs.mkdir(artifactDirectory, { recursive: true })
  let browser
  try { browser = await chromium.launch({ channel: 'chrome', headless: true }) }
  catch { browser = await chromium.launch({ headless: true }) }
  try {
    await runCase('Excel review requires explicit invalid-row exclusion; generate/share/export preserves selected class', async () => {
      const scenario = await openScenario(browser)
      const { page, state } = scenario
      try {
        const dialog = await openUpload(page)
        await expect(dialog.getByText('This student name appears more than once in this spreadsheet.')).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Generate 1 registration codes' })).toBeDisabled()
        await dialog.getByRole('checkbox').check()
        await dialog.getByRole('button', { name: 'Generate 1 registration codes' }).click()
        await expect(dialog.getByText('Your class invitation and private student codes are ready.')).toBeVisible()
        assert.deepEqual(state.create, [{ subjectId: 'class-one', records: [{ fullName: 'Sarah Reyes', section: 'Charity' }], expiresInDays: 30 }])
        await dialog.getByRole('button', { name: 'Copy link', exact: true }).click()
        assert.equal(await page.evaluate(() => window.__copiedInvitationLink), state.invitation.invitationUrl)
        const downloaded = page.waitForEvent('download')
        await dialog.getByRole('button', { name: 'Export codes' }).click()
        assert.equal((await downloaded).suggestedFilename(), 'Araling-Panlipunan-10-registration-codes.xlsx')
        assert.equal(state.export, 1)
        await page.screenshot({ path: path.join(artifactDirectory, 'teacher-invitation-share-desktop.png'), fullPage: true })
        await dialog.getByRole('button', { name: 'Done', exact: true }).click()
        await expect(page.locator('.class-invitation-summary')).toContainText('1 registered')
        await expect(page.locator('.class-invitation-summary')).toContainText('1 unregistered')
        await expect(page.locator('.invitation-queue-summary')).toContainText('1 registered · 1 unregistered')
        await expect(page.locator('.class-list-table tbody tr')).toHaveCount(2)
        await expect(page.locator('.class-list-table tbody')).toContainText('Unregistered')
        await page.getByLabel('Search students', { exact: true }).fill('Sarah')
        await expect(page.locator('.class-list-table tbody tr')).toHaveCount(1)
        await expect(page.locator('.class-list-table tbody')).toContainText('Sarah Reyes')
        await page.getByLabel('Search students', { exact: true }).fill('')
        await page.getByLabel('Filter by enrollment status').selectOption('registered')
        await expect(page.locator('.class-list-table tbody')).toContainText('Eric Cruz')
        await expect(page.locator('.class-list-table tbody')).not.toContainText('Sarah Reyes')
        await page.getByLabel('Filter by enrollment status').selectOption('unregistered')
        await expect(page.locator('.class-list-table tbody')).toContainText('Sarah Reyes')
        await page.getByLabel('Filter by class').selectOption('class-two')
        await expect(page.locator('.class-list-table tbody')).toContainText('No students match your search or filters')
        await page.getByLabel('Filter by class').selectOption('')
        await page.getByLabel('Filter by enrollment status').selectOption('')
        await page.screenshot({ path: path.join(artifactDirectory, 'teacher-enrollment-desktop.png'), fullPage: true })
        assert.deepEqual(scenario.errors, [])
      } finally { await scenario.context.close() }
    })
    await runCase('corrupt and all-invalid files recover; changing class invalidates preview', async () => {
      const scenario = await openScenario(browser)
      try {
        scenario.state.failPreview = true
        const dialog = await openUpload(scenario.page)
        await expect(dialog.getByRole('alert')).toContainText('Unable to read this Excel workbook')
        scenario.state.failPreview = false
        scenario.state.allInvalid = true
        await dialog.getByRole('button', { name: 'Preview students' }).click()
        await expect(dialog.getByText('No valid students are available. Correct the spreadsheet and upload it again.')).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Generate 0 registration codes' })).toBeDisabled()
        assert.equal(scenario.state.create.length, 0)
        await dialog.getByLabel('Choose a class').selectOption('class-two')
        await expect(dialog.getByRole('button', { name: 'Preview students' })).toBeVisible()
        await expect(dialog.locator('.invitation-table-wrap')).toHaveCount(0)
        await scenario.page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
        await expect(scenario.page.getByRole('button', { name: 'Invite Student', exact: true })).toBeFocused()
        assert.deepEqual(scenario.errors, [])
      } finally { await scenario.context.close() }
    })
    await runCase('expired invitation renewal retains codes and share link; individual account flow remains reachable', async () => {
      const expired = { ...newInvitation(), expiresAt: '2020-01-01T00:00:00Z', status: 'expired' }
      const scenario = await openScenario(browser, { invitation: expired })
      try {
        await scenario.page.getByRole('button', { name: 'View invitation', exact: true }).click()
        const dialog = scenario.page.getByRole('dialog', { name: 'Invite Students' })
        await expect(dialog.getByRole('button', { name: 'Copy link', exact: true })).toBeDisabled()
        await dialog.getByLabel('Renew invitation for').selectOption('7')
        await dialog.getByRole('button', { name: 'Renew invitation', exact: true }).click()
        await expect(dialog.getByText('Invitation renewed. Unregistered students can use their existing codes.')).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Copy link', exact: true })).toBeEnabled()
        assert.deepEqual(scenario.state.renew, [{ expiresInDays: 7 }])
        assert.equal(scenario.state.invitation.students[1].registrationCode, expired.students[1].registrationCode)
        assert.equal(scenario.state.invitation.invitationUrl, expired.invitationUrl)
        await dialog.getByRole('button', { name: 'Done', exact: true }).click()
        await scenario.page.getByRole('button', { name: 'Invite Student', exact: true }).click()
        await scenario.page.getByRole('button', { name: 'Create an individual student account instead' }).click()
        await expect(scenario.page.getByRole('heading', { name: 'Create Student Account' })).toBeVisible()
        await expect(scenario.page.getByRole('button', { name: 'Create Student & Email Credentials' })).toBeVisible()
        assert.deepEqual(scenario.errors, [])
      } finally { await scenario.context.close() }
    })
    await runCase('visible polling refreshes enrolled roster and pending requests; hidden polling is paused', async () => {
      const scenario = await openScenario(browser, { invitation: newInvitation() })
      try {
        const beforeFetches = scenario.state.invitationFetches
        scenario.state.invitation.students[1] = { ...scenario.state.invitation.students[1], status: 'registered', studentId: 'student-two' }
        scenario.state.invitation.registeredCount = 2
        scenario.state.invitation.unregisteredCount = 0
        scenario.state.students.push({ ...originalStudent, id: 'student-two', name: 'Sarah Reyes', email: 'sarah@gmail.com', progress: 0 })
        await scenario.page.clock.fastForward(31000)
        await expect(scenario.page.locator('.class-invitation-summary')).toContainText('2 registered')
        await expect(scenario.page.locator('.class-list-table tbody tr')).toHaveCount(2)
        await expect(scenario.page.locator('.class-list-table tbody')).toContainText('sarah@gmail.com')
        assert.ok(scenario.state.invitationFetches > beforeFetches)
        scenario.state.requests = []
        await scenario.page.clock.fastForward(31000)
        await expect(scenario.page.getByText("You're all caught up", { exact: true })).toBeVisible()
        const hiddenBefore = scenario.state.invitationFetches
        await scenario.page.evaluate(() => Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }))
        await scenario.page.clock.fastForward(61000)
        assert.equal(scenario.state.invitationFetches, hiddenBefore, 'Hidden tab polled invitation API')
        assert.deepEqual(scenario.errors, [])
      } finally { await scenario.context.close() }
    })
    await runCase('390px mobile upload, preview and share dialog fit viewport and trap keyboard focus', async () => {
      const scenario = await openScenario(browser, { mobile: true })
      try {
        const dialog = await openUpload(scenario.page)
        await expect(dialog.getByRole('checkbox')).toBeVisible()
        assert.equal(await scenario.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'Preview overflows mobile viewport')
        await scenario.page.screenshot({ path: path.join(artifactDirectory, 'teacher-invitation-preview-mobile.png'), fullPage: true })
        await dialog.getByRole('checkbox').check()
        await dialog.getByRole('button', { name: 'Generate 1 registration codes' }).click()
        await expect(dialog.getByRole('button', { name: 'Done', exact: true })).toBeVisible()
        assert.equal(await scenario.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'Share overflows mobile viewport')
        await dialog.getByRole('button', { name: 'Done', exact: true }).focus()
        await scenario.page.keyboard.press('Tab')
        await expect(dialog.getByRole('button', { name: 'Close invitation workflow' })).toBeFocused()
        await scenario.page.screenshot({ path: path.join(artifactDirectory, 'teacher-invitation-share-mobile.png'), fullPage: true })
        assert.deepEqual(scenario.errors, [])
      } finally { await scenario.context.close() }
    })
    await fs.writeFile(path.join(artifactDirectory, 'teacher-invitation-results.json'), JSON.stringify({ baseUrl, results }, null, 2))
    process.stdout.write(`${results.length} teacher invitation smoke scenarios passed. Screenshots: ${artifactDirectory}\n`)
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
