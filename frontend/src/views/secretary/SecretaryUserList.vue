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
              <span>View-only access</span>
            </div>
            <div class="secretary-sidebar-chip">Monitoring Access</div>
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
              <h1>Secretary User List</h1>
              <p class="header-subtitle">Review and search HeadTeacher and Teacher records in one dedicated view-only directory.</p>
            </div>
            <div class="secretary-access-chip">
              <i class="fas fa-eye"></i>
              <span>View-only monitoring</span>
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
                    <span class="secretary-person-avatar">{{ getUserInitials(user.name) }}</span>
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
const statusLabel = (status) => normalizedStatus(status) === 'active' ? 'Active' : 'Inactive'
const roleLabel = (role) => role === 'headteacher' ? 'HeadTeacher' : (role === 'teacher' ? 'Teacher' : String(role || 'User'))
const getUserInitials = (name) => {
  const value = String(name || '').trim()
  if (!value) return 'U'
  return value.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
}
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

.secretary-userlist-panel {
  margin-bottom: 1rem;
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

.secretary-filter-bar {
  margin-bottom: 1rem;
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

.secretary-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 34px;
  padding: 0.38rem 0.72rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 600;
}

.secretary-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: currentColor;
}

.secretary-status-indicator.status-active {
  color: #15803d;
  background: #dcfce7;
  border-color: #bbf7d0;
}

.secretary-status-indicator.status-inactive {
  color: #b45309;
  background: #fef3c7;
  border-color: #fde68a;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
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
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(15, 23, 42, 0.35) transparent;
}

.secretary-table-wrap::-webkit-scrollbar {
  height: 6px;
}

.secretary-table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.secretary-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.35);
  border-radius: 999px;
}

.secretary-table {
  width: 100%;
  min-width: 880px;
  border-collapse: separate;
  border-spacing: 0;
}

.secretary-table thead th {
  padding: 1rem 1rem;
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
  padding: 1rem 1rem;
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
  min-width: 220px;
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
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.secretary-person-copy {
  display: grid;
  gap: 0.15rem;
}

.secretary-person-copy strong {
  color: #0f172a;
  line-height: 1.3;
}

.secretary-person-copy small {
  color: #64748b;
  font-size: 0.78rem;
}

.secretary-email-link {
  color: #1d4ed8;
  text-decoration: none;
  word-break: break-word;
}

.secretary-email-link:hover {
  text-decoration: underline;
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

.role-badge.role-headteacher {
  background: #dbeafe;
  color: #1d4ed8;
}

.role-badge.role-teacher {
  background: #dcfce7;
  color: #166534;
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

  .secretary-filter-bar {
    grid-template-columns: 1fr;
  }

  .secretary-filter-bar .secretary-filter-group {
    display: grid !important;
  }

  .secretary-table-wrap {
    display: block !important;
    border-radius: 14px;
  }

  .secretary-table {
    min-width: 760px;
  }

  .secretary-mobile-list {
    display: none !important;
  }
}
</style>
