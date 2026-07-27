<template>
  <div class="admin-dashboard admin-profile-page">
    <header class="admin-header">
      <div class="container">
        <div class="admin-header-content">
          <button
            type="button"
            class="mobile-menu-toggle"
            @click="toggleSidebar"
            :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="isSidebarOpen ? 'true' : 'false'"
            aria-controls="admin-sidebar-drawer"
            title="Menu"
          >
            <i class="fas fa-bars"></i>
          </button>
          <div class="admin-logo">
            <div class="admin-logo-icon">
              <img src="/logo.png" alt="EduMatch" class="admin-logo-img" />
            </div>
            <div class="admin-logo-text">
              <h1>EduMatch Admin</h1>
              <span class="page-title">Profile</span>
            </div>
          </div>
          <div class="admin-actions">
            <div ref="accountMenuRef" class="account-menu">
              <button
                type="button"
                class="header-account-trigger"
                aria-label="Account menu"
                title="Settings"
                :aria-expanded="isAccountMenuOpen ? 'true' : 'false'"
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
      </div>
    </header>

    <div class="admin-layout">
      <aside id="admin-sidebar-drawer" class="admin-sidebar" :class="{ active: isSidebarOpen }">
        <div class="sidebar-header">
          <div class="admin-sidebar-brand">
            <div class="admin-sidebar-brand-icon">
              <img src="/logo.png" alt="EduMatch" class="admin-sidebar-logo-img" />
            </div>
            <div class="admin-sidebar-brand-copy">
              <h3>EduMatch</h3>
              <p>Admin Portal</p>
            </div>
          </div>
          <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <nav class="sidebar-menu sidebar-nav">
          <div class="nav-section">
            <h4 class="nav-section-title">Navigation</h4>
            <router-link to="/admin/dashboard" class="nav-link sidebar-item sidebar-item--dashboard" :class="{ active: isActive('/admin/dashboard') }" @click="closeSidebar">
              <i class="fas fa-tachometer-alt"></i>
              <span>Overview</span>
            </router-link>
            <router-link to="/admin/users" class="nav-link sidebar-item sidebar-item--users" :class="{ active: isActive('/admin/users') }" @click="closeSidebar">
              <i class="fas fa-user-cog"></i>
              <span>User Management</span>
            </router-link>
            <router-link to="/admin/requests" class="nav-link sidebar-item sidebar-item--requests" :class="{ active: isActive('/admin/requests') }" @click="closeSidebar">
              <i class="fas fa-inbox"></i>
              <span>Request</span>
            </router-link>
            <router-link to="/admin/login-attempts" class="nav-link sidebar-item sidebar-item--login-attempts" :class="{ active: isActive('/admin/login-attempts') }" @click="closeSidebar">
              <i class="fas fa-right-to-bracket"></i>
              <span>Login Attempts</span>
            </router-link>
            <router-link to="/admin/audit-logs" class="nav-link sidebar-item sidebar-item--audit-logs" :class="{ active: isActive('/admin/audit-logs') }" @click="closeSidebar">
              <i class="fas fa-clipboard-list"></i>
              <span>Audit Logs</span>
            </router-link>
          </div>
        </nav>
      </aside>
      <button
        v-if="isSidebarOpen"
        type="button"
        class="sidebar-backdrop"
        aria-label="Close sidebar"
        @click="closeSidebar"
      ></button>

      <main class="admin-main admin-profile-main">
        <div class="admin-profile-hero fade-in">
          <div class="header-left">
            <h2>Admin Profile</h2>
            <p>Manage your account identity, contact details, and administrator workspace information.</p>
          </div>
        </div>

        <section v-if="banner.message" class="profile-banner" :class="banner.type">
          <i class="fas" :class="banner.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"></i>
          <span>{{ banner.message }}</span>
        </section>

        <section class="profile-grid">
          <article class="profile-card section-card">
            <div class="profile-card-header">
              <div>
                <h3>Profile Summary</h3>
                <p>Core account information used throughout the admin workspace.</p>
              </div>
            </div>

            <div class="profile-summary">
              <div class="profile-avatar">
                <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" />
                <i v-else class="fas fa-user" style="color: #4f8a35 !important;" aria-hidden="true"></i>
              </div>
              <div class="profile-identity">
                <h4>{{ displayName }}</h4>
                <p>{{ profileForm.email || 'No email address provided' }}</p>
                <span class="profile-chip">Administrator</span>
                <div class="profile-photo-actions">
                  <label class="profile-photo-control" for="adminProfilePhoto">
                    <i class="fas fa-camera"></i>
                    <span>Change profile photo</span>
                    <input
                      id="adminProfilePhoto"
                      ref="profilePhotoInput"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-describedby="adminProfilePhotoHelp"
                      @change="handleProfilePhotoChange"
                    />
                  </label>
                  <span id="adminProfilePhotoHelp" class="profile-photo-help">
                    {{ selectedPhotoName ? `Selected: ${selectedPhotoName}` : 'PNG, JPG, or WebP · Maximum 2 MB' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="profile-detail-list">
              <div class="profile-detail-item">
                <span>Full Name</span>
                <strong>{{ displayName }}</strong>
              </div>
              <div class="profile-detail-item">
                <span>Email Address</span>
                <strong>{{ profileForm.email || 'Not provided' }}</strong>
              </div>
              <div class="profile-detail-item">
                <span>Username</span>
                <strong>{{ usernameLabel }}</strong>
              </div>
              <div class="profile-detail-item">
                <span>Contact Number</span>
                <strong>{{ profileForm.contactNumber || 'Not provided' }}</strong>
              </div>
            </div>
          </article>

          <article class="profile-card section-card">
            <div class="profile-card-header">
              <div>
                <h3>Edit Basic Information</h3>
                <p>Update the profile details shown in your local admin session.</p>
              </div>
            </div>

            <form class="profile-form" @submit.prevent="saveProfile">
              <div class="profile-form-grid">
                <label class="profile-field">
                  <span>Display Name</span>
                  <input v-model.trim="profileForm.name" type="text" placeholder="Enter display name" />
                  <small v-if="errors.name" class="profile-field-error">{{ errors.name }}</small>
                </label>

                <label class="profile-field">
                  <span>Email Address</span>
                  <input v-model.trim="profileForm.email" type="email" placeholder="Enter email address" />
                  <small v-if="errors.email" class="profile-field-error">{{ errors.email }}</small>
                </label>

                <label class="profile-field">
                  <span>Username</span>
                  <input v-model.trim="profileForm.username" type="text" placeholder="Enter username" />
                  <small v-if="errors.username" class="profile-field-error">{{ errors.username }}</small>
                </label>

                <label class="profile-field profile-field--wide">
                  <span>Contact Number</span>
                  <input v-model.trim="profileForm.contactNumber" type="text" placeholder="Optional contact number" />
                </label>
              </div>

              <div class="profile-form-actions">
                <button type="button" class="btn btn-outline" @click="resetProfile">Reset</button>
                <button type="submit" class="btn btn-primary" style="background: #4f8a35 !important; background-image: none !important; border-color: #4f8a35 !important; color: #ffffff !important; box-shadow: none !important;">Save Profile</button>
              </div>
            </form>
          </article>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const SIDEBAR_BREAKPOINT = 1024
const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const profilePhotoInput = ref(null)
const profileImageDraft = ref('')
const selectedPhotoName = ref('')
const banner = reactive({ type: 'success', message: '' })
const profileForm = reactive({
  name: '',
  email: '',
  username: '',
  contactNumber: '',
})
const errors = reactive({
  name: '',
  email: '',
  username: '',
})

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'Admin').trim())
const usernameLabel = computed(() => String(authStore.user?.username || 'Not provided').trim())
const avatarUrl = computed(() => {
  if (profileImageDraft.value) return profileImageDraft.value
  const profileImage = String(authStore.user?.profileImage || authStore.user?.avatar || '').trim()
  if (profileImage) return profileImage
  return ''
})

