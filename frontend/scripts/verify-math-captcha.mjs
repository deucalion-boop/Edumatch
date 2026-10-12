/** Local CAPTCHA UI checks using the real math service and synthetic authentication. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { chromium, expect } from '@playwright/test'

const require = createRequire(import.meta.url)
const { createMathCaptchaService, createMemoryCaptchaStore } = require('../../backend/services/mathCaptchaService.js')
const origin = process.env.CAPTCHA_UI_BASE_URL || 'http://127.0.0.1:5189'
const output = fileURLToPath(new URL('../.tailwind-migration/math-captcha/', import.meta.url))
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CAPTCHA_BROWSER_CHANNEL ? { channel: process.env.CAPTCHA_BROWSER_CHANNEL } : {}) })
const report = { isolation: 'Local Vue UI, real in-memory CAPTCHA service, synthetic login/OTP. No database, emails or external network.', cases: [] }

try {
  for (const width of [320, 390, 1366]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' })
    const page = await context.newPage()
    let serverTimeOffset = 0
    let operation = 0
    let challengeCount = 0
    let loginCount = 0
    let failNextChallenge = false
    let shortenNextChallenge = false
    let challengeId = ''
    const errors = []
    const googleRequests = []
    const service = createMathCaptchaService({
      store: createMemoryCaptchaStore(), environment: 'test', now: () => Date.now() + serverTimeOffset,
      randomInt: (min) => min === 0 ? operation : 8,
    })
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (request) => {
      if (/google\.com\/recaptcha|gstatic\.com\/recaptcha|recaptcha\.google\.com/i.test(request.url())) googleRequests.push(request.url())
    })
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.origin !== origin) return route.abort()
      if (!url.pathname.startsWith('/api/')) return route.continue()
      const body = route.request().postDataJSON() || {}
      const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
      try {
        if (url.pathname.endsWith('/auth/captcha/challenge')) {
          challengeCount++
          if (failNextChallenge) {
            failNextChallenge = false
            return json({ success: false, message: 'CAPTCHA is unavailable. Please try again.' }, 503)
          }
          const data = await service.createChallenge(body)
          challengeId = data.challengeId
          if (shortenNextChallenge) {
            shortenNextChallenge = false
            data.expiresAt = new Date(Date.now() + 1500).toISOString()
          }
          return json({ success: true, data })
        }
        if (url.pathname.endsWith('/auth/captcha/verify')) return json({ success: true, data: await service.verifyChallenge(body) })
        if (url.pathname.endsWith('/auth/login')) {
          await service.consumeToken(body.captchaToken)
          loginCount++
          if (body.username === 'otp.fixture') return json({
            success: true, requiresOtp: true, challengeToken: 'synthetic-otp-challenge', deliveryHint: 'the test inbox',
            expiresAt: new Date(Date.now() + 120000).toISOString(), resendAvailableAt: new Date(Date.now() + 30000).toISOString(),
          })
          return json({ success: false, message: 'Invalid username or password' }, 401)
        }
        if (url.pathname.includes('/auth/invite/')) return json({ success: true, email: 'fixture@example.invalid', role: 'student' })
        return json({ success: true, data: {}, user: null, notifications: [] })
      } catch (error) {
        if (error.name !== 'MathCaptchaError') throw error
        return json({ success: false, message: error.message, code: error.code, data: error.data }, error.statusCode)
      }
    })

    await page.goto(`${origin}/auth/login`)
    const answer = page.getByRole('textbox', { name: 'Math CAPTCHA answer', exact: true })
    const verify = page.getByRole('button', { name: 'Verify', exact: true })
    const refresh = page.getByRole('button', { name: 'Refresh math question', exact: true })
    const status = page.getByRole('status')
    await expect(answer).toBeEnabled()
    await page.getByRole('textbox', { name: 'Username', exact: true }).fill('test.fixture')
    await page.getByLabel('Password', { exact: true }).fill('TestPass123')

    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    assert.equal(loginCount, 0, 'Empty answer cannot submit login')
    await verify.click()
    await expect(status).toContainText('Enter the answer')
    for (let attempt = 0; attempt < 3; attempt++) {
      await answer.fill('1')
      await verify.click()
      await expect(status).toContainText(attempt < 2 ? 'Incorrect answer' : 'Too many incorrect answers')
    }
    await expect(answer).toHaveValue('')
    await answer.fill('16')
    await verify.click()
    await expect(status).toContainText('Answer verified')
    const verifiedProofChallenge = challengeId
    await refresh.click()
    await expect(answer).toBeEnabled()
    assert.notEqual(challengeId, verifiedProofChallenge)
    await expect(answer).toHaveValue('')

    operation = 1
    await refresh.click()
    await expect(page.locator('.math-captcha-question')).toHaveText('8 − 8 = ?')
    await answer.fill('0')
    await verify.click()
    await expect(status).toContainText('Answer verified')
    await page.screenshot({ path: `${output}/verified-${width}.png`, fullPage: true })

    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page.getByText('Invalid username or password', { exact: true })).toBeVisible()
    await expect(answer).toBeEnabled()
    await expect(answer).toHaveValue('')
    assert.equal(loginCount, 1, 'Verified proof reaches the existing login request')

    serverTimeOffset = 300001
    await answer.fill('0')
    await verify.click()
    await expect(status).toContainText('expired or already been used')
    await expect(answer).toHaveValue('')
    serverTimeOffset = 0
    await refresh.click()
    await expect(answer).toBeEnabled()

    shortenNextChallenge = true
    await refresh.click()
    await expect(status).toContainText('The question expired. Solve the new question.', { timeout: 10000 })
    await expect(answer).toBeEnabled()

    failNextChallenge = true
    await refresh.click()
    await expect(status).toContainText('CAPTCHA is unavailable')
    await expect(answer).toBeDisabled()
    await refresh.click()
    await expect(answer).toBeEnabled()

    await page.getByRole('textbox', { name: 'Username', exact: true }).fill('otp.fixture')
    await answer.fill('0')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page.getByLabel('Verify OTP', { exact: true })).toBeVisible()
    await expect(answer).toHaveCount(0)
    await page.getByRole('button', { name: 'Back to sign in', exact: true }).click()
    await expect(answer).toBeEnabled()
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')

    const layout = await page.locator('.math-captcha').evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return {
        width: bounds.width, left: bounds.left, right: bounds.right,
        documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth,
        controls: [...element.querySelectorAll('button,input')].map((control) => {
          const rect = control.getBoundingClientRect()
          return { left: rect.left, right: rect.right, height: rect.height }
        }),
        googleElements: document.querySelectorAll('script[src*="recaptcha"],iframe[src*="recaptcha"]').length,
      }
    })
    assert(layout.left >= 0 && layout.right <= width + 1, 'Widget fits the viewport')
    assert(layout.documentWidth <= width + 1, 'Page has no horizontal overflow')
    for (const control of layout.controls) {
      assert(control.left >= layout.left && control.right <= layout.right + 1, 'Controls fit the widget')
      assert(control.height >= 44, 'Controls remain touch accessible')
    }
    assert.equal(layout.googleElements, 0)
    assert.deepEqual(googleRequests, [])
    assert.deepEqual(errors, [])
    await page.screenshot({ path: `${output}/login-${width}.png`, fullPage: true })
    const beforeUnprotectedPages = challengeCount
    await page.goto(`${origin}/auth/forgot-password`)
    await expect(answer).toHaveCount(0)
    await page.goto(`${origin}/auth/invite/synthetic-token`)
    await expect(answer).toHaveCount(0)
    assert.equal(challengeCount, beforeUnprotectedPages, 'Forgot-password and invite flows do not acquire CAPTCHA')
    report.cases.push({ width, passed: true, challengeCount, loginCount, layout })
    console.log(`CAPTCHA UI ${width}px: addition, subtraction, empty/wrong answer, refresh, expiry, network recovery, login reset, OTP, layout and no Google requests passed.`)
    await context.close()
  }
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
