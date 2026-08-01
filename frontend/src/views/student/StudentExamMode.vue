<template>
  <div class="exam-mode" :class="{ 'exam-paused': isPaused, 'exam-obscured': isExamObscured }">
    <header class="exam-topbar">
      <div class="exam-brand">
        <span class="exam-brand-icon" aria-hidden="true"><i class="fas fa-file-shield"></i></span>
        <div class="exam-meta">
          <span class="secure-label"><i class="fas fa-lock" aria-hidden="true"></i> Secure assessment</span>
          <h1>{{ assessment.title || 'Assessment Exam' }}</h1>
          <p>{{ formatLabel(assessment.examType) }} <span>•</span> {{ formatLabel(assessment.difficulty) }} <span>•</span> {{ assessment.questions.length }} questions</p>
        </div>
      </div>
      <div class="exam-status">
        <div class="status-card timer" :class="{ danger: remainingSeconds <= 60 }">
          <i class="fas fa-clock" aria-hidden="true"></i>
          <span>Time left<strong>{{ formatDuration(remainingSeconds) }}</strong></span>
        </div>
        <div class="status-card violations" :class="{ warning: violationCount > 0 }">
          <i class="fas fa-shield-halved" aria-hidden="true"></i>
          <span>Violations<strong>{{ violationCount }} / {{ maxViolations }}</strong></span>
        </div>
      </div>
    </header>

    <section v-if="notice.message" class="exam-notice" :class="notice.type" role="status">
      <i class="fas" :class="notice.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'" aria-hidden="true"></i>
      <span>{{ notice.message }}</span>
    </section>

    <section v-if="isLoading" class="exam-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Preparing secure exam environment...</span>
    </section>

    <main v-else class="exam-layout">
      <aside class="question-sidebar" aria-label="Question navigator">
        <div class="progress-summary">
          <div class="progress-summary-head">
            <div><span>Your progress</span><strong>{{ answeredCount }} of {{ assessment.questions.length }}</strong></div>
            <b>{{ progressPercentage }}%</b>
          </div>
          <div class="progress-track" aria-hidden="true"><span :style="{ width: `${progressPercentage}%` }"></span></div>
          <small>{{ unansweredQuestionIndexes.length }} unanswered</small>
        </div>

        <div class="question-nav-head"><h2>Questions</h2><span>Select a number to jump</span></div>
        <div class="question-grid">
          <button
            v-for="(_question, index) in assessment.questions"
            :key="`nav-${index}`"
            type="button"
            class="question-number"
            :class="{ current: currentQuestionIndex === index, answered: isQuestionAnswered(questionOrder[index]) }"
            :aria-label="`Question ${index + 1}${isQuestionAnswered(questionOrder[index]) ? ', answered' : ', unanswered'}`"
            :aria-current="currentQuestionIndex === index ? 'step' : undefined"
            @click="goToQuestion(index)"
          >{{ index + 1 }}</button>
        </div>
        <div class="question-legend">
          <span><i class="legend-dot current"></i> Current</span>
          <span><i class="legend-dot answered"></i> Answered</span>
          <span><i class="legend-dot"></i> Unanswered</span>
        </div>
        <div class="integrity-reminder">
          <i class="fas fa-shield-halved" aria-hidden="true"></i>
          <div><strong>Stay on this screen</strong><span>Switching tabs, Alt+Tab, or leaving full screen is automatically recorded.</span></div>
        </div>
        <button type="button" class="btn fullscreen-btn" @click="requestExamFullscreen"><i class="fas fa-expand" aria-hidden="true"></i> Enter full screen</button>
      </aside>

      <section class="question-workspace" aria-live="polite">
        <div class="exam-watermark" aria-hidden="true">
          <span v-for="watermarkIndex in 12" :key="`watermark-${watermarkIndex}`">{{ watermarkLabel }}</span>
        </div>
        <article v-if="currentQuestion" class="exam-question">
          <header class="question-header">
            <div><span class="question-kicker">Question {{ currentQuestionIndex + 1 }} of {{ assessment.questions.length }}</span><span class="question-type">{{ formatLabel(currentQuestion.type || 'Written response') }}</span></div>
            <span class="answer-state" :class="{ answered: isQuestionAnswered(currentOriginalQuestionIndex) }">
              <i class="fas" :class="isQuestionAnswered(currentOriginalQuestionIndex) ? 'fa-circle-check' : 'fa-circle'" aria-hidden="true"></i>
              {{ isQuestionAnswered(currentOriginalQuestionIndex) ? 'Answered' : 'Not answered' }}
            </span>
          </header>

          <h2>{{ currentQuestion.questionText || 'Question text unavailable.' }}</h2>

          <div v-if="isChoiceType(currentQuestion.type)" class="answer-group choice-group">
            <label
              v-for="(option, optionIndex) in displayedOptions(currentQuestion, currentOriginalQuestionIndex)"
              :key="`q-${currentQuestionIndex}-o-${optionIndex}`"
              class="option"
              :class="{ selected: answers[currentOriginalQuestionIndex] === option }"
            >
              <input type="radio" :name="`question-${currentOriginalQuestionIndex}`" :value="option" :checked="answers[currentOriginalQuestionIndex] === option" @change="setAnswer(currentOriginalQuestionIndex, option)" />
              <span class="option-letter">{{ optionLabel(optionIndex) }}</span>
              <span class="option-copy">{{ option }}</span>
              <i class="fas fa-circle-check option-check" aria-hidden="true"></i>
            </label>
          </div>

          <div v-else class="answer-group written-answer">
            <label :for="`written-answer-${currentOriginalQuestionIndex}`">Your answer</label>
            <textarea :id="`written-answer-${currentOriginalQuestionIndex}`" :value="answers[currentOriginalQuestionIndex] || ''" rows="7" placeholder="Write your answer clearly here..." @input="setAnswer(currentOriginalQuestionIndex, $event.target.value)"></textarea>
            <small>Your answer is saved automatically while the exam is active.</small>
          </div>
        </article>

        <footer class="question-actions">
          <button type="button" class="btn navigation-btn" :disabled="currentQuestionIndex === 0" @click="previousQuestion"><i class="fas fa-arrow-left" aria-hidden="true"></i> Previous</button>
          <span class="save-state"><i class="fas fa-cloud-arrow-up" aria-hidden="true"></i> {{ isDirty ? 'Saving soon…' : 'Progress saved' }}</span>
          <button v-if="!isLastQuestion" type="button" class="btn next-btn" @click="nextQuestion">Next question <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
          <button v-else type="button" class="btn review-btn" @click="showSubmitReview = true">Review &amp; submit <i class="fas fa-check" aria-hidden="true"></i></button>
        </footer>
      </section>
    </main>

    <div v-if="showSubmitReview" class="submit-overlay" role="dialog" aria-modal="true" aria-labelledby="submit-review-title">
      <div class="submit-review-card">
        <span class="review-icon" :class="{ complete: unansweredQuestionIndexes.length === 0 }"><i class="fas" :class="unansweredQuestionIndexes.length === 0 ? 'fa-circle-check' : 'fa-clipboard-question'"></i></span>
        <span class="review-eyebrow">Final check</span>
        <h2 id="submit-review-title">Ready to submit?</h2>
        <p v-if="unansweredQuestionIndexes.length">You still have <strong>{{ unansweredQuestionIndexes.length }}</strong> unanswered {{ unansweredQuestionIndexes.length === 1 ? 'question' : 'questions' }}. You can return and complete them before submitting.</p>
        <p v-else>All questions have an answer. Once submitted, you cannot change your responses.</p>
        <div class="review-summary">
          <span><i class="fas fa-circle-check"></i><strong>{{ answeredCount }}</strong> answered</span>
          <span><i class="fas fa-circle-question"></i><strong>{{ unansweredQuestionIndexes.length }}</strong> unanswered</span>
        </div>
        <div class="review-actions">
          <button type="button" class="btn navigation-btn" @click="showSubmitReview = false">Keep reviewing</button>
          <button type="button" class="btn submit-btn" :disabled="isSubmitting || hasFinalized" @click="submitExam('manual_submit')"><i class="fas" :class="isSubmitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i> {{ isSubmitting ? 'Submitting…' : 'Submit assessment' }}</button>
        </div>
      </div>
    </div>

    <div v-if="isExamObscured" class="focus-protection" aria-live="assertive">
      <span><i class="fas fa-eye-slash" aria-hidden="true"></i></span>
      <h2>Exam content protected</h2>
      <p>The exam was hidden because this window lost focus. A violation was automatically recorded.</p>
    </div>

    <div v-if="isPaused" class="pause-overlay">
      <div class="pause-card">
        <span class="pause-icon"><i class="fas fa-pause"></i></span>
        <h2>Exam paused</h2>
        <p>Academic integrity rule triggered. You can continue in {{ pauseRemaining }} seconds.</p>
        <strong>{{ pauseRemaining }}</strong>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'

