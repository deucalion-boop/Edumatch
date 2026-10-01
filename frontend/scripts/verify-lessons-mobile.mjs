/** Local, synthetic-only Teacher Records lesson layout/interaction checks. */
import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { chromium } from '@playwright/test'

const frontend = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(frontend, '.tailwind-migration/lessons-mobile')
const baseline = path.join(output, 'baseline')
const args = process.argv.slice(2)
const beforeOnly = args.includes('--baseline-only')
const paginationFixture = args.includes('--pagination')
const option = (name, fallback) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback
const widths = option('widths', paginationFixture ? '320,390' : '320,375,390,430,560,768,1366').split(',').map(Number)
const themes = option('themes', 'light,dark').split(',')
const panelSelector = '#teacherRecordsLessonsPanel'
const longTitle = 'Advanced Research Methods and Programming: An Extended Guide to Collaborative Investigations, Evidence Analysis, and Responsible Digital Design'
const longClass = 'Grade 12 STEM — Advanced Programming and Practical Research Section Alexandrite'
const longFile = 'Comprehensive_Research_Methodology_and_Digital_Programming_Reference_Appendix_With_Annotated_Examples_and_Classroom_Activities_2026.pdf'
const subjects = [
  { id: 'class-one', name: 'Computer Programming', className: longClass, code: 'STEM-12-A', department: 'STEM' },
  { id: 'class-two', name: 'Mathematics', className: 'Grade 11 Mathematics – Sapphire', code: 'MATH-11-B', department: 'STEM' },
  { id: 'class-three', name: 'English', className: 'Grade 12 Creative Writing – Garnet', code: 'ENG-12-C', department: 'HUMSS' },
]
const attachment = (id, fileName, fileType = 'pdf') => ({
  id, fileName, fileType, url: `/visual-fixtures/${id}.pdf`, downloadUrl: `/visual-fixtures/${id}.pdf`, canPreviewInline: true, size: 2048,
})
const lessons = [
  { id: 'lesson-one', title: longTitle, className: longClass, subject: 'Computer Programming and Practical Research Fundamentals', subjectId: 'class-one', description: 'Synthetic teaching material for local layout verification only.', createdAt: '2026-10-01T04:00:00.000Z', attachments: [attachment('reference', longFile), attachment('worksheet', 'Collaborative_Investigation_Worksheet_With_Extended_Instructions.pdf'), attachment('answers', 'Worked Examples and Answer Guide.pdf')] },
  { id: 'lesson-two', title: 'Algebra Basics', className: subjects[1].className, subject: 'Mathematics', subjectId: 'class-two', description: 'Synthetic mathematics lesson.', createdAt: '2026-09-15T04:00:00.000Z', attachments: [attachment('algebra', 'Algebra practice.pdf')] },
  { id: 'lesson-three', title: 'Creative Writing Workshop', className: subjects[2].className, subject: 'English', subjectId: 'class-three', description: 'Synthetic writing lesson.', createdAt: '2026-09-01T04:00:00.000Z', attachments: [attachment('writing', 'Writing prompts and reflection guide.pdf')] },
]
if (paginationFixture) for (let index = 4; index <= 8; index += 1) lessons.push({
  id: `lesson-${index}`, title: `Supplemental Topic ${index}`, className: longClass,
  subject: 'Research', subjectId: 'class-one', description: 'Synthetic pagination-only lesson.',
  createdAt: '2026-09-22T04:00:00.000Z', attachments: [attachment(`supplement-${index}`, `Supplement ${index}.pdf`)],
})
const user = { id: 'visual-teacher', _id: 'visual-teacher', role: 'teacher', username: 'visual.teacher', displayName: 'Visual Teacher', email: 'visual@example.invalid', hasCompletedTeacherTour: true, hasCompletedStudentTour: true, profile: {} }

async function serve(root, label) {
  const server = await createServer({
    root, configFile: false, envFile: false, logLevel: 'error', plugins: [vue(), tailwindcss()],
    cacheDir: path.join(output, `vite-${label}`),
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api'), 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://visual.invalid'), 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('synthetic-key') },
    resolve: { alias: { '@': path.join(root, 'src') } },
    server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [frontend] } },
  })
  await server.listen()
  return { server, origin: `http://127.0.0.1:${server.httpServer.address().port}` }
}

function fixture(pathname) {
  if (pathname.endsWith('/teacher/lessons')) return { lessons }
  if (pathname.endsWith('/teacher/subjects')) return { subjects }
  return { success: true, user, lessons: [], assessments: [], results: [], subjects, sections: [], records: [], roster: [], students: [], notifications: [], unreadCount: 0, advisorySection: null }
}

