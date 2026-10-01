<template>
  <div class="teacher-dashboard secretary-dashboard-page">
    <aside id="secretary-sidebar-drawer" class="teacher-sidebar" :class="{ active: isSidebarOpen }">
      <div class="sidebar-header">
        <div class="teacher-logo">
          <div class="secretary-logo-icon"><img src="/logo.png" alt="EduMatch" class="secretary-logo-img"></div>
          <div class="teacher-logo-text"><h2>EduMatch</h2><p>Secretary Portal</p></div>
        </div>
        <button type="button" class="sidebar-close" aria-label="Close sidebar" @click="closeSidebar"><i class="fas fa-times"></i></button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <h4 class="nav-section-title">Workspace</h4>
          <router-link to="/secretary/dashboard" class="nav-link" :class="{ active: route.path === '/secretary/dashboard' }" @click="closeSidebar">
            <i class="fas fa-home"></i><span>Dashboard</span>
          </router-link>
          <router-link to="/secretary/teachers" class="nav-link" :class="{ active: route.path === '/secretary/teachers' }" @click="closeSidebar">
            <i class="fas fa-users"></i><span>Teacher Monitoring</span>
          </router-link>
          <router-link to="/secretary/users" class="nav-link" :class="{ active: route.path === '/secretary/users' }" @click="closeSidebar">
            <i class="fas fa-user-cog"></i><span>User Management</span>
          </router-link>
          <router-link to="/secretary/students" class="nav-link" :class="{ active: route.path === '/secretary/students' }" @click="closeSidebar">
            <i class="fas fa-user-graduate"></i><span>Student Records</span>
          </router-link>
          <router-link to="/secretary/archived" class="nav-link" :class="{ active: route.path === '/secretary/archived' }" @click="closeSidebar">
            <i class="fas fa-box-archive"></i><span>Archived</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="secretary-profile">
          <div class="secretary-avatar"><i class="fas fa-user" aria-hidden="true"></i></div>
          <div class="secretary-info">
            <h5>{{ displayName }}</h5>
            <div class="secretary-profile-meta"><p class="secretary-role">Secretary</p><div class="secretary-status"><span class="secretary-profile-status-indicator active"></span><span>active</span></div></div>
          </div>
        </div>
      </div>
    </aside>

    <button v-if="isSidebarOpen" type="button" class="sidebar-backdrop" aria-label="Close sidebar" @click="closeSidebar"></button>

    <main class="teacher-main secretary-main dashboard-container">
      <header class="top-header secretary-top-header dashboard-header">
        <div class="header-content secretary-header-content dashboard-header-content">
          <div class="header-left secretary-header-copy dashboard-header-copy">
            <button type="button" class="mobile-menu-toggle" aria-label="Open sidebar" @click="toggleSidebar"><i class="fas fa-bars"></i></button>
            <div><h1>User Management</h1><p class="header-subtitle">Create and manage Head Teacher, Teacher, and Student accounts.</p></div>
          </div>
          <div class="secretary-header-tools">
            <button type="button" class="secretary-primary-btn" @click="openCreate"><i class="fas fa-user-plus"></i><span>Add account</span></button>
            <div ref="accountMenuRef" class="account-menu secretary-account-menu">
              <button type="button" class="header-tour-btn account-menu-trigger" aria-label="Account menu" @click="isAccountMenuOpen = !isAccountMenuOpen"><i class="fas fa-cog"></i></button>
              <div v-if="isAccountMenuOpen" class="account-menu-dropdown">
                <button type="button" class="account-menu-item" @click="goToProfile"><i class="fas fa-user"></i><span>Profile</span></button>
                <button type="button" class="account-menu-item" @click="goToSettings"><i class="fas fa-cog"></i><span>Settings</span></button>
                <button type="button" class="account-menu-item danger" @click="handleLogout"><i class="fas fa-sign-out-alt"></i><span>Logout</span></button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section class="section-card dashboard-panel secretary-management-panel">
        <div class="secretary-section-head">
          <div><h2 class="section-title">Account directory</h2><p class="toolbar-subtitle">Showing only roles the Secretary is permitted to manage.</p></div>
          <span class="secretary-summary-meta">{{ filteredUsers.length }} records</span>
        </div>

        <div class="secretary-management-toolbar">
          <label class="secretary-search-field"><i class="fas fa-search"></i><input v-model.trim="search" type="search" placeholder="Search name, email, username, department" aria-label="Search managed accounts"></label>
          <label class="secretary-filter-group"><span>Role</span><select v-model="filters.role"><option value="all">All roles</option><option value="headteacher">Head Teacher</option><option value="teacher">Teacher</option><option value="student">Student</option></select></label>
          <label class="secretary-filter-group"><span>Status</span><select v-model="filters.status"><option value="all">All statuses</option><option v-for="status in statuses" :key="status" :value="status">{{ capitalize(status) }}</option></select></label>
          <button type="button" class="secretary-secondary-btn" @click="resetFilters"><i class="fas fa-rotate-left"></i> Reset</button>
        </div>

        <div v-if="errorMessage" class="secretary-feedback error" role="alert">{{ errorMessage }}</div>

        <div class="secretary-table-wrap">
          <table class="secretary-table secretary-management-table">
            <thead><tr><th>User</th><th>Role</th><th>Assignment</th><th>Status</th><th>Last active</th><th>Actions</th></tr></thead>
            <tbody v-if="isLoading"><tr><td colspan="6"><div class="table-state"><i class="fas fa-spinner fa-spin"></i><span>Loading accounts...</span></div></td></tr></tbody>
            <tbody v-else-if="filteredUsers.length === 0"><tr><td colspan="6"><div class="table-state"><i class="fas fa-user-slash"></i><span>No matching accounts found.</span></div></td></tr></tbody>
            <tbody v-else>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td><div class="secretary-person-cell"><div class="secretary-person-avatar">{{ initials(user.name) }}</div><div class="secretary-person-copy"><strong>{{ user.name }}</strong><small>{{ user.email }} · {{ user.username || 'No username' }}</small></div></div></td>
                <td><span class="secretary-role-pill" :class="`role-${user.role}`">{{ roleLabel(user.role) }}</span></td>
                <td>{{ assignmentLabel(user) }}</td>
                <td><span class="secretary-account-status" :class="`status-${user.status}`"><span></span>{{ capitalize(user.status) }}</span></td>
                <td>{{ formatDate(user.lastActivityAt || user.lastLoginAt) }}</td>
                <td><div class="secretary-row-actions">
                  <button type="button" title="View account" @click="viewUser(user)"><i class="fas fa-eye"></i></button>
                  <button type="button" title="Edit account" @click="openEdit(user)"><i class="fas fa-pen"></i></button>
                  <button type="button" :title="user.status === 'active' ? 'Deactivate account' : 'Activate account'" @click="toggleStatus(user)"><i :class="user.status === 'active' ? 'fas fa-pause' : 'fas fa-play'"></i></button>
                  <button type="button" title="Send new temporary password" @click="resendInvite(user)"><i class="fas fa-paper-plane"></i></button>
                  <button type="button" class="danger" title="Delete account" @click="openDelete(user)"><i class="fas fa-trash"></i></button>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <div v-if="formModal.open" class="secretary-modal" role="dialog" aria-modal="true" :aria-labelledby="formModal.mode + '-account-title'">
      <button type="button" class="secretary-modal-backdrop" aria-label="Close dialog" @click="closeForm"></button>
      <section class="secretary-modal-card">
        <header><div><h2 :id="formModal.mode + '-account-title'">{{ formModal.mode === 'create' ? 'Create account' : 'Edit account' }}</h2><p>Fields and permissions are saved to the existing account record.</p></div><button type="button" class="secretary-icon-btn" aria-label="Close" @click="closeForm"><i class="fas fa-times"></i></button></header>
        <form class="secretary-account-form" @submit.prevent="submitForm">
          <div class="secretary-form-grid">
            <label class="secretary-field"><span>Full name *</span><input v-model.trim="form.name" required maxlength="100"></label>
            <label class="secretary-field"><span>Username *</span><input v-model.trim="form.username" required maxlength="50"></label>
            <label class="secretary-field"><span>Gmail address *</span><input v-model.trim="form.email" type="email" required placeholder="user@gmail.com"></label>
            <label class="secretary-field"><span>Contact number</span><input v-model.trim="form.contactNumber" type="tel" placeholder="+63 912 345 6789"></label>
            <label class="secretary-field"><span>Role *</span><select v-model="form.role" required @change="onRoleChange"><option value="headteacher">Head Teacher</option><option value="teacher">Teacher</option><option value="student">Student</option></select></label>
            <label v-if="formModal.mode === 'edit'" class="secretary-field"><span>Status *</span><select v-model="form.status"><option v-for="status in statuses" :key="status" :value="status">{{ capitalize(status) }}</option></select></label>
            <label v-if="['headteacher', 'teacher'].includes(form.role)" class="secretary-field"><span>Department *</span><select v-model="form.department" required><option value="" disabled>Select department</option><option v-for="department in departments" :key="department" :value="department">{{ department }}</option></select></label>
            <label v-if="form.role === 'teacher'" class="secretary-field"><span>Subject</span><input v-model.trim="form.subject" placeholder="Defaults to department"></label>
            <label v-if="form.role === 'student'" class="secretary-field"><span>Grade level *</span><select v-model="form.gradeLevel" required><option v-for="grade in gradeLevels" :key="grade" :value="grade">{{ grade }}</option></select></label>
            <label v-if="form.role === 'student'" class="secretary-field"><span>Strand</span><select v-model="form.strand"><option value="">Not assigned</option><option v-for="strand in strands" :key="strand" :value="strand">{{ strand }}</option></select></label>
          </div>
          <div v-if="formError" class="secretary-feedback error" role="alert">{{ formError }}</div>
          <div class="secretary-form-actions"><button type="button" class="secretary-secondary-btn" @click="closeForm">Cancel</button><button type="submit" class="secretary-primary-btn" :disabled="isSaving"><i :class="isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>{{ isSaving ? 'Saving...' : (formModal.mode === 'create' ? 'Create account' : 'Save changes') }}</button></div>
        </form>
      </section>
    </div>

    <div v-if="detailsModal" class="secretary-modal" role="dialog" aria-modal="true" aria-labelledby="account-details-title">
      <button type="button" class="secretary-modal-backdrop" aria-label="Close dialog" @click="detailsModal = null"></button>
      <section class="secretary-modal-card compact">
        <header><div><h2 id="account-details-title">Account details</h2><p>Current profile and access information.</p></div><button type="button" class="secretary-icon-btn" @click="detailsModal = null"><i class="fas fa-times"></i></button></header>
        <div class="secretary-details-grid"><div><span>Name</span><strong>{{ detailsModal.name }}</strong></div><div><span>Role</span><strong>{{ roleLabel(detailsModal.role) }}</strong></div><div><span>Email</span><strong>{{ detailsModal.email }}</strong></div><div><span>Username</span><strong>{{ detailsModal.username || 'N/A' }}</strong></div><div><span>Status</span><strong>{{ capitalize(detailsModal.status) }}</strong></div><div><span>Assignment</span><strong>{{ assignmentLabel(detailsModal) }}</strong></div><div><span>Contact</span><strong>{{ detailsModal.contactNumber || 'N/A' }}</strong></div><div><span>Joined</span><strong>{{ formatDate(detailsModal.createdAt) }}</strong></div></div>
      </section>
    </div>

    <div v-if="deleteTarget" class="secretary-modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
      <button type="button" class="secretary-modal-backdrop" aria-label="Close dialog" @click="closeDelete"></button>
      <section class="secretary-modal-card compact"><header><div><h2 id="delete-account-title">Delete account</h2><p>This permanently removes {{ deleteTarget.name }}.</p></div><button type="button" class="secretary-icon-btn" @click="closeDelete"><i class="fas fa-times"></i></button></header><form class="secretary-account-form" @submit.prevent="deleteUser"><label class="secretary-field"><span>Enter your Secretary password *</span><input v-model="deletePassword" type="password" required autocomplete="current-password"></label><div v-if="deleteError" class="secretary-feedback error">{{ deleteError }}</div><div class="secretary-form-actions"><button type="button" class="secretary-secondary-btn" @click="closeDelete">Cancel</button><button type="submit" class="secretary-danger-btn" :disabled="isDeleting"><i class="fas fa-trash"></i>{{ isDeleting ? 'Deleting...' : 'Delete account' }}</button></div></form></section>
    </div>

    <div v-if="toast.message" class="secretary-toast" :class="toast.type" role="status"><i :class="toast.type === 'error' ? 'fas fa-circle-exclamation' : 'fas fa-circle-check'"></i><span>{{ toast.message }}</span><button type="button" aria-label="Dismiss" @click="toast.message = ''"><i class="fas fa-times"></i></button></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { isValidPhilippinePhone, normalizePhilippinePhone } from '../../utils/phone.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')
