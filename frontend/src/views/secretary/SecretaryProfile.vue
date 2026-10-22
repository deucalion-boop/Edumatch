<template>
  <div class="teacher-dashboard secretary-dashboard-page">
    <aside id="secretary-sidebar-drawer" class="teacher-sidebar" :class="{ active: isSidebarOpen }">
      <div class="sidebar-header">
        <div class="teacher-logo"><div class="secretary-logo-icon"><img src="/logo.png" alt="EduMatch" class="secretary-logo-img"></div><div class="teacher-logo-text"><h2>EduMatch</h2><p>Secretary Portal</p></div></div>
        <button type="button" class="sidebar-close" aria-label="Close sidebar" @click="closeSidebar"><i class="fas fa-times"></i></button>
      </div>
      <nav class="sidebar-nav"><div class="nav-section"><h4 class="nav-section-title">Workspace</h4>
        <router-link to="/secretary/dashboard" class="nav-link" @click="closeSidebar"><i class="fas fa-home"></i><span>Dashboard</span></router-link>
        <router-link to="/secretary/teachers" class="nav-link" @click="closeSidebar"><i class="fas fa-users"></i><span>Teacher Monitoring</span></router-link>
        <router-link to="/secretary/users" class="nav-link" @click="closeSidebar"><i class="fas fa-user-cog"></i><span>User Management</span></router-link>
        <router-link to="/secretary/students" class="nav-link" @click="closeSidebar"><i class="fas fa-user-graduate"></i><span>Student Records</span></router-link>
        <router-link to="/secretary/sections" class="nav-link" @click="closeSidebar"><i class="fas fa-layer-group"></i><span>Manage Sections</span></router-link>
        <router-link to="/secretary/archived" class="nav-link" @click="closeSidebar"><i class="fas fa-box-archive"></i><span>Archived</span></router-link>
      </div></nav>
      <div class="sidebar-footer"><div class="secretary-profile"><div class="secretary-avatar"><i class="fas fa-user"></i></div><div class="secretary-info"><h5>{{ displayName }}</h5><div class="secretary-profile-meta"><p class="secretary-role">Secretary</p><div class="secretary-status"><span class="secretary-profile-status-indicator active"></span><span>active</span></div></div></div></div></div>
    </aside>
    <button v-if="isSidebarOpen" type="button" class="sidebar-backdrop" aria-label="Close sidebar" @click="closeSidebar"></button>
    <main class="teacher-main secretary-main dashboard-container">
      <header class="top-header secretary-top-header dashboard-header">
        <div class="header-content secretary-header-content dashboard-header-content">
          <div class="header-left secretary-header-copy dashboard-header-copy">
            <button type="button" class="mobile-menu-toggle" aria-label="Open sidebar" @click="toggleSidebar"><i class="fas fa-bars"></i></button>
            <div>
              <h1>Secretary Profile</h1>
              <p class="header-subtitle">Review your account information and keep your secretary details up to date.</p>
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

    <section class="secretary-profile-grid">
      <article class="section-card dashboard-panel secretary-profile-card secretary-surface-card">
        <div class="secretary-card-head">
          <div>
            <h3>Profile Summary</h3>
            <p>Core account details used across your secretary dashboard.</p>
          </div>
        </div>

        <div class="secretary-detail-list">
          <div class="secretary-detail-item">
            <span>Full Name</span>
            <strong>{{ displayName }}</strong>
          </div>
          <div class="secretary-detail-item">
            <span>Email Address</span>
            <strong>{{ profileForm.email || 'Not provided' }}</strong>
          </div>
          <div class="secretary-detail-item">
            <span>Username</span>
            <strong>{{ authStore.user?.username || 'Not provided' }}</strong>
          </div>
          <div class="secretary-detail-item">
            <span>Role</span>
            <strong>Secretary</strong>
          </div>
          <div class="secretary-detail-item">
            <span>Department Scope</span>
            <strong>All academic departments</strong>
          </div>
        </div>
      </article>

      <article class="section-card dashboard-panel secretary-profile-card secretary-surface-card">
        <div class="secretary-card-head">
          <div>
            <h3>Edit Basic Information</h3>
            <p>Update your photo, name, and username. Your role cannot be changed here.</p>
          </div>
        </div>

        <form class="secretary-form" @submit.prevent="saveProfile">
          <div class="secretary-photo-row">
            <img v-if="photoPreview || authStore.user?.profileImage" :src="photoPreview || authStore.user.profileImage" alt="Your profile photo" class="secretary-profile-photo">
            <span v-else class="secretary-profile-photo secretary-photo-placeholder"><i class="fas fa-user" aria-hidden="true"></i></span>
            <label class="secretary-field"><span>Profile Photo</span><input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" :disabled="isSaving" @change="selectPhoto"><small>JPG, PNG or WebP, up to 5 MB.</small></label>
          </div>
          <div class="secretary-form-grid">
            <label class="secretary-field">
              <span>Display Name</span>
              <input v-model.trim="profileForm.name" type="text" placeholder="Enter display name" required maxlength="100" :disabled="isSaving">
              <small v-if="errors.name" class="secretary-field-error">{{ errors.name }}</small>
            </label>

            <label class="secretary-field">
              <span>Email Address</span>
              <input :value="profileForm.email" type="email" readonly>
              <small>Contact an administrator to request an email change.</small>
            </label>
            <label class="secretary-field"><span>Username</span><input v-model.trim="profileForm.username" required minlength="3" maxlength="30" pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}" autocomplete="username" :disabled="isSaving"><small v-if="errors.username" class="secretary-field-error">{{ errors.username }}</small></label>
            <label class="secretary-field"><span>Role</span><input value="Secretary" readonly></label>
          </div>

          <div class="secretary-form-actions">
            <button type="button" class="btn btn-outline" :disabled="isSaving" @click="resetProfile">Reset</button>
            <button type="submit" class="btn btn-primary secretary-save-profile-btn" :disabled="isSaving || !profileLoaded">{{ isSaving ? 'Saving…' : 'Save Profile' }}</button>
          </div>
        </form>
      </article>
    </section>
      <DashboardFooter />
    </main>
  </div>
