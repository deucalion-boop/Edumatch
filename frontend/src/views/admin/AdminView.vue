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
                <i class="fas fa-chart-line tw:inline:[margin-right:0.5rem] tw:inline:[color:var(--edu-blue,_#374151)]" ></i>
                Analytics & Platform Metrics
              </h3>
              <p class="analytics-section-subtitle">
                A quick snapshot of platform growth, active accounts, and publishing activity.
              </p>
            </div>
          </div>

          <div v-if="loadingAnalytics" class="activity-item tw:inline:[margin-bottom:0.75rem]" >
            <div class="activity-content">
              <div class="activity-details">
                <h4 class="activity-title">Loading analytics...</h4>
                <p class="activity-description">Fetching latest platform metrics from database.</p>
              </div>
            </div>
          </div>
          <div v-else-if="analyticsError" class="activity-item tw:inline:[margin-bottom:0.75rem]" >
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
            </div>
          </div>
        </section>

        <section class="analytics-board-grid">
          <article
            class="section-card chart-panel role-growth-panel tw:inline:[border:1px_solid_transparent]! tw:inline:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)_padding-box,_linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!"
          >
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

          <article
            class="section-card chart-panel learning-funnel-panel tw:inline:[border:1px_solid_transparent]! tw:inline:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)_padding-box,_linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!"
          >
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

          <article class="section-card insight-panel tw:inline:[border-color:#69aa47]!" >
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

        <section class="ai-analytics-section section-card tw:inline:[border-color:#69aa47]!" >
          <div class="section-header analytics-section-header">
            <div class="analytics-section-heading">
              <h3 class="section-title">
                <i class="fas fa-robot tw:inline:[margin-right:0.5rem] tw:inline:[color:var(--edu-teal,_#374151)]" ></i>
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
                <i class="fas fa-chart-area"></i> Difficulty Distribution
              </h4>
              <div class="chart-wrap chart-wrap--hexagon">
                <canvas ref="aiUsageCanvas" aria-label="AI exam difficulty hexagon chart"></canvas>
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

        <section class="section-card risk-section tw:inline:[border-color:#69aa47]!" >
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

        <footer>© 2026 EduMatch</footer>
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
      const [easy = 0, medium = 0, hard = 0] = aiMetrics.usageDistribution.values
      const hexagonValues = [easy, easy, medium, medium, hard, hard]
      const difficultyLabels = ['Easy', '', 'Medium', '', 'Hard', '']
      const tooltipLabels = ['Easy', 'Easy', 'Medium', 'Medium', 'Hard', 'Hard']

      aiUsageChart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: difficultyLabels,
          datasets: [
            {
              label: 'Generated assessments',
              data: hexagonValues,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: '#2563eb',
              borderWidth: 3,
              pointBackgroundColor: ['#3b82f6', '#3b82f6', '#14b8a6', '#14b8a6', '#f59e0b', '#f59e0b'],
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              angleLines: { color: 'rgba(100, 116, 139, 0.3)' },
              grid: { circular: false, color: 'rgba(148, 163, 184, 0.35)' },
              pointLabels: {
                color: '#334155',
                font: { size: 12, weight: '600' },
              },
              ticks: {
                display: false,
                precision: 0,
              },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => tooltipLabels[items[0]?.dataIndex] || '',
                label: (context) => `${context.dataset.label}: ${context.raw}`,
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
@reference "../../styles/tailwind.css";

@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

@import '../../styles/roles/admin.tailwind.css';


.ai-analytics-section {
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-radius:14px];
  @apply tw:[box-shadow:0_8px_24px_rgba(17,_24,_39,_0.05)];
}

.analytics-section {
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]!;
  @apply tw:[border:1px_solid_#e5e7eb]!;
  @apply tw:[border-radius:18px]!;
  @apply tw:[box-shadow:0_12px_30px_rgba(15,_23,_42,_0.06)]!;
}

.analytics-section--interactive {
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_border-color_0.2s_ease];
}