const formError = ref('')
const deleteError = ref('')
const users = ref([])
const search = ref('')
const filters = reactive({ role: 'all', status: 'all' })
const formModal = reactive({ open: false, mode: 'create' })
const detailsModal = ref(null)
const deleteTarget = ref(null)
const deletePassword = ref('')
const toast = reactive({ message: '', type: 'success' })
let toastTimer = null

const departments = ['Mathematics', 'English', 'Science', 'TLE', 'Filipino', 'Araling Panlipunan', 'Edukasyon sa Pagpapakatao (ESP)', 'MAPEH']
const gradeLevels = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
const strands = ['STEM', 'HUMSS', 'ABM', 'TVL']
const statuses = ['pending', 'active', 'inactive', 'suspended']
const managedRoles = ['headteacher', 'teacher', 'student']
const emptyForm = () => ({ id: '', name: '', email: '', username: '', contactNumber: '', role: 'headteacher', status: 'active', department: '', subject: '', gradeLevel: 'Grade 10', strand: '' })
const form = reactive(emptyForm())

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'Secretary').trim())
const apiBase = computed(() => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  const root = !configured ? '/api' : (configured.endsWith('/api') ? configured : `${configured}/api`)
  return `${root}/secretary`
})
const authConfig = () => ({ headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {} })
const roleLabel = (role) => ({ headteacher: 'Head Teacher', teacher: 'Teacher', student: 'Student' }[role] || 'User')
const capitalize = (value) => { const text = String(value || ''); return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'N/A' }
const initials = (name) => String(name || 'U').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'
const formatDate = (value) => { if (!value) return 'N/A'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) }
const assignmentLabel = (user) => user.role === 'student' ? [user.gradeLevel, user.strand].filter(Boolean).join(' · ') || 'Not assigned' : [user.department, user.role === 'teacher' ? user.subject : ''].filter(Boolean).join(' · ') || 'Not assigned'
const mapUser = (user) => ({ id: user.id || user._id, name: user.name || '', email: user.email || '', username: user.username || '', contactNumber: normalizePhilippinePhone(user.contactNumber), role: String(user.role || '').toLowerCase(), status: String(user.status || 'active').toLowerCase(), department: user.department || '', subject: user.subject || '', gradeLevel: user.gradeLevel || 'Grade 10', strand: user.strand || '', createdAt: user.createdAt || null, lastLoginAt: user.lastLoginAt || null, lastActivityAt: user.lastActivityAt || null })

