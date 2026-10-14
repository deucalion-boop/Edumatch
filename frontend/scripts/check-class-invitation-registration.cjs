/* Public registration smoke checks. API responses are intercepted; no accounts are created. */
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium, expect } = require('@playwright/test')

const baseUrl = process.env.INVITATION_UI_URL || 'http://127.0.0.1:5173'
const artifactDirectory = path.resolve(__dirname, '../../.qa/class-invitations')
const invitation = { className: 'Araling Panlipunan 10', expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'active' }
const student = { fullName: 'Sarah Reyes', section: 'Charity' }
const results = []

function jsonResponse(route, status, data) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
}

async function openScenario(browser, token, options = {}) {
  const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1280, height: 960 }, serviceWorkers: 'block' })
  const page = await context.newPage()
  const requestLog = { verify: [], register: [], usernames: [], usernameReplies: [], invitation: 0 }
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const marker = `/auth/class-invitations/${token}`
    if (!url.pathname.includes(marker)) return route.continue()
    const suffix = url.pathname.slice(url.pathname.indexOf(marker) + marker.length)
    if (suffix === '' && request.method() === 'GET') {
      requestLog.invitation += 1
      const reply = options.invitation ? await options.invitation(requestLog.invitation) : { status: 200, data: { invitation } }
      return jsonResponse(route, reply.status, reply.data)
    }
    if (suffix === '/verify') {
      const body = request.postDataJSON()
      requestLog.verify.push(body)
      const reply = options.verify ? await options.verify(body, requestLog.verify.length) : { status: 200, data: { student } }
      return jsonResponse(route, reply.status, reply.data)
    }
    if (suffix === '/username') {
      const username = url.searchParams.get('username')
      requestLog.usernames.push(username)
      const reply = options.username ? await options.username(username, requestLog.usernames.length) : {
        status: 200,
        data: username.toLowerCase() === 'sarah'
          ? { available: false, valid: true, message: 'This username is already taken.', suggestions: ['sarah.reyes', 'sarah_charity'] }
          : { available: true, valid: true, message: 'Username is available.', suggestions: [] },
      }
      try { return await jsonResponse(route, reply.status, reply.data) } catch (error) {
        // A username request is deliberately cancelled when the student edits it.
        if (!request.failure() && !page.isClosed()) throw error
      } finally { requestLog.usernameReplies.push(username) }
      return
    }
    if (suffix === '/register') {
      const body = request.postDataJSON()
      requestLog.register.push(body)
      const reply = options.register ? await options.register(body, requestLog.register.length) : { status: 201, data: { message: 'Registration completed' } }
      return jsonResponse(route, reply.status, reply.data)
    }
    throw new Error(`Unexpected invitation endpoint: ${request.method()} ${url.pathname}`)
  })
  await page.goto(`${baseUrl}/auth/class-register/${token}`)
  await expect(page.getByRole('heading', { name: 'Join your class' })).toBeVisible()
  return { context, page, requestLog, errors }
}

async function verify(page, fullName = student.fullName) {
  await expect(page.getByLabel('Registration code', { exact: true })).toHaveCount(0)
  await page.getByLabel('Full name', { exact: true }).fill(fullName)
  await page.getByRole('button', { name: 'Verify and continue' }).click()
}

async function accountFields(page, username = 'sarah.reyes') {
  await page.getByLabel('Gmail address').fill('sarah.reyes@gmail.com')
  await page.getByLabel('Username', { exact: true }).fill(username)
  await expect(page.getByText('This username is available.', { exact: true })).toBeVisible()
  await page.getByLabel('Password', { exact: true }).fill('Goodpass1')
  await page.getByLabel('Confirm password', { exact: true }).fill('Goodpass1')
}

async function runCase(name, operation) {
  await operation()
  results.push({ name, passed: true })
  process.stdout.write(`PASS ${name}\n`)
}

