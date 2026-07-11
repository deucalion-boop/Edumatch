<template>
  <div class="admin-dashboard admin-login-attempts-page">
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
              <span class="page-title">Login Attempts</span>
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
            <h2>Login Attempts</h2>
            <p>Review successful and failed sign-in activity across all accounts. New records will appear here as users try to log in.</p>
            <div class="login-live-status">
              <span class="login-live-pill" :class="{ 'login-live-pill--syncing': isAutoRefreshing }">
                <i :class="isAutoRefreshing ? 'fas fa-satellite-dish fa-spin' : 'fas fa-circle'"></i>
                {{ isAutoRefreshing ? 'Live syncing' : 'Live' }}
              </span>
              <span class="login-live-caption">
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
          <form class="filter-row login-attempts-filter-row" @submit.prevent="applyFiltersAndFetch">
            <div class="filter-group login-attempts-filter-group login-attempts-filter-group--search">
              <label for="loginAttemptSearch"><i class="fas fa-search"></i> Search</label>
              <input
                id="loginAttemptSearch"
                v-model.trim="filters.search"
                type="text"
                class="form-control login-attempts-search"
                placeholder="Search username, name, email, IP, or reason"
              />
            </div>

            <div class="filter-group">
              <label for="loginAttemptStatus"><i class="fas fa-circle-check"></i> Result</label>
              <select id="loginAttemptStatus" v-model="filters.status" class="filter-select">
                <option value="all">All Results</option>
                <option value="success">Successful Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="loginAttemptRole"><i class="fas fa-user-tag"></i> Role</label>
              <select id="loginAttemptRole" v-model="filters.role" class="filter-select">
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="secretary">Secretary</option>
                <option value="headteacher">Head Teacher</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
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
              <h3>Only Recent Log-In Activity</h3>
            </div>
          </div>

          <div v-if="loading" class="login-attempts-empty">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading login attempts...</span>
          </div>

          <div v-else-if="errorMessage" class="login-attempts-empty login-attempts-empty--error">
            <i class="fas fa-circle-exclamation"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <div v-else-if="attempts.length === 0" class="login-attempts-empty">
            <i class="fas fa-folder-open"></i>
            <span>No login attempts match the current filters yet.</span>
          </div>

          <div v-else class="table-responsive">
            <table class="users-table login-attempts-table">
              <thead>
                <tr>
                  <th class="time-col">Time</th>
                  <th class="user-col">User</th>
                  <th class="role-col">Role</th>
                  <th class="result-col">Result</th>
                  <th class="details-col">Details</th>
                  <th class="ip-col">IP Address</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="attempt in attempts" :key="attempt.id">
                  <td class="time-col">
                    <div class="login-attempt-meta">
                      <strong>{{ formatDateTime(attempt.createdAt) }}</strong>
                      <span>{{ formatRelativeTime(attempt.createdAt) }}</span>
                    </div>
                  </td>
                  <td class="user-col">
                    <div class="login-attempt-user">
                      <strong>{{ attempt.name || attempt.username || 'Unknown user' }}</strong>
                      <span>{{ attempt.username ? `@${attempt.username}` : 'Username not provided' }}</span>
                      <small>{{ attempt.email || 'No linked account details' }}</small>
                    </div>
                  </td>
                  <td class="role-col">
                    <span class="role-badge" :class="roleBadgeClass(attempt.role)">
                      {{ formatRoleLabel(attempt.role) }}
                    </span>
                  </td>
                  <td class="result-col">
                    <span class="login-attempt-badge" :class="attempt.outcome === 'success' ? 'login-attempt-badge--success' : 'login-attempt-badge--failed'">
                      <i :class="attempt.outcome === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                      {{ attempt.outcome === 'success' ? 'Success' : 'Failed' }}
                    </span>
                  </td>
                  <td class="details-col">
                    <div class="login-attempt-detail">
                      <strong>{{ attempt.reason || (attempt.outcome === 'success' ? 'Login successful' : 'Login failed') }}</strong>
                      <small v-if="attempt.userAgent">{{ formatUserAgent(attempt.userAgent) }}</small>
                    </div>
                  </td>
                  <td class="ip-col">
                    <span class="login-attempt-ip">{{ attempt.ipAddress || 'Unavailable' }}</span>
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
const attempts = ref([])
const filters = reactive({
  search: '',
  status: 'all',
  role: 'all',
})
const activeFilters = reactive({
  search: '',
  status: 'all',
  role: 'all',
})
const pagination = reactive({
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
})
const lastUpdatedAt = ref('')

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
  if (!totalItems || attempts.value.length === 0) return 'Showing 0 of 0 matching login attempts.'
  const start = ((pagination.page - 1) * pagination.pageSize) + 1
  const end = start + attempts.value.length - 1
  return `Showing ${formatNumber(start)}-${formatNumber(end)} of ${formatNumber(totalItems)} matching login attempts.`
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
  if (!normalizedRole) return 'Unknown'
  if (normalizedRole === 'headteacher') return 'Head Teacher'
  return normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)
}