export default {
  name: 'StudentExamMode',
  data() {
    return {
      assessment: {
        id: '',
        title: '',
        examType: '',
        difficulty: '',
        questions: [],
      },
      answers: [],
      isLoading: true,
      isSubmitting: false,
      hasFinalized: false,
      isDirty: false,
      currentQuestionIndex: 0,
      showSubmitReview: false,
      questionOrder: [],
      shuffledOptionsByQuestion: {},
      authStore: null,
      sessionId: '',
      nowMs: Date.now(),
      expiresAtMs: 0,
      violationCount: 0,
      maxViolations: 3,
      violationAction: 'auto-submit',
      notice: {
        type: '',
        message: '',
      },
      autosaveTimer: null,
      clockTimer: null,
      guardHandlers: null,
      lastActivityLogAt: {},
      isPaused: false,
      pauseUntilMs: 0,
      focusViolationActive: false,
      focusViolationResetTimer: null,
      isExamObscured: false,
    }
  },
  computed: {
    assessmentId() {
      return String(this.$route.params.assessmentId || '').trim()
    },
    remainingSeconds() {
      if (!this.expiresAtMs) return 0
      return Math.max(0, Math.floor((this.expiresAtMs - this.nowMs) / 1000))
    },
    pauseRemaining() {
      if (!this.isPaused) return 0
      return Math.max(0, Math.ceil((this.pauseUntilMs - this.nowMs) / 1000))
    },
    currentQuestion() {
      return this.assessment.questions[this.currentOriginalQuestionIndex] || null
    },
    currentOriginalQuestionIndex() {
      const mappedIndex = this.questionOrder[this.currentQuestionIndex]
      return Number.isInteger(mappedIndex) ? mappedIndex : this.currentQuestionIndex
    },
    answeredCount() {
      return this.answers.filter((answer) => String(answer || '').trim()).length
    },
    unansweredQuestionIndexes() {
      return this.assessment.questions
        .map((_question, index) => index)
        .filter((index) => !this.isQuestionAnswered(index))
    },
    progressPercentage() {
      const total = this.assessment.questions.length
      if (!total) return 0
      return Math.round((this.answeredCount / total) * 100)
    },
    isLastQuestion() {
      return this.currentQuestionIndex >= Math.max(0, this.assessment.questions.length - 1)
    },
    watermarkLabel() {
      const user = this.authStore?.user || {}
      const studentName = String(user.name || user.fullName || 'EduMatch Student').trim()
      const studentId = String(user.studentId || user.lrn || user.id || user._id || '').trim()
      const timeLabel = new Intl.DateTimeFormat('en-US', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(new Date(this.nowMs))
      return [studentName, studentId ? `ID ${studentId.slice(-8)}` : '', timeLabel].filter(Boolean).join(' • ')
    },
  },
  methods: {
    resolveApiBaseUrl() {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      if (configured.endsWith('/api')) return configured
      return `${configured}/api`
    },
    getAuthConfig() {
      const token = localStorage.getItem('edumatch_auth_token') || ''
      return {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    },
    formatLabel(value) {
      return String(value || '')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    },
    formatDuration(totalSeconds) {
      const safe = Math.max(0, Number(totalSeconds || 0))
      const minutes = Math.floor(safe / 60)
      const seconds = safe % 60
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    },
    isChoiceType(type) {
      const normalized = String(type || '').trim().toLowerCase()
      return normalized === 'multiple-choice' || normalized === 'true-false'
    },
    normalizedOptions(question) {
      const options = Array.isArray(question?.options) ? question.options.filter(Boolean) : []
      if (options.length > 0) return options
      if (String(question?.type || '').toLowerCase() === 'true-false') return ['True', 'False']
      return []
    },
    hashSeed(value) {
      let hash = 2166136261
      const input = String(value || '')
      for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
      }
      return hash >>> 0
    },
    seededShuffle(items, seedValue) {
      const shuffled = [...items]
      let seed = this.hashSeed(seedValue) || 1
      const random = () => {
        seed += 0x6D2B79F5
        let value = seed
        value = Math.imul(value ^ (value >>> 15), value | 1)
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296
      }
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const target = Math.floor(random() * (index + 1))
        const current = shuffled[index]
        shuffled[index] = shuffled[target]
        shuffled[target] = current
      }
      return shuffled
    },
    prepareRandomizedExam() {
      const sessionSeed = this.sessionId || this.assessmentId
      const questionIndices = this.assessment.questions.map((_question, index) => index)
      this.questionOrder = this.seededShuffle(questionIndices, `${sessionSeed}:questions`)
      this.shuffledOptionsByQuestion = this.assessment.questions.reduce((result, question, index) => {
        const options = this.normalizedOptions(question)
        result[index] = this.seededShuffle(options, `${sessionSeed}:question:${index}:options`)
        return result
      }, {})
      this.currentQuestionIndex = 0
    },
    displayedOptions(question, originalIndex) {
      const stored = this.shuffledOptionsByQuestion[originalIndex]
      return Array.isArray(stored) && stored.length ? stored : this.normalizedOptions(question)
    },
    optionLabel(index) {
      return String.fromCharCode(65 + Number(index || 0))
    },
    isQuestionAnswered(index) {
      return Boolean(String(this.answers[index] || '').trim())
    },
    goToQuestion(index) {
      if (this.isPaused || this.hasFinalized) return
      const nextIndex = Number(index)
      if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= this.assessment.questions.length) return
      this.currentQuestionIndex = nextIndex
    },
    previousQuestion() {
      this.goToQuestion(this.currentQuestionIndex - 1)
    },
    nextQuestion() {
      this.goToQuestion(this.currentQuestionIndex + 1)
    },
    setAnswer(index, value) {
      if (this.hasFinalized || this.isPaused) return
      if (!Number.isInteger(index) || index < 0) return
      this.answers.splice(index, 1, String(value || ''))
      this.isDirty = true
    },
    buildAnswersPayload() {
      return this.assessment.questions.map((_, index) => ({
        questionIndex: index,
        answer: String(this.answers[index] || ''),
      }))
    },
    showNotice(type, message) {
      this.notice = { type, message: String(message || '').trim() }
    },
    async requestExamFullscreen() {
      try {
        if (document.fullscreenElement) return
        await document.documentElement.requestFullscreen()
      } catch (_error) {
        this.showNotice('error', 'Unable to enter full-screen automatically. Please enable full-screen manually.')
      }
    },
    async startExamSession() {
      const apiBaseUrl = this.resolveApiBaseUrl()
      const response = await axios.post(
        `${apiBaseUrl}/student/assessments/${this.assessmentId}/start`,
        {},
        this.getAuthConfig()
      )
      const payload = response.data || {}
      if (payload.submission && !payload.session) {
        this.hasFinalized = true
        this.showNotice('error', 'Your previous session was auto-submitted due to timer expiration.')
        return
      }

      const assessment = payload.assessment || {}
      const session = payload.session || {}
      const questions = Array.isArray(assessment.questions) ? assessment.questions : []
      const sessionAnswers = Array.isArray(session.answers) ? session.answers : []
      const restored = Array.from({ length: questions.length }, () => '')
      sessionAnswers.forEach((item) => {
        if (item && Number.isInteger(item.questionIndex)) {
          restored[item.questionIndex] = String(item.answer || '')
        }
      })

      this.assessment = {
        id: String(assessment._id || assessment.id || this.assessmentId),
        title: String(assessment.title || 'Assessment'),
        examType: String(assessment.examType || ''),
        difficulty: String(assessment.difficulty || ''),
        questions,
      }
      this.answers = restored
      this.sessionId = String(session.id || '')
      this.expiresAtMs = session.expiresAt ? new Date(session.expiresAt).getTime() : 0
      this.violationCount = Number(session.violationCount || 0)
      this.maxViolations = Number(session.maxViolations || 3)
      this.violationAction = String(session.violationAction || 'auto-submit')
      this.nowMs = Date.now()
      this.prepareRandomizedExam()
    },
    async saveProgress() {
      if (!this.isDirty || this.hasFinalized || this.isPaused) return
      try {
        const apiBaseUrl = this.resolveApiBaseUrl()
        await axios.patch(
          `${apiBaseUrl}/student/assessments/${this.assessmentId}/progress`,
          { answers: this.buildAnswersPayload() },
          this.getAuthConfig()
        )
        this.isDirty = false
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to auto-save exam progress.'
        this.showNotice('error', message)
        const submission = error.response?.data?.details?.submission
        if (submission) {
          this.hasFinalized = true
          this.cleanupExamGuards()
          this.redirectToActivitiesAfterDelay()
        }
      }
    },
    async logActivity(type, message, metadata = {}) {
      if (this.hasFinalized || !this.assessmentId) return null
      const now = Date.now()
      const last = Number(this.lastActivityLogAt[type] || 0)
      if (now - last < 1200) return null
      this.lastActivityLogAt[type] = now
      try {
        const apiBaseUrl = this.resolveApiBaseUrl()
        const response = await axios.post(
          `${apiBaseUrl}/student/assessments/${this.assessmentId}/activity`,
          { type, message, metadata },
          this.getAuthConfig()
        )
        const payload = response.data || {}
        this.violationCount = Number(payload.violationCount || this.violationCount)
        if (['tab_hidden', 'window_blur', 'fullscreen_exit'].includes(type) && !payload.submission) {
          this.showNotice('error', `Academic integrity violation recorded (${this.violationCount}/${payload.maxViolations || this.maxViolations}).`)
        }
        if (payload.ruleTriggered && payload.actionTaken === 'pause') {
          const pauseSeconds = Math.max(1, Number(payload.pauseSeconds || 15))
          this.isPaused = true
          this.pauseUntilMs = Date.now() + (pauseSeconds * 1000)
          this.showNotice('error', `Exam paused for ${pauseSeconds} seconds due to rule violation.`)
        }
        if (payload.submission) {
          this.hasFinalized = true
          this.cleanupExamGuards()
          this.showNotice('error', 'Exam session ended due to integrity rule violation.')
          this.redirectToActivitiesAfterDelay()
        }
        return payload
      } catch (_error) {
        return null
      }
    },
    async submitExam(reason = 'manual_submit') {
      if (this.hasFinalized || this.isSubmitting) return
      this.isSubmitting = true
      this.showSubmitReview = false
      try {
        await this.saveProgress()
        const apiBaseUrl = this.resolveApiBaseUrl()
        const response = await axios.post(
          `${apiBaseUrl}/student/assessments/${this.assessmentId}/submissions`,
          { answers: this.buildAnswersPayload(), reason },
          this.getAuthConfig()
        )
        const payload = response.data || {}
        this.hasFinalized = true
        this.cleanupExamGuards()
        const submission = payload.submission || {}
        const status = String(submission.status || '').toLowerCase()
        if (status === 'completed') {
          this.showNotice('success', `Assessment submitted successfully. Score: ${submission.score || 0}/${submission.totalPoints || 0}.`)
        } else {
          this.showNotice('error', 'Exam was auto-submitted by the system.')
        }
        this.redirectToActivitiesAfterDelay()
      } catch (error) {
        this.showNotice('error', error.response?.data?.message || 'Failed to submit assessment.')
      } finally {
        this.isSubmitting = false
      }
    },
    redirectToActivitiesAfterDelay() {
      window.setTimeout(() => {
        this.$router.push('/student/activities')
      }, 1800)
    },
    async handleTimeTick() {
      this.nowMs = Date.now()
      if (this.isPaused && this.nowMs >= this.pauseUntilMs) {
        this.isPaused = false
        this.pauseUntilMs = 0
        this.showNotice('success', 'Exam resumed.')
      }
      if (!this.hasFinalized && this.remainingSeconds <= 0 && this.expiresAtMs > 0) {
        await this.logActivity('timer_expired', 'Timer expired during exam session.')
        await this.submitExam('timer_expired')
      }
    },
    createSecurityHandlers() {
      const blockAndLog = async (event, type, message) => {
        event.preventDefault()
        await this.logActivity(type, `${message} at ${new Date().toLocaleTimeString()}`)
      }

      const recordFocusViolation = async (source) => {
        if (this.focusViolationActive || this.hasFinalized) return
        this.focusViolationActive = true
        this.isExamObscured = true
        await this.logActivity(
          'tab_hidden',
          `Exam focus lost (${source}) at ${new Date().toLocaleTimeString()}`,
          { source }
        )
      }
      const onVisibilityChange = async () => {
        if (document.visibilityState === 'hidden') {
          await recordFocusViolation('tab_switch')
        } else if (document.hasFocus()) {
          onWindowFocus()
        }
      }
      const onWindowBlur = async () => {
        await recordFocusViolation('window_blur_or_alt_tab')
      }
      const onWindowFocus = () => {
        if (this.focusViolationResetTimer) window.clearTimeout(this.focusViolationResetTimer)
        this.focusViolationResetTimer = window.setTimeout(() => {
          this.focusViolationActive = false
          this.isExamObscured = false
          this.focusViolationResetTimer = null
        }, 500)
      }
      const onFullscreenChange = async () => {
        if (!document.fullscreenElement && !this.hasFinalized) {
          if (!this.focusViolationActive && document.visibilityState === 'visible') {
            this.focusViolationActive = true
            this.isExamObscured = true
            await this.logActivity('fullscreen_exit', `Full-screen exit detected at ${new Date().toLocaleTimeString()}`)
            if (this.focusViolationResetTimer) window.clearTimeout(this.focusViolationResetTimer)
            this.focusViolationResetTimer = window.setTimeout(() => {
              this.focusViolationActive = false
              this.isExamObscured = false
              this.focusViolationResetTimer = null
            }, 1000)
          }
        }
      }
      const onKeyDown = async (event) => {
        const key = String(event.key || '').toLowerCase()
        const isAltTab = event.altKey && key === 'tab'
        const isModifier = event.ctrlKey || event.metaKey
        const inspectionCombo = isModifier && (
          ['c', 'v', 'a', 'x', 's', 'p', 'u', 'i', 'j', 'k'].includes(key)
          || (event.shiftKey && ['i', 'j', 'c', 'k'].includes(key))
        )
        const isInspectionKey = key === 'f12'

        if (isAltTab) {
          await recordFocusViolation('alt_tab')
          return
        }
        if (inspectionCombo || isInspectionKey) {
          await blockAndLog(event, 'inspection_shortcut', 'Blocked keyboard shortcut')
          return
        }
      }
      const onBeforeUnload = (event) => {
        if (this.hasFinalized) return
        event.preventDefault()
        event.returnValue = ''
      }
      const onContextMenu = async (event) => {
        await blockAndLog(event, 'contextmenu_attempt', 'Right-click blocked')
      }
      const onCopy = async (event) => {
        await blockAndLog(event, 'copy_attempt', 'Copy blocked')
      }
      const onPaste = async (event) => {
        await blockAndLog(event, 'paste_attempt', 'Paste blocked')
      }
      const onCut = async (event) => {
        await blockAndLog(event, 'copy_attempt', 'Cut blocked')
      }
      const onSelectStart = async (event) => {
        await blockAndLog(event, 'copy_attempt', 'Text selection blocked')
      }

      return {
        onVisibilityChange,
        onWindowBlur,
        onWindowFocus,
        onFullscreenChange,
        onKeyDown,
        onBeforeUnload,
        onContextMenu,
        onCopy,
        onPaste,
        onCut,
        onSelectStart,
      }
    },
    applyExamGuards() {
      this.guardHandlers = this.createSecurityHandlers()
      const h = this.guardHandlers
      document.addEventListener('visibilitychange', h.onVisibilityChange)
      window.addEventListener('blur', h.onWindowBlur)
      window.addEventListener('focus', h.onWindowFocus)
      document.addEventListener('fullscreenchange', h.onFullscreenChange)
      document.addEventListener('keydown', h.onKeyDown)
      window.addEventListener('beforeunload', h.onBeforeUnload)
      document.addEventListener('contextmenu', h.onContextMenu)
      document.addEventListener('copy', h.onCopy)
      document.addEventListener('paste', h.onPaste)
      document.addEventListener('cut', h.onCut)
      document.addEventListener('selectstart', h.onSelectStart)
      document.body.classList.add('exam-mode-active')
    },
    cleanupExamGuards() {
      if (this.autosaveTimer) {
        window.clearInterval(this.autosaveTimer)
        this.autosaveTimer = null
      }
      if (this.clockTimer) {
        window.clearInterval(this.clockTimer)
        this.clockTimer = null
      }
      if (this.guardHandlers) {
        const h = this.guardHandlers
        document.removeEventListener('visibilitychange', h.onVisibilityChange)
        window.removeEventListener('blur', h.onWindowBlur)
        window.removeEventListener('focus', h.onWindowFocus)
        document.removeEventListener('fullscreenchange', h.onFullscreenChange)
        document.removeEventListener('keydown', h.onKeyDown)
        window.removeEventListener('beforeunload', h.onBeforeUnload)
        document.removeEventListener('contextmenu', h.onContextMenu)
        document.removeEventListener('copy', h.onCopy)
        document.removeEventListener('paste', h.onPaste)
        document.removeEventListener('cut', h.onCut)
        document.removeEventListener('selectstart', h.onSelectStart)
      }
      this.guardHandlers = null
      if (this.focusViolationResetTimer) {
        window.clearTimeout(this.focusViolationResetTimer)
        this.focusViolationResetTimer = null
      }
      this.focusViolationActive = false
      this.isExamObscured = false
      document.body.classList.remove('exam-mode-active')
    },
    async initializeExam() {
      if (!this.assessmentId) {
        this.showNotice('error', 'Invalid assessment identifier.')
        this.isLoading = false
        return
      }
      try {
        await this.startExamSession()
        if (this.hasFinalized) {
          this.isLoading = false
          this.redirectToActivitiesAfterDelay()
          return
        }
        await this.requestExamFullscreen()
        this.applyExamGuards()
        this.clockTimer = window.setInterval(() => {
          this.handleTimeTick()
        }, 1000)
        this.autosaveTimer = window.setInterval(() => {
          this.saveProgress()
        }, 10000)
      } catch (error) {
        this.showNotice('error', error.response?.data?.message || 'Failed to start exam session.')
        window.setTimeout(() => {
          this.$router.push('/student/activities')
        }, 1800)
      } finally {
        this.isLoading = false
      }
    },
  },
  async mounted() {
    this.authStore = useAuthStore()
    await this.initializeExam()
  },
  beforeUnmount() {
    this.cleanupExamGuards()
  },
  beforeRouteLeave(_to, _from, next) {
    if (this.hasFinalized) {
      next()
      return
    }
    this.logActivity('navigation_attempt', `Navigation attempt blocked at ${new Date().toLocaleTimeString()}`)
    this.showNotice('error', 'Navigation is blocked while exam is active.')
    next(false)
  },
}
</script>

