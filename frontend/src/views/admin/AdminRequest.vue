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
        <div class="page-header request-hero fade-in">
          <div class="header-left">
            <h2>Admin requests</h2>
            <p>Review and manage archived student-record PDF export requests submitted by secretaries.</p>
          </div>
        </div>

        <section class="request-summary-grid">
          <article class="section-card request-summary-card">
            <div class="request-summary-top">
              <span class="request-summary-icon"><i class="fas fa-inbox"></i></span>
              <span class="request-summary-label">Visible</span>
            </div>
            <div class="request-summary-value">
              <strong>{{ formatNumber(filteredRequests.length) }}</strong>
              <span>requests</span>
            </div>
            <p>{{ filteredSummaryLabel }}</p>
          </article>
          <article class="section-card request-summary-card request-summary-card--pending">
            <div class="request-summary-top">
              <span class="request-summary-icon"><i class="fas fa-hourglass-half"></i></span>
              <span class="request-summary-label">Pending review</span>
            </div>
            <div class="request-summary-value">
              <strong>{{ formatNumber(pendingFilteredCount) }}</strong>
              <span>waiting</span>
            </div>
            <p>Requires an admin decision.</p>
          </article>
          <article class="section-card request-summary-card request-summary-card--approved">
            <div class="request-summary-top">
              <span class="request-summary-icon"><i class="fas fa-circle-check"></i></span>
              <span class="request-summary-label">Approved</span>
            </div>
            <div class="request-summary-value">
              <strong>{{ formatNumber(approvedFilteredCount) }}</strong>
              <span>ready</span>
            </div>
            <p>Available to the requester.</p>
          </article>
          <article class="section-card request-summary-card request-summary-card--closed">
            <div class="request-summary-top">
              <span class="request-summary-icon"><i class="fas fa-box-archive"></i></span>
              <span class="request-summary-label">Closed</span>
            </div>
            <div class="request-summary-value">
              <strong>{{ formatNumber(closedFilteredCount) }}</strong>
              <span>finished</span>
            </div>
            <p>Rejected, expired, or used.</p>
          </article>
        </section>

        <section
          class="request-board section-card fade-in tw:inline:[border:1px_solid_#69aa47]!"
        >
          <div class="request-board-header">
            <div class="table-info">
              <span class="request-board-eyebrow">Request queue</span>
              <h3>Archived PDF Export Requests</h3>
              <p>Showing the latest {{ REQUEST_FETCH_LIMIT }} request records available to admins.</p>
            </div>
            <span class="request-count-pill" :class="{ 'has-pending': pendingFilteredCount > 0 }">
              {{ formatNumber(pendingFilteredCount) }} pending
            </span>
          </div>

          <form class="request-toolbar" @submit.prevent="applyFiltersAndRefresh">
            <div class="request-search-field">
              <label for="requestSearch">Search requests</label>
              <div class="request-search-control">
                <i class="fas fa-search" aria-hidden="true"></i>
                <input
                  id="requestSearch"
                  v-model.trim="filters.search"
                  type="search"
                  class="request-search"
                  placeholder="Search requester, type, filters, or note"
                />
              </div>
            </div>

            <div class="request-status-field">
              <label for="requestStatus">Status</label>
              <select id="requestStatus" v-model="filters.status" class="filter-select">
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="fulfilled">Used</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div class="request-toolbar-actions">
              <button
                v-if="filters.search || filters.status !== 'all'"
                type="button"
                class="btn request-reset-btn"
                :disabled="loading"
                @click="resetFilters"
              >
                Reset
              </button>
              <button type="submit" class="btn request-apply-btn" :disabled="loading">
                <i class="fas fa-filter"></i>
                Apply filters
              </button>
            </div>
          </form>

          <div v-if="feedbackMessage" class="request-feedback" :class="`request-feedback--${feedbackTone}`">
            <i :class="feedbackTone === 'error' ? 'fas fa-circle-exclamation' : 'fas fa-circle-check'"></i>
            <span>{{ feedbackMessage }}</span>
          </div>

          <div v-if="loading" class="request-empty-state">
            <span class="request-empty-icon"><i class="fas fa-spinner fa-spin"></i></span>
            <strong>Loading requests</strong>
            <p>Checking for the latest approval activity.</p>
          </div>

          <div v-else-if="filteredRequests.length === 0" class="request-empty-state">
            <span class="request-empty-icon"><i class="fas fa-folder-open"></i></span>
            <strong>No requests found</strong>
            <p v-if="activeFilters.search || activeFilters.status !== 'all'">
              No requests match the current search and status filters.
            </p>
            <p v-else>New approval requests will appear here automatically.</p>
            <button
              v-if="activeFilters.search || activeFilters.status !== 'all'"
              type="button"
              class="btn request-reset-btn"
              @click="resetFilters"
            >
              Clear filters
            </button>
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
        <section class="request-board section-card student-account-request-board">
          <div class="request-board-header">
            <div class="table-info"><span class="request-board-eyebrow">Student account safety</span><h3>Student Account Requests</h3><p>Review deactivation and permanent deletion requests submitted by students.</p></div>
            <span class="request-count-pill" :class="{ 'has-pending': pendingStudentAccountRequestCount > 0 }">{{ pendingStudentAccountRequestCount }} pending</span>
          </div>
          <div v-if="studentAccountRequestsLoading" class="request-empty-state"><i class="fas fa-spinner fa-spin"></i><strong>Loading student requests</strong></div>
          <div v-else-if="studentAccountRequests.length === 0" class="request-empty-state"><i class="fas fa-user-shield"></i><strong>No student account requests</strong><p>Requests will appear here when submitted.</p></div>
          <div v-else class="export-request-list">
            <article v-for="request in studentAccountRequests" :key="request.id" class="export-request-card" :class="getStudentRequestStatusClass(request.status)">
              <div class="export-request-top"><div><h4>{{ request.studentName || 'Student account' }}</h4><p>{{ request.studentEmail || 'Email unavailable' }} · {{ request.action === 'delete' ? 'Permanent deletion' : 'Account deactivation' }}</p></div><span class="export-request-status" :class="getStudentRequestStatusClass(request.status)">{{ formatStudentRequestStatus(request.status) }}</span></div>
              <div class="export-request-meta"><span><i class="fas fa-clock"></i> Submitted {{ formatDateTime(request.createdAt) }}</span></div>
              <p class="student-request-reason"><strong>Reason:</strong> {{ request.reason }}</p>
              <p v-if="request.reviewerNote" class="export-request-note">Administrator note: {{ request.reviewerNote }}</p>
              <div v-if="request.status === 'pending'" class="export-request-actions">
                <button type="button" class="btn btn-primary export-request-action" :disabled="activeStudentRequestId === request.id" @click="reviewStudentAccountRequest(request, 'approved')"><i class="fas" :class="activeStudentRequestId === request.id ? 'fa-spinner fa-spin' : 'fa-check'"></i> Approve</button>
                <button type="button" class="btn btn-outline export-request-action export-request-action--reject" :disabled="activeStudentRequestId === request.id" @click="reviewStudentAccountRequest(request, 'rejected')"><i class="fas fa-xmark"></i> Reject</button>
              </div>
            </article>
          </div>
        </section>
        <footer>© 2026 EduMatch</footer>
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
const requests = ref([])
const activeRequestActionId = ref('')
const studentAccountRequests = ref([])
const studentAccountRequestsLoading = ref(false)
const activeStudentRequestId = ref('')
const feedbackMessage = ref('')
const feedbackTone = ref('success')

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

