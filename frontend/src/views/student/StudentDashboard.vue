<template>
  <div class="student-dashboard-page">
    <section v-if="!hasFocusedDashboardSection" class="hero">
      <div class="hero-copy">
        <p class="hero-subheader">Dashboard Overview</p>
        <p class="hero-subtitle">
          Review your deadlines, classes, grades, and announcements from one clear student workspace.
        </p>
        <div class="chip-row">
          <span class="chip"><i class="fas fa-calendar-day"></i>{{ todayLabel }}</span>
          <span class="chip"><i class="fas fa-users"></i>{{ sectionLabel }}</span>
          <span class="chip"><i class="fas fa-user-tie"></i>{{ adviserLabel }}</span>
        </div>
        <p v-if="loadError" class="alert-copy">{{ loadError }}</p>
      </div>
    </section>

    <section v-if="!hasFocusedDashboardSection" class="overview-section" data-tour="dashboard-overview">
      <div class="summary-grid">
        <article v-for="card in overviewCards" :key="card.label" class="summary-card">
          <span class="icon-badge" :class="card.tone"><i class="fas" :class="card.icon"></i></span>
          <p class="summary-label">{{ card.label }}</p>
          <h3 class="summary-value">{{ card.value }}</h3>
          <p class="summary-note">{{ card.note }}</p>
        </article>
      </div>
    </section>

    <div class="dashboard-grid" :class="{ 'dashboard-grid-focused': hasFocusedDashboardSection }">
      <section v-if="!hasFocusedDashboardSection" class="panel panel-wide classwork-panel">
        <div class="panel-head classwork-panel-head">
          <div class="panel-heading classwork-panel-heading">
            <p class="panel-subheader">Classwork Overview</p>
            <div class="classwork-title-row">
              <h3>Upcoming work</h3>
            </div>
            <p class="panel-subtitle">Review due work, submission status, and the tasks that need attention next.</p>
          </div>
          <router-link to="/student/activities" class="panel-link classwork-panel-link">
            <span>Open classwork</span>
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </div>
        <div v-if="assignmentPreview.length" class="classwork-list">
          <article
            v-for="item in assignmentPreview"
            :key="item.id"
            class="item-card classwork-card"
            :class="item.dueTone"
          >
            <div class="classwork-card-top">
              <div class="classwork-card-top-main">
                <span class="classwork-card-icon" :class="item.typeClass" aria-hidden="true">
                  <i class="fas" :class="item.typeIcon"></i>
                </span>
                <div class="classwork-card-top-copy">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.context }}</p>
                </div>
              </div>
              <span v-if="shouldShowClassworkDuePill(item)" class="pill classwork-due-pill" :class="item.dueTone">{{ item.dueLabel }}</span>
            </div>
            <div class="classwork-badge-row">
              <span class="pill type" :class="item.typeClass">{{ item.typeLabel }}</span>
              <span class="pill" :class="item.stateTone">{{ item.stateLabel }}</span>
            </div>
            <div class="classwork-meta-row">
              <span class="classwork-meta-chip"><i class="fas fa-user"></i>{{ item.teacherName || 'Teacher' }}</span>
              <span class="classwork-meta-chip"><i class="fas fa-calendar-alt"></i>{{ item.deadlineText }}</span>
            </div>
          </article>
        </div>
        <div v-else class="empty-state classwork-empty-state">
          <span class="classwork-empty-icon" aria-hidden="true">
            <i class="fas fa-clipboard-list"></i>
          </span>
          <div class="classwork-empty-copy">
            <span class="classwork-empty-label">Nothing due right now</span>
            <h4>No classwork has been posted yet</h4>
            <p>New activities, quizzes, and exams will show up here automatically once your teachers publish them.</p>
          </div>
        </div>
      </section>

      <section
        v-if="showGradesPanel"
        class="panel panel-side"
        :class="{ 'panel-focused grades-panel-focused': hasFocusedDashboardSection }"
        data-dashboard-section="grades"
      >
        <div class="panel-head" :class="{ 'panel-head-focus': hasFocusedDashboardSection }">
          <div class="panel-heading">
            <p class="panel-subheader">Grades Overview</p>
            <div class="grades-headline-row">
              <h3>Recent results</h3>
              <span
                v-if="hasFocusedDashboardSection"
                class="pill grades-focus-badge"
                :class="hasGradesData ? 'info' : 'warning'"
              >
                {{ gradesBadgeText }}
              </span>
            </div>
            <p class="panel-subtitle">
              {{ hasGradesData
                ? 'See your latest scored work and your standing in one clean view.'
                : 'Scores will appear here once teachers publish graded quizzes, activities, or exams.' }}
            </p>
          </div>
        </div>
        <template v-if="hasGradesData">
          <div v-if="hasFocusedDashboardSection" class="grades-focus-hero">
            <div class="grades-focus-copy">
              <p class="grades-focus-label">Current average</p>
              <strong class="grades-focus-score">{{ formatPercent(summary.averageScore) }}</strong>
              <span class="grades-focus-support">{{ summary.performanceTrend }}</span>
            </div>
            <div class="grades-focus-side">
              <div class="grades-focus-side-item">
                <span>Highest score</span>
                <strong>{{ formatPercent(summary.highestScore) }}</strong>
              </div>
              <div class="grades-focus-side-item">
                <span>Scored tasks</span>
                <strong>{{ summary.completedChallenges }}</strong>
              </div>
            </div>
          </div>
          <div class="stack grades-results-list">
            <article v-for="grade in recentGrades" :key="grade.key" class="simple-card">
              <div><strong>{{ grade.title }}</strong><p>{{ grade.context }}</p></div>
              <div class="score-meta"><span class="score-value">{{ grade.score }}</span><small>{{ grade.time }}</small></div>
            </article>
          </div>
        </template>
        <div v-else class="grades-empty-hero">
          <div class="grades-empty-main">
            <span class="grades-empty-icon" aria-hidden="true"><i class="fas fa-chart-line"></i></span>
            <div class="grades-empty-copy">
              <span class="grades-empty-label">No scores posted yet</span>
              <h4>Your recent results will appear here</h4>
              <p>Once a teacher publishes a graded quiz, activity, or exam, this page will update automatically and show the newest scores first.</p>
            </div>
          </div>
          <div class="grades-empty-guides">
            <article class="grades-empty-guide">
              <span>Average</span>
              <p>Appears after your first graded task.</p>
            </article>
            <article class="grades-empty-guide">
              <span>Highest</span>
              <p>Keeps track of your best posted result.</p>
            </article>
            <article class="grades-empty-guide">
              <span>Recent results</span>
              <p>Newly released scores will show up first.</p>
            </article>
          </div>
        </div>
      </section>

      <section v-if="!hasFocusedDashboardSection" class="panel panel-wide course-directory-panel">
        <div class="panel-head course-directory-head">
          <div class="panel-heading course-directory-heading">
            <p class="panel-subheader">Class Directory</p>
            <div class="course-directory-title-row">
              <h3>My classes</h3>
            </div>
            <p class="panel-subtitle">Each course card groups lessons, tasks, and progress into one organized learning view.</p>
          </div>
          <router-link to="/student/lessons" class="panel-link course-directory-link">
            <span>View lessons</span>
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </div>
        <div v-if="subjects.length" class="course-grid">
          <article v-for="subject in subjects.slice(0, 4)" :key="subject.id" class="course-card course-directory-card">
            <div class="course-card-top">
              <div class="course-card-heading">
                <span class="course-card-icon" aria-hidden="true">
                  <i class="fas fa-book-open"></i>
                </span>
                <div class="course-card-copy">
                  <h4>{{ subject.className || subject.name || 'Course' }}</h4>
                  <p>{{ subject.code || 'No code' }} &middot; {{ subject.track || 'General' }}</p>
                </div>
              </div>
              <span class="pill success course-status-pill">Active</span>
            </div>
            <p class="teacher-copy course-teacher-row"><i class="fas fa-chalkboard-teacher"></i>{{ subject.teacher?.name || 'Teacher' }}</p>
            <div class="course-metrics-grid">
              <article class="course-metric-card">
                <span>Lessons</span>
                <strong>{{ subject.lessonCount || 0 }}</strong>
              </article>
              <article class="course-metric-card">
                <span>Tasks</span>
                <strong>{{ subject.assessmentCount || 0 }}</strong>
              </article>
              <article class="course-metric-card">
                <span>Average</span>
                <strong>{{ formatPercent(subject.performance?.averageScore || 0) }}</strong>
              </article>
            </div>
            <div class="progress-block course-progress-block">
              <div class="row spread">
                <span>Course progress</span>
                <strong>{{ formatWholePercent(subject.performance?.progress || 0) }}</strong>
              </div>
              <div class="progress-track course-progress-track" aria-hidden="true">
                <span class="progress-fill" :style="{ width: `${clamp(subject.performance?.progress || 0)}%` }"></span>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="empty-state"><i class="fas fa-users"></i><div><h4>No approved classes yet</h4><p>Join a class from the Lessons page to unlock materials and assignments.</p></div></div>
        <div v-if="pendingSubjects.length" class="pending-note"><i class="fas fa-hourglass-half"></i><span>{{ pendingSubjects.length }} enrollment request{{ pendingSubjects.length === 1 ? '' : 's' }} pending approval.</span></div>
      </section>

      <section
        v-if="showRecommendationsPanel"
        class="panel panel-side"
        :class="{ 'panel-focused': hasFocusedDashboardSection }"
        data-tour="dashboard-progress-insights"
        data-dashboard-section="recommendations"
      >
        <div class="panel-head">
          <div class="panel-heading">
            <p class="panel-subheader">Progress Tracker</p>
            <h3>Recommendation progress</h3>
            <p class="panel-subtitle">Track recommendation progress and learning momentum through a clear, focused summary.</p>
          </div>
          <span class="pill recommendation-status-pill" :class="{ ready: recommendationMeta.ready, pending: !recommendationMeta.ready }">
            {{ recommendationMeta.statusLabel }}
          </span>
        </div>
        <div class="insight-hero" :class="{ pending: !recommendationMeta.ready }" data-tour="dashboard-strand-recommendation">
          <div class="insight-copy">
            <span class="insight-kicker">{{ recommendationMeta.ready ? 'Recommendation ready' : 'Recommendation in progress' }}</span>
            <h4>{{ recommendationHeadline }}</h4>
            <p>{{ recommendationSupportCopy }}</p>
            <div v-if="!recommendationMeta.ready" class="insight-callout">
              <i class="fas fa-clipboard-check" aria-hidden="true"></i>
              <span>Finish more graded assessments to unlock your strand suggestion.</span>
            </div>
          </div>
          <div class="progress-block light insight-progress">
            <span class="insight-progress-label">{{ recommendationMeta.ready ? 'Suggested strand' : 'Completion status' }}</span>
            <strong>{{ recommendationMeta.progress }}%</strong>
            <small>{{ recommendationMeta.ready ? summary.recommendedStrand : recommendationMeta.statusLabel }}</small>
            <div class="progress-track light" aria-hidden="true"><span class="progress-fill" :style="{ width: `${recommendationMeta.progress}%` }"></span></div>
          </div>
        </div>
        <div class="mini-grid recommendation-mini-grid">
          <article v-for="stat in recommendationAssessmentStats" :key="stat.label" class="mini-card">
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value }}</strong>
          </article>
          <article class="mini-card"><span>Completed</span><strong>{{ summary.completedChallenges }}</strong></article>
          <article class="mini-card"><span>Classes</span><strong>{{ subjects.length }}</strong></article>
          <article class="mini-card"><span>Strand</span><strong>{{ summary.recommendedStrand }}</strong></article>
        </div>
      </section>

    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'