<style scoped>
.exam-mode {
  --exam-top-offset: max(env(safe-area-inset-top), 0.5rem);
  --exam-topbar-z: 120;
  min-height: 100vh;
  background: #f1f5f9;
  padding: 0.85rem 1.2rem 1.5rem;
  scroll-behavior: smooth;
  scroll-padding-top: calc(var(--exam-top-offset) + 7rem);
  user-select: none;
}

.exam-topbar {
  position: sticky;
  top: var(--exam-top-offset);
  z-index: var(--exam-topbar-z);
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  background: #0f172a;
  color: #ffffff;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  margin-bottom: 1rem;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.18);
}

.exam-meta h1 {
  margin: 0;
  font-size: 1.18rem;
}

.exam-meta p {
  margin: 0.28rem 0 0;
  color: #cbd5e1;
  font-size: 0.84rem;
}

.exam-status {
  display: flex;
  gap: 0.7rem;
}

.status-card {
  min-width: 120px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  padding: 0.5rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.status-card span {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #cbd5e1;
}

.status-card strong {
  font-size: 1rem;
}

.status-card.timer.danger {
  background: rgba(239, 68, 68, 0.26);
}

.exam-notice {
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
  font-weight: 600;
  margin-bottom: 0.9rem;
}

.exam-notice.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.exam-notice.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.exam-loading {
  min-height: 45vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: #334155;
  font-weight: 700;
}

.exam-content {
  display: grid;
  gap: 0.75rem;
}

.exam-question {
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #ffffff;
  padding: 0.82rem 0.85rem;
}

.exam-question h3 {
  margin: 0 0 0.42rem;
  font-size: 0.92rem;
}

.exam-question p {
  margin: 0;
  color: #334155;
  font-size: 0.86rem;
}

.answer-group {
  margin-top: 0.62rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  color: #0f172a;
  font-size: 0.85rem;
}

textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.6rem 0.66rem;
  font-size: 0.84rem;
  font-family: inherit;
  user-select: none;
}

