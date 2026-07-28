<template>
  <div class="teacher-dashboard secretary-dashboard-page secretary-archived-page">
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
        <div class="secretary-profile">
          <div class="secretary-avatar">
            <i class="fas fa-user" aria-hidden="true"></i>
          </div>
          <div class="secretary-info">
            <h5>{{ displayName }}</h5>
            <div class="secretary-profile-meta">
              <p class="secretary-role">Secretary</p>
              <div class="secretary-status">
                <span class="secretary-profile-status-indicator active"></span>
                <span>active</span>
              </div>
            </div>
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

        <div class="secretary-directory-tools">
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
        </div>

        <div class="secretary-table-wrap">
          <table class="secretary-table secretary-student-table" aria-label="Archived student records">
            <colgroup>
              <col class="archive-col-student">
              <col class="archive-col-year">
              <col class="archive-col-date">
              <col class="archive-col-section">
              <col class="archive-col-grade">
              <col class="archive-col-adviser">
              <col class="archive-col-owner">
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">School Year</th>
                <th scope="col">Archived On</th>
                <th scope="col">Section</th>
                <th scope="col">Grade</th>
                <th scope="col">Adviser / Teacher</th>
                <th scope="col">Archived By</th>
              </tr>
            </thead>
            <tbody v-if="isLoading">
              <tr>
                <td colspan="7">
                  <div class="table-state" role="status">
                    <i class="fas fa-spinner fa-spin"></i>
                    <strong>Loading archived records</strong>
                    <small>Please wait while the directory is updated.</small>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="filteredStudents.length === 0">
              <tr>
                <td colspan="7">
                  <div class="table-state" role="status">
                    <span class="table-state-icon"><i class="fas fa-box-open"></i></span>
                    <strong>No archived records found</strong>
                    <small>Try changing your search or filters, or check again after a learner is archived.</small>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-for="student in filteredStudents" :key="student.id">
                <td>
                  <div class="secretary-person-cell">
                    <div class="secretary-person-avatar">
                      <i class="fas fa-user" aria-hidden="true"></i>
                    </div>
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
const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}
const getAuthConfig = () => ({ headers: { Authorization: `Bearer ${authStore.token}` } })
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
.secretary-archived-page .secretary-table-wrap {
  scrollbar-width: thin;
  scrollbar-color: #6f9c7a transparent;
}

.secretary-archived-page .secretary-table-wrap::-webkit-scrollbar {
  height: 6px;
}

.secretary-archived-page .secretary-table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.secretary-archived-page .secretary-table-wrap::-webkit-scrollbar-thumb {
  background: #6f9c7a;
  border-radius: 999px;
}

.secretary-archived-page .secretary-table-wrap::-webkit-scrollbar-thumb:hover {
  background: #4f805d;
}

.secretary-archived-page .secretary-student-table {
  min-width: 1120px;
}

