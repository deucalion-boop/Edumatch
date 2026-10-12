<template>
  <div class="admin-dashboard admin-announcements-page">
    <header class="admin-header"><div class="container"><div class="admin-header-content">
      <button type="button" class="mobile-menu-toggle" :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'" :aria-expanded="isSidebarOpen ? 'true' : 'false'" aria-controls="admin-sidebar-drawer" @click="toggleSidebar"><i class="fas fa-bars"></i></button>
      <div class="admin-logo"><div class="admin-logo-icon"><img src="/logo.png" alt="EduMatch" class="admin-logo-img"></div><div class="admin-logo-text"><h1>EduMatch Admin</h1><span class="page-title">Announcements</span></div></div>
      <div class="admin-actions"><button type="button" class="header-account-trigger" aria-label="Admin dashboard" @click="router.push('/admin/dashboard')"><i class="fas fa-home"></i></button></div>
    </div></div></header>

    <div class="admin-layout">
      <aside id="admin-sidebar-drawer" class="admin-sidebar" :class="{ active: isSidebarOpen }">
        <div class="sidebar-header">
          <div class="admin-sidebar-brand">
            <div class="admin-sidebar-brand-icon"><img src="/logo.png" alt="EduMatch" class="admin-sidebar-logo-img"></div>
            <div class="admin-sidebar-brand-copy"><h3>EduMatch</h3><p>Admin Portal</p></div>
          </div>
          <button type="button" class="sidebar-close" aria-label="Close sidebar" @click="closeSidebar"><i class="fas fa-times"></i></button>
        </div>
        <nav class="sidebar-menu sidebar-nav" aria-label="Admin navigation">
          <div class="nav-section">
            <h4 class="nav-section-title">Navigation</h4>
            <router-link to="/admin/dashboard" class="nav-link sidebar-item sidebar-item--dashboard" :class="{ active: isActive('/admin/dashboard') }" @click="closeSidebar"><i class="fas fa-tachometer-alt"></i><span>Overview</span></router-link>
            <router-link to="/admin/users" class="nav-link sidebar-item sidebar-item--users" :class="{ active: isActive('/admin/users') }" @click="closeSidebar"><i class="fas fa-user-cog"></i><span>User Management</span></router-link>
            <router-link to="/admin/requests" class="nav-link sidebar-item sidebar-item--requests" :class="{ active: isActive('/admin/requests') }" @click="closeSidebar"><i class="fas fa-inbox"></i><span>Request</span></router-link>
            <router-link to="/admin/announcements" class="nav-link sidebar-item active" aria-current="page" @click="closeSidebar"><i class="fas fa-bullhorn"></i><span>Announcements</span></router-link>
            <router-link to="/admin/login-attempts" class="nav-link sidebar-item sidebar-item--login-attempts" :class="{ active: isActive('/admin/login-attempts') }" @click="closeSidebar"><i class="fas fa-right-to-bracket"></i><span>Login Attempts</span></router-link>
            <router-link to="/admin/audit-logs" class="nav-link sidebar-item sidebar-item--audit-logs" :class="{ active: isActive('/admin/audit-logs') }" @click="closeSidebar"><i class="fas fa-clipboard-list"></i><span>Audit Logs</span></router-link>
          </div>
        </nav>
      </aside>
      <button v-if="isSidebarOpen" type="button" class="sidebar-backdrop" aria-label="Close sidebar" @click="closeSidebar"></button>

    <main class="admin-main announcement-admin-main">
      <section class="announcement-hero">
        <div><p class="announcement-kicker">School communications</p><h2>Post an announcement</h2><p>Send one update to students, teachers, head teachers, or any combination of these audiences.</p></div>
        <span class="announcement-hero-icon"><i class="fas fa-bullhorn"></i></span>
      </section>

      <div class="announcement-admin-grid">
        <form class="announcement-panel announcement-form" @submit.prevent="publish">
          <div class="panel-heading"><div><h3>Compose message</h3><p>Recipients will see this in their notification feed and announcements page.</p></div></div>
          <label class="form-field"><span>Title</span><input v-model="form.title" maxlength="200" required placeholder="Enter a clear announcement title"><small>{{ form.title.length }}/200</small></label>
          <label class="form-field"><span>Message</span><textarea v-model="form.content" maxlength="5000" rows="9" required placeholder="Write the full announcement"></textarea><small>{{ form.content.length }}/5000</small></label>
          <fieldset class="audience-field"><legend>Audience</legend>
            <label v-for="option in audienceOptions" :key="option.value" class="audience-option"><input v-model="form.audienceRoles" type="checkbox" :value="option.value"><span><i :class="option.icon"></i><strong>{{ option.label }}</strong></span></label>
          </fieldset>
          <label class="urgent-option"><input v-model="form.urgent" type="checkbox"><span><strong>Mark as urgent</strong><small>Highlights the announcement for recipients.</small></span></label>
          <p v-if="formError" class="form-message error" role="alert">{{ formError }}</p>
          <p v-if="successMessage" class="form-message success" role="status">{{ successMessage }}</p>
          <button class="publish-button" type="submit" :disabled="saving"><i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>{{ saving ? 'Posting...' : 'Post announcement' }}</button>
        </form>

        <section class="announcement-panel history-panel">
          <div class="panel-heading"><div><h3>Published announcements</h3><p>Recent school messages and their recipient totals.</p></div><button type="button" class="refresh-button" :disabled="loading" @click="load"><i class="fas fa-rotate"></i></button></div>
          <p v-if="loading" class="history-state">Loading announcements...</p>
          <div v-else-if="loadError" class="history-state error"><p>{{ loadError }}</p><button type="button" @click="load">Try again</button></div>
          <div v-else-if="announcements.length" class="history-list">
            <article v-for="item in announcements" :key="item.id" class="history-card" :class="{ urgent: item.urgent }">
              <div class="history-title"><strong>{{ item.title }}</strong><span v-if="item.urgent">Urgent</span></div>
              <p>{{ item.content }}</p>
              <div class="audience-tags"><span v-for="role in item.audienceRoles" :key="role">{{ roleLabel(role) }}</span></div>
              <small>{{ item.recipientCount }} recipient{{ item.recipientCount === 1 ? '' : 's' }} · {{ formatDate(item.createdAt) }}</small>
            </article>
          </div>
          <p v-else class="history-state">No school announcements have been posted yet.</p>
        </section>
      </div>
    </main>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore, resolveApiBaseUrl } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isSidebarOpen = ref(false)
