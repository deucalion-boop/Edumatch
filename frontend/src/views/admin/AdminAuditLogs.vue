<template>
  <div class="admin-dashboard admin-audit-logs-page">
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
              <span class="page-title">Audit Logs</span>
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
        <div class="page-header fade-in">
          <div class="header-left">
            <h2>Audit Logs</h2>
            <p>Track system actions across admin, teacher, student, secretary, head teacher, and authentication workflows from one place.</p>
            <div class="audit-live-status">
              <span class="audit-live-pill" :class="{ 'audit-live-pill--syncing': isAutoRefreshing }">
                <i :class="isAutoRefreshing ? 'fas fa-satellite-dish fa-spin' : 'fas fa-circle'"></i>
                {{ isAutoRefreshing ? 'Live syncing' : 'Live' }}
              </span>
              <span class="audit-live-caption">
                {{ lastUpdatedLabel }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button type="button" class="btn btn-outline" @click="resetFilters" :disabled="loading">
              <i class="fas fa-rotate-left"></i>
              Reset
            </button>
            <button
              type="button"
              class="btn btn-primary"
              style="background: #000000 !important; background-image: none !important; border-color: #000000 !important; color: #ffffff !important; box-shadow: none !important;"
              @click="applyFiltersAndFetch"
              :disabled="loading"
            >
              <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-rotate-right'"></i>
              {{ loading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <section class="user-filters section-card fade-in">
          <form class="filter-row audit-filter-row" @submit.prevent="applyFiltersAndFetch">
            <div class="filter-group audit-filter-group audit-filter-group--search">
              <label for="auditSearch"><i class="fas fa-search"></i> Search</label>
              <input
                id="auditSearch"
                v-model.trim="filters.search"
                type="text"
                class="form-control audit-search"
                placeholder="Search actor, action, module, target, or IP"
              />
            </div>

            <div class="filter-group">
              <label for="auditCategory"><i class="fas fa-layer-group"></i> Module</label>
              <select id="auditCategory" v-model="filters.category" class="filter-select">
                <option value="all">All Modules</option>
                <option v-for="category in availableCategories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label for="auditRole"><i class="fas fa-user-tag"></i> Role</label>
              <select id="auditRole" v-model="filters.role" class="filter-select">
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="secretary">Secretary</option>
                <option value="headteacher">Head Teacher</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="auditMethod"><i class="fas fa-code-branch"></i> Method</label>
              <select id="auditMethod" v-model="filters.method" class="filter-select">
                <option value="ALL">All Methods</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="auditResult"><i class="fas fa-circle-check"></i> Result</label>
              <select id="auditResult" v-model="filters.result" class="filter-select">
                <option value="all">All Results</option>
                <option value="success">Successful Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>

            <button type="submit" class="btn btn-outline" :disabled="loading">
              <i class="fas fa-filter"></i>
              Apply
            </button>
          </form>
        </section>

        <section class="users-table-section section-card">
          <div class="table-header">
            <div class="table-info">
              <h3>System Activity Timeline</h3>
            </div>
          </div>

          <div v-if="loading" class="audit-empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading audit logs...</span>
          </div>

          <div v-else-if="errorMessage" class="audit-empty-state audit-empty-state--error">
            <i class="fas fa-circle-exclamation"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <div v-else-if="logs.length === 0" class="audit-empty-state">
            <i class="fas fa-folder-open"></i>
            <span>No audit log entries match the current filters yet.</span>
          </div>

          <div v-else class="table-responsive">
            <table class="users-table audit-logs-table">
              <thead>
                <tr>
                  <th class="time-col">Time</th>
                  <th class="actor-col">Actor</th>
                  <th class="module-col">Module</th>
                  <th class="action-col">Action</th>
                  <th class="result-col">Result</th>
                  <th class="endpoint-col">Activity Source</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in logs" :key="log.id">
                  <td class="time-col">
                    <div class="audit-time">
                      <strong>{{ formatDateTime(log.createdAt) }}</strong>
                      <span>{{ formatRelativeTime(log.createdAt) }}</span>
                    </div>
                  </td>
                  <td class="actor-col">
                    <div class="audit-actor">
                      <strong>{{ log.actorName || log.actorIdentifier || 'System actor' }}</strong>
                      <span>{{ actorSubtitle(log) }}</span>
                      <small>{{ formatRoleLabel(log.actorRole) }}</small>
                    </div>
                  </td>
                  <td class="module-col">
                    <span class="audit-category-badge">
                      {{ log.category || 'System' }}
                    </span>
                  </td>
                  <td class="action-col">
                    <div class="audit-action">
                      <strong>{{ log.actionLabel || 'System action' }}</strong>
                      <span v-if="log.targetLabel">{{ log.targetLabel }}</span>
                      <small>
                        <span v-if="log.durationMs > 0">{{ formatNumber(log.durationMs) }} ms</span>
                        <span v-if="log.ipAddress">IP: {{ log.ipAddress }}</span>
                      </small>
                    </div>
                  </td>
                  <td class="result-col">
                    <span class="audit-result-badge" :class="log.succeeded ? 'audit-result-badge--success' : 'audit-result-badge--failed'">
                      <i :class="log.succeeded ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                      {{ log.succeeded ? 'Success' : 'Failed' }}
                      <strong>{{ log.statusCode || '---' }}</strong>
                    </span>
                  </td>
                  <td class="endpoint-col">
                    <div class="audit-endpoint">
                      <span class="audit-method-badge" :class="methodBadgeClass(log.method)">{{ log.method || 'POST' }}</span>
                      <strong>{{ formatRequestSource(log) }}</strong>
                      <small>{{ formatUserAgent(log.userAgent) }}</small>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="pagination.totalItems > 0" class="pagination">
            <div class="pagination-info">
              {{ paginationSummaryLabel }}
            </div>
            <div v-if="pagination.totalPages > 1" class="pagination-controls">
              <button class="pagination-btn prev" @click="goToPreviousPage" :disabled="!pagination.hasPreviousPage || loading">
                <i class="fas fa-chevron-left"></i>
                Previous
              </button>

              <div class="pagination-numbers">
                <template v-for="item in paginationItems" :key="item.key">
                  <span v-if="item.type === 'ellipsis'" class="pagination-ellipsis">...</span>
                  <button
                    v-else
                    class="pagination-number"
                    :class="{ active: item.value === pagination.page }"
                    @click="goToPage(item.value)"
                  >
                    {{ item.value }}
                  </button>
                </template>
              </div>

              <button class="pagination-btn next" @click="goToNextPage" :disabled="!pagination.hasNextPage || loading">
                Next
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const SIDEBAR_BREAKPOINT = 1024
const AUTO_REFRESH_SECONDS = 5
const AUTO_REFRESH_INTERVAL_MS = AUTO_REFRESH_SECONDS * 1000
const PAGE_SIZE = 50

const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const loading = ref(false)
const isAutoRefreshing = ref(false)
const errorMessage = ref('')
const logs = ref([])
const availableCategories = ref([])
const lastUpdatedAt = ref('')

const filters = reactive({
  search: '',
  category: 'all',
  role: 'all',
  method: 'ALL',
  result: 'all',
})

const activeFilters = reactive({
  search: '',
  category: 'all',
  role: 'all',
  method: 'ALL',
  result: 'all',
})

const pagination = reactive({
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
})

let autoRefreshTimerId = null

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}

const apiBaseUrl = resolveApiBaseUrl()

const getAuthConfig = () => ({
  headers: {
    ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
  },
})

const paginationSummaryLabel = computed(() => {
  const totalItems = Number(pagination.totalItems || 0)
  if (!totalItems || logs.value.length === 0) return 'Showing 0 of 0 audit entries.'
  const start = ((pagination.page - 1) * pagination.pageSize) + 1
  const end = start + logs.value.length - 1
  return `Showing ${formatNumber(start)}-${formatNumber(end)} of ${formatNumber(totalItems)} audit entries.`
})

const paginationItems = computed(() => {
  const totalPages = Number(pagination.totalPages || 1)
  const currentPage = Number(pagination.page || 1)

  if (totalPages <= 1) return []
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: 'page',
      value: index + 1,
      key: `page-${index + 1}`,
    }))
  }

  const items = [{ type: 'page', value: 1, key: 'page-1' }]

  if (currentPage > 3) {
    items.push({ type: 'ellipsis', key: 'ellipsis-start' })
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let page = start; page <= end; page += 1) {
    items.push({ type: 'page', value: page, key: `page-${page}` })
  }

  if (currentPage < totalPages - 2) {
    items.push({ type: 'ellipsis', key: 'ellipsis-end' })
  }

  items.push({ type: 'page', value: totalPages, key: `page-${totalPages}` })
  return items
})

