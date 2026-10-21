<template>
  <div :class="isAdmin ? 'admin-dashboard admin-sections-page' : 'secretary-sections-page'">
    <header v-if="isAdmin" class="admin-header">
      <div class="container"><div class="admin-header-content">
        <button type="button" class="mobile-menu-toggle" @click="toggleSidebar" :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'" :aria-expanded="String(isSidebarOpen)" aria-controls="admin-sidebar-drawer" title="Menu"><i class="fas fa-bars"></i></button>
        <div class="admin-logo"><div class="admin-logo-icon"><img src="/logo.png" alt="EduMatch" class="admin-logo-img" /></div><div class="admin-logo-text"><h1>EduMatch Admin</h1><span class="page-title">Manage Sections</span></div></div>
        <div class="admin-actions"><div ref="accountMenuRef" class="account-menu">
          <button type="button" class="header-account-trigger" aria-label="Account menu" title="Settings" :aria-expanded="String(isAccountMenuOpen)" @click="toggleAccountMenu"><i class="fas fa-cog"></i></button>
          <div v-if="isAccountMenuOpen" class="account-menu-dropdown">
            <button type="button" class="account-menu-item" @click="goToProfile"><i class="fas fa-user"></i><span>Profile</span></button>
            <button type="button" class="account-menu-item" @click="goToSettings"><i class="fas fa-cog"></i><span>Settings</span></button>
            <button type="button" class="account-menu-item danger" @click="handleLogout"><i class="fas fa-sign-out-alt"></i><span>Logout</span></button>
          </div>
        </div></div>
      </div></div>
    </header>

    <div :class="isAdmin ? 'admin-layout' : 'secretary-sections-layout'">
      <aside v-if="isAdmin" id="admin-sidebar-drawer" class="admin-sidebar" :class="{ active: isSidebarOpen }">
        <div class="sidebar-header"><div class="admin-sidebar-brand"><div class="admin-sidebar-brand-icon"><img src="/logo.png" alt="EduMatch" class="admin-sidebar-logo-img" /></div><div class="admin-sidebar-brand-copy"><h3>EduMatch</h3><p>Admin Portal</p></div></div><button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar"><i class="fas fa-times"></i></button></div>
        <nav class="sidebar-menu sidebar-nav" aria-label="Admin navigation"><div class="nav-section">
          <h4 class="nav-section-title">Navigation</h4>
          <router-link v-for="item in adminNav" :key="item.path" :to="item.path" class="nav-link sidebar-item" :class="[{ active: isActive(item.path) }, item.className]" @click="closeSidebar"><i :class="item.icon"></i><span>{{ item.label }}</span></router-link>
        </div></nav>
      </aside>
      <aside v-else class="secretary-sections-sidebar">
        <div class="secretary-brand"><img src="/logo.png" alt="EduMatch" /><div><b>EduMatch</b><small>Secretary Portal</small></div></div>
        <nav><router-link to="/secretary/dashboard"><i class="fas fa-home"></i>Dashboard</router-link><router-link to="/secretary/sections" class="active"><i class="fas fa-layer-group"></i>Manage Sections</router-link><router-link to="/secretary/students"><i class="fas fa-users"></i>Student Records</router-link></nav>
      </aside>
      <button v-if="isAdmin && isSidebarOpen" type="button" class="sidebar-backdrop" aria-label="Close sidebar" @click="closeSidebar"></button>

      <main :class="isAdmin ? 'admin-main' : 'secretary-sections-main'">
        <div v-if="isAdmin" class="page-header sections-page-header fade-in"><div class="header-left"><h2>Manage Sections</h2><p>Create and maintain capacity-aware sections without changing historical records.</p></div><button type="button" class="btn btn-primary sections-add-button" @click="openCreate"><i class="fas fa-plus"></i><span>Add section</span></button></div>
        <header v-else class="secretary-page-header"><div><p>School structure</p><h1>Manage Sections</h1><span>Create and maintain capacity-aware sections without changing historical records.</span></div><button type="button" class="legacy-primary" @click="openCreate"><i class="fas fa-plus"></i>Add section</button></header>

        <section :class="isAdmin ? 'section-card sections-workspace fade-in' : 'secretary-workspace'">
          <div class="sections-toolbar">
            <label class="sections-search"><span v-if="isAdmin">Search sections</span><div><i class="fas fa-search"></i><input v-model="search" aria-label="Search sections" placeholder="Search section, grade, or strand" /></div></label>
            <label><span v-if="isAdmin">School year</span><select v-model="year" aria-label="Filter by school year"><option value="all">All school years</option><option v-for="value in years" :key="value">{{ value }}</option></select></label>
            <label><span v-if="isAdmin">Status</span><select v-model="status" aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
          </div>
          <p v-if="error" class="sections-message sections-message--error" role="alert">{{ error }}</p>
          <div v-if="loading" class="sections-state"><i class="fas fa-spinner fa-spin"></i><strong>Loading sections...</strong></div>
          <div v-else class="sections-grid">
            <article v-for="section in filtered" :key="section.id" class="section-record-card">
              <div class="section-card-heading"><div><span class="section-status" :class="`section-status--${section.status}`">{{ section.status }}</span><h3>{{ section.name }}</h3><p>Grade {{ section.gradeLevel }}<template v-if="section.strand"> · {{ section.strand }}</template></p></div><div class="section-actions"><button type="button" title="Edit section" @click="openEdit(section)"><i class="fas fa-pen"></i></button><button type="button" :title="section.isActive ? 'Archive section' : 'Restore section'" @click="toggleArchive(section)"><i :class="section.isActive ? 'fas fa-box-archive' : 'fas fa-rotate-left'"></i></button><button type="button" class="danger" title="Delete section" @click="remove(section)"><i class="fas fa-trash"></i></button></div></div>
              <div class="section-capacity"><div><span>Enrollment</span><strong>{{ section.enrolledCount }} / {{ section.capacity }}</strong></div><progress :value="section.enrolledCount" :max="section.capacity"></progress><small>{{ section.availableSlots }} available slot{{ section.availableSlots === 1 ? '' : 's' }}</small></div>
              <footer><span><i class="far fa-calendar"></i>{{ section.schoolYear }}</span><span><i class="fas fa-users"></i>{{ Math.round((section.enrolledCount / section.capacity) * 100) || 0 }}% full</span></footer>
            </article>
            <div v-if="!filtered.length" class="sections-state"><i class="fas fa-layer-group"></i><strong>No matching sections</strong><span>Adjust the filters or create a new section.</span></div>
          </div>
        </section>
        <DashboardFooter v-if="isAdmin" />
      </main>
    </div>
  </div>

  <div v-if="modal" class="sections-modal" @click.self="closeModal">
    <form @submit.prevent="save"><header><div><h2>{{ editing ? 'Edit section' : 'Add section' }}</h2><p>Section capacity is enforced automatically during enrollment.</p></div><button type="button" aria-label="Close dialog" @click="closeModal"><i class="fas fa-times"></i></button></header>
      <div class="sections-form-grid"><label><span>Section name *</span><input v-model.trim="form.name" required maxlength="80" /></label><label><span>School year *</span><input v-model="form.schoolYear" required pattern="\d{4}-\d{4}" placeholder="2026-2027" /></label><label><span>Student capacity *</span><input v-model.number="form.capacity" type="number" min="1" max="200" required /></label></div>
      <p v-if="modalError" class="sections-message sections-message--error">{{ modalError }}</p><footer><button type="button" class="modal-secondary" @click="closeModal">Cancel</button><button class="modal-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save section' }}</button></footer>
    </form>
  </div>
