<template>
  <div class="admin-dashboard" :class="{ 'admin-dashboard--modal-open': isMetricsModalOpen }">
    <header class="admin-header">
      <div class="container">
        <div class="admin-header-content">
          <button
            type="button"
            class="mobile-menu-toggle"
            @click="toggleSidebar"
            :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="isSidebarOpen ? 'true' : 'false'"
            aria-controls="admin-sidebar-drawer"
            title="Menu"
          >
            <i class="fas fa-bars"></i>
          </button>
          <div class="admin-logo">
            <div class="admin-logo-icon">
              <img src="/logo.png" alt="EduMatch" class="admin-logo-img" />
            </div>
            <div class="admin-logo-text">
              <h1>EduMatch Admin</h1>
              <span class="page-title">Dashboard Overview</span>
            </div>
          </div>
          <div class="admin-actions">
            <div ref="accountMenuRef" class="account-menu">
              <button
                type="button"
                class="header-account-trigger"
                aria-label="Account menu"
                title="Settings"
                :aria-expanded="isAccountMenuOpen ? 'true' : 'false'"
                @click="toggleAccountMenu"
              >
                <i class="fas fa-cog"></i>
              </button>
              <div v-if="isAccountMenuOpen" class="account-menu-dropdown">
                <button type="button" class="account-menu-item" @click="goToProfile">
                  <i class="fas fa-user"></i>
                  <span>Profile</span>
                </button>
                <button type="button" class="account-menu-item" @click="goToSettings">
                  <i class="fas fa-cog"></i>
                  <span>Settings</span>
                </button>
                <button type="button" class="account-menu-item danger" @click="handleLogout">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="admin-layout">
      <aside id="admin-sidebar-drawer" class="admin-sidebar" :class="{ active: isSidebarOpen }">
        <div class="sidebar-header">
          <div class="admin-sidebar-brand">
            <div class="admin-sidebar-brand-icon">
              <img src="/logo.png" alt="EduMatch" class="admin-sidebar-logo-img" />
            </div>
            <div class="admin-sidebar-brand-copy">
              <h3>EduMatch</h3>
              <p>Admin Portal</p>
            </div>
          </div>
          <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <nav class="sidebar-menu sidebar-nav">
          <div class="nav-section">
            <h4 class="nav-section-title">Navigation</h4>
            <router-link to="/admin/dashboard" class="nav-link sidebar-item sidebar-item--dashboard" :class="{ active: isActive('/admin/dashboard') }" @click="closeSidebar">
              <i class="fas fa-tachometer-alt"></i>
              <span>Overview</span>
            </router-link>
            <router-link to="/admin/users" class="nav-link sidebar-item sidebar-item--users" :class="{ active: isActive('/admin/users') }" @click="closeSidebar">
              <i class="fas fa-user-cog"></i>
              <span>User Management</span>
            </router-link>
            <router-link to="/admin/requests" class="nav-link sidebar-item sidebar-item--requests" :class="{ active: isActive('/admin/requests') }" @click="closeSidebar">
              <i class="fas fa-inbox"></i>
              <span>Request</span>
            </router-link>
            <router-link to="/admin/login-attempts" class="nav-link sidebar-item sidebar-item--login-attempts" :class="{ active: isActive('/admin/login-attempts') }" @click="closeSidebar">
              <i class="fas fa-right-to-bracket"></i>
              <span>Login Attempts</span>
            </router-link>
            <router-link to="/admin/audit-logs" class="nav-link sidebar-item sidebar-item--audit-logs" :class="{ active: isActive('/admin/audit-logs') }" @click="closeSidebar">
              <i class="fas fa-clipboard-list"></i>
              <span>Audit Logs</span>
            </router-link>
          </div>
        </nav>
      </aside>
      <button
        v-if="isSidebarOpen"
        type="button"
        class="sidebar-backdrop"
        aria-label="Close sidebar"
        @click="closeSidebar"
      ></button>

      <main class="admin-main">
        <!-- Page Header -->
        <div class="page-header fade-in">
          <div class="header-left">
            <h2>Overview</h2>
            <p>Monitor platform performance, manage users, and configure system settings.</p>
          </div>
        </div>

        <!-- Analytics Section -->
        <section class="analytics-section section-card">
          <div class="section-header analytics-section-header">
            <div class="analytics-section-heading">
              <h3 class="section-title">
                <i class="fas fa-chart-line" style="margin-right: 0.5rem; color: var(--edu-blue, #374151);"></i>
                Analytics & Platform Metrics
              </h3>
              <p class="analytics-section-subtitle">
                A quick snapshot of platform growth, active accounts, and publishing activity.
              </p>
            </div>
          </div>

          <div v-if="loadingAnalytics" class="activity-item" style="margin-bottom: 0.75rem;">
            <div class="activity-content">
              <div class="activity-details">
                <h4 class="activity-title">Loading analytics...</h4>
                <p class="activity-description">Fetching latest platform metrics from database.</p>
              </div>
            </div>
          </div>
          <div v-else-if="analyticsError" class="activity-item" style="margin-bottom: 0.75rem;">
            <div class="activity-content">
              <div class="activity-details">
                <h4 class="activity-title">Unable to load analytics</h4>
                <p class="activity-description">{{ analyticsError }}</p>
              </div>
            </div>
          </div>

          <!-- Analytics Grid -->
          <div class="analytics-grid">
            <div
              class="analytics-card analytics-card--interactive card-blue"
              data-stat="totalStudents"
              role="button"
              tabindex="0"
              aria-label="Open students table"
              @click="openMetricDetails('students')"
              @keydown.enter.prevent="openMetricDetails('students')"
              @keydown.space.prevent="openMetricDetails('students')"
            >
              <div class="analytics-card-header">
                <div class="analytics-icon">
                  <i class="fas fa-users-between-lines"></i>
                </div>
                <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.studentGrowth)}`">{{ formatGrowth(metrics.studentGrowth) }}</span>
              </div>
              <div class="analytics-main">
                <span class="analytics-value">{{ formatNumber(metrics.totalStudents) }}</span>
                <span class="analytics-label">total students</span>
              </div>
              <div class="analytics-footer">
                <span><i class="fas fa-calendar"></i> {{ formatNumber(metrics.newStudents) }} net active change in the last 30 days</span>
              </div>
            </div>

            <div
              class="analytics-card analytics-card--interactive card-pink"
              data-stat="totalTeachers"
              role="button"
              tabindex="0"
              aria-label="Open teachers table"
              @click="openMetricDetails('teachers')"
              @keydown.enter.prevent="openMetricDetails('teachers')"
              @keydown.space.prevent="openMetricDetails('teachers')"
            >
              <div class="analytics-card-header">
                <div class="analytics-icon">
                  <i class="fas fa-chalkboard-user"></i>
                </div>
                <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.teacherGrowth)}`">{{ formatGrowth(metrics.teacherGrowth) }}</span>
              </div>
              <div class="analytics-main">
                <span class="analytics-value">{{ formatNumber(metrics.totalTeachers) }}</span>
                <span class="analytics-label">total teachers</span>
              </div>
              <div class="analytics-footer">
                <span><i class="fas fa-user-clock"></i> {{ formatNumber(metrics.pendingApplications) }} pending account approvals</span>
              </div>
            </div>

            <div
              class="analytics-card analytics-card--interactive card-slate"
              data-stat="totalHeadTeachers"
              role="button"
              tabindex="0"
              aria-label="Open head teachers table"
              @click="openMetricDetails('headTeachers')"
              @keydown.enter.prevent="openMetricDetails('headTeachers')"
              @keydown.space.prevent="openMetricDetails('headTeachers')"
            >
              <div class="analytics-card-header">
                <div class="analytics-icon">
                  <i class="fas fa-user-tie"></i>
                </div>
                <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.headTeacherGrowth)}`">{{ formatGrowth(metrics.headTeacherGrowth) }}</span>
              </div>
              <div class="analytics-main">
                <span class="analytics-value">{{ formatNumber(metrics.totalHeadTeachers) }}</span>
                <span class="analytics-label">total head teachers</span>
              </div>
              <div class="analytics-footer">
                <span><i class="fas fa-building-columns"></i> department supervisors on platform</span>
              </div>
            </div>

            <div
              class="analytics-card analytics-card--interactive card-blue"
              data-stat="totalSecretaries"
              role="button"
              tabindex="0"
              aria-label="Open secretaries table"
              @click="openMetricDetails('secretaries')"
              @keydown.enter.prevent="openMetricDetails('secretaries')"
              @keydown.space.prevent="openMetricDetails('secretaries')"
            >
              <div class="analytics-card-header">
                <div class="analytics-icon">
                  <i class="fas fa-user-gear"></i>
                </div>
                <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.secretaryGrowth)}`">{{ formatGrowth(metrics.secretaryGrowth) }}</span>
              </div>
              <div class="analytics-main">
                <span class="analytics-value">{{ formatNumber(metrics.totalSecretaries) }}</span>
                <span class="analytics-label">total secretaries</span>
              </div>
              <div class="analytics-footer">
                <span><i class="fas fa-briefcase"></i> administrative support accounts</span>
              </div>
            </div>

            <div
              class="analytics-card analytics-card--interactive card-amber"
              role="button"
              tabindex="0"
              aria-label="Open lessons table"
              @click="openMetricDetails('lessons')"
              @keydown.enter.prevent="openMetricDetails('lessons')"
              @keydown.space.prevent="openMetricDetails('lessons')"
            >
              <div class="analytics-card-header">
                <div class="analytics-icon">
                  <i class="fas fa-video"></i>
                </div>
                <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.courseGrowth)}`">{{ formatGrowth(metrics.courseGrowth) }}</span>
              </div>
              <div class="analytics-main">
                <span class="analytics-value">{{ formatNumber(metrics.totalCourses) }}</span>
                <span class="analytics-label">lessons published</span>
              </div>
              <div class="analytics-footer">
                <span><i class="fas fa-book-open"></i> {{ formatNumber(metrics.totalSubjects) }} active subjects across {{ formatNumber(metrics.totalTracks) }} tracks</span>
              </div>
            </div>

            <div
              class="analytics-card analytics-card--interactive card-green"
              data-stat="totalActivities"
              role="button"
              tabindex="0"
              aria-label="Open assessments table"
              @click="openMetricDetails('assessments')"
              @keydown.enter.prevent="openMetricDetails('assessments')"
              @keydown.space.prevent="openMetricDetails('assessments')"
            >
              <div class="analytics-card-header">
                <div class="analytics-icon">
                  <i class="fas fa-list-check"></i>
                </div>
                <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.weeklyCompletionGrowth)}`">{{ formatGrowth(metrics.weeklyCompletionGrowth) }}</span>
              </div>
              <div class="analytics-main">
                <span class="analytics-value">{{ formatNumber(metrics.totalActivities) }}</span>
                <span class="analytics-label">assessments published</span>
              </div>
              <div class="analytics-footer">
                <span><i class="fas fa-clipboard-check"></i> {{ formatPercent(metrics.courseCompletion) }} submission coverage from assessments</span>
              </div>
            </div>
          </div>
        </section>

        <section class="analytics-board-grid">
          <article class="section-card chart-panel">
            <div class="panel-header">
              <div>
                <h3 class="section-title">Role Growth Trends</h3>
                <p class="panel-subtitle">Daily account creation over the last 30 days for every admin-managed role.</p>
              </div>
            </div>
            <div class="chart-wrap chart-wrap--lg">
              <canvas ref="roleTrendCanvas" aria-label="Role growth trend line chart"></canvas>
            </div>
            <div class="trend-badge-grid">
              <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.studentGrowth)}`">Students {{ formatGrowth(metrics.studentGrowth) }}</span>
              <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.teacherGrowth)}`">Teachers {{ formatGrowth(metrics.teacherGrowth) }}</span>
              <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.headTeacherGrowth)}`">Head Teachers {{ formatGrowth(metrics.headTeacherGrowth) }}</span>
              <span class="trend-pill" :class="`trend-pill--${trendTone(metrics.secretaryGrowth)}`">Secretaries {{ formatGrowth(metrics.secretaryGrowth) }}</span>
            </div>
          </article>

          <article class="section-card chart-panel">
            <div class="panel-header">
              <div>
                <h3 class="section-title">Learning Completion Funnel</h3>
                <p class="panel-subtitle">Follow the drop-off from lessons to assessments to completed submissions.</p>
              </div>
            </div>
            <div class="chart-wrap">
              <canvas ref="funnelCanvas" aria-label="Learning completion funnel bar chart"></canvas>
            </div>
            <div class="funnel-metrics">
              <div class="funnel-metric">
                <span>Lessons</span>
                <strong>{{ formatNumber(metrics.totalLessons) }}</strong>
              </div>
              <div class="funnel-metric">
                <span>Assessments</span>
                <strong>{{ formatNumber(metrics.totalAssessments) }}</strong>
              </div>
              <div class="funnel-metric">
                <span>Submissions</span>
                <strong>{{ formatNumber(metrics.totalSubmissions) }}</strong>
              </div>
            </div>
          </article>

          <article class="section-card insight-panel">
            <div class="panel-header">
              <div>
                <h3 class="section-title">Top Performance Signals</h3>
                <p class="panel-subtitle">The strongest subjects and tracks based on current engagement and results.</p>
              </div>
            </div>

            <div class="insight-block">
              <h4 class="insight-title">Top Subjects</h4>
              <div v-if="metrics.topSubjects.length === 0" class="insight-empty">No subject performance data yet.</div>
              <div v-for="subject in metrics.topSubjects" :key="`${subject.track}-${subject.subject}`" class="insight-row">
                <div>
                  <strong>{{ subject.subject }}</strong>
                  <small>{{ subject.track }} track</small>
                </div>
                <div class="insight-stats">
                  <span>{{ formatNumber(subject.submissionCount) }} submissions</span>
                  <span>{{ formatPercent(subject.averageScore) }} avg score</span>
                </div>
              </div>
            </div>

            <div class="insight-block">
              <h4 class="insight-title">Top Tracks</h4>
              <div v-if="metrics.topTracks.length === 0" class="insight-empty">No track performance data yet.</div>
              <div v-for="track in metrics.topTracks" :key="track.track" class="insight-row">
                <div>
                  <strong>{{ track.track }}</strong>
                  <small>{{ formatNumber(track.assessmentCount) }} assessments</small>
                </div>
                <div class="insight-stats">
                  <span>{{ formatNumber(track.submissionCount) }} submissions</span>
                  <span>{{ formatPercent(track.averageScore) }} avg score</span>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section class="ai-analytics-section section-card">
          <div class="section-header analytics-section-header">
            <div class="analytics-section-heading">
              <h3 class="section-title">
                <i class="fas fa-robot" style="margin-right: 0.5rem; color: var(--edu-teal, #374151);"></i>
                AI Usage Quality
              </h3>
              <p class="analytics-section-subtitle">
                Track how many generated exams are actually attempted and which difficulty level is performing best.
              </p>
            </div>
          </div>

          <div class="ai-analytics-grid">
            <div class="ai-analytics-card ai-chart-card">
              <h4 class="config-subtitle">
                <i class="fas fa-chart-pie"></i> Difficulty Distribution
              </h4>
              <div class="chart-wrap chart-wrap--donut">
                <canvas ref="aiUsageCanvas" aria-label="AI exam usage donut chart"></canvas>
              </div>
              <p class="ai-chart-caption">How many generated assessments fall under easy, medium, and hard difficulty.</p>
            </div>

            <div class="ai-analytics-card ai-summary-card">
              <h4 class="config-subtitle">
                <i class="fas fa-list-check"></i> Challenge Snapshot
              </h4>
              <div class="ai-kpi-grid">
                <div class="ai-kpi-item">
                  <span class="ai-kpi-label">Total AI-Generated Exams</span>
                  <span class="ai-kpi-value">{{ formatNumber(aiMetrics.totalGeneratedExams) }}</span>
                </div>
                <div class="ai-kpi-item">
                  <span class="ai-kpi-label">Easy</span>
                  <span class="ai-kpi-value">{{ formatNumber(aiMetrics.difficultyData.easy) }}</span>
                </div>
                <div class="ai-kpi-item">
                  <span class="ai-kpi-label">Medium</span>
                  <span class="ai-kpi-value">{{ formatNumber(aiMetrics.difficultyData.medium) }}</span>
                </div>
                <div class="ai-kpi-item">
                  <span class="ai-kpi-label">Hard</span>
                  <span class="ai-kpi-value">{{ formatNumber(aiMetrics.difficultyData.hard) }}</span>
                </div>
              </div>

              <div class="ai-highlight">
                <span class="ai-highlight-label">Most Used Difficulty</span>
                <strong class="ai-highlight-value">
                  {{ aiMetrics.topDifficulty || 'No data yet' }}
                </strong>
                <small v-if="aiMetrics.topDifficulty">
                  Based on the current generated assessment counts by difficulty level.
                </small>
              </div>

              <h5 class="ai-examtype-title">Exam Type Distribution</h5>
              <div class="ai-examtype-list">
                <span v-if="aiMetrics.examTypes.length === 0" class="ai-examtype-pill">No data yet</span>
                <span v-for="type in aiMetrics.examTypes" :key="type.name" class="ai-examtype-pill">
                  {{ type.name }}: {{ type.count }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="section-card risk-section">
          <div class="panel-header">
            <div>
              <h3 class="section-title">At-Risk Engagement</h3>
              <p class="panel-subtitle">Subjects with weak submission volume or stale content so admins can intervene earlier.</p>
            </div>
          </div>
          <div class="risk-grid">
            <div v-if="metrics.atRiskSubjects.length === 0" class="insight-empty">No at-risk subjects detected right now.</div>
            <article v-for="subject in metrics.atRiskSubjects" :key="`risk-${subject.track}-${subject.subject}`" class="risk-card">
              <div class="risk-card-header">
                <div>
                  <h4>{{ subject.subject }}</h4>
                  <p>{{ subject.track }} track</p>
                </div>
                <span class="risk-chip">Needs attention</span>
              </div>
              <div class="risk-stats">
                <span>{{ formatNumber(subject.lessonCount) }} lessons</span>
                <span>{{ formatNumber(subject.assessmentCount) }} assessments</span>
                <span>{{ formatNumber(subject.submissionCount) }} submissions</span>
              </div>
              <p class="risk-meta">Last content upload: {{ formatDate(subject.lastContentAt) }}</p>
            </article>
          </div>
        </section>

      </main>
    </div>

    <div v-if="isMetricsModalOpen" class="modal-shell modal-shell--analytics" @click.self="closeMetricsModal">
      <div class="modal-panel modal-panel--analytics">
        <div class="modal-panel-head">
          <div>
            <h3>{{ activeMetricModal.title }}</h3>
            <p>{{ activeMetricModal.description }}</p>
          </div>
          <button type="button" class="modal-close-btn" @click="closeMetricsModal" aria-label="Close metrics table">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-panel-body">
          <div class="analytics-table-wrap">
            <table class="analytics-table">
              <thead>
                <tr>
                  <th v-for="column in activeMetricModal.columns" :key="column.key">{{ column.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="activeMetricModal.rows.length === 0">
                  <td :colspan="activeMetricModal.columns.length" class="analytics-table-empty">No records available.</td>
                </tr>
                <tr v-for="row in activeMetricModal.rows" :key="row.id">
                  <td v-for="column in activeMetricModal.columns" :key="`${row.id}-${column.key}`">
                    {{ formatMetricCell(row[column.key], column.type) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { useAuthStore } from '../../stores/auth.js'

export default {
  name: 'AdminView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const roleTrendCanvas = ref(null)
    const funnelCanvas = ref(null)
    const aiUsageCanvas = ref(null)
    let roleTrendChart = null
    let funnelChart = null
    let aiUsageChart = null
    let refreshTimer = null
    let visibilityChangeHandler = null
    const SIDEBAR_BREAKPOINT = 1024
    const isSidebarOpen = ref(false)
    const accountMenuRef = ref(null)
    const isAccountMenuOpen = ref(false)

    const adminName = computed(() => authStore.user?.name || 'Admin')
    const loadingAnalytics = ref(false)
    const analyticsError = ref('')
    const isMetricsModalOpen = ref(false)
    const activeMetricKey = ref('students')
    // Metrics data
    const metrics = reactive({
      totalStudents: 0,
      studentGrowth: 0,
      studentNetChange: 0,
      newStudents: 0,
      totalTeachers: 0,
      teacherGrowth: 0,
      teacherNetChange: 0,
      totalHeadTeachers: 0,
      headTeacherGrowth: 0,
      headTeacherNetChange: 0,
      totalSecretaries: 0,
      secretaryGrowth: 0,
      secretaryNetChange: 0,
      pendingApplications: 0,
      pendingEnrollments: 0,
      totalUsers: 0,
      totalUserGrowth: 0,
      totalUserNetChange: 0,
      totalCourses: 0,
      totalActivities: 0,
      totalTracks: 0,
      totalSubjects: 0,
      totalEnrollments: 0,
      totalLessons: 0,
      totalAssessments: 0,
      totalSubmissions: 0,
      courseGrowth: 0,
      activityGrowth: 0,
      pendingCourses: 0,
      avgSession: '0m 0s',
      courseCompletion: 0,
      weeklyCompletionGrowth: 0,
      approvalWorkload: {
        pendingApplications: 0,
        pendingEnrollments: 0,
        totalPending: 0,
      },
      roleTrends: {
        labels: [],
        series: [],
      },
      learningFunnel: {
        labels: ['Lessons', 'Assessments', 'Submissions'],
        values: [0, 0, 0],
      },
      detailTables: {
        students: [],
        teachers: [],
        headTeachers: [],
        secretaries: [],
        lessons: [],
        assessments: [],
      },
      topSubjects: [],
      topTracks: [],
      atRiskSubjects: []
    })

    // AI Metrics
    const aiMetrics = reactive({
      totalGeneratedExams: 0,
      totalAiChallenges: 0,
      recentChallenges: 0,
      topExamType: '',
      examTypes: [],
      difficultyData: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      topDifficulty: '',
      attemptedExams: 0,
      unattemptedExams: 0,
      completionRate: 0,
      mostEffectiveDifficulty: null,
      usageDistribution: {
        labels: ['Attempted', 'Not Yet Attempted'],
        values: [0, 0],
      },
    })

    const metricModalConfig = {
      students: {
        title: 'Students Table',
        description: 'All student accounts currently tracked by the platform.',
        columns: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'status', label: 'Status', type: 'text' },
          { key: 'createdAt', label: 'Created', type: 'date' },
        ],
      },
      teachers: {
        title: 'Teachers Table',
        description: 'All teacher accounts currently tracked by the platform.',
        columns: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'status', label: 'Status', type: 'text' },
          { key: 'createdAt', label: 'Created', type: 'date' },
        ],
      },
      headTeachers: {
        title: 'Head Teachers Table',
        description: 'All head teacher accounts and their assigned departments.',
        columns: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'department', label: 'Department', type: 'text' },
          { key: 'status', label: 'Status', type: 'text' },
          { key: 'createdAt', label: 'Created', type: 'date' },
        ],
      },
      secretaries: {
        title: 'Secretaries Table',
        description: 'All secretary accounts currently available in the system.',
        columns: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'status', label: 'Status', type: 'text' },
          { key: 'createdAt', label: 'Created', type: 'date' },
        ],
      },
      lessons: {
        title: 'Lessons Published Table',
        description: 'All lessons currently published in the platform.',
        columns: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subject', label: 'Subject', type: 'text' },
          { key: 'track', label: 'Track', type: 'text' },
          { key: 'createdAt', label: 'Created', type: 'date' },
        ],
      },
      assessments: {
        title: 'Assessments Published Table',
        description: 'All assessments currently available in the platform.',
        columns: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subject', label: 'Subject', type: 'text' },
          { key: 'difficulty', label: 'Difficulty', type: 'text' },
          { key: 'examType', label: 'Exam Type', type: 'text' },
          { key: 'createdAt', label: 'Created', type: 'date' },
        ],
      },
    }
    const activeMetricModal = computed(() => {
      const key = activeMetricKey.value
      const config = metricModalConfig[key] || metricModalConfig.students
      const rows = Array.isArray(metrics.detailTables?.[key]) ? metrics.detailTables[key] : []

      return {
        title: config.title,
        description: config.description,
        columns: config.columns,
        rows,
      }
    })

    // Socket connection (if needed)
    let socket = null

    // Methods
    const isActive = (path) => {
      return route.path === path
    }

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
    }

    const closeSidebar = () => {
      isSidebarOpen.value = false
    }

    const toggleAccountMenu = () => {
      isAccountMenuOpen.value = !isAccountMenuOpen.value
    }

    const closeAccountMenu = () => {
      isAccountMenuOpen.value = false
    }

    const openMetricDetails = (key) => {
      activeMetricKey.value = metricModalConfig[key] ? key : 'students'
      isMetricsModalOpen.value = true
      if (typeof document !== 'undefined') {
        document.body.classList.add('admin-modal-open')
      }
    }

    const closeMetricsModal = () => {
      isMetricsModalOpen.value = false
      if (typeof document !== 'undefined') {
        document.body.classList.remove('admin-modal-open')
      }
    }

    const goToProfile = () => {
      closeAccountMenu()
      router.push('/admin/profile')
    }

    const goToSettings = () => {
      closeAccountMenu()
      router.push('/admin/settings')
    }

    const syncMobileMenuBodyState = () => {
      if (typeof window === 'undefined') return
      const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
      document.body.classList.toggle('admin-mobile-menu-open', shouldLockBody)
    }

    const formatNumber = (num) => {
      return new Intl.NumberFormat().format(Number(num || 0))
    }

    const resolveApiBaseUrl = () => {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      if (configured.endsWith('/api')) return configured
      return `${configured}/api`
    }

    const getAuthConfig = () => ({
      headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
    })

    const applyAnalyticsPayload = (payload = {}) => {
      Object.assign(metrics, {
        totalStudents: payload.totalStudents ?? 0,
        studentGrowth: payload.studentGrowth ?? 0,
        studentNetChange: payload.studentNetChange ?? 0,
        newStudents: payload.newStudents ?? 0,
        totalTeachers: payload.totalTeachers ?? 0,
        teacherGrowth: payload.teacherGrowth ?? 0,
        teacherNetChange: payload.teacherNetChange ?? 0,
        totalHeadTeachers: payload.totalHeadTeachers ?? payload.totalHeadteachers ?? 0,
        headTeacherGrowth: payload.headTeacherGrowth ?? 0,
        headTeacherNetChange: payload.headTeacherNetChange ?? 0,
        totalSecretaries: payload.totalSecretaries ?? payload.totalSecretary ?? 0,
        secretaryGrowth: payload.secretaryGrowth ?? 0,
        secretaryNetChange: payload.secretaryNetChange ?? 0,
        pendingApplications: payload.pendingApplications ?? 0,
        pendingEnrollments: payload.pendingEnrollments ?? 0,
        totalUsers: payload.totalUsers ?? 0,
        totalUserGrowth: payload.totalUserGrowth ?? 0,
        totalUserNetChange: payload.totalUserNetChange ?? 0,
        totalCourses: payload.totalCourses ?? 0,
        totalActivities: payload.totalActivities ?? payload.totalPublishedActivities ?? 0,
        totalTracks: payload.totalTracks ?? payload.totalSubjects ?? 0,
        totalSubjects: payload.totalSubjects ?? 0,
        totalEnrollments: payload.totalEnrollments ?? 0,
        totalLessons: payload.totalLessons ?? 0,
        totalAssessments: payload.totalAssessments ?? 0,
        totalSubmissions: payload.totalSubmissions ?? 0,
        courseGrowth: payload.courseGrowth ?? 0,
        activityGrowth: payload.activityGrowth ?? 0,
        pendingCourses: payload.pendingCourses ?? 0,
        avgSession: payload.avgSession ?? 'N/A',
        courseCompletion: payload.courseCompletion ?? 0,
        weeklyCompletionGrowth: payload.weeklyCompletionGrowth ?? 0,
        approvalWorkload: {
          pendingApplications: payload.approvalWorkload?.pendingApplications ?? payload.pendingApplications ?? 0,
          pendingEnrollments: payload.approvalWorkload?.pendingEnrollments ?? payload.pendingEnrollments ?? 0,
          totalPending: payload.approvalWorkload?.totalPending ?? 0,
        },
        roleTrends: {
          labels: Array.isArray(payload.roleTrends?.labels) ? payload.roleTrends.labels : [],
          series: Array.isArray(payload.roleTrends?.series) ? payload.roleTrends.series : [],
        },
        learningFunnel: {
          labels: Array.isArray(payload.learningFunnel?.labels)
            ? payload.learningFunnel.labels
            : ['Lessons', 'Assessments', 'Submissions'],
          values: Array.isArray(payload.learningFunnel?.values) ? payload.learningFunnel.values : [0, 0, 0],
        },
        detailTables: {
          students: Array.isArray(payload.detailTables?.students) ? payload.detailTables.students : [],
          teachers: Array.isArray(payload.detailTables?.teachers) ? payload.detailTables.teachers : [],
          headTeachers: Array.isArray(payload.detailTables?.headTeachers) ? payload.detailTables.headTeachers : [],
          secretaries: Array.isArray(payload.detailTables?.secretaries) ? payload.detailTables.secretaries : [],
          lessons: Array.isArray(payload.detailTables?.lessons) ? payload.detailTables.lessons : [],
          assessments: Array.isArray(payload.detailTables?.assessments) ? payload.detailTables.assessments : [],
        },
        topSubjects: Array.isArray(payload.topSubjects) ? payload.topSubjects : [],
        topTracks: Array.isArray(payload.topTracks) ? payload.topTracks : [],
        atRiskSubjects: Array.isArray(payload.atRiskSubjects) ? payload.atRiskSubjects : [],
      })
    }

    const applyAiAnalyticsPayload = (payload = {}) => {
      const easyCount = payload.difficultyData?.easy ?? 0
      const mediumCount = payload.difficultyData?.medium ?? 0
      const hardCount = payload.difficultyData?.hard ?? 0
      const difficultyEntries = [
        { key: 'easy', value: easyCount },
        { key: 'medium', value: mediumCount },
        { key: 'hard', value: hardCount },
      ]
      const topDifficultyEntry = [...difficultyEntries].sort((left, right) => right.value - left.value)[0]

      Object.assign(aiMetrics, {
        totalGeneratedExams: payload.totalGeneratedExams ?? 0,
        totalAiChallenges: payload.totalAiChallenges ?? 0,
        recentChallenges: payload.recentChallenges ?? 0,
        topExamType: payload.topExamType || '',
        examTypes: Array.isArray(payload.examTypes) ? payload.examTypes : [],
        difficultyData: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount,
        },
        topDifficulty: topDifficultyEntry?.value ? topDifficultyEntry.key : '',
        attemptedExams: payload.attemptedExams ?? 0,
        unattemptedExams: payload.unattemptedExams ?? 0,
        completionRate: payload.completionRate ?? 0,
        mostEffectiveDifficulty: payload.mostEffectiveDifficulty ?? null,
        usageDistribution: {
          labels: ['Easy', 'Medium', 'Hard'],
          values: [easyCount, mediumCount, hardCount],
        },
      })
    }

    const formatPercent = (value) => {
      return `${Number(value || 0).toFixed(1)}%`
    }

    const growthPrefix = (value) => (Number(value || 0) > 0 ? '+' : '')

    const formatGrowth = (value) => `${growthPrefix(value)}${formatPercent(value)}`

    const trendTone = (value) => {
      if (Number(value || 0) > 0) return 'positive'
      if (Number(value || 0) < 0) return 'negative'
      return 'neutral'
    }

    const formatDate = (value) => {
      if (!value) return 'No recent upload'
      const timestamp = new Date(value)
      if (Number.isNaN(timestamp.getTime())) return 'No recent upload'
      return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatMetricCell = (value, type = 'text') => {
      if (type === 'date') {
        if (!value) return '-'
        const timestamp = new Date(value)
        if (Number.isNaN(timestamp.getTime())) return '-'
        return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }

      const normalized = String(value ?? '').trim()
      return normalized || '-'
    }

    const destroyCharts = () => {
      if (roleTrendChart) {
        roleTrendChart.destroy()
        roleTrendChart = null
      }
      if (funnelChart) {
        funnelChart.destroy()
        funnelChart = null
      }
      if (aiUsageChart) {
        aiUsageChart.destroy()
        aiUsageChart = null
      }
    }

    const createRoleTrendChart = () => {
      if (!roleTrendCanvas.value) return

      const ctx = roleTrendCanvas.value.getContext('2d')
      const palette = [
        { start: '#60a5fa', end: '#1d4ed8', fillStart: 'rgba(96, 165, 250, 0.22)', fillEnd: 'rgba(29, 78, 216, 0.04)' },
        { start: '#f472b6', end: '#db2777', fillStart: 'rgba(244, 114, 182, 0.2)', fillEnd: 'rgba(219, 39, 119, 0.04)' },
        { start: '#2dd4bf', end: '#0f766e', fillStart: 'rgba(45, 212, 191, 0.2)', fillEnd: 'rgba(15, 118, 110, 0.04)' },
        { start: '#fbbf24', end: '#d97706', fillStart: 'rgba(251, 191, 36, 0.22)', fillEnd: 'rgba(217, 119, 6, 0.05)' },
      ]

      roleTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: metrics.roleTrends.labels,
          datasets: metrics.roleTrends.series.map((series, index) => {
            const chartArea = roleTrendCanvas.value ? roleTrendCanvas.value.getBoundingClientRect() : null
            const colorSet = palette[index % palette.length]
            const borderGradient = ctx.createLinearGradient(0, 0, chartArea?.width || 260, 0)
            borderGradient.addColorStop(0, colorSet.start)
            borderGradient.addColorStop(1, colorSet.end)

            const fillGradient = ctx.createLinearGradient(0, 0, 0, chartArea?.height || 320)
            fillGradient.addColorStop(0, colorSet.fillStart)
            fillGradient.addColorStop(1, colorSet.fillEnd)

            return {
              label: series.label,
              data: Array.isArray(series.data) ? series.data : [],
              borderColor: borderGradient,
              backgroundColor: fillGradient,
              pointBackgroundColor: colorSet.end,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              borderWidth: 3,
              tension: 0.35,
              fill: true,
            }
          }),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', maxTicksLimit: 8 },
            },
            y: {
              beginAtZero: true,
              ticks: { precision: 0, color: '#64748b' },
              grid: { color: 'rgba(203, 213, 225, 0.55)' },
            },
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                boxWidth: 10,
                color: '#0f172a',
              },
            },
          },
        },
      })
    }

    const createFunnelChart = () => {
      if (!funnelCanvas.value) return

      const ctx = funnelCanvas.value.getContext('2d')
      funnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: metrics.learningFunnel.labels,
          datasets: [
            {
              label: 'Volume',
              data: metrics.learningFunnel.values,
              backgroundColor: (context) => {
                const chart = context.chart
                const { ctx: chartContext, chartArea } = chart
                if (!chartArea) {
                  return ['#3b82f6', '#14b8a6', '#f59e0b'][context.dataIndex] || '#3b82f6'
                }

                const gradients = [
                  ['#60a5fa', '#1d4ed8'],
                  ['#5eead4', '#0f766e'],
                  ['#fbbf24', '#ea580c'],
                ]
                const [startColor, endColor] = gradients[context.dataIndex] || gradients[0]
                const gradient = chartContext.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
                gradient.addColorStop(0, startColor)
                gradient.addColorStop(1, endColor)
                return gradient
              },
              borderRadius: 12,
              maxBarThickness: 58,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#475569' },
            },
            y: {
              beginAtZero: true,
              ticks: { precision: 0, color: '#475569' },
              grid: { color: 'rgba(203, 213, 225, 0.55)' },
            },
          },
          plugins: {
            legend: { display: false },
          },
        },
      })
    }

    const createAiUsageChart = () => {
      if (!aiUsageCanvas.value) return

      const ctx = aiUsageCanvas.value.getContext('2d')
      aiUsageChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: aiMetrics.usageDistribution.labels,
          datasets: [
            {
              data: aiMetrics.usageDistribution.values,
              backgroundColor: (() => {
                const { width = 320, height = 320 } = aiUsageCanvas.value?.getBoundingClientRect() || {}
                const gradients = [
                  ['#93c5fd', '#1d4ed8'],
                  ['#99f6e4', '#0f766e'],
                  ['#fde68a', '#ea580c'],
                ]

                return gradients.map(([startColor, endColor], index) => {
                  const gradient = ctx.createLinearGradient(0, 0, width, height)
                  const offsetStart = Math.min(index * 0.18, 0.45)
                  const offsetEnd = Math.max(0.58, 1 - index * 0.08)
                  gradient.addColorStop(offsetStart, startColor)
                  gradient.addColorStop(offsetEnd, endColor)
                  return gradient
                })
              })(),
              borderColor: ['#ffffff', '#ffffff', '#ffffff'],
              borderWidth: 3,
              hoverOffset: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                color: '#0f172a',
              },
            },
          },
        },
      })
    }

    const renderCharts = async () => {
      await nextTick()
      destroyCharts()
      createRoleTrendChart()
      createFunnelChart()
      createAiUsageChart()
    }

    const fetchDashboardAnalytics = async () => {
      loadingAnalytics.value = true
      analyticsError.value = ''
      try {
        const apiBaseUrl = resolveApiBaseUrl()
        const analyticsResponse = await axios.get(`${apiBaseUrl}/admin/analytics`, getAuthConfig())
        const analytics = analyticsResponse.data?.analytics || {}
        const aiAnalytics = analyticsResponse.data?.aiAnalytics || {}
        applyAnalyticsPayload(analytics)
        applyAiAnalyticsPayload(aiAnalytics)
        await renderCharts()
      } catch (error) {
        analyticsError.value =
          error.response?.data?.message ||
          (error.request ? 'Backend is unreachable. Check API server status.' : 'Failed to load analytics data')
        applyAnalyticsPayload()
        applyAiAnalyticsPayload()
        await renderCharts()
      } finally {
        loadingAnalytics.value = false
      }
    }

    const handleLogout = async () => {
      try {
        closeAccountMenu()
        authStore.logout()
        router.push('/auth/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    const handleDocumentClick = (event) => {
      if (!isAccountMenuOpen.value) return
      if (accountMenuRef.value?.contains(event.target)) return
      closeAccountMenu()
    }

    const handleDocumentKeydown = (event) => {
      if (event.key === 'Escape') {
        closeAccountMenu()
        closeMetricsModal()
      }
    }

    const initializeSocket = () => {
      if (typeof window === 'undefined' || typeof window.io !== 'function') {
        return
      }

      socket = window.io(window.location.origin)
      
      socket.on('metrics-update', (data) => {
        Object.assign(metrics, data)
        renderCharts()
      })

      socket.on('ai-metrics-update', (data) => {
        Object.assign(aiMetrics, data)
        renderCharts()
      })

    }

    watch(
      () => isSidebarOpen.value,
      () => {
        syncMobileMenuBodyState()
      }
    )

    watch(
      () => route.path,
      () => {
        closeSidebar()
        closeAccountMenu()
      }
    )

    // Lifecycle hooks
    onMounted(() => {
      document.body.classList.add('admin-dashboard')
      authStore.clearAlerts?.()
      window.addEventListener('resize', syncMobileMenuBodyState)
      syncMobileMenuBodyState()
      document.addEventListener('click', handleDocumentClick)
      document.addEventListener('keydown', handleDocumentKeydown)

      fetchDashboardAnalytics()

      refreshTimer = window.setInterval(() => {
        fetchDashboardAnalytics()
      }, 30000)

      visibilityChangeHandler = () => {
        if (document.visibilityState === 'visible') {
          fetchDashboardAnalytics()
        }
      }
      document.addEventListener('visibilitychange', visibilityChangeHandler)
      window.addEventListener('focus', fetchDashboardAnalytics)

      // Initialize socket connection if needed
      // initializeSocket()
    })

    onBeforeUnmount(() => {
      document.body.classList.remove('admin-dashboard')
      document.body.classList.remove('admin-mobile-menu-open')
      document.body.classList.remove('admin-modal-open')
      window.removeEventListener('resize', syncMobileMenuBodyState)
      document.removeEventListener('click', handleDocumentClick)
      document.removeEventListener('keydown', handleDocumentKeydown)

      if (socket) {
        socket.disconnect()
      }
      if (visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler)
      }
      window.removeEventListener('focus', fetchDashboardAnalytics)
      if (refreshTimer) {
        clearInterval(refreshTimer)
      }
      destroyCharts()
    })

    return {
      roleTrendCanvas,
      funnelCanvas,
      aiUsageCanvas,
      adminName,
      accountMenuRef,
      isAccountMenuOpen,
      isMetricsModalOpen,
      loadingAnalytics,
      analyticsError,
      metrics,
      aiMetrics,
      activeMetricModal,
      isSidebarOpen,
      isActive,
      toggleSidebar,
      closeSidebar,
      toggleAccountMenu,
      openMetricDetails,
      closeMetricsModal,
      goToProfile,
      goToSettings,
      formatNumber,
      formatPercent,
      formatGrowth,
      formatMetricCell,
      trendTone,
      formatDate,
      handleLogout,
      fetchDashboardAnalytics,
    }
  }
}
</script>

<style scoped>
@import url('/css/admin.css');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.ai-analytics-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.05);
}

.analytics-section {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 18px !important;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06) !important;
}

.analytics-section--interactive {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.analytics-section--interactive:hover,
.analytics-section--interactive:focus-visible {
  transform: translateY(-2px);
  border-color: #bfdbfe !important;
  box-shadow: 0 18px 38px rgba(59, 130, 246, 0.12) !important;
  outline: none;
}

.admin-dashboard--modal-open .admin-header,
.admin-dashboard--modal-open .admin-sidebar,
.admin-dashboard--modal-open .sidebar-backdrop,
.admin-dashboard--modal-open .admin-main > :not(.modal-shell--analytics) {
  filter: blur(8px) saturate(0.95);
  transition: filter 0.2s ease;
}

.analytics-section-header {
  display: flex !important;
  align-items: flex-end !important;
  justify-content: space-between !important;
  gap: 1rem !important;
  margin-bottom: 1.25rem !important;
}

.analytics-section-heading {
  display: grid;
  gap: 0.4rem;
}

.analytics-section-subtitle {
  margin: 0;
  max-width: 42rem;
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
}

.analytics-grid {
  align-items: stretch;
  grid-template-columns: repeat(auto-fit, minmax(clamp(155px, 16vw, 175px), 1fr)) !important;
  gap: clamp(1rem, 1.5vw, 1.25rem) !important;
}

.analytics-card {
  min-height: 0 !important;
  aspect-ratio: 4 / 3 !important;
  border-radius: clamp(12px, 1.2vw, 14px) !important;
  padding: clamp(0.72rem, 1vw, 0.82rem) !important;
  border: 1px solid rgba(169, 213, 95, 0.52) !important;
  background: linear-gradient(180deg, #fbfce9 0%, #fbfce9 100%) !important;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06) !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
}

.analytics-card-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: flex-start !important;
  gap: clamp(0.4rem, 0.7vw, 0.55rem) !important;
  margin-bottom: clamp(0.45rem, 0.8vw, 0.6rem) !important;
}

.analytics-main {
  gap: 0.2rem !important;
}

.analytics-value {
  font-size: clamp(1.4rem, 1.8vw, 1.8rem) !important;
  line-height: 1.05 !important;
}

.analytics-label {
  letter-spacing: 0.07em !important;
  font-size: clamp(0.59rem, 0.65vw, 0.64rem) !important;
  line-height: 1.25 !important;
}

.analytics-footer {
  margin-top: clamp(0.4rem, 0.7vw, 0.55rem) !important;
  padding-top: clamp(0.4rem, 0.7vw, 0.55rem) !important;
  font-size: clamp(0.61rem, 0.7vw, 0.67rem) !important;
  line-height: 1.3 !important;
}

.analytics-footer--split {
  display: grid;
  gap: 0.35rem;
}

.analytics-footer span {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.35rem;
}

.analytics-footer i {
  margin-top: 0.1rem;
}

.analytics-icon {
  width: clamp(32px, 3vw, 36px) !important;
  height: clamp(32px, 3vw, 36px) !important;
  border-radius: clamp(10px, 1vw, 12px) !important;
  font-size: clamp(0.78rem, 0.9vw, 0.86rem) !important;
}

.analytics-card .trend-pill {
  gap: 0.25rem;
  padding: clamp(0.22rem, 0.35vw, 0.28rem) clamp(0.42rem, 0.6vw, 0.52rem);
  font-size: clamp(0.62rem, 0.7vw, 0.68rem);
  line-height: 1.15;
}

/* Match the global dashboard selector so cards cannot overflow their tracks. */
:global(body.admin-dashboard) .analytics-grid {
  grid-template-columns: repeat(auto-fit, minmax(clamp(155px, 16vw, 175px), 1fr)) !important;
  column-gap: clamp(1.25rem, 1.8vw, 1.5rem) !important;
  row-gap: clamp(1.25rem, 1.8vw, 1.5rem) !important;
}

:global(body.admin-dashboard) .analytics-grid > .analytics-card {
  box-sizing: border-box !important;
  width: auto !important;
  inline-size: auto !important;
  justify-self: stretch !important;
  min-width: 0 !important;
  max-width: 100% !important;
  min-height: 0 !important;
  padding: clamp(0.72rem, 1vw, 0.82rem) !important;
}

.analytics-board-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

.chart-panel,
.insight-panel,
.risk-section {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) {
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 38%),
    radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.14), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 52%, #fff8ef 100%);
  border-color: #d9e7fb;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel-subtitle {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.5;
}

.chart-wrap {
  position: relative;
  min-height: 280px;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) .chart-wrap {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(239, 246, 255, 0.92) 100%);
  border-color: #d7e7fb;
}

.chart-wrap--lg {
  min-height: 320px;
}

.chart-wrap--donut {
  min-height: 320px;
}

.trend-badge-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.trend-pill--positive {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.trend-pill--negative {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}

.trend-pill--neutral {
  background: rgba(100, 116, 139, 0.14);
  color: #475569;
}

.funnel-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.funnel-metric {
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 20px rgba(148, 163, 184, 0.08);
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) .funnel-metric:nth-child(1) {
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border-color: #bfdbfe;
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) .funnel-metric:nth-child(2) {
  background: linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 100%);
  border-color: #99f6e4;
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) .funnel-metric:nth-child(3) {
  background: linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%);
  border-color: #fcd34d;
}

.funnel-metric span {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.funnel-metric strong {
  display: block;
  margin-top: 0.35rem;
  color: #0f172a;
  font-size: 1.15rem;
}

.insight-block + .insight-block {
  margin-top: 1.25rem;
}

.insight-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 1.5rem;
}

.insight-panel .panel-header {
  grid-column: 1 / -1;
}

.insight-panel .insight-block + .insight-block {
  margin-top: 0;
}

.insight-title {
  margin: 0 0 0.8rem;
  color: #0f172a;
  font-size: 0.95rem;
}

.insight-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  padding: 0.8rem 0;
  border-top: 1px solid #e2e8f0;
}

.insight-row:first-of-type {
  border-top: none;
  padding-top: 0;
}

.insight-row strong,
.risk-card-header h4 {
  display: block;
  color: #0f172a;
  font-size: 0.95rem;
}

.insight-row small,
.risk-card-header p,
.risk-meta,
.insight-empty {
  color: #64748b;
  font-size: 0.82rem;
}

.insight-stats {
  display: grid;
  justify-items: end;
  gap: 0.2rem;
  text-align: right;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 600;
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
}

.risk-card {
  border: 1px solid #fecaca;
  background: linear-gradient(180deg, #fffefe 0%, #fff7f7 100%);
  border-radius: 16px;
  padding: 1rem;
}

.risk-card-header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}

.risk-card-header p {
  margin: 0.25rem 0 0;
}

.risk-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  font-size: 0.74rem;
  font-weight: 700;
}

.risk-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.9rem 0 0.65rem;
}

.risk-stats span,
.ai-highlight {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  padding: 0.45rem 0.75rem;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
}

.ai-analytics-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(17, 24, 39, 0.04);
}

.ai-chart-wrap {
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
}

.ai-kpi-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fcfcfd;
}

.ai-kpi-label {
  color: #4b5563;
  font-weight: 600;
}

.ai-kpi-value {
  color: #111827;
  font-weight: 700;
}

.ai-highlight {
  display: grid;
  gap: 0.2rem;
  margin: 1rem 0 1.15rem;
  border-radius: 16px;
  padding: 0.9rem 1rem;
}

.ai-highlight-label {
  color: #64748b;
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ai-highlight-value {
  color: #0f172a;
  font-size: 1.1rem;
  text-transform: capitalize;
}

.modal-shell--analytics {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: block;
  padding: 1.25rem;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(8px) saturate(0.92);
  -webkit-backdrop-filter: blur(8px) saturate(0.92);
}

.modal-panel--analytics {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(920px, calc(100vw - 2.5rem));
  max-height: calc(100vh - 2.5rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 28px 65px rgba(15, 23, 42, 0.22);
}

.modal-panel-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.25rem 1.25rem 0;
}

.modal-panel-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
}

.modal-panel-head p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.modal-close-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #dbe4ef;
  border-radius: 12px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
}

.modal-panel-body {
  padding: 1rem 1.25rem;
  overflow: auto;
  min-height: 0;
  flex: 1 1 auto;
}

.analytics-table-wrap {
  overflow: auto;
  max-height: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
}

.analytics-table {
  width: 100%;
  border-collapse: collapse;
}

.analytics-table th,
.analytics-table td {
  padding: 0.9rem 1rem;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
}

.analytics-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.analytics-table td {
  color: #0f172a;
  font-weight: 600;
}

.analytics-table-empty {
  text-align: center !important;
  color: #64748b !important;
  font-weight: 500 !important;
}

.analytics-table tbody tr:last-child td {
  border-bottom: none;
}

:global(body.admin-modal-open) {
  overflow: hidden;
}

.ai-examtype-pill {
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.activity-item {
  position: relative;
  border: 1px solid #e7ecf2;
  border-radius: 14px;
  background: #ffffff;
  padding: 1rem 1.05rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.activity-item:hover {
  transform: translateY(-2px);
  border-color: #cfd8e3;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.07);
}

.activity-content {
  display: flex !important;
  align-items: flex-start !important;
  gap: 0.95rem !important;
  width: 100%;
  min-width: 0;
}

.activity-icon {
  width: 48px !important;
  min-width: 48px !important;
  height: 48px !important;
  border-radius: 14px !important;
  background: linear-gradient(135deg, #111827, #334155) !important;
  color: #ffffff !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 48px !important;
  overflow: hidden;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12) !important;
}

.activity-icon i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  line-height: 1;
  color: #ffffff !important;
}

.activity-item:hover .activity-icon {
  background: linear-gradient(135deg, #e5e7eb, #f3f4f6);
  color: #111827;
  box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.08), 0 8px 20px rgba(15, 23, 42, 0.08);
}

.activity-item:hover .activity-icon i {
  color: #111827 !important;
}

.activity-details {
  flex: 1 1 auto;
  min-width: 0;
}

.activity-title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}

.activity-description {
  margin: 0.25rem 0 0;
  color: #4b5563;
  line-height: 1.45;
  font-size: 0.88rem;
}

.activity-time {
  margin-top: 0.7rem;
  padding-top: 0.65rem;
  border-top: 1px dashed #e5e7eb;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

@media (max-width: 768px) {
  :global(body.admin-dashboard) .analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 0.9rem !important;
  }

  :global(body.admin-dashboard) .analytics-grid > .analytics-card {
    min-width: 0 !important;
    padding: 0.75rem !important;
  }

  .analytics-board-grid {
    grid-template-columns: 1fr;
  }

  .insight-panel {
    grid-template-columns: 1fr;
  }

  .insight-panel .insight-block + .insight-block {
    margin-top: 1.25rem;
  }

  .analytics-section {
    padding: 1rem !important;
    border-radius: 16px !important;
  }

  .analytics-section-header {
    align-items: flex-start !important;
    margin-bottom: 1rem !important;
  }

  .analytics-section-heading {
    gap: 0.3rem;
  }

  .analytics-section-subtitle {
    font-size: 0.84rem;
    line-height: 1.45;
    max-width: none;
  }

  .section-title {
    font-size: 1.05rem !important;
    line-height: 1.3 !important;
  }

  .analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 0.9rem !important;
  }

  .analytics-card {
    min-height: 0 !important;
    aspect-ratio: 4 / 3 !important;
    padding: 0.75rem !important;
    border-radius: 14px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
  }

  .analytics-card-header {
    align-items: flex-start !important;
    gap: 0.5rem !important;
    margin-bottom: 0.65rem !important;
  }

  .analytics-icon {
    width: 34px !important;
    height: 34px !important;
    border-radius: 11px !important;
    font-size: 0.82rem !important;
  }

  .analytics-main {
    gap: 0.25rem !important;
  }

  .analytics-value {
    font-size: 1.4rem !important;
    letter-spacing: -0.05em !important;
  }

  .analytics-label {
    font-size: 0.64rem !important;
    line-height: 1.25 !important;
  }

  .analytics-footer {
    margin-top: 0.55rem !important;
    padding-top: 0.55rem !important;
    font-size: 0.64rem !important;
    line-height: 1.3 !important;
  }

  .analytics-footer span {
    gap: 0.35rem;
  }

  .funnel-metrics {
    grid-template-columns: 1fr;
  }

  .insight-row,
  .risk-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .insight-stats {
    justify-items: start;
    text-align: left;
  }

  .chart-wrap,
  .chart-wrap--lg,
  .chart-wrap--donut {
    min-height: 260px;
  }

  .activity-content {
    gap: 0.7rem !important;
  }

  .activity-icon {
    width: 38px !important;
    min-width: 38px !important;
    height: 38px !important;
    flex-basis: 38px !important;
    font-size: 0.9rem;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.1);
  }
}

@media (max-width: 480px) {
  :global(body.admin-dashboard) .analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 0.75rem !important;
  }

  :global(body.admin-dashboard) .analytics-grid > .analytics-card {
    min-height: clamp(138px, 42vw, 158px) !important;
    padding: 0.7rem !important;
  }

  .analytics-section {
    padding: 0.9rem !important;
  }

  .chart-wrap,
  .chart-wrap--lg,
  .chart-wrap--donut {
    min-height: 220px;
    padding: 0.6rem;
  }

  .analytics-grid {
    gap: 0.75rem !important;
  }

  .analytics-card {
    aspect-ratio: auto !important;
    min-height: clamp(138px, 42vw, 158px) !important;
    padding: 0.7rem !important;
    border-radius: 12px !important;
  }

  .analytics-value {
    font-size: 1.28rem !important;
  }

  .analytics-icon {
    width: 32px !important;
    height: 32px !important;
  }

}

</style>
