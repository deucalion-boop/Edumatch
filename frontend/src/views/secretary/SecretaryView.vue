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

    <button
      v-if="isSidebarOpen"
      type="button"
      class="sidebar-backdrop"
      @click="closeSidebar"
      aria-label="Close sidebar"
    ></button>

    <main class="teacher-main secretary-main dashboard-container">
      <header class="top-header secretary-top-header secretary-dashboard-header dashboard-header">
        <div class="header-content secretary-header-content dashboard-header-content">
          <div class="header-left secretary-header-copy dashboard-header-copy">
            <button type="button" class="mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar">
              <i class="fas fa-bars"></i>
            </button>
            <div>
              <h1>Secretary Dashboard</h1>
              <p class="header-subtitle">Monitor faculty accounts, department assignments, and directory activity with view-only access.</p>
            </div>
          </div>

          <div class="secretary-header-tools">
            <div class="secretary-export-group" aria-label="Dashboard export options">
              <button type="button" class="secretary-export-btn" aria-label="Export dashboard as CSV" title="Export CSV" @click="exportDashboardCsv">
                <i class="fas fa-file-csv"></i>
                <span>CSV</span>
              </button>
              <button type="button" class="secretary-export-btn secretary-export-btn-excel" aria-label="Export dashboard as Excel" title="Export Excel" @click="exportDashboardExcel">
                <i class="fas fa-file-excel"></i>
                <span>Excel</span>
              </button>
            </div>
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

      <nav class="secretary-dashboard-nav" aria-label="Dashboard sections">
        <button type="button" :class="{ active: activeDashboardSection === 'analytics' }" @click="navigateDashboard('analytics')">
          <i class="fas fa-chart-line"></i><span>Analytics</span>
        </button>
        <button type="button" :class="{ active: activeDashboardSection === 'departments' }" @click="navigateDashboard('departments')">
          <i class="fas fa-building-columns"></i><span>Departments</span>
        </button>
        <button type="button" :class="{ active: activeDashboardSection === 'assignments' }" @click="navigateDashboard('assignments')">
          <i class="fas fa-user-shield"></i><span>Assignments</span>
        </button>
      </nav>

      <section id="dashboard-statistics" class="section-card dashboard-panel secretary-stat-section">
        <div class="secretary-stat-grid stat-cards">
          <article class="secretary-stat-card">
            <div class="secretary-stat-icon role-headteacher">
              <i class="fas fa-user-shield"></i>
            </div>
            <div class="secretary-stat-copy">
              <span class="secretary-stat-label">Total HeadTeachers</span>
              <strong class="secretary-stat-value">{{ headTeachers.length }}</strong>
              <small class="secretary-stat-note">Department leaders in the system</small>
            </div>
          </article>

          <article class="secretary-stat-card">
            <div class="secretary-stat-icon role-teacher">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="secretary-stat-copy">
              <span class="secretary-stat-label">Total Teachers</span>
              <strong class="secretary-stat-value">{{ teachers.length }}</strong>
              <small class="secretary-stat-note">Faculty members under monitoring</small>
            </div>
          </article>

          <article class="secretary-stat-card">
            <div class="secretary-stat-icon status-active">
              <i class="fas fa-user-check"></i>
            </div>
            <div class="secretary-stat-copy">
              <span class="secretary-stat-label">Active Accounts</span>
              <strong class="secretary-stat-value">{{ activeCount }}</strong>
              <small class="secretary-stat-note">Ready for regular portal access</small>
            </div>
          </article>

          <article class="secretary-stat-card">
            <div class="secretary-stat-icon status-inactive">
              <i class="fas fa-user-clock"></i>
            </div>
            <div class="secretary-stat-copy">
              <span class="secretary-stat-label">Inactive Accounts</span>
              <strong class="secretary-stat-value">{{ inactiveCount }}</strong>
              <small class="secretary-stat-note">Need monitoring or reactivation follow-up</small>
            </div>
          </article>
        </div>
      </section>

      <section v-show="activeDashboardSection === 'analytics'" id="dashboard-analytics" class="section-card dashboard-panel secretary-analytics-panel">
        <div class="secretary-section-head">
          <div>
            <h2 class="section-title">Student Analytics Overview</h2>
            <p class="toolbar-subtitle">A secretary-level snapshot of learner progress, adviser coverage, and department performance.</p>
          </div>
        </div>

        <div class="secretary-analytics-workspace">
          <div class="secretary-analytics-grid">
            <article class="secretary-analytics-card success">
              <span>Top Student</span>
              <strong>{{ studentAnalytics.topStudent.name }}</strong>
              <small>{{ studentAnalytics.topStudent.department }} · {{ studentAnalytics.topStudent.value }}% mastery</small>
            </article>
            <article class="secretary-analytics-card">
              <span>Learning Progress</span>
              <strong>{{ studentAnalytics.averageMastery }}%</strong>
              <small>{{ studentAnalytics.totalStudents }} students monitored</small>
            </article>
            <article class="secretary-analytics-card warning">
              <span>Needs Attention</span>
              <strong>{{ studentAnalytics.atRiskStudents }}</strong>
              <small>Students below 60%</small>
            </article>
            <article class="secretary-analytics-card department-performance-card">
              <span>Department Performance</span>
              <div class="secretary-performance-row success-text">
                <small>Top</small>
                <strong>{{ studentAnalytics.topDepartment.name }}</strong>
                <b>{{ studentAnalytics.topDepartment.value }}%</b>
              </div>
              <div class="secretary-performance-row warning-text">
                <small>Lowest</small>
                <strong>{{ studentAnalytics.lowestDepartment.name }}</strong>
                <b>{{ studentAnalytics.lowestDepartment.value }}%</b>
              </div>
            </article>
          </div>

          <article class="secretary-chart-card">
            <div class="secretary-chart-head">
              <div>
                <h3>Department Mastery Performance</h3>
                <p>Average mastery progress by department.</p>
              </div>
            </div>
            <div class="secretary-chart-shell">
              <canvas ref="departmentChartCanvas" aria-label="Department mastery analytics"></canvas>
            </div>
          </article>
        </div>
      </section>

      <section v-show="activeDashboardSection === 'departments'" id="dashboard-directory" class="section-card dashboard-panel secretary-summary-section">
        <div class="secretary-section-head">
          <div>
            <h2 class="section-title">Department Summary</h2>
            <p class="toolbar-subtitle">Track teacher and HeadTeacher coverage across academic departments.</p>
          </div>
          <div class="secretary-summary-meta">
            <span>{{ departmentSummaries.length }} departments monitored</span>
          </div>
        </div>

        <div class="secretary-department-grid">
          <article v-for="department in departmentSummaries" :key="department.name" class="secretary-surface-card secretary-department-card">
            <div class="secretary-department-card-header">
              <div class="secretary-department-icon">
                <i class="fas fa-building-columns"></i>
              </div>
              <span class="secretary-inline-badge">{{ department.totalFaculty }} faculty</span>
            </div>
            <div class="secretary-card-topline">
              <h3>{{ department.name }}</h3>
              <span class="secretary-leadership-badge" :class="{ assigned: department.headTeacherCount > 0 }">
                {{ department.headTeacherCount > 0 ? 'Leadership assigned' : 'Leadership needed' }}
              </span>
            </div>
            <div class="secretary-department-total">
              <span>Total Faculty</span>
              <strong>{{ department.totalFaculty }}</strong>
            </div>
            <div class="secretary-department-progress" aria-hidden="true">
              <span :style="{ width: `${maxDepartmentFaculty === 0 ? 0 : Math.max(10, Math.round((department.totalFaculty / maxDepartmentFaculty) * 100))}%` }"></span>
            </div>
            <div class="secretary-department-stats">
              <div>
                <span>HeadTeachers</span>
                <strong>{{ department.headTeacherCount }}</strong>
              </div>
              <div>
                <span>Teachers</span>
                <strong>{{ department.teacherCount }}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section v-show="activeDashboardSection === 'assignments'" id="dashboard-assignments" class="secretary-monitor-grid secretary-monitor-grid-single">
        <article class="section-card dashboard-panel secretary-surface-card">
          <div class="secretary-section-head">
            <div>
              <h2 class="section-title">Head Teacher Assignment Overview</h2>
              <p class="toolbar-subtitle">View who is assigned to manage each department.</p>
            </div>
            <div class="secretary-summary-meta">
              <span>{{ assignedHeadTeacherCount }} of {{ headTeacherAssignments.length }} departments assigned</span>
            </div>
          </div>

          <div class="secretary-assignment-board">
            <article v-for="assignment in headTeacherAssignments" :key="assignment.department" class="secretary-assignment-card">
              <div class="secretary-assignment-topline">
                <div class="secretary-assignment-department">
                  <span class="secretary-assignment-icon">
                    <i class="fas fa-building-columns"></i>
                  </span>
                  <div>
                    <h3>{{ assignment.department }}</h3>
                  </div>
                </div>
                <span class="secretary-assignment-status" :class="{ assigned: assignment.isAssigned, unassigned: !assignment.isAssigned }">
                  {{ assignment.isAssigned ? 'Assigned' : 'Unassigned' }}
                </span>
              </div>

              <div class="secretary-assignment-body">
                <span class="secretary-assignment-label">Head Teacher</span>
                <strong :class="{ 'is-empty': !assignment.isAssigned }">{{ assignment.headTeacherName }}</strong>
              </div>
            </article>
          </div>
        </article>
      </section>

    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import Chart from 'chart.js/auto'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const CORE_DEPARTMENTS = [
  'Mathematics',
  'English',
  'Science',
  'TLE',
  'Filipino',
  'Araling Panlipunan',
  'Edukasyon sa Pagpapakatao (ESP)',
  'MAPEH',
]