const filteredUsers = computed(() => {
  const query = search.value.toLowerCase()
  return users.value.filter((user) => {
    const matchesRole = filters.role === 'all' || user.role === filters.role
    const matchesStatus = filters.status === 'all' || user.status === filters.status
    const haystack = [user.name, user.email, user.username, user.department, user.subject, user.gradeLevel, user.strand].join(' ').toLowerCase()
    return matchesRole && matchesStatus && (!query || haystack.includes(query))
  })
})

const notify = (message, type = 'success') => { toast.message = message; toast.type = type; if (toastTimer) window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { toast.message = '' }, 5000) }
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }
const goToProfile = () => { isAccountMenuOpen.value = false; router.push('/secretary/profile') }
const goToSettings = () => { isAccountMenuOpen.value = false; router.push('/secretary/settings') }
const handleLogout = () => { isAccountMenuOpen.value = false; authStore.logout(); router.push('/auth/login') }
const handleOutsideClick = (event) => { if (accountMenuRef.value && event.target instanceof Node && accountMenuRef.value.contains(event.target)) return; isAccountMenuOpen.value = false }
const resetFilters = () => { search.value = ''; filters.role = 'all'; filters.status = 'all' }

const fetchUsers = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await axios.get(`${apiBase.value}/users`, authConfig())
    users.value = (Array.isArray(response.data?.users) ? response.data.users : []).map(mapUser).filter((user) => managedRoles.includes(user.role))
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to load managed accounts.'
  } finally { isLoading.value = false }
}