</template>

<script setup>
import DashboardFooter from '../../components/DashboardFooter.vue'
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resolveApiBaseUrl, useAuthStore } from '../../stores/auth.js'

const SIDEBAR_BREAKPOINT = 1024
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const role = computed(() => authStore.user?.role === 'secretary' ? 'secretary' : 'admin')
const isAdmin = computed(() => role.value === 'admin')
const adminNav = [
  { path: '/admin/dashboard', label: 'Overview', icon: 'fas fa-tachometer-alt', className: 'sidebar-item--dashboard' },
  { path: '/admin/users', label: 'User Management', icon: 'fas fa-user-cog', className: 'sidebar-item--users' },
  { path: '/admin/sections', label: 'Manage Sections', icon: 'fas fa-layer-group', className: 'sidebar-item--sections' },
  { path: '/admin/requests', label: 'Request', icon: 'fas fa-inbox', className: 'sidebar-item--requests' },
  { path: '/admin/announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: 'fas fa-clipboard-list', className: 'sidebar-item--audit-logs' },
]
const sections = ref([]), loading = ref(false), error = ref(''), search = ref(''), year = ref('all'), status = ref('all')
const modal = ref(false), editing = ref(null), saving = ref(false), modalError = ref('')
const isSidebarOpen = ref(false), isAccountMenuOpen = ref(false), accountMenuRef = ref(null)
const currentYear = new Date().getFullYear()
const form = reactive({ name: '', gradeLevel: '10', strand: '', schoolYear: `${currentYear}-${currentYear + 1}`, capacity: 40 })
const api = computed(() => `${resolveApiBaseUrl()}/${role.value}/manage-sections`)
const cfg = () => ({ headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {} })
const years = computed(() => [...new Set(sections.value.map(item => item.schoolYear).filter(Boolean))].sort().reverse())
const filtered = computed(() => sections.value.filter(item => (year.value === 'all' || item.schoolYear === year.value) && (status.value === 'all' || item.status === status.value) && [item.name, item.gradeLevel, item.strand, item.schoolYear].join(' ').toLowerCase().includes(search.value.toLowerCase())))

const isActive = path => route.path === path
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }
const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }
const closeAccountMenu = () => { isAccountMenuOpen.value = false }
const closeModal = () => { if (!saving.value) modal.value = false }
const syncMobileMenuBodyState = () => document.body.classList.toggle('admin-mobile-menu-open', isAdmin.value && window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value)
const goToProfile = () => { closeAccountMenu(); router.push('/admin/profile') }
const goToSettings = () => { closeAccountMenu(); router.push('/admin/settings') }
const handleLogout = () => { closeAccountMenu(); authStore.logout(); router.push('/auth/login') }
const handleDocumentClick = event => { if (!(accountMenuRef.value && event.target instanceof Node && accountMenuRef.value.contains(event.target))) closeAccountMenu() }
const handleDocumentKeydown = event => { if (event.key === 'Escape') { closeAccountMenu(); closeSidebar(); closeModal() } }