const isLoading = ref(false)
const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const activeDashboardSection = ref('analytics')
const users = ref([])
const students = ref([])
const accountMenuRef = ref(null)
const departmentChartCanvas = ref(null)
let departmentChart = null

const navigateDashboard = (section) => {
  activeDashboardSection.value = section

  window.requestAnimationFrame(() => {
    if (section === 'analytics') departmentChart?.resize()
  })
}

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'Secretary').trim())

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

const normalizedStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'active') return 'active'
  return 'inactive'
}

const roleLabel = (role) => {
  if (role === 'headteacher') return 'HeadTeacher'
  if (role === 'teacher') return 'Teacher'
  return String(role || 'User')
}

const roleDescription = (role) => {
  if (role === 'headteacher') return 'Department leadership record'
  if (role === 'teacher') return 'Faculty directory record'
  return 'User directory record'
}

const statusLabel = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'active') return 'Active'
  if (normalized === 'pending') return 'Inactive'
  if (normalized === 'suspended') return 'Inactive'
  return 'Inactive'
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

const headTeachers = computed(() => users.value.filter((user) => user.role === 'headteacher'))
const teachers = computed(() => users.value.filter((user) => user.role === 'teacher'))
const activeCount = computed(() => users.value.filter((user) => normalizedStatus(user.status) === 'active').length)
const inactiveCount = computed(() => users.value.filter((user) => normalizedStatus(user.status) === 'inactive').length)

