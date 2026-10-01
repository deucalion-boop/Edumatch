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
          <router-link to="/secretary/teachers" class="nav-link" :class="{ active: route.path === '/secretary/teachers' }" @click="closeSidebar">
            <i class="fas fa-users"></i>
            <span>Teacher Monitoring</span>
          </router-link>
          <router-link to="/secretary/users" class="nav-link" :class="{ active: route.path === '/secretary/users' }" @click="closeSidebar">
            <i class="fas fa-user-cog"></i>
            <span>User Management</span>
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
import archivePrintStyles from '../../styles/export/archive-print.tailwind.css?inline'

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
    <style>${archivePrintStyles}</style>
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
@reference "../../styles/tailwind.css";

.secretary-archived-page .secretary-table-wrap {
  @apply tw:[scrollbar-width:thin];
  @apply tw:[scrollbar-color:#6f9c7a_transparent];
}

.secretary-archived-page .secretary-table-wrap::-webkit-scrollbar {
  @apply tw:[height:6px];
}

.secretary-archived-page .secretary-table-wrap::-webkit-scrollbar-track {
  @apply tw:[background:transparent];
}

.secretary-archived-page .secretary-table-wrap::-webkit-scrollbar-thumb {
  @apply tw:[background:#6f9c7a];
  @apply tw:[border-radius:999px];
}

.secretary-archived-page .secretary-table-wrap::-webkit-scrollbar-thumb:hover {
  @apply tw:[background:#4f805d];
}

.secretary-archived-page .secretary-student-table {
  @apply tw:[min-width:1120px];
}

.secretary-archived-page .secretary-student-table th,
.secretary-archived-page .secretary-student-table td {
  @apply tw:[padding:0.9rem_1rem];
}

.secretary-top-header { @apply tw:[padding:0.9rem_1rem]!; @apply tw:[border-radius:18px]!; }
.secretary-header-content { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:1rem]; }
.secretary-header-copy { @apply tw:flex; @apply tw:items-center; @apply tw:[gap:0.9rem]; @apply tw:flex-auto; @apply tw:[min-width:0]; }
.secretary-header-copy > div { @apply tw:[min-width:0]; }
.secretary-header-copy h1 { @apply tw:[margin:0]; @apply tw:[font-size:1.35rem]; @apply tw:[line-height:1.15]; }
.secretary-header-copy .header-subtitle { @apply tw:[margin-top:0.2rem]; @apply tw:[font-size:0.86rem]; @apply tw:[line-height:1.45]; }
.secretary-header-tools { @apply tw:flex; @apply tw:items-center; @apply tw:[gap:0.6rem]; @apply tw:ml-auto; @apply tw:flex-none; }
.secretary-access-chip { @apply tw:inline-flex; @apply tw:items-center; @apply tw:[gap:0.4rem]; @apply tw:[padding:0.45rem_0.75rem]; @apply tw:[border-radius:999px]; @apply tw:[background:#ede9fe]; @apply tw:[color:#6d28d9]; @apply tw:[font-size:0.78rem]; @apply tw:[font-weight:700]; }
.secretary-banner {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
  @apply tw:[margin:0_0_1rem];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[font-size:0.92rem];
  @apply tw:[font-weight:600];
}
.secretary-banner.success {
  @apply tw:[background:#ecfdf5];
  @apply tw:[border-color:#86efac];
  @apply tw:[color:#166534];
}
.secretary-banner.error {
  @apply tw:[background:#fef2f2];
  @apply tw:[border-color:#fca5a5];
  @apply tw:[color:#b91c1c];
}
.secretary-header-copy .mobile-menu-toggle, .secretary-header-tools .account-menu-trigger { @apply tw:[width:40px]; @apply tw:[height:40px]; @apply tw:[min-width:40px]; @apply tw:[border-radius:12px]; }
.secretary-userlist-panel {
  @apply tw:[margin-bottom:1rem];
  @apply tw:[padding:1.5rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[border-radius:28px];
  @apply tw:[background:linear-gradient(#ffffff,_#ffffff)_padding-box,_____linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!;
  @apply tw:[box-shadow:0_18px_42px_rgba(47,_111,_67,_0.08)];
}
.secretary-section-head {
  @apply tw:[margin-bottom:1.25rem];
  @apply tw:[padding-bottom:1rem];
  @apply tw:[border-bottom:1px_solid_#91b99b];
}
.secretary-directory-tools {
  @apply tw:[margin-bottom:1.25rem];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#dce7df];
  @apply tw:[border-radius:22px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f7faf8_100%)];
}
.secretary-search-row {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(280px,_1fr)_auto];
  @apply tw:[align-items:start];
  @apply tw:[gap:1rem];
  @apply tw:[margin:0];
  @apply tw:[padding:1rem_1.1rem];
  @apply tw:[border:0];
  @apply tw:[border-bottom:1px_solid_#e5ede7];
  @apply tw:rounded-none;
  @apply tw:[background:rgba(255,_255,_255,_0.86)];
}
.secretary-search-field {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[padding:0.85rem_1rem];
  @apply tw:[border:1px_solid_#7fac8a];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#fff];
  @apply tw:[color:#39794d];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease];
}
.secretary-search-field:focus-within {
  @apply tw:[border-color:#47855a];
  @apply tw:[box-shadow:0_0_0_3px_rgba(71,_133,_90,_0.16)];
}
.secretary-search-field input { @apply tw:w-full; @apply tw:[border:none]; @apply tw:[outline:none]; @apply tw:[background:transparent]; }
.secretary-summary-meta { @apply tw:flex; @apply tw:items-center; @apply tw:[gap:0.65rem]; @apply tw:flex-wrap; }
.secretary-summary-meta > span:first-child {
  @apply tw:[padding:0.45rem_0.8rem];
  @apply tw:[border:1px_solid_#78a985];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#dcecdf];
  @apply tw:[color:#356f48];
  @apply tw:[font-size:0.85rem];
  @apply tw:[font-weight:600];
}
.secretary-approval-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.45rem_0.75rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
}
.secretary-approval-pill.is-approved {
  @apply tw:[background:#ecfdf5];
  @apply tw:[border-color:#86efac];
  @apply tw:[color:#166534];
}
.secretary-approval-pill.is-pending {
  @apply tw:[background:#fff7ed];
  @apply tw:[border-color:#fdba74];
  @apply tw:[color:#9a3412];
}
.secretary-approval-pill.is-rejected {
  @apply tw:[background:#fef2f2];
  @apply tw:[border-color:#fca5a5];
  @apply tw:[color:#b91c1c];
}
.secretary-export-actions {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_max-content)];
  @apply tw:[gap:0.55rem_0.65rem];
  @apply tw:[align-items:start];
}
.secretary-export-btn {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[min-height:46px];
  @apply tw:[padding:0.75rem_1rem];
  @apply tw:[border:1px_solid_#78a985];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#356f48];
  @apply tw:[font-size:0.86rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}
.secretary-export-btn:hover { @apply tw:[border-color:#589b6b]; @apply tw:[background:#dcecdf]; }
.secretary-export-btn:disabled { @apply tw:cursor-not-allowed; @apply tw:[opacity:0.6]; }
.secretary-export-btn-pdf { @apply tw:[border-color:#fecaca]; @apply tw:[background:#fef2f2]; @apply tw:[color:#b91c1c]; }
.secretary-export-btn-pdf:hover { @apply tw:[border-color:#fca5a5]; @apply tw:[background:#fee2e2]; }
.secretary-export-btn-pdf.is-approved {
  @apply tw:[border-color:#86efac];
  @apply tw:[background:#ecfdf5];
  @apply tw:[color:#166534];
}
.secretary-export-btn-pdf.is-approved:hover {
  @apply tw:[border-color:#4ade80];
  @apply tw:[background:#dcfce7];
}
.secretary-export-btn-pdf.is-pending {
  @apply tw:[border-color:#fdba74];
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#9a3412];
}
.secretary-export-btn-pdf.is-rejected {
  @apply tw:[border-color:#fca5a5];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
}
.secretary-export-note {
  @apply tw:[grid-column:1_/_-1];
  @apply tw:[max-width:430px];
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.5];
}
.secretary-filter-bar {
  @apply tw:[margin:0];
  @apply tw:[padding:1rem_1.1rem_1.1rem];
  @apply tw:[border:0];
  @apply tw:rounded-none;
  @apply tw:[background:transparent];
}
.secretary-filter-group span {
  @apply tw:[color:#356f48];
}
.secretary-filter-group select {
  @apply tw:[border-color:#7fac8a];
  @apply tw:[outline:none];
}
.secretary-filter-group select:focus {
  @apply tw:[border-color:#47855a];
  @apply tw:[box-shadow:0_0_0_3px_rgba(71,_133,_90,_0.16)];
}
.secretary-archive-filter-bar {
  @apply tw:[grid-template-columns:repeat(2,_minmax(200px,_300px))];
  @apply tw:[justify-content:start];
}
.secretary-table-wrap {
  @apply tw:overflow-x-auto;
  @apply tw:[border:1px_solid_#a9c5b0];
  @apply tw:[border-radius:22px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_14px_32px_rgba(47,_111,_67,_0.1)];
}
.secretary-student-table {
  @apply tw:table-fixed;
}
.secretary-student-table .archive-col-student { @apply tw:[width:25%]; }
.secretary-student-table .archive-col-year { @apply tw:[width:11%]; }
.secretary-student-table .archive-col-date { @apply tw:[width:12%]; }
.secretary-student-table .archive-col-section { @apply tw:[width:11%]; }
.secretary-student-table .archive-col-grade { @apply tw:[width:9%]; }
.secretary-student-table .archive-col-adviser { @apply tw:[width:17%]; }
.secretary-student-table .archive-col-owner { @apply tw:[width:15%]; }
.secretary-table thead th {
  @apply tw:[background:linear-gradient(180deg,_#f2f8f3_0%,_#e9f3eb_100%)];
  @apply tw:[border-bottom:1px_solid_#a9c5b0];
  @apply tw:[color:#356f48];
  @apply tw:[font-size:0.72rem];
  @apply tw:[letter-spacing:0.055em];
}
.secretary-table tbody td {
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[line-height:1.4];
}
.secretary-table tbody tr {
  @apply tw:[transition:background-color_0.18s_ease];
}
.secretary-table tbody tr:hover td {
  @apply tw:[background:#edf5ef];
}
.secretary-person-cell { @apply tw:flex; @apply tw:items-center; @apply tw:[gap:0.8rem]; @apply tw:[min-width:240px]; }
.secretary-person-avatar { @apply tw:[width:42px]; @apply tw:[height:42px]; @apply tw:[border-radius:50%]; @apply tw:inline-flex; @apply tw:items-center; @apply tw:justify-center; @apply tw:[background:#ffffff]; @apply tw:[border:1px_solid_#245b13]; @apply tw:[color:#245b13]; @apply tw:[font-size:1.1rem]; @apply tw:shrink-0; @apply tw:[box-shadow:none]; }
.secretary-person-copy { @apply tw:grid; @apply tw:[gap:0.15rem]; }
.secretary-person-copy small, .secretary-adviser-cell small { @apply tw:[color:#64748b]; @apply tw:[font-size:0.78rem]; }
.secretary-adviser-cell { @apply tw:grid; @apply tw:[gap:0.2rem]; @apply tw:[min-width:180px]; }
.archive-school-year-badge { @apply tw:[background:#dcecdf]; @apply tw:[color:#356f48]; @apply tw:[border:1px_solid_#78a985]; }
.table-state {
  @apply tw:[min-height:230px];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:2rem];
  @apply tw:[color:#64748b];
  @apply tw:text-center;
}
.table-state > .fa-spinner {
  @apply tw:[margin-bottom:0.35rem];
  @apply tw:[color:#47855a];
  @apply tw:[font-size:1.55rem];
}
.table-state-icon {
  @apply tw:[width:58px];
  @apply tw:[height:58px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[margin-bottom:0.4rem];
  @apply tw:[border:1px_solid_#bad0c0];
  @apply tw:[border-radius:50%];
  @apply tw:[background:#edf5ef];
  @apply tw:[color:#39794d];
  @apply tw:[font-size:1.25rem];
}
.table-state strong {
  @apply tw:[color:#274d32];
  @apply tw:[font-size:1rem];
}
.table-state small {
  @apply tw:[max-width:430px];
  @apply tw:[color:#718096];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.55];
}

@media (max-width: 1100px) {
  .secretary-search-row {
    @apply tw:[grid-template-columns:1fr];
  }

  .secretary-export-actions {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_max-content))];
  }
}

@media (max-width: 768px) {
  .secretary-header-copy > div, .secretary-access-chip { @apply tw:hidden; }
  .secretary-header-content { @apply tw:grid!; @apply tw:[grid-template-columns:38px_minmax(0,_1fr)_38px]; @apply tw:items-center!; @apply tw:[gap:0.75rem]!; @apply tw:w-full; }
  .secretary-header-copy { @apply tw:flex!; @apply tw:items-center!; @apply tw:justify-start!; @apply tw:[gap:0]!; @apply tw:[grid-column:1]; @apply tw:flex-none!; @apply tw:[min-width:0]; @apply tw:w-auto; }
  .secretary-header-tools { @apply tw:flex!; @apply tw:items-center!; @apply tw:justify-end!; @apply tw:[gap:0.75rem]!; @apply tw:[grid-column:3]; @apply tw:[margin-left:0]!; @apply tw:flex-none!; @apply tw:[min-width:0]; }
  .secretary-header-copy .mobile-menu-toggle, .secretary-header-tools .account-menu-trigger { @apply tw:[width:38px]; @apply tw:[height:38px]; @apply tw:[min-width:38px]; @apply tw:[border-radius:12px]; }
  .secretary-userlist-panel { @apply tw:[padding:1rem]; @apply tw:[border-radius:22px]; }
  .secretary-directory-tools, .secretary-table-wrap { @apply tw:[border-radius:18px]; }
  .secretary-search-row { @apply tw:[padding:0.85rem]; }
  .secretary-export-actions { @apply tw:w-full; @apply tw:[grid-template-columns:1fr]; }
  .secretary-export-actions .secretary-export-btn { @apply tw:w-full; }
  .secretary-export-note { @apply tw:[grid-column:1]; }
  .secretary-filter-bar { @apply tw:[padding:0.85rem]; }
  .secretary-archive-filter-bar { @apply tw:[grid-template-columns:1fr]; }
  .secretary-table { @apply tw:[min-width:1120px]; }
}

</style>