.exam-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
  background: #f1f5f9;
  padding: 0.78rem 0 0.15rem;
}

.btn {
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-weight: 700;
  font-size: 0.83rem;
  padding: 0.55rem 0.78rem;
  cursor: pointer;
}

.fullscreen-btn {
  background: #ffffff;
  color: #1e293b;
}

.submit-btn {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.pause-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 6000;
}

.pause-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 1rem;
  width: min(92vw, 420px);
  text-align: center;
}

.pause-card h2 {
  margin: 0 0 0.4rem;
}

@media (max-width: 900px) {
  .exam-mode {
    --exam-top-offset: max(env(safe-area-inset-top), 0.35rem);
    padding: 0.65rem 0.75rem 1.2rem;
    scroll-padding-top: calc(var(--exam-top-offset) + 8.8rem);
  }

  .exam-topbar {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.82rem 0.9rem;
  }

  .exam-status {
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .status-card {
    flex: 1;
    min-width: 0;
  }
}

/* Focused exam workspace */
.exam-mode {
  --exam-blue: #2563eb;
  --exam-blue-dark: #1d4ed8;
  --exam-ink: #0f172a;
  --exam-muted: #64748b;
  --exam-border: #dbe4ef;
  min-height: 100vh;
  padding: 1rem clamp(0.8rem, 2vw, 1.5rem) 1.5rem;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.07), transparent 28rem),
    #f4f7fb;
}