async function load() { loading.value = true; error.value = ''; try { sections.value = (await axios.get(api.value, cfg())).data?.sections || [] } catch (requestError) { error.value = requestError.response?.data?.message || 'Unable to load sections' } finally { loading.value = false } }
function reset() { Object.assign(form, { name: '', gradeLevel: '10', strand: '', schoolYear: `${currentYear}-${currentYear + 1}`, capacity: 40 }) }
function openCreate() { editing.value = null; reset(); modalError.value = ''; modal.value = true }
function openEdit(item) { editing.value = item; Object.assign(form, { name: item.name, gradeLevel: '10', strand: item.strand, schoolYear: item.schoolYear, capacity: item.capacity }); modalError.value = ''; modal.value = true }
async function save() { saving.value = true; modalError.value = ''; try { editing.value ? await axios.put(`${api.value}/${editing.value.id}`, form, cfg()) : await axios.post(api.value, form, cfg()); modal.value = false; await load() } catch (requestError) { modalError.value = requestError.response?.data?.message || 'Unable to save section' } finally { saving.value = false } }
async function toggleArchive(item) { if (!confirm(`${item.isActive ? 'Archive' : 'Restore'} ${item.name}?`)) return; try { await axios.patch(`${api.value}/${item.id}/archive`, { archived: item.isActive }, cfg()); await load() } catch (requestError) { error.value = requestError.response?.data?.message || 'Unable to update section' } }
async function remove(item) { if (!confirm(`Permanently delete ${item.name}? Referenced sections cannot be deleted.`)) return; try { await axios.delete(`${api.value}/${item.id}`, cfg()); await load() } catch (requestError) { error.value = requestError.response?.data?.message || 'Unable to delete section' } }

