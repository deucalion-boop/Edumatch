/** Local, synthetic-only lesson hover/focus/motion regression checks. */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { chromium } from '@playwright/test'

const frontend = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(frontend, '.tailwind-migration/lessons-hover')
const panelSelector = '#teacherRecordsLessonsPanel'
const cardSelector = `${panelSelector} .lesson-document-card`
const title = 'Research Methods and Digital Design: Collaborative Investigations and Practical Examples'
const user = { id: 'visual-teacher', _id: 'visual-teacher', role: 'teacher', username: 'visual.teacher', displayName: 'Visual Teacher', email: 'visual@example.invalid', hasCompletedTeacherTour: true, hasCompletedStudentTour: true, profile: {} }
const subjects = [{ id: 'visual-class', name: 'Research', className: 'Grade 12 STEM - Alexandrite', code: 'STEM-12-A' }]
const lessons = [{
  id: 'visual-lesson', title, className: subjects[0].className, subject: 'Research and Programming', subjectId: 'visual-class',
  description: 'Synthetic lesson used only for local browser checks.', createdAt: '2026-10-01T04:00:00.000Z',
  attachments: [{ id: 'visual-file', fileName: 'Research Methods and Worked Examples.pdf', fileType: 'pdf', url: '/visual-fixtures/research.pdf', downloadUrl: '/visual-fixtures/research.pdf', canPreviewInline: true, size: 2048 }],
}]
const cases = [
  ...['light', 'dark'].flatMap((theme) => ['no-preference', 'reduce'].map((motion) => ({ theme, motion, mobile: false }))),
  ...['light', 'dark'].map((theme) => ({ theme, motion: 'no-preference', mobile: true })),
]
const report = { generatedAt: new Date().toISOString(), fixtures: 'One synthetic lesson and local attachment; all APIs mocked; no hover transitions disabled.', cases: [] }

function fixture(pathname) {
  if (pathname.endsWith('/teacher/lessons')) return { lessons }
  if (pathname.endsWith('/teacher/subjects')) return { subjects }
  return { success: true, user, lessons: [], assessments: [], results: [], subjects, sections: [], records: [], roster: [], students: [], notifications: [], unreadCount: 0, advisorySection: null }
}

async function state(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node), before = getComputedStyle(node, '::before'), after = getComputedStyle(node, '::after'), rect = node.getBoundingClientRect()
    return {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      transform: style.transform, translate: style.translate, scale: style.scale,
      background: style.backgroundColor, border: style.borderColor, shadow: style.boxShadow, filter: style.filter, textDecoration: style.textDecorationLine,
      outline: { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor },
      transition: { property: style.transitionProperty, duration: style.transitionDuration },
      animation: { name: style.animationName, duration: style.animationDuration },
      before: { content: before.content, display: before.display, opacity: before.opacity, width: before.width, height: before.height, background: before.background, shadow: before.boxShadow, transitionDuration: before.transitionDuration },
      after: { animationName: after.animationName, animationDuration: after.animationDuration, transform: after.transform },
      hovered: node.matches(':hover'), focused: node.matches(':focus'), focusVisible: node.matches(':focus-visible'),
    }
  })
}

async function settled(page) {
  await page.waitForFunction((selector) => Array.from(document.querySelectorAll(selector)).every((node) => node.getAnimations({ subtree: true }).every((animation) => animation.playState === 'finished' || animation.playState === 'idle')), panelSelector)
}

async function samples(card, buttonSelector = null) {
  return card.evaluate(async (node, targetSelector) => {
    const records = []
    for (let frame = 0; frame < 24; frame += 1) {
      await new Promise(requestAnimationFrame)
      const rect = node.getBoundingClientRect(), button = targetSelector ? node.querySelector(targetSelector) : null
      records.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, transform: getComputedStyle(node).transform, buttonTransform: button ? getComputedStyle(button).transform : null, buttonAfterAnimation: button ? getComputedStyle(button, '::after').animationName : null })
    }
    return records
  }, buttonSelector)
}

const differs = (first, second) => ['background', 'border', 'shadow', 'transform', 'filter', 'textDecoration'].some((key) => first[key] !== second[key]) || first.before.opacity !== second.before.opacity || first.before.shadow !== second.before.shadow
const visibleStripe = (entry) => entry.before.content !== 'none' && entry.before.content !== 'normal' && entry.before.display !== 'none' && Number(entry.before.opacity) > 0 && parseFloat(entry.before.width) <= 8 && parseFloat(entry.before.height) > 20
const identityTransform = (value) => value === 'none' || value === 'matrix(1, 0, 0, 1, 0, 0)'
const stationary = (rect, entries) => entries.every((entry) => ['x', 'y', 'width', 'height'].every((key) => Math.abs(rect[key] - entry[key]) < 0.05) && identityTransform(entry.transform))
const noTransition = (entry) => entry.transition.duration.split(',').every((duration) => parseFloat(duration) === 0)

