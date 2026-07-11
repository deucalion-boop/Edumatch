<template>
  <div class="teacher-dashboard headteacher-dashboard-page">
    <aside id="headteacher-sidebar-drawer" class="teacher-sidebar" :class="{ active: isSidebarOpen }">
      <div class="sidebar-header">
        <div class="teacher-logo">
          <div class="teacher-logo-icon">
            <img src="/logo.png" alt="EduMatch" class="teacher-logo-img">
          </div>
          <div class="teacher-logo-text">
            <h2>EduMatch</h2>
            <p>Head Teacher Portal</p>
          </div>
        </div>
        <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <h4 class="nav-section-title">Workspace</h4>
          <router-link to="/headteacher/dashboard" class="nav-link" :class="{ active: route.path === '/headteacher/dashboard' }" @click="closeSidebar">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/headteacher/management" class="nav-link" :class="{ active: route.path === '/headteacher/management' }" @click="closeSidebar">
            <i class="fas fa-users-cog"></i>
            <span>Teacher Management</span>
          </router-link>
          <router-link to="/headteacher/lessons" class="nav-link" :class="{ active: route.path === '/headteacher/lessons' }" @click="closeSidebar">
            <i class="fas fa-book-open"></i>
            <span>Lessons & Exams</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="teacher-profile">
          <div class="teacher-avatar">
            <img :src="avatarUrl" :alt="displayName" />
          </div>
          <div class="teacher-info">
            <h5>{{ displayName }}</h5>
            <p class="teacher-role">HeadTeacher</p>
            <p class="teacher-strand">{{ departmentLabel }}</p>
            <div class="teacher-status">
              <span class="status-indicator active"></span>
              <span>Department lead</span>
            </div>
            <div class="headteacher-sidebar-chip">Management Access</div>
          </div>
        </div>
      </div>
    </aside>

    <button v-if="isSidebarOpen" type="button" class="sidebar-backdrop" @click="closeSidebar" aria-label="Close sidebar"></button>

    <main class="teacher-main headteacher-main dashboard-container">
      <header class="top-header headteacher-top-header dashboard-header">
        <div class="header-content headteacher-header-content dashboard-header-content">
          <div class="header-left headteacher-header-copy dashboard-header-copy">
            <button type="button" class="mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar">
              <i class="fas fa-bars"></i>
            </button>
            <div class="headteacher-dashboard-header-copy">
              <h1>{{ departmentLabel }} Department</h1>
              <p class="header-subtitle">Create, monitor, and manage teachers under your department with a unified administrative view.</p>
            </div>
          </div>

          <div class="headteacher-header-tools">
            <div ref="accountMenuRef" class="account-menu">
              <button
                type="button"
                class="header-tour-btn account-menu-trigger"
                aria-label="Settings menu"
                title="Settings"
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
      </header>

      <section class="section-card dashboard-panel headteacher-stat-section">
        <div class="headteacher-stat-grid stat-cards">
          <article class="headteacher-stat-card">
            <div class="headteacher-stat-icon teachers">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="headteacher-stat-copy">
              <span class="headteacher-stat-label">Total Teachers in Department</span>
              <strong class="headteacher-stat-value">{{ summary.totalTeachers }}</strong>
              <small class="headteacher-stat-note">Faculty members under your supervision</small>
            </div>
          </article>

          <article class="headteacher-stat-card">
            <div class="headteacher-stat-icon active">
              <i class="fas fa-user-check"></i>
            </div>
            <div class="headteacher-stat-copy">
              <span class="headteacher-stat-label">Total Active Teachers</span>
              <strong class="headteacher-stat-value">{{ summary.activeTeachers }}</strong>
              <small class="headteacher-stat-note">Currently available and active</small>
            </div>
          </article>

          <article class="headteacher-stat-card">
            <div class="headteacher-stat-icon students">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="headteacher-stat-copy">
              <span class="headteacher-stat-label">Total Students Under Department</span>
              <strong class="headteacher-stat-value">{{ summary.totalStudents }}</strong>
              <small class="headteacher-stat-note">Students invited by your department teachers</small>
            </div>
          </article>

          <article class="headteacher-stat-card">
            <div class="headteacher-stat-icon lessons">
              <i class="fas fa-book-open"></i>
            </div>
            <div class="headteacher-stat-copy">
              <span class="headteacher-stat-label">Total Assessments or Lessons</span>
              <strong class="headteacher-stat-value">{{ summary.totalLessonsAndAssessments }}</strong>
              <small class="headteacher-stat-note">{{ summary.totalLessons }} lessons and {{ summary.totalAssessments }} assessments</small>
            </div>
          </article>
        </div>
      </section>

      <section class="section-card dashboard-panel headteacher-radial-section">
        <div class="headteacher-section-head">
          <div>
            <h2 class="section-title">Content Mix Overview</h2>
            <p class="toolbar-subtitle">Visual share of lesson and activity or assessment creation in your department.</p>
          </div>
        </div>

        <div class="headteacher-radial-grid">
          <article class="headteacher-radial-card">
            <div
              class="headteacher-radial-chart lessons"
              :style="{ '--progress-value': `${lessonAnalyticsPercent}%` }"
              aria-label="Lesson share analytics"
            >
              <div class="headteacher-radial-center">
                <strong>{{ lessonAnalyticsPercent }}%</strong>
                <span>Lessons</span>
              </div>
            </div>
            <div class="headteacher-radial-copy">
              <h3>Lesson Share</h3>
              <p>{{ summary.totalLessons }} lesson{{ summary.totalLessons === 1 ? '' : 's' }} created by teachers in your department.</p>
            </div>
          </article>

          <article class="headteacher-radial-card">
            <div
              class="headteacher-radial-chart assessments"
              :style="{ '--progress-value': `${assessmentAnalyticsPercent}%` }"
              aria-label="Assessment share analytics"
            >
              <div class="headteacher-radial-center">
                <strong>{{ assessmentAnalyticsPercent }}%</strong>
                <span>Assessments</span>
              </div>
            </div>
            <div class="headteacher-radial-copy">
              <h3>Activity / Assessment Share</h3>
              <p>{{ summary.totalAssessments }} activit{{ summary.totalAssessments === 1 ? 'y' : 'ies' }} or assessments created by teachers in your department.</p>
            </div>
          </article>
        </div>
      </section>

      <section class="section-card dashboard-panel headteacher-analytics-panel">
        <div class="headteacher-section-head headteacher-analytics-head">
          <div class="headteacher-analytics-copy">
            <span class="headteacher-analytics-kicker">Performance Trend</span>
            <h2 class="section-title">Content Creation Analytics</h2>
            <p class="toolbar-subtitle">Monthly creation trend for lessons and activities or assessments from teachers in your department.</p>
            <div class="headteacher-analytics-highlights">
              <div class="headteacher-highlight-pill">
                <span>Peak Period</span>
                <strong>{{ analyticsPeakPeriodLabel }}</strong>
              </div>
              <div class="headteacher-highlight-pill">
                <span>Assessments In Range</span>
                <strong>{{ analyticsAssessmentsInRange }}</strong>
              </div>
            </div>
          </div>
          <div class="headteacher-analytics-actions">
            <label class="headteacher-analytics-filter">
              <span>Range</span>
              <select v-model="lessonAnalyticsFilter" @change="fetchTeachers">
                <option value="1">Today</option>
                <option value="3">Last 3 months</option>
                <option value="12">Last 12 months</option>
              </select>
            </label>
          </div>
        </div>

        <div class="headteacher-chart-shell">
          <canvas ref="lessonTrendCanvas" aria-label="Lesson creation analytics chart"></canvas>
        </div>
        <div class="headteacher-analytics-legend">
          <div class="headteacher-legend-item">
            <span class="headteacher-legend-swatch lessons"></span>
            <strong>Lessons</strong>
            <small>{{ analyticsLessonsInRange }} in range</small>
          </div>
          <div class="headteacher-legend-item">
            <span class="headteacher-legend-swatch assessments"></span>
            <strong>Activities/Assessments</strong>
            <small>{{ analyticsAssessmentsInRange }} in range</small>
          </div>
        </div>
        <p class="headteacher-chart-caption">{{ analyticsContentCaption }}</p>
      </section>

      <div v-if="isCreateModalOpen" class="modal-shell" @click.self="closeModal">
        <div class="modal-panel">
          <div class="modal-panel-head">
            <div>
              <h3>Create Teacher Account</h3>
              <p>Teachers created here are assigned to {{ departmentLabel }}.</p>
            </div>
            <button type="button" class="modal-close-btn" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form class="headteacher-form" @submit.prevent="createTeacher">
            <div class="headteacher-form-grid">
              <label class="headteacher-form-group">
                <span>Full Name</span>
                <input v-model.trim="form.name" type="text" required placeholder="Enter teacher name">
              </label>
              <label class="headteacher-form-group">
                <span>Email</span>
                <input v-model.trim="form.email" type="email" required placeholder="Enter teacher email">
              </label>
              <label class="headteacher-form-group">
                <span>Username</span>
                <input v-model.trim="form.username" type="text" required placeholder="Enter teacher username">
              </label>
              <label class="headteacher-form-group">
                <span>Department</span>
                <input :value="departmentLabel" type="text" readonly>
              </label>
              <label class="headteacher-form-group">
                <span>Contact Number</span>
                <input v-model.trim="form.contactNumber" type="text" placeholder="Optional contact number">
              </label>
            </div>

            <p v-if="formMessage" class="headteacher-form-feedback" :class="formMessageType">{{ formMessage }}</p>

            <div class="modal-panel-actions">
              <button type="button" class="btn btn-outline" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <i class="fas" :class="isSubmitting ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                {{ isSubmitting ? 'Saving...' : 'Create Teacher & Email Credentials' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Chart from 'chart.js/auto'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isCreateModalOpen = ref(false)