const isActive = (path) => route.path === path

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const toggleAccountMenu = () => {
  isAccountMenuOpen.value = !isAccountMenuOpen.value
}

const closeAccountMenu = () => {
  isAccountMenuOpen.value = false
}

const syncMobileMenuBodyState = () => {
  if (typeof window === 'undefined') return
  const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
  document.body.classList.toggle('admin-mobile-menu-open', shouldLockBody)
}

const syncProfileForm = () => {
  profileForm.name = String(authStore.user?.name || authStore.user?.displayName || '').trim()
  profileForm.email = String(authStore.user?.email || '').trim()
  profileForm.username = String(authStore.user?.username || '').trim()
  profileForm.contactNumber = String(authStore.user?.contactNumber || '').trim()
  profileImageDraft.value = String(authStore.user?.profileImage || authStore.user?.avatar || '').trim()
  selectedPhotoName.value = ''
  if (profilePhotoInput.value) {
    profilePhotoInput.value.value = ''
  }
}

const handleProfilePhotoChange = (event) => {
  clearBanner()
  const file = event?.target?.files?.[0]
  if (!file) return

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    banner.type = 'error'
    banner.message = 'Choose a PNG, JPG, or WebP profile photo.'
    selectedPhotoName.value = ''
    event.target.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    banner.type = 'error'
    banner.message = 'Profile photo must be 2 MB or smaller.'
    selectedPhotoName.value = ''
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    profileImageDraft.value = String(reader.result || '')
    selectedPhotoName.value = file.name
  }
  reader.onerror = () => {
    banner.type = 'error'
    banner.message = 'The selected profile photo could not be read.'
    selectedPhotoName.value = ''
    event.target.value = ''
  }
  reader.readAsDataURL(file)
}