async function runCase(browser, origin, config) {
  const slug = `${config.mobile ? 'mobile' : 'desktop'}-${config.theme}-${config.motion}`
  const result = { ...config, slug, checks: [], failures: [], calls: [], errors: [], states: {} }
  const check = (condition, name) => { result.checks.push({ name, passed: Boolean(condition) }); if (!condition) result.failures.push(name) }
  const context = await browser.newContext({ viewport: { width: config.mobile ? 390 : 1366, height: config.mobile ? 1000 : 900 }, isMobile: config.mobile, hasTouch: config.mobile, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'Asia/Manila', colorScheme: config.theme, reducedMotion: config.motion, serviceWorkers: 'block' })
  try {
    await context.route('**/*', async (route) => {
      const request = route.request(), url = new URL(request.url())
      if (url.pathname.startsWith('/api/')) {
        result.calls.push({ method: request.method(), pathname: url.pathname })
        if (request.method() === 'GET') await request.frame().page().waitForFunction(() => Array.from(document.querySelectorAll('link[rel="stylesheet"]')).every((link) => link.sheet))
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture(url.pathname)) })
      } else if (url.origin !== origin || url.pathname.startsWith('/visual-fixtures/')) await route.abort('blockedbyclient')
      else await route.continue()
    })
    await context.addInitScript(({ user, theme }) => {
      localStorage.setItem('edumatch_auth_token', 'synthetic-teacher-token')
      localStorage.setItem('edumatch_auth_user', JSON.stringify(user))
      localStorage.setItem('edumatch_teacher_theme', theme)
      const NativeDate = Date, fixed = NativeDate.parse('2026-10-02T04:00:00Z'), started = NativeDate.now()
      globalThis.Date = class extends NativeDate { constructor(...values) { super(...(values.length ? values : [fixed])) } static now() { return fixed + NativeDate.now() - started } }
    }, { user, theme: config.theme })
    const page = await context.newPage()
    page.on('pageerror', (error) => result.errors.push(error.message))
    await page.goto(`${origin}/teacher/records`, { waitUntil: 'domcontentloaded' })
    const card = page.locator(cardSelector)
    await card.waitFor({ state: 'visible' })
    if (await card.count() !== 1) throw new Error('Expected exactly one synthetic lesson card.')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForLoadState('networkidle')
    await settled(page)
    await card.evaluate((node) => {
      const main = node.closest('.teacher-main'), header = document.querySelector('.teacher-main > .top-header')
      main.scrollTop += node.getBoundingClientRect().top - Math.max(0, header.getBoundingClientRect().bottom) - 20
    })
    await page.mouse.move(0, 0)
    await settled(page)
    result.media = await page.evaluate(() => ({ fine: matchMedia('(hover: hover) and (pointer: fine)').matches, coarse: matchMedia('(hover: none) and (pointer: coarse)').matches, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches }))
    check(config.mobile ? result.media.coarse : result.media.fine, 'Expected pointer media is active')
    check(result.media.reduced === (config.motion === 'reduce'), 'Expected reduced-motion media is active')
    result.states.idle = await state(card)
    await page.evaluate(() => {
      globalThis.lessonLayoutShifts = []
      globalThis.lessonShiftObserver = new PerformanceObserver((list) => {
        globalThis.lessonLayoutShifts.push(...list.getEntries().filter((entry) => entry.sources?.some((source) => source.node?.closest?.('#teacherRecordsLessonsPanel'))).map((entry) => ({ value: entry.value, recentInput: entry.hadRecentInput })))
      })
      globalThis.lessonShiftObserver.observe({ type: 'layout-shift', buffered: false })
    })
    const buttonSelectors = ['.lesson-manage-actions button:first-child', '.lesson-manage-actions button:last-child', '.record-link-button', '.record-link-preview']
    if (config.mobile) {
      const heading = card.getByRole('heading', { name: title, exact: true })
      await heading.tap()
      await settled(page)
      result.states.tapped = await state(card)
      check(!differs(result.states.idle, result.states.tapped), 'Coarse-pointer tap does not retain card hover decoration')
      check(stationary(result.states.idle.rect, await samples(card)), 'Coarse-pointer card does not move')
      for (const selector of buttonSelectors) {
        const button = card.locator(selector)
        await page.mouse.move(0, 0); await settled(page)
        const idle = await state(button)
        await button.hover(); await settled(page)
        const hovered = await state(button)
        result.states[selector] = { idle, hovered }
        check(!differs(idle, hovered), `${selector}: no hover-only decoration on coarse pointer`)
      }
    } else {
      await card.hover({ position: { x: 20, y: 20 } })
      const frames = await samples(card)
      await settled(page)
      result.states.hovered = await state(card)
      check(stationary(result.states.idle.rect, frames), 'Card stays stationary throughout hover transition')
      check(differs(result.states.idle, result.states.hovered), 'Fine-pointer card receives a soft hover highlight')
      check(!visibleStripe(result.states.hovered), 'Hover does not reveal a vertical stripe')
      if (config.motion === 'reduce') check(noTransition(result.states.hovered) && result.states.hovered.animation.name === 'none', 'Reduced-motion card has no animation or transition')
      await page.screenshot({ path: path.join(output, `${slug}-card-hover.png`) })
      for (const selector of buttonSelectors) {
        const button = card.locator(selector)
        await card.getByRole('heading', { name: title, exact: true }).click()
        await page.mouse.move(0, 0); await settled(page)
        const idle = await state(button)
        await button.hover()
        const hoverFrames = await samples(card, selector)
        await settled(page)
        const hovered = await state(button)
        const cardBeforePress = await state(card)
        await page.mouse.down()
        const pressFrames = await samples(card, selector)
        await settled(page)
        const pressed = await state(button)
        await page.mouse.move(0, 0)
        await page.mouse.up()
        await settled(page)
        result.states[selector] = { idle, hovered, pressed }
        check(differs(idle, hovered), `${selector}: subtle hover feedback exists`)
        check(differs(hovered, pressed), `${selector}: pressed feedback exists`)
        check(stationary(result.states.idle.rect, hoverFrames) && stationary(cardBeforePress.rect, pressFrames), `${selector}: parent card has no hover/press movement`)
        if (config.motion === 'reduce') check(noTransition(hovered) && [...hoverFrames, ...pressFrames].every((entry) => identityTransform(entry.buttonTransform) && entry.buttonAfterAnimation === 'none'), `${selector}: reduced-motion has no transition, transform, or pseudo animation`)
      }
      await card.getByRole('heading', { name: title, exact: true }).click()
      await page.mouse.move(0, 0); await settled(page)
      const unfocused = await state(card)
      await page.getByRole('combobox', { name: 'Sort lessons', exact: true }).focus()
      await page.keyboard.press('Tab')
      await settled(page)
      const edit = card.getByRole('button', { name: 'Edit', exact: true })
      result.states.keyboardButton = await state(edit)
      result.states.keyboardCard = await state(card)
      check(result.states.keyboardButton.focusVisible, 'Keyboard navigation visibly focuses Edit')
      check(result.states.keyboardButton.outline.style !== 'none' && parseFloat(result.states.keyboardButton.outline.width) > 0, 'Keyboard focus has a visible outline')
      check(differs(unfocused, result.states.keyboardCard), 'Keyboard focus also highlights the parent lesson card')
      check(identityTransform(result.states.keyboardCard.transform) && !visibleStripe(result.states.keyboardCard), 'Focused parent card stays still without a stripe')
      await page.screenshot({ path: path.join(output, `${slug}-keyboard-focus.png`) })
    }
    result.layoutShifts = await page.evaluate(() => { globalThis.lessonShiftObserver.disconnect(); return globalThis.lessonLayoutShifts })
    check(result.layoutShifts.length === 0, 'Hover/focus interactions cause no lesson layout-shift events')
    check(result.errors.length === 0, 'No browser application errors')
    check(!result.calls.some((call) => call.method !== 'GET' && call.pathname !== '/api/auth/presence'), 'No mutation requests')
    result.passed = result.failures.length === 0
  } catch (error) { result.passed = false; result.error = error.stack || String(error) }
  finally { await context.close() }
  return result
}

let browser, server
try {
  await mkdir(output, { recursive: true })
  server = await createServer({ root: frontend, configFile: false, envFile: false, logLevel: 'error', plugins: [vue(), tailwindcss()], cacheDir: path.join(output, 'vite'), define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api'), 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://visual.invalid'), 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('synthetic-key') }, resolve: { alias: { '@': path.join(frontend, 'src') } }, server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [frontend] } } })
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  for (const config of cases) {
    const result = await runCase(browser, origin, config)
    report.cases.push(result)
    await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.slug}${result.error ? `: ${result.error.split('\n')[0]}` : result.failures.length ? `: ${result.failures.join('; ')}` : ` (${result.checks.length} checks)`}`)
  }
  report.summary = { total: report.cases.length, passed: report.cases.filter((item) => item.passed).length, failed: report.cases.filter((item) => !item.passed).length }
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report.summary))
  if (report.summary.failed) process.exitCode = 1
} finally { await browser?.close(); await server?.close() }
