import { createRouter, createWebHistory } from 'vue-router'

import StorageDemoView from '../views/StorageDemoView.vue'
import LoginView from '../views/auth/LoginView.vue'
import ForgotPasswordView from '../views/auth/ForgotPasswordView.vue'
import ResetPasswordView from '../views/auth/ResetPasswordView.vue'
import ChangePasswordView from '../views/auth/ChangePasswordView.vue'
import StudentDashboard from '../views/student/StudentDashboard.vue'
import StudentView from '../views/student/StudentView.vue'
import StudentLessons from '../views/student/StudentLessons.vue'
import StudentActivities from '../views/student/StudentActivities.vue'
import StudentExamMode from '../views/student/StudentExamMode.vue'
import StudentProfile from '../views/student/StudentProfile.vue'
import StudentSettings from '../views/student/StudentSettings.vue'
import TeacherView from '../views/teacher/TeacherView.vue'
import TeacherActivities from '../views/teacher/TeacherActivities.vue'
import TeacherRecords from '../views/teacher/TeacherRecords.vue'
import TeacherStudent from '../views/teacher/TeacherStudent.vue'
import TeacherProfile from '../views/teacher/TeacherProfile.vue'
import TeacherSettings from '../views/teacher/TeacherSettings.vue'
import AdminView from '../views/admin/AdminView.vue'
import AdminUserManagement from '../views/admin/AdminUserManagement.vue'
import AdminRequest from '../views/admin/AdminRequest.vue'
import AdminLoginAttempts from '../views/admin/AdminLoginAttempts.vue'
import AdminAuditLogs from '../views/admin/AdminAuditLogs.vue'
import AdminSettings from '../views/admin/AdminSettings.vue'
import AdminProfile from '../views/admin/AdminProfile.vue'
import SecretaryView from '../views/secretary/SecretaryView.vue'
import SecretaryUserList from '../views/secretary/SecretaryUserList.vue'
import SecretaryStudentsRecords from '../views/secretary/SecretaryStudentsRecords.vue'
import SecretaryArchivedRecords from '../views/secretary/SecretaryArchivedRecords.vue'
import SecretaryProfile from '../views/secretary/SecretaryProfile.vue'
import SecretarySettings from '../views/secretary/SecretarySettings.vue'
import HeadTeacherView from '../views/headteacher/HeadTeacherView.vue'
import HeadTeacherManagement from '../views/headteacher/HeadTeacherManagement.vue'
import HeadTeacherLessons from '../views/headteacher/HeadTeacherLessons.vue'
import HeadTeacherProfile from '../views/headteacher/HeadTeacherProfile.vue'
import HeadTeacherSettings from '../views/headteacher/HeadTeacherSettings.vue'

const readPersistedAuthValue = (key) => {
  try {
    const localValue = localStorage.getItem(key)
    if (localValue) return localValue
    return sessionStorage.getItem(key) || ''
  } catch (_error) {
    return ''
  }
}

const getPersistedAuth = () => {
  try {
    const token = readPersistedAuthValue('edumatch_auth_token')
    const userRaw = readPersistedAuthValue('edumatch_auth_user')
    const user = userRaw ? JSON.parse(userRaw) : null
    const normalizedRole = String(user?.role || '').toLowerCase().trim()
    return {
      isAuthenticated: Boolean(token && normalizedRole),
      role: normalizedRole || null,
      forcePasswordChange: user?.forcePasswordChange === true,
    }
  } catch (_error) {
    return {
      isAuthenticated: false,
      role: null,
      forcePasswordChange: false,
    }
  }
}

const dashboardPathByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase().trim()
  if (normalizedRole === 'student') return '/student/dashboard'
  if (normalizedRole === 'teacher') return '/teacher/dashboard'
  if (normalizedRole === 'headteacher') return '/headteacher/dashboard'
  if (normalizedRole === 'secretary') return '/secretary/dashboard'
  return '/admin/dashboard'
}

const applyRouteBodyClass = (path) => {
  if (typeof document === 'undefined') return
  const normalizedPath = String(path || '')
  const publicRouteClasses = ['public-home', 'public-courses', 'public-about', 'public-contact']
  const dashboardRouteClasses = ['student-dashboard', 'teacher-dashboard', 'admin-dashboard', 'secretary-dashboard', 'headteacher-dashboard']

  document.body.classList.remove(...publicRouteClasses, ...dashboardRouteClasses)

  if (normalizedPath.startsWith('/student')) {
    document.body.classList.add('student-dashboard')
  } else if (normalizedPath.startsWith('/teacher')) {
    document.body.classList.add('teacher-dashboard')
  } else if (normalizedPath.startsWith('/secretary')) {
    document.body.classList.add('secretary-dashboard')
  } else if (normalizedPath.startsWith('/headteacher')) {
    document.body.classList.add('headteacher-dashboard')
  } else if (normalizedPath.startsWith('/admin')) {
    document.body.classList.add('admin-dashboard')
  }

  if (normalizedPath === '/') {
    document.body.classList.add('public-home')
  } else if (normalizedPath === '/subject') {
    document.body.classList.add('public-courses')
  } else if (normalizedPath === '/about') {
    document.body.classList.add('public-about')
  } else if (normalizedPath === '/contact') {
    document.body.classList.add('public-contact')
  }
}

