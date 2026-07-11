<template>
  <div class="teacher-dashboard secretary-dashboard-page">
    <aside id="secretary-sidebar-drawer" class="teacher-sidebar" :class="{ active: isSidebarOpen }">
      <div class="sidebar-header">
        <div class="teacher-logo">
          <div class="secretary-logo-icon">
            <img src="/logo.png" alt="EduMatch" class="secretary-logo-img" />
          </div>
          <div class="teacher-logo-text">
            <h2>EduMatch</h2>
            <p>Secretary Portal</p>
          </div>
        </div>
        <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <h4 class="nav-section-title">Workspace</h4>
          <router-link to="/secretary/dashboard" class="nav-link" :class="{ active: route.path === '/secretary/dashboard' }" @click="closeSidebar">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/secretary/users" class="nav-link" :class="{ active: route.path === '/secretary/users' }" @click="closeSidebar">
            <i class="fas fa-users"></i>
            <span>Teacher Monitoring</span>
          </router-link>
          <router-link to="/secretary/students" class="nav-link" :class="{ active: route.path === '/secretary/students' }" @click="closeSidebar">
            <i class="fas fa-user-graduate"></i>
            <span>Student Records</span>
          </router-link>
          <router-link to="/secretary/archived" class="nav-link" :class="{ active: route.path === '/secretary/archived' }" @click="closeSidebar">
            <i class="fas fa-box-archive"></i>
            <span>Archived</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="teacher-profile">
          <div class="teacher-avatar">
            <img :src="avatarUrl" :alt="displayName">
          </div>
          <div class="teacher-info">
            <h5>{{ displayName }}</h5>
            <p class="teacher-role">Secretary</p>
            <div class="teacher-status">
              <span class="status-indicator active"></span>
              <span>Archive access</span>
            </div>
            <div class="secretary-sidebar-chip">Historical Records</div>
          </div>
        </div>
      </div>
    </aside>

    <button v-if="isSidebarOpen" type="button" class="sidebar-backdrop" @click="closeSidebar" aria-label="Close sidebar"></button>

    <main class="teacher-main secretary-main dashboard-container">
      <header class="top-header secretary-top-header dashboard-header">
        <div class="header-content secretary-header-content dashboard-header-content">
          <div class="header-left secretary-header-copy dashboard-header-copy">
            <button type="button" class="mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar">
              <i class="fas fa-bars"></i>
            </button>
            <div>
              <h1>Archived Student Records</h1>
              <p class="header-subtitle">Review inactive student accounts archived by school year for retrieval and historical tracking.</p>
            </div>
            <div class="secretary-access-chip">
              <i class="fas fa-clock-rotate-left"></i>
              <span>Historical archive</span>
            </div>
          </div>

          <div class="secretary-header-tools">
            <div ref="accountMenuRef" class="account-menu secretary-account-menu">
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

      <section v-if="banner.message" class="secretary-banner" :class="banner.type">
        <i class="fas" :class="banner.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"></i>
        <span>{{ banner.message }}</span>
      </section>

      <section class="section-card dashboard-panel secretary-userlist-panel">
        <div class="secretary-section-head">
          <div>
            <h2 class="section-title">Archive Directory</h2>
            <p class="toolbar-subtitle">Search archived learners by school year, grade, department, adviser, or the secretary who archived them.</p>
          </div>
          <div class="secretary-summary-meta">
            <span>{{ filteredStudents.length }} records</span>
            <span class="secretary-approval-pill" :class="pdfApprovalToneClass">{{ pdfApprovalStatusLabel }}</span>
          </div>
        </div>

        <div class="secretary-search-row">
          <label class="secretary-search-field">
            <i class="fas fa-search"></i>
            <input v-model.trim="searchTerm" type="search" placeholder="Search archived records" aria-label="Search archived student records">
          </label>
          <div class="secretary-export-actions">
            <button
              type="button"
              class="secretary-export-btn"
              :disabled="filteredStudents.length === 0"
              @click="exportArchivedCsv"
            >
              <i class="fas fa-file-csv"></i>
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              class="secretary-export-btn secretary-export-btn-pdf"
              :class="pdfApprovalToneClass"
              :disabled="isPdfExportActionDisabled"
              @click="handleArchivedPdfAction"
            >
              <i class="fas" :class="pdfExportButtonIcon"></i>
              <span>{{ pdfExportButtonLabel }}</span>
            </button>
            <p class="secretary-export-note">{{ pdfExportHelperText }}</p>
          </div>
        </div>

        <div class="secretary-filter-bar secretary-archive-filter-bar">
          <label class="secretary-filter-group">
            <span>School Year</span>
            <select v-model="filters.schoolYear">
              <option value="all">All School Years</option>
              <option v-for="schoolYear in schoolYearOptions" :key="schoolYear" :value="schoolYear">{{ schoolYear }}</option>
            </select>
          </label>

          <label class="secretary-filter-group">
            <span>Department</span>
            <select v-model="filters.department">
              <option value="all">All Departments</option>
              <option v-for="department in departmentOptions" :key="department" :value="department">{{ department }}</option>
            </select>
          </label>
        </div>

        <div class="secretary-table-wrap">
          <table class="secretary-table secretary-student-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>School Year</th>
                <th>Archived On</th>
                <th>Section</th>
                <th>Grade</th>
                <th>Adviser / Teacher</th>
                <th>Archived By</th>
              </tr>
            </thead>
            <tbody v-if="isLoading">
              <tr>
                <td colspan="7">
                  <div class="table-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading archived student records...</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="filteredStudents.length === 0">
              <tr>
                <td colspan="7">
                  <div class="table-state">
                    <i class="fas fa-folder-open"></i>
                    <span>No archived student records found.</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-for="student in filteredStudents" :key="student.id">
                <td>
                  <div class="secretary-person-cell">
                    <span class="secretary-person-avatar">{{ getUserInitials(student.name) }}</span>
                    <div class="secretary-person-copy">
                      <strong>{{ student.name }}</strong>
                      <small>{{ student.email }}</small>
                    </div>
                  </div>
                </td>
                <td><span class="secretary-badge archive-school-year-badge">{{ student.archive.schoolYear || 'Not tagged' }}</span></td>
                <td><span class="secretary-last-login-chip">{{ formatShortDate(student.archive.archivedAt) }}</span></td>
                <td><span class="secretary-badge department-badge">{{ student.section?.name || 'No section' }}</span></td>
                <td><span class="secretary-badge department-badge">{{ student.gradeLevel || 'Not set' }}</span></td>
                <td>
                  <div class="secretary-adviser-cell">
                    <strong>{{ student.adviser?.name || 'No adviser assigned' }}</strong>
                    <small>{{ student.adviser?.subject || student.adviser?.department || 'No teacher information' }}</small>
                  </div>
                </td>
                <td>
                  <div class="secretary-adviser-cell">
                    <strong>{{ student.archive.archivedBy?.name || 'System' }}</strong>
                    <small>{{ student.archive.archivedBy?.email || 'No email recorded' }}</small>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isLoading = ref(false)
