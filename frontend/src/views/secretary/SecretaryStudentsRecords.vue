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
              <h1>Student Records</h1>
              <p class="header-subtitle">Track each learner's adviser, recommendation progress, and AI strand guidance in one place.</p>
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
            <h2 class="section-title">Student Progress Directory</h2>
            <p class="toolbar-subtitle">Review learner assignments, recommendation progress, and the strand suggested by AI.</p>
          </div>
          <div class="secretary-summary-meta">
            <span>{{ filteredStudents.length }} records</span>
          </div>
        </div>

        <div class="secretary-school-year-panel">
          <label class="secretary-filter-group">
            <span>Archive Label</span>
            <input
              v-model.trim="archiveSchoolYearInput"
              type="text"
              placeholder="2025-2026"
              aria-label="School year label"
            >
          </label>
          <div class="secretary-school-year-meta">
            <strong>{{ inactiveStudentCount }}</strong>
            <span>inactive student {{ inactiveStudentCount === 1 ? 'record is' : 'records are' }} ready to archive</span>
            <small>Ending the school year moves only inactive student accounts into the archive and tags them with this school year.</small>
          </div>
          <button
            type="button"
            class="secretary-archive-btn"
            :disabled="isArchiving || inactiveStudentCount === 0"
            @click="handleEndSchoolYear"
          >
            <i class="fas" :class="isArchiving ? 'fa-spinner fa-spin' : 'fa-box-archive'"></i>
            <span>{{ isArchiving ? 'Archiving...' : 'End School Year' }}</span>
          </button>
        </div>

        <div class="secretary-search-row">
          <label class="secretary-search-field">
            <i class="fas fa-search"></i>
            <input v-model.trim="searchTerm" type="search" placeholder="Search by student, section, adviser, department, or grade level" aria-label="Search student records">
          </label>
          <div class="secretary-export-actions">
            <button type="button" class="secretary-export-btn" @click="exportStudentsCsv">
              <i class="fas fa-file-csv"></i>
              <span>Export CSV</span>
            </button>
            <button type="button" class="secretary-export-btn secretary-export-btn-excel" @click="exportStudentsExcel">
              <i class="fas fa-file-excel"></i>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div class="secretary-filter-bar secretary-student-filter-bar">
          <label class="secretary-filter-group">
            <span>Department</span>
            <select v-model="filters.department">
              <option value="all">All Departments</option>
              <option v-for="department in departmentOptions" :key="department" :value="department">{{ department }}</option>
            </select>
          </label>

          <label class="secretary-filter-group">
            <span>Status</span>
            <select v-model="filters.status">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <div class="secretary-table-wrap">
          <table class="secretary-table secretary-student-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Section</th>
                <th>Grade</th>
                <th>Adviser / Teacher</th>
                <th>Recommendation Progress</th>
                <th>AI Recommendation</th>
              </tr>
            </thead>
            <tbody v-if="isLoading">
              <tr>
                <td colspan="6">
                  <div class="table-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading student records...</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="filteredStudents.length === 0">
              <tr>
                <td colspan="6">
                  <div class="table-state">
                    <i class="fas fa-folder-open"></i>
                    <span>No student records found.</span>
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
                <td><span class="secretary-badge department-badge">{{ student.section?.name || 'No section' }}</span></td>
                <td><span class="secretary-badge department-badge">{{ student.gradeLevel || 'Not set' }}</span></td>
                <td>
                  <div class="secretary-adviser-cell">
                    <strong>{{ student.adviser?.name || 'No adviser assigned' }}</strong>
                    <small>{{ student.adviser?.subject || student.adviser?.department || 'No teacher information' }}</small>
                  </div>
                </td>
                <td>
                  <div class="secretary-progress-cell">
                    <span class="secretary-progress-value">{{ student.recommendation.progressPercent }}%</span>
                    <div class="secretary-progress-bar" aria-hidden="true">
                      <span :style="{ width: `${student.recommendation.progressPercent}%` }"></span>
                    </div>
                    <small class="secretary-recommendation-note">{{ recommendationProgressNote(student.recommendation) }}</small>
                  </div>
                </td>
                <td>
                  <div class="secretary-recommendation-cell">
                    <span
                      class="secretary-recommendation-chip"
                      :class="student.recommendation.isReady ? 'ready' : (student.recommendation.status === 'in_progress' ? 'in-progress' : 'pending')"
                    >
                      {{ student.recommendation.name || 'Pending recommendation' }}
                    </span>
                    <small>
                      {{ student.recommendation.name
                        ? `${student.recommendation.confidence || 'Confidence pending'} confidence`
                        : 'Complete grading assessments to generate a recommendation.' }}
                    </small>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-if="isAttendanceModalOpen" class="modal-shell" @click.self="closeAttendanceModal">
        <div class="modal-panel secretary-attendance-modal">
          <div class="modal-panel-head secretary-attendance-modal-head">
            <div class="secretary-attendance-title-block">
              <span class="secretary-attendance-eyebrow">Attendance Details</span>
              <h3>{{ attendanceRecordTitle(selectedAttendanceRecord) }}</h3>
              <p>{{ selectedAttendanceRecord?.teacher?.name || 'Teacher' }} - {{ formatShortDate(selectedAttendanceRecord?.dateKey) }}</p>
              <p v-if="selectedAttendanceRecord?.section?.name" class="secretary-attendance-section-copy">Section {{ selectedAttendanceRecord.section.name }}</p>
            </div>

            <div class="secretary-attendance-summary-cards">
              <div class="secretary-attendance-summary-card status-present">
                <span>Present</span>
                <strong>{{ attendanceEntryGroups.Present.length }}</strong>
              </div>
              <div class="secretary-attendance-summary-card status-late">
                <span>Late</span>
                <strong>{{ attendanceEntryGroups.Late.length }}</strong>
              </div>
              <div class="secretary-attendance-summary-card status-absent">
                <span>Absent</span>
                <strong>{{ attendanceEntryGroups.Absent.length }}</strong>
              </div>
              <div class="secretary-attendance-summary-card status-excused">
                <span>Excused</span>
                <strong>{{ attendanceEntryGroups.Excused.length }}</strong>
              </div>
            </div>

            <button type="button" class="modal-close-btn secretary-attendance-close-btn" @click="closeAttendanceModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div v-if="selectedAttendanceEntries.length === 0" class="table-state secretary-attendance-modal-state">
            <i class="fas fa-user-check"></i>
            <span>No student attendance entries are available for this record.</span>
          </div>

          <div v-else class="secretary-attendance-groups">
            <section
              v-for="status in attendanceStatuses"
              :key="status"
              class="secretary-attendance-group"
            >
              <div class="secretary-attendance-group-head">
                <span class="secretary-attendance-status-pill" :class="`status-${status.toLowerCase()}`">{{ status }}</span>
                <strong>{{ attendanceEntryGroups[status].length }}</strong>
              </div>

              <div v-if="attendanceEntryGroups[status].length === 0" class="secretary-attendance-group-empty">
                No students marked {{ status.toLowerCase() }}.
              </div>

              <div v-else class="secretary-attendance-group-list">
                <article
                  v-for="entry in attendanceEntryGroups[status]"
                  :key="`${selectedAttendanceRecord?.id}-${status}-${entry.studentId}`"
                  class="secretary-attendance-student-row"
                >
                  <div class="secretary-attendance-student-copy">
                    <strong>{{ entry.studentName || 'Student' }}</strong>
                    <small>{{ entry.studentEmail || 'No email address' }}</small>
                  </div>
                  <div class="secretary-attendance-student-meta">
                    <span v-if="entry.gradeLevel" class="secretary-attendance-meta-pill">{{ entry.gradeLevel }}</span>
                    <span v-if="entry.sectionName" class="secretary-attendance-meta-pill">{{ entry.sectionName }}</span>
                    <span v-if="entry.department" class="secretary-attendance-meta-pill">{{ entry.department }}</span>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isLoading = ref(false)