const pendingStudentAccountRequestCount = computed(() => studentAccountRequests.value.filter((request) => request.status === 'pending').length)

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
  if (!silent) {
    loading.value = true
  }

  try {
    const response = await axios.get(`${apiBaseUrl}/admin/export-requests/archived-pdf`, {
      ...getAuthConfig(),
      params: { limit: REQUEST_FETCH_LIMIT },
    })

    requests.value = Array.isArray(response.data?.requests) ? response.data.requests : []
  } catch (error) {
    if (!silent) {
      setFeedback(error.response?.data?.message || 'Failed to load requests.', 'error')
    }
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

const fetchStudentAccountRequests = async ({ silent = false } = {}) => {
  if (!silent) studentAccountRequestsLoading.value = true
  try {
    const response = await axios.get(`${apiBaseUrl}/admin/student-account-requests`, { ...getAuthConfig(), params: { limit: REQUEST_FETCH_LIMIT } })
    studentAccountRequests.value = Array.isArray(response.data?.requests) ? response.data.requests : []
  } catch (error) {
    if (!silent) setFeedback(error.response?.data?.message || 'Failed to load student account requests.', 'error')
  } finally {
    if (!silent) studentAccountRequestsLoading.value = false
  }
}

const formatStudentRequestStatus = (status) => ({ pending: 'Pending', approved: 'Approved', rejected: 'Rejected', completed: 'Completed' })[status] || 'Unknown'
const getStudentRequestStatusClass = (status) => status === 'completed' || status === 'approved' ? 'is-approved' : status === 'rejected' ? 'is-rejected' : 'is-pending'

const reviewStudentAccountRequest = async (request, decision) => {
  const destructiveAction = decision === 'approved' && request.action === 'delete'
  const message = destructiveAction
    ? `Permanently delete ${request.studentName || 'this student'} and associated records? This cannot be undone.`
    : `${decision === 'approved' ? 'Approve' : 'Reject'} the ${request.action} request from ${request.studentName || 'this student'}?`
  if (!window.confirm(message)) return
  let confirmation = ''
  if (destructiveAction) {
    confirmation = window.prompt(`Type ${request.studentEmail} to confirm permanent deletion:`, '') || ''
    if (confirmation.trim().toLowerCase() !== String(request.studentEmail || '').trim().toLowerCase()) {
      setFeedback('Deletion cancelled because the email confirmation did not match.', 'error')
      return
    }
  }
  const note = window.prompt('Optional administrator note:', '')
  if (note === null) return
  activeStudentRequestId.value = request.id
  try {
    const response = await axios.patch(`${apiBaseUrl}/admin/student-account-requests/${encodeURIComponent(request.id)}/review`, { decision, note, confirmation }, getAuthConfig())
    setFeedback(response.data?.message || 'Student account request reviewed.')
    await fetchStudentAccountRequests({ silent: true })
  } catch (error) {
    setFeedback(error.response?.data?.message || 'Failed to review student account request.', 'error')
  } finally {
    activeStudentRequestId.value = ''
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
  fetchStudentAccountRequests()

  autoRefreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchRequests({ silent: true })
      fetchStudentAccountRequests({ silent: true })
    }
  }, AUTO_REFRESH_INTERVAL_MS)

  visibilityChangeHandler = () => {
    if (document.visibilityState === 'visible') {
      fetchRequests({ silent: true })
      fetchStudentAccountRequests({ silent: true })
    }
  }

  document.addEventListener('visibilitychange', visibilityChangeHandler)
  window.addEventListener('focus', fetchRequests)
  window.addEventListener('focus', fetchStudentAccountRequests)
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
  window.removeEventListener('focus', fetchStudentAccountRequests)

  if (autoRefreshTimer) {
    window.clearInterval(autoRefreshTimer)
  }

  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer)
  }
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";

