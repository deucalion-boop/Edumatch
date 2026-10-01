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
            <label :for="`written-answer-${currentOriginalQuestionIndex}`">{{ currentQuestion.type === 'essay' ? 'Your essay response' : 'Your answer' }}</label>
            <p v-if="currentQuestion.instructions" class="essay-instructions">{{ currentQuestion.instructions }}</p>
            <textarea
              :id="`written-answer-${currentOriginalQuestionIndex}`"
              :value="answers[currentOriginalQuestionIndex] || ''"
              rows="9"
              placeholder="Write your answer clearly here..."
              @input="setAnswer(currentOriginalQuestionIndex, $event.target.value)"
            ></textarea>
            <div class="essay-answer-meta">
              <small>Your answer is saved automatically while the assessment is active.</small>
              <small v-if="currentQuestion.type === 'essay'" :class="{ 'word-limit-warning': !isCurrentEssayWordCountValid }">
                {{ currentEssayWordCount }} words<span v-if="currentQuestion.minWords"> · minimum {{ currentQuestion.minWords }}</span><span v-if="currentQuestion.maxWords"> · maximum {{ currentQuestion.maxWords }}</span>
              </small>
            </div>
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
    currentEssayWordCount() {
      return String(this.answers[this.currentOriginalQuestionIndex] || '').trim().split(/\s+/).filter(Boolean).length
    },
    isCurrentEssayWordCountValid() {
      if (String(this.currentQuestion?.type || '') !== 'essay') return true
      const min = Number(this.currentQuestion?.minWords || 0)
      const max = Number(this.currentQuestion?.maxWords || 0)
      return this.currentEssayWordCount >= min && (!max || this.currentEssayWordCount <= max)
    },
    watermarkLabel() {
      const user = this.authStore?.user || {}
      const studentId = String(user.studentId || user.lrn || user.id || user._id || '').trim()
      const timeLabel = new Intl.DateTimeFormat('en-US', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(new Date(this.nowMs))
      return [studentId ? `ID ${studentId.slice(-8)}` : '', timeLabel].filter(Boolean).join(' • ')
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
      const token = this.authStore?.token
        || localStorage.getItem('edumatch_auth_token')
        || sessionStorage.getItem('edumatch_auth_token')
        || ''
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
    isEssayWordCountValid(question, index) {
      if (String(question?.type || '') !== 'essay') return true
      const count = String(this.answers[index] || '').trim().split(/\s+/).filter(Boolean).length
      const min = Number(question?.minWords || 0)
      const max = Number(question?.maxWords || 0)
      return count >= min && (!max || count <= max)
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
      const invalidEssayIndex = this.assessment.questions.findIndex((question, index) => !this.isEssayWordCountValid(question, index))
      if (invalidEssayIndex >= 0) {
        this.currentQuestionIndex = Math.max(0, this.questionOrder.indexOf(invalidEssayIndex))
        this.showNotice('error', `Question ${invalidEssayIndex + 1} does not meet its essay word-count requirement.`)
        return
      }
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
@reference "../../styles/tailwind.css";

.exam-mode {
  --exam-top-offset: max(env(safe-area-inset-top), 0.5rem);
  --exam-topbar-z: 120;
  @apply tw:min-h-screen;
  @apply tw:[background:#f1f5f9];
  @apply tw:[padding:0.85rem_1.2rem_1.5rem];
  @apply tw:scroll-smooth;
  @apply tw:[scroll-padding-top:calc(var(--exam-top-offset)_+_7rem)];
  @apply tw:[user-select:none];
}

.exam-topbar {
  @apply tw:sticky;
  @apply tw:[top:var(--exam-top-offset)];
  @apply tw:[z-index:var(--exam-topbar-z)];
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:items-start;
  @apply tw:[background:#0f172a];
  @apply tw:[color:#ffffff];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:1rem_1.1rem];
  @apply tw:[margin-bottom:1rem];
  @apply tw:[box-shadow:0_8px_22px_rgba(15,_23,_42,_0.18)];
}

.exam-meta h1 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.18rem];
}

.exam-meta p {
  @apply tw:[margin:0.28rem_0_0];
  @apply tw:[color:#cbd5e1];
  @apply tw:[font-size:0.84rem];
}

.exam-status {
  @apply tw:flex;
  @apply tw:[gap:0.7rem];
}

.status-card {
  @apply tw:[min-width:120px];
  @apply tw:[border-radius:10px];
  @apply tw:[background:rgba(255,_255,_255,_0.12)];
  @apply tw:[padding:0.5rem_0.65rem];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.1rem];
}

.status-card span {
  @apply tw:[font-size:0.7rem];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.03em];
  @apply tw:[color:#cbd5e1];
}

.status-card strong {
  @apply tw:[font-size:1rem];
}

.status-card.timer.danger {
  @apply tw:[background:rgba(239,_68,_68,_0.26)];
}

.exam-notice {
  @apply tw:[border-radius:10px];
  @apply tw:[padding:0.65rem_0.8rem];
  @apply tw:[font-weight:600];
  @apply tw:[margin-bottom:0.9rem];
}

.exam-notice.success {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
  @apply tw:[border:1px_solid_#86efac];
}

.exam-notice.error {
  @apply tw:[background:#fee2e2];
  @apply tw:[color:#991b1b];
  @apply tw:[border:1px_solid_#fca5a5];
}

.exam-loading {
  @apply tw:[min-height:45vh];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.6rem];
  @apply tw:[color:#334155];
  @apply tw:[font-weight:700];
}

.exam-content {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

.exam-question {
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.82rem_0.85rem];
}

.exam-question h3 {
  @apply tw:[margin:0_0_0.42rem];
  @apply tw:[font-size:0.92rem];
}

.exam-question p {
  @apply tw:[margin:0];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.86rem];
}

.answer-group {
  @apply tw:[margin-top:0.62rem];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.5rem];
}

.option {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.45rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.85rem];
}

textarea {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:10px];
  @apply tw:[padding:0.6rem_0.66rem];
  @apply tw:[font-size:0.84rem];
  @apply tw:[font-family:inherit];
  @apply tw:[user-select:none];
}

.exam-actions {
  @apply tw:sticky;
  @apply tw:[bottom:0];
  @apply tw:flex;
  @apply tw:justify-end;
  @apply tw:[gap:0.55rem];
  @apply tw:[background:#f1f5f9];
  @apply tw:[padding:0.78rem_0_0.15rem];
}

.btn {
  @apply tw:[border-radius:10px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[font-weight:700];
  @apply tw:[font-size:0.83rem];
  @apply tw:[padding:0.55rem_0.78rem];
  @apply tw:cursor-pointer;
}

.fullscreen-btn {
  @apply tw:[background:#ffffff];
  @apply tw:[color:#1e293b];
}

.submit-btn {
  @apply tw:[border-color:#1d4ed8];
  @apply tw:[background:#1d4ed8];
  @apply tw:[color:#ffffff];
}

.submit-btn:disabled {
  @apply tw:[opacity:0.7];
  @apply tw:cursor-not-allowed;
}

.pause-overlay {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[background:rgba(15,_23,_42,_0.72)];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[z-index:6000];
}

.pause-card {
  @apply tw:[background:#ffffff];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:1rem];
  @apply tw:[width:min(92vw,_420px)];
  @apply tw:text-center;
}

.pause-card h2 {
  @apply tw:[margin:0_0_0.4rem];
}

@media (max-width: 900px) {
  .exam-mode {
    --exam-top-offset: max(env(safe-area-inset-top), 0.35rem);
    @apply tw:[padding:0.65rem_0.75rem_1.2rem];
    @apply tw:[scroll-padding-top:calc(var(--exam-top-offset)_+_8.8rem)];
  }

  .exam-topbar {
    @apply tw:flex-col;
    @apply tw:[gap:0.75rem];
    @apply tw:[padding:0.82rem_0.9rem];
  }

  .exam-status {
    @apply tw:w-full;
    @apply tw:justify-between;
    @apply tw:[gap:0.5rem];
  }

  .status-card {
    @apply tw:[flex:1];
    @apply tw:[min-width:0];
  }
}

/* Focused exam workspace */
.exam-mode {
  --exam-blue: #2563eb;
  --exam-blue-dark: #1d4ed8;
  --exam-ink: #0f172a;
  --exam-muted: #64748b;
  --exam-border: #dbe4ef;
  @apply tw:min-h-screen;
  @apply tw:[padding:1rem_clamp(0.8rem,_2vw,_1.5rem)_1.5rem];
  @apply tw:[background:radial-gradient(circle_at_top_left,_rgba(37,_99,_235,_0.07),_transparent_28rem),_____#f4f7fb];
}

.exam-topbar {
  @apply tw:items-center;
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[margin:0_auto_1rem];
  @apply tw:[max-width:1440px];
  @apply tw:[border:1px_solid_var(--exam-border)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:rgba(255,_255,_255,_0.96)];
  @apply tw:[color:var(--exam-ink)];
  @apply tw:[box-shadow:0_10px_30px_rgba(15,_23,_42,_0.08)];
  @apply tw:[backdrop-filter:blur(14px)];
}

.exam-brand {
  @apply tw:[min-width:0];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
}

.exam-brand-icon {
  @apply tw:flex-none;
  @apply tw:[width:44px];
  @apply tw:[height:44px];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#dbeafe];
  @apply tw:[color:var(--exam-blue-dark)];
  @apply tw:[font-size:1rem];
}

.exam-meta {
  @apply tw:[min-width:0];
}

.secure-label {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.3rem];
  @apply tw:[margin-bottom:0.15rem];
  @apply tw:[color:#047857];
  @apply tw:[font-size:0.65rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.07em];
  @apply tw:uppercase;
}

.exam-meta h1 {
  @apply tw:overflow-hidden;
  @apply tw:[color:var(--exam-ink)];
  @apply tw:[font-size:1.05rem];
  @apply tw:[line-height:1.25];
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

.exam-meta p {
  @apply tw:[margin-top:0.2rem];
  @apply tw:[color:var(--exam-muted)];
  @apply tw:[font-size:0.75rem];
}

.exam-meta p span {
  @apply tw:[padding:0_0.18rem];
  @apply tw:[color:#cbd5e1];
}

.exam-status {
  @apply tw:flex-none;
  @apply tw:[gap:0.55rem];
}

.status-card {
  @apply tw:[min-width:126px];
  @apply tw:[padding:0.52rem_0.7rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:13px];
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_1fr];
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:var(--exam-ink)];
}

.status-card > i {
  @apply tw:[width:30px];
  @apply tw:[height:30px];
  @apply tw:[border-radius:9px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#dbeafe];
  @apply tw:[color:var(--exam-blue-dark)];
  @apply tw:[font-size:0.8rem];
}

.status-card span {
  @apply tw:grid;
  @apply tw:[color:var(--exam-muted)];
  @apply tw:[font-size:0.61rem];
  @apply tw:[line-height:1.2];
}

.status-card strong {
  @apply tw:[margin-top:0.1rem];
  @apply tw:[color:var(--exam-ink)];
  @apply tw:[font-size:0.92rem];
  @apply tw:[letter-spacing:0.02em];
}

.status-card.timer.danger,
.status-card.violations.warning {
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:#fff7f7];
}

.status-card.timer.danger > i,
.status-card.violations.warning > i {
  @apply tw:[background:#fee2e2];
  @apply tw:[color:#dc2626];
}

.exam-notice {
  @apply tw:sticky;
  @apply tw:[top:calc(var(--exam-top-offset)_+_5.7rem)];
  @apply tw:[z-index:110];
  @apply tw:[max-width:1440px];
  @apply tw:[margin:0_auto_0.8rem];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:0.75rem_0.9rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[font-size:0.82rem];
}

.exam-loading {
  @apply tw:[min-height:55vh];
}

.exam-layout {
  @apply tw:w-full;
  @apply tw:[max-width:1440px];
  @apply tw:[margin:0_auto];
  @apply tw:grid;
  @apply tw:[grid-template-columns:270px_minmax(0,_1fr)];
  @apply tw:[gap:1rem];
  @apply tw:[align-items:start];
}

.question-sidebar {
  @apply tw:sticky;
  @apply tw:[top:calc(var(--exam-top-offset)_+_6.4rem)];
  @apply tw:[max-height:calc(100vh_-_7.5rem)];
  @apply tw:overflow-y-auto;
  @apply tw:[border:1px_solid_var(--exam-border)];
  @apply tw:[border-radius:18px];
  @apply tw:[padding:1rem];
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[background:#fff];
  @apply tw:[box-shadow:0_12px_32px_rgba(15,_23,_42,_0.06)];
}

.progress-summary {
  @apply tw:[padding:0.85rem];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#eff6ff];
}

.progress-summary-head {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:items-center;
}

.progress-summary-head div {
  @apply tw:grid;
  @apply tw:[gap:0.12rem];
}

.progress-summary-head span,
.progress-summary small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.68rem];
}

.progress-summary-head strong {
  @apply tw:[color:var(--exam-ink)];
  @apply tw:[font-size:0.88rem];
}

.progress-summary-head b {
  @apply tw:[color:var(--exam-blue-dark)];
  @apply tw:[font-size:0.92rem];
}

.progress-track {
  @apply tw:[height:7px];
  @apply tw:[margin:0.65rem_0_0.42rem];
  @apply tw:overflow-hidden;
  @apply tw:[border-radius:99px];
  @apply tw:[background:#dbeafe];
}

.progress-track span {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:linear-gradient(90deg,_var(--exam-blue-dark),_#60a5fa)];
  @apply tw:[transition:width_0.25s_ease];
}

.question-nav-head h2 {
  @apply tw:[margin:0];
  @apply tw:[color:var(--exam-ink)];
  @apply tw:[font-size:0.92rem];
}

.question-nav-head span {
  @apply tw:[color:var(--exam-muted)];
  @apply tw:[font-size:0.68rem];
}

.question-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(5,_minmax(0,_1fr))];
  @apply tw:[gap:0.42rem];
}

.question-number {
  @apply tw:[aspect-ratio:1];
  @apply tw:[min-width:0];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:9px];
  @apply tw:[background:#fff];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:cursor-pointer;
}

.question-number:hover,
.question-number:focus-visible {
  @apply tw:[border-color:#60a5fa];
  @apply tw:[outline:none];
}

.question-number.answered {
  @apply tw:[border-color:#86efac];
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
}

.question-number.current {
  @apply tw:[border-color:var(--exam-blue)];
  @apply tw:[background:var(--exam-blue)];
  @apply tw:[color:#fff];
  @apply tw:[box-shadow:0_6px_14px_rgba(37,_99,_235,_0.24)];
}

.question-legend {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.45rem_0.7rem];
  @apply tw:[color:var(--exam-muted)];
  @apply tw:[font-size:0.62rem];
}

.question-legend span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.28rem];
}

.legend-dot {
  @apply tw:[width:9px];
  @apply tw:[height:9px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:3px];
  @apply tw:[background:#fff];
}

.legend-dot.current {
  @apply tw:[border-color:var(--exam-blue)];
  @apply tw:[background:var(--exam-blue)];
}

.legend-dot.answered {
  @apply tw:[border-color:#86efac];
  @apply tw:[background:#dcfce7];
}

.integrity-reminder {
  @apply tw:[padding:0.8rem];
  @apply tw:[border:1px_solid_#fde68a];
  @apply tw:[border-radius:14px];
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_1fr];
  @apply tw:[gap:0.55rem];
  @apply tw:[background:#fffbeb];
  @apply tw:[color:#92400e];
}

.integrity-reminder > i {
  @apply tw:[margin-top:0.15rem];
}

.integrity-reminder div {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.integrity-reminder strong {
  @apply tw:[font-size:0.72rem];
}

.integrity-reminder span {
  @apply tw:[font-size:0.65rem];
  @apply tw:[line-height:1.45];
}

.question-sidebar .fullscreen-btn {
  @apply tw:w-full;
}

.question-workspace {
  @apply tw:relative;
  @apply tw:[min-width:0];
  @apply tw:[min-height:calc(100vh_-_8rem)];
  @apply tw:[border:1px_solid_var(--exam-border)];
  @apply tw:[border-radius:20px];
  @apply tw:grid;
  @apply tw:[grid-template-rows:minmax(0,_1fr)_auto];
  @apply tw:[background:#fff];
  @apply tw:[box-shadow:0_14px_38px_rgba(15,_23,_42,_0.065)];
}

.exam-watermark {
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[z-index:1];
  @apply tw:overflow-hidden;
  @apply tw:[border-radius:inherit];
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_1fr)];
  @apply tw:[grid-auto-rows:minmax(120px,_1fr)];
  @apply tw:items-center;
  @apply tw:justify-items-center;
  @apply tw:pointer-events-none;
  @apply tw:[user-select:none];
  @apply tw:[animation:watermark-drift_18s_ease-in-out_infinite_alternate];
}

.exam-watermark span {
  @apply tw:[max-width:260px];
  @apply tw:[transform:rotate(-24deg)];
  @apply tw:[color:rgba(37,_99,_235,_0.075)];
  @apply tw:[font-size:0.63rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:[line-height:1.5];
  @apply tw:text-center;
  @apply tw:uppercase;
  @apply tw:whitespace-nowrap;
}

@keyframes watermark-drift {
  from { transform: translate3d(-0.7rem, -0.45rem, 0); }
  to { transform: translate3d(0.8rem, 0.55rem, 0); }
}

.exam-question {
  @apply tw:relative;
  @apply tw:[z-index:2];
  @apply tw:[min-height:480px];
  @apply tw:[padding:clamp(1.25rem,_3vw,_2.2rem)];
  @apply tw:[border:none];
  @apply tw:[border-radius:20px_20px_0_0];
  @apply tw:[background:transparent];
}

.question-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[padding-bottom:1rem];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
}

.question-header > div {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:flex-wrap;
}

.question-kicker {
  @apply tw:[color:var(--exam-blue-dark)];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.question-type {
  @apply tw:[padding:0.28rem_0.6rem];
  @apply tw:[border-radius:99px];
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.64rem];
  @apply tw:[font-weight:700];
}

.answer-state {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:700];
}

.answer-state.answered {
  @apply tw:[color:#16a34a];
}

.exam-question h2 {
  @apply tw:[max-width:900px];
  @apply tw:[margin:clamp(1.3rem,_3vw,_2rem)_0_0];
  @apply tw:[color:var(--exam-ink)];
  @apply tw:[font-size:clamp(1.15rem,_2.1vw,_1.55rem)];
  @apply tw:[line-height:1.55];
}

.answer-group {
  @apply tw:[margin-top:clamp(1.25rem,_3vw,_2rem)];
  @apply tw:[gap:0.7rem];
}

.option {
  @apply tw:relative;
  @apply tw:[min-height:58px];
  @apply tw:[padding:0.75rem_2.7rem_0.75rem_0.75rem];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:15px];
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:[background:#fff];
  @apply tw:[font-size:0.88rem];
  @apply tw:[line-height:1.45];
  @apply tw:cursor-pointer;
  @apply tw:[transition:border-color_0.18s_ease,_background_0.18s_ease,_transform_0.18s_ease];
}

.option:hover {
  @apply tw:[border-color:#93c5fd];
  @apply tw:[background:#f8fbff];
  @apply tw:[transform:translateY(-1px)];
}

.option.selected {
  @apply tw:[border-color:var(--exam-blue)];
  @apply tw:[background:#eff6ff];
  @apply tw:[box-shadow:0_0_0_3px_rgba(37,_99,_235,_0.1)];
}

.option input {
  @apply tw:absolute;
  @apply tw:opacity-0;
  @apply tw:pointer-events-none;
}

.option-letter {
  @apply tw:flex-none;
  @apply tw:[width:34px];
  @apply tw:[height:34px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:10px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:800];
}

.option.selected .option-letter {
  @apply tw:[border-color:var(--exam-blue)];
  @apply tw:[background:var(--exam-blue)];
  @apply tw:[color:#fff];
}

.option-copy {
  @apply tw:[color:var(--exam-ink)];
}

.option-check {
  @apply tw:absolute;
  @apply tw:[right:1rem];
  @apply tw:[color:var(--exam-blue)];
  @apply tw:opacity-0;
}

.option.selected .option-check {
  @apply tw:opacity-100;
}

.written-answer label {
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:800];
}

.written-answer textarea {
  @apply tw:[min-height:180px];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#fbfdff];
  @apply tw:[color:var(--exam-ink)];
  @apply tw:[line-height:1.6];
  @apply tw:resize-y;
}

.written-answer textarea:focus {
  @apply tw:[border-color:#60a5fa];
  @apply tw:[outline:none];
  @apply tw:[box-shadow:0_0_0_4px_rgba(37,_99,_235,_0.11)];
}

.written-answer small,
.save-state {
  @apply tw:[color:var(--exam-muted)];
  @apply tw:[font-size:0.68rem];
}

.essay-instructions {
  @apply tw:[margin:0];
  @apply tw:[padding:0.7rem_0.8rem];
  @apply tw:[border-left:3px_solid_#60a5fa];
  @apply tw:[border-radius:0_10px_10px_0];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.76rem];
  @apply tw:[line-height:1.5];
}

.essay-answer-meta { @apply tw:flex; @apply tw:justify-between; @apply tw:[gap:0.75rem]; @apply tw:flex-wrap; }
.essay-answer-meta .word-limit-warning { @apply tw:[color:#b45309]; @apply tw:[font-weight:800]; }

.question-actions {
  @apply tw:[z-index:3];
  @apply tw:sticky;
  @apply tw:[bottom:0];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border-top:1px_solid_#e2e8f0];
  @apply tw:[border-radius:0_0_20px_20px];
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_1fr_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:[background:rgba(255,_255,_255,_0.96)];
  @apply tw:[backdrop-filter:blur(12px)];
}

.save-state {
  @apply tw:justify-self-center;
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
}

.save-state i {
  @apply tw:[color:#16a34a];
}

.btn {
  @apply tw:[min-height:42px];
  @apply tw:[padding:0.62rem_0.9rem];
  @apply tw:[border-radius:12px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.48rem];
  @apply tw:[font-size:0.78rem];
}

.btn:focus-visible {
  @apply tw:[outline:3px_solid_rgba(37,_99,_235,_0.2)];
  @apply tw:[outline-offset:2px];
}

.btn:disabled {
  @apply tw:[opacity:0.45];
  @apply tw:cursor-not-allowed;
}

.navigation-btn,
.fullscreen-btn {
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[background:#fff];
  @apply tw:[color:#334155];
}

.next-btn,
.review-btn,
.submit-btn {
  @apply tw:[border-color:var(--exam-blue)];
  @apply tw:[background:var(--exam-blue)];
  @apply tw:[color:#fff];
  @apply tw:[box-shadow:0_8px_18px_rgba(37,_99,_235,_0.18)];
}

.submit-overlay,
.pause-overlay {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:6000];
  @apply tw:[padding:1rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:rgba(15,_23,_42,_0.62)];
  @apply tw:[backdrop-filter:blur(6px)];
}

.focus-protection {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:7000];
  @apply tw:[padding:1rem];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#f8fafc];
  @apply tw:[color:var(--exam-ink)];
  @apply tw:text-center;
}

.focus-protection > span {
  @apply tw:[width:64px];
  @apply tw:[height:64px];
  @apply tw:[margin-bottom:0.9rem];
  @apply tw:[border-radius:20px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#fee2e2];
  @apply tw:[color:#dc2626];
  @apply tw:[font-size:1.3rem];
}

.focus-protection h2 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.25rem];
}

.focus-protection p {
  @apply tw:[max-width:430px];
  @apply tw:[margin:0.5rem_0_0];
  @apply tw:[color:var(--exam-muted)];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.6];
}

.exam-obscured .exam-topbar,
.exam-obscured .exam-layout,
.exam-obscured .exam-notice {
  @apply tw:[filter:blur(20px)];
}

.submit-review-card,
.pause-card {
  @apply tw:[width:min(94vw,_470px)];
  @apply tw:[padding:1.35rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:22px];
  @apply tw:[background:#fff];
  @apply tw:[box-shadow:0_28px_70px_rgba(15,_23,_42,_0.25)];
  @apply tw:text-center;
}

.review-icon,
.pause-icon {
  @apply tw:[width:54px];
  @apply tw:[height:54px];
  @apply tw:[margin:0_auto_0.8rem];
  @apply tw:[border-radius:17px];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#fef3c7];
  @apply tw:[color:#b45309];
  @apply tw:[font-size:1.15rem];
}

.review-icon.complete {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#15803d];
}

.review-eyebrow {
  @apply tw:[color:var(--exam-blue-dark)];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

.submit-review-card h2,
.pause-card h2 {
  @apply tw:[margin:0.3rem_0_0.45rem];
  @apply tw:[color:var(--exam-ink)];
  @apply tw:[font-size:1.25rem];
}

.submit-review-card p,
.pause-card p {
  @apply tw:[margin:0];
  @apply tw:[color:var(--exam-muted)];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.6];
}

.review-summary {
  @apply tw:[margin:1rem_0];
  @apply tw:grid;
  @apply tw:[grid-template-columns:1fr_1fr];
  @apply tw:[gap:0.65rem];
}

.review-summary span {
  @apply tw:[padding:0.75rem];
  @apply tw:[border-radius:13px];
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.68rem];
}

.review-summary i {
  @apply tw:[color:var(--exam-blue)];
}

.review-summary strong {
  @apply tw:[color:var(--exam-ink)];
  @apply tw:[font-size:1rem];
}

.review-actions {
  @apply tw:grid;
  @apply tw:[grid-template-columns:1fr_1fr];
  @apply tw:[gap:0.65rem];
}

.pause-card > strong {
  @apply tw:[width:58px];
  @apply tw:[height:58px];
  @apply tw:[margin:1rem_auto_0];
  @apply tw:[border-radius:50%];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#eff6ff];
  @apply tw:[color:var(--exam-blue-dark)];
  @apply tw:[font-size:1.25rem];
}

@media (max-width: 900px) {
  .exam-mode {
    @apply tw:[padding:0.65rem];
    @apply tw:[scroll-padding-top:calc(var(--exam-top-offset)_+_9.5rem)];
  }

  .exam-topbar {
    @apply tw:items-stretch;
    @apply tw:[gap:0.7rem];
  }

  .exam-brand-icon {
    @apply tw:[width:40px];
    @apply tw:[height:40px];
  }

  .exam-status {
    @apply tw:w-full;
  }

  .status-card {
    @apply tw:[flex:1];
    @apply tw:[min-width:0];
  }

  .exam-notice {
    @apply tw:[top:calc(var(--exam-top-offset)_+_9.2rem)];
  }

  .exam-layout {
    @apply tw:[grid-template-columns:1fr];
  }

  .question-sidebar {
    @apply tw:static;
    @apply tw:max-h-none;
  }

  .question-grid {
    @apply tw:[grid-template-columns:repeat(10,_minmax(30px,_1fr))];
  }

  .integrity-reminder,
  .question-sidebar .fullscreen-btn {
    @apply tw:hidden;
  }

  .question-workspace {
    @apply tw:[min-height:auto];
  }

  .exam-question {
    @apply tw:[min-height:420px];
  }
}

@media (max-width: 560px) {
  .exam-meta h1 {
    @apply tw:[max-width:72vw];
  }

  .status-card {
    @apply tw:[padding:0.45rem];
  }

  .status-card > i {
    @apply tw:hidden;
  }

  .status-card {
    @apply tw:[grid-template-columns:1fr];
  }

  .question-grid {
    @apply tw:[grid-template-columns:repeat(5,_minmax(0,_1fr))];
  }

  .question-header {
    @apply tw:items-start;
  }

  .answer-state {
    @apply tw:flex-none;
  }

  .question-actions {
    @apply tw:[grid-template-columns:1fr_1fr];
  }

  .save-state {
    @apply tw:[grid-column:1_/_-1];
    @apply tw:[grid-row:1];
  }

  .review-actions {
    @apply tw:[grid-template-columns:1fr];
  }
}

</style>