const TEACHER_STYLESHEET_ID = 'teacher-dashboard-css'
const TEACHER_STYLESHEET_HREF = '/css/teacher.css'
const SECRETARY_STYLESHEET_ID = 'secretary-dashboard-css'
const SECRETARY_STYLESHEET_HREF = '/css/secretary.css'
const HEADTEACHER_STYLESHEET_ID = 'headteacher-dashboard-css'
const HEADTEACHER_STYLESHEET_HREF = '/css/headteacher.css'

const ensureStylesheet = (id, href) => {
  if (typeof document === 'undefined') return
  let stylesheet = document.getElementById(id)
  if (!stylesheet) {
    stylesheet = document.createElement('link')
    stylesheet.id = id
    stylesheet.rel = 'stylesheet'
    stylesheet.href = href
    document.head.appendChild(stylesheet)
  }
}

const removeStylesheet = (id) => {
  if (typeof document === 'undefined') return
  const stylesheet = document.getElementById(id)
  if (stylesheet) stylesheet.remove()
}

const syncDashboardStylesheet = (path) => {
  const normalizedPath = String(path || '')
  if (normalizedPath.startsWith('/teacher')) {
    ensureStylesheet(TEACHER_STYLESHEET_ID, TEACHER_STYLESHEET_HREF)
  } else {
    removeStylesheet(TEACHER_STYLESHEET_ID)
  }

  if (normalizedPath.startsWith('/secretary')) {
    ensureStylesheet(SECRETARY_STYLESHEET_ID, SECRETARY_STYLESHEET_HREF)
  } else {
    removeStylesheet(SECRETARY_STYLESHEET_ID)
  }

  if (normalizedPath.startsWith('/headteacher')) {
    ensureStylesheet(HEADTEACHER_STYLESHEET_ID, HEADTEACHER_STYLESHEET_HREF)
  } else {
    removeStylesheet(HEADTEACHER_STYLESHEET_ID)
  }
}