.exam-topbar {
  align-items: center;
  padding: 0.9rem 1rem;
  margin: 0 auto 1rem;
  max-width: 1440px;
  border: 1px solid var(--exam-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--exam-ink);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
}

.exam-brand {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.exam-brand-icon {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  color: var(--exam-blue-dark);
  font-size: 1rem;
}

.exam-meta {
  min-width: 0;
}

.secure-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.15rem;
  color: #047857;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.exam-meta h1 {
  overflow: hidden;
  color: var(--exam-ink);
  font-size: 1.05rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exam-meta p {
  margin-top: 0.2rem;
  color: var(--exam-muted);
  font-size: 0.75rem;
}

.exam-meta p span {
  padding: 0 0.18rem;
  color: #cbd5e1;
}

.exam-status {
  flex: 0 0 auto;
  gap: 0.55rem;
}

.status-card {
  min-width: 126px;
  padding: 0.52rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.55rem;
  background: #f8fafc;
  color: var(--exam-ink);
}

.status-card > i {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  color: var(--exam-blue-dark);
  font-size: 0.8rem;
}

.status-card span {
  display: grid;
  color: var(--exam-muted);
  font-size: 0.61rem;
  line-height: 1.2;
}

.status-card strong {
  margin-top: 0.1rem;
  color: var(--exam-ink);
  font-size: 0.92rem;
  letter-spacing: 0.02em;
}

.status-card.timer.danger,
.status-card.violations.warning {
  border-color: #fecaca;
  background: #fff7f7;
}

.status-card.timer.danger > i,
.status-card.violations.warning > i {
  background: #fee2e2;
  color: #dc2626;
}

.exam-notice {
  position: sticky;
  top: calc(var(--exam-top-offset) + 5.7rem);
  z-index: 110;
  max-width: 1440px;
  margin: 0 auto 0.8rem;
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.82rem;
}

.exam-loading {
  min-height: 55vh;
}

.exam-layout {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.question-sidebar {
  position: sticky;
  top: calc(var(--exam-top-offset) + 6.4rem);
  max-height: calc(100vh - 7.5rem);
  overflow-y: auto;
  border: 1px solid var(--exam-border);
  border-radius: 18px;
  padding: 1rem;
  display: grid;
  gap: 1rem;
  background: #fff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.progress-summary {
  padding: 0.85rem;
  border-radius: 15px;
  background: #eff6ff;
}

.progress-summary-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}

.progress-summary-head div {
  display: grid;
  gap: 0.12rem;
}

.progress-summary-head span,
.progress-summary small {
  color: #64748b;
  font-size: 0.68rem;
}

.progress-summary-head strong {
  color: var(--exam-ink);
  font-size: 0.88rem;
}

.progress-summary-head b {
  color: var(--exam-blue-dark);
  font-size: 0.92rem;
}

.progress-track {
  height: 7px;
  margin: 0.65rem 0 0.42rem;
  overflow: hidden;
  border-radius: 99px;
  background: #dbeafe;
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--exam-blue-dark), #60a5fa);
  transition: width 0.25s ease;
}

