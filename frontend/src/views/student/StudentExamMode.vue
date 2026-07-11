<template>
  <div class="exam-mode" :class="{ 'exam-paused': isPaused }">
    <header class="exam-topbar">
      <div class="exam-meta">
        <h1>{{ assessment.title || 'Assessment Exam' }}</h1>
        <p>
          {{ formatLabel(assessment.examType) }} • {{ formatLabel(assessment.difficulty) }} •
          {{ assessment.questions.length }} questions
        </p>
      </div>
      <div class="exam-status">
        <div class="status-card timer" :class="{ danger: remainingSeconds <= 60 }">
          <span>Time Left</span>
          <strong>{{ formatDuration(remainingSeconds) }}</strong>
        </div>
        <div class="status-card violations">
          <span>Violations</span>
          <strong>{{ violationCount }} / {{ maxViolations }}</strong>
        </div>
      </div>
    </header>

    <section v-if="notice.message" class="exam-notice" :class="notice.type">
      {{ notice.message }}
    </section>

    <section v-if="isLoading" class="exam-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Preparing secure exam environment...</span>
    </section>

    <section v-else class="exam-content">
      <article
        v-for="(question, index) in assessment.questions"
        :key="`question-${index}`"
        class="exam-question"
      >
        <h3>Question {{ index + 1 }}</h3>
        <p>{{ question.questionText || 'Question text unavailable.' }}</p>

        <div v-if="isChoiceType(question.type)" class="answer-group">
          <label
            v-for="(option, optionIndex) in normalizedOptions(question)"
            :key="`q-${index}-o-${optionIndex}`"
            class="option"
          >
            <input
              type="radio"
              :name="`question-${index}`"
              :value="option"
              :checked="answers[index] === option"
              @change="setAnswer(index, option)"
            />
            <span>{{ option }}</span>
          </label>
        </div>

        <div v-else class="answer-group">
          <textarea
            :value="answers[index] || ''"
            rows="3"
            placeholder="Type your answer here..."
            @input="setAnswer(index, $event.target.value)"
          ></textarea>
        </div>
      </article>
    </section>

    <footer v-if="!isLoading" class="exam-actions">
      <button type="button" class="btn fullscreen-btn" @click="requestExamFullscreen">
        Re-enter Full Screen
      </button>
      <button
        type="button"
        class="btn submit-btn"
        :disabled="isSubmitting || hasFinalized"
        @click="submitExam('manual_submit')"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit Assessment' }}
      </button>
    </footer>

    <div v-if="isPaused" class="pause-overlay">
      <div class="pause-card">
        <h2>Exam Paused</h2>
        <p>Academic integrity rule triggered. You can continue in {{ pauseRemaining }} seconds.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

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

      const onVisibilityChange = async () => {
        if (document.visibilityState === 'hidden') {
          await this.logActivity('tab_hidden', `Tab switch detected at ${new Date().toLocaleTimeString()}`)
        }
      }
      const onWindowBlur = async () => {
        await this.logActivity('window_blur', `Window blur detected at ${new Date().toLocaleTimeString()}`)
      }
      const onFullscreenChange = async () => {
        if (!document.fullscreenElement && !this.hasFinalized) {
          await this.logActivity('fullscreen_exit', `Full-screen exit detected at ${new Date().toLocaleTimeString()}`)
          await this.requestExamFullscreen()
        }
      }
      const onKeyDown = async (event) => {
        const key = String(event.key || '').toLowerCase()
        const isModifier = event.ctrlKey || event.metaKey
        const inspectionCombo = isModifier && (
          ['c', 'v', 'a', 'x', 's', 'p', 'u', 'i', 'j', 'k'].includes(key)
          || (event.shiftKey && ['i', 'j', 'c', 'k'].includes(key))
        )
        const isInspectionKey = key === 'f12'

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
</style>