const clearBanner = () => {
  banner.message = ''
}

const goToProfile = () => {
  closeAccountMenu()
  router.push('/admin/profile')
}

const goToSettings = () => {
  closeAccountMenu()
  router.push('/admin/settings')
}

const handleLogout = () => {
  closeAccountMenu()
  authStore.logout()
  router.push('/auth/login')
}

const handleDocumentClick = (event) => {
  const target = event?.target
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  closeAccountMenu()
}

const handleDocumentKeydown = (event) => {
  if (event.key === 'Escape') {
    closeAccountMenu()
  }
}

const validateProfile = () => {
  errors.name = ''
  errors.email = ''
  errors.username = ''

  if (!String(profileForm.name || '').trim()) {
    errors.name = 'Display name is required.'
  }

  const emailValue = String(profileForm.email || '').trim()
  if (!emailValue) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!String(profileForm.username || '').trim()) {
    errors.username = 'Username is required.'
  }

  return !errors.name && !errors.email && !errors.username
}

const saveProfile = () => {
  clearBanner()

  if (!validateProfile()) {
    banner.type = 'error'
    banner.message = 'Please review the highlighted fields before saving.'
    return
  }

  authStore.setUser({
    name: String(profileForm.name || '').trim(),
    displayName: String(profileForm.name || '').trim(),
    email: String(profileForm.email || '').trim(),
    username: String(profileForm.username || '').trim(),
    contactNumber: String(profileForm.contactNumber || '').trim(),
    profileImage: profileImageDraft.value,
  })

  selectedPhotoName.value = ''
  if (profilePhotoInput.value) {
    profilePhotoInput.value.value = ''
  }
  banner.type = 'success'
  banner.message = 'Admin profile updated successfully.'
}

const resetProfile = () => {
  clearBanner()
  syncProfileForm()
  errors.name = ''
  errors.email = ''
  errors.username = ''
}

watch(
  () => route.path,
  () => {
    closeSidebar()
    closeAccountMenu()
  }
)

watch(
  () => isSidebarOpen.value,
  () => {
    syncMobileMenuBodyState()
  }
)

onMounted(() => {
  document.body.classList.add('admin-dashboard')
  syncProfileForm()
  window.addEventListener('resize', syncMobileMenuBodyState)
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
  syncMobileMenuBodyState()
})