const announcements = ref([])
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const formError = ref('')
const successMessage = ref('')
let requestId = crypto.randomUUID()
const form = reactive({ title: '', content: '', audienceRoles: ['student', 'teacher', 'headteacher'], urgent: false })
const audienceOptions = [
  { value: 'student', label: 'Students', icon: 'fas fa-user-graduate' },
  { value: 'teacher', label: 'Teachers', icon: 'fas fa-chalkboard-user' },
  { value: 'headteacher', label: 'Head Teachers', icon: 'fas fa-user-tie' },
]
const config = () => ({ headers: { Authorization: `Bearer ${auth.token}` } })
const isActive = (path) => route.path === path
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }

async function load() {
  loading.value = true; loadError.value = ''
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/admin/announcements`, config())
    announcements.value = Array.isArray(response.data?.announcements) ? response.data.announcements : []
  } catch (error) { loadError.value = error.response?.data?.message || 'Unable to load announcements.' }
  finally { loading.value = false }
}
async function publish() {
  formError.value = ''; successMessage.value = ''
  if (!form.audienceRoles.length) { formError.value = 'Select at least one audience.'; return }
  saving.value = true
  try {
    const response = await axios.post(`${resolveApiBaseUrl()}/admin/announcements`, { ...form, audienceRoles: [...form.audienceRoles], requestId }, config())
    successMessage.value = `Announcement posted to ${response.data?.recipientCount || 0} recipients.`
    form.title = ''; form.content = ''; form.urgent = false; requestId = crypto.randomUUID()
    await load()
  } catch (error) { formError.value = error.response?.data?.message || 'Unable to post the announcement. You can safely try again.' }
  finally { saving.value = false }
}
const roleLabel = (role) => ({ student: 'Students', teacher: 'Teachers', headteacher: 'Head Teachers' }[role] || role)
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString() }
onMounted(load)
</script>

<style scoped>
@reference "../../styles/tailwind.css";
.announcement-admin-main { @apply tw:w-full; @apply tw:[max-width:none]; @apply tw:[padding:2rem]; }
.announcement-hero { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:1.5rem]; @apply tw:[padding:1.7rem]; @apply tw:[border-radius:22px]; @apply tw:[background:linear-gradient(135deg,_#102d57,_#2563eb)]; @apply tw:[color:white]; @apply tw:[box-shadow:0_18px_45px_rgba(37,_99,_235,_.2)]; }
.announcement-kicker { @apply tw:[margin:0_0_.35rem]; @apply tw:[font-size:.78rem]; @apply tw:[font-weight:800]; @apply tw:uppercase; @apply tw:[letter-spacing:.1em]; @apply tw:[color:#bfdbfe]; }
.announcement-hero h2 { @apply tw:[margin:0]; @apply tw:[font-size:clamp(1.6rem,_3vw,_2.25rem)]; }
.announcement-hero p { @apply tw:[margin:.45rem_0_0]; @apply tw:[color:#dbeafe]; }
.announcement-hero-icon { @apply tw:grid; @apply tw:place-items-center; @apply tw:[width:72px]; @apply tw:[height:72px]; @apply tw:[border-radius:20px]; @apply tw:[background:rgba(255,_255,_255,_.14)]; @apply tw:[font-size:1.8rem]; }
.announcement-admin-grid { @apply tw:grid; @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(340px,_.85fr)]; @apply tw:[gap:1.25rem]; @apply tw:[margin-top:1.25rem]; }
.announcement-panel { @apply tw:[padding:1.4rem]; @apply tw:[border:1px_solid_#dbe3ef]; @apply tw:[border-radius:20px]; @apply tw:[background:white]; @apply tw:[box-shadow:0_10px_30px_rgba(15,_23,_42,_.06)]; }
.panel-heading { @apply tw:flex; @apply tw:items-start; @apply tw:justify-between; @apply tw:[gap:1rem]; @apply tw:[margin-bottom:1.2rem]; }
.panel-heading h3 { @apply tw:[margin:0]; @apply tw:[color:#0f172a]; }
.panel-heading p { @apply tw:[margin:.3rem_0_0]; @apply tw:[color:#64748b]; @apply tw:[font-size:.9rem]; }
.form-field { @apply tw:grid; @apply tw:[gap:.45rem]; @apply tw:[margin-bottom:1rem]; @apply tw:[font-weight:700]; @apply tw:[color:#334155]; }
.form-field input, .form-field textarea { @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:12px]; @apply tw:[padding:.8rem_.9rem]; @apply tw:[font:inherit]; @apply tw:[font-weight:400]; @apply tw:[resize:vertical]; }
.form-field small { @apply tw:text-right; @apply tw:[color:#64748b]; @apply tw:[font-weight:400]; }
.audience-field { @apply tw:[margin:0_0_1rem]; @apply tw:[padding:0]; @apply tw:[border:0]; }
.audience-field legend { @apply tw:[margin-bottom:.55rem]; @apply tw:[font-weight:700]; @apply tw:[color:#334155]; }
.audience-option { @apply tw:inline-flex; @apply tw:[margin:0_.55rem_.55rem_0]; @apply tw:cursor-pointer; }
.audience-option input { @apply tw:[position:absolute]; @apply tw:[opacity:0]; }
.audience-option span { @apply tw:flex; @apply tw:items-center; @apply tw:[gap:.45rem]; @apply tw:[padding:.65rem_.8rem]; @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:11px]; @apply tw:[color:#475569]; }
.audience-option input:checked + span { @apply tw:[border-color:#2563eb]; @apply tw:[background:#eff6ff]; @apply tw:[color:#1d4ed8]; }
.urgent-option { @apply tw:flex; @apply tw:items-start; @apply tw:[gap:.7rem]; @apply tw:[padding:.85rem]; @apply tw:[border-radius:12px]; @apply tw:[background:#fff7ed]; @apply tw:[color:#9a3412]; }
.urgent-option span { @apply tw:grid; @apply tw:[gap:.15rem]; }.urgent-option small { @apply tw:[color:#c2410c]; }
.publish-button { @apply tw:w-full; @apply tw:[margin-top:1rem]; @apply tw:[padding:.85rem]; @apply tw:[border:0]; @apply tw:[border-radius:12px]; @apply tw:[background:#2563eb]; @apply tw:[color:white]; @apply tw:[font-weight:800]; @apply tw:cursor-pointer; }.publish-button i { @apply tw:[margin-right:.5rem]; }.publish-button:disabled { @apply tw:[opacity:.65]; @apply tw:cursor-wait; }
.form-message { @apply tw:[padding:.75rem]; @apply tw:[border-radius:10px]; }.form-message.error { @apply tw:[background:#fef2f2]; @apply tw:[color:#b91c1c]; }.form-message.success { @apply tw:[background:#f0fdf4]; @apply tw:[color:#166534]; }
.refresh-button, .history-state button { @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:9px]; @apply tw:[background:white]; @apply tw:[padding:.55rem_.7rem]; @apply tw:cursor-pointer; }
.history-list { @apply tw:grid; @apply tw:[gap:.8rem]; @apply tw:[max-height:720px]; @apply tw:overflow-y-auto; }
.history-card { @apply tw:[padding:1rem]; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:14px]; @apply tw:[background:#f8fafc]; }.history-card.urgent { @apply tw:[border-color:#fdba74]; @apply tw:[background:#fff7ed]; }
.history-title { @apply tw:flex; @apply tw:items-start; @apply tw:justify-between; @apply tw:[gap:.7rem]; }.history-title span { @apply tw:[padding:.2rem_.45rem]; @apply tw:[border-radius:99px]; @apply tw:[background:#ffedd5]; @apply tw:[color:#c2410c]; @apply tw:[font-size:.72rem]; @apply tw:[font-weight:800]; }
.history-card p { @apply tw:whitespace-pre-wrap; @apply tw:[color:#475569]; @apply tw:[line-height:1.5]; }.history-card small { @apply tw:[color:#64748b]; }
.audience-tags { @apply tw:flex; @apply tw:flex-wrap; @apply tw:[gap:.35rem]; @apply tw:[margin:.7rem_0]; }.audience-tags span { @apply tw:[padding:.25rem_.5rem]; @apply tw:[border-radius:99px]; @apply tw:[background:#dbeafe]; @apply tw:[color:#1d4ed8]; @apply tw:[font-size:.75rem]; @apply tw:[font-weight:700]; }
.history-state { @apply tw:[padding:2rem_1rem]; @apply tw:text-center; @apply tw:[color:#64748b]; }.history-state.error { @apply tw:[color:#b91c1c]; }
@media (max-width:900px) { .announcement-admin-grid { @apply tw:[grid-template-columns:1fr]; }.announcement-admin-main { @apply tw:[padding:1.25rem]; } }
@media (max-width:520px) { .announcement-hero-icon { @apply tw:hidden; }.announcement-panel { @apply tw:[padding:1rem]; } }
</style>
