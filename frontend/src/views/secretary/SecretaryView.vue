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
@reference "../../styles/tailwind.css";

.secretary-top-header {
  @apply tw:[padding:0.9rem_1rem]!;
  @apply tw:[border-radius:18px]!;
  @apply tw:[border:1px_solid_transparent]!;
  @apply tw:[background:linear-gradient(#ffffff,_#ffffff)_padding-box,_____linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!;
  @apply tw:[box-shadow:0_12px_30px_rgba(21,_128,_61,_0.08)];
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

.secretary-export-btn {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[min-height:40px];
  @apply tw:[padding:0.65rem_0.9rem];
  @apply tw:[border:1px_solid_#bbf7d0];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#166534];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}

.secretary-export-btn:hover {
  @apply tw:[border-color:#4ade80];
  @apply tw:[background:#f0fdf4];
}

.secretary-export-btn-excel {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
}

.secretary-export-btn-excel:hover {
  @apply tw:[border-color:#86efac];
  @apply tw:[background:#dcfce7];
}

.secretary-stat-section,
.secretary-summary-section,
.secretary-monitor-grid .section-card {
  @apply tw:[margin-bottom:1.15rem];
  @apply tw:[padding:1.25rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:22px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_12px_32px_rgba(15,_23,_42,_0.05)];
}

.secretary-analytics-panel {
  @apply tw:[margin-bottom:1.15rem];
  @apply tw:[padding:1.25rem];
  @apply tw:[border:1px_solid_#d1fae5];
  @apply tw:[border-radius:22px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#fbfffc_100%)];
  @apply tw:[box-shadow:0_12px_32px_rgba(21,_128,_61,_0.06)];
}

.secretary-stat-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.secretary-stat-card {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.9rem];
  @apply tw:[min-height:138px];
  @apply tw:[padding:1.1rem];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#dcfce7];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(145deg,_#ffffff,_#f7fef9)];
  @apply tw:[box-shadow:0_8px_22px_rgba(21,_128,_61,_0.06)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease];
}

.secretary-stat-card:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[box-shadow:0_14px_28px_rgba(21,_128,_61,_0.11)];
}

.secretary-stat-icon {
  @apply tw:[width:46px];
  @apply tw:[height:46px];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#15803d];
}

.secretary-stat-copy {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[min-width:0];
}

.secretary-stat-label {
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.secretary-stat-value {
  @apply tw:[margin:0.25rem_0];
  @apply tw:[color:#14532d];
  @apply tw:[font-size:1.9rem];
  @apply tw:[line-height:1];
}

.secretary-stat-note {
  @apply tw:mt-auto;
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.4];
}

.secretary-analytics-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.9rem];
  @apply tw:[margin-bottom:1rem];
}

.secretary-analytics-card {
  @apply tw:[min-height:132px];
  @apply tw:[padding:1.1rem];
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_#dbe4ec];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_10px_24px_rgba(15,_23,_42,_0.05)];
}

.secretary-analytics-card.warning {
  @apply tw:[background:linear-gradient(180deg,_#fef2f2,_#fff1f2)];
  @apply tw:[border-color:#fecaca];
}

.secretary-analytics-card.success {
  @apply tw:[background:linear-gradient(180deg,_#ecfdf5,_#f0fdf4)];
  @apply tw:[border-color:#bbf7d0];
}

.secretary-analytics-card.success span,
.secretary-analytics-card.success strong,
.secretary-analytics-card.success small {
  @apply tw:[color:#15803d];
}

.secretary-analytics-card.warning span,
.secretary-analytics-card.warning strong,
.secretary-analytics-card.warning small {
  @apply tw:[color:#b91c1c];
}

.secretary-analytics-card span {
  @apply tw:block;
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.04em];
}

.secretary-analytics-card strong {
  @apply tw:block;
  @apply tw:[margin-top:0.45rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.5rem];
  @apply tw:[line-height:1.1];
}

.secretary-analytics-card small {
  @apply tw:block;
  @apply tw:[margin-top:0.4rem];
  @apply tw:[color:#64748b];
  @apply tw:[line-height:1.45];
}

.secretary-chart-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:1rem];
}

.secretary-chart-card {
  @apply tw:[padding:1.2rem];
  @apply tw:[border-radius:20px];
  @apply tw:[border:1px_solid_#d1fae5];
  @apply tw:[background:#ffffff];
}

.secretary-chart-head h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1rem];
}

.secretary-chart-head p {
  @apply tw:[margin:0.3rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.86rem];
}

.secretary-chart-shell {
  @apply tw:relative;
  @apply tw:[min-height:280px];
  @apply tw:[margin-top:1rem];
}

.secretary-monitor-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:1.3fr_1fr];
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1.15rem];
}

.secretary-monitor-grid-single {
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
}

.secretary-surface-card {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[box-shadow:0_10px_24px_rgba(15,_23,_42,_0.06)];
}

.secretary-section-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1.15rem];
  @apply tw:[padding-bottom:0.9rem];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
}

.secretary-summary-meta,
.secretary-directory-head-meta {
  @apply tw:[padding:0.4rem_0.75rem];
  @apply tw:[border:1px_solid_#bbf7d0];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
  @apply tw:[font-size:0.85rem];
  @apply tw:[font-weight:600];
}

.secretary-department-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.secretary-department-card {
  @apply tw:[padding:1.1rem];
  @apply tw:relative;
  @apply tw:overflow-hidden;
  @apply tw:[border-color:#d1fae5];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(34,_197,_94,_0.1),_transparent_34%),______linear-gradient(180deg,_#ffffff_0%,_#f7fef9_100%)];
}

.secretary-department-card-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
  @apply tw:[margin-bottom:1rem];
}

.secretary-department-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:linear-gradient(135deg,_#dcfce7_0%,_#f0fdf4_100%)];
  @apply tw:[color:#15803d];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(34,_197,_94,_0.12)];
}

.secretary-card-topline {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.3rem];
  @apply tw:[margin-bottom:1rem];
}

.secretary-card-topline h3 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1rem];
  @apply tw:[color:#0f172a];
}

.secretary-card-topline p {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.45];
}

.secretary-inline-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.36rem_0.65rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}

.secretary-department-total {
  @apply tw:flex;
  @apply tw:items-end;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-bottom:0.85rem];
}

.secretary-department-total span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
  @apply tw:[font-weight:700];
}

.secretary-department-total strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.55rem];
  @apply tw:[line-height:1];
}

.secretary-department-progress {
  @apply tw:w-full;
  @apply tw:[height:8px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e2e8f0];
  @apply tw:overflow-hidden;
  @apply tw:[margin-bottom:1rem];
}

.secretary-department-progress span {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:linear-gradient(90deg,_#16a34a_0%,_#4ade80_100%)];
}

.secretary-department-stats {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
}

.secretary-department-stats div {
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[padding:0.9rem];
  @apply tw:[background:rgba(255,_255,_255,_0.9)];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.7)];
}

.secretary-department-stats span,
.secretary-mobile-meta-item span,
.secretary-detail-item span {
  @apply tw:block;
  @apply tw:[font-size:0.75rem];
  @apply tw:[color:#64748b];
  @apply tw:[margin-bottom:0.2rem];
}

.secretary-department-stats strong,
.secretary-mobile-meta-item strong,
.secretary-detail-item strong {
  @apply tw:[color:#0f172a];
}

.secretary-activity-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:12px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:shrink-0;
}

.secretary-assignment-board {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
  @apply tw:[margin-top:1rem];
}

.secretary-assignment-card {
  @apply tw:[border:1px_solid_#dbe4ec];
  @apply tw:[border-radius:20px];
  @apply tw:[padding:1rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff,_#f7fef9)];
  @apply tw:[box-shadow:0_12px_28px_rgba(15,_23,_42,_0.05)];
}

.secretary-assignment-topline {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.9rem];
}

.secretary-assignment-department {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.8rem];
  @apply tw:[min-width:0];
}

.secretary-assignment-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#ecfeff];
  @apply tw:[color:#0f766e];
  @apply tw:[border:1px_solid_rgba(45,_212,_191,_0.3)];
  @apply tw:shrink-0;
}

.secretary-assignment-department h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1rem];
  @apply tw:[line-height:1.25];
}

.secretary-assignment-department p {
  @apply tw:[margin:0.28rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.45];
}

.secretary-assignment-status {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.35rem_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.03em];
  @apply tw:uppercase;
  @apply tw:whitespace-nowrap;
}