.question-nav-head h2 {
  margin: 0;
  color: var(--exam-ink);
  font-size: 0.92rem;
}

.question-nav-head span {
  color: var(--exam-muted);
  font-size: 0.68rem;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.42rem;
}

.question-number {
  aspect-ratio: 1;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: #fff;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.question-number:hover,
.question-number:focus-visible {
  border-color: #60a5fa;
  outline: none;
}

.question-number.answered {
  border-color: #86efac;
  background: #dcfce7;
  color: #166534;
}

.question-number.current {
  border-color: var(--exam-blue);
  background: var(--exam-blue);
  color: #fff;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.24);
}

.question-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.7rem;
  color: var(--exam-muted);
  font-size: 0.62rem;
}

.question-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  background: #fff;
}

.legend-dot.current {
  border-color: var(--exam-blue);
  background: var(--exam-blue);
}

.legend-dot.answered {
  border-color: #86efac;
  background: #dcfce7;
}

.integrity-reminder {
  padding: 0.8rem;
  border: 1px solid #fde68a;
  border-radius: 14px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  background: #fffbeb;
  color: #92400e;
}

.integrity-reminder > i {
  margin-top: 0.15rem;
}

.integrity-reminder div {
  display: grid;
  gap: 0.2rem;
}

.integrity-reminder strong {
  font-size: 0.72rem;
}