const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const isAttendanceModalOpen = ref(false)
const isArchiving = ref(false)
const searchTerm = ref('')
const students = ref([])
const banner = ref({ type: 'success', message: '' })
const attendanceOverview = ref({
  summary: {
    totalRecords: 0,
    totalStudents: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
  },
  studentSummaries: [],
  recentRecords: [],
})
const accountMenuRef = ref(null)
const selectedAttendanceRecord = ref(null)
const filters = ref({ department: 'all', gradeLevel: 'all', status: 'all' })
const archiveSchoolYearInput = ref('')
const CORE_DEPARTMENTS = ['Mathematics', 'English', 'Science', 'TLE', 'Filipino', 'Araling Panlipunan', 'Edukasyon sa Pagpapakatao (ESP)', 'MAPEH']

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'Secretary').trim())
const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}
const getAuthConfig = () => ({ headers: { Authorization: `Bearer ${authStore.token}` } })
const normalizedStatus = (status) => String(status || '').trim().toLowerCase() === 'active' ? 'active' : 'inactive'
const clampPercent = (value) => Math.max(0, Math.min(100, Number(value || 0)))
const buildDefaultSchoolYearLabel = (date = new Date()) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const startYear = month >= 5 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}
const recommendationStatusLabel = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'ready') return 'Ready'
  if (normalized === 'in_progress') return 'In Progress'
  return 'Not Started'
}
const recommendationProgressNote = (recommendation) => {
  if (String(recommendation?.status || '').trim().toLowerCase() === 'ready') return 'Recommendation ready'

  const completedCount = Array.isArray(recommendation?.completedGradingPeriods)
    ? recommendation.completedGradingPeriods.length
    : 0
  const requiredCount = Array.isArray(recommendation?.requiredGradingPeriods)
    ? recommendation.requiredGradingPeriods.length
    : 0

  if (requiredCount > 0) return `${completedCount} of ${requiredCount} grading periods complete`
  if (clampPercent(recommendation?.progressPercent) > 0) return `${clampPercent(recommendation?.progressPercent)}% complete`
  return 'Waiting for assessments'
}
const normalizedSchoolYearLabel = computed(() => String(archiveSchoolYearInput.value || '').trim() || buildDefaultSchoolYearLabel())
const attendanceScopeLabel = (scope) => String(scope || '').trim().toLowerCase() === 'advisory_class'
  ? 'Advisory'
  : 'Handled Class'