.analytics-section--interactive:hover,
.analytics-section--interactive:focus-visible {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[border-color:#bfdbfe]!;
  @apply tw:[box-shadow:0_18px_38px_rgba(59,_130,_246,_0.12)]!;
  @apply tw:[outline:none];
}

.admin-dashboard--modal-open .admin-header,
.admin-dashboard--modal-open .admin-sidebar,
.admin-dashboard--modal-open .sidebar-backdrop,
.admin-dashboard--modal-open .admin-main > :not(.modal-shell--analytics) {
  @apply tw:[filter:blur(8px)_saturate(0.95)];
  @apply tw:[transition:filter_0.2s_ease];
}

.analytics-section-header {
  @apply tw:flex!;
  @apply tw:items-end!;
  @apply tw:justify-between!;
  @apply tw:[gap:1rem]!;
  @apply tw:[margin-bottom:1.25rem]!;
}

.analytics-section-heading {
  @apply tw:grid;
  @apply tw:[gap:0.4rem];
}

.analytics-section-subtitle {
  @apply tw:[margin:0];
  @apply tw:[max-width:42rem];
  @apply tw:[color:#6b7280];
  @apply tw:[font-size:0.95rem];
  @apply tw:[line-height:1.5];
}

.analytics-grid {
  @apply tw:items-stretch;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(clamp(155px,_16vw,_175px),_1fr))]!;
  @apply tw:[gap:clamp(1rem,_1.5vw,_1.25rem)]!;
}

.analytics-card {
  @apply tw:[min-height:0]!;
  @apply tw:[aspect-ratio:4_/_3]!;
  @apply tw:[border-radius:clamp(12px,_1.2vw,_14px)]!;
  @apply tw:[padding:clamp(0.72rem,_1vw,_0.82rem)]!;
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.52)]!;
  @apply tw:[background:linear-gradient(180deg,_#fbfce9_0%,_#fbfce9_100%)]!;
  @apply tw:[box-shadow:0_10px_24px_rgba(15,_23,_42,_0.06)]!;
  @apply tw:flex!;
  @apply tw:flex-col!;
  @apply tw:justify-between!;
}

.analytics-card-header {
  @apply tw:flex!;
  @apply tw:justify-between!;
  @apply tw:items-start!;
  @apply tw:[gap:clamp(0.4rem,_0.7vw,_0.55rem)]!;
  @apply tw:[margin-bottom:clamp(0.45rem,_0.8vw,_0.6rem)]!;
}

.analytics-main {
  @apply tw:[gap:0.2rem]!;
}

.analytics-value {
  @apply tw:[font-size:clamp(1.4rem,_1.8vw,_1.8rem)]!;
  @apply tw:[line-height:1.05]!;
}

.analytics-label {
  @apply tw:[letter-spacing:0.07em]!;
  @apply tw:[font-size:clamp(0.59rem,_0.65vw,_0.64rem)]!;
  @apply tw:[line-height:1.25]!;
}

.analytics-icon {
  @apply tw:[width:clamp(32px,_3vw,_36px)]!;
  @apply tw:[height:clamp(32px,_3vw,_36px)]!;
  @apply tw:[border-radius:clamp(10px,_1vw,_12px)]!;
  @apply tw:[font-size:clamp(0.78rem,_0.9vw,_0.86rem)]!;
}

.analytics-card .trend-pill {
  @apply tw:[gap:0.25rem];
  @apply tw:[padding:clamp(0.22rem,_0.35vw,_0.28rem)_clamp(0.42rem,_0.6vw,_0.52rem)];
  @apply tw:[font-size:clamp(0.62rem,_0.7vw,_0.68rem)];
  @apply tw:[line-height:1.15];
}

/* Match the global dashboard selector so cards cannot overflow their tracks. */
:global(body.admin-dashboard) .analytics-grid {
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(clamp(155px,_16vw,_175px),_1fr))]!;
  @apply tw:[column-gap:clamp(1.25rem,_1.8vw,_1.5rem)]!;
  @apply tw:[row-gap:clamp(1.25rem,_1.8vw,_1.5rem)]!;
}

