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
      <header class="top-header secretary-top-header dashboard-header">
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
            <button type="button" class="secretary-export-btn" @click="exportDashboardCsv">
              <i class="fas fa-file-csv"></i>
              <span>Export CSV</span>
            </button>
            <button type="button" class="secretary-export-btn secretary-export-btn-excel" @click="exportDashboardExcel">
              <i class="fas fa-file-excel"></i>
              <span>Export Excel</span>
            </button>
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

      <section class="section-card dashboard-panel secretary-stat-section">
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

      <section class="section-card dashboard-panel secretary-analytics-panel">
        <div class="secretary-section-head">
          <div>
            <h2 class="section-title">Student Analytics Overview</h2>
            <p class="toolbar-subtitle">A secretary-level snapshot of learner progress, adviser coverage, and department performance.</p>
          </div>
        </div>

        <div class="secretary-analytics-grid">
          <article class="secretary-analytics-card success">
            <span>Top Student Across Departments</span>
            <strong>{{ studentAnalytics.topStudent.name }}</strong>
            <small>{{ studentAnalytics.topStudent.department }} - {{ studentAnalytics.topStudent.value }}% mastery</small>
          </article>
          <article class="secretary-analytics-card">
            <span>Average Mastery Progress</span>
            <strong>{{ studentAnalytics.averageMastery }}%</strong>
            <small>Overall learning progress</small>
          </article>
          <article class="secretary-analytics-card warning">
            <span>At-Risk Students</span>
            <strong>{{ studentAnalytics.atRiskStudents }}</strong>
            <small>Below 60% mastery or score</small>
          </article>
          <article class="secretary-analytics-card success">
            <span>Top Performing Department</span>
            <strong>{{ studentAnalytics.topDepartment.name }}</strong>
            <small>{{ studentAnalytics.topDepartment.value }}% average mastery</small>
          </article>
          <article class="secretary-analytics-card">
            <span>Total Students Monitored</span>
            <strong>{{ studentAnalytics.totalStudents }}</strong>
            <small>Student records currently tracked</small>
          </article>
          <article class="secretary-analytics-card warning">
            <span>Lowest Performing Department</span>
            <strong>{{ studentAnalytics.lowestDepartment.name }}</strong>
            <small>{{ studentAnalytics.lowestDepartment.value }}% average mastery</small>
          </article>
        </div>

        <div class="secretary-chart-grid">
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

      <section class="section-card dashboard-panel secretary-summary-section">
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
              <p>{{ department.headTeacherCount > 0 ? 'Department has assigned leadership.' : 'Department currently has no assigned leadership.' }}</p>
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

      <section class="secretary-monitor-grid secretary-monitor-grid-single">
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
                    <p>{{ assignment.isAssigned ? 'Leadership assigned' : 'Needs head teacher assignment' }}</p>
                  </div>
                </div>
                <span class="secretary-assignment-status" :class="{ assigned: assignment.isAssigned, unassigned: !assignment.isAssigned }">
                  {{ assignment.isAssigned ? 'Assigned' : 'Unassigned' }}
                </span>
              </div>

              <div class="secretary-assignment-body">
                <span class="secretary-assignment-label">Assigned Head Teacher</span>
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
const users = ref([])
const students = ref([])
const accountMenuRef = ref(null)
const departmentChartCanvas = ref(null)
let departmentChart = null

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
}

.secretary-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}

.secretary-header-copy {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  flex-wrap: wrap;
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
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.82rem;
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

.secretary-stat-section,
.secretary-summary-section,
.secretary-monitor-grid .section-card {
  margin-bottom: 1.15rem;
}

.secretary-analytics-panel {
  margin-bottom: 1.15rem;
}

.secretary-analytics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.secretary-analytics-card {
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid #dbe4ec;
  background: linear-gradient(180deg, #ffffff, #f8fbfb);
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
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid #dbe4ec;
  background: linear-gradient(180deg, #ffffff, #f8fbfb);
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
  margin-bottom: 1rem;
}

.secretary-summary-meta,
.secretary-directory-head-meta {
  color: #64748b;
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
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
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
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  color: #1d4ed8;
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.08);
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
  background: rgba(37, 99, 235, 0.1);
  color: #1e40af;
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
  background: linear-gradient(90deg, #2563eb 0%, #38bdf8 100%);
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
  background: linear-gradient(180deg, #ffffff, #f8fbfb);
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
  background: #ecfdf5;
  color: #0f766e;
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
  color: #0f766e;
}

@media (max-width: 1200px) {
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

  .secretary-analytics-grid,
  .secretary-chart-grid {
    grid-template-columns: 1fr;
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

  .secretary-department-grid {
    grid-template-columns: 1fr;
  }

  .secretary-assignment-topline {
    flex-direction: column;
  }

}
</style>