.integrity-reminder span {
  font-size: 0.65rem;
  line-height: 1.45;
}

.question-sidebar .fullscreen-btn {
  width: 100%;
}

.question-workspace {
  position: relative;
  min-width: 0;
  min-height: calc(100vh - 8rem);
  border: 1px solid var(--exam-border);
  border-radius: 20px;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  background: #fff;
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.065);
}

.exam-watermark {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  border-radius: inherit;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(120px, 1fr);
  align-items: center;
  justify-items: center;
  pointer-events: none;
  user-select: none;
  animation: watermark-drift 18s ease-in-out infinite alternate;
}

.exam-watermark span {
  max-width: 260px;
  transform: rotate(-24deg);
  color: rgba(37, 99, 235, 0.075);
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.5;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
}

@keyframes watermark-drift {
  from { transform: translate3d(-0.7rem, -0.45rem, 0); }
  to { transform: translate3d(0.8rem, 0.55rem, 0); }
}

.exam-question {
  position: relative;
  z-index: 2;
  min-height: 480px;
  padding: clamp(1.25rem, 3vw, 2.2rem);
  border: none;
  border-radius: 20px 20px 0 0;
  background: transparent;
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.question-header > div {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.question-kicker {
  color: var(--exam-blue-dark);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.question-type {
  padding: 0.28rem 0.6rem;
  border-radius: 99px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.64rem;
  font-weight: 700;
}

.answer-state {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 700;
}

.answer-state.answered {
  color: #16a34a;
}

.exam-question h2 {
  max-width: 900px;
  margin: clamp(1.3rem, 3vw, 2rem) 0 0;
  color: var(--exam-ink);
  font-size: clamp(1.15rem, 2.1vw, 1.55rem);
  line-height: 1.55;
}

.answer-group {
  margin-top: clamp(1.25rem, 3vw, 2rem);
  gap: 0.7rem;
}

.option {
  position: relative;
  min-height: 58px;
  padding: 0.75rem 2.7rem 0.75rem 0.75rem;
  border: 1px solid #dbe4ef;
  border-radius: 15px;
  align-items: center;
  gap: 0.75rem;
  background: #fff;
  font-size: 0.88rem;
  line-height: 1.45;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.option:hover {
  border-color: #93c5fd;
  background: #f8fbff;
  transform: translateY(-1px);
}

.option.selected {
  border-color: var(--exam-blue);
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-letter {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 800;
}

.option.selected .option-letter {
  border-color: var(--exam-blue);
  background: var(--exam-blue);
  color: #fff;
}

.option-copy {
  color: var(--exam-ink);
}

.option-check {
  position: absolute;
  right: 1rem;
  color: var(--exam-blue);
  opacity: 0;
}

.option.selected .option-check {
  opacity: 1;
}

.written-answer label {
  color: #334155;
  font-size: 0.76rem;
  font-weight: 800;
}

.written-answer textarea {
  min-height: 180px;
  padding: 0.9rem 1rem;
  border-radius: 15px;
  background: #fbfdff;
  color: var(--exam-ink);
  line-height: 1.6;
  resize: vertical;
}

.written-answer textarea:focus {
  border-color: #60a5fa;
  outline: none;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.11);
}

.written-answer small,
.save-state {
  color: var(--exam-muted);
  font-size: 0.68rem;
}

.question-actions {
  z-index: 3;
  position: sticky;
  bottom: 0;
  padding: 0.9rem 1rem;
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 20px 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
}

.save-state {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.save-state i {
  color: #16a34a;
}

.btn {
  min-height: 42px;
  padding: 0.62rem 0.9rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.48rem;
  font-size: 0.78rem;
}

.btn:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.2);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.navigation-btn,
.fullscreen-btn {
  border-color: #cbd5e1;
  background: #fff;
  color: #334155;
}

.next-btn,
.review-btn,
.submit-btn {
  border-color: var(--exam-blue);
  background: var(--exam-blue);
  color: #fff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18);
}

.submit-overlay,
.pause-overlay {
  position: fixed;
  inset: 0;
  z-index: 6000;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(6px);
}

.focus-protection {
  position: fixed;
  inset: 0;
  z-index: 7000;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: var(--exam-ink);
  text-align: center;
}

.focus-protection > span {
  width: 64px;
  height: 64px;
  margin-bottom: 0.9rem;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  color: #dc2626;
  font-size: 1.3rem;
}

.focus-protection h2 {
  margin: 0;
  font-size: 1.25rem;
}

.focus-protection p {
  max-width: 430px;
  margin: 0.5rem 0 0;
  color: var(--exam-muted);
  font-size: 0.82rem;
  line-height: 1.6;
}

.exam-obscured .exam-topbar,
.exam-obscured .exam-layout,
.exam-obscured .exam-notice {
  filter: blur(20px);
}

.submit-review-card,
.pause-card {
  width: min(94vw, 470px);
  padding: 1.35rem;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.25);
  text-align: center;
}

.review-icon,
.pause-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 0.8rem;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  color: #b45309;
  font-size: 1.15rem;
}

.review-icon.complete {
  background: #dcfce7;
  color: #15803d;
}

.review-eyebrow {
  color: var(--exam-blue-dark);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.submit-review-card h2,
.pause-card h2 {
  margin: 0.3rem 0 0.45rem;
  color: var(--exam-ink);
  font-size: 1.25rem;
}

.submit-review-card p,
.pause-card p {
  margin: 0;
  color: var(--exam-muted);
  font-size: 0.82rem;
  line-height: 1.6;
}

.review-summary {
  margin: 1rem 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.review-summary span {
  padding: 0.75rem;
  border-radius: 13px;
  display: grid;
  gap: 0.2rem;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.68rem;
}

.review-summary i {
  color: var(--exam-blue);
}

.review-summary strong {
  color: var(--exam-ink);
  font-size: 1rem;
}

.review-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.pause-card > strong {
  width: 58px;
  height: 58px;
  margin: 1rem auto 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: var(--exam-blue-dark);
  font-size: 1.25rem;
}

@media (max-width: 900px) {
  .exam-mode {
    padding: 0.65rem;
    scroll-padding-top: calc(var(--exam-top-offset) + 9.5rem);
  }

  .exam-topbar {
    align-items: stretch;
    gap: 0.7rem;
  }

  .exam-brand-icon {
    width: 40px;
    height: 40px;
  }

  .exam-status {
    width: 100%;
  }

  .status-card {
    flex: 1;
    min-width: 0;
  }

  .exam-notice {
    top: calc(var(--exam-top-offset) + 9.2rem);
  }

  .exam-layout {
    grid-template-columns: 1fr;
  }

  .question-sidebar {
    position: static;
    max-height: none;
  }

  .question-grid {
    grid-template-columns: repeat(10, minmax(30px, 1fr));
  }

  .integrity-reminder,
  .question-sidebar .fullscreen-btn {
    display: none;
  }

  .question-workspace {
    min-height: auto;
  }

  .exam-question {
    min-height: 420px;
  }
}

@media (max-width: 560px) {
  .exam-meta h1 {
    max-width: 72vw;
  }

  .status-card {
    padding: 0.45rem;
  }

  .status-card > i {
    display: none;
  }

  .status-card {
    grid-template-columns: 1fr;
  }

  .question-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .question-header {
    align-items: flex-start;
  }

  .answer-state {
    flex: 0 0 auto;
  }

  .question-actions {
    grid-template-columns: 1fr 1fr;
  }

  .save-state {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .review-actions {
    grid-template-columns: 1fr;
  }
}
</style>
