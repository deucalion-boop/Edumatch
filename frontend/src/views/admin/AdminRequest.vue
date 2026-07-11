<template>
  <div class="admin-dashboard admin-request-page">
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
              <span class="page-title">Requests</span>
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
            <h2>Requests</h2>
            <p>Review request flows that are currently routed to admins. Right now this includes archived student record PDF export approvals submitted by secretaries.</p>
            <div class="request-live-status">
              <span class="request-live-pill" :class="{ 'request-live-pill--syncing': isAutoRefreshing }">
                <i :class="isAutoRefreshing ? 'fas fa-satellite-dish fa-spin' : 'fas fa-circle'"></i>
                {{ isAutoRefreshing ? 'LIVE SYNCING' : 'LIVE' }}
              </span>
              <span class="request-live-caption">{{ lastUpdatedLabel }}</span>
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
              @click="applyFiltersAndRefresh"
              :disabled="loading"
            >
              <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-rotate-right'"></i>
              {{ loading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <section class="request-summary-grid">
          <article class="section-card request-summary-card">
            <span class="request-summary-label">Visible Requests</span>
            <strong>{{ formatNumber(filteredRequests.length) }}</strong>
            <p>{{ filteredSummaryLabel }}</p>
          </article>
          <article class="section-card request-summary-card request-summary-card--pending">
            <span class="request-summary-label">Pending Review</span>
            <strong>{{ formatNumber(pendingFilteredCount) }}</strong>
            <p>Requests waiting for an admin decision right now.</p>
          </article>
          <article class="section-card request-summary-card request-summary-card--approved">
            <span class="request-summary-label">Approved</span>
            <strong>{{ formatNumber(approvedFilteredCount) }}</strong>
            <p>Requests that are ready to be used by the requester.</p>
          </article>
          <article class="section-card request-summary-card">
            <span class="request-summary-label">Closed Requests</span>
            <strong>{{ formatNumber(closedFilteredCount) }}</strong>
            <p>Rejected, expired, or already-used requests in the current view.</p>
          </article>
        </section>

        <section class="user-filters section-card fade-in">
          <form class="filter-row request-filter-row" @submit.prevent="applyFiltersAndRefresh">
            <div class="filter-group request-filter-group request-filter-group--search">
              <label for="requestSearch"><i class="fas fa-search"></i> Search</label>
              <input
                id="requestSearch"
                v-model.trim="filters.search"
                type="text"
                class="form-control request-search"
                placeholder="Search requester, request type, filters, or review note"
              />
            </div>

            <div class="filter-group">
              <label for="requestStatus"><i class="fas fa-circle-check"></i> Status</label>
              <select id="requestStatus" v-model="filters.status" class="filter-select">
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="fulfilled">Used</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <button type="submit" class="btn btn-outline" :disabled="loading">
              <i class="fas fa-filter"></i>
              Apply
            </button>
          </form>
        </section>

        <section class="request-board section-card fade-in">
          <div class="request-board-header">
            <div class="table-info">
              <h3>Archived PDF Export Requests</h3>
              <p>Showing the latest {{ REQUEST_FETCH_LIMIT }} request records available to admins.</p>
            </div>
            <span class="request-count-pill" :class="{ 'has-pending': pendingFilteredCount > 0 }">
              {{ formatNumber(pendingFilteredCount) }} pending
            </span>
          </div>

          <div v-if="feedbackMessage" class="request-feedback" :class="`request-feedback--${feedbackTone}`">
            <i :class="feedbackTone === 'error' ? 'fas fa-circle-exclamation' : 'fas fa-circle-check'"></i>
            <span>{{ feedbackMessage }}</span>
          </div>

          <div v-if="loading" class="request-empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading requests...</span>
          </div>

          <div v-else-if="filteredRequests.length === 0" class="request-empty-state">
            <i class="fas fa-folder-open"></i>
            <span>No requests match the current filters yet.</span>
          </div>

          <div v-else class="export-request-list">
            <article
              v-for="request in filteredRequests"
              :key="request.id"
              class="export-request-card"
              :class="getArchivedPdfRequestStatusClass(request.status)"
            >
              <div class="export-request-top">
                <div>
                  <h4>{{ request.requester?.name || 'Requester unavailable' }}</h4>
                  <p>{{ formatRoleLabel(request.requester?.role) }} · {{ getRequestTypeLabel(request.requestType) }}</p>
                </div>
                <span class="export-request-status" :class="getArchivedPdfRequestStatusClass(request.status)">
                  {{ formatArchivedPdfRequestStatus(request.status) }}
                </span>
              </div>

              <div class="export-request-meta">
                <span>
                  <i class="fas fa-users"></i>
                  {{ formatNumber(request.studentCount) }} archived record{{ Number(request.studentCount || 0) === 1 ? '' : 's' }}
                </span>
                <span>
                  <i class="fas fa-clock"></i>
                  Submitted {{ formatDateTime(request.createdAt) }}
                </span>
                <span>
                  <i class="fas fa-filter"></i>
                  {{ formatArchivedPdfFilterSummary(request) }}
                </span>
              </div>

              <p class="export-request-review">
                <span v-if="request.status === 'pending'">Awaiting admin review.</span>
                <span v-else-if="request.reviewer?.name">Reviewed by {{ request.reviewer.name }} on {{ formatDateTime(request.reviewedAt) }}.</span>
                <span v-else>Review details unavailable.</span>
              </p>

              <p v-if="request.status === 'approved' && request.expiresAt" class="export-request-expiry">
                Available until {{ formatDateTime(request.expiresAt) }}
              </p>

              <p v-if="request.reviewer?.note" class="export-request-note">
                Note: {{ request.reviewer.note }}
              </p>

              <div v-if="request.status === 'pending'" class="export-request-actions">
                <button
                  type="button"
                  class="btn btn-primary export-request-action"
                  :disabled="activeRequestActionId === request.id"
                  @click="reviewRequest(request, 'approved')"
                >
                  <i class="fas" :class="activeRequestActionId === request.id ? 'fa-spinner fa-spin' : 'fa-check'"></i>
                  Approve
                </button>
                <button
                  type="button"
                  class="btn btn-outline export-request-action export-request-action--reject"
                  :disabled="activeRequestActionId === request.id"
                  @click="reviewRequest(request, 'rejected')"
                >
                  <i class="fas fa-xmark"></i>
                  Reject
                </button>
              </div>
            </article>
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
const REQUEST_FETCH_LIMIT = 50

const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const loading = ref(false)
const isAutoRefreshing = ref(false)
const requests = ref([])
const activeRequestActionId = ref('')
const feedbackMessage = ref('')
const feedbackTone = ref('success')
const lastUpdatedAt = ref(null)

const filters = reactive({
  search: '',
  status: 'all',
})

const activeFilters = reactive({
  search: '',
  status: 'all',
})

let autoRefreshTimer = null
let visibilityChangeHandler = null
let feedbackTimer = null

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}

const apiBaseUrl = resolveApiBaseUrl()

const getAuthConfig = () => ({
  headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
})

const formatNumber = (value) => new Intl.NumberFormat().format(Number(value || 0))

const formatDateTime = (value) => {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatRelativeTime = (value) => {
  if (!value) return 'Waiting for first sync'
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return 'Waiting for first sync'

  const diffMs = Date.now() - timestamp.getTime()
  if (diffMs < 0) return 'Updated just now'

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return 'Updated just now'
  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute)
    return `Updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour)
    return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(diffMs / day)
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`
}

const lastUpdatedLabel = computed(() => formatRelativeTime(lastUpdatedAt.value))

const setFeedback = (message, tone = 'success') => {
  feedbackMessage.value = String(message || '').trim()
  feedbackTone.value = tone === 'error' ? 'error' : 'success'

  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer)
  }

  if (feedbackMessage.value) {
    feedbackTimer = window.setTimeout(() => {
      feedbackMessage.value = ''
    }, 4000)
  }
}

const formatArchivedPdfRequestStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'approved') return 'Approved'
  if (normalized === 'rejected') return 'Rejected'
  if (normalized === 'fulfilled') return 'Used'
  if (normalized === 'expired') return 'Expired'
  return 'Pending'
}

const getArchivedPdfRequestStatusClass = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'approved') return 'is-approved'
  if (normalized === 'pending') return 'is-pending'
  if (normalized === 'rejected') return 'is-rejected'
  if (normalized === 'fulfilled') return 'is-fulfilled'
  if (normalized === 'expired') return 'is-expired'
  return 'is-neutral'
}

const formatArchivedPdfFilterSummary = (request = {}) => {
  const requestFilters = request?.filters || {}
  const parts = [
    requestFilters.schoolYear && requestFilters.schoolYear !== 'all' ? `SY ${requestFilters.schoolYear}` : 'All school years',
    requestFilters.department && requestFilters.department !== 'all' ? requestFilters.department : 'All departments',
    requestFilters.gradeLevel && requestFilters.gradeLevel !== 'all' ? requestFilters.gradeLevel : 'All grades',
  ]

  if (String(requestFilters.searchTerm || '').trim()) {
    parts.push(`Search: ${requestFilters.searchTerm}`)
  }

  return parts.join(' | ')
}