const NEW_WINDOW_MS = 72 * 60 * 60 * 1000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default {
  name: 'StudentDashboard',
  data() {
    return {
      authStore: null,
      nowMs: Date.now(),
      loadError: '',
      scoredAverageScore: 0,
      lessons: [],
      assessments: [],
      finalizedSubmissions: [],
      activitySubmissions: [],
      subjects: [],
      pendingSubjects: [],
      recommendation: null,
      subjectInsights: {},
      studentContext: { section: null, adviser: null },
      attendanceRecords: [],
      attendanceSummary: { totalRecords: 0, presentCount: 0, lateCount: 0, absentCount: 0, excusedCount: 0 },
      highlightResetTimer: null,
      refreshTimer: null,
      clockTimer: null
    }
  },
  computed: {
    displayName() {
      const user = this.authStore?.user || {}
      return String(user.name || user.displayName || user.username || 'Student').trim() || 'Student'
    },
    todayLabel() {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(this.nowMs))
    },
    sectionLabel() {
      return this.studentContext.section?.name ? `Section ${this.studentContext.section.name}` : 'Section not assigned'
    },
    adviserLabel() {
      return this.studentContext.adviser?.name ? `Adviser: ${this.studentContext.adviser.name}` : 'No adviser assigned'
    },
    summary() {
      const highest = this.finalizedSubmissions.reduce((max, item) => Math.max(max, Number(item.percentage || 0)), 0)
      return {
        averageScore: Number(Number(this.scoredAverageScore || 0).toFixed(2)),
        highestScore: Number(highest.toFixed(2)),
        completedChallenges: this.finalizedSubmissions.length,
        performanceTrend: this.getTrend(this.finalizedSubmissions),
        recommendedStrand: String(this.subjectInsights?.recommendedStrand?.name || this.recommendation?.recommendedStrand?.name || '').trim() || 'Not available yet'
      }
    },
    recommendationMeta() {
      const attempts = Number(this.subjectInsights?.assessmentAttemptsCount || this.finalizedSubmissions.length || 0)
      const raw = Number(this.subjectInsights?.recommendationProgressPercent ?? 0)
      const ready = Boolean(this.subjectInsights?.isRecommendationReady) || raw >= 100
      return { ready, progress: ready ? 100 : (attempts ? Math.max(1, Math.min(99, Math.round(raw))) : 0), statusLabel: ready ? 'Ready' : (attempts ? 'In Progress' : 'Not Started') }
    },
    recommendationHeadline() {
      return this.recommendationMeta.ready ? `Recommendation ready for ${this.summary.recommendedStrand}` : `Recommendation progress ${this.recommendationMeta.progress}%`
    },
    recommendationSupportCopy() {
      if (!this.recommendationMeta.progress) return 'Complete graded assessments to build your recommendation.'
      if (!this.recommendationMeta.ready) return 'Your recommendation keeps updating as you complete grading assessments.'
      return `Suggested strand: ${this.summary.recommendedStrand}`
    },
    activeDashboardSection() {
      return this.resolveDashboardSection(this.$route?.query?.section)
    },
    hasFocusedDashboardSection() {
      return Boolean(this.activeDashboardSection)
    },
    hasGradesData() {
      return this.recentGrades.length > 0
    },
    gradesBadgeText() {
      return this.hasGradesData
        ? `${this.recentGrades.length} result${this.recentGrades.length === 1 ? '' : 's'}`
        : 'Awaiting scores'
    },
    showGradesPanel() {
      return this.activeDashboardSection === 'grades'
    },
    showRecommendationsPanel() {
      return this.activeDashboardSection === 'recommendations'
    },
    activityMap() {
      return this.activitySubmissions.reduce((map, item) => {
        if (item.assessmentId) map[item.assessmentId] = item
        return map
      }, {})
    },
    assessmentMap() {
      return this.assessments.reduce((map, item) => {
        if (item.id) map[item.id] = item
        return map
      }, {})
    },
    assignmentPreview() {
      return this.assessments.map((item) => {
        const state = this.getTaskState(item)
        const due = this.getDueState(item, state.label)
        return {
          ...item,
          stateLabel: state.label,
          stateTone: state.tone,
          dueLabel: due.label,
          dueTone: due.tone,
          typeLabel: this.getTypeLabel(item),
          typeClass: this.getTypeClass(item),
          typeIcon: this.getTypeIcon(item),
          context: this.getContext(item),
          deadlineText: item.submissionDeadline ? this.formatDateTime(item.submissionDeadline) : 'No due date'
        }
      }).sort((a, b) => this.priority(a.dueTone) - this.priority(b.dueTone)).slice(0, 6)
    },
    recentGrades() {
      return this.finalizedSubmissions.slice(0, 5).map((item, index) => ({
        key: `${item.assessmentId || index}`,
        title: item.title || 'Assessment',
        context: this.getContext(this.assessmentMap[item.assessmentId] || { assessmentMode: item.assessmentMode }),
        score: this.getGrade(item),
        time: this.relative(item.submittedAt || item.createdAt)
      }))
    },
    announcementFeed() {
      const entries = []
      this.lessons.filter((item) => this.isNew(item.createdAt)).forEach((item, index) => {
        entries.push({ key: `lesson-${item.id || index}`, title: item.title || 'New lesson', message: `${item.teacherName || 'Teacher'} posted new lesson material.`, icon: 'fa-book-open', tone: 'info', time: this.relative(item.createdAt), at: new Date(item.createdAt || 0).getTime() || 0 })
      })
      this.assessments.filter((item) => this.isNew(item.createdAt)).forEach((item, index) => {
        entries.push({ key: `assessment-${item.id || index}`, title: item.title || 'New classwork', message: `${this.getTypeLabel(item)} added for ${this.getContext(item)}.`, icon: 'fa-clipboard-check', tone: 'warning', time: this.relative(item.createdAt), at: new Date(item.createdAt || 0).getTime() || 0 })
      })
      this.finalizedSubmissions.slice(0, 3).forEach((item, index) => {
        entries.push({ key: `submission-${item.assessmentId || index}`, title: item.title || 'Work completed', message: `You completed this task with ${this.getGrade(item)}.`, icon: 'fa-paper-plane', tone: 'success', time: this.relative(item.submittedAt || item.createdAt), at: new Date(item.submittedAt || item.createdAt || 0).getTime() || 0 })
      })
      return entries.sort((a, b) => b.at - a.at).slice(0, 8)
    },
    overviewCards() {
      return [
        { label: 'Upcoming Deadlines', value: String(this.assignmentPreview.filter((item) => ['urgent', 'warning', 'danger'].includes(item.dueTone)).length), note: 'Tasks needing attention this week', icon: 'fa-clock', tone: 'warning' },
        { label: 'Recent Grades', value: String(this.recentGrades.length), note: `${this.formatPercent(this.summary.averageScore)} current average`, icon: 'fa-chart-column', tone: 'info' },
        {
          label: 'Recommendations',
          value: this.recommendationMeta.ready ? 'Ready' : `${this.recommendationMeta.progress}%`,
          note: this.recommendationMeta.ready
            ? `Suggested strand: ${this.summary.recommendedStrand}`
            : 'Progress toward your strand recommendation',
          icon: 'fa-lightbulb',
          tone: this.recommendationMeta.ready ? 'success' : 'teal'
        },
        { label: 'Classes', value: String(this.subjects.length), note: this.subjects.length ? 'Organized into clear course cards' : 'Join a class to get started', icon: 'fa-book', tone: 'success' }
      ]
    },
    recommendationAssessmentStats() {
      return [
        { label: 'Quiz', value: this.formatWholePercent(this.averagePercentageForRows(this.finalizedSubmissions.filter((item) => String(item?.assessmentMode || '').trim().toLowerCase() === 'quiz'))) },
        { label: 'Exam', value: this.formatWholePercent(this.averagePercentageForRows(this.finalizedSubmissions.filter((item) => String(item?.assessmentMode || '').trim().toLowerCase() === 'grading_assessment'))) },
        { label: 'Activities', value: this.formatWholePercent(this.averagePercentageForRows(this.activitySubmissions)) }
      ]
    }
  },
  watch: {
    '$route.query.section'() {
      this.scheduleDashboardSectionFocus()
    }
  },
  created() {
    this.clockTimer = window.setInterval(() => { this.nowMs = Date.now() }, 60000)
  },
  mounted() {
    this.authStore = useAuthStore()
    if (typeof window !== 'undefined') {
      window.addEventListener('student-dashboard-section-focus', this.handleDashboardSectionFocus)
    }
    this.fetchDashboardData()
    this.scheduleDashboardSectionFocus()
    this.refreshTimer = window.setInterval(() => this.fetchDashboardData(), 60000)
  },
  beforeUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('student-dashboard-section-focus', this.handleDashboardSectionFocus)
    }
    if (this.highlightResetTimer) window.clearTimeout(this.highlightResetTimer)
    if (this.refreshTimer) window.clearInterval(this.refreshTimer)
    if (this.clockTimer) window.clearInterval(this.clockTimer)
  },
  methods: {
    resolveDashboardSection(section) {
      const normalized = String(section || '').trim().toLowerCase()
      if (normalized === 'recommendations') return 'recommendations'
      if (normalized === 'grades') return 'grades'
      return ''
    },
    focusDashboardSection(section) {
      const targetSection = this.resolveDashboardSection(section)
      if (!targetSection || typeof window === 'undefined') return
      const target = document.querySelector(`[data-dashboard-section="${targetSection}"]`)
      if (!(target instanceof HTMLElement)) return
      if (this.highlightResetTimer) {
        window.clearTimeout(this.highlightResetTimer)
        this.highlightResetTimer = null
      }
      document.querySelectorAll('.section-highlight').forEach((element) => element.classList.remove('section-highlight'))
      target.classList.remove('section-highlight')
      void target.offsetWidth
      target.classList.add('section-highlight')
      this.highlightResetTimer = window.setTimeout(() => {
        target.classList.remove('section-highlight')
        this.highlightResetTimer = null
      }, 1800)
      const targetTop = target.getBoundingClientRect().top + window.scrollY - 110
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    },
    scheduleDashboardSectionFocus(section = this.$route?.query?.section) {
      const targetSection = this.resolveDashboardSection(section)
      if (!targetSection || typeof window === 'undefined') return
      this.$nextTick(() => {
        window.setTimeout(() => this.focusDashboardSection(targetSection), 120)
      })
    },
    handleDashboardSectionFocus(event) {
      this.scheduleDashboardSectionFocus(event?.detail?.section)
    },
    clamp(value) {
      const num = Number(value || 0)
      return Math.max(0, Math.min(100, Number.isFinite(num) ? num : 0))
    },
    uniqueBy(items, keyResolver) {
      const seen = new Set()
      return (Array.isArray(items) ? items : []).filter((item, index) => {
        const key = String(keyResolver(item, index) || '').trim()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
    resolveApiBaseUrl() {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      if (configured.endsWith('/api')) return configured
      return `${configured}/api`
    },
    getAuthConfig() {
      const token = this.authStore?.token || localStorage.getItem('edumatch_auth_token') || ''
      return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    },
    isNew(value) {
      const time = new Date(value || 0).getTime()
      return Boolean(time) && (this.nowMs - time) <= NEW_WINDOW_MS
    },
    formatDate(value) {
      const parsed = new Date(value || 0)
      if (Number.isNaN(parsed.getTime())) return 'N/A'
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(parsed)
    },
    formatDateTime(value) {
      const parsed = new Date(value || 0)
      if (Number.isNaN(parsed.getTime())) return 'N/A'
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(parsed)
    },
    relative(value) {
      const time = new Date(value || 0).getTime()
      if (!time) return 'N/A'
      const diff = this.nowMs - time
      const mins = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      if (mins < 1) return 'Just now'
      if (mins < 60) return `${mins}m ago`
      if (hours < 24) return `${hours}h ago`
      if (days < 7) return `${days}d ago`
      return this.formatDate(value)
    },
    formatPercent(value) {
      return `${Number(value || 0).toFixed(2)}%`
    },
    formatWholePercent(value) {
      return `${Math.round(Number(value || 0))}%`
    },
    latestRowsByAssessment(rows = []) {
      const latest = new Map()
      rows.forEach((row, index) => {
        const key = String(row?.assessmentId || row?.id || `row-${index}`)
        if (!key) return
        const current = latest.get(key)
        const rowTime = new Date(row?.submittedAt || row?.gradedAt || row?.createdAt || 0).getTime() || 0
        const currentTime = current ? (new Date(current.submittedAt || current.gradedAt || current.createdAt || 0).getTime() || 0) : -1
        if (!current || rowTime >= currentTime) latest.set(key, row)
      })
      return [...latest.values()]
    },
    averagePercentageForRows(rows = []) {
      const percentages = this.latestRowsByAssessment(rows).reduce((values, row) => {
        const totalPoints = Number(row?.totalPoints || 0)
        const hasScoredData = totalPoints > 0 || row?.gradeValue !== null && row?.gradeValue !== undefined || Number(row?.percentage || 0) > 0
        const percentage = Number(row?.percentage ?? (totalPoints > 0 ? ((Number(row?.score || row?.gradeValue || 0) / totalPoints) * 100) : 0))
        if (!hasScoredData || !Number.isFinite(percentage)) return values
        values.push(Math.max(0, Math.min(100, percentage)))
        return values
      }, [])
      if (!percentages.length) return 0
      return Number((percentages.reduce((sum, value) => sum + value, 0) / percentages.length).toFixed(2))
    },
    getTypeLabel(item) {
      const mode = String(item?.assessmentMode || '').trim().toLowerCase()
      if (mode === 'grading_assessment') return 'Exam'
      if (mode === 'quiz') return 'Quiz'
      return 'Activity'
    },
    getTypeClass(item) {
      const mode = String(item?.assessmentMode || '').trim().toLowerCase()
      if (mode === 'grading_assessment') return 'warning'
      if (mode === 'quiz') return 'info'
      return 'teal'
    },
    getTypeIcon(item) {
      const mode = String(item?.assessmentMode || '').trim().toLowerCase()
      if (mode === 'grading_assessment') return 'fa-file-alt'
      if (mode === 'quiz') return 'fa-clipboard-list'
      return 'fa-book-open'
    },
    shouldShowClassworkDuePill(item) {
      const dueLabel = String(item?.dueLabel || '').trim().toLowerCase()
      const stateLabel = String(item?.stateLabel || '').trim().toLowerCase()
      if (!dueLabel) return false
      return dueLabel !== stateLabel
    },
    getContext(item) {
      return item?.lessonTitle || item?.lessonSubject || item?.strand || 'Direct class task'
    },
    getTaskState(item) {
      const activity = this.activityMap[item.id]
      const hasFinalizedSubmission = this.finalizedSubmissions.some((row) => row.assessmentId === item.id)
      if (String(item?.assessmentMode || '').trim().toLowerCase() === 'activity') {
        if (activity?.gradedAt || activity?.gradeValue !== null || (activity?.totalPoints > 0 && activity?.status === 'completed')) return { label: 'Graded', tone: 'success' }
        if (activity?.status === 'completed') return { label: 'Submitted', tone: 'info' }
        if (activity?.hasContent) return { label: 'Draft Saved', tone: 'violet' }
      }
      if (hasFinalizedSubmission) return { label: 'Completed', tone: 'success' }
      const deadline = new Date(item?.submissionDeadline || 0).getTime()
      if (deadline && deadline <= this.nowMs && !activity) return { label: 'Missing', tone: 'danger' }
      return { label: 'Ready', tone: 'teal' }
    },
    getDueState(item, stateLabel) {
      const deadline = new Date(item?.submissionDeadline || 0).getTime()
      if (!deadline) return { label: stateLabel, tone: 'info' }
      const diff = deadline - this.nowMs
      if (['Graded', 'Submitted'].includes(stateLabel)) return { label: stateLabel, tone: 'success' }
      if (diff <= 0) return { label: 'Past due', tone: 'danger' }
      if (diff <= 86400000) return { label: 'Due today', tone: 'urgent' }
      if (diff <= WEEK_MS) return { label: 'Due this week', tone: 'warning' }
      return { label: this.formatDate(item.submissionDeadline), tone: 'info' }
    },
    priority(tone) {
      return { danger: 0, urgent: 1, warning: 2, info: 3, teal: 4, success: 5 }[tone] ?? 6
    },
    getGrade(item) {
      const total = Number(item?.totalPoints || 0)
      const score = Number(item?.score || 0)
      const pct = Number(item?.percentage || 0)
      if (item?.gradeValue !== null && item?.gradeValue !== undefined) return total > 0 ? `${item.gradeValue}/${total}` : String(item.gradeValue)
      if (total > 0) return `${score}/${total} (${pct.toFixed(0)}%)`
      if (pct > 0) return `${pct.toFixed(0)}%`
      return 'Reviewed'
    },
    getTrend(rows = []) {
      if (!Array.isArray(rows) || rows.length < 4) return 'Not enough data'
      const sorted = [...rows].sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0))
      const recent = sorted.slice(0, 3).map((row) => Number(row.percentage || 0))
      const previous = sorted.slice(3, 6).map((row) => Number(row.percentage || 0))
      if (!recent.length || !previous.length) return 'Not enough data'
      const recentAvg = recent.reduce((sum, value) => sum + value, 0) / recent.length
      const previousAvg = previous.reduce((sum, value) => sum + value, 0) / previous.length
      const delta = Number((recentAvg - previousAvg).toFixed(2))
      if (delta > 1) return `Improving (+${delta}%)`
      if (delta < -1) return `Needs focus (${delta}%)`
      return 'Stable'
    },
    attendanceTone(status) {
      const value = String(status || '').trim().toLowerCase()
      if (value === 'present') return 'success'
      if (value === 'late') return 'info'
      if (value === 'excused') return 'violet'
      if (value === 'absent') return 'danger'
      return 'teal'
    },
    async fetchRecommendation() {
      try {
        const user = this.authStore?.user || {}
        const studentId = String(user.id || user._id || '').trim()
        if (!studentId) return null
        const response = await axios.get(`${this.resolveApiBaseUrl()}/recommendation/${studentId}`, this.getAuthConfig())
        return response.data?.recommendation || null
      } catch (_error) {
        return null
      }
    },
    async fetchDashboardData() {
      try {
        this.loadError = ''
        const base = this.resolveApiBaseUrl()
        const auth = this.getAuthConfig()
        const [lessonsRes, assessmentsRes, submissionsRes, activityRes, subjectsRes, recommendationRes, attendanceRes] = await Promise.all([
          axios.get(`${base}/student/lessons`, auth),
          axios.get(`${base}/student/assessments`, auth),
          axios.get(`${base}/student/submissions/me`, auth),
          axios.get(`${base}/student/activity-submissions`, auth),
          axios.get(`${base}/student/subjects`, auth),
          this.fetchRecommendation(),
          axios.get(`${base}/student/attendance`, auth)
        ])

        this.lessons = this.uniqueBy(lessonsRes.data?.lessons || [], (item, index) => item.id || item._id || `${item.title || ''}-${index}`).map((item, index) => ({ id: String(item.id || item._id || `lesson-${index + 1}`), title: item.title || 'Untitled Lesson', teacherName: item.teacher?.name || '', createdAt: item.createdAt || item.postedAt || null }))
        this.assessments = this.uniqueBy(assessmentsRes.data?.assessments || [], (item, index) => item.id || item._id || `${item.title || ''}-${index}`).map((item, index) => ({ id: String(item.id || item._id || `assessment-${index + 1}`), title: item.title || 'Untitled Assessment', lessonTitle: item.lessonTitle || '', lessonSubject: item.lessonSubject || item.subject || '', teacherName: item.teacherName || item.createdBy?.name || '', assessmentMode: String(item.assessmentMode || 'activity').trim().toLowerCase(), strand: item.strand || item.track || '', submissionDeadline: item.submissionDeadline || null, createdAt: item.createdAt || null }))
        this.finalizedSubmissions = (submissionsRes.data?.submissions || []).map((item, index) => ({ id: String(item._id || `submission-${index + 1}`), assessmentId: String(item.assessmentId?._id || item.assessmentId || ''), title: item.assessmentId?.title || item.assessmentTitle || 'Assessment', assessmentMode: String(item.assessmentId?.assessmentMode || item.assessmentMode || 'activity').trim().toLowerCase(), score: Number(item.score || 0), totalPoints: Number(item.totalPoints || 0), percentage: Number(item.percentage || 0), submittedAt: item.submittedAt || item.createdAt || null, createdAt: item.createdAt || null }))
        this.activitySubmissions = (activityRes.data?.submissions || []).map((item, index) => ({ id: String(item.id || `activity-${index + 1}`), assessmentId: String(item.assessmentId || ''), status: String(item.status || 'in_progress').trim().toLowerCase(), hasContent: Boolean(item.hasContent), gradedAt: item.gradedAt || null, submittedAt: item.submittedAt || null, createdAt: item.createdAt || null, gradeValue: item.gradeValue ?? null, score: Number(item.score || 0), totalPoints: Number(item.totalPoints || 0), percentage: Number(item.percentage || 0) }))
        this.subjects = subjectsRes.data?.subjects || []
        this.pendingSubjects = subjectsRes.data?.pendingSubjects || []
        this.studentContext = subjectsRes.data?.studentContext || { section: null, adviser: null }
        this.subjectInsights = subjectsRes.data?.insights || recommendationRes || {}
        this.recommendation = recommendationRes
        this.attendanceRecords = attendanceRes.data?.records || []
        this.attendanceSummary = attendanceRes.data?.summary || this.attendanceSummary
        this.scoredAverageScore = Number(submissionsRes.data?.summary?.averageScore || 0)
      } catch (error) {
        console.error('Failed to fetch student dashboard data:', error)
        this.loadError = 'We could not refresh the latest dashboard data right now. Showing the most recent information available.'
      }
    }
  }
}
</script>