:global(body.admin-dashboard) .analytics-grid > .analytics-card {
  @apply tw:box-border!;
  @apply tw:w-auto!;
  @apply tw:[inline-size:auto]!;
  @apply tw:justify-self-stretch!;
  @apply tw:[min-width:0]!;
  @apply tw:max-w-full!;
  @apply tw:[min-height:0]!;
  @apply tw:[padding:clamp(0.72rem,_1vw,_0.82rem)]!;
}

.analytics-board-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:1rem];
  @apply tw:[margin:1rem_0];
}

.chart-panel,
.insight-panel,
.risk-section {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[box-shadow:0_12px_24px_rgba(15,_23,_42,_0.06)];
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) {
  @apply tw:[background:radial-gradient(circle_at_top_left,_rgba(59,_130,_246,_0.16),_transparent_38%),______radial-gradient(circle_at_bottom_right,_rgba(245,_158,_11,_0.14),_transparent_34%),______linear-gradient(180deg,_#ffffff_0%,_#f8fbff_52%,_#fff8ef_100%)];
  @apply tw:[border-color:#d9e7fb];
}

.panel-header {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:items-start;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1rem];
}

.panel-subtitle {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.92rem];
  @apply tw:[line-height:1.5];
}

.chart-wrap {
  @apply tw:relative;
  @apply tw:[min-height:280px];
  @apply tw:[padding:0.75rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#ffffff];
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) .chart-wrap {
  @apply tw:[background:linear-gradient(180deg,_rgba(255,_255,_255,_0.96)_0%,_rgba(239,_246,_255,_0.92)_100%)];
  @apply tw:[border-color:#d7e7fb];
}

.chart-wrap--lg {
  @apply tw:[min-height:320px];
}

.chart-wrap--hexagon {
  @apply tw:[min-height:320px];
}

.trend-badge-grid {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.65rem];
  @apply tw:[margin-top:1rem];
}

.trend-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[padding:0.35rem_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.02em];
}

.trend-pill--positive {
  @apply tw:[background:rgba(15,_118,_110,_0.12)];
  @apply tw:[color:#0f766e];
}

.trend-pill--negative {
  @apply tw:[background:rgba(220,_38,_38,_0.1)];
  @apply tw:[color:#b91c1c];
}

.trend-pill--neutral {
  @apply tw:[background:rgba(100,_116,_139,_0.14)];
  @apply tw:[color:#475569];
}

.funnel-metrics {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-top:1rem];
}

.funnel-metric {
  @apply tw:[padding:0.85rem_0.9rem];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[box-shadow:0_10px_20px_rgba(148,_163,_184,_0.08)];
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) .funnel-metric:nth-child(1) {
  @apply tw:[background:linear-gradient(135deg,_#dbeafe_0%,_#eff6ff_100%)];
  @apply tw:[border-color:#bfdbfe];
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) .funnel-metric:nth-child(2) {
  @apply tw:[background:linear-gradient(135deg,_#ccfbf1_0%,_#f0fdfa_100%)];
  @apply tw:[border-color:#99f6e4];
}

.chart-panel:has(canvas[aria-label="Learning completion funnel bar chart"]) .funnel-metric:nth-child(3) {
  @apply tw:[background:linear-gradient(135deg,_#fef3c7_0%,_#fff7ed_100%)];
  @apply tw:[border-color:#fcd34d];
}

.funnel-metric span {
  @apply tw:block;
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.06em];
}

.funnel-metric strong {
  @apply tw:block;
  @apply tw:[margin-top:0.35rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.15rem];
}

.insight-block + .insight-block {
  @apply tw:[margin-top:1.25rem];
}

.insight-panel {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[column-gap:1.5rem];
}

.insight-panel .panel-header {
  @apply tw:[grid-column:1_/_-1];
}

.insight-panel .insight-block + .insight-block {
  @apply tw:[margin-top:0];
}

.insight-title {
  @apply tw:[margin:0_0_0.8rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.95rem];
}

.insight-row {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:items-center;
  @apply tw:[padding:0.8rem_0];
  @apply tw:[border-top:1px_solid_#e2e8f0];
}

.insight-row:first-of-type {
  @apply tw:[border-top:none];
  @apply tw:[padding-top:0];
}

.insight-row strong,
.risk-card-header h4 {
  @apply tw:block;
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.95rem];
}

.insight-row small,
.risk-card-header p,
.risk-meta,
.insight-empty {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.82rem];
}

.insight-stats {
  @apply tw:grid;
  @apply tw:justify-items-end;
  @apply tw:[gap:0.2rem];
  @apply tw:text-right;
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:600];
}

.risk-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(220px,_1fr))];
  @apply tw:[gap:0.9rem];
}

.risk-card {
  @apply tw:[border:1px_solid_#fecaca];
  @apply tw:[background:linear-gradient(180deg,_#fffefe_0%,_#fff7f7_100%)];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:1rem];
}

.risk-card-header {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:items-start;
}

.risk-card-header p {
  @apply tw:[margin:0.25rem_0_0];
}

.risk-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[padding:0.35rem_0.65rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(239,_68,_68,_0.1)];
  @apply tw:[color:#b91c1c];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
}

.risk-stats {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.5rem];
  @apply tw:[margin:0.9rem_0_0.65rem];
}

.risk-stats span,
.ai-highlight {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.45rem_0.75rem];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:600];
}

.ai-analytics-card {
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-radius:12px];
  @apply tw:[box-shadow:0_6px_16px_rgba(17,_24,_39,_0.04)];
}

.ai-chart-wrap {
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f9fafb_100%)];
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-radius:10px];
  @apply tw:[padding:12px];
}

.ai-kpi-item {
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#fcfcfd];
}

.ai-kpi-label {
  @apply tw:[color:#4b5563];
  @apply tw:[font-weight:600];
}

.ai-kpi-value {
  @apply tw:[color:#111827];
  @apply tw:[font-weight:700];
}

.ai-highlight {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
  @apply tw:[margin:1rem_0_1.15rem];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.9rem_1rem];
}

.ai-highlight-label {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.74rem];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.ai-highlight-value {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.1rem];
  @apply tw:capitalize;
}

.modal-shell--analytics {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:1200];
  @apply tw:block;
  @apply tw:[padding:1.25rem];
  @apply tw:overflow-hidden;
  @apply tw:[background:rgba(15,_23,_42,_0.32)];
  @apply tw:[backdrop-filter:blur(8px)_saturate(0.92)];
  @apply tw:[-webkit-backdrop-filter:blur(8px)_saturate(0.92)];
}

.modal-panel--analytics {
  @apply tw:fixed;
  @apply tw:[top:50%];
  @apply tw:[left:50%];
  @apply tw:[transform:translate(-50%,_-50%)];
  @apply tw:[width:min(920px,_calc(100vw_-_2.5rem))];
  @apply tw:[max-height:calc(100vh_-_2.5rem)];
  @apply tw:overflow-hidden;
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[border-radius:22px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[border:1px_solid_rgba(226,_232,_240,_0.95)];
  @apply tw:[box-shadow:0_28px_65px_rgba(15,_23,_42,_0.22)];
}

.modal-panel-head {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:items-start;
  @apply tw:[padding:1.25rem_1.25rem_0];
}

.modal-panel-head h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.15rem];
}