const openCreate = () => { Object.assign(form, emptyForm()); formModal.mode = 'create'; formModal.open = true; formError.value = '' }
const openEdit = (user) => { Object.assign(form, emptyForm(), user); formModal.mode = 'edit'; formModal.open = true; formError.value = '' }
const closeForm = () => { if (!isSaving.value) formModal.open = false }
const onRoleChange = () => { if (!['headteacher', 'teacher'].includes(form.role)) form.department = ''; if (form.role !== 'teacher') form.subject = ''; if (form.role !== 'student') { form.gradeLevel = 'Grade 10'; form.strand = '' } }
const validateForm = () => {
  if (!form.name || !form.username || !form.email) return 'Name, username, and email are required.'
  if (!/^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@gmail\.com$/i.test(form.email)) return 'Enter a valid Gmail address.'
  if (!managedRoles.includes(form.role)) return 'Select a permitted role.'
  if (['headteacher', 'teacher'].includes(form.role) && !form.department) return 'Department is required for this role.'
  const phone = normalizePhilippinePhone(form.contactNumber)
  if (phone && !isValidPhilippinePhone(phone)) return 'Enter a valid Philippine contact number beginning with +63.'
  return ''
}
const submitForm = async () => {
  formError.value = validateForm()
  if (formError.value) return
  const payload = { name: form.name.trim(), email: form.email.trim(), username: form.username.trim(), role: form.role, status: formModal.mode === 'create' ? 'active' : form.status, contactNumber: normalizePhilippinePhone(form.contactNumber), department: ['headteacher', 'teacher'].includes(form.role) ? form.department : '', subject: form.role === 'teacher' ? form.subject : '', gradeLevel: form.role === 'student' ? form.gradeLevel : '', strand: form.role === 'student' ? form.strand : '' }
  isSaving.value = true
  try {
    const response = formModal.mode === 'create'
      ? await axios.post(`${apiBase.value}/users`, payload, authConfig())
      : await axios.put(`${apiBase.value}/users/${encodeURIComponent(form.id)}`, payload, authConfig())
    const password = String(response.data?.invite?.generatedPassword || '').trim()
    notify(formModal.mode === 'create' ? `Account created successfully.${password ? ` Temporary password: ${password}` : ''}` : 'Account updated successfully.')
    formModal.open = false
    await fetchUsers()
  } catch (error) { formError.value = error.response?.data?.message || 'Unable to save the account.' } finally { isSaving.value = false }
}