const departmentOptions = computed(() => {
  const merged = new Set(CORE_DEPARTMENTS)
  users.value
    .map((user) => String(user.department || '').trim())
    .filter(Boolean)
    .forEach((department) => merged.add(department))
  return Array.from(merged).sort((left, right) => left.localeCompare(right))
})

const departmentSummaries = computed(() => {
  return departmentOptions.value.map((department) => {
    const departmentUsers = users.value.filter((user) => String(user.department || '').trim() === department)
    const headTeacherCount = departmentUsers.filter((user) => user.role === 'headteacher').length
    const teacherCount = departmentUsers.filter((user) => user.role === 'teacher').length
    return {
      name: department,
      headTeacherCount,
      teacherCount,
      totalFaculty: headTeacherCount + teacherCount,
    }
  })
})

const maxDepartmentFaculty = computed(() => {
  return departmentSummaries.value.reduce((highest, department) => Math.max(highest, Number(department.totalFaculty || 0)), 0)
})

const headTeacherAssignments = computed(() => {
  return departmentOptions.value.map((department) => {
    const assignedHeadTeachers = headTeachers.value
      .filter((user) => String(user.department || '').trim() === department)
      .map((user) => user.name)
      .filter(Boolean)

    return {
      department,
      isAssigned: assignedHeadTeachers.length > 0,
      headTeacherName: assignedHeadTeachers.length > 0 ? assignedHeadTeachers.join(', ') : 'No HeadTeacher assigned',
    }
  })
})

const assignedHeadTeacherCount = computed(() => headTeacherAssignments.value.filter((assignment) => assignment.isAssigned).length)

const studentDepartmentOptions = computed(() => {
  const merged = new Set(CORE_DEPARTMENTS)
  students.value
    .map((student) => String(student.department || '').trim())
    .filter(Boolean)
    .forEach((department) => merged.add(department))
  return Array.from(merged).sort((left, right) => left.localeCompare(right))
})