.secretary-assignment-status.assigned {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
}

.secretary-assignment-status.unassigned {
  @apply tw:[background:#fef3c7];
  @apply tw:[color:#92400e];
}

.secretary-assignment-body {
  @apply tw:[margin-top:0.95rem];
  @apply tw:[padding-top:0.95rem];
  @apply tw:[border-top:1px_solid_#edf2f7];
}

.secretary-assignment-label {
  @apply tw:block;
  @apply tw:[margin-bottom:0.35rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
  @apply tw:[font-weight:700];
}

.secretary-assignment-body strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.98rem];
  @apply tw:[line-height:1.4];
}

.secretary-assignment-body strong.is-empty {
  @apply tw:[color:#92400e];
}

@media (max-width: 1200px) {
  .secretary-stat-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .secretary-department-grid {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }

  .secretary-monitor-grid {
    @apply tw:[grid-template-columns:1fr];
  }
}

@media (max-width: 900px) {
  .secretary-department-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .secretary-assignment-board {
    @apply tw:[grid-template-columns:1fr];
  }

  .secretary-analytics-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }
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
    @apply tw:[grid-column:2_/_4];
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

  .secretary-header-tools > .secretary-export-btn {
    @apply tw:[width:38px];
    @apply tw:[min-height:38px];
    @apply tw:[padding:0];
    @apply tw:[border-radius:12px];
  }

  .secretary-header-tools > .secretary-export-btn span {
    @apply tw:absolute;
    @apply tw:[width:1px];
    @apply tw:[height:1px];
    @apply tw:[padding:0];
    @apply tw:[margin:-1px];
    @apply tw:overflow-hidden;
    @apply tw:[clip:rect(0,_0,_0,_0)];
    @apply tw:whitespace-nowrap;
    @apply tw:[border:0];
  }

  .secretary-stat-section,
  .secretary-summary-section,
  .secretary-analytics-panel,
  .secretary-monitor-grid .section-card {
    @apply tw:[padding:1rem];
    @apply tw:[border-radius:18px];
  }

  .secretary-stat-grid,
  .secretary-analytics-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .secretary-stat-card {
    @apply tw:[min-height:116px];
  }

  .secretary-section-head {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .secretary-department-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .secretary-assignment-topline {
    @apply tw:flex-col;
  }

}

/* Compact dashboard layout */
.secretary-dashboard-nav {
  @apply tw:sticky;
  @apply tw:[top:0.45rem];
  @apply tw:[z-index:30];
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.25rem];
  @apply tw:[width:min(100%,_620px)];
  @apply tw:[margin:0_auto_0.7rem];
  @apply tw:[padding:0.28rem];
  @apply tw:[border:1px_solid_rgba(187,_247,_208,_0.9)];
  @apply tw:[border-radius:13px];
  @apply tw:[background:rgba(255,_255,_255,_0.94)];
  @apply tw:[box-shadow:0_8px_24px_rgba(15,_23,_42,_0.09)];
  @apply tw:[backdrop-filter:blur(14px)];
}

.secretary-dashboard-nav button {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.4rem_0.55rem];
  @apply tw:[border:0];
  @apply tw:[border-radius:9px];
  @apply tw:[background:transparent];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:750];
  @apply tw:cursor-pointer;
  @apply tw:[transition:color_0.18s_ease,_background_0.18s_ease,_transform_0.18s_ease];
}