</template>

<script setup>
import DashboardFooter from '../../components/DashboardFooter.vue'
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const isSaving = ref(false)
const profileLoaded = ref(false)
const photoPreview = ref('')
const photoInput = ref(null)
let selectedPhoto = null
const clearPhoto = () => {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = ''; selectedPhoto = null
  if (photoInput.value) photoInput.value.value = ''
}
const selectPhoto = (event) => {
  const file = event.target.files?.[0]
  clearPhoto()
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    banner.type = 'error'; banner.message = 'Choose a JPG, PNG or WebP image no larger than 5 MB.'; return
  }
  selectedPhoto = file; photoPreview.value = URL.createObjectURL(file); clearBanner()
}

const banner = reactive({
  type: 'success',
  message: '',
})
const profileForm = reactive({
  name: '',
  email: '',
  username: '',
})
const errors = reactive({
  name: '',
  username: '',
})

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'Secretary').trim())
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

const handleAccountMenuClickOutside = (event) => {
  const target = event?.target
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  isAccountMenuOpen.value = false
}

const syncProfileForm = () => {
  profileForm.name = String(authStore.user?.name || authStore.user?.displayName || '').trim()
  profileForm.email = String(authStore.user?.email || '').trim()
  profileForm.username = String(authStore.user?.username || '').trim()
}

const clearBanner = () => {
  banner.message = ''
}

const validateProfile = () => {
  errors.name = ''
  errors.username = ''

  if (!String(profileForm.name || '').trim()) {
    errors.name = 'Display name is required.'
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$/.test(profileForm.username)) errors.username = 'Enter a valid username (3–30 characters).'

  return !errors.name && !errors.username
}

const saveProfile = async () => {
  if (isSaving.value || !profileLoaded.value) return
  clearBanner()
  if (!validateProfile()) {
    banner.type = 'error'
    banner.message = 'Please review the highlighted fields before saving.'
    return
  }

  isSaving.value = true
  try {
    let base = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
    if (!base.endsWith('/api')) base += '/api'
    const body = new FormData()
    body.append('name', profileForm.name); body.append('username', profileForm.username)
    if (selectedPhoto) body.append('profileImage', selectedPhoto)
    const { data } = await axios.put(`${base}/secretary/profile`, body, { headers: { Authorization: `Bearer ${authStore.token}` } })
    authStore.setUser({ ...data.user, displayName: data.user.name })
    syncProfileForm(); clearPhoto()
    banner.type = 'success'; banner.message = 'Secretary profile saved successfully.'
  } catch (error) {
    banner.type = 'error'; banner.message = error.response?.data?.message || 'Unable to save your profile. Please try again.'
  } finally { isSaving.value = false }
}