@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

@import '../../styles/roles/admin.tailwind.css';


.request-hero {
  @apply tw:flex!;
  @apply tw:items-center!;
  @apply tw:justify-between!;
  @apply tw:[gap:1.5rem]!;
  @apply tw:[margin-bottom:1rem]!;
  @apply tw:[padding:1.4rem_1.5rem]!;
  @apply tw:[border:1px_solid_#d7e7d0]!;
  @apply tw:[border-radius:20px]!;
  @apply tw:[background:radial-gradient(circle_at_92%_18%,_rgba(105,_170,_71,_0.18),_transparent_28%),_____linear-gradient(140deg,_#ffffff_0%,_#f6faf3_100%)]!;
  @apply tw:[box-shadow:0_10px_28px_rgba(49,_95,_35,_0.07)]!;
}

.request-hero .header-left {
  @apply tw:[max-width:760px];
}

.request-hero h2 {
  @apply tw:[margin:0]!;
  @apply tw:[color:#172033]!;
  @apply tw:[font-size:clamp(1.55rem,_3vw,_2rem)]!;
  @apply tw:[font-weight:760]!;
  @apply tw:[letter-spacing:-0.035em]!;
}

.request-hero .header-left > p {
  @apply tw:[max-width:680px];
  @apply tw:[margin:0.45rem_0_0]!;
  @apply tw:[color:#64748b]!;
  @apply tw:[font-size:0.9rem]!;
  @apply tw:[line-height:1.6]!;
}

.request-summary-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.85rem];
  @apply tw:[margin-bottom:1rem];
}

.request-summary-card {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
  @apply tw:[min-width:0];
  @apply tw:[padding:1rem]!;
  @apply tw:[border:1px_solid_#69aa47]!;
  @apply tw:[border-radius:16px]!;
  @apply tw:[background:#ffffff]!;
  @apply tw:[box-shadow:0_5px_16px_rgba(15,_23,_42,_0.04)]!;
}

.admin-dashboard.admin-request-page .request-summary-grid > .request-summary-card {
  @apply tw:[border-color:#69aa47]!;
}

.request-summary-top {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
}

.request-summary-icon {
  @apply tw:inline-grid;
  @apply tw:[width:30px];
  @apply tw:[height:30px];
  @apply tw:[flex:0_0_30px];
  @apply tw:place-items-center;
  @apply tw:[border-radius:9px];
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.75rem];
}

.request-summary-label {
  @apply tw:overflow-hidden;
  @apply tw:[color:#59677a];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:750];
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

.request-summary-value {
  @apply tw:flex;
  @apply tw:items-baseline;
  @apply tw:[gap:0.4rem];
}

.request-summary-value strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.65rem];
  @apply tw:[line-height:1];
  @apply tw:[letter-spacing:-0.04em];
}

.request-summary-value span {
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:650];
}

.request-summary-card p {
  @apply tw:[margin:0];
  @apply tw:[color:#7b8797];
  @apply tw:[font-size:0.72rem];
  @apply tw:[line-height:1.4];
}

.request-summary-card--pending {
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[background:linear-gradient(145deg,_#ffffff_0%,_#fff9f0_100%)]!;
}

.request-summary-card--pending .request-summary-icon {
  @apply tw:[background:#fff0d9];
  @apply tw:[color:#b45309];
}

.request-summary-card--approved {
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[background:linear-gradient(145deg,_#ffffff_0%,_#f2fbef_100%)]!;
}

.request-summary-card--approved .request-summary-icon {
  @apply tw:[background:#e2f5dc];
  @apply tw:[color:#397127];
}

.request-summary-card--closed .request-summary-icon {
  @apply tw:[background:#eef2f6];
  @apply tw:[color:#59677a];
}

.request-board {
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[padding:1.15rem]!;
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[border-radius:18px]!;
}

.request-board-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:flex-wrap;
}

.request-board-eyebrow {
  @apply tw:block;
  @apply tw:[margin-bottom:0.25rem];
  @apply tw:[color:#4f8a35];
  @apply tw:[font-size:0.66rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.1em];
  @apply tw:uppercase;
}

.request-toolbar {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(260px,_1fr)_minmax(170px,_220px)_auto];
  @apply tw:[align-items:end];
  @apply tw:[gap:0.75rem];
  @apply tw:[padding:0.85rem];
  @apply tw:[border:1px_solid_#e1e8ee];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f8fafc];
}

.request-search-field,
.request-status-field {
  @apply tw:grid;
  @apply tw:[min-width:0];
  @apply tw:[gap:0.35rem];
}

.request-search-field label,
.request-status-field label {
  @apply tw:[color:#59677a];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:750];
}

.request-search-control {
  @apply tw:relative;
}

.request-search-control i {
  @apply tw:absolute;
  @apply tw:[top:50%];
  @apply tw:[left:0.85rem];
  @apply tw:[transform:translateY(-50%)];
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.8rem];
  @apply tw:pointer-events-none;
}

.request-search,
.request-status-field .filter-select {
  @apply tw:w-full;
  @apply tw:[min-height:42px]!;
  @apply tw:[border:1px_solid_#dce3ea]!;
  @apply tw:[border-radius:10px]!;
  @apply tw:[background:#ffffff]!;
  @apply tw:[color:#172033]!;
  @apply tw:[font-size:0.8rem]!;
}

.request-search {
  @apply tw:[padding:0.65rem_0.8rem_0.65rem_2.35rem];
}

.request-search:focus,
.request-status-field .filter-select:focus {
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[outline:none];
  @apply tw:[box-shadow:0_0_0_3px_rgba(105,_170,_71,_0.13)]!;
}

.request-toolbar-actions {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-end;
  @apply tw:[gap:0.5rem];
}

.request-apply-btn,
.request-reset-btn {
  @apply tw:[min-height:42px];
  @apply tw:[border-radius:10px]!;
  @apply tw:whitespace-nowrap;
}

.request-apply-btn {
  @apply tw:[border:1px_solid_#4f8a35]!;
  @apply tw:[background:#4f8a35]!;
  @apply tw:[color:#ffffff]!;
}

.request-apply-btn:hover:not(:disabled) {
  @apply tw:[border-color:#477d30]!;
  @apply tw:[background:#477d30]!;
}

.request-reset-btn {
  @apply tw:[border:1px_solid_#d4dde6]!;
  @apply tw:[background:#ffffff]!;
  @apply tw:[color:#59677a]!;
}

.request-board-header h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#172033];
  @apply tw:[font-size:1.1rem];
  @apply tw:[font-weight:750];
}

.request-board-header p {
  @apply tw:[margin:0.25rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.5];
}

.request-count-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.45rem_0.75rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:750];
}

.request-count-pill.has-pending {
  @apply tw:[border-color:#fdba74];
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#9a3412];
}

.request-feedback {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[border-radius:16px];
  @apply tw:[font-size:0.9rem];
  @apply tw:[font-weight:600];
}

.request-feedback--success {
  @apply tw:[border:1px_solid_#86efac];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
}

.request-feedback--error {
  @apply tw:[border:1px_solid_#fca5a5];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
}

.request-empty-state {
  @apply tw:grid;
  @apply tw:[min-height:240px];
  @apply tw:[padding:2rem_1rem];
  @apply tw:place-items-center;
  @apply tw:content-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[border-radius:16px];
  @apply tw:[color:#64748b];
  @apply tw:[background:#f8fafc];
  @apply tw:text-center;
}

.request-empty-icon {
  @apply tw:inline-grid;
  @apply tw:[width:58px];
  @apply tw:[height:58px];
  @apply tw:[margin-bottom:0.25rem];
  @apply tw:place-items-center;
  @apply tw:[border-radius:17px];
  @apply tw:[background:#edf7e9];
  @apply tw:[color:#4f8a35];
  @apply tw:[font-size:1.3rem];
}

.request-empty-state strong {
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.95rem];
}

.request-empty-state p {
  @apply tw:[max-width:420px];
  @apply tw:[margin:0];
  @apply tw:[color:#7b8797];
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.5];
}

.request-empty-state .request-reset-btn {
  @apply tw:[margin-top:0.45rem];
}

.export-request-list {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(320px,_1fr))];
  @apply tw:[gap:1rem];
}

.export-request-card {
  @apply tw:grid;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:1.05rem];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_5px_16px_rgba(15,_23,_42,_0.04)];
}

.export-request-card.is-pending {
  @apply tw:[border-color:#fdba74];
  @apply tw:[box-shadow:0_14px_28px_rgba(249,_115,_22,_0.08)];
}

.export-request-card.is-approved {
  @apply tw:[border-color:#86efac];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f0fdf4_100%)];
}

.export-request-card.is-rejected,
.export-request-card.is-expired {
  @apply tw:[border-color:#fca5a5];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#fef2f2_100%)];
}

.export-request-card.is-fulfilled {
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
}

.export-request-top {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.export-request-top h4 {
  @apply tw:[margin:0];
  @apply tw:[font-size:0.98rem];
}

.export-request-top p {
  @apply tw:[margin:0.25rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.82rem];
}

.export-request-status {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.45rem_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}

.export-request-status.is-pending {
  @apply tw:[border-color:#fdba74];
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#9a3412];
}

.export-request-status.is-approved {
  @apply tw:[border-color:#86efac];
  @apply tw:[background:#ecfdf5];
  @apply tw:[color:#166534];
}

.export-request-status.is-rejected,
.export-request-status.is-expired {
  @apply tw:[border-color:#fca5a5];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
}

.export-request-status.is-fulfilled {
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
}

.export-request-meta {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.export-request-meta span,
.export-request-review,
.export-request-expiry,
.export-request-note {
  @apply tw:[margin:0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.5];
}

.export-request-meta span {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.55rem];
}

.export-request-meta i {
  @apply tw:[margin-top:0.12rem];
  @apply tw:[color:#64748b];
}

.export-request-expiry {
  @apply tw:[color:#166534];
  @apply tw:[font-weight:600];
}

.export-request-note {
  @apply tw:[color:#334155];
}

.student-account-request-board { @apply tw:[margin-top:1rem]; }
.student-request-reason { @apply tw:[margin:0]; @apply tw:[color:#475569]; @apply tw:[line-height:1.55]; }

.export-request-actions {
  @apply tw:flex;
  @apply tw:[gap:0.65rem];
  @apply tw:flex-wrap;
}

.export-request-action {
  @apply tw:[min-height:42px];
}

.export-request-action--reject {
  @apply tw:[border-color:#fca5a5]!;
  @apply tw:[color:#b91c1c]!;
}

@media (max-width: 1024px) {
  .request-summary-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .request-toolbar {
    @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(170px,_210px)];
  }

  .request-toolbar-actions {
    @apply tw:[grid-column:1_/_-1];
  }
}

@media (max-width: 768px) {
  .request-hero {
    @apply tw:items-stretch!;
    @apply tw:flex-col;
    @apply tw:[padding:1.1rem]!;
  }

  .request-board-header {
    @apply tw:items-stretch;
  }

  .request-toolbar {
    @apply tw:[grid-template-columns:1fr];
  }

  .request-toolbar-actions {
    @apply tw:[grid-column:1];
    @apply tw:justify-stretch;
  }

  .request-toolbar-actions .btn {
    @apply tw:flex-auto;
  }
}

@media (max-width: 640px) {
  .request-summary-grid {
    @apply tw:[gap:0.65rem];
  }

  .request-summary-card {
    @apply tw:[padding:0.85rem]!;
  }

  .request-board {
    @apply tw:[padding:0.9rem]!;
  }

  .export-request-list {
    @apply tw:[grid-template-columns:1fr];
  }
}

@media (max-width: 480px) {
  .request-summary-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .request-board-header {
    @apply tw:flex-col;
  }

  .request-count-pill {
    @apply tw:w-fit;
  }
}

</style>
