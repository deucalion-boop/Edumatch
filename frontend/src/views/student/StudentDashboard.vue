<template>
  <main class="premium-dashboard">
    <template v-if="!hasFocusedDashboardSection">
      <section class="premium-hero" aria-labelledby="student-welcome-title">
        <div class="premium-hero__content">
          <span class="premium-eyebrow"><i class="fas fa-sparkles" aria-hidden="true"></i> My learning space</span>
          <h1 id="student-welcome-title">Welcome back, {{ displayName }}!</h1>
          <p>Everything you need for a focused and productive school day is right here.</p>
          <div class="premium-identity" aria-label="Student information">
            <span><i class="fas fa-calendar-day" aria-hidden="true"></i>{{ todayLabel }}</span>
            <span><i class="fas fa-users" aria-hidden="true"></i>{{ sectionLabel }}</span>
            <span><i class="fas fa-user-tie" aria-hidden="true"></i>{{ adviserLabel }}</span>
          </div>
          <p v-if="loadError" class="premium-alert" role="status">
            <i class="fas fa-circle-exclamation" aria-hidden="true"></i>{{ loadError }}
          </p>
        </div>
        <div class="premium-hero__visual" aria-hidden="true">
          <span class="visual-orbit visual-orbit--one"></span>
          <span class="visual-orbit visual-orbit--two"></span>
          <div class="visual-book"><i class="fas fa-book-open"></i></div>
          <span class="visual-chip visual-chip--top"><i class="fas fa-check"></i> Stay curious</span>
          <span class="visual-chip visual-chip--bottom"><i class="fas fa-bolt"></i> Keep growing</span>
        </div>
      </section>

      <section class="premium-overview" data-tour="dashboard-overview" aria-labelledby="overview-title">
        <div class="premium-section-heading premium-section-heading--compact">
          <div>
            <span class="premium-eyebrow">At a glance</span>
            <h2 id="overview-title">Your academic overview</h2>
          </div>
          <p>A quick pulse check on your learning journey.</p>
        </div>
        <div v-if="isInitialLoading" class="premium-summary-grid" aria-label="Loading academic overview">
          <article v-for="index in 4" :key="index" class="premium-summary-card premium-skeleton-card">
            <span class="skeleton skeleton--icon"></span>
            <span class="skeleton skeleton--short"></span>
            <span class="skeleton skeleton--value"></span>
            <span class="skeleton skeleton--line"></span>
          </article>
        </div>
        <div v-else class="premium-summary-grid">
          <article v-for="card in overviewCards" :key="card.label" class="premium-summary-card" :class="`premium-summary-card--${card.tone}`">
            <span class="premium-summary-card__icon"><i class="fas" :class="card.icon" aria-hidden="true"></i></span>
            <div class="premium-summary-card__copy">
              <span>{{ card.label }}</span>
              <strong class="premium-counter">{{ card.value }}</strong>
              <p>{{ card.note }}</p>
            </div>
            <span class="premium-summary-card__arrow" aria-hidden="true"><i class="fas fa-arrow-trend-up"></i></span>
          </article>
        </div>
      </section>

      <div v-if="isInitialLoading" class="premium-content-grid" aria-label="Loading dashboard content">
        <section class="premium-panel premium-panel--wide premium-skeleton-panel">
          <span class="skeleton skeleton--heading"></span>
          <span v-for="index in 3" :key="index" class="skeleton skeleton--task"></span>
        </section>
        <section class="premium-panel premium-skeleton-panel">
          <span class="skeleton skeleton--heading"></span>
          <span class="skeleton skeleton--illustration"></span>
        </section>
      </div>

      <template v-else>
        <div class="premium-content-grid">
          <section class="premium-panel premium-panel--wide" aria-labelledby="upcoming-work-title">
            <header class="premium-panel__header">
              <div>
                <span class="premium-eyebrow">Priority feed</span>
                <h2 id="upcoming-work-title">Upcoming work</h2>
                <p>Plan ahead and keep your most important tasks moving.</p>
              </div>
              <router-link to="/student/activities" class="premium-text-link">See all work <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
            </header>

            <div v-if="assignmentPreview.length" class="premium-timeline">
              <article v-for="item in assignmentPreview" :key="item.id" class="premium-task" :class="`premium-task--${item.dueTone}`">
                <div class="premium-task__rail" aria-hidden="true">
                  <span><i class="fas" :class="item.typeIcon"></i></span>
                </div>
                <div class="premium-task__body">
                  <div class="premium-task__topline">
                    <div>
                      <span class="premium-subject-label">{{ item.context }}</span>
                      <h3>{{ item.title }}</h3>
                    </div>
                    <span class="premium-due-badge" :class="`premium-due-badge--${item.dueTone}`">{{ item.dueLabel }}</span>
                  </div>
                  <div class="premium-task__chips">
                    <span><i class="fas fa-layer-group" aria-hidden="true"></i>{{ item.typeLabel }}</span>
                    <span :class="`premium-status--${item.stateTone}`"><i class="fas fa-circle" aria-hidden="true"></i>{{ item.stateLabel }}</span>
                    <span><i class="fas fa-user" aria-hidden="true"></i>{{ item.teacherName || 'Teacher' }}</span>
                    <span><i class="fas fa-calendar-alt" aria-hidden="true"></i>{{ item.deadlineText }}</span>
                  </div>
                  <div class="premium-task__progress">
                    <span><span :style="{ width: `${taskProgress(item)}%` }"></span></span>
                    <small>{{ taskProgress(item) }}% complete</small>
                  </div>
                </div>
              </article>
            </div>
            <div v-else class="premium-empty-state">
              <div class="premium-empty-state__art" aria-hidden="true">
                <span class="empty-check" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">
                  <i class="fas fa-check" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;"></i>
                </span>
                <i class="fas fa-clipboard-list"></i>
              </div>
              <div>
                <span class="premium-eyebrow">You’re all caught up</span>
                <h3>No upcoming work right now</h3>
                <p>Enjoy the breathing room or explore your lessons to get a head start on what’s next.</p>
                <router-link to="/student/lessons" class="premium-button">Explore lessons <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
              </div>
            </div>
          </section>

          <aside class="premium-panel premium-focus-card" aria-labelledby="focus-title">
            <span class="premium-eyebrow">Learning pulse</span>
            <h2 id="focus-title">Today’s focus</h2>
            <div class="premium-focus-ring" :style="{ '--focus-progress': `${recommendationMeta.progress * 3.6}deg` }">
              <div><strong>{{ recommendationMeta.progress }}%</strong><span>Path ready</span></div>
            </div>
            <p>{{ recommendationSupportCopy }}</p>
            <div class="premium-focus-stats">
              <div><span>Current average</span><strong>{{ formatPercent(summary.averageScore) }}</strong></div>
              <div><span>Completed</span><strong>{{ summary.completedChallenges }}</strong></div>
            </div>
            <router-link :to="{ path: '/student/dashboard', query: { section: 'recommendations' } }" class="premium-button premium-button--soft">View progress <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
          </aside>
        </div>

        <section class="premium-panel premium-classes" aria-labelledby="my-classes-title">
          <header class="premium-panel__header">
            <div>
              <span class="premium-eyebrow">Course spaces</span>
              <h2 id="my-classes-title">My classes</h2>
              <p>Jump back into lessons, assignments, and progress for every subject.</p>
            </div>
            <router-link to="/student/lessons" class="premium-text-link">View all classes <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
          </header>

          <div v-if="subjects.length" class="premium-course-grid">
            <article v-for="(subject, index) in subjects.slice(0, 4)" :key="subject.id || index" class="premium-course-card" :class="`premium-course-card--${(index % 4) + 1}`">
              <div class="premium-course-card__banner">
                <span class="premium-course-card__icon"><i class="fas fa-book-open" aria-hidden="true"></i></span>
                <span class="premium-course-card__status"><i class="fas fa-circle" aria-hidden="true"></i>Active</span>
              </div>
              <div class="premium-course-card__body">
                <span class="premium-subject-label">{{ subject.code || subject.track || 'Course' }}</span>
                <h3>{{ subject.className || subject.name || 'Course' }}</h3>
                <p class="premium-course-card__teacher"><i class="fas fa-chalkboard-teacher" aria-hidden="true"></i>{{ subject.teacher?.name || 'Teacher' }}</p>
                <p class="premium-course-card__schedule"><i class="fas fa-clock" aria-hidden="true"></i>{{ courseSchedule(subject) }}</p>
                <div class="premium-course-card__metrics">
                  <span><strong>{{ subject.lessonCount || 0 }}</strong> lessons</span>
                  <span><strong>{{ subject.assessmentCount || 0 }}</strong> assignments</span>
                </div>
                <div class="premium-course-card__progress">
                  <div><span>Lesson progress</span><strong>{{ formatWholePercent(subject.performance?.progress || 0) }}</strong></div>
                  <span class="premium-progress-track" role="progressbar" :aria-valuenow="clamp(subject.performance?.progress || 0)" aria-valuemin="0" aria-valuemax="100">
                    <span :style="{ width: `${clamp(subject.performance?.progress || 0)}%` }"></span>
                  </span>
                </div>
                <div class="premium-course-card__actions">
                  <router-link to="/student/lessons"><i class="fas fa-play" aria-hidden="true"></i>Lessons</router-link>
                  <router-link to="/student/activities"><i class="fas fa-list-check" aria-hidden="true"></i>Activities</router-link>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="premium-empty-state premium-empty-state--classes">
            <div class="premium-empty-state__art" aria-hidden="true"><i class="fas fa-graduation-cap"></i></div>
            <div>
              <span class="premium-eyebrow">Your classroom awaits</span>
              <h3>No approved classes yet</h3>
              <p>Visit Lessons to join a class and unlock course materials, activities, and progress tracking.</p>
              <router-link to="/student/lessons" class="premium-button">Find your classes <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
            </div>
          </div>
          <div v-if="pendingSubjects.length" class="premium-pending-note" role="status">
            <i class="fas fa-hourglass-half" aria-hidden="true"></i>
            <span>{{ pendingSubjects.length }} enrollment request{{ pendingSubjects.length === 1 ? '' : 's' }} waiting for approval.</span>
          </div>
        </section>
      </template>
    </template>

    <section
      v-if="showGradesPanel"
      class="premium-panel premium-focus-panel premium-grades-panel"
      data-dashboard-section="grades"
      aria-labelledby="recent-results-title"
    >
      <header class="grades-premium-header">
        <div class="grades-premium-header__copy">
          <span class="premium-eyebrow"><i class="fas fa-chart-simple" aria-hidden="true"></i> Grades overview</span>
          <h1 id="recent-results-title">Recent results</h1>
          <p>Track your academic performance, celebrate your progress, and discover where to focus next.</p>
        </div>
        <router-link to="/student/dashboard" class="grades-back-button">
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
          <span>Back to dashboard</span>
        </router-link>
      </header>
      <div v-if="isInitialLoading" class="grades-stat-grid" aria-label="Loading grade statistics">
        <article v-for="index in 4" :key="index" class="grades-stat-card grades-stat-card--skeleton">
          <span class="skeleton skeleton--icon"></span>
          <div><span class="skeleton skeleton--short"></span><span class="skeleton skeleton--value"></span></div>
        </article>
      </div>
      <div v-else class="grades-stat-grid" aria-label="Grade statistics">
        <article v-for="stat in gradeOverviewStats" :key="stat.label" class="grades-stat-card" :class="`grades-stat-card--${stat.tone}`">
          <span class="grades-stat-card__icon" aria-hidden="true"><i class="fas" :class="stat.icon"></i></span>
          <div>
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value }}</strong>
            <small>{{ stat.note }}</small>
          </div>
        </article>
      </div>

      <div v-if="isInitialLoading" class="grades-content-skeleton" aria-label="Loading recent results">
        <span class="skeleton grades-content-skeleton__visual"></span>
        <div>
          <span class="skeleton skeleton--heading"></span>
          <span class="skeleton skeleton--line"></span>
          <span class="skeleton skeleton--line"></span>
          <span class="skeleton grades-content-skeleton__button"></span>
        </div>
      </div>
      <div v-else-if="hasGradesData" class="grades-results-dashboard">
        <aside class="grades-performance-card">
          <span class="grades-performance-card__eyebrow">Performance snapshot</span>
          <strong>{{ formatPercent(summary.averageScore) }}</strong>
          <p><i class="fas fa-arrow-trend-up" aria-hidden="true"></i>{{ summary.performanceTrend }}</p>
          <div class="grades-performance-card__track" role="progressbar" :aria-valuenow="clamp(summary.averageScore)" aria-valuemin="0" aria-valuemax="100">
            <span :style="{ width: `${clamp(summary.averageScore)}%` }"></span>
          </div>
          <small>Based on your published graded work</small>
        </aside>
        <div class="grades-results-feed">
          <div class="grades-results-feed__heading">
            <div><span class="premium-eyebrow">Latest activity</span><h2>Published scores</h2></div>
            <span class="grades-result-count">{{ gradesBadgeText }}</span>
          </div>
          <div class="premium-results-list">
          <article v-for="grade in recentGrades" :key="grade.key">
            <span class="premium-results-list__icon"><i class="fas fa-award" aria-hidden="true"></i></span>
            <div><h3>{{ grade.title }}</h3><p>{{ grade.context }} · {{ grade.time }}</p></div>
            <strong>{{ grade.score }}</strong>
          </article>
          </div>
        </div>
      </div>
      <div v-else class="grades-premium-empty">
        <div class="grades-premium-empty__visual" aria-hidden="true">
          <span class="grades-visual-orbit"></span>
          <div class="grades-visual-sheet">
            <i class="fas fa-chart-line"></i>
            <span><b></b><b></b><b></b></span>
          </div>
          <span class="grades-visual-badge"><i class="fas fa-star"></i></span>
        </div>
        <div class="grades-premium-empty__copy">
          <span class="premium-eyebrow">Your progress story starts here</span>
          <h2>No scores posted yet</h2>
          <p>Once your teachers publish graded quizzes, activities, or exams, your results and performance insights will appear here automatically.</p>
          <div class="grades-empty-guidance">
            <span><i class="fas fa-check-circle" aria-hidden="true"></i> Results update automatically</span>
            <span><i class="fas fa-shield-heart" aria-hidden="true"></i> Your grades stay private</span>
          </div>
          <router-link to="/student/activities" class="grades-primary-button">
            <span>Explore activities</span>
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </div>
      </div>
    </section>

    <section
      v-if="showRecommendationsPanel"
      class="premium-panel premium-focus-panel premium-pathway-panel"
      data-tour="dashboard-progress-insights"
      data-dashboard-section="recommendations"
      aria-labelledby="recommendation-title"
    >
      <header class="pathway-premium-header">
        <div class="pathway-premium-header__copy">
          <span class="premium-eyebrow"><i class="fas fa-compass" aria-hidden="true"></i> Personalized pathway</span>
          <h1 id="recommendation-title">Recommendation progress</h1>
          <p>Turn your assessment results into a clearer picture of the academic strand that fits your strengths.</p>
        </div>
        <router-link to="/student/dashboard" class="pathway-back-button">
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
          <span>Back to dashboard</span>
        </router-link>
      </header>

      <div v-if="isInitialLoading" class="pathway-loading" aria-label="Loading recommendation progress">
        <div><span class="skeleton skeleton--short"></span><span class="skeleton skeleton--heading"></span><span class="skeleton skeleton--line"></span><span class="skeleton skeleton--line"></span></div>
        <span class="skeleton pathway-loading__ring"></span>
      </div>

      <div v-else class="pathway-hero" data-tour="dashboard-strand-recommendation">
        <div class="pathway-hero__copy">
          <span class="pathway-status" :class="{ 'pathway-status--ready': recommendationMeta.ready }">
            <i class="fas" :class="recommendationMeta.ready ? 'fa-circle-check' : 'fa-sparkles'" aria-hidden="true"></i>
            {{ recommendationMeta.statusLabel }}
          </span>
          <h2>{{ recommendationHeadline }}</h2>
          <p>{{ recommendationSupportCopy }}</p>
          <div class="pathway-milestone">
            <span class="pathway-milestone__icon"><i class="fas fa-lightbulb" aria-hidden="true"></i></span>
            <div>
              <strong>{{ recommendationMeta.ready ? 'Your suggested pathway is ready' : 'Build a stronger recommendation' }}</strong>
              <p>{{ recommendationMeta.ready ? `Review why ${summary.recommendedStrand} matches your results.` : 'Complete more graded assessments to help EduMatch understand your strengths.' }}</p>
            </div>
          </div>
          <router-link v-if="!recommendationMeta.ready" to="/student/activities" class="pathway-primary-button">
            <span>Continue assessments</span>
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </div>

        <div class="pathway-progress-card">
          <span class="pathway-progress-card__label">{{ recommendationMeta.ready ? 'Recommendation ready' : 'Pathway completion' }}</span>
          <div
            class="pathway-progress-ring"
            :style="{ '--pathway-progress': `${recommendationMeta.progress * 3.6}deg` }"
            role="progressbar"
            :aria-valuenow="recommendationMeta.progress"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div><strong>{{ recommendationMeta.progress }}%</strong><span>Complete</span></div>
          </div>
          <strong class="pathway-progress-card__strand">{{ recommendationMeta.ready ? summary.recommendedStrand : 'Keep learning' }}</strong>
          <p>{{ recommendationMeta.ready ? 'Suggested strand based on your results' : 'Every graded result adds detail to your pathway.' }}</p>
        </div>
      </div>

      <div v-if="isInitialLoading" class="pathway-stat-grid" aria-label="Loading recommendation statistics">
        <article v-for="index in 6" :key="index" class="pathway-stat-card pathway-stat-card--skeleton">
          <span class="skeleton skeleton--icon"></span>
          <div><span class="skeleton skeleton--short"></span><span class="skeleton skeleton--value"></span></div>
        </article>
      </div>
      <div v-else class="pathway-stat-grid" aria-label="Recommendation statistics">
        <article v-for="stat in recommendationOverviewStats" :key="stat.label" class="pathway-stat-card" :class="`pathway-stat-card--${stat.tone}`">
          <span class="pathway-stat-card__icon" aria-hidden="true"><i class="fas" :class="stat.icon"></i></span>
          <div><span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.note }}</small></div>
        </article>
      </div>
    </section>
  </main>
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
      isInitialLoading: true,
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
    gradeOverviewStats() {
      const gradedCount = this.summary.completedChallenges
      const totalAssessments = this.assessments.length
      const completionRate = totalAssessments
        ? Math.min(100, Math.round((gradedCount / totalAssessments) * 100))
        : null
      return [
        {
          label: 'Current Average',
          value: this.hasGradesData ? this.formatPercent(this.summary.averageScore) : '—',
          note: this.hasGradesData ? this.summary.performanceTrend : 'Awaiting your first score',
          icon: 'fa-chart-pie',
          tone: 'forest'
        },
        {
          label: 'Graded Activities',
          value: this.hasGradesData ? String(gradedCount) : '—',
          note: this.hasGradesData ? 'Published results' : 'No activities graded yet',
          icon: 'fa-clipboard-check',
          tone: 'sage'
        },
        {
          label: 'Highest Score',
          value: this.hasGradesData ? this.formatPercent(this.summary.highestScore) : '—',
          note: this.hasGradesData ? 'Your personal best' : 'Ready for your best result',
          icon: 'fa-trophy',
          tone: 'gold'
        },
        {
          label: 'Completion Rate',
          value: completionRate === null ? '—' : `${completionRate}%`,
          note: totalAssessments ? `${gradedCount} of ${totalAssessments} graded` : 'No assigned work yet',
          icon: 'fa-circle-check',
          tone: 'teal'
        }
      ]
    },
    recommendationAssessmentStats() {
      return [
        { label: 'Quiz', value: this.formatWholePercent(this.averagePercentageForRows(this.finalizedSubmissions.filter((item) => String(item?.assessmentMode || '').trim().toLowerCase() === 'quiz'))) },
        { label: 'Exam', value: this.formatWholePercent(this.averagePercentageForRows(this.finalizedSubmissions.filter((item) => String(item?.assessmentMode || '').trim().toLowerCase() === 'grading_assessment'))) },
        { label: 'Activities', value: this.formatWholePercent(this.averagePercentageForRows(this.activitySubmissions)) }
      ]
    },
    recommendationOverviewStats() {
      const assessmentStats = this.recommendationAssessmentStats
      return [
        { ...assessmentStats[0], note: 'Quiz average', icon: 'fa-clipboard-question', tone: 'forest' },
        { ...assessmentStats[1], note: 'Exam average', icon: 'fa-file-circle-check', tone: 'sage' },
        { ...assessmentStats[2], note: 'Activity average', icon: 'fa-list-check', tone: 'teal' },
        { label: 'Completed', value: String(this.summary.completedChallenges), note: 'Graded assessments', icon: 'fa-circle-check', tone: 'success' },
        { label: 'Classes', value: String(this.subjects.length), note: 'Active learning spaces', icon: 'fa-book-open', tone: 'blue' },
        {
          label: 'Suggested Strand',
          value: this.summary.recommendedStrand,
          note: this.recommendationMeta.ready ? 'Recommendation ready' : 'Unlocks with progress',
          icon: 'fa-graduation-cap',
          tone: 'gold'
        }
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
    taskProgress(item) {
      const state = String(item?.stateLabel || '').trim().toLowerCase()
      if (['graded', 'completed'].includes(state)) return 100
      if (state === 'submitted') return 90
      if (state === 'draft saved') return 55
      if (state === 'missing') return 12
      return 25
    },
    courseSchedule(subject) {
      const schedule = subject?.schedule
      if (typeof schedule === 'string' && schedule.trim()) return schedule.trim()
      if (Array.isArray(schedule) && schedule.length) {
        return schedule
          .map((entry) => typeof entry === 'string' ? entry : [entry?.day, entry?.time].filter(Boolean).join(' · '))
          .filter(Boolean)
          .join(', ')
      }
      return String(subject?.scheduleText || subject?.classSchedule || 'Schedule to be announced')
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
      } finally {
        this.isInitialLoading = false
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
  background: #ffffff;
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

/* Premium Student Dashboard redesign — intentionally namespaced to this component. */
.premium-dashboard {
  --forest: #1e4307;
  --leaf: #4f7d3a;
  --sage: #6f9d58;
  --mint: #dcead3;
  --canvas: #f7fbf4;
  --ink: #18320d;
  --muted: #657361;
  --line: #dfe9d9;
  --white: #ffffff;
  --shadow-sm: 0 4px 16px rgba(30, 67, 7, 0.06);
  --shadow-md: 0 14px 36px rgba(30, 67, 7, 0.1);
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  padding: clamp(1rem, 2.2vw, 2rem);
  color: var(--ink);
  background:
    radial-gradient(circle at 3% 2%, rgba(220, 234, 211, 0.75), transparent 24rem),
    linear-gradient(180deg, #fbfdf9 0%, var(--canvas) 100%);
  font-family: Inter, "Segoe UI", system-ui, -apple-system, sans-serif;
}

.premium-dashboard *,
.premium-dashboard *::before,
.premium-dashboard *::after {
  box-sizing: border-box;
}

.premium-dashboard h1,
.premium-dashboard h2,
.premium-dashboard h3,
.premium-dashboard p {
  margin: 0;
}

.premium-dashboard a {
  text-decoration: none;
}

.premium-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(16rem, 0.55fr);
  align-items: center;
  min-height: 17rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  overflow: hidden;
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 20px;
  background:
    radial-gradient(circle at 78% 15%, rgba(180, 216, 158, 0.23), transparent 18rem),
    linear-gradient(128deg, #4f8a35 0%, #245f00 52%, #144300 100%);
  box-shadow: 0 20px 48px rgba(30, 67, 7, 0.2);
  isolation: isolate;
}

.premium-hero::before,
.premium-hero::after {
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  content: "";
}

.premium-hero::before {
  right: -5rem;
  bottom: -9rem;
  width: 25rem;
  height: 25rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.premium-hero::after {
  top: -8rem;
  right: 14rem;
  width: 17rem;
  height: 17rem;
  background: rgba(255, 255, 255, 0.035);
}

.premium-hero__content {
  position: relative;
  z-index: 2;
  max-width: 48rem;
  color: #ffffff;
}

.premium-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--leaf);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.4;
  text-transform: uppercase;
}

.premium-hero .premium-eyebrow {
  color: #dcefd1;
}

.premium-dashboard .premium-hero h1 {
  max-width: 45rem;
  margin-top: 0.65rem;
  color: #ffffff;
  font-size: clamp(2rem, 4vw, 3.35rem);
  font-weight: 760;
  letter-spacing: -0.045em;
  line-height: 1.06;
}

.premium-dashboard .premium-hero__content > p:not(.premium-alert) {
  max-width: 42rem;
  margin-top: 0.85rem;
  color: #e4efde;
  font-size: clamp(0.95rem, 1.5vw, 1.08rem);
  line-height: 1.65;
}

.premium-identity {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.35rem;
}

.premium-dashboard .premium-identity span {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0.48rem 0.8rem;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  font-size: 0.78rem;
  font-weight: 650;
  text-shadow: 0 1px 2px rgba(10, 35, 2, 0.25);
}

.premium-dashboard .premium-identity i {
  color: #d8edcb;
}

/* Keep hero copy readable despite the legacy student stylesheet's important text overrides. */
.premium-dashboard .premium-hero .premium-hero__content,
.premium-dashboard .premium-hero .premium-hero__content h1,
.premium-dashboard .premium-hero .premium-hero__content .premium-eyebrow,
.premium-dashboard .premium-hero .premium-hero__content .premium-identity span {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.premium-dashboard .premium-hero .premium-hero__content > p:not(.premium-alert) {
  color: #e4efde !important;
  -webkit-text-fill-color: #e4efde !important;
}

.premium-dashboard .premium-hero .premium-hero__content .premium-eyebrow i,
.premium-dashboard .premium-hero .premium-hero__content .premium-identity i {
  color: #d8edcb !important;
  -webkit-text-fill-color: #d8edcb !important;
}

.premium-alert {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: fit-content;
  margin-top: 1rem !important;
  padding: 0.65rem 0.8rem;
  color: #fff4d2 !important;
  border: 1px solid rgba(255, 235, 165, 0.24);
  border-radius: 10px;
  background: rgba(104, 66, 7, 0.28);
  font-size: 0.78rem !important;
}

.premium-hero__visual {
  position: relative;
  min-height: 12rem;
}

.visual-book {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  width: 7.5rem;
  height: 7.5rem;
  place-items: center;
  color: var(--forest);
  border: 8px solid rgba(255, 255, 255, 0.16);
  border-radius: 28px;
  background: linear-gradient(145deg, #ffffff, #dcead3);
  box-shadow: 0 22px 42px rgba(7, 28, 2, 0.3);
  font-size: 2.8rem;
  transform: translate(-50%, -50%) rotate(-4deg);
  animation: premium-float 4.8s ease-in-out infinite;
}

.visual-chip {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.55rem 0.75rem;
  color: var(--forest);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-md);
  font-size: 0.72rem;
  font-weight: 800;
  backdrop-filter: blur(8px);
}

.visual-chip i {
  color: var(--leaf);
}

.visual-chip--top {
  top: 0.25rem;
  right: 0;
}

.visual-chip--bottom {
  right: 1.5rem;
  bottom: 0;
}

.visual-orbit {
  position: absolute;
  inset: 50% auto auto 50%;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.visual-orbit--one {
  width: 12rem;
  height: 12rem;
}

.visual-orbit--two {
  width: 16rem;
  height: 16rem;
}

.premium-dashboard a:focus-visible {
  outline: 3px solid rgba(111, 157, 88, 0.42);
  outline-offset: 3px;
}

.premium-overview {
  margin: 1.5rem 0;
}

.premium-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.premium-section-heading h2,
.premium-panel__header h2,
.premium-focus-card h2 {
  margin-top: 0.3rem;
  color: var(--ink);
  font-size: clamp(1.25rem, 2vw, 1.62rem);
  font-weight: 760;
  letter-spacing: -0.025em;
}

.premium-section-heading > p,
.premium-panel__header p {
  max-width: 37rem;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.55;
}

.premium-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.premium-summary-card {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9rem;
  min-height: 9.5rem;
  padding: 1.15rem;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--white);
  box-shadow: var(--shadow-sm);
  transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
}

.premium-summary-card::after {
  position: absolute;
  right: -2rem;
  bottom: -3rem;
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
  background: var(--card-wash, rgba(220, 234, 211, 0.45));
  content: "";
}

.premium-summary-card:hover {
  border-color: #c9ddbd;
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

.premium-summary-card--warning { --card-accent: #9a6810; --card-wash: rgba(248, 224, 172, 0.35); }
.premium-summary-card--info { --card-accent: #32677f; --card-wash: rgba(191, 224, 233, 0.35); }
.premium-summary-card--teal { --card-accent: #397467; --card-wash: rgba(190, 226, 214, 0.38); }
.premium-summary-card--success { --card-accent: var(--leaf); --card-wash: rgba(220, 234, 211, 0.55); }

.premium-summary-card__icon {
  display: grid;
  width: 3.15rem;
  height: 3.15rem;
  place-items: center;
  color: var(--card-accent, var(--leaf));
  border-radius: 14px;
  background: color-mix(in srgb, var(--card-accent, var(--leaf)) 11%, white);
  font-size: 1.22rem;
}

.premium-summary-card__copy {
  min-width: 0;
}

.premium-summary-card__copy > span {
  display: block;
  overflow: hidden;
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.premium-summary-card__copy strong {
  display: block;
  margin-top: 0.25rem;
  color: var(--ink);
  font-size: clamp(1.65rem, 2.8vw, 2.15rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
  animation: premium-count-in 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.premium-summary-card__copy p {
  margin-top: 0.55rem;
  color: var(--muted);
  font-size: 0.73rem;
  line-height: 1.45;
}

.premium-summary-card__arrow {
  position: absolute;
  right: 0.9rem;
  bottom: 0.75rem;
  z-index: 1;
  color: var(--card-accent, var(--leaf));
  opacity: 0.65;
  font-size: 0.8rem;
}

.premium-content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(16.5rem, 0.55fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.premium-panel {
  min-width: 0;
  padding: clamp(1.1rem, 2vw, 1.5rem);
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--white);
  box-shadow: var(--shadow-sm);
}

.premium-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.premium-panel__header h1,
.premium-panel__header h2 {
  margin: 0.28rem 0 0.3rem;
  color: var(--ink);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 780;
  letter-spacing: -0.03em;
}

.premium-text-link {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.8rem;
  color: var(--leaf);
  border-radius: 10px;
  background: #f3f8ef;
  font-size: 0.76rem;
  font-weight: 780;
  transition: gap 180ms ease, color 180ms ease, background 180ms ease;
}

.premium-text-link:hover {
  gap: 0.7rem;
  color: var(--forest);
  background: var(--mint);
}

.premium-timeline {
  position: relative;
  display: grid;
}

.premium-task {
  position: relative;
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr);
  gap: 0.85rem;
  padding: 0.9rem 0;
}

.premium-task:not(:last-child) {
  border-bottom: 1px solid #edf2e9;
}

.premium-task__rail {
  position: relative;
  display: flex;
  justify-content: center;
}

.premium-task__rail::after {
  position: absolute;
  top: 2.75rem;
  bottom: -1rem;
  width: 2px;
  background: #e4edde;
  content: "";
}

.premium-task:last-child .premium-task__rail::after {
  display: none;
}

.premium-task__rail > span {
  z-index: 1;
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  place-items: center;
  color: var(--task-accent, var(--leaf));
  border: 4px solid var(--white);
  border-radius: 12px;
  background: var(--task-bg, #eaf3e5);
  box-shadow: 0 0 0 1px #dbe7d4;
}

.premium-task--danger { --task-accent: #a73d3d; --task-bg: #fce9e8; }
.premium-task--urgent { --task-accent: #bb581e; --task-bg: #fff0e5; }
.premium-task--warning { --task-accent: #93630b; --task-bg: #fff6dc; }
.premium-task--info { --task-accent: #38708b; --task-bg: #e7f2f7; }
.premium-task--success { --task-accent: var(--leaf); --task-bg: #eaf3e5; }

.premium-task__body {
  min-width: 0;
}

.premium-task__topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.premium-subject-label {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--leaf);
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.premium-task h3 {
  margin-top: 0.25rem;
  color: #203a16;
  font-size: 0.93rem;
  font-weight: 760;
  line-height: 1.35;
}

.premium-due-badge {
  flex: 0 0 auto;
  padding: 0.36rem 0.56rem;
  color: #366028;
  border-radius: 999px;
  background: #eaf3e5;
  font-size: 0.64rem;
  font-weight: 800;
  white-space: nowrap;
}

.premium-due-badge--danger { color: #993636; background: #fce8e7; }
.premium-due-badge--urgent { color: #a94a14; background: #fff0e4; }
.premium-due-badge--warning { color: #845809; background: #fff5d8; }
.premium-due-badge--info { color: #32677f; background: #e5f1f5; }

.premium-task__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
  margin-top: 0.65rem;
}

.premium-task__chips span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #6c7868;
  font-size: 0.65rem;
  font-weight: 650;
}

.premium-task__chips span:not(:last-child)::after {
  margin-left: 0.15rem;
  color: #c1cbbd;
  content: "•";
}

.premium-task__chips i {
  color: #8aa07f;
  font-size: 0.55rem;
}

.premium-status--success { color: var(--leaf) !important; }
.premium-status--danger { color: #a33c3c !important; }
.premium-status--warning { color: #8d620e !important; }
.premium-status--violet { color: #7252a3 !important; }
.premium-status--info { color: #33718d !important; }

.premium-task__progress {
  display: grid;
  grid-template-columns: minmax(4rem, 10rem) auto;
  gap: 0.55rem;
  align-items: center;
  margin-top: 0.65rem;
}

.premium-task__progress > span {
  height: 0.3rem;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2ea;
}

.premium-task__progress > span > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--task-accent, var(--leaf));
  transition: width 500ms ease;
}

.premium-task__progress small {
  color: #879182;
  font-size: 0.61rem;
  font-weight: 650;
}

.premium-focus-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background:
    radial-gradient(circle at 50% 26%, rgba(220, 234, 211, 0.56), transparent 11rem),
    var(--white);
}

.premium-focus-ring {
  display: grid;
  width: 9.5rem;
  height: 9.5rem;
  margin: 1.35rem auto 1rem;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(var(--leaf) var(--focus-progress), #e5eee0 0deg);
  box-shadow: inset 0 0 0 1px rgba(30, 67, 7, 0.04);
}

.premium-focus-ring::before {
  grid-area: 1 / 1;
  width: 7.4rem;
  height: 7.4rem;
  border-radius: 50%;
  background: var(--white);
  box-shadow: 0 6px 18px rgba(30, 67, 7, 0.08);
  content: "";
}

.premium-focus-ring > div {
  z-index: 1;
  display: grid;
  grid-area: 1 / 1;
  gap: 0.1rem;
}

.premium-focus-ring strong {
  color: var(--forest);
  font-size: 1.9rem;
  letter-spacing: -0.05em;
}

.premium-focus-ring span {
  color: var(--muted);
  font-size: 0.66rem;
  font-weight: 700;
}

.premium-focus-card > p {
  max-width: 18rem;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.55;
}

.premium-focus-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
  width: 100%;
  margin: 1rem 0;
}

.premium-focus-stats div {
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  border: 1px solid #e3ebde;
  border-radius: 12px;
  background: #f8fbf6;
}

.premium-focus-stats span {
  color: var(--muted);
  font-size: 0.63rem;
}

.premium-focus-stats strong {
  color: var(--forest);
  font-size: 1rem;
}

.premium-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.7rem;
  padding: 0.65rem 0.95rem;
  color: var(--white);
  border-radius: 11px;
  background: var(--forest);
  box-shadow: 0 8px 18px rgba(30, 67, 7, 0.14);
  font-size: 0.75rem;
  font-weight: 780;
  transition: gap 180ms ease, background 180ms ease, transform 180ms ease;
}

.premium-button:not(.premium-button--soft),
.premium-button:not(.premium-button--soft) i {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.premium-button:hover {
  gap: 0.7rem;
  background: #2b5c10;
  transform: translateY(-2px);
}

.premium-button--soft {
  width: 100%;
  margin-top: auto;
  color: var(--forest);
  background: var(--mint);
  box-shadow: none;
}

.premium-button--soft:hover {
  color: var(--white);
}

.premium-classes {
  margin-bottom: 1rem;
}

.premium-course-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.premium-course-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #dde8d7;
  border-radius: 18px;
  background: var(--white);
  box-shadow: 0 4px 12px rgba(30, 67, 7, 0.045);
  transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
}

.premium-course-card:hover {
  border-color: #bed3b3;
  box-shadow: var(--shadow-md);
  transform: translateY(-5px);
}

.premium-course-card__banner {
  --course-accent: #4f7d3a;
  --course-light: #e2eedb;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 5rem;
  padding: 0.9rem;
  background:
    radial-gradient(circle at 92% 10%, rgba(255, 255, 255, 0.4), transparent 3.5rem),
    linear-gradient(135deg, var(--course-accent), color-mix(in srgb, var(--course-accent) 70%, #1e4307));
}

.premium-course-card--2 .premium-course-card__banner { --course-accent: #5e866c; }
.premium-course-card--3 .premium-course-card__banner { --course-accent: #607f9c; }
.premium-course-card--4 .premium-course-card__banner { --course-accent: #8d7444; }

.premium-course-card__icon {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  place-items: center;
  color: var(--course-accent);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 16px rgba(17, 42, 8, 0.17);
}

.premium-course-card__status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.33rem 0.5rem;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  background: rgba(16, 43, 7, 0.2);
  font-size: 0.6rem;
  font-weight: 750;
}

.premium-course-card__status i {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  font-size: 0.35rem;
}

.premium-course-card__status i::before {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.premium-course-card__body {
  padding: 1rem;
}

.premium-course-card h3 {
  min-height: 2.5rem;
  margin-top: 0.28rem;
  color: var(--ink);
  font-size: 0.98rem;
  line-height: 1.3;
}

.premium-course-card__teacher,
.premium-course-card__schedule {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin-top: 0.55rem !important;
  color: var(--muted);
  font-size: 0.68rem;
  line-height: 1.35;
}

.premium-course-card__teacher i,
.premium-course-card__schedule i {
  width: 0.8rem;
  margin-top: 0.1rem;
  color: var(--sage);
}

.premium-course-card__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.8rem;
}

.premium-course-card__metrics span {
  display: grid;
  gap: 0.15rem;
  padding: 0.55rem;
  color: var(--muted);
  border-radius: 9px;
  background: #f7faf5;
  font-size: 0.6rem;
}

.premium-course-card__metrics strong {
  color: var(--forest);
  font-size: 0.88rem;
}

.premium-course-card__progress {
  margin-top: 0.8rem;
}

.premium-course-card__progress > div {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 0.64rem;
}

.premium-course-card__progress strong {
  color: var(--forest);
}

.premium-progress-track {
  display: block;
  height: 0.4rem;
  margin-top: 0.42rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e7eee3;
}

.premium-progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--leaf), var(--sage));
  transition: width 600ms ease;
}

.premium-course-card__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.9rem;
  padding-top: 0.8rem;
  border-top: 1px solid #edf2ea;
}

.premium-course-card__actions a {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.52rem;
  color: var(--leaf);
  border: 1px solid #dce8d6;
  border-radius: 9px;
  font-size: 0.64rem;
  font-weight: 760;
  transition: color 180ms ease, background 180ms ease;
}

.premium-course-card__actions a:hover,
.premium-course-card__actions a:focus-visible {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  background: var(--forest);
}

.premium-course-card__actions a:hover i,
.premium-course-card__actions a:hover i::before,
.premium-course-card__actions a:focus-visible i,
.premium-course-card__actions a:focus-visible i::before {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.premium-empty-state {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1.25rem;
  align-items: center;
  min-height: 14rem;
  padding: clamp(1.25rem, 3vw, 2rem);
  border: 1px dashed #c7dabc;
  border-radius: 16px;
  background:
    radial-gradient(circle at 10% 50%, rgba(220, 234, 211, 0.6), transparent 12rem),
    #f9fcf7;
}

.premium-empty-state__art {
  position: relative;
  display: grid;
  width: 7rem;
  height: 7rem;
  place-items: center;
  color: var(--leaf);
  border-radius: 28px 28px 28px 8px;
  background: linear-gradient(145deg, #e8f2e2, #d3e5c8);
  box-shadow: 0 12px 26px rgba(30, 67, 7, 0.1);
  font-size: 2.4rem;
}

.empty-check {
  position: absolute;
  top: -0.45rem;
  right: -0.45rem;
  display: grid;
  width: 2.1rem;
  height: 2.1rem;
  place-items: center;
  color: var(--white);
  border: 4px solid #f9fcf7;
  border-radius: 50%;
  background: var(--forest);
  font-size: 0.65rem;
}

.empty-check i,
.empty-check i::before {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.premium-empty-state h3 {
  margin: 0.35rem 0 0.45rem;
  color: var(--ink);
  font-size: 1.18rem;
}

.premium-empty-state p {
  max-width: 38rem;
  margin-bottom: 0.9rem;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.6;
}

.premium-empty-state--classes {
  min-height: 12rem;
}

.premium-pending-note {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 1rem;
  padding: 0.75rem 0.9rem;
  color: #795a15;
  border: 1px solid #f1dfae;
  border-radius: 11px;
  background: #fff9e8;
  font-size: 0.73rem;
  font-weight: 680;
}

.premium-focus-panel {
  min-height: calc(100vh - 9rem);
  animation: premium-rise 350ms ease both;
}

.premium-grades-layout {
  display: grid;
  grid-template-columns: minmax(14rem, 0.65fr) minmax(0, 1fr);
  gap: 1rem;
}

.premium-grade-hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 15rem;
  padding: 1.75rem;
  color: var(--white);
  border-radius: 18px;
  background:
    radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.2), transparent 10rem),
    linear-gradient(145deg, var(--forest), var(--leaf));
}

.premium-grade-hero > span {
  color: #dcefd1;
  font-size: 0.73rem;
  font-weight: 750;
  text-transform: uppercase;
}

.premium-grade-hero > strong {
  margin-top: 0.3rem;
  font-size: clamp(2.5rem, 5vw, 4rem);
  letter-spacing: -0.06em;
}

.premium-grade-hero p {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  margin-top: 0.6rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.78rem;
}

.premium-grade-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.premium-grade-stats article,
.premium-recommendation-grid article {
  display: grid;
  gap: 0.4rem;
  padding: 1.15rem;
  border: 1px solid #e1eadc;
  border-radius: 15px;
  background: #f9fcf7;
}

.premium-grade-stats span,
.premium-recommendation-grid span {
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 680;
}

.premium-grade-stats strong,
.premium-recommendation-grid strong {
  color: var(--forest);
  font-size: 1.35rem;
}

.premium-results-list {
  display: grid;
  grid-column: 1 / -1;
  gap: 0.65rem;
}

.premium-results-list article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.85rem;
  border: 1px solid #e4ece0;
  border-radius: 13px;
  transition: background 180ms ease, transform 180ms ease;
}

.premium-results-list article:hover {
  background: #f8fbf6;
  transform: translateX(3px);
}

.premium-results-list__icon {
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  place-items: center;
  color: var(--leaf);
  border-radius: 10px;
  background: #e8f2e2;
}

.premium-results-list h3 {
  color: var(--ink);
  font-size: 0.85rem;
}

.premium-results-list p {
  margin-top: 0.2rem;
  color: var(--muted);
  font-size: 0.67rem;
}

.premium-results-list article > strong {
  color: var(--forest);
  font-size: 0.88rem;
}

.premium-empty-state--large {
  min-height: 24rem;
}

.premium-recommendation-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(14rem, 0.5fr);
  gap: 1.5rem;
  align-items: center;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  color: var(--white);
  border-radius: 18px;
  background:
    radial-gradient(circle at 90% 10%, rgba(220, 234, 211, 0.28), transparent 17rem),
    linear-gradient(135deg, #173806, var(--leaf));
}

.premium-recommendation-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.58rem;
  color: #dff1d5;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.67rem;
  font-weight: 800;
}

.premium-recommendation-hero h2 {
  margin-top: 0.8rem;
  color: var(--white);
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  letter-spacing: -0.04em;
}

.premium-recommendation-hero p {
  margin-top: 0.55rem;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.86rem;
  line-height: 1.55;
}

.premium-recommendation-tip {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.7rem;
  color: #e8f4e1;
  border-left: 3px solid #a5cd8e;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.72rem;
}

.premium-dashboard .premium-recommendation-hero .premium-recommendation-status,
.premium-dashboard .premium-recommendation-hero h2,
.premium-dashboard .premium-recommendation-hero p,
.premium-dashboard .premium-recommendation-hero .premium-recommendation-tip,
.premium-dashboard .premium-recommendation-hero .premium-recommendation-status i,
.premium-dashboard .premium-recommendation-hero .premium-recommendation-tip i {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.premium-recommendation-progress {
  display: grid;
  gap: 0.4rem;
  padding: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.premium-recommendation-progress strong {
  font-size: 2.3rem;
}

.premium-recommendation-progress > span {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.72rem;
}

.premium-dashboard .premium-recommendation-progress > strong,
.premium-dashboard .premium-recommendation-progress > span {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.premium-recommendation-progress .premium-progress-track {
  background: rgba(255, 255, 255, 0.15);
}

.premium-recommendation-progress .premium-progress-track span {
  background: #dcead3;
}

.premium-recommendation-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.premium-recommendation-grid article:last-child {
  grid-column: span 1;
}

.premium-recommendation-grid strong {
  overflow-wrap: anywhere;
  font-size: 1.05rem;
}

.premium-skeleton-card,
.premium-skeleton-panel {
  pointer-events: none;
}

.skeleton {
  display: block;
  overflow: hidden;
  border-radius: 8px;
  background: #e8eee5;
}

.skeleton::after {
  display: block;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
  content: "";
  transform: translateX(-100%);
  animation: premium-shimmer 1.35s infinite;
}

.skeleton--icon { width: 3rem; height: 3rem; }
.skeleton--short { width: 65%; height: 0.7rem; }
.skeleton--value { width: 45%; height: 1.8rem; }
.skeleton--line { grid-column: 1 / -1; width: 80%; height: 0.6rem; }
.skeleton--heading { width: 10rem; height: 1.6rem; margin-bottom: 1.1rem; }
.skeleton--task { width: 100%; height: 5.6rem; margin-top: 0.65rem; }
.skeleton--illustration { width: 100%; height: 16rem; margin-top: 1rem; }

.section-highlight {
  animation: premium-highlight 1.8s ease both;
}

@keyframes premium-float {
  0%, 100% { transform: translate(-50%, -50%) rotate(-4deg); }
  50% { transform: translate(-50%, calc(-50% - 8px)) rotate(2deg); }
}

@keyframes premium-count-in {
  from { opacity: 0; transform: translateY(9px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes premium-rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes premium-shimmer {
  to { transform: translateX(100%); }
}

@keyframes premium-highlight {
  0%, 100% { box-shadow: var(--shadow-sm); }
  25%, 70% { box-shadow: 0 0 0 4px rgba(111, 157, 88, 0.24), 0 18px 42px rgba(30, 67, 7, 0.14); }
}

@media (max-width: 1180px) {
  .premium-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .premium-course-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .premium-recommendation-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .premium-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .premium-hero__visual {
    display: none;
  }

  .premium-content-grid,
  .premium-grades-layout,
  .premium-recommendation-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .premium-focus-card {
    align-items: stretch;
  }

  .premium-focus-card .premium-eyebrow,
  .premium-focus-card h2,
  .premium-focus-card > p {
    align-self: center;
  }

  .premium-recommendation-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .premium-dashboard {
    padding: 0.75rem;
  }

  .premium-hero {
    min-height: 15rem;
    padding: 1.25rem;
    border-radius: 18px;
  }

  .premium-hero h1 {
    font-size: 2rem;
  }

  .premium-identity {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .premium-identity span {
    width: fit-content;
  }

  .premium-section-heading,
  .premium-panel__header,
  .premium-task__topline {
    flex-direction: column;
    align-items: flex-start;
  }

  .premium-section-heading > p {
    display: none;
  }

  .premium-summary-grid,
  .premium-course-grid,
  .premium-grade-stats,
  .premium-recommendation-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .premium-summary-card {
    min-height: 8.2rem;
  }

  .premium-panel {
    padding: 1rem;
    border-radius: 17px;
  }

  .premium-text-link {
    width: 100%;
    justify-content: center;
  }

  .premium-task {
    grid-template-columns: 2.45rem minmax(0, 1fr);
    gap: 0.65rem;
  }

  .premium-task__rail > span {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 10px;
  }

  .premium-task__chips span:not(:last-child)::after {
    display: none;
  }

  .premium-task__progress {
    grid-template-columns: minmax(4rem, 1fr) auto;
  }

  .premium-empty-state {
    grid-template-columns: minmax(0, 1fr);
    text-align: center;
  }

  .premium-empty-state__art {
    width: 5.5rem;
    height: 5.5rem;
    margin: 0 auto;
    font-size: 1.9rem;
  }

  .premium-empty-state .premium-eyebrow {
    justify-content: center;
  }

  .premium-results-list article {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .premium-results-list article > strong {
    grid-column: 2;
  }
}

/* Focused Recent Results — isolated from the recommendation view. */
.premium-dashboard .premium-grades-panel {
  width: min(100%, 88rem);
  min-height: auto;
  margin: 0 auto;
  padding: clamp(1.25rem, 2.2vw, 1.75rem);
  overflow: hidden;
  border: 1px solid rgba(79, 125, 58, 0.16);
  border-radius: 20px;
  background:
    radial-gradient(circle at 96% 2%, rgba(220, 234, 211, 0.72), transparent 22rem),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 244, 0.96));
  box-shadow: 0 24px 60px rgba(30, 67, 7, 0.11);
  animation: grades-fade-up 420ms ease both;
}

.grades-premium-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(79, 125, 58, 0.13);
}

.grades-premium-header__copy {
  max-width: 44rem;
}

.premium-dashboard .grades-premium-header h1 {
  margin: 0.3rem 0 0.35rem;
  color: #17350a;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.premium-dashboard .grades-premium-header p {
  max-width: 42rem;
  color: #667661;
  font-size: clamp(0.9rem, 1.4vw, 1rem);
  line-height: 1.5;
}

.grades-back-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.9rem;
  padding: 0.7rem 1rem;
  color: #365f25;
  border: 1px solid rgba(79, 125, 58, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 5px 14px rgba(30, 67, 7, 0.05);
  font-size: 0.78rem;
  font-weight: 780;
  backdrop-filter: blur(12px);
  transition: gap 180ms ease, color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.grades-back-button:hover {
  gap: 0.85rem;
  color: #fff;
  background: #1e4307;
  box-shadow: 0 10px 24px rgba(30, 67, 7, 0.17);
  transform: translateY(-2px);
}

.grades-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.grades-stat-card {
  --grade-stat-accent: #4f7d3a;
  --grade-stat-wash: #eef5e9;
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.7rem;
  align-items: flex-start;
  min-height: 7rem;
  padding: 1rem;
  overflow: hidden;
  border: 1px solid rgba(79, 125, 58, 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 8px 24px rgba(30, 67, 7, 0.06);
  backdrop-filter: blur(10px);
  transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
}

.grades-stat-card::after {
  position: absolute;
  right: -2rem;
  bottom: -2.8rem;
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
  background: var(--grade-stat-wash);
  content: "";
  opacity: 0.72;
}

.grades-stat-card:hover {
  border-color: rgba(79, 125, 58, 0.3);
  box-shadow: 0 16px 32px rgba(30, 67, 7, 0.1);
  transform: translateY(-4px);
}

.grades-stat-card--forest { --grade-stat-accent: #1e4307; --grade-stat-wash: #dcead3; }
.grades-stat-card--sage { --grade-stat-accent: #6f9d58; --grade-stat-wash: #e7f1e1; }
.grades-stat-card--gold { --grade-stat-accent: #9b741f; --grade-stat-wash: #f8ebc9; }
.grades-stat-card--teal { --grade-stat-accent: #3f7768; --grade-stat-wash: #dcefe8; }

.grades-stat-card__icon {
  display: grid;
  width: 2.7rem;
  height: 2.7rem;
  place-items: center;
  color: var(--grade-stat-accent);
  border-radius: 14px;
  background: var(--grade-stat-wash);
  font-size: 1.08rem;
}

.grades-stat-card > div {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.grades-stat-card > div > span {
  display: block;
  color: #6e7c69;
  font-size: 0.69rem;
  font-weight: 750;
  line-height: 1.3;
}

.grades-stat-card strong {
  display: block;
  margin-top: 0.28rem;
  color: #18320d;
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 820;
  letter-spacing: -0.045em;
  line-height: 1.1;
}

.grades-stat-card small {
  display: block;
  margin-top: 0.35rem;
  color: #7b8877;
  font-size: 0.62rem;
  line-height: 1.4;
}

.grades-stat-card--skeleton {
  align-items: center;
  pointer-events: none;
}

.grades-stat-card--skeleton > div {
  display: grid;
  gap: 0.6rem;
  width: 100%;
}

.grades-content-skeleton {
  display: grid;
  grid-template-columns: minmax(12rem, 0.7fr) minmax(0, 1.3fr);
  gap: 2rem;
  align-items: center;
  min-height: 22rem;
  padding: 2rem;
  border: 1px solid #e1ebdc;
  border-radius: 20px;
  background: rgba(249, 252, 247, 0.86);
}

.grades-content-skeleton__visual {
  width: 100%;
  height: 16rem;
}

.grades-content-skeleton > div {
  display: grid;
  gap: 0.8rem;
}

.grades-content-skeleton__button {
  width: 9rem;
  height: 2.7rem;
  margin-top: 0.6rem;
}

.grades-results-dashboard {
  display: grid;
  grid-template-columns: minmax(15rem, 0.62fr) minmax(0, 1.38fr);
  gap: 1.25rem;
  align-items: stretch;
}

.grades-performance-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 23rem;
  padding: clamp(1.5rem, 3vw, 2.2rem);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  background:
    radial-gradient(circle at 90% 8%, rgba(220, 234, 211, 0.22), transparent 12rem),
    linear-gradient(145deg, #173806, #4f7d3a);
  box-shadow: 0 18px 40px rgba(30, 67, 7, 0.19);
}

.grades-performance-card__eyebrow {
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.grades-performance-card > strong {
  margin-top: 0.5rem;
  color: #fff;
  font-size: clamp(3rem, 6vw, 4.5rem);
  font-weight: 850;
  letter-spacing: -0.065em;
  line-height: 1;
}

.premium-dashboard .grades-performance-card > p {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.8rem;
  color: #ffffff;
  font-size: 0.8rem;
}

.grades-performance-card__track {
  height: 0.55rem;
  margin-top: 1.5rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
}

.grades-performance-card__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #dcead3;
  transition: width 600ms ease;
}

.grades-performance-card > small {
  margin-top: 0.65rem;
  color: #ffffff;
  font-size: 0.65rem;
}

.grades-performance-card > p i {
  color: #ffffff;
}

.premium-dashboard .grades-performance-card :is(span, strong, p, small, i) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.grades-results-feed {
  min-width: 0;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  border: 1px solid #e0eadb;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 24px rgba(30, 67, 7, 0.05);
}

.grades-results-feed__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.grades-results-feed__heading h2 {
  margin-top: 0.2rem;
  color: #18320d;
  font-size: 1.25rem;
}

.grades-result-count {
  padding: 0.45rem 0.65rem;
  color: #416d30;
  border-radius: 999px;
  background: #e7f1e1;
  font-size: 0.66rem;
  font-weight: 800;
}

.grades-premium-empty {
  position: relative;
  display: grid;
  grid-template-columns: minmax(15rem, 0.72fr) minmax(0, 1.28fr);
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-items: center;
  min-height: 17.5rem;
  padding: clamp(1.25rem, 3vw, 2rem);
  overflow: hidden;
  border: 1px solid rgba(79, 125, 58, 0.18);
  border-radius: 20px;
  background:
    radial-gradient(circle at 14% 50%, rgba(220, 234, 211, 0.75), transparent 18rem),
    linear-gradient(135deg, rgba(247, 251, 244, 0.98), rgba(255, 255, 255, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 14px 34px rgba(30, 67, 7, 0.07);
}

.grades-premium-empty__visual {
  position: relative;
  display: grid;
  min-height: 12rem;
  place-items: center;
}

.grades-visual-orbit {
  position: absolute;
  width: 11.5rem;
  height: 11.5rem;
  border: 1px dashed rgba(79, 125, 58, 0.28);
  border-radius: 50%;
}

.grades-visual-orbit::before,
.grades-visual-orbit::after {
  position: absolute;
  border-radius: 50%;
  background: #6f9d58;
  box-shadow: 0 0 0 6px rgba(111, 157, 88, 0.13);
  content: "";
}

.grades-visual-orbit::before {
  top: 1.5rem;
  left: 1rem;
  width: 0.65rem;
  height: 0.65rem;
}

.grades-visual-orbit::after {
  right: 1rem;
  bottom: 2rem;
  width: 0.45rem;
  height: 0.45rem;
}

.grades-visual-sheet {
  z-index: 1;
  display: grid;
  width: 7.5rem;
  min-height: 8.8rem;
  place-items: center;
  padding: 1.25rem;
  color: #1e4307;
  border: 1px solid rgba(79, 125, 58, 0.17);
  border-radius: 24px 24px 24px 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 22px 45px rgba(30, 67, 7, 0.16);
  font-size: 2rem;
  transform: rotate(-3deg);
}

.grades-visual-sheet > span {
  display: flex;
  gap: 0.35rem;
  align-items: flex-end;
  width: 100%;
  height: 2.8rem;
}

.grades-visual-sheet b {
  flex: 1;
  border-radius: 4px 4px 2px 2px;
  background: #dcead3;
}

.grades-visual-sheet b:nth-child(1) { height: 42%; }
.grades-visual-sheet b:nth-child(2) { height: 70%; background: #6f9d58; }
.grades-visual-sheet b:nth-child(3) { height: 100%; background: #1e4307; }

.grades-visual-badge {
  position: absolute;
  z-index: 2;
  top: 0.75rem;
  right: calc(50% - 5.5rem);
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  place-items: center;
  color: #fff;
  border: 5px solid #f5faf2;
  border-radius: 50%;
  background: #4f7d3a;
  box-shadow: 0 10px 22px rgba(30, 67, 7, 0.2);
  animation: premium-float 4.8s ease-in-out infinite;
}

.grades-visual-badge i {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}

.grades-premium-empty__copy {
  position: relative;
  z-index: 1;
  max-width: 38rem;
}

.premium-dashboard .grades-premium-empty__copy h2 {
  margin: 0.35rem 0 0.5rem;
  color: #18320d;
  font-size: clamp(1.65rem, 2.8vw, 2.2rem);
  font-weight: 820;
  letter-spacing: -0.045em;
  line-height: 1.1;
}

.premium-dashboard .grades-premium-empty__copy > p {
  color: #657361;
  font-size: clamp(0.88rem, 1.5vw, 1rem);
  line-height: 1.55;
}

.grades-empty-guidance {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
  margin: 0.8rem 0 1rem;
}

.grades-empty-guidance span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #4c6144;
  font-size: 0.7rem;
  font-weight: 680;
}

.grades-empty-guidance i {
  color: #6f9d58;
}

.grades-primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-height: 3rem;
  padding: 0.75rem 1.15rem;
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f8a35, #4f7d3a);
  box-shadow: 0 10px 24px rgba(30, 67, 7, 0.2);
  font-size: 0.8rem;
  font-weight: 800;
  transition: gap 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.grades-primary-button span,
.grades-primary-button i {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}

.grades-primary-button:hover {
  gap: 0.85rem;
  box-shadow: 0 14px 30px rgba(30, 67, 7, 0.25);
  transform: translateY(-2px);
}

@keyframes grades-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1100px) {
  .grades-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grades-results-dashboard,
  .grades-premium-empty {
    grid-template-columns: minmax(0, 1fr);
  }

  .grades-performance-card {
    min-height: 17rem;
  }

  .grades-premium-empty__visual {
    min-height: 14rem;
  }
}

@media (max-width: 700px) {
  .premium-dashboard .premium-grades-panel {
    padding: 1.25rem;
  }

  .grades-premium-header {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .grades-back-button {
    width: 100%;
    justify-content: center;
  }

  .grades-stat-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .grades-stat-card {
    min-height: 7.7rem;
  }

  .grades-content-skeleton {
    grid-template-columns: minmax(0, 1fr);
    min-height: auto;
    padding: 1.25rem;
  }

  .grades-content-skeleton__visual {
    height: 10rem;
  }

  .grades-premium-empty {
    gap: 1rem;
    min-height: auto;
    padding: 1.5rem;
    text-align: center;
  }

  .grades-premium-empty__visual {
    min-height: 12rem;
    transform: scale(0.86);
  }

  .grades-premium-empty__copy .premium-eyebrow,
  .grades-empty-guidance {
    justify-content: center;
  }

  .grades-primary-button {
    width: 100%;
  }

  .grades-results-feed__heading {
    align-items: flex-start;
  }
}

/* Focused Personalized Pathway — isolated from the grades view. */
.premium-dashboard .premium-pathway-panel {
  width: min(100%, 88rem);
  min-height: auto;
  margin: 0 auto;
  padding: clamp(1.25rem, 2.2vw, 1.75rem);
  overflow: hidden;
  border: 1px solid rgba(79, 125, 58, 0.16);
  border-radius: 20px;
  background:
    radial-gradient(circle at 95% 0%, rgba(220, 234, 211, 0.72), transparent 24rem),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 244, 0.96));
  box-shadow: 0 24px 60px rgba(30, 67, 7, 0.11);
  animation: grades-fade-up 420ms ease both;
}

.pathway-premium-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(79, 125, 58, 0.13);
}

.pathway-premium-header__copy {
  max-width: 46rem;
}

.premium-dashboard .pathway-premium-header h1 {
  margin: 0.3rem 0 0.35rem;
  color: #17350a;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.premium-dashboard .pathway-premium-header p {
  max-width: 43rem;
  color: #667661;
  font-size: clamp(0.9rem, 1.4vw, 1rem);
  line-height: 1.5;
}

.pathway-back-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.9rem;
  padding: 0.7rem 1rem;
  color: #365f25;
  border: 1px solid rgba(79, 125, 58, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 5px 14px rgba(30, 67, 7, 0.05);
  font-size: 0.78rem;
  font-weight: 780;
  backdrop-filter: blur(12px);
  transition: gap 180ms ease, color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.pathway-back-button:hover {
  gap: 0.85rem;
  color: #fff;
  background: #1e4307;
  box-shadow: 0 10px 24px rgba(30, 67, 7, 0.17);
  transform: translateY(-2px);
}

.pathway-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(17rem, 0.55fr);
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-items: center;
  min-height: 19rem;
  padding: clamp(1.25rem, 3vw, 2rem);
  overflow: hidden;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  background:
    radial-gradient(circle at 78% 15%, rgba(180, 216, 158, 0.23), transparent 18rem),
    linear-gradient(128deg, #4f8a35 0%, #245f00 52%, #144300 100%);
  box-shadow: 0 20px 46px rgba(30, 67, 7, 0.2);
}

.pathway-hero::before {
  position: absolute;
  top: -8rem;
  right: -5rem;
  width: 25rem;
  height: 25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  content: "";
}

.pathway-hero__copy {
  position: relative;
  z-index: 1;
  max-width: 48rem;
}

.pathway-status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.68rem;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.11);
  font-size: 0.7rem;
  font-weight: 800;
  backdrop-filter: blur(10px);
}

.pathway-status--ready {
  color: #1e4307;
  background: #dcead3;
}

.premium-dashboard .pathway-hero__copy h2 {
  max-width: 42rem;
  margin-top: 0.65rem;
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 820;
  letter-spacing: -0.05em;
  line-height: 1.08;
}

.premium-dashboard .pathway-hero__copy > p {
  max-width: 39rem;
  margin-top: 0.5rem;
  color: #e4efde !important;
  -webkit-text-fill-color: #e4efde !important;
  font-size: clamp(0.9rem, 1.5vw, 1rem);
  line-height: 1.5;
}

.pathway-milestone {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.7rem;
  max-width: 42rem;
  margin-top: 0.8rem;
  padding: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.pathway-milestone__icon {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  place-items: center;
  color: #1e4307;
  border-radius: 11px;
  background: #dcead3;
}

.pathway-milestone strong {
  color: #fff;
  font-size: 0.82rem;
}

.premium-dashboard .pathway-milestone p {
  margin-top: 0.25rem;
  color: rgba(255, 255, 255, 0.72) !important;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.72) !important;
  font-size: 0.7rem;
  line-height: 1.55;
}

.pathway-primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-height: 2.75rem;
  margin-top: 0.8rem;
  padding: 0.65rem 1.05rem;
  color: #1e4307;
  border-radius: 12px;
  background: #dcead3;
  box-shadow: 0 12px 26px rgba(7, 30, 1, 0.22);
  font-size: 0.78rem;
  font-weight: 820;
  transition: gap 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.pathway-primary-button:hover {
  gap: 0.85rem;
  background: #fff;
  box-shadow: 0 16px 32px rgba(7, 30, 1, 0.27);
  transform: translateY(-2px);
}

.pathway-progress-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
}

.pathway-progress-card__label {
  color: #dcefd2;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.pathway-progress-ring {
  display: grid;
  width: 8rem;
  height: 8rem;
  margin: 0.7rem 0;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(#dcead3 var(--pathway-progress), rgba(255, 255, 255, 0.14) 0deg);
  box-shadow: 0 14px 30px rgba(8, 32, 2, 0.2);
}

.pathway-progress-ring::before {
  grid-area: 1 / 1;
  width: 6.1rem;
  height: 6.1rem;
  border-radius: 50%;
  background: rgba(24, 60, 8, 0.93);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  content: "";
}

.pathway-progress-ring > div {
  z-index: 1;
  display: grid;
  grid-area: 1 / 1;
}

.pathway-progress-ring strong {
  color: #fff;
  font-size: 1.8rem;
  letter-spacing: -0.055em;
}

.pathway-progress-ring span {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.65rem;
  font-weight: 700;
}

.pathway-progress-card__strand {
  max-width: 100%;
  color: #fff;
  font-size: 1rem;
  overflow-wrap: anywhere;
}

.premium-dashboard .pathway-progress-card > p {
  margin-top: 0.35rem;
  color: rgba(255, 255, 255, 0.68) !important;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.68) !important;
  font-size: 0.67rem;
  line-height: 1.5;
}

.premium-dashboard .premium-pathway-panel .pathway-status,
.premium-dashboard .premium-pathway-panel .pathway-status i,
.premium-dashboard .premium-pathway-panel .pathway-milestone strong,
.premium-dashboard .premium-pathway-panel .pathway-progress-card__label,
.premium-dashboard .premium-pathway-panel .pathway-progress-ring strong,
.premium-dashboard .premium-pathway-panel .pathway-progress-ring span,
.premium-dashboard .premium-pathway-panel .pathway-progress-card__strand,
.premium-dashboard .premium-pathway-panel .pathway-progress-card > p {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.pathway-stat-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 0.8rem;
}

.pathway-stat-card {
  --path-stat-accent: #4f7d3a;
  --path-stat-wash: #e7f1e1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.7rem;
  min-height: 6.8rem;
  padding: 0.8rem;
  border: 1px solid rgba(79, 125, 58, 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 8px 22px rgba(30, 67, 7, 0.055);
  backdrop-filter: blur(10px);
  transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
}

.pathway-stat-card:hover {
  border-color: rgba(79, 125, 58, 0.3);
  box-shadow: 0 15px 30px rgba(30, 67, 7, 0.1);
  transform: translateY(-4px);
}

.pathway-stat-card--forest { --path-stat-accent: #1e4307; --path-stat-wash: #dcead3; }
.pathway-stat-card--sage { --path-stat-accent: #6f9d58; --path-stat-wash: #e7f1e1; }
.pathway-stat-card--teal { --path-stat-accent: #3f7768; --path-stat-wash: #dcefe8; }
.pathway-stat-card--success { --path-stat-accent: #40823b; --path-stat-wash: #e1f1dd; }
.pathway-stat-card--blue { --path-stat-accent: #52758c; --path-stat-wash: #e4eef3; }
.pathway-stat-card--gold { --path-stat-accent: #967019; --path-stat-wash: #f7eac8; }

.pathway-stat-card__icon {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  place-items: center;
  color: var(--path-stat-accent);
  border-radius: 12px;
  background: var(--path-stat-wash);
  font-size: 0.95rem;
}

.pathway-stat-card > div {
  min-width: 0;
}

.pathway-stat-card > div > span {
  display: block;
  color: #71806c;
  font-size: 0.62rem;
  font-weight: 750;
  line-height: 1.35;
}

.pathway-stat-card strong {
  display: block;
  margin-top: 0.3rem;
  overflow: hidden;
  color: #18320d;
  font-size: clamp(1rem, 1.8vw, 1.35rem);
  font-weight: 820;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.pathway-stat-card small {
  display: block;
  margin-top: 0.3rem;
  color: #7f8b7b;
  font-size: 0.57rem;
  line-height: 1.4;
}

.pathway-stat-card--skeleton {
  pointer-events: none;
}

.pathway-stat-card--skeleton > div {
  display: grid;
  gap: 0.55rem;
  width: 100%;
}

.pathway-loading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 13rem;
  gap: 2rem;
  align-items: center;
  min-height: 25rem;
  padding: 2.5rem;
  border: 1px solid #e1ebdc;
  border-radius: 20px;
  background: #f8fbf6;
}

.pathway-loading > div {
  display: grid;
  gap: 0.9rem;
}

.pathway-loading__ring {
  width: 12rem;
  height: 12rem;
  border-radius: 50%;
}

@media (max-width: 1180px) {
  .pathway-stat-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .pathway-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .pathway-progress-card {
    max-width: 28rem;
    width: 100%;
    margin: 0 auto;
  }
}

@media (max-width: 700px) {
  .premium-dashboard .premium-pathway-panel {
    padding: 1.25rem;
  }

  .pathway-premium-header {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .pathway-back-button,
  .pathway-primary-button {
    width: 100%;
    justify-content: center;
  }

  .pathway-hero {
    gap: 1.5rem;
    min-height: auto;
    padding: 1.5rem;
  }

  .pathway-milestone {
    grid-template-columns: minmax(0, 1fr);
  }

  .pathway-stat-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .pathway-stat-card {
    min-height: 7.6rem;
  }

  .pathway-loading {
    grid-template-columns: minmax(0, 1fr);
    min-height: auto;
    padding: 1.5rem;
  }

  .pathway-loading__ring {
    width: 9rem;
    height: 9rem;
    margin: 0 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .premium-dashboard *,
  .premium-dashboard *::before,
  .premium-dashboard *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

</style>