.secretary-archived-page .secretary-student-table th,
.secretary-archived-page .secretary-student-table td {
  padding: 0.9rem 1rem;
}

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
.secretary-userlist-panel {
  margin-bottom: 1rem;
  padding: 1.5rem;
  border: 1px solid transparent;
  border-radius: 28px;
  background:
    linear-gradient(#ffffff, #ffffff) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box !important;
  box-shadow: 0 18px 42px rgba(47, 111, 67, 0.08);
}
.secretary-section-head {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #91b99b;
}
.secretary-directory-tools {
  margin-bottom: 1.25rem;
  overflow: hidden;
  border: 1px solid #dce7df;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f7faf8 100%);
}
.secretary-search-row {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) auto;
  align-items: start;
  gap: 1rem;
  margin: 0;
  padding: 1rem 1.1rem;
  border: 0;
  border-bottom: 1px solid #e5ede7;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.86);
}
.secretary-search-field {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border: 1px solid #7fac8a;
  border-radius: 14px;
  background: #fff;
  color: #39794d;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.secretary-search-field:focus-within {
  border-color: #47855a;
  box-shadow: 0 0 0 3px rgba(71, 133, 90, 0.16);
}
.secretary-search-field input { width: 100%; border: none; outline: none; background: transparent; }
.secretary-summary-meta { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
.secretary-summary-meta > span:first-child {
  padding: 0.45rem 0.8rem;
  border: 1px solid #78a985;
  border-radius: 999px;
  background: #dcecdf;
  color: #356f48;
  font-size: 0.85rem;
  font-weight: 600;
}
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
.secretary-export-actions {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 0.55rem 0.65rem;
  align-items: start;
}
.secretary-export-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 46px;
  padding: 0.75rem 1rem;
  border: 1px solid #78a985;
  border-radius: 14px;
  background: #ffffff;
  color: #356f48;
  font-size: 0.86rem;
  font-weight: 700;
  white-space: nowrap;
}
.secretary-export-btn:hover { border-color: #589b6b; background: #dcecdf; }
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
  grid-column: 1 / -1;
  max-width: 430px;
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.5;
}
.secretary-filter-bar {
  margin: 0;
  padding: 1rem 1.1rem 1.1rem;
  border: 0;
  border-radius: 0;
  background: transparent;
}
.secretary-filter-group span {
  color: #356f48;
}
.secretary-filter-group select {
  border-color: #7fac8a;
  outline: none;
}
.secretary-filter-group select:focus {
  border-color: #47855a;
  box-shadow: 0 0 0 3px rgba(71, 133, 90, 0.16);
}
.secretary-archive-filter-bar {
  grid-template-columns: repeat(2, minmax(200px, 300px));
  justify-content: start;
}
.secretary-table-wrap {
  overflow-x: auto;
  border: 1px solid #a9c5b0;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(47, 111, 67, 0.1);
}
.secretary-student-table {
  table-layout: fixed;
}
.secretary-student-table .archive-col-student { width: 25%; }
.secretary-student-table .archive-col-year { width: 11%; }
.secretary-student-table .archive-col-date { width: 12%; }
.secretary-student-table .archive-col-section { width: 11%; }
.secretary-student-table .archive-col-grade { width: 9%; }
.secretary-student-table .archive-col-adviser { width: 17%; }
.secretary-student-table .archive-col-owner { width: 15%; }
.secretary-table thead th {
  background: linear-gradient(180deg, #f2f8f3 0%, #e9f3eb 100%);
  border-bottom: 1px solid #a9c5b0;
  color: #356f48;
  font-size: 0.72rem;
  letter-spacing: 0.055em;
}
.secretary-table tbody td {
  padding: 0.95rem 1rem;
  line-height: 1.4;
}
.secretary-table tbody tr {
  transition: background-color 0.18s ease;
}
.secretary-table tbody tr:hover td {
  background: #edf5ef;
}
.secretary-person-cell { display: flex; align-items: center; gap: 0.8rem; min-width: 240px; }
.secretary-person-avatar { width: 42px; height: 42px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #ffffff; border: 1px solid #245b13; color: #245b13; font-size: 1.1rem; flex-shrink: 0; box-shadow: none; }
.secretary-person-copy { display: grid; gap: 0.15rem; }
.secretary-person-copy small, .secretary-adviser-cell small { color: #64748b; font-size: 0.78rem; }
.secretary-adviser-cell { display: grid; gap: 0.2rem; min-width: 180px; }
.archive-school-year-badge { background: #dcecdf; color: #356f48; border: 1px solid #78a985; }
.table-state {
  min-height: 230px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 2rem;
  color: #64748b;
  text-align: center;
}
.table-state > .fa-spinner {
  margin-bottom: 0.35rem;
  color: #47855a;
  font-size: 1.55rem;
}
.table-state-icon {
  width: 58px;
  height: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.4rem;
  border: 1px solid #bad0c0;
  border-radius: 50%;
  background: #edf5ef;
  color: #39794d;
  font-size: 1.25rem;
}
.table-state strong {
  color: #274d32;
  font-size: 1rem;
}
.table-state small {
  max-width: 430px;
  color: #718096;
  font-size: 0.82rem;
  line-height: 1.55;
}

@media (max-width: 1100px) {
  .secretary-search-row {
    grid-template-columns: 1fr;
  }

  .secretary-export-actions {
    grid-template-columns: repeat(2, minmax(0, max-content));
  }
}

@media (max-width: 768px) {
  .secretary-header-copy > div, .secretary-access-chip { display: none; }
  .secretary-header-content { display: grid !important; grid-template-columns: 38px minmax(0, 1fr) 38px; align-items: center !important; gap: 0.75rem !important; width: 100%; }
  .secretary-header-copy { display: flex !important; align-items: center !important; justify-content: flex-start !important; gap: 0 !important; grid-column: 1; flex: 0 0 auto !important; min-width: 0; width: auto; }
  .secretary-header-tools { display: flex !important; align-items: center !important; justify-content: flex-end !important; gap: 0.75rem !important; grid-column: 3; margin-left: 0 !important; flex: 0 0 auto !important; min-width: 0; }
  .secretary-header-copy .mobile-menu-toggle, .secretary-header-tools .account-menu-trigger { width: 38px; height: 38px; min-width: 38px; border-radius: 12px; }
  .secretary-userlist-panel { padding: 1rem; border-radius: 22px; }
  .secretary-directory-tools, .secretary-table-wrap { border-radius: 18px; }
  .secretary-search-row { padding: 0.85rem; }
  .secretary-export-actions { width: 100%; grid-template-columns: 1fr; }
  .secretary-export-actions .secretary-export-btn { width: 100%; }
  .secretary-export-note { grid-column: 1; }
  .secretary-filter-bar { padding: 0.85rem; }
  .secretary-archive-filter-bar { grid-template-columns: 1fr; }
  .secretary-table { min-width: 1120px; }
}
</style>