const roleBadgeClass = (role) => {
  const normalizedRole = String(role || '').trim().toLowerCase()
  return normalizedRole
}

const formatUserAgent = (value) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= 90) return normalized
  return `${normalized.slice(0, 87)}...`
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
  activeFilters.status = String(filters.status || 'all').trim().toLowerCase() || 'all'
  activeFilters.role = String(filters.role || 'all').trim().toLowerCase() || 'all'
}

const scheduleAutoRefresh = () => {
  clearAutoRefreshTimer()
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (document.visibilityState !== 'visible') return
  if (route.path !== '/admin/login-attempts') return

  autoRefreshTimerId = window.setTimeout(() => {
    fetchLoginAttempts({ silent: true })
  }, AUTO_REFRESH_INTERVAL_MS)
}

const fetchLoginAttempts = async ({ silent = false } = {}) => {
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
    if (activeFilters.status !== 'all') params.set('status', activeFilters.status)
    if (activeFilters.role !== 'all') params.set('role', activeFilters.role)
    params.set('page', String(pagination.page || 1))

    const response = await axios.get(
      `${apiBaseUrl}/admin/login-attempts?${params.toString()}`,
      getAuthConfig()
    )

    attempts.value = Array.isArray(response.data?.attempts) ? response.data.attempts : []
    applyPagination(response.data?.pagination || {})
    lastUpdatedAt.value = new Date().toISOString()
  } catch (error) {
    if (!silent) {
      attempts.value = []
      applyPagination()
      errorMessage.value = error.response?.data?.message || 'Unable to load login attempts.'
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
  await fetchLoginAttempts()
}

const resetFilters = async () => {
  filters.search = ''
  filters.status = 'all'
  filters.role = 'all'
  syncActiveFilters()
  pagination.page = 1
  await fetchLoginAttempts()
}

const goToPage = async (page) => {
  const targetPage = Number(page || 1)
  if (!Number.isFinite(targetPage) || targetPage < 1 || targetPage === pagination.page || loading.value) return
  pagination.page = targetPage
  await fetchLoginAttempts()
}

const goToPreviousPage = async () => {
  if (!pagination.hasPreviousPage || loading.value) return
  pagination.page -= 1
  await fetchLoginAttempts()
}

const goToNextPage = async () => {
  if (!pagination.hasNextPage || loading.value) return
  pagination.page += 1
  await fetchLoginAttempts()
}

const handleVisibilityChange = () => {
  if (typeof document === 'undefined') return
  if (document.visibilityState === 'visible') {
    fetchLoginAttempts({ silent: true })
    return
  }
  clearAutoRefreshTimer()
}

const handleWindowFocus = () => {
  fetchLoginAttempts({ silent: true })
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
  await fetchLoginAttempts()
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

.login-live-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.login-live-pill {
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

.login-live-pill i {
  font-size: 0.55rem;
}

.login-live-pill--syncing {
  background: #fee2e2;
  border-color: #f87171;
  color: #b91c1c;
}

.login-live-pill--syncing i {
  font-size: 0.8rem;
}

.login-live-caption {
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.5;
}

.login-attempts-filter-row {
  align-items: flex-end;
}

.login-attempts-filter-group--search {
  flex: 1 1 320px;
}

.login-attempts-search {
  width: 100%;
}

.login-attempts-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  min-height: 220px;
  color: #64748b;
  font-weight: 600;
  text-align: center;
}

.login-attempts-empty i {
  font-size: 1.1rem;
}

.login-attempts-empty--error {
  color: #991b1b;
}

.login-attempts-table .time-col {
  width: 180px;
}

.login-attempts-table .user-col {
  width: 240px;
}

.login-attempts-table .role-col {
  width: 130px;
}

.login-attempts-table .result-col {
  width: 130px;
}

.login-attempts-table .details-col {
  width: 320px;
}

.login-attempts-table .ip-col {
  width: 170px;
}

.login-attempt-meta,
.login-attempt-user,
.login-attempt-detail {
  display: grid;
  gap: 0.25rem;
}

.login-attempt-meta strong,
.login-attempt-user strong,
.login-attempt-detail strong {
  color: #111827;
  font-size: 0.95rem;
}

.login-attempt-meta span,
.login-attempt-user span,
.login-attempt-user small,
.login-attempt-detail small {
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

.login-attempt-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  padding: 0.48rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.login-attempt-badge--success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.login-attempt-badge--failed {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.login-attempt-ip {
  color: #334155;
  font-family: 'Consolas', 'SFMono-Regular', monospace;
  font-size: 0.82rem;
}

@media (max-width: 768px) {
  .login-attempts-filter-row {
    align-items: stretch;
  }
}
</style>
