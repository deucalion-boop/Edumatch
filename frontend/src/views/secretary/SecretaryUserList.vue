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
              <h1>Teacher Monitor</h1>
              <p class="header-subtitle">Review and search HeadTeacher and Teacher records in one dedicated view-only directory.</p>
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

      <section class="section-card dashboard-panel secretary-userlist-panel">
        <div class="secretary-section-head">
          <div>
            <h2 class="section-title">Faculty Directory</h2>
            <p class="toolbar-subtitle">Search and monitor faculty records without editing permissions.</p>
          </div>
          <div class="secretary-summary-meta">
            <span>{{ filteredUsers.length }} records</span>
          </div>
        </div>

        <div class="secretary-search-row">
          <label class="secretary-search-field">
            <i class="fas fa-search"></i>
            <input v-model.trim="searchTerm" type="search" placeholder="Search by name, email, department, or role" aria-label="Search user list">
          </label>
          <div class="secretary-export-actions">
            <button type="button" class="secretary-export-btn" @click="exportUsersCsv">
              <i class="fas fa-file-csv"></i>
              <span>Export CSV</span>
            </button>
            <button type="button" class="secretary-export-btn secretary-export-btn-excel" @click="exportUsersExcel">
              <i class="fas fa-file-excel"></i>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div class="secretary-filter-bar filter-bar">
          <label class="secretary-filter-group">
            <span>Role</span>
            <select v-model="filters.role">
              <option value="all">All Roles</option>
              <option value="headteacher">HeadTeacher</option>
              <option value="teacher">Teacher</option>
            </select>
          </label>

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
          <table class="secretary-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody v-if="isLoading">
              <tr>
                <td colspan="6">
                  <div class="table-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading user list...</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="filteredUsers.length === 0">
              <tr>
                <td colspan="6">
                  <div class="table-state">
                    <i class="fas fa-folder-open"></i>
                    <span>No users found.</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <div class="secretary-person-cell">
                    <div class="secretary-person-avatar">
                      <i class="fas fa-user" aria-hidden="true"></i>
                    </div>
                    <div class="secretary-person-copy">
                      <strong>{{ user.name }}</strong>
                      <small>{{ roleLabel(user.role) }} record</small>
                    </div>
                  </div>
                </td>
                <td>
                  <a :href="`mailto:${user.email}`" class="secretary-email-link">{{ user.email }}</a>
                </td>
                <td><span class="secretary-badge role-badge" :class="`role-${user.role}`">{{ roleLabel(user.role) }}</span></td>
                <td>
                  <span class="secretary-badge department-badge">{{ user.department || 'Not assigned' }}</span>
                </td>
                <td><span class="secretary-status-indicator" :class="`status-${normalizedStatus(user.status)}`"><span class="secretary-status-dot"></span><span>{{ statusLabel(user.status) }}</span></span></td>
                <td>
                  <span class="secretary-last-login-chip">{{ formatDateTime(user.lastLoginAt) }}</span>
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
const searchTerm = ref('')
const users = ref([])
const accountMenuRef = ref(null)
const filters = ref({ role: 'all', department: 'all', status: 'all' })
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
const statusLabel = (status) => normalizedStatus(status) === 'active' ? 'Active' : 'Inactive'
const roleLabel = (role) => role === 'headteacher' ? 'HeadTeacher' : (role === 'teacher' ? 'Teacher' : String(role || 'User'))
const formatDateTime = (value) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(parsed)
}

const departmentOptions = computed(() => {
  const merged = new Set(CORE_DEPARTMENTS)
  users.value.map((user) => String(user.department || '').trim()).filter(Boolean).forEach((department) => merged.add(department))
  return Array.from(merged).sort((left, right) => left.localeCompare(right))
})

const filteredUsers = computed(() => {
  const query = String(searchTerm.value || '').trim().toLowerCase()
  return users.value.filter((user) => {
    const matchesRole = filters.value.role === 'all' || user.role === filters.value.role
    const matchesDepartment = filters.value.department === 'all' || String(user.department || '').trim() === filters.value.department
    const matchesStatus = filters.value.status === 'all' || normalizedStatus(user.status) === filters.value.status
    const haystack = [user.name, user.email, user.department, roleLabel(user.role)].map((value) => String(value || '').toLowerCase()).join(' ')
    return matchesRole && matchesDepartment && matchesStatus && (!query || haystack.includes(query))
  })
})