const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const searchTerm = ref('')
const students = ref([])
const banner = ref({ type: 'success', message: '' })
const currentPdfExportRequest = ref(null)
const isRequestingPdfApproval = ref(false)
const isUsingPdfApproval = ref(false)
const accountMenuRef = ref(null)
const filters = ref({ schoolYear: 'all', department: 'all', gradeLevel: 'all' })
const CORE_DEPARTMENTS = ['Mathematics', 'English', 'Science', 'TLE', 'Filipino', 'Araling Panlipunan', 'Edukasyon sa Pagpapakatao (ESP)', 'MAPEH']
const PDF_APPROVAL_STATUS_LABELS = {
  none: 'Approval required',
  pending: 'Approval pending',
  approved: 'Approved to export',
  rejected: 'Request rejected',
  fulfilled: 'Approval used',
  expired: 'Approval expired',
}
let pdfApprovalStatusRefreshTimer = null
let pdfApprovalPollingTimer = null

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'Secretary').trim())
const avatarUrl = computed(() => {
  const profileImage = String(authStore.user?.profileImage || '').trim()
  if (profileImage) return profileImage
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=334155&color=fff`
})

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}
const getAuthConfig = () => ({ headers: { Authorization: `Bearer ${authStore.token}` } })
const getUserInitials = (name) => String(name || '').trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'A'
const setBanner = (type, message) => {
  banner.value = {
    type,
    message: String(message || '').trim(),
  }
}
const formatShortDate = (value) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed)
}
const formatDateTime = (value) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}
const buildExportFileName = (suffix, extension) => {
  const stamp = new Date().toISOString().slice(0, 10)
  return `secretary-archived-records-${suffix}-${stamp}.${extension}`
}
const escapeCsvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
const downloadBlob = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const schoolYearOptions = computed(() => Array.from(new Set(
  students.value.map((student) => String(student.archive?.schoolYear || '').trim()).filter(Boolean)
)).sort((left, right) => right.localeCompare(left)))

const departmentOptions = computed(() => {
  const merged = new Set(CORE_DEPARTMENTS)
  students.value.map((student) => String(student.department || '').trim()).filter(Boolean).forEach((department) => merged.add(department))
  return Array.from(merged).sort((left, right) => left.localeCompare(right))
})

const gradeOptions = computed(() => Array.from(new Set(
  students.value.map((student) => String(student.gradeLevel || '').trim()).filter(Boolean)
)).sort((left, right) => left.localeCompare(right)))

const filteredStudents = computed(() => {
  const query = String(searchTerm.value || '').trim().toLowerCase()
  return students.value.filter((student) => {
    const matchesSchoolYear = filters.value.schoolYear === 'all' || String(student.archive?.schoolYear || '').trim() === filters.value.schoolYear
    const matchesDepartment = filters.value.department === 'all' || String(student.department || '').trim() === filters.value.department
    const matchesGrade = filters.value.gradeLevel === 'all' || String(student.gradeLevel || '').trim() === filters.value.gradeLevel
    const haystack = [
      student.name,
      student.email,
      student.archive?.schoolYear,
      student.section?.name,
      student.department,
      student.gradeLevel,
      student.adviser?.name,
      student.archive?.archivedBy?.name,
    ].map((value) => String(value || '').toLowerCase()).join(' ')
    return matchesSchoolYear && matchesDepartment && matchesGrade && (!query || haystack.includes(query))
  })
})

const getArchivedExportRows = () => filteredStudents.value.map((student) => ({
  Student: student.name || 'N/A',
  Email: student.email || 'N/A',
  'School Year': student.archive?.schoolYear || 'Not tagged',
  'Archived On': formatShortDate(student.archive?.archivedAt),
  Section: student.section?.name || 'No section',
  Grade: student.gradeLevel || 'Not set',
  Department: student.department || 'Not assigned',
  Adviser: student.adviser?.name || 'No adviser assigned',
  'Adviser Subject': student.adviser?.subject || student.adviser?.department || 'No teacher information',
  'Archived By': student.archive?.archivedBy?.name || 'System',
  'Archived By Email': student.archive?.archivedBy?.email || 'No email recorded',
}))

const buildArchivedPdfApprovalPayload = () => ({
  schoolYear: filters.value.schoolYear,
  department: filters.value.department,
  gradeLevel: filters.value.gradeLevel,
  searchTerm: searchTerm.value,
})

const pdfApprovalStatus = computed(() => {
  const normalized = String(currentPdfExportRequest.value?.status || '').trim().toLowerCase()
  return normalized || 'none'
})

const pdfApprovalStatusLabel = computed(() => PDF_APPROVAL_STATUS_LABELS[pdfApprovalStatus.value] || 'Approval required')

const pdfApprovalToneClass = computed(() => {
  if (pdfApprovalStatus.value === 'approved') return 'is-approved'
  if (pdfApprovalStatus.value === 'pending') return 'is-pending'
  if (['rejected', 'expired'].includes(pdfApprovalStatus.value)) return 'is-rejected'
  return 'is-neutral'
})

const pdfExportButtonLabel = computed(() => {
  if (isUsingPdfApproval.value) return 'Preparing PDF...'
  if (isRequestingPdfApproval.value) return 'Sending Request...'
  if (pdfApprovalStatus.value === 'approved') return 'Export PDF'
  if (pdfApprovalStatus.value === 'pending') return 'Approval Pending'
  return 'Request PDF Export'
})

const pdfExportButtonIcon = computed(() => {
  if (isUsingPdfApproval.value || isRequestingPdfApproval.value) return 'fa-spinner fa-spin'
  if (pdfApprovalStatus.value === 'approved') return 'fa-file-pdf'
  if (pdfApprovalStatus.value === 'pending') return 'fa-clock'
  return 'fa-user-shield'
})

const isPdfExportActionDisabled = computed(() => (
  filteredStudents.value.length === 0
  || isRequestingPdfApproval.value
  || isUsingPdfApproval.value
  || pdfApprovalStatus.value === 'pending'
))

const pdfExportHelperText = computed(() => {
  if (!filteredStudents.value.length) {
    return 'No archived student records match the current filters for PDF export.'
  }

  if (pdfApprovalStatus.value === 'approved') {
    const expiresAt = currentPdfExportRequest.value?.expiresAt
    return expiresAt
      ? `Admin approved this export. Use it before ${formatDateTime(expiresAt)}.`
      : 'Admin approved this export. You can print the PDF now.'
  }

  if (pdfApprovalStatus.value === 'pending') {
    return 'Your request is waiting for admin approval. The button will unlock once it is approved.'
  }

  if (pdfApprovalStatus.value === 'rejected') {
    return 'The last request for this filtered archive view was rejected. Submit a new request to try again.'
  }

  if (pdfApprovalStatus.value === 'fulfilled') {
    return 'That approval was already used. Submit a new request for another PDF export.'
  }

  if (pdfApprovalStatus.value === 'expired') {
    return 'The previous approval expired or the archive data changed. Submit a new request to export again.'
  }

  return 'PDF export requires admin approval for the current archived record filters.'
})

const exportRowsToCsv = (rows, fileName) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ]
  downloadBlob(`\uFEFF${lines.join('\r\n')}`, fileName, 'text/csv;charset=utf-8;')
}

const buildArchivePdfDocument = () => {
  const exportedAt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date())
  const filterSummary = [
    filters.value.schoolYear !== 'all' ? `School Year: ${filters.value.schoolYear}` : 'School Year: All',
    filters.value.department !== 'all' ? `Department: ${filters.value.department}` : 'Department: All',
    filters.value.gradeLevel !== 'all' ? `Grade: ${filters.value.gradeLevel}` : 'Grade: All',
    searchTerm.value ? `Search: ${searchTerm.value}` : 'Search: None',
  ]
  const rowsHtml = filteredStudents.value.map((student) => `
    <tr>
      <td>${escapeHtml(student.name || 'N/A')}</td>
      <td>${escapeHtml(student.email || 'N/A')}</td>
      <td>${escapeHtml(student.archive?.schoolYear || 'Not tagged')}</td>
      <td>${escapeHtml(formatShortDate(student.archive?.archivedAt))}</td>
      <td>${escapeHtml(student.section?.name || 'No section')}</td>
      <td>${escapeHtml(student.gradeLevel || 'Not set')}</td>
      <td>${escapeHtml(student.adviser?.name || 'No adviser assigned')}</td>
      <td>${escapeHtml(student.archive?.archivedBy?.name || 'System')}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Archived Student Records</title>
    <style>
      body {
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 24px;
        color: #0f172a;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 22px;
      }
      p {
        margin: 0 0 8px;
        color: #475569;
        font-size: 13px;
      }
      .meta {
        margin: 16px 0;
        padding: 12px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: #f8fafc;
      }
      .meta strong {
        display: block;
        margin-bottom: 6px;
        color: #0f172a;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #e2e8f0;
      }
      @media print {
        body {
          margin: 12px;
        }
      }
    </style>
  </head>
  <body>
    <h1>Archived Student Records</h1>
    <p>Secretary archive export generated on ${escapeHtml(exportedAt)}.</p>
    <div class="meta">
      <strong>${filteredStudents.value.length} archived record${filteredStudents.value.length === 1 ? '' : 's'}</strong>
      <p>${escapeHtml(filterSummary.join(' | '))}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Email</th>
          <th>School Year</th>
          <th>Archived On</th>
          <th>Section</th>
          <th>Grade</th>
          <th>Adviser</th>
          <th>Archived By</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </body>
</html>`
}

const exportArchivedCsv = () => {
  exportRowsToCsv(getArchivedExportRows(), buildExportFileName('filtered', 'csv'))
}

const exportArchivedPdf = (printWindow = null) => {
  if (!filteredStudents.value.length) return
  const targetWindow = printWindow || window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800')
  if (!targetWindow) {
    setBanner('error', 'Allow pop-ups in your browser to export the archived PDF.')
    return
  }
  targetWindow.document.open()
  targetWindow.document.write(buildArchivePdfDocument())
  targetWindow.document.close()
  targetWindow.focus()
  targetWindow.onload = () => {
    targetWindow.print()
  }
}

const stopPdfApprovalPolling = () => {
  if (!pdfApprovalPollingTimer) return
  window.clearInterval(pdfApprovalPollingTimer)
  pdfApprovalPollingTimer = null
}

const syncPdfApprovalPolling = () => {
  stopPdfApprovalPolling()
  if (pdfApprovalStatus.value !== 'pending') return
  pdfApprovalPollingTimer = window.setInterval(() => {
    fetchArchivedPdfExportRequestStatus({ silent: true })
  }, 15000)
}

const fetchArchivedPdfExportRequestStatus = async ({ silent = false } = {}) => {
  if (!authStore.token) {
    currentPdfExportRequest.value = null
    stopPdfApprovalPolling()
    return
  }

  const previousStatus = pdfApprovalStatus.value
  try {
    const response = await axios.get(
      `${resolveApiBaseUrl()}/secretary/students/archived/export-requests/current`,
      {
        ...getAuthConfig(),
        params: buildArchivedPdfApprovalPayload(),
      }
    )
    currentPdfExportRequest.value = response.data?.request || null

    const nextStatus = pdfApprovalStatus.value
    if (previousStatus !== nextStatus) {
      if (nextStatus === 'approved') {
        setBanner('success', 'Admin approved your archived PDF export request. You can export it now.')
      } else if (nextStatus === 'rejected') {
        setBanner('error', 'Admin rejected this archived PDF export request. Submit a new one if you still need the document.')
      } else if (nextStatus === 'expired') {
        setBanner('error', 'The archived PDF export approval expired. Submit a new request to continue.')
      }
    }
  } catch (error) {
    currentPdfExportRequest.value = null
    if (!silent) {
      const message = String(error?.response?.data?.message || error?.message || 'Unable to check PDF export approval status right now.').trim()
      setBanner('error', message)
    }
  } finally {
    syncPdfApprovalPolling()
  }
}

const schedulePdfApprovalStatusRefresh = () => {
  if (pdfApprovalStatusRefreshTimer) {
    window.clearTimeout(pdfApprovalStatusRefreshTimer)
  }

  pdfApprovalStatusRefreshTimer = window.setTimeout(() => {
    fetchArchivedPdfExportRequestStatus({ silent: true })
  }, 250)
}

const requestArchivedPdfApproval = async () => {
  if (!filteredStudents.value.length || isRequestingPdfApproval.value) return false

  isRequestingPdfApproval.value = true
  try {
    const response = await axios.post(
      `${resolveApiBaseUrl()}/secretary/students/archived/export-requests`,
      buildArchivedPdfApprovalPayload(),
      getAuthConfig()
    )
    currentPdfExportRequest.value = response.data?.request || null

    if (pdfApprovalStatus.value === 'approved') {
      setBanner('success', 'This archived PDF export is already approved. Click Export PDF again to continue.')
      return true
    }

    setBanner(
      'success',
      String(response.data?.message || 'Archived PDF export request sent to admin successfully.').trim()
    )
    return false
  } catch (error) {
    const message = String(error?.response?.data?.message || error?.message || 'Unable to request archived PDF export approval right now.').trim()
    setBanner('error', message)
    return false
  } finally {
    isRequestingPdfApproval.value = false
    syncPdfApprovalPolling()
  }
}

const consumeArchivedPdfApproval = async () => {
  const requestId = String(currentPdfExportRequest.value?.id || '').trim()
  if (!requestId || isUsingPdfApproval.value) return false

  isUsingPdfApproval.value = true
  try {
    const response = await axios.post(
      `${resolveApiBaseUrl()}/secretary/students/archived/export-requests/${requestId}/consume`,
      {},
      getAuthConfig()
    )
    currentPdfExportRequest.value = response.data?.request || null
    return true
  } catch (error) {
    const message = String(error?.response?.data?.message || error?.message || 'Unable to validate the archived PDF export approval right now.').trim()
    setBanner('error', message)
    await fetchArchivedPdfExportRequestStatus({ silent: true })
    return false
  } finally {
    isUsingPdfApproval.value = false
  }
}

const handleArchivedPdfAction = async () => {
  if (!filteredStudents.value.length) return

  if (pdfApprovalStatus.value !== 'approved') {
    await requestArchivedPdfApproval()
    return
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800')
  if (!printWindow) {
    setBanner('error', 'Allow pop-ups in your browser before exporting the approved PDF.')
    return
  }

  const isApprovalValid = await consumeArchivedPdfApproval()
  if (!isApprovalValid) {
    printWindow.close()
    return
  }

  exportArchivedPdf(printWindow)
  setBanner('success', 'Archived PDF export is ready.')
}

const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }
const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }
const goToProfile = () => { isAccountMenuOpen.value = false; if (route.path !== '/secretary/profile') router.push('/secretary/profile') }
const goToSettings = () => { isAccountMenuOpen.value = false; if (route.path !== '/secretary/settings') router.push('/secretary/settings') }
const handleLogout = () => { isAccountMenuOpen.value = false; authStore.logout(); router.push('/auth/login') }
const handleAccountMenuClickOutside = (event) => {
  const target = event?.target
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  isAccountMenuOpen.value = false
}

const fetchArchivedStudents = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/secretary/students/archived`, getAuthConfig())
    const payload = Array.isArray(response.data?.students) ? response.data.students : []
    students.value = payload.map((student) => ({
      id: student.id || student._id,
      name: student.name || '',
      email: student.email || '',
      department: student.department || '',
      section: student.section || null,
      gradeLevel: student.gradeLevel || '',
      adviser: student.adviser || null,
      archive: {
        schoolYear: student.archive?.schoolYear || '',
        archivedAt: student.archive?.archivedAt || null,
        archivedBy: student.archive?.archivedBy || null,
      },
    }))
    await fetchArchivedPdfExportRequestStatus({ silent: true })
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [searchTerm.value, filters.value.schoolYear, filters.value.department, filters.value.gradeLevel],
  () => {
    currentPdfExportRequest.value = null
    stopPdfApprovalPolling()
    schedulePdfApprovalStatusRefresh()
  }
)

