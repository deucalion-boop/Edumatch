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
              <span>Records access</span>
            </div>
            <div class="secretary-sidebar-chip">Archive Tools</div>
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
            <div class="secretary-access-chip">
              <i class="fas fa-box-archive"></i>
              <span>Archive workflow</span>
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
                    <span class="secretary-person-avatar">{{ getUserInitials(student.name) }}</span>
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
const getUserInitials = (name) => {
  const value = String(name || '').trim()
  if (!value) return 'S'
  return value.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
}

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
.secretary-top-header {
  padding: 0.9rem 1rem !important;
  border-radius: 18px !important;
}

.secretary-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.secretary-header-copy {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex: 1 1 auto;
  min-width: 0;
}

.secretary-header-copy > div {
  min-width: 0;
}

.secretary-header-copy h1 {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.15;
}

.secretary-header-copy .header-subtitle {
  margin-top: 0.2rem;
  font-size: 0.86rem;
  line-height: 1.45;
}

.secretary-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  border: 1px solid #dbe4ec;
  background: #ffffff;
}

.secretary-banner.success {
  color: #166534;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.secretary-banner.error {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

.secretary-header-tools {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
  flex: 0 0 auto;
}

.secretary-access-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
}

.secretary-header-copy .mobile-menu-toggle,
.secretary-header-tools .account-menu-trigger {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 12px;
}

.secretary-userlist-panel {
  margin-bottom: 1rem;
}

.secretary-school-year-panel {
  display: grid;
  grid-template-columns: minmax(200px, 240px) minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: end;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #dbe4ec;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(167, 139, 250, 0.14), transparent 36%),
    linear-gradient(180deg, #ffffff, #faf7ff);
}

.secretary-school-year-panel input {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.68rem 0.78rem;
  background: #ffffff;
  color: #0f172a;
}

.secretary-school-year-meta {
  display: grid;
  gap: 0.18rem;
}

.secretary-school-year-meta strong {
  color: #0f172a;
  font-size: 1.1rem;
}

.secretary-school-year-meta span {
  color: #475569;
  font-size: 0.9rem;
  font-weight: 600;
}

.secretary-school-year-meta small {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.45;
}

.secretary-archive-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 46px;
  padding: 0.8rem 1.05rem;
  border: 1px solid #8b5cf6;
  border-radius: 14px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #ffffff;
  font-size: 0.86rem;
  font-weight: 800;
  white-space: nowrap;
}

.secretary-archive-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.modal-shell {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.42);
}

.modal-panel {
  width: min(860px, calc(100vw - 2rem));
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.18);
  padding: 1.2rem;
}

.modal-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.modal-panel-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 600;
}

.modal-panel-head p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.88rem;
}

.modal-close-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
}

.secretary-search-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.secretary-search-field {
  flex: 1 1 320px;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #fff;
}

.secretary-search-field input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
}

.secretary-export-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

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

.secretary-export-btn:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.secretary-export-btn-excel {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.secretary-export-btn-excel:hover {
  border-color: #86efac;
  background: #dcfce7;
}

.secretary-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.secretary-summary-meta {
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
}

.secretary-filter-bar {
  display: grid;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.secretary-student-filter-bar {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.secretary-filter-group {
  display: grid;
  gap: 0.35rem;
}

.secretary-filter-group span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.secretary-filter-group select {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.68rem 0.78rem;
  background: #ffffff;
  color: #0f172a;
}

.secretary-table-wrap {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  border: 1px solid #dbe4ec;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff, #f8fbfb);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.secretary-table {
  width: 100%;
  min-width: 1080px;
  border-collapse: separate;
  border-spacing: 0;
}

.secretary-table thead th {
  padding: 1rem;
  text-align: left;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #dbe4ec;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.secretary-table tbody td {
  padding: 1rem;
  border-bottom: 1px solid #edf2f7;
  color: #0f172a;
  font-size: 0.9rem;
  vertical-align: middle;
}

.secretary-table tbody tr:last-child td {
  border-bottom: none;
}

.secretary-table tbody tr:hover td {
  background: #f8fbff;
}

.secretary-person-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 240px;
}

.secretary-person-avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #ffffff;
  font-size: 0.84rem;
  font-weight: 800;
  flex-shrink: 0;
}

.secretary-person-copy {
  display: grid;
  gap: 0.15rem;
}

.secretary-person-copy strong {
  color: #0f172a;
}

.secretary-person-copy small {
  color: #64748b;
  font-size: 0.78rem;
}

.secretary-adviser-cell {
  display: grid;
  gap: 0.2rem;
  min-width: 180px;
}

.secretary-adviser-cell strong {
  color: #0f172a;
}

.secretary-adviser-cell small {
  color: #64748b;
  font-size: 0.78rem;
}

.secretary-progress-cell {
  min-width: 150px;
}

.secretary-progress-value {
  display: inline-block;
  margin-bottom: 0.4rem;
  color: #0f172a;
  font-weight: 700;
}

.secretary-progress-bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.secretary-progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f766e, #14b8a6);
}

.secretary-recommendation-note {
  display: block;
  margin-top: 0.45rem;
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.35;
}

.secretary-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.32rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.department-badge {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #dbe4ec;
}

.secretary-last-login-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.42rem 0.7rem;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}

.secretary-recommendation-cell {
  display: grid;
  gap: 0.4rem;
  min-width: 200px;
}

.secretary-recommendation-chip {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 34px;
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
}