const studentAnalytics = computed(() => {
  const totalStudents = students.value.length
  const totals = students.value.reduce((accumulator, student) => {
    accumulator.mastery += Number(student.progress?.masteryProgress || 0)
    accumulator.score += Number(student.progress?.averageScore || 0)
    accumulator.completedAssessments += Number(student.progress?.completedAssessments || 0)
    if (student.adviser?.name) accumulator.withAdviser += 1
    if (Number(student.progress?.masteryProgress || 0) < 60 || Number(student.progress?.averageScore || 0) < 60) {
      accumulator.atRiskStudents += 1
    }
    return accumulator
  }, {
    mastery: 0,
    score: 0,
    completedAssessments: 0,
    withAdviser: 0,
    atRiskStudents: 0,
  })

  const departmentPerformance = studentDepartmentOptions.value.map((department) => {
    const departmentStudents = students.value.filter((student) => String(student.department || '').trim() === department)
    const averageMastery = departmentStudents.length
      ? Math.round(departmentStudents.reduce((sum, student) => sum + Number(student.progress?.masteryProgress || 0), 0) / departmentStudents.length)
      : 0
    return {
      name: department,
      value: averageMastery,
    }
  })

  const sortedDepartments = [...departmentPerformance].sort((left, right) => right.value - left.value)
  const topDepartment = sortedDepartments[0] || { name: 'No data', value: 0 }
  const lowestDepartment = sortedDepartments[sortedDepartments.length - 1] || { name: 'No data', value: 0 }
  const withoutAdviser = Math.max(0, totalStudents - totals.withAdviser)
  const topStudentRecord = [...students.value].sort((left, right) => {
    const masteryGap = Number(right.progress?.masteryProgress || 0) - Number(left.progress?.masteryProgress || 0)
    if (masteryGap !== 0) return masteryGap
    return Number(right.progress?.averageScore || 0) - Number(left.progress?.averageScore || 0)
  })[0] || null

  return {
    totalStudents,
    averageMastery: totalStudents ? Math.round(totals.mastery / totalStudents) : 0,
    averageScore: totalStudents ? Math.round(totals.score / totalStudents) : 0,
    withAdviser: totals.withAdviser,
    withoutAdviser,
    adviserCoverageRate: totalStudents ? Math.round((totals.withAdviser / totalStudents) * 100) : 0,
    atRiskStudents: totals.atRiskStudents,
    topDepartment,
    lowestDepartment,
    topStudent: topStudentRecord ? {
      name: String(topStudentRecord.name || 'No data').trim() || 'No data',
      department: String(topStudentRecord.department || 'No department').trim() || 'No department',
      value: Number(topStudentRecord.progress?.masteryProgress || 0),
    } : {
      name: 'No data',
      department: 'No department',
      value: 0,
    },
    departmentPerformance,
  }
})

const buildExportFileName = (suffix, extension) => {
  const stamp = new Date().toISOString().slice(0, 10)
  return `secretary-dashboard-${suffix}-${stamp}.${extension}`
}

const getDashboardExportRows = () => {
  const overviewRows = [
    { Section: 'Overview', Metric: 'Total HeadTeachers', Value: headTeachers.value.length, Details: 'Department leaders in the system' },
    { Section: 'Overview', Metric: 'Total Teachers', Value: teachers.value.length, Details: 'Faculty members under monitoring' },
    { Section: 'Overview', Metric: 'Active Accounts', Value: activeCount.value, Details: 'Ready for regular portal access' },
    { Section: 'Overview', Metric: 'Inactive Accounts', Value: inactiveCount.value, Details: 'Need monitoring or reactivation follow-up' },
  ]

  const studentRows = [
    { Section: 'Student Analytics', Metric: 'Top Student Across Departments', Value: studentAnalytics.value.topStudent.name, Details: `${studentAnalytics.value.topStudent.department} - ${studentAnalytics.value.topStudent.value}% mastery` },
    { Section: 'Student Analytics', Metric: 'Average Mastery Progress', Value: `${studentAnalytics.value.averageMastery}%`, Details: 'Overall learning progress' },
    { Section: 'Student Analytics', Metric: 'At-Risk Students', Value: studentAnalytics.value.atRiskStudents, Details: 'Below 60% mastery or score' },
    { Section: 'Student Analytics', Metric: 'Top Performing Department', Value: studentAnalytics.value.topDepartment.name, Details: `${studentAnalytics.value.topDepartment.value}% average mastery` },
    { Section: 'Student Analytics', Metric: 'Total Students Monitored', Value: studentAnalytics.value.totalStudents, Details: 'Student records currently tracked' },
    { Section: 'Student Analytics', Metric: 'Lowest Performing Department', Value: studentAnalytics.value.lowestDepartment.name, Details: `${studentAnalytics.value.lowestDepartment.value}% average mastery` },
  ]

  const departmentRows = departmentSummaries.value.map((department) => ({
    Section: 'Department Summary',
    Metric: department.name,
    Value: department.totalFaculty,
    Details: `${department.headTeacherCount} headteachers, ${department.teacherCount} teachers`,
  }))

  const assignmentRows = headTeacherAssignments.value.map((assignment) => ({
    Section: 'Head Teacher Assignments',
    Metric: assignment.department,
    Value: assignment.isAssigned ? 'Assigned' : 'Unassigned',
    Details: assignment.headTeacherName,
  }))

  return [...overviewRows, ...studentRows, ...departmentRows, ...assignmentRows]
}

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

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
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')
  const bodyHtml = rows.map((row) => (
    `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`
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

const exportDashboardCsv = () => {
  exportRowsToCsv(getDashboardExportRows(), buildExportFileName('report', 'csv'))
}

const exportDashboardExcel = () => {
  exportRowsToExcel(getDashboardExportRows(), buildExportFileName('report', 'xls'))
}

const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }
const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }

const goToProfile = () => {
  isAccountMenuOpen.value = false
  if (route.path !== '/secretary/profile') router.push('/secretary/profile')
}

const goToSettings = () => {
  isAccountMenuOpen.value = false
  if (route.path !== '/secretary/settings') router.push('/secretary/settings')
}

const handleLogout = () => {
  isAccountMenuOpen.value = false
  authStore.logout()
  router.push('/auth/login')
}

const handleEscape = (event) => {
  if (event.key !== 'Escape') return
  isAccountMenuOpen.value = false
  closeSidebar()
}

const handleAccountMenuClickOutside = (event) => {
  const target = event?.target
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  isAccountMenuOpen.value = false
}

const renderDepartmentChart = () => {
  const canvas = departmentChartCanvas.value
  if (!canvas) return
  const context = canvas.getContext('2d')
  if (!context) return
  if (departmentChart) departmentChart.destroy()

  departmentChart = new Chart(context, {
    type: 'bar',
    data: {
      labels: studentAnalytics.value.departmentPerformance.map((item) => item.name),
      datasets: [{
        label: 'Average Mastery',
        data: studentAnalytics.value.departmentPerformance.map((item) => item.value),
        backgroundColor: '#0f766e',
        borderRadius: 10,
        maxBarThickness: 34,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: (value) => `${value}%` },
          grid: { color: '#e2e8f0' },
        },
        x: { grid: { display: false } },
      },
    },
  })
}

const updateCharts = () => {
  renderDepartmentChart()
}

const fetchDirectory = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/secretary/directory`, getAuthConfig())
    const payload = Array.isArray(response.data?.users) ? response.data.users : []
    users.value = payload.map((user) => ({
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      username: user.username || '',
      role: user.role,
      department: user.department || '',
      status: user.status || 'inactive',
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || user.createdAt || null,
      lastLoginAt: user.lastLoginAt || null,
      managedByName: user.managedBy?.name || '',
      avatar: user.avatar || user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=334155&color=fff`,
    }))
  } finally {
    isLoading.value = false
  }
}

