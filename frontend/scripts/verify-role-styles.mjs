/** Production-only role CSS and service-worker integration check. No live API. */
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { preview } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, '.tailwind-migration/role-styles')
const report = { passed: false, startedAt: new Date().toISOString(), checks: [], requests: [], pageErrors: [], failedResources: [] }
const roles = ['teacher', 'secretary', 'headteacher']
let currentRole = 'teacher'
let browser
let context
let server
let activePage

function user(role = currentRole) {
  return {
    id: '000000000000000000000001', _id: '000000000000000000000001',
    role, name: 'Synthetic Style Test', firstName: 'Synthetic', lastName: 'Style Test',
    email: 'role-styles@example.invalid', profile: {}, profileImage: '',
    gradeLevel: 'Grade 11', section: 'Test Section', strand: 'STEM',
    forcePasswordChange: false, hasCompletedStudentTour: true, hasCompletedTeacherTour: true,
  }
}

function fixture() {
  return {
    success: true, valid: true, user: user(), profile: user(),
    settings: { appearance: { theme: 'light', textSize: 'normal', highContrast: false, reduceMotion: true } },
    data: [], users: [], students: [], teachers: [], subjects: [], lessons: [], assessments: [],
    activities: [], submissions: [], notifications: [], announcements: [], requests: [], logs: [],
    records: [], attendance: [], sections: [], strands: [], gradeLevels: [], files: [], events: [],
    grades: [], totals: {}, stats: {}, summary: {}, analytics: {}, unreadCount: 0, total: 0,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  }
}

async function inspect(page, expectedRole, label) {
  const expectedId = roles.includes(expectedRole) ? `${expectedRole}-dashboard-css` : null
  await page.waitForFunction(id => {
    const active = [...document.querySelectorAll('link[id$="-dashboard-css"]')]
    if (!id) return active.length === 0
    return active.length === 1 && active[0].id === id && Boolean(active[0].sheet?.cssRules?.length)
  }, expectedId)
  const state = await page.evaluate(() => {
    const active = [...document.querySelectorAll('link[id$="-dashboard-css"]')]
    const preloads = [...document.querySelectorAll('link[rel="preload"][as="style"]')]
    const secretary = document.getElementById('secretary-dashboard-css')
    const secretaryRules = secretary?.sheet ? [...secretary.sheet.cssRules] : []
    return {
      path: location.pathname,
      bodyClasses: [...document.body.classList],
      active: active.map(link => ({ id: link.id, href: new URL(link.href).pathname, rules: link.sheet.cssRules.length })),
      preloads: preloads.map(link => ({ href: new URL(link.href).pathname, active: Boolean(link.sheet) })),
      teacherToken: getComputedStyle(document.documentElement).getPropertyValue('--sidebar-active-bg').trim(),
      headteacherToken: getComputedStyle(document.body).getPropertyValue('--headteacher-bg').trim(),
      secretaryFoundationIndex: secretaryRules.findIndex(rule => rule.selectorText === ':root' && rule.style?.getPropertyValue('--sidebar-active-bg')),
      secretaryOverrideIndex: secretaryRules.findIndex(rule => rule.selectorText?.includes('body.secretary-dashboard .teacher-sidebar') && rule.style?.getPropertyValue('background')),
    }
  })
  assert.deepEqual(state.active.map(link => link.id), expectedId ? [expectedId] : [], `${label}: role link lifecycle`)
  assert.equal(state.preloads.length, 3, `${label}: three role preloads`)
  assert.ok(state.preloads.every(link => !link.active), `${label}: preload unexpectedly activated CSS`)
  if (['teacher', 'secretary'].includes(expectedRole)) assert.ok(state.teacherToken, `${label}: missing teacher foundation`)
  else assert.equal(state.teacherToken, '', `${label}: teacher CSS leaked after removal`)
  if (expectedRole === 'headteacher') assert.ok(state.headteacherToken, `${label}: missing headteacher foundation`)
  else assert.equal(state.headteacherToken, '', `${label}: headteacher CSS leaked after removal`)
  if (expectedRole === 'secretary') {
    assert.ok(state.secretaryFoundationIndex >= 0, 'Secretary must include teacher foundation')
    assert.ok(state.secretaryOverrideIndex > state.secretaryFoundationIndex, 'Secretary overrides must follow teacher foundation')
  }
  report.checks.push({ name: label, passed: true, ...state })
  console.log(`PASS ${label}`)
}

async function navigateRole(page, role) {
  currentRole = role || 'teacher'
  const destination = role ? `/${role}/profile` : '/auth/login'
  // Seed only synthetic auth and use the history event consumed by Vue Router.
  // Keeping the same document verifies removal of the previous role's link.
  await page.evaluate(({ nextUser, destination }) => {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('edumatch_auth_token')
      storage.removeItem('edumatch_auth_user')
    }
    if (nextUser) {
      localStorage.setItem('edumatch_auth_token', 'synthetic-role-styles-token')
      localStorage.setItem('edumatch_auth_user', JSON.stringify(nextUser))
    }
    history.pushState({ ...history.state, current: destination }, '', destination)
    dispatchEvent(new PopStateEvent('popstate', { state: history.state }))
  }, { nextUser: role ? user(role) : null, destination })
  await page.waitForFunction(({ role, destination }) => location.pathname === destination
    && (role ? document.body.classList.contains(`${role}-dashboard`)
      : ![...document.body.classList].some(name => name.endsWith('-dashboard'))), { role, destination })
}