.secretary-dashboard-nav button:hover {
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
}

.secretary-dashboard-nav button.active {
  @apply tw:[background:#4f8a35];
  @apply tw:[color:#ffffff];
  @apply tw:[box-shadow:0_5px_12px_rgba(79,_138,_53,_0.24)];
}

.secretary-dashboard-nav button::after {
  @apply tw:[content:none]!;
  @apply tw:hidden!;
}

.secretary-dashboard-nav button:active { @apply tw:[transform:scale(0.98)]; }

#dashboard-statistics,
#dashboard-analytics,
#dashboard-directory,
#dashboard-assignments { @apply tw:[scroll-margin-top:4.2rem]; }

.secretary-export-group {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.2rem];
  @apply tw:[height:40px];
  @apply tw:[padding:0.2rem];
  @apply tw:[border:1px_solid_#dcfce7];
  @apply tw:[border-radius:11px];
  @apply tw:[background:rgba(255,_255,_255,_0.82)];
  @apply tw:box-border;
}

.secretary-export-btn {
  @apply tw:[height:32px];
  @apply tw:[min-height:32px];
  @apply tw:[padding:0.4rem_0.6rem];
  @apply tw:[border:0];
  @apply tw:[border-radius:8px];
  @apply tw:[background:transparent];
  @apply tw:[font-size:0.74rem];
}

.secretary-stat-section,
.secretary-summary-section,
.secretary-analytics-panel,
.secretary-monitor-grid .section-card {
  @apply tw:[margin-bottom:0.75rem];
  @apply tw:[padding:0.85rem];
  @apply tw:[border-radius:17px];
}

.secretary-stat-grid {
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.7rem];
}

.secretary-stat-section {
  @apply tw:[padding:0];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[box-shadow:none];
}

.secretary-stat-card {
  @apply tw:relative;
  @apply tw:block;
  @apply tw:[min-height:112px];
  @apply tw:[padding:0.85rem_3.5rem_0.8rem_0.9rem];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_7px_20px_rgba(15,_23,_42,_0.055)];
}