const formMessage = ref('')
const formMessageType = ref('success')
const teachers = ref([])
const currentPage = ref(1)
const pageSize = ref(6)
const accountMenuRef = ref(null)
const lessonTrendCanvas = ref(null)
let lessonTrendChart = null
const lessonAnalyticsFilter = ref('3')
const summary = reactive({
  totalTeachers: 0,
  activeTeachers: 0,
  totalStudents: 0,
  totalLessonsAndAssessments: 0,
  totalLessons: 0,
  totalAssessments: 0,
})
const lessonAnalytics = reactive({
  labels: [],
  values: [],
})
const assessmentAnalytics = reactive({
  labels: [],
  values: [],
})

const buildFallbackLessonLabels = (monthCount) => {
  const totalMonths = Number.parseInt(monthCount, 10) || 3
  const labels = []
  const current = new Date()
  current.setDate(1)

  if (totalMonths === 1) {
    return [new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })]
  }

  for (let index = totalMonths - 1; index >= 0; index -= 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1)
    labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
  }

  return labels
}

const analyticsLessonsInRange = computed(() => lessonAnalytics.values.reduce((sum, value) => sum + Number(value || 0), 0))
const analyticsPeak = computed(() => {
  if (lessonAnalytics.values.length === 0) {
    return { label: 'No activity', value: 0 }
  }

  let peakIndex = 0
  let peakValue = Number(lessonAnalytics.values[0] || 0)

  lessonAnalytics.values.forEach((value, index) => {
    const numericValue = Number(value || 0)
    if (numericValue >= peakValue) {
      peakValue = numericValue
      peakIndex = index
    }
  })

  return {
    label: lessonAnalytics.labels[peakIndex] || 'No activity',
    value: peakValue,
  }
})
const analyticsPeakLabel = computed(() => {
  if (analyticsPeak.value.value === 0) return 'No activity'
  return `${analyticsPeak.value.label} · ${analyticsPeak.value.value}`
})
const analyticsAverageLabel = computed(() => {
  if (lessonAnalytics.values.length === 0) return '0 / period'
  const average = analyticsLessonsInRange.value / lessonAnalytics.values.length
  return `${average.toFixed(1)} / period`
})
const analyticsCaption = computed(() => {
  const latestValue = Number(lessonAnalytics.values[lessonAnalytics.values.length - 1] || 0)
  if (analyticsLessonsInRange.value === 0) return 'No lesson creation recorded in the selected period.'
  return `${analyticsLessonsInRange.value} lesson${analyticsLessonsInRange.value === 1 ? '' : 's'} recorded across the selected period, with ${latestValue} in the latest month.`
})