<style scoped>
.student-dashboard-page {
  --ink: #12243a;
  --body: #4b5c70;
  --muted: #708094;
  --border: rgba(148, 163, 184, 0.2);
  --panel: rgba(255, 255, 255, 0.95);
  --shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 1rem;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.hero,
.panel,
.summary-card {
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  padding: 1.15rem;
  border: 1px solid transparent;
  background:
    linear-gradient(135deg, rgba(30, 67, 7, 0.18) 0%, rgba(255, 213, 66, 0.22) 42%, rgba(187, 255, 89, 0.2) 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
}

.hero .hero-subheader {
  color: #ffffff !important;
}

.hero .hero-subtitle {
  color: #ffffff !important;
}

.hero .hero-copy p {
  color: #ffffff;
}

.hero-copy,
.panel,
.summary-card,
.course-card,
.item-card,
.mini-card {
  display: grid;
  gap: 0.75rem;
}

.eyebrow {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

.eyebrow.light {
  color: rgba(255, 255, 255, 0.86);
}

.hero-subheader,
.panel-subheader {
  margin: 0;
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-subtitle,
.panel-subtitle {
  max-width: 62ch;
}

.hero-copy h2,
.panel h3,
.summary-value,
.insight-hero h4 {
  margin: 0;
  color: var(--ink);
}

.hero-copy h2 {
  max-width: 12ch;
  font-size: clamp(1.7rem, 3vw, 2.3rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.hero-copy p,
.panel p,
.feed-copy p {
  margin: 0;
  color: var(--body);
  font-size: 0.88rem;
  line-height: 1.6;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.spread {
  justify-content: space-between;
}

.wrap {
  flex-wrap: wrap;
}

.chip-row,
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 0.8rem;
}

.overview-section,
.panel-heading {
  display: grid;
  gap: 0.35rem;
}

.chip,
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 32px;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
}

.chip {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(191, 219, 254, 0.7);
  color: var(--body);
}

.hero .chip {
  background: rgba(255, 252, 236, 0.88);
  border-color: rgba(169, 213, 95, 0.7);
  color: #3f4c1d;
}

.hero .chip i {
  color: #5d7a14;
}

.success { background: #ecfff1; color: #15803d; }
.warning { background: #fff7e7; color: #b45309; }
.info { background: #eaf1ff; color: #2563eb; }
.teal { background: #e8fffb; color: #0f766e; }
.violet { background: #f5f0ff; color: #6d28d9; }
.danger,
.urgent { background: #fff1ea; color: #c2410c; }

.alert-copy,
.pending-note,
.empty-state,
.simple-card,
.item-card,
.course-card,
.feed-item,
.mini-card {
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 18px;
  background: #ffffff;
}

.alert-copy,
.pending-note,
.empty-state {
  display: flex;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
}

.alert-copy {
  color: #c2410c;
  background: #fff7ed;
  border-color: rgba(251, 146, 60, 0.38);
}

.panel-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.65rem 0.95rem;
  border-radius: 14px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: rgba(37, 99, 235, 0.08);
  color: #1e4307;
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.panel.classwork-panel {
  gap: 0.8rem;
  padding: 0.95rem;
  border: 1px solid transparent;
  background:
    linear-gradient(180deg, #ffffff 0%, #ffffff 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
}

.panel-head.classwork-panel-head {
  align-items: center;
  gap: 0.7rem;
}

.classwork-panel-heading {
  gap: 0.55rem;
}

.classwork-panel-heading .panel-subheader {
  color: #4f6314;
}

.classwork-panel-heading .panel-subtitle {
  color: #4d6120;
}

.classwork-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.classwork-title-row h3 {
  margin: 0;
  color: #1e4307;
}

.classwork-panel-link {
  align-self: flex-start;
  gap: 0.45rem;
  background: linear-gradient(135deg, rgba(30, 67, 7, 0.14) 0%, rgba(95, 116, 24, 0.12) 100%);
  border-color: rgba(30, 67, 7, 0.34);
  color: #1e4307;
  box-shadow: 0 10px 20px rgba(30, 67, 7, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.classwork-panel-link:hover {
  transform: translateY(-1px);
  border-color: #1e4307;
  color: #163304;
  box-shadow: 0 16px 28px rgba(30, 67, 7, 0.14);
}

.classwork-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.6rem;
}

.classwork-card {
  position: relative;
  display: grid;
  gap: 0.65rem;
  align-content: start;
  min-height: 100%;
  padding: 0.9rem;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.classwork-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 38px rgba(15, 23, 42, 0.1);
}

.item-card.classwork-card.warning,
.item-card.classwork-card.urgent {
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.14), transparent 32%),
    linear-gradient(180deg, #ffffff 0%, #fffaf0 100%);
}

.item-card.classwork-card.danger {
  border-color: rgba(251, 146, 60, 0.28);
  background:
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.16), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #fff8f4 100%);
}

.item-card.classwork-card.success {
  border-color: rgba(74, 222, 128, 0.24);
  background:
    radial-gradient(circle at top right, rgba(74, 222, 128, 0.14), transparent 32%),
    linear-gradient(180deg, #ffffff 0%, #f4fff8 100%);
}

.classwork-card-top,
.classwork-card-top-main,
.classwork-badge-row {
  display: grid;
}

.classwork-card-top {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: start;
}

.classwork-card-top-main {
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.7rem;
  align-items: center;
}

.classwork-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.95);
  font-size: 1rem;
}

.classwork-card-icon.warning {
  background: #fff7e7;
  color: #b45309;
}

.classwork-card-icon.info {
  background: #eaf1ff;
  color: #2563eb;
}

.classwork-card-icon.teal {
  background: #e8fffb;
  color: #0f766e;
}

.classwork-card-top-copy {
  min-width: 0;
  display: grid;
  gap: 0.2rem;
}

.classwork-card-top-copy h4 {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.22;
}

.classwork-card-top-copy p {
  margin: 0;
  color: var(--body);
  font-size: 0.84rem;
  line-height: 1.45;
}

.classwork-badge-row {
  grid-template-columns: repeat(2, max-content);
  gap: 0.45rem;
}

.classwork-due-pill {
  align-self: start;
  justify-self: end;
}

.classwork-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.classwork-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  min-height: 32px;
  padding: 0.34rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.86);
  color: var(--body);
  font-size: 0.74rem;
  font-weight: 800;
}

.classwork-empty-state {
  min-height: 220px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.9rem;
  padding: 1.35rem 1.2rem;
  text-align: center;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.classwork-empty-icon {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f4f7d8 0%, #eef6c0 100%);
  box-shadow: inset 0 0 0 1px rgba(169, 213, 95, 0.55);
  color: #4f6314;
  font-size: 1.35rem;
}

.classwork-empty-copy {
  display: grid;
  justify-items: center;
  gap: 0.28rem;
  max-width: 30rem;
}

.classwork-empty-label {
  color: #5f7418;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.classwork-empty-copy h4 {
  margin: 0;
  color: #1e4307;
  font-size: 1.02rem;
  line-height: 1.3;
}

.classwork-empty-copy p {
  margin: 0;
  color: #4d6120;
  font-size: 0.88rem;
  line-height: 1.6;
  text-align: center;
}

.panel.course-directory-panel {
  gap: 0.8rem;
  padding: 0.95rem;
  border: 1px solid transparent;
  background:
    linear-gradient(180deg, #ffffff 0%, #ffffff 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
}

.panel-head.course-directory-head {
  align-items: center;
  gap: 0.7rem;
}

.course-directory-heading {
  gap: 0.5rem;
}

.course-directory-heading .panel-subheader {
  color: #4f6314;
}

.course-directory-heading .panel-subtitle {
  color: #4d6120;
}

.course-directory-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.course-directory-title-row h3 {
  margin: 0;
  color: #1e4307;
}

.course-directory-link {
  align-self: flex-start;
  gap: 0.45rem;
  background: linear-gradient(135deg, rgba(30, 67, 7, 0.14) 0%, rgba(95, 116, 24, 0.12) 100%);
  border-color: rgba(30, 67, 7, 0.34);
  color: #1e4307;
  box-shadow: 0 10px 20px rgba(30, 67, 7, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.course-directory-link:hover {
  transform: translateY(-1px);
  border-color: #1e4307;
  color: #163304;
  box-shadow: 0 15px 28px rgba(30, 67, 7, 0.14);
}

.course-directory-panel .course-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.course-card.course-directory-card {
  display: grid;
  gap: 0.7rem;
  padding: 0.9rem;
  border-radius: 20px;
  border-color: rgba(169, 213, 95, 0.42);
  background:
    radial-gradient(circle at top right, rgba(255, 213, 66, 0.12), transparent 34%),
    linear-gradient(180deg, #fffef8 0%, #f9fce8 100%);
  box-shadow: 0 12px 24px rgba(30, 67, 7, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.course-card.course-directory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 34px rgba(30, 67, 7, 0.1);
}

.course-card-top,
.course-card-heading,
.course-card-copy {
  display: grid;
}

.course-card-top {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: start;
}

.course-card-heading {
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.72rem;
  align-items: center;
}

.course-card-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f4f7d8 0%, #eef6c0 100%);
  box-shadow: inset 0 0 0 1px rgba(169, 213, 95, 0.55);
  color: #4f6314;
  font-size: 1rem;
}

.course-card-copy {
  min-width: 0;
  gap: 0.22rem;
}

.course-card-copy h4 {
  margin: 0;
  color: #1e4307;
  font-size: 1rem;
  line-height: 1.22;
}

.course-card-copy p {
  margin: 0;
  color: #637227;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.course-status-pill {
  align-self: start;
}

.course-teacher-row {
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
  width: fit-content;
  min-height: 32px;
  margin: 0;
  padding: 0.34rem 0.68rem;
  border-radius: 999px;
  border: 1px solid rgba(169, 213, 95, 0.42);
  background: rgba(255, 253, 241, 0.9);
  color: #4d6120;
}

.course-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
}

.course-metric-card {
  display: grid;
  gap: 0.18rem;
  padding: 0.72rem 0.78rem;
  border-radius: 16px;
  border: 1px solid rgba(169, 213, 95, 0.42);
  background: rgba(255, 253, 241, 0.88);
}

.course-metric-card span {
  color: #637227;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.course-metric-card strong {
  color: #1e4307;
  font-size: 0.96rem;
  line-height: 1.25;
}

.course-progress-block {
  gap: 0.38rem;
  padding: 0.78rem 0.82rem;
  border-radius: 16px;
  border: 1px solid rgba(169, 213, 95, 0.42);
  background: rgba(255, 253, 241, 0.9);
  color: #4d6120;
}

.course-progress-track {
  height: 9px;
  background: rgba(214, 230, 167, 0.7);
}

.course-progress-block .progress-fill {
  background: linear-gradient(90deg, #1e4307 0%, #7ca51f 100%);
}

.summary-grid,
.dashboard-grid,
.course-grid,
.mini-grid {
  display: grid;
  gap: 0.9rem;
}

.summary-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.summary-grid .summary-card {
  border-color: rgba(169, 213, 95, 0.52);
  background: linear-gradient(180deg, #fbfce9 0%, #fbfce9 100%);
  box-shadow: 0 14px 28px rgba(30, 67, 7, 0.06);
}

.summary-card,
.panel,
.item-card,
.course-card,
.feed-item,
.simple-card,
.mini-card {
  padding: 0.95rem;
}

.icon-badge {
  width: 42px;
  height: 42px;
  border-radius: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-grid .icon-badge {
  background: #eef4bf;
  color: #4f6314;
  box-shadow: inset 0 0 0 1px rgba(169, 213, 95, 0.45);
}

.summary-label {
  margin: 0;
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-grid .summary-label {
  color: #637227;
}

.summary-value {
  font-size: 1.9rem;
  line-height: 1;
  letter-spacing: -0.04em;
}

.summary-grid .summary-value {
  color: #31410f;
}

.summary-note {
  margin: 0;
  color: var(--body);
  font-size: 0.84rem;
}

.summary-grid .summary-note {
  color: #556428;
}

.dashboard-grid {
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
}

.dashboard-grid.dashboard-grid-focused {
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  align-items: start;
}

.panel-focused {
  width: min(100%, 3000px);
  align-self: start;
}

.panel-head-focus {
  align-items: flex-start;
  justify-content: flex-start;
}

.panel-head-focus .panel-heading {
  width: min(100%, 860px);
}

.grades-headline-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem 0.75rem;
}

.grades-headline-row h3 {
  margin: 0;
  color: #1e4307;
}

.grades-panel-focused {
  gap: 0.7rem;
  align-content: start;
  grid-auto-rows: max-content;
  border: 1px solid transparent;
  background:
    linear-gradient(180deg, #ffffff 0%, #ffffff 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
}

.grades-panel-focused .panel-subheader {
  color: #4f6314;
}

.grades-panel-focused .panel-subtitle {
  color: #4d6120;
}

.grades-focus-badge {
  flex-shrink: 0;
  min-height: 32px;
  padding-inline: 0.8rem;
}

.grades-focus-badge.warning {
  background: #f4f7d8;
  color: #4f6314;
}

.grades-focus-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
  gap: 0.9rem;
  padding: 0.95rem 1rem;
  border-radius: 22px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 36%),
    linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
}

.grades-focus-copy,
.grades-focus-side,
.grades-focus-side-item {
  display: grid;
  gap: 0.45rem;
}

.grades-empty-hero,
.grades-empty-main,
.grades-empty-copy,
.grades-empty-guides,
.grades-empty-guide {
  display: grid;
}

.grades-empty-hero {
  grid-template-columns: minmax(0, 1fr);
  gap: 0.9rem;
  align-items: stretch;
  padding: 1rem 1.05rem;
  border-radius: 22px;
  border: 1px solid rgba(169, 213, 95, 0.42);
  background:
    radial-gradient(circle at top right, rgba(255, 213, 66, 0.12), transparent 38%),
    linear-gradient(180deg, #fffef8 0%, #f9fce8 100%);
}

.grades-empty-main {
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9rem;
  align-items: start;
}

.grades-empty-icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4f6314;
  background: rgba(244, 247, 216, 0.92);
  box-shadow: inset 0 0 0 1px rgba(169, 213, 95, 0.55);
  font-size: 1.1rem;
}

.grades-empty-copy {
  align-content: start;
  gap: 0.45rem;
}

.grades-empty-label {
  color: #5f7418;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.grades-empty-copy h4 {
  margin: 0;
  color: #1e4307;
  font-size: clamp(1.2rem, 2vw, 1.65rem);
  line-height: 1.15;
}

.grades-empty-copy p {
  margin: 0;
  max-width: 52ch;
  color: #4d6120;
}

.grades-empty-guides {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  align-content: stretch;
}

.grades-empty-guide {
  align-content: start;
  gap: 0.45rem;
  padding: 0.9rem 0.95rem;
  border-radius: 18px;
  border: 1px solid rgba(169, 213, 95, 0.42);
  background: rgba(255, 253, 241, 0.9);
}

.grades-empty-guide span {
  color: #637227;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.grades-empty-guide p {
  margin: 0;
  color: #1e4307;
  font-size: 0.92rem;
  line-height: 1.45;
}

.grades-focus-label {
  margin: 0;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.grades-focus-score {
  color: var(--ink);
  font-size: clamp(1.9rem, 4vw, 3rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.grades-focus-support {
  color: #2563eb;
  font-size: 0.9rem;
  font-weight: 800;
}

.grades-focus-side {
  align-content: center;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.grades-focus-side-item {
  padding: 0.75rem 0.9rem;
  border-radius: 18px;
  border: 1px solid rgba(219, 234, 254, 0.95);
  background: rgba(255, 255, 255, 0.85);
}

.grades-focus-side-item span {
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.grades-focus-side-item strong {
  color: var(--ink);
  font-size: 1.1rem;
  line-height: 1.25;
}

.recommendation-status-pill.ready {
  background: #e8f4c7;
  color: #1e4307;
}

.recommendation-status-pill.pending {
  background: #f4f7d8;
  color: #4f6314;
}

.grades-results-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.grades-results-list .simple-card {
  min-height: 92px;
  padding: 0.9rem 1rem;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.grades-empty-state {
  min-height: 92px;
  padding: 0.9rem 1rem;
  align-items: center;
}

.panel-wide,
.panel-side,
.stack,
.feed {
  display: grid;
  gap: 0.75rem;
}

.panel-head,
.simple-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.panel h3 {
  font-size: 1.1rem;
  line-height: 1.25;
}

.item-card.warning,
.item-card.urgent {
  background: linear-gradient(180deg, #ffffff 0%, #fffaf0 100%);
}

.item-card.danger {
  background: linear-gradient(180deg, #ffffff 0%, #fff8f4 100%);
}

.type.warning,
.type.urgent { background: #fff7e7; color: #b45309; }
.type.info { background: #eaf1ff; color: #2563eb; }
.type.teal { background: #e8fffb; color: #0f766e; }

.meta-row,
.teacher-copy {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.progress-block {
  display: grid;
  gap: 0.4rem;
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 800;
}

.progress-track {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(226, 232, 240, 0.95);
}

.progress-track.light {
  background: rgba(255, 255, 255, 0.24);
}

.progress-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #2563eb 0%, #14b8a6 100%);
}

.feed {
  list-style: none;
  margin: 0;
  padding: 0;
}

.feed-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.75rem;
}

.feed-copy {
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.feed-copy strong,
.simple-card strong,
.course-card h4,
.item-card h4 {
  color: var(--ink);
}

.feed-copy small,
.score-meta small {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 700;
}

.mini-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.recommendation-mini-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.mini-card span {
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mini-card strong {
  color: var(--ink);
  font-size: 1.1rem;
}

.mini-card.wide {
  grid-column: 1 / -1;
}

.score-meta {
  min-width: 110px;
  display: grid;
  justify-items: end;
  gap: 0.15rem;
}

.score-value {
  color: #2563eb;
  font-weight: 900;
}

.insight-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.8fr);
  gap: 1rem;
  padding: 1rem;
  border-radius: 22px;
  border: 1px solid rgba(169, 213, 95, 0.32);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, #1e4307 0%, #5f7418 55%, #95c331 100%);
}

.insight-hero.pending {
  border-color: rgba(169, 213, 95, 0.34);
  background:
    radial-gradient(circle at top right, rgba(255, 213, 66, 0.14), transparent 30%),
    linear-gradient(135deg, #445711 0%, #6b8c1b 55%, #93bb33 100%);
}

.insight-copy,
.insight-progress {
  display: grid;
  gap: 0.55rem;
}

.insight-copy {
  align-content: center;
}

.insight-kicker,
.insight-progress-label {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.insight-callout {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  min-height: 36px;
  padding: 0.55rem 0.8rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.45;
}

.insight-callout i {
  font-size: 0.86rem;
}

.insight-progress {
  align-content: center;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.insight-progress strong {
  font-size: clamp(1.8rem, 4vw, 2.35rem);
  line-height: 1;
  letter-spacing: -0.04em;
}

.insight-progress small {
  font-size: 0.83rem;
  font-weight: 800;
}

.panel[data-dashboard-section="recommendations"] {
  border: 1px solid transparent;
  background:
    linear-gradient(180deg, #ffffff 0%, #ffffff 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.panel[data-dashboard-section="recommendations"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(30, 67, 7, 0.12), 0 0 0 3px rgba(124, 165, 31, 0.1);
}

.panel[data-dashboard-section="recommendations"]:hover .insight-hero.pending {
  border-color: rgba(187, 255, 89, 0.42);
  background:
    radial-gradient(circle at top right, rgba(255, 213, 66, 0.18), transparent 30%),
    linear-gradient(135deg, #1e4307 0%, #5f7418 55%, #93bb33 100%);
}

.panel[data-dashboard-section="recommendations"] > .panel-head .panel-subheader {
  color: #4f6314;
}

.panel[data-dashboard-section="recommendations"] > .panel-head .panel-heading h3 {
  color: #1e4307;
}

.panel[data-dashboard-section="recommendations"] > .panel-head .panel-subtitle {
  color: #4d6120;
}

.panel[data-dashboard-section="recommendations"] .mini-card {
  border-color: rgba(169, 213, 95, 0.42);
  background: rgb(255, 255, 255);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.panel[data-dashboard-section="recommendations"] .mini-card:hover {
  transform: translateY(-1px);
  border-color: #7ca51f;
  background: linear-gradient(180deg, #fbfde9 0%, #f1f6cf 100%);
  box-shadow: 0 10px 20px rgba(30, 67, 7, 0.08);
}

.panel[data-dashboard-section="recommendations"] .mini-card span {
  color: #637227;
}

.panel[data-dashboard-section="recommendations"] .mini-card strong {
  color: #1e4307;
}

.panel[data-dashboard-section="recommendations"] .progress-fill {
  background: linear-gradient(90deg, #1e4307 0%, #7ca51f 100%);
}

.panel.section-highlight {
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08), 0 0 0 3px rgba(37, 99, 235, 0.12);
  animation: section-highlight-pulse 1s ease;
}

.insight-hero h4,
.insight-hero p,
.insight-hero strong,
.insight-hero small {
  color: #ffffff;
}

@keyframes section-highlight-pulse {
  0% {
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08), 0 0 0 0 rgba(37, 99, 235, 0.16);
  }

  55% {
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08), 0 0 0 6px rgba(37, 99, 235, 0.08);
  }

  100% {
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08), 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
}

@media (max-width: 1180px) {
  .hero,
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .recommendation-mini-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .course-grid,
  .mini-grid,
  .insight-hero,
  .grades-focus-hero,
  .grades-focus-side,
  .grades-empty-hero,
  .grades-empty-main,
  .grades-empty-guides,
  .grades-results-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .course-directory-panel .course-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .classwork-list {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .panel-head,
  .simple-card,
  .spread {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-link {
    width: 100%;
  }

  .classwork-card-top {
    grid-template-columns: minmax(0, 1fr);
  }

  .classwork-due-pill {
    justify-self: start;
  }

  .course-card-top,
  .course-metrics-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .course-status-pill {
    justify-self: start;
  }

  .score-meta {
    min-width: 0;
    justify-items: start;
  }
}

</style>