try {
  await mkdir(output, { recursive: true })
  // Freeze this run's built files so another concurrent build cannot replace
  // HTML or hashed assets between service-worker installation and offline use.
  const buildSnapshot = await mkdtemp(path.join(output, 'production-'))
  await cp(path.join(root, 'dist'), buildSnapshot, { recursive: true })
  report.buildSnapshot = path.relative(root, buildSnapshot).replaceAll('\\', '/')
  report.builtAssets = [...(await readFile(path.join(buildSnapshot, 'index.html'), 'utf8')).matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(match => match[1])
  server = await preview({ root, configFile: false, envFile: false, logLevel: 'error',
    build: { outDir: buildSnapshot }, preview: { host: '127.0.0.1', port: 0, strictPort: false } })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const failures = []
  for (const channel of ['msedge', 'chrome']) {
    try {
      browser = await chromium.launch({ channel, headless: true,
        args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'] })
      break
    } catch (error) { failures.push(error.message.split('\n')[0]) }
  }
  assert.ok(browser, `No local browser available: ${failures.join('; ')}`)
  context = await browser.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'allow', reducedMotion: 'reduce' })
  await context.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
      report.requests.push({ method: request.method(), path: url.pathname })
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture()) })
    } else if (url.origin !== origin || url.pathname.startsWith('/uploads/')) await route.abort('blockedbyclient')
    else await route.continue()
  })
  await context.addInitScript(seedUser => {
    localStorage.setItem('edumatch_auth_token', 'synthetic-role-styles-token')
    localStorage.setItem('edumatch_auth_user', JSON.stringify(seedUser))
    localStorage.setItem('edumatch_teacher_theme', 'light')
  }, user())
  const page = await context.newPage()
  activePage = page
  page.on('pageerror', error => report.pageErrors.push({ phase: 'online', message: error.message }))
  page.on('requestfailed', request => report.failedResources.push({ phase: 'online', url: request.url(), type: request.resourceType(), error: request.failure()?.errorText }))
  await page.goto(`${origin}/auth/forgot-password`, { waitUntil: 'load' })
  await page.waitForFunction(() => document.getElementById('app')?.children.length > 0)
  await inspect(page, null, 'online initial: preloads do not activate role CSS')
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 30000 })
  await page.waitForFunction(async () => {
    const hrefs = [...document.querySelectorAll('link[rel="preload"][as="style"]')].map(link => link.href)
    return hrefs.length === 3 && (await Promise.all(hrefs.map(href => caches.match(href)))).every(Boolean)
  }, null, { timeout: 30000 })
  const cached = await page.evaluate(async () => {
    const names = await caches.keys()
    const entries = await Promise.all([...document.querySelectorAll('link[rel="preload"][as="style"]')].map(async link => {
      const response = await caches.match(link.href)
      const css = await response.text()
      return { href: new URL(link.href).pathname, status: response.status, bytes: css.length, compiled: !/@apply\b/.test(css) }
    }))
    return { names, entries }
  })
  assert.ok(cached.entries.every(entry => entry.status === 200 && entry.bytes > 1000 && entry.compiled))
  report.checks.push({ name: 'all role CSS precached before first role visit', passed: true, ...cached })
  for (const role of ['teacher', 'secretary', 'headteacher', 'admin', null]) {
    await navigateRole(page, role)
    await inspect(page, role, `online ${role || 'logout'} lifecycle`)
  }
  await page.screenshot({ path: path.join(output, 'online-logout.png') })

  // A fresh offline document avoids reusing already-attached stylesheet objects.
  await context.setOffline(true)
  const offlinePage = await context.newPage()
  activePage = offlinePage
  const offlineResponses = []
  offlinePage.on('response', response => {
    if (/\/(?:teacher|secretary|headteacher)\.tailwind-.*\.css$/.test(new URL(response.url()).pathname)) {
      offlineResponses.push({ href: new URL(response.url()).pathname, status: response.status(), fromServiceWorker: response.fromServiceWorker() })
    }
  })
  offlinePage.on('pageerror', error => report.pageErrors.push({ phase: 'offline', message: error.message }))
  offlinePage.on('requestfailed', request => report.failedResources.push({ phase: 'offline', url: request.url(), type: request.resourceType(), error: request.failure()?.errorText }))
  await offlinePage.goto(`${origin}/auth/forgot-password`, { waitUntil: 'load' })
  await offlinePage.waitForFunction(() => document.getElementById('app')?.children.length > 0)
  await inspect(offlinePage, null, 'offline initial: cached shell and inactive preloads')
  for (const role of ['teacher', 'secretary', 'headteacher', 'admin', null]) {
    await navigateRole(offlinePage, role)
    await inspect(offlinePage, role, `offline ${role || 'logout'} lifecycle`)
  }
  for (const role of roles) assert.ok(offlineResponses.some(response => response.href.includes(`/${role}.tailwind-`)
    && response.status === 200 && response.fromServiceWorker), `${role} CSS was not served offline by the service worker`)
  report.checks.push({ name: 'fresh offline page receives all hashed role CSS from service worker', passed: true, responses: offlineResponses })
  await offlinePage.screenshot({ path: path.join(output, 'offline-logout.png') })
  report.passed = true
} catch (error) {
  report.error = error.stack || String(error)
  if (activePage) {
    report.failureState = await activePage.evaluate(async () => ({
      path: location.pathname, bodyClasses: [...document.body.classList],
      appChildren: document.getElementById('app')?.children.length,
      controlled: Boolean(navigator.serviceWorker.controller),
      cachedAssets: (await Promise.all((await caches.keys()).map(async name => ({
        name, urls: (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname),
      })))),
    })).catch(failure => ({ diagnosticError: failure.message }))
  }
  console.error(report.error)
  process.exitCode = 1
} finally {
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  if (context) await context.close()
  if (browser) await browser.close()
  if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
  console.log(`Role stylesheet integration ${report.passed ? 'passed' : 'FAILED'}: ${report.checks.length} checks. Report: .tailwind-migration/role-styles/report.json`)
}