const viewUser = async (user) => {
  try { const response = await axios.get(`${apiBase.value}/users/${encodeURIComponent(user.id)}`, authConfig()); detailsModal.value = mapUser(response.data?.user || user) }
  catch (error) { notify(error.response?.data?.message || 'Unable to load account details.', 'error') }
}
const toggleStatus = async (user) => {
  const nextStatus = user.status === 'active' ? 'inactive' : 'active'
  try { await axios.put(`${apiBase.value}/users/${encodeURIComponent(user.id)}`, { status: nextStatus }, authConfig()); notify(`Account ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`); await fetchUsers() }
  catch (error) { notify(error.response?.data?.message || 'Unable to update account status.', 'error') }
}
const resendInvite = async (user) => {
  try { const response = await axios.post(`${apiBase.value}/users/${encodeURIComponent(user.id)}/send-invite`, {}, authConfig()); const password = String(response.data?.invite?.generatedPassword || '').trim(); notify(`New sign-in credentials generated.${password ? ` Temporary password: ${password}` : ''}`); await fetchUsers() }
  catch (error) { notify(error.response?.data?.message || 'Unable to send new credentials.', 'error') }
}
const openDelete = (user) => { deleteTarget.value = user; deletePassword.value = ''; deleteError.value = '' }
const closeDelete = () => { if (!isDeleting.value) deleteTarget.value = null }
const deleteUser = async () => {
  if (!deletePassword.value.trim()) { deleteError.value = 'Your Secretary password is required.'; return }
  isDeleting.value = true
  try { await axios.delete(`${apiBase.value}/users/${encodeURIComponent(deleteTarget.value.id)}`, { ...authConfig(), data: { currentPassword: deletePassword.value } }); notify('Account deleted successfully.'); deleteTarget.value = null; await fetchUsers() }
  catch (error) { deleteError.value = error.response?.data?.message || 'Unable to delete the account.' } finally { isDeleting.value = false }
}