const formatRoleLabel = (role) => {
  const normalizedRole = String(role || '').trim().toLowerCase()
  if (!normalizedRole) return 'Role unavailable'
  if (normalizedRole === 'headteacher') return 'Head Teacher'
  return normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)
}

const getRequestTypeLabel = (requestType) => {
  const normalized = String(requestType || '').trim().toLowerCase()
  if (normalized === 'archived_student_records_pdf') return 'Archived Student Records PDF'
  return 'System request'
}

const syncActiveFilters = () => {
  activeFilters.search = String(filters.search || '').trim().toLowerCase()
  activeFilters.status = String(filters.status || 'all').trim().toLowerCase() || 'all'
}

const filteredRequests = computed(() => {
  return requests.value.filter((request) => {
    if (activeFilters.status !== 'all' && String(request.status || '').trim().toLowerCase() !== activeFilters.status) {
      return false
    }

    if (!activeFilters.search) return true

    const haystack = [
      request.requester?.name,
      request.requester?.role,
      request.requestType,
      request.reviewer?.name,
      request.reviewer?.note,
      formatArchivedPdfFilterSummary(request),
    ]
      .map((value) => String(value || '').toLowerCase())
      .join(' ')

    return haystack.includes(activeFilters.search)
  })
})

const pendingFilteredCount = computed(() => (
  filteredRequests.value.filter((request) => String(request.status || '').trim().toLowerCase() === 'pending').length
))

const approvedFilteredCount = computed(() => (
  filteredRequests.value.filter((request) => String(request.status || '').trim().toLowerCase() === 'approved').length
))

const closedFilteredCount = computed(() => (
  filteredRequests.value.filter((request) => ['rejected', 'fulfilled', 'expired'].includes(String(request.status || '').trim().toLowerCase())).length
))

const filteredSummaryLabel = computed(() => {
  const visibleCount = filteredRequests.value.length
  const loadedCount = requests.value.length
  return `Showing ${formatNumber(visibleCount)} of ${formatNumber(loadedCount)} loaded requests.`
})

const isActive = (path) => route.path === path

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

const fetchRequests = async ({ silent = false } = {}) => {
  if (silent) {
    isAutoRefreshing.value = true
  } else {
    loading.value = true
  }

  try {
    const response = await axios.get(`${apiBaseUrl}/admin/export-requests/archived-pdf`, {
      ...getAuthConfig(),
      params: { limit: REQUEST_FETCH_LIMIT },
    })

    requests.value = Array.isArray(response.data?.requests) ? response.data.requests : []
    lastUpdatedAt.value = new Date().toISOString()
  } catch (error) {
    if (!silent) {
      setFeedback(error.response?.data?.message || 'Failed to load requests.', 'error')
    }
  } finally {
    if (silent) {
      isAutoRefreshing.value = false
    } else {
      loading.value = false
    }
  }
}

const applyFiltersAndRefresh = async () => {
  syncActiveFilters()
  await fetchRequests()
}

const resetFilters = async () => {
  filters.search = ''
  filters.status = 'all'
  syncActiveFilters()
  await fetchRequests()
}

const reviewRequest = async (request, decision) => {
  const requestId = String(request?.id || '').trim()
  if (!requestId || !['approved', 'rejected'].includes(decision)) {
    setFeedback('Invalid request action.', 'error')
    return
  }

  if (decision === 'rejected') {
    const confirmed = window.confirm(`Reject the request from ${request?.requester?.name || 'this user'}?`)
    if (!confirmed) return
  }

  try {
    activeRequestActionId.value = requestId
    await axios.patch(
      `${apiBaseUrl}/admin/export-requests/${requestId}/review`,
      { decision },
      getAuthConfig()
    )

    setFeedback(
      decision === 'approved'
        ? 'Request approved successfully.'
        : 'Request rejected successfully.'
    )

    await fetchRequests({ silent: true })
  } catch (error) {
    setFeedback(error.response?.data?.message || 'Failed to review the request.', 'error')
  } finally {
    activeRequestActionId.value = ''
  }
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

onMounted(() => {
  document.body.classList.add('admin-dashboard')
  window.addEventListener('resize', syncMobileMenuBodyState)
  syncMobileMenuBodyState()
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)

  syncActiveFilters()
  fetchRequests()

  autoRefreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchRequests({ silent: true })
    }
  }, AUTO_REFRESH_INTERVAL_MS)

  visibilityChangeHandler = () => {
    if (document.visibilityState === 'visible') {
      fetchRequests({ silent: true })
    }
  }

  document.addEventListener('visibilitychange', visibilityChangeHandler)
  window.addEventListener('focus', fetchRequests)
})