const analyticsAssessmentsInRange = computed(() => assessmentAnalytics.values.reduce((sum, value) => sum + Number(value || 0), 0))
const analyticsContentInRange = computed(() => analyticsLessonsInRange.value + analyticsAssessmentsInRange.value)
const lessonAnalyticsPercent = computed(() => {
  return Math.min(100, Math.max(0, Number(summary.totalLessons || 0)))
})
const assessmentAnalyticsPercent = computed(() => {
  return Math.min(100, Math.max(0, Number(summary.totalAssessments || 0)))
})
const analyticsPeakPeriodLabel = computed(() => {
  if (lessonAnalytics.labels.length === 0) return 'No activity'

  let peakLabel = lessonAnalytics.labels[0] || 'No activity'
  let peakValue = Number(lessonAnalytics.values[0] || 0) + Number(assessmentAnalytics.values[0] || 0)

  lessonAnalytics.labels.forEach((label, index) => {
    const totalValue = Number(lessonAnalytics.values[index] || 0) + Number(assessmentAnalytics.values[index] || 0)
    if (totalValue >= peakValue) {
      peakValue = totalValue
      peakLabel = label
    }
  })

  if (peakValue === 0) return 'No activity'
  return `${peakLabel} - ${peakValue}`
})
const analyticsContentCaption = computed(() => {
  const latestLessons = Number(lessonAnalytics.values[lessonAnalytics.values.length - 1] || 0)
  const latestAssessments = Number(assessmentAnalytics.values[assessmentAnalytics.values.length - 1] || 0)
  if (analyticsContentInRange.value === 0) return 'No lesson or assessment creation recorded in the selected period.'
  return `${analyticsLessonsInRange.value} lessons and ${analyticsAssessmentsInRange.value} activities or assessments were created across the selected period, with ${latestLessons + latestAssessments} in the latest month.`
})