const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return 'Waiting for first sync'
  return `Last updated ${formatRelativeTime(lastUpdatedAt.value)}`
})

const isActive = (path) => route.path === path

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0))

const formatDateTime = (value) => {
  if (!value) return 'Unknown time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatRelativeTime = (value) => {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

const formatRoleLabel = (role) => {
  const normalizedRole = String(role || '').trim().toLowerCase()
  if (!normalizedRole) return 'Role unavailable'
  if (normalizedRole === 'headteacher') return 'Head Teacher'
  return normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)
}

const formatUserAgent = (value) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  if (!normalized) return 'User agent unavailable'
  if (normalized.length <= 88) return normalized
  return `${normalized.slice(0, 85)}...`
}

const REQUEST_SOURCE_LABELS = {
  '/api/auth/login': 'Login page',
  '/api/auth/change-password': 'Password settings',
  '/api/auth/invite/:token/complete': 'Invitation onboarding',
  '/api/auth/forgot-password': 'Forgot password',
  '/api/auth/reset/:token/complete': 'Password recovery',
  '/api/admin/users': 'User management',
  '/api/admin/users/:id': 'User management',
  '/api/admin/users/:id/messages': 'User messaging',
  '/api/admin/users/:id/send-invite': 'User invitations',
  '/api/admin/export-requests/:id/review': 'Export approvals',
  '/api/admin/settings/security': 'Security settings',
  '/api/admin/settings/system': 'System settings',
  '/api/admin/settings/system/backup': 'System backup',
  '/api/admin/settings/system/clear-cache': 'System maintenance',
  '/api/teacher/lessons': 'Lesson management',
  '/api/teacher/subjects': 'Subject management',
  '/api/teacher/subjects/:subjectId': 'Subject management',
  '/api/teacher/assessments': 'Assessment management',
  '/api/teacher/assessments/:id/questions': 'Assessment management',
  '/api/teacher/students': 'Student management',
  '/api/teacher/subjects/:subjectId/students/:studentId': 'Subject roster',
  '/api/teacher/enrollment-requests/:studentId/accept': 'Enrollment requests',
  '/api/teacher/enrollment-requests/:studentId/reject': 'Enrollment requests',
  '/api/teacher/attendance': 'Attendance management',
  '/api/teacher/attendance/:id/lock': 'Attendance management',
  '/api/teacher/profile': 'Teacher profile',
  '/api/teacher/tour-preference': 'Teacher onboarding',
  '/api/teacher/assessments/ai-generate': 'AI assessment generator',
  '/api/student/profile': 'Student profile',
  '/api/student/tour-preference': 'Student onboarding',
  '/api/student/subjects/join': 'Subject enrollment',
  '/api/student/assessments/:id/start': 'Assessment workspace',
  '/api/student/assessments/:id/progress': 'Assessment workspace',
  '/api/student/assessments/:id/activity': 'Assessment activity tracker',
  '/api/student/assessments/:id/submissions': 'Assessment submissions',
  '/api/student/assessments/:id/activity-response/draft': 'Activity workspace',
  '/api/student/assessments/:id/activity-response/submit': 'Activity workspace',
  '/api/student/assessments/:id/activity-response/unsubmit': 'Activity workspace',
  '/api/headteacher/lessons': 'Managed lessons',
  '/api/headteacher/assessments': 'Managed assessments',
  '/api/headteacher/assessments/:id': 'Managed assessments',
  '/api/headteacher/assessments/ai-generate': 'Managed AI generator',
  '/api/headteacher/teachers': 'Teacher management',
  '/api/headteacher/teachers/:id': 'Teacher management',
  '/api/secretary/students/archived/export-requests': 'Archived student exports',
  '/api/secretary/students/archived/export-requests/:id/consume': 'Archived export approvals',
  '/api/secretary/students/end-school-year': 'School year archiving',
  '/api/recommendation/recompute/:studentId': 'Recommendation engine',
  '/api/notifications': 'Notifications center',
  '/api/notifications/view-all': 'Notifications center',
  '/api/notifications/:id/view': 'Notifications center',
  '/api/users/create-and-invite': 'User invitations',
}