.secretary-stat-icon {
  @apply tw:absolute;
  @apply tw:[top:0.8rem];
  @apply tw:[right:0.8rem];
  @apply tw:[width:38px];
  @apply tw:[height:38px];
  @apply tw:[border-radius:11px];
  @apply tw:[font-size:0.85rem];
}

.secretary-stat-copy { @apply tw:[min-height:92px]; }
.secretary-stat-label { @apply tw:[max-width:130px]; @apply tw:[font-size:0.66rem]; }
.secretary-stat-value { @apply tw:[order:-1]; @apply tw:[margin:0_0_0.28rem]; @apply tw:[font-size:1.75rem]; }
.secretary-stat-note { @apply tw:mt-auto; @apply tw:[font-size:0.66rem]; @apply tw:[line-height:1.3]; }

.secretary-stat-card:nth-child(1) .secretary-stat-icon { @apply tw:[background:#ede9fe]; @apply tw:[color:#6d28d9]; }
.secretary-stat-card:nth-child(2) .secretary-stat-icon { @apply tw:[background:#dbeafe]; @apply tw:[color:#1d4ed8]; }
.secretary-stat-card:nth-child(3) .secretary-stat-icon { @apply tw:[background:#dcfce7]; @apply tw:[color:#15803d]; }
.secretary-stat-card:nth-child(4) .secretary-stat-icon { @apply tw:[background:#fef3c7]; @apply tw:[color:#b45309]; }

.secretary-section-head {
  @apply tw:[margin-bottom:0.7rem];
  @apply tw:[padding-bottom:0.55rem];
}

.secretary-section-head .section-title { @apply tw:[font-size:1rem]; }
.secretary-section-head .toolbar-subtitle { @apply tw:[margin-top:0.15rem]; @apply tw:[font-size:0.75rem]; }
.secretary-summary-meta { @apply tw:[padding:0.3rem_0.6rem]; @apply tw:[font-size:0.72rem]; }

.secretary-analytics-workspace {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(330px,_0.9fr)_minmax(420px,_1.35fr)];
  @apply tw:[gap:0.7rem];
  @apply tw:items-stretch;
}

.secretary-analytics-grid {
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.55rem];
  @apply tw:[margin:0];
}

.secretary-analytics-card {
  @apply tw:[min-height:96px];
  @apply tw:[padding:0.7rem];
  @apply tw:[border-radius:12px];
}

.secretary-analytics-card span { @apply tw:[font-size:0.64rem]; }
.secretary-analytics-card strong { @apply tw:[margin-top:0.22rem]; @apply tw:[font-size:1.1rem]; }
.secretary-analytics-card small { @apply tw:[margin-top:0.2rem]; @apply tw:[font-size:0.7rem]; }

.department-performance-card { @apply tw:grid; @apply tw:[gap:0.25rem]; }
.secretary-performance-row {
  @apply tw:grid;
  @apply tw:[grid-template-columns:34px_minmax(0,_1fr)_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
}
.secretary-performance-row small,
.secretary-performance-row strong {
  @apply tw:[min-width:0];
  @apply tw:[margin:0];
  @apply tw:overflow-hidden;
  @apply tw:[font-size:0.68rem];
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}
.secretary-performance-row b { @apply tw:[font-size:0.7rem]; }
.success-text b { @apply tw:[color:#15803d]; }
.warning-text b { @apply tw:[color:#b91c1c]; }

.secretary-chart-card { @apply tw:[padding:0.72rem]; @apply tw:[border-radius:12px]; }
.secretary-chart-head h3 { @apply tw:[font-size:0.86rem]; }
.secretary-chart-head p { @apply tw:[font-size:0.72rem]; }
.secretary-chart-shell { @apply tw:[height:205px]; @apply tw:[min-height:205px]; @apply tw:[margin-top:0.4rem]; }

.secretary-department-grid,
.secretary-assignment-board {
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.55rem];
}

.secretary-department-card,
.secretary-assignment-card { @apply tw:[padding:0.65rem]; @apply tw:[border-radius:12px]; }
.secretary-department-card-header { @apply tw:[margin-bottom:0.45rem]; }
.secretary-department-icon,
.secretary-assignment-icon { @apply tw:[width:30px]; @apply tw:[height:30px]; @apply tw:[border-radius:8px]; @apply tw:[font-size:0.72rem]; }
.secretary-card-topline { @apply tw:[gap:0.3rem]; @apply tw:[margin-bottom:0.45rem]; }
.secretary-card-topline h3,
.secretary-assignment-department h3 { @apply tw:[font-size:0.78rem]; @apply tw:[line-height:1.25]; }
.secretary-inline-badge { @apply tw:[padding:0.2rem_0.4rem]; @apply tw:[font-size:0.6rem]; }

.secretary-leadership-badge {
  @apply tw:w-fit;
  @apply tw:[padding:0.17rem_0.38rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#fef3c7];
  @apply tw:[color:#92400e];
  @apply tw:[font-size:0.58rem];
  @apply tw:[font-weight:800];
}
.secretary-leadership-badge.assigned { @apply tw:[background:#dcfce7]; @apply tw:[color:#166534]; }

.secretary-department-total { @apply tw:[margin-bottom:0.35rem]; }
.secretary-department-total span { @apply tw:[font-size:0.62rem]; }
.secretary-department-total strong { @apply tw:[font-size:1.05rem]; }
.secretary-department-progress { @apply tw:[height:4px]; @apply tw:[margin-bottom:0.45rem]; }
.secretary-department-stats { @apply tw:[gap:0.35rem]; }
.secretary-department-stats div { @apply tw:[padding:0.38rem_0.45rem]; @apply tw:[border-radius:8px]; }
.secretary-department-stats span { @apply tw:[font-size:0.6rem]; }
.secretary-department-stats strong { @apply tw:[font-size:0.78rem]; }

.secretary-assignment-board { @apply tw:[margin-top:0.55rem]; }
.secretary-assignment-topline { @apply tw:[gap:0.4rem]; }
.secretary-assignment-department { @apply tw:[gap:0.45rem]; }
.secretary-assignment-status { @apply tw:[padding:0.18rem_0.35rem]; @apply tw:[font-size:0.54rem]; }
.secretary-assignment-body { @apply tw:[margin-top:0.45rem]; @apply tw:[padding-top:0.4rem]; }
.secretary-assignment-label { @apply tw:[margin-bottom:0.12rem]; @apply tw:[font-size:0.58rem]; }
.secretary-assignment-body strong { @apply tw:[font-size:0.72rem]; }

@media (max-width: 1200px) {
  .secretary-stat-grid,
  .secretary-department-grid,
  .secretary-assignment-board { @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))]; }
  .secretary-analytics-workspace { @apply tw:[grid-template-columns:1fr]; }
}

@media (max-width: 768px) {
  .secretary-dashboard-nav {
    @apply tw:w-full;
    @apply tw:overflow-x-auto;
    @apply tw:[scrollbar-width:none];
  }
  .secretary-dashboard-nav::-webkit-scrollbar { @apply tw:hidden; }
  .secretary-dashboard-nav button { @apply tw:[padding-inline:0.35rem]; }
  .secretary-dashboard-nav button span { @apply tw:hidden; }
  .secretary-export-group {
    @apply tw:[height:38px];
    @apply tw:ml-auto;
  }
  .secretary-export-group .secretary-export-btn { @apply tw:[width:32px]; @apply tw:[height:30px]; @apply tw:[min-height:30px]; @apply tw:[padding:0]; }
  .secretary-export-group .secretary-export-btn span {
    @apply tw:absolute;
    @apply tw:[width:1px];
    @apply tw:[height:1px];
    @apply tw:[padding:0];
    @apply tw:[margin:-1px];
    @apply tw:overflow-hidden;
    @apply tw:[clip:rect(0,_0,_0,_0)];
    @apply tw:whitespace-nowrap;
    @apply tw:[border:0];
  }
  .secretary-stat-grid,
  .secretary-analytics-grid,
  .secretary-department-grid,
  .secretary-assignment-board { @apply tw:[grid-template-columns:1fr]; }
  .secretary-stat-note { @apply tw:[margin-top:0.15rem]; }
  .secretary-chart-shell { @apply tw:[height:190px]; @apply tw:[min-height:190px]; }
}

</style>