const attendanceRecordTitle = (record) => String(
  record?.title
  || record?.subject?.className
  || record?.subject?.name
  || 'Attendance'
).trim() || 'Attendance'
const departmentOptions = computed(() => {
  const merged = new Set(CORE_DEPARTMENTS)
  students.value.map((student) => String(student.department || '').trim()).filter(Boolean).forEach((department) => merged.add(department))
  return Array.from(merged).sort((left, right) => left.localeCompare(right))
})

const gradeOptions = computed(() => {
  const merged = new Set(students.value.map((student) => String(student.gradeLevel || '').trim()).filter(Boolean))
  return Array.from(merged).sort((left, right) => left.localeCompare(right))
})

const inactiveStudentCount = computed(() => students.value.filter((student) => normalizedStatus(student.status) === 'inactive').length)

const filteredStudents = computed(() => {
  const query = String(searchTerm.value || '').trim().toLowerCase()
  return students.value.filter((student) => {
    const matchesDepartment = filters.value.department === 'all' || String(student.department || '').trim() === filters.value.department
    const matchesGrade = filters.value.gradeLevel === 'all' || String(student.gradeLevel || '').trim() === filters.value.gradeLevel
    const matchesStatus = filters.value.status === 'all' || normalizedStatus(student.status) === filters.value.status
    const haystack = [
      student.name,
      student.email,
      student.section?.name,
      student.department,
      student.gradeLevel,
      student.adviser?.name,
      student.adviser?.subject,
      student.adviser?.department,
      student.recommendation?.name,
      student.recommendation?.confidence,
      recommendationStatusLabel(student.recommendation?.status),
    ].map((value) => String(value || '').toLowerCase()).join(' ')
    return matchesDepartment && matchesGrade && matchesStatus && (!query || haystack.includes(query))
  })
})

const recentAttendanceRecords = computed(() => Array.isArray(attendanceOverview.value?.recentRecords) ? attendanceOverview.value.recentRecords.slice(0, 12) : [])
const attendanceStatuses = ['Present', 'Late', 'Absent', 'Excused']
const selectedAttendanceEntries = computed(() => {
  const entries = Array.isArray(selectedAttendanceRecord.value?.entries) ? selectedAttendanceRecord.value.entries : []
  return [...entries].sort((left, right) => String(left?.studentName || '').localeCompare(String(right?.studentName || '')))
})
const attendanceEntryGroups = computed(() => attendanceStatuses.reduce((groups, status) => {
  groups[status] = selectedAttendanceEntries.value.filter((entry) => String(entry?.status || '') === status)
  return groups
}, {
  Present: [],
  Late: [],
  Absent: [],
  Excused: [],
}))

const buildExportFileName = (suffix, extension) => {
  const stamp = new Date().toISOString().slice(0, 10)
  return `secretary-student-records-${suffix}-${stamp}.${extension}`
}

const getStudentsExportRows = () => filteredStudents.value.map((student) => ({
  Student: student.name || 'N/A',
  Email: student.email || 'N/A',
  Section: student.section?.name || 'No section',
  Grade: student.gradeLevel || 'Not set',
  Department: student.department || 'Not assigned',
  Adviser: student.adviser?.name || 'No adviser assigned',
  'Adviser Subject': student.adviser?.subject || student.adviser?.department || 'No teacher information',
  'Attendance Present or Late': `${Number(student.attendance.presentCount || 0) + Number(student.attendance.lateCount || 0)}/${Number(student.attendance.total || 0)}`,
  'Attendance Absent': Number(student.attendance.absentCount || 0),
  'Attendance Excused': Number(student.attendance.excusedCount || 0),
  'Last Attendance Status': student.attendance.lastStatus || 'No record',
  'Last Attendance Date': student.attendance.lastDate || 'No record',
  'Last Attendance Scope': attendanceScopeLabel(student.attendance.lastScope),
  Mastery: `${student.progress.masteryProgress}%`,
  'Average Score': `${student.progress.averageScore}%`,
  Assessments: student.progress.completedAssessments,
  'Recommendation Progress': `${student.recommendation.progressPercent}%`,
  'Recommendation Status': recommendationStatusLabel(student.recommendation.status),
  'AI Recommendation': student.recommendation.name || 'Pending recommendation',
  'Recommendation Confidence': student.recommendation.confidence || 'N/A',
  Status: normalizedStatus(student.status) === 'active' ? 'Active' : 'Inactive',
}))

const escapeCsvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

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

const exportRowsToCsv = (rows, fileName) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ]
  downloadBlob(`\uFEFF${lines.join('\r\n')}`, fileName, 'text/csv;charset=utf-8;')
}