onBeforeUnmount(() => {
  document.body.classList.remove('admin-dashboard')
  document.body.classList.remove('admin-mobile-menu-open')
  window.removeEventListener('resize', syncMobileMenuBodyState)
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)

  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler)
  }

  window.removeEventListener('focus', fetchRequests)

  if (autoRefreshTimer) {
    window.clearInterval(autoRefreshTimer)
  }

  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer)
  }
})
</script>

<style scoped>
@import url('/css/admin.css');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.request-live-status {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  margin-top: 0.85rem;
}

.request-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 34px;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: #dc2626;
  font-size: 0.82rem;
  font-weight: 700;
}

.request-live-pill--syncing {
  border-color: #f87171;
  background: #fee2e2;
}

.request-live-caption {
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.5;
}

.request-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.request-summary-card {
  display: grid;
  gap: 0.45rem;
}

.request-summary-label {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.request-summary-card strong {
  color: #0f172a;
  font-size: 1.7rem;
  letter-spacing: -0.04em;
}

.request-summary-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
}

.request-summary-card--pending {
  border-color: #fdba74 !important;
  background: linear-gradient(180deg, #ffffff 0%, #fff7ed 100%) !important;
}

.request-summary-card--approved {
  border-color: #86efac !important;
  background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%) !important;
}

.request-filter-row {
  align-items: end;
}

.request-filter-group--search {
  min-width: min(360px, 100%);
  flex: 1 1 360px;
}

.request-search {
  min-height: 44px;
}

.request-board {
  display: grid;
  gap: 1rem;
}

.request-board-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.request-board-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.request-board-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
}

.request-count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
}

.request-count-pill.has-pending {
  border-color: #fdba74;
  background: #fff7ed;
  color: #9a3412;
}

.request-feedback {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 600;
}

.request-feedback--success {
  border: 1px solid #86efac;
  background: #f0fdf4;
  color: #166534;
}

.request-feedback--error {
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: #b91c1c;
}

.request-empty-state {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem 1.1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  color: #64748b;
  background: #f8fafc;
  font-size: 0.9rem;
}

.export-request-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.export-request-card {
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.export-request-card.is-pending {
  border-color: #fdba74;
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.08);
}

.export-request-card.is-approved {
  border-color: #86efac;
  background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
}

.export-request-card.is-rejected,
.export-request-card.is-expired {
  border-color: #fca5a5;
  background: linear-gradient(180deg, #ffffff 0%, #fef2f2 100%);
}

.export-request-card.is-fulfilled {
  border-color: #cbd5e1;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.export-request-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.export-request-top h4 {
  margin: 0;
  font-size: 0.98rem;
}

.export-request-top p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
}

.export-request-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.export-request-status.is-pending {
  border-color: #fdba74;
  background: #fff7ed;
  color: #9a3412;
}

.export-request-status.is-approved {
  border-color: #86efac;
  background: #ecfdf5;
  color: #166534;
}

.export-request-status.is-rejected,
.export-request-status.is-expired {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #b91c1c;
}

.export-request-status.is-fulfilled {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #475569;
}

.export-request-meta {
  display: grid;
  gap: 0.45rem;
}

.export-request-meta span,
.export-request-review,
.export-request-expiry,
.export-request-note {
  margin: 0;
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.5;
}

.export-request-meta span {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}

.export-request-meta i {
  margin-top: 0.12rem;
  color: #64748b;
}

.export-request-expiry {
  color: #166534;
  font-weight: 600;
}

.export-request-note {
  color: #334155;
}

.export-request-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.export-request-action {
  min-height: 42px;
}

.export-request-action--reject {
  border-color: #fca5a5 !important;
  color: #b91c1c !important;
}

@media (max-width: 1024px) {
  .request-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .request-live-status,
  .request-board-header {
    align-items: stretch;
  }
}

@media (max-width: 640px) {
  .request-summary-grid {
    grid-template-columns: 1fr;
  }

  .export-request-list {
    grid-template-columns: 1fr;
  }
}
</style>