onMounted(() => { document.addEventListener('click', handleOutsideClick); fetchUsers() })
onBeforeUnmount(() => { document.removeEventListener('click', handleOutsideClick); if (toastTimer) window.clearTimeout(toastTimer) })
</script>

<style scoped>
@reference "../../styles/tailwind.css";.secretary-top-header{@apply tw:[padding:.9rem_1rem]!;@apply tw:[border-radius:18px]!}.secretary-header-content,.secretary-header-copy,.secretary-header-tools{@apply tw:flex;@apply tw:items-center}.secretary-header-content{@apply tw:justify-between;@apply tw:[gap:1rem]}.secretary-header-copy{@apply tw:[gap:.9rem];@apply tw:[min-width:0]}.secretary-header-copy h1{@apply tw:[margin:0];@apply tw:[font-size:1.35rem]}.secretary-header-copy .header-subtitle{@apply tw:[margin:.2rem_0_0];@apply tw:[font-size:.86rem]}.secretary-header-tools{@apply tw:[gap:.65rem]}.secretary-management-panel{@apply tw:[padding:1.35rem];@apply tw:[border:1px_solid_transparent];@apply tw:[border-radius:24px];@apply tw:[background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(135deg,#1e4307,#ffd542_42%,#bbff59)_border-box]!}.secretary-section-head{@apply tw:flex;@apply tw:justify-between;@apply tw:[gap:1rem];@apply tw:[padding-bottom:1rem];@apply tw:[margin-bottom:1rem];@apply tw:[border-bottom:1px_solid_#91b99b]}.secretary-summary-meta{@apply tw:h-max;@apply tw:[padding:.45rem_.8rem];@apply tw:[border:1px_solid_#78a985];@apply tw:[border-radius:999px];@apply tw:[background:#dcecdf];@apply tw:[color:#356f48];@apply tw:[font-size:.84rem]}.secretary-management-toolbar{@apply tw:grid;@apply tw:[grid-template-columns:minmax(260px,1.6fr)_minmax(150px,.7fr)_minmax(150px,.7fr)_auto];@apply tw:[align-items:end];@apply tw:[gap:.8rem];@apply tw:[margin-bottom:1rem]}.secretary-search-field{@apply tw:flex;@apply tw:items-center;@apply tw:[gap:.65rem];@apply tw:[min-height:46px];@apply tw:[padding:0_.9rem];@apply tw:[border:1px_solid_#7fac8a];@apply tw:[border-radius:14px]}.secretary-search-field input{@apply tw:w-full;@apply tw:[border:0];@apply tw:[outline:0]}.secretary-filter-group{@apply tw:grid;@apply tw:[gap:.35rem]}.secretary-filter-group span,.secretary-field span{@apply tw:[color:#526170];@apply tw:[font-size:.78rem];@apply tw:[font-weight:600]}.secretary-filter-group select,.secretary-field input,.secretary-field select{@apply tw:w-full;@apply tw:[min-height:46px];@apply tw:[padding:.7rem_.8rem];@apply tw:[border:1px_solid_#7fac8a];@apply tw:[border-radius:12px];@apply tw:[background:#fff];@apply tw:[color:#0f172a]}.secretary-primary-btn,.secretary-secondary-btn,.secretary-danger-btn{@apply tw:inline-flex;@apply tw:items-center;@apply tw:justify-center;@apply tw:[gap:.45rem];@apply tw:[min-height:44px];@apply tw:[padding:.7rem_1rem];@apply tw:[border-radius:12px];@apply tw:[font-weight:700]}.secretary-primary-btn{@apply tw:[border:1px_solid_#245b13];@apply tw:[background:#356f48];@apply tw:[color:#fff]}.secretary-secondary-btn{@apply tw:[border:1px_solid_#78a985];@apply tw:[background:#fff];@apply tw:[color:#356f48]}.secretary-danger-btn{@apply tw:[border:1px_solid_#b91c1c];@apply tw:[background:#dc2626];@apply tw:[color:#fff]}.secretary-primary-btn:disabled,.secretary-danger-btn:disabled{@apply tw:[opacity:.65]}.secretary-table-wrap{@apply tw:overflow-x-auto;@apply tw:[border:1px_solid_#78a985];@apply tw:[border-radius:18px]}.secretary-table{@apply tw:w-full;@apply tw:[min-width:980px];@apply tw:border-collapse}.secretary-table th{@apply tw:[padding:.9rem];@apply tw:text-left;@apply tw:[background:#f7fbf8];@apply tw:[color:#526170];@apply tw:[font-size:.74rem];@apply tw:uppercase}.secretary-table td{@apply tw:[padding:.9rem];@apply tw:[border-top:1px_solid_#e5e7eb];@apply tw:[font-size:.86rem]}.secretary-person-cell{@apply tw:flex;@apply tw:items-center;@apply tw:[gap:.75rem]}.secretary-person-avatar{@apply tw:grid;@apply tw:place-items-center;@apply tw:[width:40px];@apply tw:[height:40px];@apply tw:[border:1px_solid_#47855a];@apply tw:[border-radius:50%];@apply tw:[color:#356f48];@apply tw:[font-weight:800]}.secretary-person-copy{@apply tw:grid;@apply tw:[gap:.12rem]}.secretary-person-copy small{@apply tw:[color:#64748b]}.secretary-role-pill,.secretary-account-status{@apply tw:inline-flex;@apply tw:items-center;@apply tw:[gap:.4rem];@apply tw:[padding:.32rem_.65rem];@apply tw:[border-radius:999px];@apply tw:[font-size:.75rem];@apply tw:[font-weight:700]}.role-headteacher{@apply tw:[background:#dbeafe];@apply tw:[color:#1d4ed8]}.role-teacher{@apply tw:[background:#dcfce7];@apply tw:[color:#166534]}.role-student{@apply tw:[background:#fef3c7];@apply tw:[color:#92400e]}.secretary-account-status{@apply tw:[background:#f1f5f9];@apply tw:[color:#475569]}.secretary-account-status span{@apply tw:[width:8px];@apply tw:[height:8px];@apply tw:[border-radius:50%];@apply tw:[background:currentColor]}.status-active{@apply tw:[background:#dcfce7];@apply tw:[color:#15803d]}.status-suspended{@apply tw:[background:#fee2e2];@apply tw:[color:#b91c1c]}.secretary-row-actions{@apply tw:flex;@apply tw:[gap:.35rem]}.secretary-row-actions button,.secretary-icon-btn{@apply tw:grid;@apply tw:place-items-center;@apply tw:[width:34px];@apply tw:[height:34px];@apply tw:[border:1px_solid_#b7cfbd];@apply tw:[border-radius:9px];@apply tw:[background:#fff];@apply tw:[color:#356f48]}.secretary-row-actions button.danger{@apply tw:[color:#b91c1c];@apply tw:[border-color:#fecaca]}.table-state{@apply tw:grid;@apply tw:place-items-center;@apply tw:[gap:.5rem];@apply tw:[min-height:180px];@apply tw:[color:#64748b]}.secretary-feedback{@apply tw:[padding:.75rem_.9rem];@apply tw:[border-radius:12px];@apply tw:[margin:.75rem_0]}.secretary-feedback.error{@apply tw:[border:1px_solid_#fecaca];@apply tw:[background:#fef2f2];@apply tw:[color:#b91c1c]}.secretary-modal{@apply tw:fixed;@apply tw:[inset:0];@apply tw:[z-index:3000];@apply tw:grid;@apply tw:place-items-center;@apply tw:[padding:1rem]}.secretary-modal-backdrop{@apply tw:absolute;@apply tw:[inset:0];@apply tw:[border:0];@apply tw:[background:rgba(15,23,42,.58)]}.secretary-modal-card{@apply tw:relative;@apply tw:[z-index:1];@apply tw:[width:min(760px,100%)];@apply tw:[max-height:92vh];@apply tw:overflow-auto;@apply tw:[padding:1.25rem];@apply tw:[border-radius:22px];@apply tw:[background:#fff];@apply tw:[box-shadow:0_24px_70px_rgba(15,23,42,.28)]}.secretary-modal-card.compact{@apply tw:[width:min(600px,100%)]}.secretary-modal-card header{@apply tw:flex;@apply tw:justify-between;@apply tw:[gap:1rem];@apply tw:[padding-bottom:1rem];@apply tw:[border-bottom:1px_solid_#e2e8f0]}.secretary-modal-card h2{@apply tw:[margin:0];@apply tw:[color:#1e4307];@apply tw:[font-size:1.25rem]}.secretary-modal-card header p{@apply tw:[margin:.3rem_0_0];@apply tw:[color:#64748b]}.secretary-account-form{@apply tw:grid;@apply tw:[gap:1rem];@apply tw:[padding-top:1rem]}.secretary-form-grid,.secretary-details-grid{@apply tw:grid;@apply tw:[grid-template-columns:repeat(2,minmax(0,1fr))];@apply tw:[gap:.9rem]}.secretary-field{@apply tw:grid;@apply tw:[gap:.4rem]}.secretary-form-actions{@apply tw:flex;@apply tw:justify-end;@apply tw:[gap:.65rem]}.secretary-details-grid div{@apply tw:grid;@apply tw:[gap:.25rem];@apply tw:[padding:.8rem];@apply tw:[border:1px_solid_#e2e8f0];@apply tw:[border-radius:12px]}.secretary-details-grid span{@apply tw:[color:#64748b];@apply tw:[font-size:.76rem];@apply tw:uppercase}.secretary-details-grid strong{@apply tw:[word-break:break-word]}.secretary-toast{@apply tw:fixed;@apply tw:[right:1rem];@apply tw:[bottom:1rem];@apply tw:[z-index:4000];@apply tw:flex;@apply tw:items-center;@apply tw:[gap:.65rem];@apply tw:[max-width:460px];@apply tw:[padding:.85rem_1rem];@apply tw:[border:1px_solid_#86efac];@apply tw:[border-radius:14px];@apply tw:[background:#f0fdf4];@apply tw:[color:#166534];@apply tw:[box-shadow:0_15px_40px_rgba(15,23,42,.18)]}.secretary-toast.error{@apply tw:[border-color:#fecaca];@apply tw:[background:#fef2f2];@apply tw:[color:#b91c1c]}.secretary-toast button{@apply tw:[border:0];@apply tw:[background:transparent];@apply tw:[color:inherit]}.secretary-header-copy .mobile-menu-toggle{@apply tw:[width:40px];@apply tw:[height:40px]}
@media(max-width:900px){.secretary-management-toolbar{@apply tw:[grid-template-columns:1fr_1fr]}.secretary-search-field{@apply tw:[grid-column:1/-1]}}@media(max-width:768px){.secretary-header-copy>div{@apply tw:hidden}.secretary-header-tools .secretary-primary-btn span{@apply tw:hidden}.secretary-management-panel{@apply tw:[padding:.9rem]}.secretary-section-head{@apply tw:flex-col}.secretary-management-toolbar,.secretary-form-grid,.secretary-details-grid{@apply tw:[grid-template-columns:1fr]}.secretary-search-field{@apply tw:[grid-column:auto]}.secretary-form-actions{@apply tw:flex-col-reverse}.secretary-form-actions button{@apply tw:w-full}}

</style>