const exportRowsToExcel = (rows, fileName) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const headerHtml = headers.map((header) => `<th>${header}</th>`).join('')
  const bodyHtml = rows.map((row) => (
    `<tr>${headers.map((header) => `<td>${String(row[header] ?? '')}</td>`).join('')}</tr>`
  )).join('')
  const workbook = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
  </head>
  <body>
    <table>
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  </body>
</html>`

  downloadBlob(workbook, fileName, 'application/vnd.ms-excel;charset=utf-8;')
}

const exportStudentsCsv = () => {
  exportRowsToCsv(getStudentsExportRows(), buildExportFileName('filtered', 'csv'))
}

const exportStudentsExcel = () => {
  exportRowsToExcel(getStudentsExportRows(), buildExportFileName('filtered', 'xls'))
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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

const openAttendanceModal = (record) => {
  selectedAttendanceRecord.value = record || null
  isAttendanceModalOpen.value = Boolean(selectedAttendanceRecord.value)
}

const closeAttendanceModal = () => {
  isAttendanceModalOpen.value = false
  selectedAttendanceRecord.value = null
}

const handleEndSchoolYear = async () => {
  const schoolYear = normalizedSchoolYearLabel.value
  if (!inactiveStudentCount.value || isArchiving.value) return

  const confirmed = window.confirm(
    `Archive ${inactiveStudentCount.value} inactive student record${inactiveStudentCount.value === 1 ? '' : 's'} for school year ${schoolYear}?`
  )
  if (!confirmed) return

  isArchiving.value = true
  setBanner('success', '')
  try {
    const response = await axios.post(
      `${resolveApiBaseUrl()}/secretary/students/end-school-year`,
      { schoolYear },
      getAuthConfig()
    )
    const archivedCount = Number(response.data?.archivedCount || response.data?.data?.archivedCount || 0)
    const resolvedSchoolYear = String(
      response.data?.schoolYear
      || response.data?.data?.schoolYear
      || schoolYear
    ).trim() || schoolYear
    setBanner(
      'success',
      archivedCount > 0
        ? `${archivedCount} inactive student record${archivedCount === 1 ? '' : 's'} archived under SY ${resolvedSchoolYear}.`
        : 'No inactive student records were available to archive.'
    )
    await fetchStudentRecords()
  } catch (error) {
    const message = String(error?.response?.data?.message || error?.message || 'Unable to archive student records right now.').trim()
    setBanner('error', message)
  } finally {
    isArchiving.value = false
  }
}

const fetchStudentRecords = async () => {
  isLoading.value = true
  try {
    const [studentsResponse, attendanceResponse] = await Promise.all([
      axios.get(`${resolveApiBaseUrl()}/secretary/students`, getAuthConfig()),
      axios.get(`${resolveApiBaseUrl()}/secretary/attendance`, getAuthConfig()),
    ])
    const payload = Array.isArray(studentsResponse.data?.students) ? studentsResponse.data.students : []
    const attendanceStudentSummaries = Array.isArray(attendanceResponse.data?.studentSummaries)
      ? attendanceResponse.data.studentSummaries
      : []
    const attendanceByStudentId = new Map(
      attendanceStudentSummaries.map((item) => [String(item.studentId || ''), item])
    )

    students.value = payload.map((student) => {
      const recommendation = student.recommendation || {}
      const recommendedStrand = recommendation.recommendedStrand || {}
      const progressPercent = clampPercent(recommendation.recommendationProgressPercent)

      return {
        id: student.id || student._id,
        name: student.name,
        email: student.email,
        department: student.department || '',
        section: student.section || null,
        gradeLevel: student.gradeLevel || '',
        status: student.status || 'inactive',
        adviser: student.adviser || null,
        progress: {
          masteryProgress: Number(student.progress?.masteryProgress || 0),
          averageScore: Number(student.progress?.averageScore || 0),
          completedAssessments: Number(student.progress?.completedAssessments || 0),
        },
        recommendation: {
          progressPercent,
          status: String(recommendation.recommendationStatus || '').trim() || (progressPercent > 0 ? 'in_progress' : 'not_started'),
          isReady: Boolean(recommendation.isRecommendationReady) || progressPercent >= 100,
          name: String(recommendedStrand.name || '').trim(),
          confidence: String(recommendedStrand.confidence || '').trim(),
          completedGradingPeriods: Array.isArray(recommendation.completedGradingPeriods) ? recommendation.completedGradingPeriods : [],
          requiredGradingPeriods: Array.isArray(recommendation.requiredGradingPeriods) ? recommendation.requiredGradingPeriods : [],
          explanation: String(recommendation.recommendationExplanation || '').trim(),
          updatedAt: recommendation.updatedAt || null,
        },
        attendance: {
          total: Number(attendanceByStudentId.get(String(student.id || student._id || ''))?.total || 0),
          presentCount: Number(attendanceByStudentId.get(String(student.id || student._id || ''))?.presentCount || 0),
          lateCount: Number(attendanceByStudentId.get(String(student.id || student._id || ''))?.lateCount || 0),
          absentCount: Number(attendanceByStudentId.get(String(student.id || student._id || ''))?.absentCount || 0),
          excusedCount: Number(attendanceByStudentId.get(String(student.id || student._id || ''))?.excusedCount || 0),
          lastStatus: attendanceByStudentId.get(String(student.id || student._id || ''))?.lastStatus || '',
          lastDate: attendanceByStudentId.get(String(student.id || student._id || ''))?.lastDate || '',
          lastScope: attendanceByStudentId.get(String(student.id || student._id || ''))?.lastScope || '',
        },
      }
    })
    attendanceOverview.value = {
      summary: attendanceResponse.data?.summary || attendanceOverview.value.summary,
      studentSummaries: attendanceStudentSummaries,
      recentRecords: Array.isArray(attendanceResponse.data?.recentRecords) ? attendanceResponse.data.recentRecords : [],
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleAccountMenuClickOutside)
  archiveSchoolYearInput.value = buildDefaultSchoolYearLabel()
  fetchStudentRecords()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountMenuClickOutside)
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";

.secretary-top-header {
  @apply tw:[padding:0.9rem_1rem]!;
  @apply tw:[border-radius:18px]!;
}

.secretary-header-content {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

.secretary-header-copy {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.9rem];
  @apply tw:flex-auto;
  @apply tw:[min-width:0];
}

.secretary-header-copy > div {
  @apply tw:[min-width:0];
}

.secretary-header-copy h1 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.35rem];
  @apply tw:[line-height:1.15];
}

.secretary-header-copy .header-subtitle {
  @apply tw:[margin-top:0.2rem];
  @apply tw:[font-size:0.86rem];
  @apply tw:[line-height:1.45];
}

.secretary-banner {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[margin-bottom:1rem];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_#dbe4ec];
  @apply tw:[background:#ffffff];
}

.secretary-banner.success {
  @apply tw:[color:#166534];
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#f0fdf4];
}

.secretary-banner.error {
  @apply tw:[color:#991b1b];
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:#fef2f2];
}

.secretary-header-tools {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.6rem];
  @apply tw:ml-auto;
  @apply tw:flex-none;
}

.secretary-access-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[padding:0.45rem_0.75rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e2e8f0];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:600];
}

.secretary-header-copy .mobile-menu-toggle,
.secretary-header-tools .account-menu-trigger {
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[min-width:40px];
  @apply tw:[border-radius:12px];
}

.secretary-userlist-panel {
  @apply tw:[margin-bottom:1rem];
  @apply tw:[padding:1.35rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[border-radius:24px];
  @apply tw:[background:linear-gradient(#ffffff,_#ffffff)_padding-box,_____linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!;
  @apply tw:[box-shadow:none];
}

.secretary-school-year-panel {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(190px,_230px)_minmax(280px,_1fr)_auto];
  @apply tw:[gap:1.25rem];
  @apply tw:items-center;
  @apply tw:[padding:1.1rem_1.2rem];
  @apply tw:[margin-bottom:1.2rem];
  @apply tw:[border:1px_solid_#80ad8b];
  @apply tw:[border-radius:20px];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(82,_146,_99,_0.24),_transparent_38%),_____linear-gradient(135deg,_#dcecdf_0%,_#eaf4ec_58%,_#f7faf7_100%)];
}

.secretary-school-year-panel input {
  @apply tw:w-full;
  @apply tw:[min-height:44px];
  @apply tw:[border:1px_solid_#78a985];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.68rem_0.78rem];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[outline:none];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease];
}

.secretary-school-year-panel input:focus {
  @apply tw:[border-color:#47855a];
  @apply tw:[box-shadow:0_0_0_3px_rgba(71,_133,_90,_0.18)];
}

.secretary-school-year-meta {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

.secretary-school-year-meta strong {
  @apply tw:[color:#2f6f43];
  @apply tw:[font-size:1.45rem];
  @apply tw:[line-height:1];
}

.secretary-school-year-meta span {
  @apply tw:[color:#356f48];
  @apply tw:[font-size:0.9rem];
  @apply tw:[font-weight:600];
}

.secretary-school-year-meta small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.45];
}

.secretary-archive-btn {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[min-height:46px];
  @apply tw:[padding:0.8rem_1.05rem];
  @apply tw:[border:1px_solid_#356f48];
  @apply tw:[border-radius:14px];
  @apply tw:[background:linear-gradient(135deg,_#589b6b,_#39794d)];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:0.86rem];
  @apply tw:[font-weight:800];
  @apply tw:whitespace-nowrap;
  @apply tw:cursor-pointer;
  @apply tw:[box-shadow:0_10px_22px_rgba(53,_111,_72,_0.22)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease];
}

.secretary-archive-btn:not(:disabled):hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[box-shadow:0_14px_28px_rgba(53,_111,_72,_0.3)];
}

.secretary-archive-btn:disabled {
  @apply tw:cursor-not-allowed;
  @apply tw:[border-color:#9fbaa6];
  @apply tw:[background:#d8e5db];
  @apply tw:[color:#66816d];
  @apply tw:[box-shadow:none];
}

.modal-shell {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:1200];
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:[padding:1rem];
  @apply tw:[background:rgba(15,_23,_42,_0.42)];
}

.modal-panel {
  @apply tw:[width:min(860px,_calc(100vw_-_2rem))];
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:22px];
  @apply tw:[box-shadow:0_24px_54px_rgba(15,_23,_42,_0.18)];
  @apply tw:[padding:1.2rem];
}

.modal-panel-head {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:items-center;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1rem];
}

.modal-panel-head h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.1rem];
  @apply tw:[font-weight:600];
}

.modal-panel-head p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.88rem];
}

.modal-close-btn {
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[border-radius:12px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:cursor-pointer;
}

.secretary-search-row {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.85rem];
  @apply tw:flex-wrap;
  @apply tw:[margin-bottom:0.85rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-radius:18px_18px_0_0];
  @apply tw:[background:#ffffff];
}

.secretary-search-field {
  @apply tw:[flex:1_1_320px];
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

.secretary-search-field input {
  @apply tw:w-full;
  @apply tw:[border:none];
  @apply tw:[outline:none];
  @apply tw:[background:transparent];
}

.secretary-export-actions {
  @apply tw:flex;
  @apply tw:[gap:0.65rem];
  @apply tw:flex-wrap;
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

.secretary-export-btn:hover {
  @apply tw:[border-color:#589b6b];
  @apply tw:[background:#dcecdf];
}

.secretary-export-btn-excel {
  @apply tw:[border-color:#5f996e];
  @apply tw:[background:#d7e9db];
  @apply tw:[color:#2f6f43];
}

.secretary-export-btn-excel:hover {
  @apply tw:[border-color:#47855a];
  @apply tw:[background:#c9dfce];
}

.secretary-section-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1.25rem];
  @apply tw:[padding-bottom:1rem];
  @apply tw:[border-bottom:1px_solid_#91b99b];
}

.secretary-summary-meta {
  @apply tw:[padding:0.45rem_0.8rem];
  @apply tw:[border:1px_solid_#78a985];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#dcecdf];
  @apply tw:[color:#356f48];
  @apply tw:[font-size:0.85rem];
  @apply tw:[font-weight:600];
}

.secretary-filter-bar {
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
  @apply tw:[margin-top:-0.85rem];
  @apply tw:[margin-bottom:1.2rem];
  @apply tw:[padding:0_1rem_1rem];
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-top:0];
  @apply tw:[border-radius:0_0_18px_18px];
  @apply tw:[background:#ffffff];
}

.secretary-student-filter-bar {
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
}

.secretary-filter-group {
  @apply tw:grid;
  @apply tw:[gap:0.35rem];
}

.secretary-filter-group span {
  @apply tw:[color:#356f48];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.secretary-filter-group select {
  @apply tw:w-full;
  @apply tw:[min-height:44px];
  @apply tw:[border:1px_solid_#7fac8a];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.68rem_0.78rem];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[outline:none];
}

.secretary-filter-group select:focus {
  @apply tw:[border-color:#47855a];
  @apply tw:[box-shadow:0_0_0_3px_rgba(71,_133,_90,_0.16)];
}

.secretary-table-wrap {
  @apply tw:w-full;
  @apply tw:overflow-x-auto;
  @apply tw:overflow-y-visible;
  @apply tw:[border:1px_solid_#78a985];
  @apply tw:[border-radius:20px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_14px_32px_rgba(47,_111,_67,_0.1)];
  @apply tw:[scrollbar-width:thin];
  @apply tw:[scrollbar-color:#6f9c7a_transparent];
}

.secretary-table-wrap::-webkit-scrollbar {
  @apply tw:[height:6px];
}

.secretary-table-wrap::-webkit-scrollbar-track {
  @apply tw:[background:transparent];
}

.secretary-table-wrap::-webkit-scrollbar-thumb {
  @apply tw:[background:#6f9c7a];
  @apply tw:[border-radius:999px];
}

.secretary-table-wrap::-webkit-scrollbar-thumb:hover {
  @apply tw:[background:#4f805d];
}

.secretary-table {
  @apply tw:w-full;
  @apply tw:[min-width:980px];
  @apply tw:border-separate;
  @apply tw:[border-spacing:0];
}

.secretary-table thead th {
  @apply tw:[padding:0.75rem];
  @apply tw:text-left;
  @apply tw:[background:#ffffff];
  @apply tw:[border-bottom:1px_solid_#78a985];
  @apply tw:[color:#356f48];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
  @apply tw:whitespace-nowrap;
}

.secretary-table tbody td {
  @apply tw:[padding:0.75rem];
  @apply tw:[border-bottom:1px_solid_#edf2f7];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.9rem];
  @apply tw:align-middle;
}

.secretary-table tbody tr:last-child td {
  @apply tw:[border-bottom:none];
}

.secretary-table tbody tr:hover td {
  @apply tw:[background:#edf5ef];
}

.secretary-person-cell {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
  @apply tw:[min-width:240px];
}

.secretary-person-avatar {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:50%];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#245b13];
  @apply tw:[color:#245b13];
  @apply tw:[font-size:1.1rem];
  @apply tw:shrink-0;
  @apply tw:[box-shadow:none];
}

.secretary-person-copy {
  @apply tw:grid;
  @apply tw:[gap:0.15rem];
}

.secretary-person-copy strong {
  @apply tw:[color:#0f172a];
}

.secretary-person-copy small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
}

.secretary-adviser-cell {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
  @apply tw:[min-width:180px];
}

.secretary-adviser-cell strong {
  @apply tw:[color:#0f172a];
}

.secretary-adviser-cell small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
}

.secretary-progress-cell {
  @apply tw:[min-width:150px];
}

.secretary-progress-value {
  @apply tw:inline-block;
  @apply tw:[margin-bottom:0.4rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-weight:700];
}

.secretary-progress-bar {
  @apply tw:w-full;
  @apply tw:[height:8px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e2e8f0];
  @apply tw:overflow-hidden;
}

.secretary-progress-bar span {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:linear-gradient(90deg,_#0f766e,_#14b8a6)];
}

.secretary-recommendation-note {
  @apply tw:block;
  @apply tw:[margin-top:0.45rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:[line-height:1.35];
}

.secretary-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[border-radius:999px];
  @apply tw:[padding:0.32rem_0.7rem];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}

.department-badge {
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#334155];
  @apply tw:[border:1px_solid_#dbe4ec];
}

.secretary-last-login-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.42rem_0.7rem];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#f8fafc];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:600];
  @apply tw:whitespace-nowrap;
}

.secretary-recommendation-cell {
  @apply tw:grid;
  @apply tw:[gap:0.4rem];
  @apply tw:[min-width:200px];
}

.secretary-recommendation-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:w-fit;
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.42rem_0.78rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:[line-height:1];
}

.secretary-recommendation-chip.ready {
  @apply tw:[background:#ecfdf5];
  @apply tw:[border-color:#a7f3d0];
  @apply tw:[color:#047857];
}

.secretary-recommendation-chip.in-progress {
  @apply tw:[background:#eff6ff];
  @apply tw:[border-color:#bfdbfe];
  @apply tw:[color:#1d4ed8];
}

.secretary-recommendation-chip.pending {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-color:#e2e8f0];
  @apply tw:[color:#475569];
}

.secretary-recommendation-cell small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.35];
}

.table-state {
  @apply tw:[min-height:180px];
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[color:#64748b];
  @apply tw:text-center;
}

@media (max-width: 768px) {
  .secretary-top-header {
    @apply tw:[padding:0.75rem_0.9rem]!;
    @apply tw:[border-radius:16px]!;
  }

  .secretary-header-copy > div,
  .secretary-access-chip {
    @apply tw:hidden;
  }

  .secretary-header-content {
    @apply tw:grid!;
    @apply tw:[grid-template-columns:38px_minmax(0,_1fr)_38px];
    @apply tw:items-center!;
    @apply tw:[gap:0.75rem]!;
    @apply tw:w-full;
  }

  .secretary-header-copy {
    @apply tw:flex!;
    @apply tw:items-center!;
    @apply tw:justify-start!;
    @apply tw:[gap:0]!;
    @apply tw:[grid-column:1];
    @apply tw:flex-none!;
    @apply tw:[min-width:0];
    @apply tw:w-auto;
  }

  .secretary-header-tools,
  .secretary-section-head {
    @apply tw:flex-row;
    @apply tw:items-center;
  }

  .secretary-header-tools {
    @apply tw:flex!;
    @apply tw:items-center!;
    @apply tw:justify-end!;
    @apply tw:[gap:0.75rem]!;
    @apply tw:[grid-column:3];
    @apply tw:[margin-left:0]!;
    @apply tw:flex-none!;
    @apply tw:[min-width:0];
  }

  .secretary-header-copy .mobile-menu-toggle,
  .secretary-header-tools .account-menu-trigger {
    @apply tw:[width:38px];
    @apply tw:[height:38px];
    @apply tw:[min-width:38px];
    @apply tw:[border-radius:12px];
  }

  .secretary-header-copy .mobile-menu-toggle {
    @apply tw:[margin:0]!;
    @apply tw:self-start!;
  }

  .secretary-header-tools .account-menu,
  .secretary-header-tools .account-menu-trigger {
    @apply tw:ml-auto!;
  }

  .secretary-section-head {
    @apply tw:flex-col;
    @apply tw:items-start;
    @apply tw:[gap:0.35rem];
  }

  .secretary-school-year-panel {
    @apply tw:[grid-template-columns:1fr];
  }

  .secretary-student-filter-bar {
    @apply tw:[grid-template-columns:1fr];
  }

  .secretary-table {
    @apply tw:[min-width:920px];
  }
}

.secretary-attendance-cell {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

.secretary-attendance-cell strong {
  @apply tw:[color:#0f172a];
}

.secretary-attendance-cell small {
  @apply tw:[color:#64748b];
}

.secretary-attendance-list {
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
}

.secretary-attendance-card {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:grid;
  @apply tw:[gap:0.65rem];
}

.secretary-attendance-card-interactive {
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.18s_ease,_box-shadow_0.18s_ease,_border-color_0.18s_ease];
}

.secretary-attendance-card-interactive:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[border-color:#93c5fd];
  @apply tw:[box-shadow:0_18px_32px_rgba(37,_99,_235,_0.12)];
}

.secretary-attendance-card-interactive:focus-visible {
  @apply tw:[outline:3px_solid_rgba(37,_99,_235,_0.28)];
  @apply tw:[outline-offset:2px];
}

.secretary-attendance-card-top {
  @apply tw:flex;
  @apply tw:[align-items:start];
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
}

.secretary-attendance-card-top strong {
  @apply tw:block;
  @apply tw:[color:#0f172a];
}

.secretary-attendance-card-top small {
  @apply tw:[color:#64748b];
}

.secretary-attendance-stat-row {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.7rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:600];
}

.secretary-attendance-card-hint {
  @apply tw:[margin:0];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:700];
}

.secretary-attendance-card-note,
.secretary-attendance-section-copy {
  @apply tw:[margin:0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:600];
}

.secretary-attendance-modal {
  @apply tw:[width:min(1080px,_calc(100vw_-_2rem))];
  @apply tw:[max-height:calc(100vh_-_2rem)];
  @apply tw:overflow-auto;
}

.secretary-attendance-modal-head {
  @apply tw:[align-items:start];
  @apply tw:[gap:1rem];
}

.secretary-attendance-title-block {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.secretary-attendance-title-block h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
}

.secretary-attendance-title-block p {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
}

.secretary-attendance-eyebrow {
  @apply tw:inline-flex;
  @apply tw:w-fit;
  @apply tw:items-center;
  @apply tw:[padding:0.32rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(37,_99,_235,_0.1)];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

.secretary-attendance-summary-cards {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
  @apply tw:[flex:1];
}

.secretary-attendance-summary-card {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.85rem_0.95rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:grid;
  @apply tw:[gap:0.3rem];
}

.secretary-attendance-summary-card span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
}

.secretary-attendance-summary-card strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.4rem];
  @apply tw:[line-height:1];
}

.secretary-attendance-summary-card.status-present {
  @apply tw:[background:linear-gradient(180deg,_#f0fdf4_0%,_#dcfce7_100%)];
}

.secretary-attendance-summary-card.status-late {
  @apply tw:[background:linear-gradient(180deg,_#fff7ed_0%,_#ffedd5_100%)];
}

.secretary-attendance-summary-card.status-absent {
  @apply tw:[background:linear-gradient(180deg,_#fef2f2_0%,_#fee2e2_100%)];
}

.secretary-attendance-summary-card.status-excused {
  @apply tw:[background:linear-gradient(180deg,_#eff6ff_0%,_#dbeafe_100%)];
}

.secretary-attendance-modal-state {
  @apply tw:[margin-top:0.5rem];
}

.secretary-attendance-groups {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.secretary-attendance-group {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[padding:1rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:grid;
  @apply tw:[gap:0.9rem];
}

.secretary-attendance-group-head {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.secretary-attendance-group-head strong {
  @apply tw:[color:#0f172a];
}

.secretary-attendance-status-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.38rem_0.78rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:800];
}

.secretary-attendance-status-pill.status-present {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
}

.secretary-attendance-status-pill.status-late {
  @apply tw:[background:#ffedd5];
  @apply tw:[color:#9a3412];
}

.secretary-attendance-status-pill.status-absent {
  @apply tw:[background:#fee2e2];
  @apply tw:[color:#991b1b];
}

.secretary-attendance-status-pill.status-excused {
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
}

.secretary-attendance-group-empty {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.88rem];
}

.secretary-attendance-group-list {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

.secretary-attendance-student-row {
  @apply tw:flex;
  @apply tw:[align-items:start];
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.8rem_0.85rem];
}

.secretary-attendance-student-copy {
  @apply tw:grid;
  @apply tw:[gap:0.22rem];
  @apply tw:[min-width:0];
}

.secretary-attendance-student-copy strong {
  @apply tw:[color:#0f172a];
}

.secretary-attendance-student-copy small {
  @apply tw:[color:#64748b];
  @apply tw:[word-break:break-word];
}

.secretary-attendance-student-meta {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:justify-end;
  @apply tw:[gap:0.45rem];
}

.secretary-attendance-meta-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.32rem_0.65rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:700];
}

@media (max-width: 640px) {
  .secretary-attendance-card-top {
    @apply tw:flex-col;
  }

  .secretary-attendance-summary-cards,
  .secretary-attendance-groups {
    @apply tw:[grid-template-columns:1fr];
  }

  .secretary-attendance-student-row {
    @apply tw:flex-col;
  }

  .secretary-attendance-student-meta {
    @apply tw:justify-start;
  }
}

</style>