const buildExportFileName = (suffix, extension) => {
  const stamp = new Date().toISOString().slice(0, 10)
  return `secretary-user-list-${suffix}-${stamp}.${extension}`
}

const getUsersExportRows = () => filteredUsers.value.map((user) => ({
  Name: user.name || 'N/A',
  Email: user.email || 'N/A',
  Role: roleLabel(user.role),
  Department: user.department || 'Not assigned',
  Status: statusLabel(user.status),
  'Last Login': formatDateTime(user.lastLoginAt),
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

const exportRowsToExcel = (rows, fileName, worksheetName) => {
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

const exportUsersCsv = () => {
  exportRowsToCsv(getUsersExportRows(), buildExportFileName('filtered', 'csv'))
}

const exportUsersExcel = () => {
  exportRowsToExcel(getUsersExportRows(), buildExportFileName('filtered', 'xls'), 'Secretary User List')
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

const fetchDirectory = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/secretary/directory`, getAuthConfig())
    const payload = Array.isArray(response.data?.users) ? response.data.users : []
    users.value = payload.map((user) => ({
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      status: user.status || 'inactive',
      lastLoginAt: user.lastLoginAt || null,
    }))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleAccountMenuClickOutside)
  fetchDirectory()
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

.secretary-userlist-panel {
  @apply tw:[margin-bottom:1rem];
  @apply tw:[padding:1.35rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[border-radius:24px];
  @apply tw:[background:linear-gradient(#ffffff,_#ffffff)_padding-box,_____linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!;
  @apply tw:[box-shadow:none];
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

.secretary-filter-bar {
  @apply tw:[margin-bottom:1rem];
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

.secretary-status-indicator {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.38rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[font-weight:600];
}

.secretary-status-dot {
  @apply tw:[width:10px];
  @apply tw:[height:10px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:currentColor];
}

.secretary-status-indicator.status-active {
  @apply tw:[color:#15803d];
  @apply tw:[background:#dcfce7];
  @apply tw:[border-color:#bbf7d0];
}

.secretary-status-indicator.status-inactive {
  @apply tw:[color:#b45309];
  @apply tw:[background:#fef3c7];
  @apply tw:[border-color:#fde68a];
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
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.85rem];
  @apply tw:[margin-top:-0.85rem];
  @apply tw:[margin-bottom:1.2rem];
  @apply tw:[padding:0_1rem_1rem];
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-top:0];
  @apply tw:[border-radius:0_0_18px_18px];
  @apply tw:[background:#ffffff];
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
  @apply tw:[-webkit-overflow-scrolling:touch];
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
  @apply tw:[min-width:880px];
  @apply tw:border-separate;
  @apply tw:[border-spacing:0];
}

.secretary-table thead th {
  @apply tw:[padding:1rem_1rem];
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
  @apply tw:[padding:1rem_1rem];
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
  @apply tw:[min-width:220px];
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
  @apply tw:[line-height:1.3];
}

.secretary-person-copy small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
}

.secretary-email-link {
  @apply tw:[color:#1d4ed8];
  @apply tw:[text-decoration:none];
  @apply tw:[word-break:break-word];
}

.secretary-email-link:hover {
  @apply tw:[text-decoration:underline];
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

.role-badge.role-headteacher {
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
}

.role-badge.role-teacher {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
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

  .secretary-filter-bar {
    @apply tw:[grid-template-columns:1fr];
  }

  .secretary-filter-bar .secretary-filter-group {
    @apply tw:grid!;
  }

  .secretary-table-wrap {
    @apply tw:block!;
    @apply tw:[border-radius:14px];
  }

  .secretary-table {
    @apply tw:[min-width:760px];
  }

  .secretary-mobile-list {
    @apply tw:hidden!;
  }
}

</style>