const fetchStudentRecords = async () => {
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/secretary/students`, getAuthConfig())
    const payload = Array.isArray(response.data?.students) ? response.data.students : []
    students.value = payload.map((student) => ({
      id: student.id || student._id,
      name: student.name || '',
      department: student.department || '',
      adviser: student.adviser || null,
      progress: {
        masteryProgress: Number(student.progress?.masteryProgress || 0),
        averageScore: Number(student.progress?.averageScore || 0),
        completedAssessments: Number(student.progress?.completedAssessments || 0),
      },
    }))
  } catch (_error) {
    students.value = []
  }
}

onMounted(() => {
  document.addEventListener('click', handleAccountMenuClickOutside)
  document.addEventListener('keydown', handleEscape)
  fetchDirectory()
  fetchStudentRecords()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountMenuClickOutside)
  document.removeEventListener('keydown', handleEscape)
  if (departmentChart) {
    departmentChart.destroy()
    departmentChart = null
  }
})

watch(students, () => {
  updateCharts()
}, { deep: true })
</script>

<style scoped>
.secretary-top-header {
  padding: 0.9rem 1rem !important;
  border-radius: 18px !important;
  border: 1px solid transparent !important;
  background: linear-gradient(#ffffff, #ffffff) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box !important;
  box-shadow: 0 12px 30px rgba(21, 128, 61, 0.08);
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

.secretary-export-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0.65rem 0.9rem;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  background: #ffffff;
  color: #166534;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.secretary-export-btn:hover {
  border-color: #4ade80;
  background: #f0fdf4;
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

.secretary-stat-section,
.secretary-summary-section,
.secretary-monitor-grid .section-card {
  margin-bottom: 1.15rem;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
}

.secretary-analytics-panel {
  margin-bottom: 1.15rem;
  padding: 1.25rem;
  border: 1px solid #d1fae5;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfffc 100%);
  box-shadow: 0 12px 32px rgba(21, 128, 61, 0.06);
}

.secretary-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.secretary-stat-card {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9rem;
  min-height: 138px;
  padding: 1.1rem;
  overflow: hidden;
  border: 1px solid #dcfce7;
  border-radius: 18px;
  background: linear-gradient(145deg, #ffffff, #f7fef9);
  box-shadow: 0 8px 22px rgba(21, 128, 61, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.secretary-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(21, 128, 61, 0.11);
}

.secretary-stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #dcfce7;
  color: #15803d;
}

.secretary-stat-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.secretary-stat-label {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.secretary-stat-value {
  margin: 0.25rem 0;
  color: #14532d;
  font-size: 1.9rem;
  line-height: 1;
}

.secretary-stat-note {
  margin-top: auto;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.4;
}

.secretary-analytics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.secretary-analytics-card {
  min-height: 132px;
  padding: 1.1rem;
  border-radius: 18px;
  border: 1px solid #dbe4ec;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.secretary-analytics-card.warning {
  background: linear-gradient(180deg, #fef2f2, #fff1f2);
  border-color: #fecaca;
}

.secretary-analytics-card.success {
  background: linear-gradient(180deg, #ecfdf5, #f0fdf4);
  border-color: #bbf7d0;
}

.secretary-analytics-card.success span,
.secretary-analytics-card.success strong,
.secretary-analytics-card.success small {
  color: #15803d;
}

.secretary-analytics-card.warning span,
.secretary-analytics-card.warning strong,
.secretary-analytics-card.warning small {
  color: #b91c1c;
}

.secretary-analytics-card span {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.secretary-analytics-card strong {
  display: block;
  margin-top: 0.45rem;
  color: #0f172a;
  font-size: 1.5rem;
  line-height: 1.1;
}

.secretary-analytics-card small {
  display: block;
  margin-top: 0.4rem;
  color: #64748b;
  line-height: 1.45;
}

.secretary-chart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

.secretary-chart-card {
  padding: 1.2rem;
  border-radius: 20px;
  border: 1px solid #d1fae5;
  background: #ffffff;
}

.secretary-chart-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
}

.secretary-chart-head p {
  margin: 0.3rem 0 0;
  color: #64748b;
  font-size: 0.86rem;
}

.secretary-chart-shell {
  position: relative;
  min-height: 280px;
  margin-top: 1rem;
}

.secretary-monitor-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 1rem;
  margin-bottom: 1.15rem;
}

.secretary-monitor-grid-single {
  grid-template-columns: minmax(0, 1fr);
}

.secretary-surface-card {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.secretary-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.15rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid #e2e8f0;
}

.secretary-summary-meta,
.secretary-directory-head-meta {
  padding: 0.4rem 0.75rem;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  background: #f0fdf4;
  color: #166534;
  font-size: 0.85rem;
  font-weight: 600;
}

.secretary-department-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.secretary-department-card {
  padding: 1.1rem;
  position: relative;
  overflow: hidden;
  border-color: #d1fae5;
  background:
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.1), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f7fef9 100%);
}

.secretary-department-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.secretary-department-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
  color: #15803d;
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.12);
}

.secretary-card-topline {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1rem;
}

.secretary-card-topline h3 {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}

.secretary-card-topline p {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

.secretary-inline-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.36rem 0.65rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.secretary-department-total {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.secretary-department-total span {
  color: #64748b;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.secretary-department-total strong {
  color: #0f172a;
  font-size: 1.55rem;
  line-height: 1;
}

.secretary-department-progress {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin-bottom: 1rem;
}

.secretary-department-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #16a34a 0%, #4ade80 100%);
}

.secretary-department-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.secretary-department-stats div {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 0.9rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.secretary-department-stats span,
.secretary-mobile-meta-item span,
.secretary-detail-item span {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.2rem;
}

.secretary-department-stats strong,
.secretary-mobile-meta-item strong,
.secretary-detail-item strong {
  color: #0f172a;
}

.secretary-activity-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.secretary-assignment-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.secretary-assignment-card {
  border: 1px solid #dbe4ec;
  border-radius: 20px;
  padding: 1rem;
  background: linear-gradient(180deg, #ffffff, #f7fef9);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.secretary-assignment-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
}

.secretary-assignment-department {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  min-width: 0;
}

.secretary-assignment-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ecfeff;
  color: #0f766e;
  border: 1px solid rgba(45, 212, 191, 0.3);
  flex-shrink: 0;
}

.secretary-assignment-department h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  line-height: 1.25;
}

.secretary-assignment-department p {
  margin: 0.28rem 0 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.45;
}

.secretary-assignment-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
}

.secretary-assignment-status.assigned {
  background: #dcfce7;
  color: #166534;
}

.secretary-assignment-status.unassigned {
  background: #fef3c7;
  color: #92400e;
}

.secretary-assignment-body {
  margin-top: 0.95rem;
  padding-top: 0.95rem;
  border-top: 1px solid #edf2f7;
}

.secretary-assignment-label {
  display: block;
  margin-bottom: 0.35rem;
  color: #64748b;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.secretary-assignment-body strong {
  color: #0f172a;
  font-size: 0.98rem;
  line-height: 1.4;
}

.secretary-assignment-body strong.is-empty {
  color: #92400e;
}

@media (max-width: 1200px) {
  .secretary-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .secretary-department-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .secretary-monitor-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .secretary-department-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .secretary-assignment-board {
    grid-template-columns: 1fr;
  }

  .secretary-analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
    grid-column: 2 / 4;
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

  .secretary-header-tools > .secretary-export-btn {
    width: 38px;
    min-height: 38px;
    padding: 0;
    border-radius: 12px;
  }

  .secretary-header-tools > .secretary-export-btn span {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .secretary-stat-section,
  .secretary-summary-section,
  .secretary-analytics-panel,
  .secretary-monitor-grid .section-card {
    padding: 1rem;
    border-radius: 18px;
  }

  .secretary-stat-grid,
  .secretary-analytics-grid {
    grid-template-columns: 1fr;
  }

  .secretary-stat-card {
    min-height: 116px;
  }

  .secretary-section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .secretary-department-grid {
    grid-template-columns: 1fr;
  }

  .secretary-assignment-topline {
    flex-direction: column;
  }

}

/* Compact dashboard layout */
.secretary-dashboard-nav {
  position: sticky;
  top: 0.45rem;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.25rem;
  width: min(100%, 620px);
  margin: 0 auto 0.7rem;
  padding: 0.28rem;
  border: 1px solid rgba(187, 247, 208, 0.9);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.09);
  backdrop-filter: blur(14px);
}

.secretary-dashboard-nav button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 34px;
  padding: 0.4rem 0.55rem;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 750;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.secretary-dashboard-nav button:hover {
  background: #f0fdf4;
  color: #166534;
}

.secretary-dashboard-nav button.active {
  background: #245b13;
  color: #ffffff;
  box-shadow: 0 5px 12px rgba(21, 128, 61, 0.2);
}

.secretary-dashboard-nav button::after {
  content: none !important;
  display: none !important;
}

.secretary-dashboard-nav button:active { transform: scale(0.98); }

#dashboard-statistics,
#dashboard-analytics,
#dashboard-directory,
#dashboard-assignments { scroll-margin-top: 4.2rem; }

.secretary-export-group {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  height: 40px;
  padding: 0.2rem;
  border: 1px solid #dcfce7;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.82);
  box-sizing: border-box;
}

.secretary-export-btn {
  height: 32px;
  min-height: 32px;
  padding: 0.4rem 0.6rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 0.74rem;
}

.secretary-stat-section,
.secretary-summary-section,
.secretary-analytics-panel,
.secretary-monitor-grid .section-card {
  margin-bottom: 0.75rem;
  padding: 0.85rem;
  border-radius: 17px;
}

.secretary-stat-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
}

.secretary-stat-section {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.secretary-stat-card {
  position: relative;
  display: block;
  min-height: 112px;
  padding: 0.85rem 3.5rem 0.8rem 0.9rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  background: #ffffff;
  box-shadow: 0 7px 20px rgba(15, 23, 42, 0.055);
}

.secretary-stat-icon {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  font-size: 0.85rem;
}

.secretary-stat-copy { min-height: 92px; }
.secretary-stat-label { max-width: 130px; font-size: 0.66rem; }
.secretary-stat-value { order: -1; margin: 0 0 0.28rem; font-size: 1.75rem; }
.secretary-stat-note { margin-top: auto; font-size: 0.66rem; line-height: 1.3; }

.secretary-stat-card:nth-child(1) .secretary-stat-icon { background: #ede9fe; color: #6d28d9; }
.secretary-stat-card:nth-child(2) .secretary-stat-icon { background: #dbeafe; color: #1d4ed8; }
.secretary-stat-card:nth-child(3) .secretary-stat-icon { background: #dcfce7; color: #15803d; }
.secretary-stat-card:nth-child(4) .secretary-stat-icon { background: #fef3c7; color: #b45309; }

.secretary-section-head {
  margin-bottom: 0.7rem;
  padding-bottom: 0.55rem;
}

.secretary-section-head .section-title { font-size: 1rem; }
.secretary-section-head .toolbar-subtitle { margin-top: 0.15rem; font-size: 0.75rem; }
.secretary-summary-meta { padding: 0.3rem 0.6rem; font-size: 0.72rem; }

.secretary-analytics-workspace {
  display: grid;
  grid-template-columns: minmax(330px, 0.9fr) minmax(420px, 1.35fr);
  gap: 0.7rem;
  align-items: stretch;
}

.secretary-analytics-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  margin: 0;
}

.secretary-analytics-card {
  min-height: 96px;
  padding: 0.7rem;
  border-radius: 12px;
}

.secretary-analytics-card span { font-size: 0.64rem; }
.secretary-analytics-card strong { margin-top: 0.22rem; font-size: 1.1rem; }
.secretary-analytics-card small { margin-top: 0.2rem; font-size: 0.7rem; }

.department-performance-card { display: grid; gap: 0.25rem; }
.secretary-performance-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.35rem;
}
.secretary-performance-row small,
.secretary-performance-row strong {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.secretary-performance-row b { font-size: 0.7rem; }
.success-text b { color: #15803d; }
.warning-text b { color: #b91c1c; }

.secretary-chart-card { padding: 0.72rem; border-radius: 12px; }
.secretary-chart-head h3 { font-size: 0.86rem; }
.secretary-chart-head p { font-size: 0.72rem; }
.secretary-chart-shell { height: 205px; min-height: 205px; margin-top: 0.4rem; }

.secretary-department-grid,
.secretary-assignment-board {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
}

.secretary-department-card,
.secretary-assignment-card { padding: 0.65rem; border-radius: 12px; }
.secretary-department-card-header { margin-bottom: 0.45rem; }
.secretary-department-icon,
.secretary-assignment-icon { width: 30px; height: 30px; border-radius: 8px; font-size: 0.72rem; }
.secretary-card-topline { gap: 0.3rem; margin-bottom: 0.45rem; }
.secretary-card-topline h3,
.secretary-assignment-department h3 { font-size: 0.78rem; line-height: 1.25; }
.secretary-inline-badge { padding: 0.2rem 0.4rem; font-size: 0.6rem; }

.secretary-leadership-badge {
  width: fit-content;
  padding: 0.17rem 0.38rem;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.58rem;
  font-weight: 800;
}
.secretary-leadership-badge.assigned { background: #dcfce7; color: #166534; }

.secretary-department-total { margin-bottom: 0.35rem; }
.secretary-department-total span { font-size: 0.62rem; }
.secretary-department-total strong { font-size: 1.05rem; }
.secretary-department-progress { height: 4px; margin-bottom: 0.45rem; }
.secretary-department-stats { gap: 0.35rem; }
.secretary-department-stats div { padding: 0.38rem 0.45rem; border-radius: 8px; }
.secretary-department-stats span { font-size: 0.6rem; }
.secretary-department-stats strong { font-size: 0.78rem; }

.secretary-assignment-board { margin-top: 0.55rem; }
.secretary-assignment-topline { gap: 0.4rem; }
.secretary-assignment-department { gap: 0.45rem; }
.secretary-assignment-status { padding: 0.18rem 0.35rem; font-size: 0.54rem; }
.secretary-assignment-body { margin-top: 0.45rem; padding-top: 0.4rem; }
.secretary-assignment-label { margin-bottom: 0.12rem; font-size: 0.58rem; }
.secretary-assignment-body strong { font-size: 0.72rem; }

@media (max-width: 1200px) {
  .secretary-stat-grid,
  .secretary-department-grid,
  .secretary-assignment-board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .secretary-analytics-workspace { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .secretary-dashboard-nav {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .secretary-dashboard-nav::-webkit-scrollbar { display: none; }
  .secretary-dashboard-nav button { padding-inline: 0.35rem; }
  .secretary-dashboard-nav button span { display: none; }
  .secretary-export-group {
    height: 38px;
    margin-left: auto;
  }
  .secretary-export-group .secretary-export-btn { width: 32px; height: 30px; min-height: 30px; padding: 0; }
  .secretary-export-group .secretary-export-btn span {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .secretary-stat-grid,
  .secretary-analytics-grid,
  .secretary-department-grid,
  .secretary-assignment-board { grid-template-columns: 1fr; }
  .secretary-stat-note { margin-top: 0.15rem; }
  .secretary-chart-shell { height: 190px; min-height: 190px; }
}
</style>