const normalizeLessonAnalytics = (labels, values, totalLessons) => {
  const normalizedLabels = labels.length > 0 ? labels : buildFallbackLessonLabels(lessonAnalyticsFilter.value)
  const safeValues = values.length === normalizedLabels.length
    ? values.map((value) => Number(value || 0))
    : new Array(normalizedLabels.length).fill(0)

  if (safeValues.every((value) => value === 0) && Number(totalLessons || 0) > 0 && safeValues.length > 0) {
    safeValues[safeValues.length - 1] = Number(totalLessons || 0)
  }

  return {
    labels: normalizedLabels,
    values: safeValues,
  }
}
const filters = reactive({
  search: '',
  status: 'all',
  sort: 'newest',
})
const form = reactive({
  name: '',
  email: '',
  username: '',
  contactNumber: '',
})

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

const displayName = computed(() => authStore.user?.name || 'HeadTeacher')
const departmentLabel = computed(() => authStore.user?.department || 'Department')
const avatarUrl = computed(() => {
  const profileImage = String(authStore.user?.profileImage || '').trim()
  if (profileImage) return profileImage
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=334155&color=fff`
})

const normalizeStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (['active', 'inactive', 'pending', 'suspended'].includes(normalized)) return normalized
  return 'inactive'
}

const formatStatus = (status) => {
  const normalized = normalizeStatus(status)
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

const filteredTeachers = computed(() => {
  const searchValue = String(filters.search || '').trim().toLowerCase()
  const filtered = teachers.value.filter((teacher) => {
    const matchesSearch = !searchValue || [
      teacher.name,
      teacher.email,
      teacher.department,
      teacher.subject,
    ].some((value) => String(value || '').toLowerCase().includes(searchValue))

    const matchesStatus = filters.status === 'all'
      ? true
      : normalizeStatus(teacher.status) === filters.status

    return matchesSearch && matchesStatus
  })

  return [...filtered].sort((left, right) => {
    if (filters.sort === 'oldest') return new Date(left.createdAt || 0) - new Date(right.createdAt || 0)
    if (filters.sort === 'name-asc') return String(left.name || '').localeCompare(String(right.name || ''))
    if (filters.sort === 'name-desc') return String(right.name || '').localeCompare(String(left.name || ''))
    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTeachers.value.length / pageSize.value)))
const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTeachers.value.slice(start, start + pageSize.value)
})
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

watch(totalPages, (value) => {
  if (currentPage.value > value) currentPage.value = value
})

const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }
const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }

const resetForm = () => {
  form.name = ''
  form.email = ''
  form.username = ''
  form.contactNumber = ''
  formMessage.value = ''
  formMessageType.value = 'success'
}

const closeModal = () => {
  if (isSubmitting.value) return
  isCreateModalOpen.value = false
  resetForm()
}

const handleLogout = () => {
  isAccountMenuOpen.value = false
  authStore.logout()
  router.push('/auth/login')
}

const goToProfile = () => {
  isAccountMenuOpen.value = false
  router.push('/headteacher/profile')
}

const goToSettings = () => {
  isAccountMenuOpen.value = false
  router.push('/headteacher/settings')
}

const handleAccountMenuClickOutside = (event) => {
  const target = event?.target
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  isAccountMenuOpen.value = false
}

const goToPage = (page) => {
  currentPage.value = page
}

const goToPreviousPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

const createLessonTrendChart = () => {
  if (!lessonTrendCanvas.value) return

  const ctx = lessonTrendCanvas.value.getContext('2d')
  if (!ctx) return

  if (lessonTrendChart) {
    lessonTrendChart.destroy()
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 320)
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.22)')
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)')

  lessonTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [...lessonAnalytics.labels],
      datasets: [
        {
          label: 'Lessons created',
          data: [...lessonAnalytics.values],
          borderColor: '#2563eb',
          backgroundColor: gradient,
          fill: true,
          borderWidth: 3,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#2563eb',
          pointBorderWidth: 2,
        },
        {
          label: 'Activities/Assessments created',
          data: [...assessmentAnalytics.values],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.08)',
          fill: false,
          borderWidth: 3,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#8b5cf6',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          displayColors: false,
          padding: 12,
          callbacks: {
            label(context) {
              const value = Number(context.parsed.y || 0)
              const datasetLabel = context.dataset?.label || 'Created'
              return `${datasetLabel}: ${value}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 12,
              weight: 500,
            },
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: '#64748b',
            font: {
              size: 12,
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.14)',
          },
          border: {
            display: false,
          },
        },
      },
    },
  })
}