.modal-panel-head p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.9rem];
}

.modal-close-btn {
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:cursor-pointer;
}

.modal-panel-body {
  @apply tw:[padding:1rem_1.25rem];
  @apply tw:overflow-auto;
  @apply tw:[min-height:0];
  @apply tw:flex-auto;
}

.analytics-table-wrap {
  @apply tw:overflow-auto;
  @apply tw:max-h-full;
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#ffffff];
}

.analytics-table {
  @apply tw:w-full;
  @apply tw:border-collapse;
}

.analytics-table th,
.analytics-table td {
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:text-left;
  @apply tw:[border-bottom:1px_solid_#edf2f7];
}

.analytics-table th {
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.8rem];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
}

.analytics-table td {
  @apply tw:[color:#0f172a];
  @apply tw:[font-weight:600];
}

.analytics-table-empty {
  @apply tw:text-center!;
  @apply tw:[color:#64748b]!;
  @apply tw:[font-weight:500]!;
}

.analytics-table tbody tr:last-child td {
  @apply tw:[border-bottom:none];
}

:global(body.admin-modal-open) {
  @apply tw:overflow-hidden;
}

.ai-examtype-pill {
  @apply tw:[border:1px_solid_#d1d5db];
  @apply tw:[background:#f9fafb];
  @apply tw:[color:#1f2937];
  @apply tw:[font-weight:600];
}

.activity-item {
  @apply tw:relative;
  @apply tw:[border:1px_solid_#e7ecf2];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:1rem_1.05rem];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_border-color_0.2s_ease,_background-color_0.2s_ease];
}

.activity-item:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[border-color:#cfd8e3];
  @apply tw:[box-shadow:0_10px_22px_rgba(15,_23,_42,_0.07)];
}

.activity-content {
  @apply tw:flex!;
  @apply tw:items-start!;
  @apply tw:[gap:0.95rem]!;
  @apply tw:w-full;
  @apply tw:[min-width:0];
}

.activity-icon {
  @apply tw:[width:48px]!;
  @apply tw:[min-width:48px]!;
  @apply tw:[height:48px]!;
  @apply tw:[border-radius:14px]!;
  @apply tw:[background:linear-gradient(135deg,_#111827,_#334155)]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:inline-flex!;
  @apply tw:items-center!;
  @apply tw:justify-center!;
  @apply tw:[flex:0_0_48px]!;
  @apply tw:overflow-hidden;
  @apply tw:[box-shadow:0_10px_22px_rgba(15,_23,_42,_0.12)]!;
}

.activity-icon i {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[font-size:1.05rem];
  @apply tw:[line-height:1];
  @apply tw:[color:#ffffff]!;
}

.activity-item:hover .activity-icon {
  @apply tw:[background:linear-gradient(135deg,_#e5e7eb,_#f3f4f6)];
  @apply tw:[color:#111827];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(17,_24,_39,_0.08),_0_8px_20px_rgba(15,_23,_42,_0.08)];
}

.activity-item:hover .activity-icon i {
  @apply tw:[color:#111827]!;
}

.activity-details {
  @apply tw:flex-auto;
  @apply tw:[min-width:0];
}

.activity-title {
  @apply tw:[margin:0];
  @apply tw:[font-size:0.98rem];
  @apply tw:[font-weight:700];
  @apply tw:[color:#111827];
  @apply tw:[letter-spacing:-0.01em];
}

.activity-description {
  @apply tw:[margin:0.25rem_0_0];
  @apply tw:[color:#4b5563];
  @apply tw:[line-height:1.45];
  @apply tw:[font-size:0.88rem];
}

.activity-time {
  @apply tw:[margin-top:0.7rem];
  @apply tw:[padding-top:0.65rem];
  @apply tw:[border-top:1px_dashed_#e5e7eb];
  @apply tw:[color:#6b7280];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:600];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
}

@media (max-width: 768px) {
  :global(body.admin-dashboard) .analytics-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))]!;
    @apply tw:[gap:0.9rem]!;
  }

  :global(body.admin-dashboard) .analytics-grid > .analytics-card {
    @apply tw:[min-width:0]!;
    @apply tw:[padding:0.75rem]!;
  }

  .analytics-board-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .insight-panel {
    @apply tw:[grid-template-columns:1fr];
  }

  .insight-panel .insight-block + .insight-block {
    @apply tw:[margin-top:1.25rem];
  }

  .analytics-section {
    @apply tw:[padding:1rem]!;
    @apply tw:[border-radius:16px]!;
  }

  .analytics-section-header {
    @apply tw:items-start!;
    @apply tw:[margin-bottom:1rem]!;
  }

  .analytics-section-heading {
    @apply tw:[gap:0.3rem];
  }

  .analytics-section-subtitle {
    @apply tw:[font-size:0.84rem];
    @apply tw:[line-height:1.45];
    @apply tw:max-w-none;
  }

  .section-title {
    @apply tw:[font-size:1.05rem]!;
    @apply tw:[line-height:1.3]!;
  }

  .analytics-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))]!;
    @apply tw:[gap:0.9rem]!;
  }

  .analytics-card {
    @apply tw:[min-height:0]!;
    @apply tw:[aspect-ratio:4_/_3]!;
    @apply tw:[padding:0.75rem]!;
    @apply tw:[border-radius:14px]!;
    @apply tw:flex!;
    @apply tw:flex-col!;
    @apply tw:justify-between!;
  }

  .analytics-card-header {
    @apply tw:items-start!;
    @apply tw:[gap:0.5rem]!;
    @apply tw:[margin-bottom:0.65rem]!;
  }

  .analytics-icon {
    @apply tw:[width:34px]!;
    @apply tw:[height:34px]!;
    @apply tw:[border-radius:11px]!;
    @apply tw:[font-size:0.82rem]!;
  }

  .analytics-main {
    @apply tw:[gap:0.25rem]!;
  }

  .analytics-value {
    @apply tw:[font-size:1.4rem]!;
    @apply tw:[letter-spacing:-0.05em]!;
  }

  .analytics-label {
    @apply tw:[font-size:0.64rem]!;
    @apply tw:[line-height:1.25]!;
  }

  .funnel-metrics {
    @apply tw:[grid-template-columns:1fr];
  }

  .insight-row,
  .risk-card-header {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .insight-stats {
    @apply tw:justify-items-start;
    @apply tw:text-left;
  }

  .chart-wrap,
  .chart-wrap--lg,
  .chart-wrap--hexagon {
    @apply tw:[min-height:260px];
  }

  .activity-content {
    @apply tw:[gap:0.7rem]!;
  }

  .activity-icon {
    @apply tw:[width:38px]!;
    @apply tw:[min-width:38px]!;
    @apply tw:[height:38px]!;
    @apply tw:[flex-basis:38px]!;
    @apply tw:[font-size:0.9rem];
    @apply tw:[border-radius:12px];
    @apply tw:[box-shadow:0_8px_16px_rgba(15,_23,_42,_0.1)];
  }
}

@media (max-width: 480px) {
  :global(body.admin-dashboard) .analytics-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))]!;
    @apply tw:[gap:0.75rem]!;
  }

  :global(body.admin-dashboard) .analytics-grid > .analytics-card {
    @apply tw:[min-height:clamp(138px,_42vw,_158px)]!;
    @apply tw:[padding:0.7rem]!;
  }

  .analytics-section {
    @apply tw:[padding:0.9rem]!;
  }

  .chart-wrap,
  .chart-wrap--lg,
  .chart-wrap--hexagon {
    @apply tw:[min-height:220px];
    @apply tw:[padding:0.6rem];
  }

  .analytics-grid {
    @apply tw:[gap:0.75rem]!;
  }

  .analytics-card {
    @apply tw:[aspect-ratio:auto]!;
    @apply tw:[min-height:clamp(138px,_42vw,_158px)]!;
    @apply tw:[padding:0.7rem]!;
    @apply tw:[border-radius:12px]!;
  }

  .analytics-value {
    @apply tw:[font-size:1.28rem]!;
  }

  .analytics-icon {
    @apply tw:[width:32px]!;
    @apply tw:[height:32px]!;
  }

}


</style>