const resetProfile = () => {
  clearBanner()
  syncProfileForm()
  errors.name = ''
  errors.username = ''
  clearPhoto()
}

syncProfileForm()

onMounted(async () => {
  document.addEventListener('click', handleAccountMenuClickOutside)
  try { await authStore.refreshProfile(); syncProfileForm(); profileLoaded.value = true }
  catch { banner.type = 'error'; banner.message = 'Unable to load your profile. Reload before saving.' }
})

onBeforeUnmount(() => {
  clearPhoto()
  document.removeEventListener('click', handleAccountMenuClickOutside)
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";
.secretary-top-header { padding: .9rem 1rem !important; border-radius: 18px !important; }
.secretary-header-content { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.secretary-header-copy { display: flex; align-items: center; gap: .9rem; flex: 1 1 auto; min-width: 0; }
.secretary-header-copy > div { min-width: 0; }
@media (max-width: 768px) {
  .secretary-header-copy > div { display: none; }
  .secretary-top-header { padding: .75rem .9rem !important; border-radius: 16px !important; }
  .secretary-header-content {
    display: grid !important;
    grid-template-columns: 38px minmax(0, 1fr) 38px;
    align-items: center !important;
    gap: .75rem !important;
    width: 100%;
  }
  .secretary-header-copy {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 0 !important;
    grid-column: 1;
    flex: none !important;
    min-width: 0;
    width: auto;
  }
  .secretary-header-tools {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: .75rem !important;
    grid-column: 3;
    margin-left: 0 !important;
    flex: none !important;
    min-width: 0;
  }
  .secretary-header-copy .mobile-menu-toggle,
  .secretary-header-tools .account-menu-trigger {
    width: 38px !important;
    height: 38px !important;
    min-width: 38px !important;
    border-radius: 12px;
  }
  .secretary-header-copy .mobile-menu-toggle { margin: 0 !important; align-self: flex-start !important; }
  .secretary-header-tools .account-menu,
  .secretary-header-tools .account-menu-trigger { margin-left: auto !important; }
}
.secretary-header-copy h1 { margin: 0; font-size: 1.35rem; line-height: 1.15; }
.secretary-header-copy .header-subtitle { margin-top: .2rem; font-size: .86rem; line-height: 1.45; }
.secretary-header-tools { display: flex; align-items: center; gap: .6rem; margin-left: auto; flex: none; }
.secretary-header-copy .mobile-menu-toggle,
.secretary-header-tools .account-menu-trigger { width: 40px; height: 40px; min-width: 40px; border-radius: 12px; }
.secretary-photo-row { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
.secretary-profile-photo { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 3px solid #cfe2c4; }
.secretary-photo-placeholder { display: grid; place-items: center; background: #edf6e7; color: #4f8a35; font-size: 2rem; }
.secretary-field input[readonly] { background: #f2f7ee; color: #53664a; }
.secretary-form button:disabled { opacity: .6; cursor: not-allowed; }

.secretary-profile-grid,
.secretary-banner {
  @apply tw:w-full;
}

.secretary-form-actions {
  @apply tw:[gap:0.6rem];
}

.secretary-form-actions .btn {
  @apply tw:[height:38px]!;
  @apply tw:[min-height:38px]!;
  @apply tw:[padding:0_14px]!;
  @apply tw:[border-radius:9px];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:500];
  @apply tw:[line-height:1];
}

.secretary-save-profile-btn {
  @apply tw:[border-color:#4f8a35];
  @apply tw:[background:#4f8a35];
  @apply tw:bg-none;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:none];
}

.secretary-save-profile-btn:hover,
.secretary-save-profile-btn:focus {
  @apply tw:[border-color:#416f2c];
  @apply tw:[background:#416f2c];
  @apply tw:bg-none;
}

.secretary-save-profile-btn:active {
  @apply tw:[border-color:#365d25];
  @apply tw:[background:#365d25];
  @apply tw:bg-none;
}

</style>