watch(isSidebarOpen, syncMobileMenuBodyState)
watch(() => route.path, () => { closeSidebar(); closeAccountMenu() })
onMounted(() => { if (isAdmin.value) document.body.classList.add('admin-dashboard'); window.addEventListener('resize', syncMobileMenuBodyState); document.addEventListener('click', handleDocumentClick); document.addEventListener('keydown', handleDocumentKeydown); load() })
onBeforeUnmount(() => { document.body.classList.remove('admin-mobile-menu-open'); window.removeEventListener('resize', syncMobileMenuBodyState); document.removeEventListener('click', handleDocumentClick); document.removeEventListener('keydown', handleDocumentKeydown) })
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
.sections-page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem}.sections-add-button{display:inline-flex;align-items:center;gap:.55rem;border-color:#4f8a35!important;background:#4f8a35!important;color:#fff!important}.sections-add-button:hover{border-color:#3f722b!important;background:#3f722b!important}.sections-workspace{border:1px solid #69aa47!important;padding:1.25rem}.sections-toolbar{display:grid;grid-template-columns:minmax(240px,1fr) 190px 160px;gap:.85rem;align-items:end;margin-bottom:1.25rem}.sections-toolbar label{display:grid;gap:.4rem;color:#334155;font-size:.78rem;font-weight:700}.sections-toolbar input,.sections-toolbar select{width:100%;min-height:43px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a;padding:.65rem .8rem;font:inherit}.sections-search div{position:relative}.sections-search i{position:absolute;top:50%;left:.85rem;color:#94a3b8;transform:translateY(-50%)}.sections-search input{padding-left:2.45rem}.sections-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));gap:1rem}.section-record-card{border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:1rem;box-shadow:0 5px 14px rgba(15,23,42,.04)}.section-card-heading{display:flex;justify-content:space-between;gap:.75rem}.section-card-heading h3{margin:.45rem 0 .15rem;color:#0f172a;font-size:1.05rem}.section-card-heading p{margin:0;color:#64748b;font-size:.82rem}.section-status{display:inline-flex;border-radius:999px;padding:.25rem .55rem;font-size:.68rem;font-weight:800;text-transform:uppercase}.section-status--active{background:#dcfce7;color:#166534}.section-status--archived{background:#e2e8f0;color:#475569}.section-actions{display:flex;gap:.3rem}.section-actions button{display:grid;width:34px;height:34px;place-items:center;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;color:#475569;cursor:pointer}.section-actions button:hover{border-color:#9fca8c;background:#f0f8ec;color:#315f22}.section-actions button.danger{color:#dc2626}.section-capacity{margin:1.2rem 0}.section-capacity div,.section-record-card footer{display:flex;justify-content:space-between;gap:.6rem}.section-capacity span,.section-capacity small{color:#64748b;font-size:.78rem}.section-capacity progress{width:100%;height:8px;margin:.65rem 0 .4rem;accent-color:#69aa47}.section-record-card footer{border-top:1px solid #edf2f7;padding-top:.8rem;color:#64748b;font-size:.75rem}.section-record-card footer span{display:flex;align-items:center;gap:.4rem}.sections-state{grid-column:1/-1;display:grid;min-height:220px;place-content:center;justify-items:center;gap:.55rem;color:#64748b;text-align:center}.sections-state i{color:#69aa47;font-size:1.55rem}.sections-message{margin:.75rem 0;padding:.8rem 1rem;border-radius:10px}.sections-message--error{border:1px solid #fecaca;background:#fef2f2;color:#b91c1c}
.sections-modal{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:1rem;background:rgba(15,23,42,.55);backdrop-filter:blur(5px)}.sections-modal form{width:min(610px,100%);border:1px solid #e2e8f0;border-radius:18px;background:#fff;padding:1.35rem;box-shadow:0 25px 60px rgba(15,23,42,.24)}.sections-modal header,.sections-modal footer{display:flex;align-items:center;justify-content:space-between;gap:1rem}.sections-modal h2{margin:0}.sections-modal header p{margin:.3rem 0 0;color:#64748b;font-size:.85rem}.sections-modal header button{display:grid;width:38px;height:38px;place-items:center;border:1px solid #e2e8f0;border-radius:10px;background:#fff}.sections-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.3rem 0}.sections-form-grid label{display:grid;gap:.4rem;color:#334155;font-size:.82rem;font-weight:700}.sections-form-grid input,.sections-form-grid select{width:100%;min-height:43px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;background:#fff;padding:.65rem .75rem}.sections-modal footer{justify-content:flex-end}.modal-primary,.modal-secondary,.legacy-primary{border:0;border-radius:10px;padding:.72rem 1rem;font-weight:800;cursor:pointer}.modal-primary,.legacy-primary{background:#4f8a35;color:#fff}.modal-secondary{background:#eef2f7;color:#334155}
.secretary-sections-layout{min-height:100vh;display:grid;grid-template-columns:250px 1fr}.secretary-sections-page{min-height:100vh;background:#f8fafc;color:#0f172a;font-family:Inter,system-ui}.secretary-sections-sidebar{border-right:1px solid #e5e7eb;background:#fff;padding:1.2rem}.secretary-brand{display:flex;align-items:center;gap:.7rem;padding:.5rem .5rem 1.2rem;border-bottom:1px solid #e5e7eb}.secretary-brand img{width:44px}.secretary-brand div{display:grid}.secretary-brand small{color:#64748b}.secretary-sections-sidebar nav{display:grid;gap:.35rem;margin-top:2rem}.secretary-sections-sidebar a{display:flex;gap:.7rem;padding:.8rem;border-radius:12px;color:#475569;font-weight:700;text-decoration:none}.secretary-sections-sidebar a.active{background:#eaf6e5;color:#3f7f2a}.secretary-sections-main{padding:2rem;min-width:0}.secretary-page-header{display:flex;align-items:center;justify-content:space-between}.secretary-page-header p{margin:0;color:#4f8a35;text-transform:uppercase;font-size:.75rem;font-weight:800}.secretary-page-header h1{margin:.15rem 0}.secretary-page-header span{color:#64748b}.secretary-workspace{margin-top:1.5rem}.secretary-workspace .sections-toolbar{grid-template-columns:minmax(240px,1fr) 190px 160px}.secretary-workspace .sections-grid{grid-template-columns:repeat(auto-fill,minmax(285px,1fr))}
@media(max-width:768px){.sections-page-header{align-items:stretch;flex-direction:column}.sections-toolbar{grid-template-columns:1fr!important}.sections-form-grid{grid-template-columns:1fr}.secretary-sections-layout{grid-template-columns:1fr}.secretary-sections-sidebar{display:none}.secretary-sections-main{padding:1rem}.secretary-page-header{align-items:stretch;flex-direction:column;gap:1rem}}
</style>