async function inspectPanel(page, width) {
  return page.locator(panelSelector).evaluate((panel, viewportWidth) => {
    const rect = panel.getBoundingClientRect()
    const issues = []
    const details = []
    const summarize = (node) => `${node.tagName.toLowerCase()}.${String(node.className).split(' ').slice(0, 2).join('.')} ${node.textContent.trim().slice(0, 70)}`
    if (rect.left < -1 || rect.right > viewportWidth + 1) issues.push({ kind: 'panel-overflow', left: rect.left, right: rect.right, viewportWidth })
    const content = panel.querySelectorAll('.lessons-toolbar,.lesson-document-card,.record-card-header,.record-card-title h4,.record-chip,.attachment-row,.attachment-info,.file-name,.attachment-actions,.lesson-manage-actions,.records-pagination,.records-pagination-actions,.lessons-page-numbers')
    for (const node of content) {
      const bounds = node.getBoundingClientRect(), style = getComputedStyle(node)
      if (!bounds.width || !bounds.height || style.display === 'none') continue
      details.push({ name: summarize(node), rect: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, whiteSpace: style.whiteSpace, overflow: style.overflow, overflowWrap: style.overflowWrap })
      if (bounds.left < rect.left - 1 || bounds.right > rect.right + 1) issues.push({ kind: 'content-outside-panel', node: summarize(node), left: bounds.left, right: bounds.right })
      if (viewportWidth <= 768 && node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1) issues.push({ kind: 'clipped-content', node: summarize(node), scrollWidth: node.scrollWidth, clientWidth: node.clientWidth })
    }
    const controls = []
    for (const node of panel.querySelectorAll('button,input[type="search"],select,a.record-link')) {
      const bounds = node.getBoundingClientRect(), style = getComputedStyle(node)
      if (!bounds.width || !bounds.height || style.display === 'none') continue
      const name = node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent.trim()
      controls.push({ name, width: bounds.width, height: bounds.height })
      if (viewportWidth <= 768 && (bounds.width < 43.9 || bounds.height < 43.9)) issues.push({ kind: 'small-touch-target', name, width: bounds.width, height: bounds.height })
      if (bounds.left < rect.left - 1 || bounds.right > rect.right + 1) issues.push({ kind: 'control-outside-panel', name, left: bounds.left, right: bounds.right })
    }
    const previous = panel.querySelector('[aria-label="Go to previous lesson page"]')
    const next = panel.querySelector('[aria-label="Go to next lesson page"]')
    if (viewportWidth <= 420 && previous && next) {
      const prevBounds = previous.getBoundingClientRect(), nextBounds = next.getBoundingClientRect()
      if (Math.abs(prevBounds.top - nextBounds.top) > 1 || prevBounds.right > nextBounds.left + 1) issues.push({ kind: 'pagination-not-two-columns', previous: { x: prevBounds.x, y: prevBounds.y }, next: { x: nextBounds.x, y: nextBounds.y } })
    }
    return { issues, details, controls, panel: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }
  }, width)
}