onMounted(() => {
  document.addEventListener('click', handleAccountMenuClickOutside)
  fetchArchivedStudents()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountMenuClickOutside)
  stopPdfApprovalPolling()
  if (pdfApprovalStatusRefreshTimer) {
    window.clearTimeout(pdfApprovalStatusRefreshTimer)
    pdfApprovalStatusRefreshTimer = null
  }
})
</script>

<style scoped>
.secretary-top-header { padding: 0.9rem 1rem !important; border-radius: 18px !important; }
.secretary-header-content { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.secretary-header-copy { display: flex; align-items: center; gap: 0.9rem; flex: 1 1 auto; min-width: 0; }
.secretary-header-copy > div { min-width: 0; }
.secretary-header-copy h1 { margin: 0; font-size: 1.35rem; line-height: 1.15; }
.secretary-header-copy .header-subtitle { margin-top: 0.2rem; font-size: 0.86rem; line-height: 1.45; }
.secretary-header-tools { display: flex; align-items: center; gap: 0.6rem; margin-left: auto; flex: 0 0 auto; }
.secretary-access-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.75rem; border-radius: 999px; background: #ede9fe; color: #6d28d9; font-size: 0.78rem; font-weight: 700; }
.secretary-banner {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0 0 1rem;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  border: 1px solid transparent;
  font-size: 0.92rem;
  font-weight: 600;
}
.secretary-banner.success {
  background: #ecfdf5;
  border-color: #86efac;
  color: #166534;
}
.secretary-banner.error {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}
.secretary-header-copy .mobile-menu-toggle, .secretary-header-tools .account-menu-trigger { width: 40px; height: 40px; min-width: 40px; border-radius: 12px; }
.secretary-search-row { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; margin-bottom: 1rem; }
.secretary-search-field { flex: 1 1 320px; display: flex; align-items: center; gap: 0.65rem; padding: 0.85rem 1rem; border: 1px solid #cbd5e1; border-radius: 14px; background: #fff; }
.secretary-search-field input { width: 100%; border: none; outline: none; background: transparent; }
.secretary-summary-meta { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
.secretary-approval-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.76rem;
  font-weight: 700;
}
.secretary-approval-pill.is-approved {
  background: #ecfdf5;
  border-color: #86efac;
  color: #166534;
}
.secretary-approval-pill.is-pending {
  background: #fff7ed;
  border-color: #fdba74;
  color: #9a3412;
}
.secretary-approval-pill.is-rejected {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}
.secretary-export-actions { display: flex; gap: 0.65rem; flex-wrap: wrap; }
.secretary-export-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 46px;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 700;
  white-space: nowrap;
}
.secretary-export-btn:hover { border-color: #94a3b8; background: #f8fafc; }
.secretary-export-btn:disabled { cursor: not-allowed; opacity: 0.6; }
.secretary-export-btn-pdf { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.secretary-export-btn-pdf:hover { border-color: #fca5a5; background: #fee2e2; }
.secretary-export-btn-pdf.is-approved {
  border-color: #86efac;
  background: #ecfdf5;
  color: #166534;
}
.secretary-export-btn-pdf.is-approved:hover {
  border-color: #4ade80;
  background: #dcfce7;
}
.secretary-export-btn-pdf.is-pending {
  border-color: #fdba74;
  background: #fff7ed;
  color: #9a3412;
}
.secretary-export-btn-pdf.is-rejected {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #b91c1c;
}
.secretary-export-note {
  flex: 1 1 100%;
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.5;
}
.secretary-archive-filter-bar { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.secretary-person-cell { display: flex; align-items: center; gap: 0.8rem; min-width: 240px; }
.secretary-person-avatar { width: 42px; height: 42px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #6d28d9, #9333ea); color: #ffffff; font-size: 0.84rem; font-weight: 800; flex-shrink: 0; }
.secretary-person-copy { display: grid; gap: 0.15rem; }
.secretary-person-copy small, .secretary-adviser-cell small { color: #64748b; font-size: 0.78rem; }
.secretary-adviser-cell { display: grid; gap: 0.2rem; min-width: 180px; }
.archive-school-year-badge { background: #ede9fe; color: #6d28d9; border: 1px solid #d8b4fe; }

@media (max-width: 768px) {
  .secretary-header-copy > div, .secretary-access-chip { display: none; }
  .secretary-header-content { display: grid !important; grid-template-columns: 38px minmax(0, 1fr) 38px; align-items: center !important; gap: 0.75rem !important; width: 100%; }
  .secretary-header-copy { display: flex !important; align-items: center !important; justify-content: flex-start !important; gap: 0 !important; grid-column: 1; flex: 0 0 auto !important; min-width: 0; width: auto; }
  .secretary-header-tools { display: flex !important; align-items: center !important; justify-content: flex-end !important; gap: 0.75rem !important; grid-column: 3; margin-left: 0 !important; flex: 0 0 auto !important; min-width: 0; }
  .secretary-header-copy .mobile-menu-toggle, .secretary-header-tools .account-menu-trigger { width: 38px; height: 38px; min-width: 38px; border-radius: 12px; }
  .secretary-export-actions { width: 100%; }
  .secretary-archive-filter-bar { grid-template-columns: 1fr; }
  .secretary-table { min-width: 920px; }
}
</style>