onBeforeUnmount(() => {
  document.body.classList.remove('admin-dashboard')
  document.body.classList.remove('admin-mobile-menu-open')
  window.removeEventListener('resize', syncMobileMenuBodyState)
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<style scoped>
@import url('/css/admin.css');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

:global(body.admin-dashboard) .admin-profile-page .admin-header .container {
  max-width: none !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 0px !important;
}

.admin-profile-main {
  min-width: 0;
}

.admin-profile-hero {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

.admin-profile-hero .header-left h2 {
  margin: 0 0 0.45rem;
  color: #111827;
  font-size: 2.35rem;
}

.admin-profile-hero .header-left p {
  margin: 0;
  color: #64748b;
}

.profile-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 16px;
  padding: 0.95rem 1rem;
  margin-bottom: 1.25rem;
  font-weight: 600;
  border: 1px solid transparent;
}

.profile-banner.success {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.profile-banner.error {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.profile-detail-item span,
.profile-field span {
  display: block;
  color: #6b7280;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.profile-detail-item strong {
  display: block;
  color: #111827;
  font-size: 1rem;
  font-weight: 700;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1.25rem;
}

.profile-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 1.35rem;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
}

.profile-card-header {
  margin-bottom: 1rem;
}

.profile-card-header h3 {
  margin: 0;
  color: #111827;
}

.profile-card-header p {
  margin: 0.35rem 0 0;
  color: #6b7280;
}

.profile-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 1.15rem;
  padding: 1.15rem;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fcf6 0%, #eef8ea 100%);
  border: 1px solid #c9ddbd;
  margin-bottom: 1rem;
}

.profile-avatar {
  display: grid;
  width: 96px;
  height: 96px;
  place-items: center;
  border: 1px solid #bdd6b1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 10px 24px rgba(49, 95, 35, 0.12);
}

.profile-avatar img {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ffffff;
}

.profile-avatar > i {
  color: #245b13;
  font-size: 2rem;
}

.profile-identity {
  min-width: 0;
}

.profile-photo-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 36px;
  padding: 0.48rem 0.8rem;
  border: 1px solid #69aa47;
  border-radius: 10px;
  background: #ffffff;
  color: #315f23;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.profile-photo-control:hover {
  border-color: #477d30;
  background: #f3faef;
  color: #315f23;
  transform: translateY(-1px);
}

.profile-photo-control:focus-within {
  outline: 3px solid rgba(105, 170, 71, 0.22);
  outline-offset: 2px;
}

.profile-photo-control input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.profile-photo-actions {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  margin-top: 0.85rem;
}

.profile-photo-help {
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.45;
}

.profile-identity h4 {
  margin: 0;
  color: #111827;
  font-size: 1.18rem;
  line-height: 1.3;
}

.profile-identity p {
  overflow: hidden;
  margin: 0.28rem 0 0.6rem;
  color: #6b7280;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.38rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #315f23;
  background: rgba(105, 170, 71, 0.14);
}

.profile-detail-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.profile-detail-item {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 0.95rem 1rem;
  background: #fcfcfd;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.profile-field {
  display: flex;
  flex-direction: column;
}

.profile-field--wide {
  grid-column: 1 / -1;
}

.profile-field input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 14px;
  padding: 0.9rem 1rem;
  font-size: 0.95rem;
  color: #111827;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.profile-field input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.profile-field-error {
  color: #b91c1c;
  font-size: 0.8rem;
  margin-top: 0.35rem;
}

.profile-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.1rem;
}

@media (max-width: 1100px) {
  .profile-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .profile-detail-list,
  .profile-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .profile-grid,
  .profile-detail-list,
  .profile-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .profile-summary {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    text-align: center;
  }

  .profile-identity {
    width: 100%;
  }

  .profile-photo-actions {
    justify-content: center;
  }

  .profile-identity p {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .profile-form-actions {
    flex-direction: column-reverse;
  }

  .profile-form-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .profile-card {
    padding: 1rem;
    border-radius: 16px;
  }

  .profile-summary {
    gap: 0.9rem;
    padding: 0.9rem;
    border-radius: 15px;
  }

  .profile-avatar {
    width: 88px;
    height: 88px;
  }

  .profile-avatar img {
    width: 78px;
    height: 78px;
  }

  .profile-photo-actions {
    display: grid;
    width: 100%;
    gap: 0.5rem;
  }

  .profile-photo-control {
    width: 100%;
  }

  .profile-photo-help {
    overflow-wrap: anywhere;
  }
}
</style>