async function capture(browser, target, label, width, theme) {
  const context = await browser.newContext({ viewport: { width, height: width === 1366 ? 900 : 1000 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'Asia/Manila', colorScheme: theme, reducedMotion: 'reduce', serviceWorkers: 'block' })
  const calls = [], errors = [], interactions = []
  try {
    await context.route('**/*', async (route) => {
      const request = route.request(), url = new URL(request.url())
      if (url.pathname.startsWith('/api/')) {
        calls.push({ method: request.method(), pathname: url.pathname })
        if (request.method() === 'GET') await request.frame().page().waitForFunction(() => Array.from(document.querySelectorAll('link[rel="stylesheet"]')).every((link) => link.sheet), null, { timeout: 60000 })
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture(url.pathname)) })
      } else if (url.origin !== target.origin || url.pathname.startsWith('/visual-fixtures/')) await route.abort('blockedbyclient')
      else await route.continue()
    })
    await context.addInitScript(({ user, theme }) => {
      localStorage.setItem('edumatch_auth_token', 'synthetic-teacher-token')
      localStorage.setItem('edumatch_auth_user', JSON.stringify(user))
      localStorage.setItem('edumatch_teacher_theme', theme)
      const NativeDate = Date, fixed = NativeDate.parse('2026-10-02T04:00:00.000Z'), clockStart = NativeDate.now()
      globalThis.Date = class extends NativeDate { constructor(...values) { super(...(values.length ? values : [fixed])) } static now() { return fixed + NativeDate.now() - clockStart } }
      const install = () => {
        const style = document.createElement('style')
        style.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}'
        document.documentElement.appendChild(style)
      }
      if (document.documentElement) install()
      else new MutationObserver((_records, observer) => { if (document.documentElement) { install(); observer.disconnect() } }).observe(document, { childList: true })
    }, { user, theme })
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${target.origin}/teacher/records`, { waitUntil: 'domcontentloaded', timeout: 90000 })
    const panel = page.locator(panelSelector)
    await panel.waitFor({ state: 'visible', timeout: 90000 })
    await page.waitForFunction((count) => document.querySelectorAll('#teacherRecordsLessonsPanel .lesson-document-card').length === count, paginationFixture ? 5 : 3)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForLoadState('networkidle')
    await panel.scrollIntoViewIfNeeded()
    const slug = `${paginationFixture ? 'pagination-' : ''}${width}-${theme}-${label}`
    const screenshot = await panel.screenshot({ path: path.join(output, `${slug}-panel.png`), animations: 'disabled' })
    const initial = await inspectPanel(page, width)
    // The app scrolls inside .teacher-main, so oversized element screenshots
    // contain clipped blank regions. Also capture actual viewports at useful
    // scroll positions without changing application layout or stylesheet rules.
    const viewportScreenshots = []
    for (const [section, selector] of [
      ['overview', panelSelector],
      ['first-card', `${panelSelector} .lesson-document-card`],
      ['attachments', `${panelSelector} .lesson-document-card .attachment-row`],
      ['last-card', `${panelSelector} .lesson-document-card:last-child`],
    ]) {
      await page.locator(selector).first().evaluate((node) => {
        const main = node.closest('.teacher-main')
        const header = document.querySelector('.teacher-main > .top-header')
        const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom || 0)
        main.scrollTop += node.getBoundingClientRect().top - headerBottom - 16
      })
      const file = `${slug}-${section}-viewport.png`
      await page.screenshot({ path: path.join(output, file), animations: 'disabled' })
      viewportScreenshots.push(file)
    }
    const cardTitles = () => panel.locator('.lesson-document-card h4').allTextContents()
    if (paginationFixture) {
      const previous = panel.getByRole('button', { name: 'Go to previous lesson page', exact: true })
      const next = panel.getByRole('button', { name: 'Go to next lesson page', exact: true })
      if (!await previous.isDisabled() || await next.isDisabled()) throw new Error('Initial lesson pagination state is incorrect.')
      await next.click()
      if ((await cardTitles()).length !== 3 || !await next.isDisabled() || await previous.isDisabled()) throw new Error('Next did not render the final three lessons.')
      await page.screenshot({ path: path.join(output, `${slug}-pagination-viewport.png`), animations: 'disabled' })
      await previous.click()
      if ((await cardTitles()).length !== 5 || !await previous.isDisabled()) throw new Error('Previous did not restore the first five lessons.')
      interactions.push('Next and Previous navigate all eight lessons without mutations')
    }
    const search = page.getByRole('searchbox', { name: 'Search lessons, classes, or files', exact: true })
    await search.fill('Algebra')
    if (JSON.stringify(await cardTitles()) !== JSON.stringify(['Algebra Basics'])) throw new Error('Search did not isolate Algebra Basics.')
    interactions.push('Search finds matching lesson')
    const filteredLayout = await inspectPanel(page, width)
    await page.getByRole('button', { name: 'Clear lesson search', exact: true }).click()
    await page.getByRole('combobox', { name: 'Filter lessons by subject', exact: true }).selectOption('English')
    if (JSON.stringify(await cardTitles()) !== JSON.stringify(['Creative Writing Workshop'])) throw new Error('Subject filter did not isolate the English lesson.')
    interactions.push('Subject filter selects English')
    await page.getByRole('combobox', { name: 'Filter lessons by subject', exact: true }).selectOption('all')
    const sort = page.getByRole('combobox', { name: 'Sort lessons', exact: true })
    await sort.selectOption('oldest')
    if ((await cardTitles())[0] !== 'Creative Writing Workshop') throw new Error('Oldest sort is incorrect.')
    await sort.selectOption('name')
    if ((await cardTitles())[0] !== longTitle) throw new Error('Name sort is incorrect.')
    await sort.selectOption('newest')
    if ((await cardTitles())[0] !== longTitle) throw new Error('Newest sort is incorrect.')
    interactions.push('Oldest, Name, and Newest sorting works')
    const longCard = panel.locator('.lesson-document-card').filter({ has: page.getByRole('heading', { name: longTitle, exact: true }) })
    if (await longCard.count() !== 1) throw new Error('Long-title lesson card is not unique.')
    await longCard.getByRole('button', { name: 'Edit', exact: true }).click()
    const editDialog = page.getByRole('dialog', { name: 'Edit lesson', exact: true })
    await editDialog.waitFor({ state: 'visible' })
    if (await editDialog.getByRole('textbox', { name: 'Lesson title', exact: true }).inputValue() !== longTitle) throw new Error('Edit dialog loaded the wrong lesson.')
    await editDialog.screenshot({ path: path.join(output, `${slug}-edit-dialog.png`), animations: 'disabled' })
    await page.getByRole('button', { name: 'Close edit lesson', exact: true }).click()
    interactions.push('Edit opens the correct populated dialog and closes without saving')
    await longCard.getByRole('button', { name: 'Add to classes', exact: true }).click()
    const copyDialog = page.getByRole('dialog', { name: 'Add lesson to other classes', exact: true })
    await copyDialog.waitFor({ state: 'visible' })
    if (await copyDialog.getByRole('checkbox').count() !== 2) throw new Error('Add-to-classes dialog did not expose the two alternative classes.')
    await copyDialog.screenshot({ path: path.join(output, `${slug}-copy-dialog.png`), animations: 'disabled' })
    await page.getByRole('button', { name: 'Close add to classes', exact: true }).click()
    interactions.push('Add to classes opens available classes and closes without saving')
    const mutations = calls.filter((call) => call.method !== 'GET' && call.pathname !== '/api/auth/presence')
    if (mutations.length) throw new Error(`Unexpected application mutation request: ${JSON.stringify(mutations)}`)
    return { width, theme, label, initial, filteredLayout, interactions, errors: [...errors], calls: [...calls], viewportScreenshots, screenshot }
  } finally { await context.close() }
}

async function comparePixels(browser, before, after) {
  const page = await browser.newPage()
  try {
    return await page.evaluate(async ({ first, second }) => {
      const decode = (encoded) => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = `data:image/png;base64,${encoded}` })
      const [a, b] = await Promise.all([decode(first), decode(second)])
      if (a.width !== b.width || a.height !== b.height) return { dimensionsEqual: false, before: [a.width, a.height], after: [b.width, b.height], changed: null }
      const canvas = document.createElement('canvas'); canvas.width = a.width; canvas.height = a.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(a, 0, 0)
      const dataA = ctx.getImageData(0, 0, a.width, a.height).data
      ctx.clearRect(0, 0, a.width, a.height); ctx.drawImage(b, 0, 0)
      const dataB = ctx.getImageData(0, 0, a.width, a.height).data
      let changed = 0, maxChannelDelta = 0
      for (let index = 0; index < dataA.length; index += 4) {
        let different = false
        for (let channel = 0; channel < 4; channel += 1) { const delta = Math.abs(dataA[index + channel] - dataB[index + channel]); maxChannelDelta = Math.max(maxChannelDelta, delta); if (delta > 0) different = true }
        if (different) changed += 1
      }
      return { dimensionsEqual: true, changed, pixels: a.width * a.height, maxChannelDelta }
    }, { first: before.toString('base64'), second: after.toString('base64') })
  } finally { await page.close() }
}

const servers = []
let browser
const report = { mode: beforeOnly ? 'baseline' : 'comparison', generatedAt: new Date().toISOString(), fixtures: `${lessons.length} synthetic lessons and synthetic local attachment links only; all API traffic mocked.`, cases: [] }
const reportName = paginationFixture ? 'pagination-report.json' : beforeOnly ? 'baseline-report.json' : 'comparison-report.json'
try {
  await access(path.join(baseline, 'index.html'))
  await mkdir(output, { recursive: true })
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const before = await serve(baseline, 'before'); servers.push(before.server)
  const after = beforeOnly ? null : await serve(frontend, 'after'); if (after) servers.push(after.server)
  for (const width of widths) for (const theme of themes) {
    const result = { width, theme }
    try {
      const old = await capture(browser, before, 'before', width, theme)
      result.before = { ...old, screenshot: undefined }
      if (!beforeOnly) {
        const updated = await capture(browser, after, 'after', width, theme)
        result.after = { ...updated, screenshot: undefined }
        result.desktopPixels = width === 1366 ? await comparePixels(browser, old.screenshot, updated.screenshot) : null
        result.passed = updated.initial.issues.length === 0 && updated.filteredLayout.issues.length === 0 && updated.errors.length === 0
          && (width !== 1366 || (result.desktopPixels.dimensionsEqual && result.desktopPixels.changed === 0))
      } else result.passed = old.errors.length === 0
    } catch (error) { result.passed = false; result.error = error.stack || String(error) }
    report.cases.push(result)
    await writeFile(path.join(output, reportName), JSON.stringify(report, null, 2))
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${width}px ${theme}${result.error ? `: ${result.error.split('\n')[0]}` : `; before issues=${result.before.initial.issues.length}${result.after ? `, after issues=${result.after.initial.issues.length}; desktop pixels=${result.desktopPixels?.changed ?? 'n/a'}` : ''}`}`)
  }
  report.summary = { total: report.cases.length, passed: report.cases.filter((item) => item.passed).length, failed: report.cases.filter((item) => !item.passed).length }
  await writeFile(path.join(output, reportName), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report.summary))
  if (report.summary.failed) process.exitCode = 1
} finally { await browser?.close(); await Promise.allSettled(servers.map((server) => server.close())) }