async function main() {
  await fs.mkdir(artifactDirectory, { recursive: true })
  let browser
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true })
  } catch (error) {
    process.stdout.write(`Chrome launch unavailable; using bundled Chromium: ${error.message.split('\n')[0]}\n`)
    browser = await chromium.launch({ headless: true })
  }
  try {
    await runCase('roster name non-match then match, username suggestions, password validation, and name-only enrollment payload', async () => {
      const scenario = await openScenario(browser, 'smoke-success', {
        verify: body => body.fullName !== student.fullName
          ? { status: 400, data: { code: 'NAME_NOT_FOUND', message: 'Your full name was not found on this class list. Check the spelling with your teacher.' } }
          : { status: 200, data: { student } },
      })
      const { page, requestLog } = scenario
      try {
        await verify(page, 'Sarah Wrong')
        await expect(page.getByRole('alert')).toContainText('not found on this class list')
        await verify(page)
        await expect(page.locator('.verified-student')).toContainText('Sarah Reyes')
        await expect(page.locator('.verified-student')).toContainText('Section Charity')
        await page.getByLabel('Gmail address').fill('sarah.reyes@gmail.com')
        await page.getByLabel('Username', { exact: true }).fill('SaRaH')
        await expect(page.getByText('This username is already taken.', { exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Create account and join class' })).toBeDisabled()
        await page.getByRole('button', { name: 'sarah.reyes', exact: true }).click()
        await expect(page.getByText('This username is available.', { exact: true })).toBeVisible()
        await page.getByLabel('Password', { exact: true }).fill('lowercase1')
        await page.getByLabel('Confirm password', { exact: true }).fill('lowercase1')
        await page.getByRole('button', { name: 'Create account and join class' }).click()
        await expect(page.getByRole('alert')).toContainText('uppercase and lowercase')
        assert.equal(requestLog.register.length, 0, 'Weak password reached the registration API')
        await page.getByLabel('Password', { exact: true }).fill('Goodpass1')
        await page.getByLabel('Confirm password', { exact: true }).fill('Goodpass2')
        await page.getByRole('button', { name: 'Create account and join class' }).click()
        await expect(page.getByRole('alert')).toHaveText('Passwords do not match.')
        assert.equal(requestLog.register.length, 0, 'Mismatched passwords reached the registration API')
        await page.getByLabel('Confirm password', { exact: true }).fill('Goodpass1')
        await page.getByRole('button', { name: 'Create account and join class' }).click()
        await expect(page.getByRole('heading', { name: 'Your account is ready' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Sign in to EduMatch' })).toHaveAttribute('href', '/auth/login')
        assert.deepEqual(requestLog.verify, [{ fullName: 'Sarah Wrong' }, { fullName: 'Sarah Reyes' }])
        assert.deepEqual(requestLog.register, [{ fullName: 'Sarah Reyes', email: 'sarah.reyes@gmail.com', username: 'sarah.reyes', password: 'Goodpass1', confirmPassword: 'Goodpass1' }])
        assert.deepEqual(scenario.errors, [])
      } finally { await scenario.context.close() }
    })

    await runCase('a delayed available response cannot approve the current taken username', async () => {
      let releaseOld
      const oldResponse = new Promise(resolve => { releaseOld = resolve })
      const scenario = await openScenario(browser, 'smoke-stale', {
        username: async username => {
          if (username === 'old.available') await oldResponse
          return { status: 200, data: { valid: true, available: username !== 'current.taken', message: username === 'current.taken' ? 'This username is already taken.' : 'Username available', suggestions: [] } }
        },
      })
      try {
        await verify(scenario.page)
        const input = scenario.page.getByLabel('Username', { exact: true })
        await input.fill('old.available')
        await expect.poll(() => scenario.requestLog.usernames.includes('old.available')).toBe(true)
        await input.fill('current.taken')
        await expect(scenario.page.getByText('This username is already taken.', { exact: true })).toBeVisible()
        releaseOld()
        await expect.poll(() => scenario.requestLog.usernameReplies.includes('old.available')).toBe(true)
        await expect(scenario.page.getByRole('button', { name: 'Create account and join class' })).toBeDisabled()
        await expect(scenario.page.getByText('This username is available.', { exact: true })).toHaveCount(0)
        assert.equal(scenario.requestLog.register.length, 0)
        assert.deepEqual(scenario.errors, [])
      } finally { releaseOld(); await scenario.context.close() }
    })

    await runCase('editing verified identity requires fresh verification and username checking', async () => {
      const scenario = await openScenario(browser, 'smoke-identity-change', {
        verify: body => ({ status: 200, data: { student: { ...student, fullName: body.fullName } } }),
      })
      try {
        await verify(scenario.page)
        await accountFields(scenario.page)
        await scenario.page.getByRole('button', { name: 'Change', exact: true }).click()
        await expect(scenario.page.getByLabel('Full name', { exact: true })).toBeVisible()
        await expect(scenario.page.getByRole('button', { name: 'Create account and join class' })).toHaveCount(0)
        await scenario.page.getByLabel('Full name', { exact: true }).fill('Jose Santos')
        await scenario.page.getByRole('button', { name: 'Verify and continue' }).click()
        await expect(scenario.page.getByText('This username is available.', { exact: true })).toBeVisible()
        assert.equal(scenario.requestLog.verify.length, 2)
        assert.deepEqual(scenario.requestLog.verify[1], { fullName: 'Jose Santos' })
        await expect(scenario.page.locator('.verified-student')).toContainText('Jose Santos')
        await expect(scenario.page.getByLabel('Password', { exact: true })).toHaveValue('')
      } finally { await scenario.context.close() }
    })

    await runCase('expired invitations and already registered names provide sign-in, reset, and teacher help', async () => {
      const expired = await openScenario(browser, 'smoke-expired', { invitation: () => ({ status: 410, data: { message: 'This invitation has expired. Ask your teacher to renew it.' } }) })
      try {
        await expect(expired.page.getByRole('heading', { name: 'Invitation unavailable' })).toBeVisible()
        await expect(expired.page.getByRole('alert')).toContainText('expired')
        await expect(expired.page.getByLabel('Registration code', { exact: true })).toHaveCount(0)
      } finally { await expired.context.close() }
      const registered = await openScenario(browser, 'smoke-already-registered', {
        verify: body => body.fullName === student.fullName
          ? { status: 409, data: { code: 'STUDENT_REGISTERED', message: 'This student is already registered. Sign in to your existing account.' } }
          : { status: 200, data: { student: { ...student, fullName: body.fullName } } },
      })
      try {
        await verify(registered.page)
        await expect(registered.page.getByRole('alert')).toContainText('already registered')
        await expect(registered.page.getByRole('link', { name: 'Sign in to your account' })).toHaveAttribute('href', '/auth/login')
        await expect(registered.page.getByRole('link', { name: 'Reset your password' })).toHaveAttribute('href', '/auth/forgot-password')
        await expect(registered.page.getByText('Ask your teacher for help if you have not created an account.')).toBeVisible()
        await expect(registered.page.getByRole('button', { name: 'Verify and continue' })).toBeEnabled()
        await verify(registered.page, 'Jose Santos')
        await expect(registered.page.locator('.verified-student')).toContainText('Jose Santos')
        await expect(registered.page.getByRole('link', { name: 'Reset your password' })).toHaveCount(0)
      } finally { await registered.context.close() }
    })

    await runCase('invalid roster names can be corrected without fuzzy matching', async () => {
      const scenario = await openScenario(browser, 'smoke-name-validation', {
        verify: body => body.fullName === '.'
          ? { status: 400, data: { code: 'NAME_INVALID', message: 'Enter your first and last names together as listed by your teacher.' } }
          : { status: 200, data: { student } },
      })
      try {
        await verify(scenario.page, '.')
        await expect(scenario.page.getByRole('alert')).toContainText('first and last names together')
        await verify(scenario.page)
        await expect(scenario.page.locator('.verified-student')).toContainText('Sarah Reyes')
        assert.equal(scenario.requestLog.register.length, 0)
      } finally { await scenario.context.close() }
    })

    await runCase('registration race for a claimed roster name prevents repeat submission', async () => {
      const scenario = await openScenario(browser, 'smoke-registration-conflict', {
        register: () => ({ status: 409, data: { code: 'STUDENT_REGISTERED', message: 'This student is already registered. Sign in to your existing account.' } }),
      })
      try {
        await verify(scenario.page)
        await accountFields(scenario.page)
        await scenario.page.getByRole('button', { name: 'Create account and join class' }).click()
        await expect(scenario.page.getByRole('alert')).toContainText('already registered')
        await expect(scenario.page.getByRole('button', { name: 'Create account and join class' })).toBeDisabled()
        await expect(scenario.page.getByRole('link', { name: 'Reset your password' })).toBeVisible()
        assert.equal(scenario.requestLog.register.length, 1)
      } finally { await scenario.context.close() }
    })

    await runCase('invitation retrieval and account creation can recover from temporary failures', async () => {
      const scenario = await openScenario(browser, 'smoke-retry', {
        invitation: count => count === 1 ? { status: 503, data: { message: 'Temporarily unavailable. Please retry.' } } : { status: 200, data: { invitation } },
        register: (_body, count) => count === 1 ? { status: 503, data: { message: 'Registration temporarily unavailable. Please retry.' } } : { status: 201, data: { message: 'Registration completed' } },
      })
      try {
        await expect(scenario.page.getByRole('heading', { name: 'Unable to open invitation' })).toBeVisible()
        await scenario.page.getByRole('button', { name: 'Try again' }).click()
        await verify(scenario.page)
        await accountFields(scenario.page)
        await scenario.page.getByRole('button', { name: 'Create account and join class' }).click()
        await expect(scenario.page.getByRole('alert')).toContainText('temporarily unavailable')
        await scenario.page.getByRole('button', { name: 'Create account and join class' }).click()
        await expect(scenario.page.getByRole('heading', { name: 'Your account is ready' })).toBeVisible()
        assert.equal(scenario.requestLog.invitation, 2)
        assert.equal(scenario.requestLog.register.length, 2)
      } finally { await scenario.context.close() }
    })

    await runCase('390px mobile registration stays within viewport in both steps', async () => {
      const scenario = await openScenario(browser, 'smoke-mobile', { mobile: true })
      try {
        await expect(scenario.page.getByLabel('Full name', { exact: true })).toBeVisible()
        await expect(scenario.page.getByLabel('Registration code', { exact: true })).toHaveCount(0)
        assert.equal(await scenario.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'Verification overflows mobile viewport')
        await scenario.page.screenshot({ path: path.join(artifactDirectory, 'student-verify-mobile.png'), fullPage: true })
        await verify(scenario.page)
        await accountFields(scenario.page)
        assert.equal(await scenario.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'Account form overflows mobile viewport')
        await scenario.page.screenshot({ path: path.join(artifactDirectory, 'student-account-mobile.png'), fullPage: true })
        assert.deepEqual(scenario.errors, [])
      } finally { await scenario.context.close() }
    })
    await fs.writeFile(path.join(artifactDirectory, 'public-registration-results.json'), JSON.stringify({ baseUrl, results }, null, 2))
    process.stdout.write(`${results.length} public registration smoke scenarios passed. Screenshots: ${artifactDirectory}\n`)
  } finally { await browser.close() }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