const updateLessonTrendChart = () => {
  if (!lessonTrendCanvas.value) return
  if (!lessonTrendChart) {
    createLessonTrendChart()
    return
  }

  lessonTrendChart.data.labels = [...lessonAnalytics.labels]
  lessonTrendChart.data.datasets[0].data = [...lessonAnalytics.values]
  lessonTrendChart.data.datasets[1].data = [...assessmentAnalytics.values]
  lessonTrendChart.update()
}

const fetchTeachers = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/headteacher/teachers`, {
      ...getAuthConfig(),
      params: {
        months: lessonAnalyticsFilter.value,
      },
    })
    const payload = Array.isArray(response.data?.teachers) ? response.data.teachers : []
    const responseSummary = response.data?.summary || {}

    teachers.value = payload.map((teacher) => ({
      id: teacher.id || teacher._id,
      name: teacher.name,
      email: teacher.email,
      department: teacher.department || departmentLabel.value,
      subject: teacher.subject || teacher.department || departmentLabel.value,
      status: normalizeStatus(teacher.status || 'active'),
      createdAt: teacher.createdAt || null,
      avatar: teacher.avatar || teacher.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name || 'Teacher')}&background=334155&color=fff`,
    }))

    summary.totalTeachers = Number(responseSummary.totalTeachers || teachers.value.length)
    summary.activeTeachers = Number(responseSummary.activeTeachers || teachers.value.filter((teacher) => teacher.status === 'active').length)
    summary.totalStudents = Number(responseSummary.totalStudents || 0)
    summary.totalLessonsAndAssessments = Number(responseSummary.totalLessonsAndAssessments || 0)
    summary.totalLessons = Number(responseSummary.totalLessons || 0)
    summary.totalAssessments = Number(responseSummary.totalAssessments || 0)
    const labels = Array.isArray(responseSummary.lessonAnalytics?.labels) ? responseSummary.lessonAnalytics.labels : []
    const values = Array.isArray(responseSummary.lessonAnalytics?.values) ? responseSummary.lessonAnalytics.values : []
    const assessmentLabels = Array.isArray(responseSummary.assessmentAnalytics?.labels) ? responseSummary.assessmentAnalytics.labels : []
    const assessmentValues = Array.isArray(responseSummary.assessmentAnalytics?.values) ? responseSummary.assessmentAnalytics.values : []
    const normalizedAnalytics = normalizeLessonAnalytics(labels, values, summary.totalLessons)
    const normalizedAssessmentAnalytics = normalizeLessonAnalytics(assessmentLabels, assessmentValues, summary.totalAssessments)
    lessonAnalytics.labels = normalizedAnalytics.labels
    lessonAnalytics.values = normalizedAnalytics.values
    assessmentAnalytics.labels = normalizedAssessmentAnalytics.labels
    assessmentAnalytics.values = normalizedAssessmentAnalytics.values
    updateLessonTrendChart()
  } finally {
    isLoading.value = false
  }
}