const humanizeRequestSegment = (value) => {
  const normalized = String(value || '')
    .replace(/^:+/, '')
    .replace(/[-_]/g, ' ')
    .trim()

  if (!normalized) return ''

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => {
      if (segment.toLowerCase() === 'ai') return 'AI'
      return segment.charAt(0).toUpperCase() + segment.slice(1)
    })
    .join(' ')
}

const buildFallbackRequestSource = (log) => {
  const rawPath = String(log.routePath || log.endpoint || '')
    .split('?')[0]
    .trim()

  const segments = rawPath
    .replace(/^\/api\//, '')
    .split('/')
    .filter(Boolean)
    .filter((segment) => !segment.startsWith(':'))

  if (segments.length === 0) return 'System activity'

  const [, resource = '', detail = ''] = segments
  const resourceLabel = humanizeRequestSegment(resource)
  const detailLabel = humanizeRequestSegment(detail)

  if (resourceLabel && detailLabel) return `${resourceLabel} ${detailLabel}`
  if (resourceLabel) return `${resourceLabel} area`

  const categoryLabel = String(log.category || '').trim()
  return categoryLabel ? `${categoryLabel} activity` : 'System activity'
}

const formatRequestSource = (log) => {
  const endpoint = String(log.endpoint || '').trim()
  if (endpoint && REQUEST_SOURCE_LABELS[endpoint]) {
    return REQUEST_SOURCE_LABELS[endpoint]
  }

  return buildFallbackRequestSource(log)
}

const actorSubtitle = (log) => {
  if (log.actorEmail) return log.actorEmail
  if (log.actorIdentifier) return log.actorIdentifier
  return 'Actor details unavailable'
}

const methodBadgeClass = (method) => {
  const normalizedMethod = String(method || '').trim().toLowerCase()
  return normalizedMethod ? `audit-method-badge--${normalizedMethod}` : ''
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

const syncMobileMenuBodyState = () => {
  if (typeof window === 'undefined') return
  const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
  document.body.classList.toggle('admin-mobile-menu-open', shouldLockBody)
}

const goToProfile = () => {
  closeAccountMenu()
  router.push('/admin/profile')
}

const goToSettings = () => {
  closeAccountMenu()
  router.push('/admin/settings')
}

const handleLogout = () => {
  closeAccountMenu()
  authStore.logout()
  router.push('/auth/login')
}

const handleDocumentClick = (event) => {
  const target = event?.target
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  closeAccountMenu()
}

const handleDocumentKeydown = (event) => {
  if (event.key === 'Escape') {
    closeAccountMenu()
  }
}

const applyPagination = (payload = {}) => {
  pagination.page = Number(payload.page || 1)
  pagination.pageSize = Number(payload.pageSize || PAGE_SIZE)
  pagination.totalItems = Number(payload.totalItems || 0)
  pagination.totalPages = Number(payload.totalPages || 1)
  pagination.hasPreviousPage = payload.hasPreviousPage === true
  pagination.hasNextPage = payload.hasNextPage === true
}

const clearAutoRefreshTimer = () => {
  if (typeof window === 'undefined' || autoRefreshTimerId === null) return
  window.clearTimeout(autoRefreshTimerId)
  autoRefreshTimerId = null
}

const syncActiveFilters = () => {
  activeFilters.search = String(filters.search || '').trim()
  activeFilters.category = String(filters.category || 'all').trim() || 'all'
  activeFilters.role = String(filters.role || 'all').trim().toLowerCase() || 'all'
  activeFilters.method = String(filters.method || 'ALL').trim().toUpperCase() || 'ALL'
  activeFilters.result = String(filters.result || 'all').trim().toLowerCase() || 'all'
}

const scheduleAutoRefresh = () => {
  clearAutoRefreshTimer()
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (document.visibilityState !== 'visible') return
  if (route.path !== '/admin/audit-logs') return

  autoRefreshTimerId = window.setTimeout(() => {
    fetchAuditLogs({ silent: true })
  }, AUTO_REFRESH_INTERVAL_MS)
}

const fetchAuditLogs = async ({ silent = false } = {}) => {
  if (silent) {
    if (loading.value || isAutoRefreshing.value) {
      scheduleAutoRefresh()
      return
    }
    isAutoRefreshing.value = true
  } else {
    if (loading.value || isAutoRefreshing.value) return
    loading.value = true
    errorMessage.value = ''
  }

  try {
    const params = new URLSearchParams()
    if (activeFilters.search) params.set('search', activeFilters.search)
    if (activeFilters.category !== 'all') params.set('category', activeFilters.category)
    if (activeFilters.role !== 'all') params.set('role', activeFilters.role)
    if (activeFilters.method !== 'ALL') params.set('method', activeFilters.method)
    if (activeFilters.result !== 'all') params.set('result', activeFilters.result)
    params.set('page', String(pagination.page || 1))

    const response = await axios.get(`${apiBaseUrl}/admin/audit-logs?${params.toString()}`, getAuthConfig())
    logs.value = Array.isArray(response.data?.logs) ? response.data.logs : []
    availableCategories.value = Array.isArray(response.data?.categories) ? response.data.categories : []
    applyPagination(response.data?.pagination || {})
    lastUpdatedAt.value = new Date().toISOString()
  } catch (error) {
    if (!silent) {
      logs.value = []
      applyPagination()
      errorMessage.value = error.response?.data?.message || 'Unable to load audit logs.'
    }
  } finally {
    if (silent) {
      isAutoRefreshing.value = false
    } else {
      loading.value = false
    }
    scheduleAutoRefresh()
  }
}

const applyFiltersAndFetch = async () => {
  syncActiveFilters()
  pagination.page = 1
  await fetchAuditLogs()
}

const resetFilters = async () => {
  filters.search = ''
  filters.category = 'all'
  filters.role = 'all'
  filters.method = 'ALL'
  filters.result = 'all'
  syncActiveFilters()
  pagination.page = 1
  await fetchAuditLogs()
}

const goToPage = async (page) => {
  const targetPage = Number(page || 1)
  if (!Number.isFinite(targetPage) || targetPage < 1 || targetPage === pagination.page || loading.value) return
  pagination.page = targetPage
  await fetchAuditLogs()
}

const goToPreviousPage = async () => {
  if (!pagination.hasPreviousPage || loading.value) return
  pagination.page -= 1
  await fetchAuditLogs()
}

const goToNextPage = async () => {
  if (!pagination.hasNextPage || loading.value) return
  pagination.page += 1
  await fetchAuditLogs()
}

const handleVisibilityChange = () => {
  if (typeof document === 'undefined') return
  if (document.visibilityState === 'visible') {
    fetchAuditLogs({ silent: true })
    return
  }
  clearAutoRefreshTimer()
}

const handleWindowFocus = () => {
  fetchAuditLogs({ silent: true })
}

watch(
  () => route.path,
  () => {
    closeSidebar()
    closeAccountMenu()
  }
)

watch(
  () => isSidebarOpen.value,
  () => {
    syncMobileMenuBodyState()
  }
)

onMounted(async () => {
  document.body.classList.add('admin-dashboard')
  window.addEventListener('resize', syncMobileMenuBodyState)
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  syncMobileMenuBodyState()
  syncActiveFilters()
  await fetchAuditLogs()
})

onBeforeUnmount(() => {
  clearAutoRefreshTimer()
  document.body.classList.remove('admin-dashboard')
  document.body.classList.remove('admin-mobile-menu-open')
  window.removeEventListener('resize', syncMobileMenuBodyState)
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
@import url('/css/admin.css');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.audit-live-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.audit-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.audit-live-pill i {
  font-size: 0.55rem;
}

.audit-live-pill--syncing {
  background: #fee2e2;
  border-color: #f87171;
  color: #b91c1c;
}

.audit-live-pill--syncing i {
  font-size: 0.8rem;
}

.audit-live-caption {
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.5;
}

.audit-filter-row {
  align-items: flex-end;
}

.audit-filter-group--search {
  flex: 1 1 320px;
}

.audit-search {
  width: 100%;
}

.audit-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  min-height: 220px;
  color: #64748b;
  font-weight: 600;
  text-align: center;
}

.audit-empty-state i {
  font-size: 1.1rem;
}

.audit-empty-state--error {
  color: #991b1b;
}

.audit-logs-table .time-col {
  width: 180px;
}

.audit-logs-table .actor-col {
  width: 230px;
}

.audit-logs-table .module-col {
  width: 140px;
}

.audit-logs-table .action-col {
  width: 270px;
}

.audit-logs-table .result-col {
  width: 150px;
}

.audit-logs-table .endpoint-col {
  width: 260px;
}

.audit-time,
.audit-actor,
.audit-action,
.audit-endpoint {
  display: grid;
  gap: 0.25rem;
}

.audit-time strong,
.audit-actor strong,
.audit-action strong,
.audit-endpoint strong {
  color: #111827;
  font-size: 0.94rem;
}

.audit-time span,
.audit-actor span,
.audit-action span,
.audit-actor small,
.audit-action small,
.audit-endpoint small {
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

.audit-action small {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.audit-category-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #dbe4ec;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 800;
  white-space: nowrap;
}

.audit-result-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  white-space: nowrap;
}

.audit-result-badge strong {
  font-size: 0.76rem;
}

.audit-result-badge--success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}

.audit-result-badge--failed {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.audit-method-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 32px;
  padding: 0.35rem 0.68rem;
  border-radius: 10px;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.audit-method-badge--post {
  background: #dbeafe;
  color: #1d4ed8;
}

.audit-method-badge--put {
  background: #ede9fe;
  color: #6d28d9;
}

.audit-method-badge--patch {
  background: #fef3c7;
  color: #b45309;
}

.audit-method-badge--delete {
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 768px) {
  .audit-filter-row {
    align-items: stretch;
  }
}
</style>