const routes = [
  { path: '/', redirect: '/auth/login' },
  { path: '/subject', redirect: '/auth/login' },
  { path: '/courses', redirect: '/auth/login' },
  { path: '/about', redirect: '/auth/login' },
  { path: '/contact', redirect: '/auth/login' },
  { path: '/storage-demo', name: 'storage-demo', component: StorageDemoView },
  { path: '/auth/login', name: 'login', component: LoginView },
  { path: '/auth/private-login', name: 'private-login', component: LoginView },
  { path: '/auth/forgot-password', name: 'forgot-password', component: ForgotPasswordView },
  { path: '/auth/reset-password/:token', name: 'reset-password', component: ResetPasswordView },
  { path: '/auth/change-password', name: 'change-password', component: ChangePasswordView, meta: { requiresAuth: true } },
  { path: '/auth/invite/:token', name: 'invite-activation', component: LoginView },
  { path: '/error', redirect: '/auth/login' },
  {
    path: '/student',
    component: StudentView,
    meta: { requiresAuth: true, roles: ['student'] },
    children: [
      { path: '', redirect: '/student/dashboard' },
      { path: 'dashboard', name: 'student-dashboard', component: StudentDashboard },
      { path: 'lessons', name: 'student-lessons', component: StudentLessons },
      { path: 'courses', redirect: '/student/lessons' },
      { path: 'challenges', redirect: '/student/activities' },
      { path: 'activities', name: 'student-activities', component: StudentActivities },
      { path: 'profile', name: 'student-profile', component: StudentProfile },
      { path: 'settings', name: 'student-settings', component: StudentSettings },
      { path: 'schedule', redirect: '/student/dashboard' },
      { path: 'help', redirect: '/student/dashboard' },
    ],
  },
  { path: '/student/exam/:assessmentId', name: 'student-exam-mode', component: StudentExamMode, meta: { requiresAuth: true, roles: ['student'] } },
  { path: '/teacher/dashboard', name: 'teacher-dashboard', component: TeacherView, meta: { requiresAuth: true, roles: ['teacher'] } },
  { path: '/teacher/challenges', redirect: '/teacher/activities' },
  { path: '/teacher/activities', name: 'teacher-activities', component: TeacherActivities, meta: { requiresAuth: true, roles: ['teacher'] } },
  { path: '/teacher/records', name: 'teacher-records', component: TeacherRecords, meta: { requiresAuth: true, roles: ['teacher'] } },
  { path: '/teacher/students', name: 'teacher-students', component: TeacherStudent, meta: { requiresAuth: true, roles: ['teacher'] } },
  { path: '/teacher/profile', name: 'teacher-profile', component: TeacherProfile, meta: { requiresAuth: true, roles: ['teacher'] } },
  { path: '/teacher/settings', name: 'teacher-settings', component: TeacherSettings, meta: { requiresAuth: true, roles: ['teacher'] } },
  { path: '/secretary/dashboard', name: 'secretary-dashboard', component: SecretaryView, meta: { requiresAuth: true, roles: ['secretary'] } },
  { path: '/secretary/users', name: 'secretary-users', component: SecretaryUserList, meta: { requiresAuth: true, roles: ['secretary'] } },
  { path: '/secretary/students', name: 'secretary-students', component: SecretaryStudentsRecords, meta: { requiresAuth: true, roles: ['secretary'] } },
  { path: '/secretary/archived', name: 'secretary-archived', component: SecretaryArchivedRecords, meta: { requiresAuth: true, roles: ['secretary'] } },
  { path: '/secretary/profile', name: 'secretary-profile', component: SecretaryProfile, meta: { requiresAuth: true, roles: ['secretary'] } },
  { path: '/secretary/settings', name: 'secretary-settings', component: SecretarySettings, meta: { requiresAuth: true, roles: ['secretary'] } },
  { path: '/headteacher/dashboard', name: 'headteacher-dashboard', component: HeadTeacherView, meta: { requiresAuth: true, roles: ['headteacher'] } },
  { path: '/headteacher/management', name: 'headteacher-management', component: HeadTeacherManagement, meta: { requiresAuth: true, roles: ['headteacher'] } },
  { path: '/headteacher/lessons', name: 'headteacher-lessons', component: HeadTeacherLessons, meta: { requiresAuth: true, roles: ['headteacher'] } },
  { path: '/headteacher/profile', name: 'headteacher-profile', component: HeadTeacherProfile, meta: { requiresAuth: true, roles: ['headteacher'] } },
  { path: '/headteacher/settings', name: 'headteacher-settings', component: HeadTeacherSettings, meta: { requiresAuth: true, roles: ['headteacher'] } },
  { path: '/admin/dashboard', name: 'admin-dashboard', component: AdminView, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/users', name: 'admin-users', component: AdminUserManagement, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/requests', name: 'admin-requests', component: AdminRequest, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/login-attempts', name: 'admin-login-attempts', component: AdminLoginAttempts, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/audit-logs', name: 'admin-audit-logs', component: AdminAuditLogs, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/settings', name: 'admin-settings', component: AdminSettings, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/profile', name: 'admin-profile', component: AdminProfile, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/logs', redirect: '/admin/audit-logs' },
  { path: '/:pathMatch(.*)*', redirect: '/auth/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const initialPath = typeof window !== 'undefined' ? window.location.pathname : ''
const initialResolvedPath = initialPath === '/' ? '/auth/login' : initialPath
syncDashboardStylesheet(initialResolvedPath)
applyRouteBodyClass(initialResolvedPath)

router.beforeEach((to) => {
  const auth = getPersistedAuth()
  const requiresAuth = Boolean(to.meta.requiresAuth)
  const allowedRoles = Array.isArray(to.meta.roles) ? to.meta.roles : []
  const requiresPasswordChange = auth.forcePasswordChange === true

  if (requiresPasswordChange && to.path !== '/auth/change-password') {
    return { path: '/auth/change-password' }
  }

  if (!requiresAuth && (to.path === '/auth/login' || to.path === '/auth/private-login') && auth.isAuthenticated) {
    return { path: requiresPasswordChange ? '/auth/change-password' : dashboardPathByRole(auth.role) }
  }

  if (!requiresAuth) {
    syncDashboardStylesheet(to.path)
    applyRouteBodyClass(to.path)
    return true
  }

  if (!auth.isAuthenticated) {
    return {
      path: '/auth/login',
      query: { redirect: to.fullPath, error: 'Please sign in first' },
    }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) {
    return {
      path: dashboardPathByRole(auth.role),
      query: { error: 'Access denied for your role' },
    }
  }

  syncDashboardStylesheet(to.path)
  applyRouteBodyClass(to.path)
  return true
})

router.afterEach((to) => {
  syncDashboardStylesheet(to.path)
  applyRouteBodyClass(to.path)
})

export default router