.secretary-recommendation-chip.ready {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.secretary-recommendation-chip.in-progress {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.secretary-recommendation-chip.pending {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #475569;
}

.secretary-recommendation-cell small {
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.35;
}

.table-state {
  min-height: 180px;
  display: grid;
  place-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-align: center;
}

@media (max-width: 768px) {
  .secretary-top-header {
    padding: 0.75rem 0.9rem !important;
    border-radius: 16px !important;
  }

  .secretary-header-copy > div,
  .secretary-access-chip {
    display: none;
  }

  .secretary-header-content {
    display: grid !important;
    grid-template-columns: 38px minmax(0, 1fr) 38px;
    align-items: center !important;
    gap: 0.75rem !important;
    width: 100%;
  }

  .secretary-header-copy {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 0 !important;
    grid-column: 1;
    flex: 0 0 auto !important;
    min-width: 0;
    width: auto;
  }

  .secretary-header-tools,
  .secretary-section-head {
    flex-direction: row;
    align-items: center;
  }

  .secretary-header-tools {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 0.75rem !important;
    grid-column: 3;
    margin-left: 0 !important;
    flex: 0 0 auto !important;
    min-width: 0;
  }

  .secretary-header-copy .mobile-menu-toggle,
  .secretary-header-tools .account-menu-trigger {
    width: 38px;
    height: 38px;
    min-width: 38px;
    border-radius: 12px;
  }

  .secretary-header-copy .mobile-menu-toggle {
    margin: 0 !important;
    align-self: flex-start !important;
  }

  .secretary-header-tools .account-menu,
  .secretary-header-tools .account-menu-trigger {
    margin-left: auto !important;
  }

  .secretary-section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .secretary-school-year-panel {
    grid-template-columns: 1fr;
  }

  .secretary-student-filter-bar {
    grid-template-columns: 1fr;
  }

  .secretary-table {
    min-width: 920px;
  }
}

.secretary-attendance-cell {
  display: grid;
  gap: 0.18rem;
}

.secretary-attendance-cell strong {
  color: #0f172a;
}

.secretary-attendance-cell small {
  color: #64748b;
}

.secretary-attendance-list {
  display: grid;
  gap: 0.85rem;
}

.secretary-attendance-card {
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 0.95rem 1rem;
  display: grid;
  gap: 0.65rem;
}

.secretary-attendance-card-interactive {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.secretary-attendance-card-interactive:hover {
  transform: translateY(-2px);
  border-color: #93c5fd;
  box-shadow: 0 18px 32px rgba(37, 99, 235, 0.12);
}

.secretary-attendance-card-interactive:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.28);
  outline-offset: 2px;
}

.secretary-attendance-card-top {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.8rem;
}

.secretary-attendance-card-top strong {
  display: block;
  color: #0f172a;
}

.secretary-attendance-card-top small {
  color: #64748b;
}

.secretary-attendance-stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
}

.secretary-attendance-card-hint {
  margin: 0;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 700;
}

.secretary-attendance-card-note,
.secretary-attendance-section-copy {
  margin: 0;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
}

.secretary-attendance-modal {
  width: min(1080px, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  overflow: auto;
}

.secretary-attendance-modal-head {
  align-items: start;
  gap: 1rem;
}

.secretary-attendance-title-block {
  display: grid;
  gap: 0.45rem;
}

.secretary-attendance-title-block h3 {
  margin: 0;
  color: #0f172a;
}

.secretary-attendance-title-block p {
  margin: 0;
  color: #64748b;
}

.secretary-attendance-eyebrow {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  padding: 0.32rem 0.72rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.secretary-attendance-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  flex: 1;
}

.secretary-attendance-summary-card {
  border: 1px solid #dbe4ef;
  border-radius: 16px;
  padding: 0.85rem 0.95rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: grid;
  gap: 0.3rem;
}

.secretary-attendance-summary-card span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.secretary-attendance-summary-card strong {
  color: #0f172a;
  font-size: 1.4rem;
  line-height: 1;
}

.secretary-attendance-summary-card.status-present {
  background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
}

.secretary-attendance-summary-card.status-late {
  background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%);
}

.secretary-attendance-summary-card.status-absent {
  background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%);
}

.secretary-attendance-summary-card.status-excused {
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
}

.secretary-attendance-modal-state {
  margin-top: 0.5rem;
}

.secretary-attendance-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.secretary-attendance-group {
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  padding: 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: grid;
  gap: 0.9rem;
}

.secretary-attendance-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.secretary-attendance-group-head strong {
  color: #0f172a;
}

.secretary-attendance-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.38rem 0.78rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

.secretary-attendance-status-pill.status-present {
  background: #dcfce7;
  color: #166534;
}

.secretary-attendance-status-pill.status-late {
  background: #ffedd5;
  color: #9a3412;
}

.secretary-attendance-status-pill.status-absent {
  background: #fee2e2;
  color: #991b1b;
}

.secretary-attendance-status-pill.status-excused {
  background: #dbeafe;
  color: #1d4ed8;
}

.secretary-attendance-group-empty {
  color: #64748b;
  font-size: 0.88rem;
}

.secretary-attendance-group-list {
  display: grid;
  gap: 0.75rem;
}

.secretary-attendance-student-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.8rem 0.85rem;
}

.secretary-attendance-student-copy {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
}

.secretary-attendance-student-copy strong {
  color: #0f172a;
}

.secretary-attendance-student-copy small {
  color: #64748b;
  word-break: break-word;
}

.secretary-attendance-student-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
}

.secretary-attendance-meta-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.32rem 0.65rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .secretary-attendance-card-top {
    flex-direction: column;
  }

  .secretary-attendance-summary-cards,
  .secretary-attendance-groups {
    grid-template-columns: 1fr;
  }

  .secretary-attendance-student-row {
    flex-direction: column;
  }

  .secretary-attendance-student-meta {
    justify-content: flex-start;
  }
}
</style>
