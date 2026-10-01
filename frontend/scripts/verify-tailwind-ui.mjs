/**
 * Compare the preserved CSS baseline with the migrated app in a local browser.
 * All API requests are fulfilled in memory; no backend or external account is used.
 *
 * node scripts/verify-tailwind-ui.mjs
 * node scripts/verify-tailwind-ui.mjs --production --full --wait-for-styles
 * node scripts/verify-tailwind-ui.mjs --production --reuse-builds --states=error,loading --wait-for-styles --run-label=production-states
 * node scripts/verify-tailwind-ui.mjs --routes=/auth/login,/teacher/profile --viewports=mobile
 *
 * --reuse-builds deliberately tests the existing isolated production artifacts.
 * --wait-for-styles releases API fixtures after linked stylesheets are ready;
 * this avoids a pre-existing Chart.js intrinsic-width race in the CSS baseline.
 * Pixel tolerance defaults to zero. Equivalent minified gradient strings and
 * text-fill values on non-painting nodes are retained explicitly in the report.
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { createServer, build, preview } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const frontendRoot = fileURLToPath(new URL('../', import.meta.url))
const workspace = path.join(frontendRoot, '.tailwind-migration')
const baselineRoot = path.join(workspace, 'baseline')
const outputRoot = path.join(workspace, 'visual')
const args = process.argv.slice(2)
const option = (key, fallback) => args.find((arg) => arg.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback
const full = args.includes('--full')
const production = args.includes('--production')
const repeatBaseline = args.includes('--repeat-baseline')
const reuseBuilds = args.includes('--reuse-builds')
const waitForStyles = args.includes('--wait-for-styles')
const runName = option('run-label', [production ? 'production' : 'development', ...(repeatBaseline ? ['repeat-baseline'] : [])].join('-'))
if (!/^[a-z0-9-]+$/i.test(runName)) throw new Error('Run labels must contain letters, numbers, or hyphens only.')
const reportPath = path.join(outputRoot, `report-${runName}.json`)
const allowedStates = new Set(['empty', 'error', 'loading'])
const states = option('states', 'empty').split(',')
if (states.some((state) => !allowedStates.has(state))) throw new Error('States must be empty, error, or loading.')
const viewportOptions = {
  desktop: { width: 1366, height: 900 },
  mobile: { width: 390, height: 844 },
}
const viewports = option('viewports', 'desktop,mobile').split(',')
if (viewports.some((name) => !viewportOptions[name])) throw new Error('Viewports must be desktop or mobile.')
const geometryTolerance = Number(option('geometry-tolerance', '0.1'))
const pixelTolerance = Number(option('pixel-ratio-tolerance', '0'))
const caseLimit = Number(option('limit', 'Infinity'))
const channels = option('channel', 'chrome,msedge').split(',')
const fixedTime = '2026-10-02T04:00:00.000Z'
const userId = 'tailwind-visual-test'
const report = {
  generatedAt: new Date().toISOString(),
  baseline: baselineRoot,
  candidate: frontendRoot,
  mode: full ? 'full' : 'smoke',
  serving: production ? 'production' : 'development',
  repeatBaseline,
  fixtureWaitsForStyles: waitForStyles,
  isolation: 'Synthetic local API fixtures; all non-local network requests blocked; no backend writes.',
  limitations: 'Empty/error/loading fixtures do not exercise populated workflows, every modal, or real account permissions.',
  cases: [],
}

const pagesByRole = {
  student: ['dashboard', 'lessons', 'activities', 'announcements', 'profile', 'settings', 'exam/visual-assessment'],
  teacher: ['dashboard', 'activities', 'records', 'students', 'profile', 'settings'],
  headteacher: ['dashboard', 'management', 'lessons', 'profile', 'settings'],
  secretary: ['dashboard', 'users', 'teachers', 'students', 'archived', 'profile', 'settings'],
  admin: ['dashboard', 'users', 'requests', 'login-attempts', 'audit-logs', 'settings', 'profile'],
}
const allRoutes = [
  '/auth/login', '/auth/private-login', '/auth/forgot-password', '/auth/reset-password/visual-token',
  '/auth/change-password', '/auth/invite/visual-token', '/storage-demo',
  ...Object.entries(pagesByRole).flatMap(([role, pages]) => pages.map((page) => `/${role}/${page}`)),
]
const smokeRoutes = ['/auth/login', ...Object.keys(pagesByRole).map((role) => `/${role}/dashboard`)]
const routes = option('routes', '').split(',').filter(Boolean)
if (!routes.length) routes.push(...(full ? allRoutes : smokeRoutes))
if (routes.some((route) => !allRoutes.includes(route))) throw new Error('Unknown route; use an actual route listed in this harness.')
const matrix = routes.flatMap((route) => {
  const role = route === '/auth/change-password' ? 'student' : route.split('/')[1]
  const themes = ['student', 'teacher'].includes(role) ? ['light', 'dark'] : ['light']
  return viewports.flatMap((viewport) => themes.flatMap((theme) => states.map((state) => ({ route, role, viewport, theme, state }))))
}).slice(0, caseLimit)

function syntheticUser(role) {
  return {
    id: userId, _id: userId, role, username: 'visual.test', displayName: 'Visual Test',
    name: 'Visual Test', firstName: 'Visual', lastName: 'Test', email: 'visual@example.invalid',
    gradeLevel: 'Grade 11', section: 'Test Section', strand: 'STEM', profileImage: '', profile: {},
    forcePasswordChange: false, hasCompletedStudentTour: true, hasCompletedTeacherTour: true,
  }
}

function fixture(pathname, testCase) {
  const user = syntheticUser(testCase.role)
  const settings = { appearance: { theme: testCase.theme, textSize: 'normal', highContrast: false, reduceMotion: true } }
  // These endpoints are intentionally inert, including presence and any incidental POST.
  if (/\/auth\/(me|profile|user)(\/|$)/.test(pathname)) return { success: true, user }
  if (/\/auth\/invite\//.test(pathname)) return { success: true, invite: { email: 'visual@example.invalid', role: 'teacher', expiresAt: '2026-10-03T04:00:00.000Z' } }
  if (/\/student\/assessments\/visual-assessment\/start$/.test(pathname)) return {
    assessment: { id: 'visual-assessment', title: 'Synthetic visual assessment', examType: 'quiz', difficulty: 'easy', questions: [{ type: 'multiple_choice', questionText: 'Which option is shown first?', options: ['Option A', 'Option B', 'Option C', 'Option D'] }] },
    session: { id: 'visual-session', expiresAt: '2026-10-02T05:00:00.000Z', answers: [], violationCount: 0, maxViolations: 3, violationAction: 'pause' },
  }
  if (/\/settings(\/|$)/.test(pathname)) return { success: true, settings, user }
  if (/\/profile(\/|$)/.test(pathname)) return { success: true, user, profile: user }
  return {
    success: true, valid: true, message: 'Synthetic visual fixture', user, profile: user, settings,
    data: [], users: [], students: [], teachers: [], subjects: [], lessons: [], assessments: [],
    activities: [], submissions: [], activitySubmissions: [], notifications: [], announcements: [],
    requests: [], logs: [], auditLogs: [], loginAttempts: [], records: [], attendance: [], sections: [],
    strands: [], gradeLevels: [], files: [], events: [], grades: [], totals: {}, stats: {}, summary: {},
    analytics: {}, aiAnalytics: {}, recommendation: null, unreadCount: 0, total: 0, totalPages: 1,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  }
}

async function createLocalServer(root, label) {
  const common = {
    root, configFile: false, envFile: false, logLevel: 'error',
    cacheDir: path.join(workspace, `vite-${label}`),
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://visual.invalid'),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('visual-test-key'),
    },
    resolve: { alias: { '@': path.join(root, 'src') } },
  }
  if (production) {
    const outDir = path.join(workspace, `production-${label}`)
    if (reuseBuilds) {
      await access(path.join(outDir, 'index.html'))
      console.log(`Using previously built isolated ${label} production frontend.`)
    } else {
      console.log(`Building isolated ${label} production frontend...`)
      await build({
      ...common,
      configFile: label === 'candidate' ? path.join(frontendRoot, 'vite.config.js') : false,
      ...(label === 'baseline' ? { plugins: [vue(), tailwindcss()] } : {}),
      build: { outDir, emptyOutDir: true },
      })
    }
    const server = await preview({
      root, configFile: false, envFile: false, logLevel: 'error',
      build: { outDir }, preview: { host: '127.0.0.1', port: 0, strictPort: false },
    })
    const address = server.httpServer.address()
    return { server: { close: () => new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve())) }, origin: `http://127.0.0.1:${address.port}` }
  }
  const server = await createServer({
    ...common,
    plugins: [vue(), tailwindcss()],
    server: { host: '127.0.0.1', port: 0, strictPort: false, fs: { allow: [frontendRoot] }, hmr: false },
  })
  await server.listen()
  const address = server.httpServer.address()
  return { server, origin: `http://127.0.0.1:${address.port}` }
}

async function launchBrowser() {
  const failures = []
  for (const channel of channels) {
    try {
      return await chromium.launch({ channel, headless: true })
    } catch (error) {
      failures.push(`${channel}: ${error.message.split('\n')[0]}`)
    }
  }
  throw new Error(`No installed Chrome/Edge browser could launch. ${failures.join('; ')}`)
}

async function capture(browser, target, testCase, label, slug) {
  const requests = []
  const pageErrors = []
  const context = await browser.newContext({
    viewport: viewportOptions[testCase.viewport], colorScheme: testCase.theme, reducedMotion: 'reduce',
    locale: 'en-US', timezoneId: 'Asia/Manila', deviceScaleFactor: 1, serviceWorkers: 'block',
  })
  const heldRequests = []
  try {
    await context.route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      if (url.hostname === 'visual.invalid' && url.pathname.startsWith('/storage/v1/')) {
        requests.push({ method: request.method(), pathname: url.pathname })
        if (testCase.state === 'loading') { heldRequests.push(route); return }
        await route.fulfill({
          status: testCase.state === 'error' ? 503 : 200, contentType: 'application/json',
          body: JSON.stringify(testCase.state === 'error' ? { message: 'Synthetic unavailable storage' } : []),
        })
        return
      }
      if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
        requests.push({ method: request.method(), pathname: url.pathname })
        const isPresence = url.pathname.includes('/presence')
        const isRead = request.method() === 'GET'
        if (testCase.state === 'loading' && isRead && !isPresence) {
          heldRequests.push(route)
          return
        }
        const isError = testCase.state === 'error' && isRead && !isPresence
        if (waitForStyles && isRead) {
          await request.frame().page().waitForFunction(() => Array.from(document.querySelectorAll('link[rel="stylesheet"]')).every((link) => link.sheet), null, { timeout: 30000 })
          await request.frame().page().evaluate(() => new Promise(requestAnimationFrame))
        }
        await route.fulfill({
          status: isError ? 503 : 200, contentType: 'application/json',
          body: JSON.stringify(isError ? { message: 'Synthetic unavailable service for visual verification' } : fixture(url.pathname, testCase)),
        })
        return
      }
      if (url.origin !== target.origin || url.pathname.startsWith('/uploads/')) {
        await route.abort('blockedbyclient')
        return
      }
      await route.continue()
    })
    await context.addInitScript(({ user, role, theme, fixedTime, examMode }) => {
      const NativeDate = Date
      const timestamp = NativeDate.parse(fixedTime)
      const clockStart = NativeDate.now()
      globalThis.Date = class extends NativeDate {
        constructor(...values) { super(...(values.length ? values : [timestamp])) }
        // Keep elapsed time moving: Chart.js animators use Date.now(), and a
        // fully frozen clock strands them on whichever frame happened first.
        static now() { return examMode ? timestamp : timestamp + NativeDate.now() - clockStart }
      }
      let randomSeed = 123456789
      Math.random = () => ((randomSeed = (1664525 * randomSeed + 1013904223) >>> 0) / 4294967296)
      if (['student', 'teacher', 'headteacher', 'secretary', 'admin'].includes(role)) {
        localStorage.setItem('edumatch_auth_token', 'synthetic-visual-token')
        localStorage.setItem('edumatch_auth_user', JSON.stringify(user))
      }
      localStorage.setItem('edumatch_teacher_theme', theme)
      localStorage.setItem(`edumatch_student_settings_v2_${user.id}`, JSON.stringify({
        appearance: { theme, textSize: 'normal', highContrast: false, reduceMotion: true },
      }))
      // Suppress transitions at document creation so screenshots capture stable end states.
      const installStyle = () => {
        if (!document.documentElement) return
        const style = document.createElement('style')
        style.textContent = '*,*::before,*::after{animation-delay:0s!important;animation-duration:0s!important;animation-iteration-count:1!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}'
        document.documentElement.appendChild(style)
      }
      if (document.documentElement) installStyle()
      else new MutationObserver((_, observer) => { if (document.documentElement) { installStyle(); observer.disconnect() } }).observe(document, { childList: true })
    }, { user: syntheticUser(testCase.role), role: testCase.role, theme: testCase.theme, fixedTime, examMode: testCase.route.includes('/exam/') })
    const page = await context.newPage()
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const bannerQuery = testCase.state === 'error' && ['/auth/login', '/auth/private-login'].includes(testCase.route)
      ? '?error=Synthetic%20sign-in%20error%20for%20visual%20verification' : ''
    await page.goto(`${target.origin}${testCase.route}${bannerQuery}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
    await page.locator('#app > *').first().waitFor({ state: 'attached', timeout: 90000 })
    await page.waitForFunction(() => Array.from(document.querySelectorAll('link[rel="stylesheet"]')).every((link) => link.sheet), null, { timeout: 60000 })
    await page.evaluate(() => document.fonts.ready)
    if (testCase.state !== 'loading') await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    // Wait for asynchronous Vue rendering to stop changing layout, including charts.
    let lastLayout = ''
    let stableSamples = 0
    for (let attempt = 0; attempt < 40 && stableSamples < 4; attempt += 1) {
      const layout = await page.evaluate(() => {
        const root = document.querySelector('#app')
        const bounds = Array.from(root?.querySelectorAll('*') || []).slice(0, 250).map((node) => {
          const rect = node.getBoundingClientRect()
          const style = getComputedStyle(node)
          return [rect.x, rect.y, rect.width, rect.height, style.opacity, style.transform].join(',')
        }).join('|')
        const canvases = Array.from(root?.querySelectorAll('canvas') || []).map((canvas) => {
          try {
            const data = canvas.toDataURL()
            let hash = 0
            for (let i = 0; i < data.length; i += 1) hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0
            return hash
          } catch { return 'unreadable-canvas' }
        }).join(',')
        return `${root?.textContent?.length}|${root?.scrollHeight}|${bounds}|${canvases}`
      })
      stableSamples = layout === lastLayout ? stableSamples + 1 : 0
      lastLayout = layout
      await page.waitForTimeout(100)
    }
    const resolvedRoute = new URL(page.url()).pathname
    if (resolvedRoute !== testCase.route) throw new Error(`Requested ${testCase.route}, but rendered ${resolvedRoute}; this route is uncovered.`)
    const snapshotReader = () => {
      const properties = [
        'display', 'position', 'box-sizing', 'color', 'background-color', 'background-image',
        'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align',
        'width', 'min-width', 'max-width',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
        'border-top-style', 'border-top-color', 'border-radius', 'box-shadow', 'opacity',
        'overflow-x', 'overflow-y', 'gap', 'grid-template-columns', 'flex-direction', 'align-items',
        'justify-content', 'transform', 'filter', 'backdrop-filter', '-webkit-text-fill-color',
      ]
      const nodes = [document.body, ...document.querySelectorAll('#app, #app *')]
      const visible = nodes.filter((node) => {
        const rect = node.getBoundingClientRect()
        const style = getComputedStyle(node)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      })
      return visible.map((node, index) => {
        const style = getComputedStyle(node)
        const rect = node.getBoundingClientRect()
        const before = getComputedStyle(node, '::before')
        const after = getComputedStyle(node, '::after')
        return {
          index, tag: node.tagName.toLowerCase(), id: node.id,
          classes: typeof node.className === 'string' ? node.className : '',
          inlineStyle: node.getAttribute('style'),
          ...(node.tagName === 'CANVAS' ? { canvasWidth: node.width, canvasHeight: node.height } : {}),
          directText: Array.from(node.childNodes).filter((child) => child.nodeType === Node.TEXT_NODE).map((child) => child.textContent).join('').trim(),
          text: node.childElementCount === 0 ? node.textContent.trim().slice(0, 100) : '',
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          style: Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property).replaceAll(location.origin, '<origin>')])),
          before: { content: before.content, color: before.color, display: before.display, background: before.backgroundColor, textFillColor: before.webkitTextFillColor },
          after: { content: after.content, color: after.color, display: after.display, background: after.backgroundColor, textFillColor: after.webkitTextFillColor },
        }
      })
    }
    const screenshotPath = path.join(outputRoot, `${slug}-${label}.png`)
    const screenshot = await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled', timeout: 30000 })
    const snapshot = await page.evaluate(snapshotReader)
    if (snapshot.length < 5) throw new Error(`Rendered page has too few visible elements (${snapshot.length}). ${pageErrors.join('; ')}`)
    // fullPage does not expand fixed-height, internally scrolling dashboard mains.
    // Capture overlapping scroll positions as well so lower panels are inspected.
    const scrollTargets = await page.evaluate(() => Array.from(document.querySelectorAll('#app *')).filter((node) => {
      const style = getComputedStyle(node), rect = node.getBoundingClientRect()
      return /auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 100
        && rect.width > 200 && rect.height > 250 && rect.top < innerHeight && rect.bottom > 0
    }).map((node, index) => {
      node.dataset.visualScrollTarget = String(index)
      return { index, step: Math.max(200, Math.floor(node.clientHeight * 0.85)), maximum: node.scrollHeight - node.clientHeight }
    }))
    const scrollScreenshots = []
    for (const target of scrollTargets) {
      const positions = []
      for (let position = target.step; position < target.maximum; position += target.step) positions.push(position)
      positions.push(target.maximum)
      for (const [step, position] of positions.entries()) {
        await page.locator(`[data-visual-scroll-target="${target.index}"]`).evaluate((node, top) => { node.scrollTop = top }, position)
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        const name = `scroll-${target.index}-${step}`
        const bytes = await page.screenshot({ path: path.join(outputRoot, `${slug}-${label}-${name}.png`), animations: 'disabled', timeout: 30000 })
        scrollScreenshots.push({ name, position, screenshot: bytes })
      }
      await page.locator(`[data-visual-scroll-target="${target.index}"]`).evaluate((node) => { node.scrollTop = 0 })
    }
    // Closing held loading-state requests may emit errors during teardown;
    // report only errors observed while the inspected page was still open.
    return { resolvedRoute, elements: snapshot, pageErrors: [...pageErrors], requests: [...requests], screenshotPath, screenshot, scrollScreenshots }
  } finally {
    for (const route of heldRequests) await route.abort().catch(() => {})
    await context.close()
  }
}

function compareSnapshots(baseline, candidate) {
  const differences = []
  if (baseline.resolvedRoute !== candidate.resolvedRoute) differences.push({ kind: 'route', before: baseline.resolvedRoute, after: candidate.resolvedRoute })
  if (baseline.elements.length !== candidate.elements.length) differences.push({ kind: 'element-count', before: baseline.elements.length, after: candidate.elements.length })
  const count = Math.min(baseline.elements.length, candidate.elements.length)
  for (let index = 0; index < count; index += 1) {
    const before = baseline.elements[index]
    const after = candidate.elements[index]
    const element = `${index}: ${before.tag}${before.id ? `#${before.id}` : ''}.${before.classes.split(' ').slice(0, 3).join('.')}`
    for (const key of ['tag', 'text']) if (before[key] !== after[key]) differences.push({ kind: key, element, before: before[key], after: after[key] })
    for (const key of Object.keys(before.rect)) {
      if (Math.abs(before.rect[key] - after.rect[key]) > geometryTolerance) differences.push({ kind: 'geometry', element, property: key, before: before.rect[key], after: after.rect[key] })
    }
    for (const group of ['style', 'before', 'after']) for (const key of Object.keys(before[group])) {
      if (before[group][key] !== after[group][key]) {
        // CSS minifiers may omit default gradient endpoints and shorten zero origins.
        // These are exactly equivalent; retain the raw difference for review anyway.
        const normalizeGradient = (value) => value
          .replace(/((?:repeating-)?(?:linear|radial)-gradient\((?:[^(),]+,\s*)?)(rgba?\([^)]*\)) 0%/g, '$1$2')
          .replace(/(rgba?\([^)]*\)) 100%(\))/g, '$1$2')
          .replace(/\bat ([^,()]+)/g, (_match, position) => `at ${position.replace(/(^|\s)0%(?=\s|$)/g, (_zero, space) => `${space}0px`)}`)
        const equivalent = group === 'style' && key === 'background-image'
          && normalizeGradient(before[group][key]) === normalizeGradient(after[group][key])
        const pseudoPaints = (pseudo) => pseudo.display !== 'none' && !['none', 'normal', '""'].includes(pseudo.content)
        const irrelevantFill = (group === 'style' && key === '-webkit-text-fill-color' && !before.directText && !after.directText
          && ['before', 'after'].every((pseudo) => (!pseudoPaints(before[pseudo]) && !pseudoPaints(after[pseudo])) || before[pseudo].textFillColor === after[pseudo].textFillColor))
          || (['before', 'after'].includes(group) && key === 'textFillColor' && !pseudoPaints(before[group]) && !pseudoPaints(after[group]))
        differences.push({ kind: group, element, property: key, before: before[group][key], after: after[group][key], ...(irrelevantFill ? { nonRendered: true } : {}), ...(equivalent ? { equivalent: 'Default gradient endpoint/origin serialization' } : {}) })
      }
    }
  }
  for (const error of candidate.pageErrors) if (!baseline.pageErrors.includes(error)) differences.push({ kind: 'new-page-error', error })
  return differences
}

async function comparePixels(browser, baseline, candidate, slug) {
  const page = await browser.newPage()
  try {
    const result = await page.evaluate(async ({ before, after }) => {
      const image = (base64) => new Promise((resolve, reject) => {
        const element = new Image()
        element.onload = () => resolve(element)
        element.onerror = reject
        element.src = `data:image/png;base64,${base64}`
      })
      const [a, b] = await Promise.all([image(before), image(after)])
      const width = Math.max(a.width, b.width), height = Math.max(a.height, b.height)
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(a, 0, 0)
      const first = ctx.getImageData(0, 0, width, height)
      ctx.clearRect(0, 0, width, height); ctx.drawImage(b, 0, 0)
      const second = ctx.getImageData(0, 0, width, height)
      let different = 0, maxChannelDelta = 0
      for (let i = 0; i < first.data.length; i += 4) {
        let changed = false
        for (let channel = 0; channel < 4; channel += 1) {
          const delta = Math.abs(first.data[i + channel] - second.data[i + channel])
          maxChannelDelta = Math.max(maxChannelDelta, delta)
          if (delta > 1) changed = true
        }
        if (changed) different += 1
        second.data[i] = changed ? 255 : first.data[i]
        second.data[i + 1] = changed ? 0 : first.data[i + 1]
        second.data[i + 2] = changed ? 180 : first.data[i + 2]
        second.data[i + 3] = 255
      }
      ctx.putImageData(second, 0, 0)
      return { different, total: width * height, ratio: different / (width * height), maxChannelDelta, beforeSize: [a.width, a.height], afterSize: [b.width, b.height], diff: different ? canvas.toDataURL('image/png').split(',')[1] : null }
    }, { before: baseline.toString('base64'), after: candidate.toString('base64') })
    if (result.diff) await writeFile(path.join(outputRoot, `${slug}-diff.png`), Buffer.from(result.diff, 'base64'))
    delete result.diff
    return result
  } finally { await page.close() }
}

let browser
const servers = []
try {
  await access(path.join(baselineRoot, 'index.html'))
  await mkdir(outputRoot, { recursive: true })
  browser = await launchBrowser()
  const baseline = await createLocalServer(baselineRoot, 'baseline'); servers.push(baseline.server)
  const candidate = await createLocalServer(frontendRoot, 'candidate'); servers.push(candidate.server)
  for (const [index, testCase] of matrix.entries()) {
    const slug = `${production || repeatBaseline ? `${runName}-` : ''}${testCase.route.replace(/[^a-z0-9]+/gi, '-').replace(/^-/, '')}-${testCase.viewport}-${testCase.theme}-${testCase.state}`
    const result = { ...testCase, slug }
    try {
      const captures = [() => capture(browser, baseline, testCase, 'before', slug), () => capture(browser, repeatBaseline ? baseline : candidate, testCase, 'after', slug)]
      // Exam integrity listeners react to changing active tabs; inspect each in isolation.
      const [before, after] = testCase.route.includes('/exam/')
        ? [await captures[0](), await captures[1]()] : await Promise.all(captures.map((capturePage) => capturePage()))
      result.resolvedRoutes = { before: before.resolvedRoute, after: after.resolvedRoute }
      result.differences = compareSnapshots(before, after)
      result.pixels = await comparePixels(browser, before.screenshot, after.screenshot, slug)
      result.scrollPixels = []
      if (before.scrollScreenshots.length !== after.scrollScreenshots.length) result.differences.push({ kind: 'scroll-capture-count', before: before.scrollScreenshots.length, after: after.scrollScreenshots.length })
      for (let index = 0; index < Math.min(before.scrollScreenshots.length, after.scrollScreenshots.length); index += 1) {
        const first = before.scrollScreenshots[index], second = after.scrollScreenshots[index]
        result.scrollPixels.push({ name: first.name, positions: [first.position, second.position], ...await comparePixels(browser, first.screenshot, second.screenshot, `${slug}-${first.name}`) })
      }
      result.significantDifferences = result.differences.filter((difference) => !difference.nonRendered && !difference.equivalent).length
      result.passed = result.significantDifferences === 0 && result.pixels.ratio <= pixelTolerance && result.scrollPixels.every((pixels) => pixels.ratio <= pixelTolerance)
      result.elementsCompared = Math.min(before.elements.length, after.elements.length)
      result.baselineErrors = before.pageErrors
      result.candidateErrors = after.pageErrors
      result.apiRequests = { before: before.requests, after: after.requests }
      await writeFile(path.join(outputRoot, `${slug}-dom.json`), JSON.stringify({ before: before.elements, after: after.elements }, null, 2))
    } catch (error) {
      result.passed = false
      result.error = error.stack || String(error)
    }
    report.cases.push(result)
    await writeFile(reportPath, JSON.stringify(report, null, 2))
    console.log(`[${index + 1}/${matrix.length}] ${result.passed ? 'PASS' : 'FAIL'} ${slug}${result.error ? `: ${result.error.split('\n')[0]}` : ` (${result.significantDifferences} significant style/geometry differences, ${result.differences.length - result.significantDifferences} equivalent/non-rendered, ${result.pixels.different} changed pixels)`}`)
  }
  report.passed = report.cases.every((result) => result.passed)
  report.summary = { total: report.cases.length, passed: report.cases.filter((result) => result.passed).length, failed: report.cases.filter((result) => !result.passed).length }
  await writeFile(reportPath, JSON.stringify(report, null, 2))
  console.log(`Visual comparison: ${report.summary.passed}/${report.summary.total} passed. Report: ${reportPath}`)
  if (!report.passed) process.exitCode = 1
} finally {
  await browser?.close()
  await Promise.allSettled(servers.map((server) => server.close()))
}