const createTeacher = async () => {
  isSubmitting.value = true
  formMessage.value = ''
  try {
    const response = await axios.post(`${resolveApiBaseUrl()}/headteacher/teachers`, {
      name: form.name,
      email: form.email,
      username: form.username,
      subject: departmentLabel.value,
      contactNumber: form.contactNumber,
    }, getAuthConfig())

    const generatedPassword = String(response.data?.invite?.generatedPassword || '').trim()
    const emailSent = response.data?.invite?.emailSent !== false
    formMessage.value = generatedPassword
      ? `${emailSent ? 'Teacher account created and emailed successfully.' : 'Teacher account created, but email sending failed.'} Temporary password: ${generatedPassword}`
      : 'Teacher account created successfully.'
    formMessageType.value = emailSent ? 'success' : 'error'
    await fetchTeachers()
    window.setTimeout(() => {
      closeModal()
    }, 400)
  } catch (error) {
    formMessage.value = error.response?.data?.message || 'Failed to create teacher account.'
    formMessageType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

const updateStatus = async (teacher, status) => {
  await axios.put(`${resolveApiBaseUrl()}/headteacher/teachers/${encodeURIComponent(teacher.id)}`, {
    status,
    subject: teacher.subject || departmentLabel.value,
  }, getAuthConfig())
  await fetchTeachers()
}

onMounted(() => {
  document.addEventListener('click', handleAccountMenuClickOutside)
  createLessonTrendChart()
  fetchTeachers()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountMenuClickOutside)
  if (lessonTrendChart) {
    lessonTrendChart.destroy()
    lessonTrendChart = null
  }
})
</script>

<style scoped>
.teacher-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
</style>
