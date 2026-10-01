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
                <i v-else class="fas fa-user tw:inline:[color:#4f8a35]!"  aria-hidden="true"></i>
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
                  <input v-model.trim="profileForm.contactNumber" type="tel" inputmode="tel" placeholder="+63 912 345 6789" />
                  <small v-if="errors.contactNumber" class="profile-field-error">{{ errors.contactNumber }}</small>
                </label>
              </div>

              <div class="profile-form-actions">
                <button type="button" class="btn btn-outline" @click="resetProfile">Reset</button>
                <button type="submit" class="btn btn-primary tw:inline:[background:#4f8a35]! tw:inline:[background-image:none]! tw:inline:[border-color:#4f8a35]! tw:inline:[color:#ffffff]! tw:inline:[box-shadow:none]!" >Save Profile</button>
              </div>
            </form>
          </article>
        </section>
        <footer>© 2026 EduMatch</footer>
      </main>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { isValidPhilippinePhone, normalizePhilippinePhone } from '../../utils/phone.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const SIDEBAR_BREAKPOINT = 1024
const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const profilePhotoInput = ref(null)
const profileImageDraft = ref('')
const selectedProfilePhoto = ref(null)
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
  contactNumber: '',
})

const resolveProfileImageUrl = (value) => {
  const raw = String(value || '').trim()
  if (!raw || /^data:|^blob:/i.test(raw)) return raw

  try {
    const parsed = new URL(raw, window.location.origin)
    if (parsed.pathname.startsWith('/api/storage/')) {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      const apiBase = configured
        ? (configured.endsWith('/api') ? configured : `${configured}/api`)
        : '/api'
      return `${apiBase}${parsed.pathname.slice('/api'.length)}${parsed.search}${parsed.hash}`
    }
  } catch (_error) {
    // Keep the supplied value below when it is not a URL.
  }

  return raw
}

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'Admin').trim())
const usernameLabel = computed(() => String(authStore.user?.username || 'Not provided').trim())
const avatarUrl = computed(() => {
  if (profileImageDraft.value) return resolveProfileImageUrl(profileImageDraft.value)
  const profileImage = String(authStore.user?.profileImage || authStore.user?.avatar || '').trim()
  if (profileImage) return resolveProfileImageUrl(profileImage)
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
  profileForm.contactNumber = normalizePhilippinePhone(authStore.user?.contactNumber)
  profileImageDraft.value = resolveProfileImageUrl(authStore.user?.profileImage || authStore.user?.avatar || '')
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

  selectedProfilePhoto.value = file
  profileImageDraft.value = URL.createObjectURL(file)
  selectedPhotoName.value = file.name
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
  errors.contactNumber = ''

  if (!String(profileForm.name || '').trim()) {
    errors.name = 'Display name is required.'
  }

  const emailValue = String(profileForm.email || '').trim()
  if (!emailValue) {
    errors.email = 'Email address is required.'
  } else if (!/^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@gmail\.com$/i.test(emailValue)) {
    errors.email = 'Enter a valid Gmail address (e.g., user@gmail.com).'
  }

  if (!String(profileForm.username || '').trim()) {
    errors.username = 'Username is required.'
  }

  if (!isValidPhilippinePhone(profileForm.contactNumber)) {
    errors.contactNumber = 'Enter a valid Philippine number beginning with +63.'
  }

  return !errors.name && !errors.email && !errors.username && !errors.contactNumber
}

const saveProfile = async () => {
  clearBanner()

  if (!validateProfile()) {
    banner.type = 'error'
    banner.message = 'Please review the highlighted fields before saving.'
    return
  }

  const userId = String(authStore.user?.id || authStore.user?._id || '').trim()
  const token = String(authStore.token || '').trim()
  if (!userId || !token) {
    banner.type = 'error'
    banner.message = 'Your session expired. Please sign in again.'
    return
  }

  try {
    const payload = new FormData()
    payload.append('name', String(profileForm.name || '').trim())
    payload.append('email', String(profileForm.email || '').trim())
    payload.append('username', String(profileForm.username || '').trim())
    payload.append('contactNumber', normalizePhilippinePhone(profileForm.contactNumber))
    if (selectedProfilePhoto.value) payload.append('profileImage', selectedProfilePhoto.value)

    const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
    const apiBase = configured ? (configured.endsWith('/api') ? configured : `${configured}/api`) : '/api'
    const response = await axios.put(`${apiBase}/admin/users/${encodeURIComponent(userId)}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const updatedUser = response.data?.user
    if (!updatedUser) throw new Error('Profile update response was invalid')

    authStore.setUser({
      ...authStore.user,
      ...updatedUser,
      displayName: updatedUser.name || profileForm.name,
      profileImage: resolveProfileImageUrl(updatedUser.profileImage || ''),
    })
    profileImageDraft.value = resolveProfileImageUrl(updatedUser.profileImage || '')
    selectedProfilePhoto.value = null
  } catch (error) {
    banner.type = 'error'
    banner.message = error.response?.data?.message || 'Failed to save the admin profile.'
    return
  }

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
  errors.contactNumber = ''
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
@reference "../../styles/tailwind.css";

@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

@import '../../styles/roles/admin.tailwind.css';


:global(body.admin-dashboard) .admin-profile-page .admin-header .container {
  @apply tw:max-w-none!;
  @apply tw:w-full!;
  @apply tw:[margin:0]!;
  @apply tw:[padding:0_0px]!;
}

.admin-profile-main {
  @apply tw:[min-width:0];
}

.admin-profile-hero {
  @apply tw:flex;
  @apply tw:justify-start;
  @apply tw:items-start;
}

.admin-profile-hero .header-left h2 {
  @apply tw:[margin:0_0_0.45rem];
  @apply tw:[color:#111827];
  @apply tw:[font-size:2.35rem];
}

.admin-profile-hero .header-left p {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
}

.profile-banner {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[margin-bottom:1.25rem];
  @apply tw:[font-weight:600];
  @apply tw:[border:1px_solid_transparent];
}

.profile-banner.success {
  @apply tw:[background:#ecfdf5];
  @apply tw:[color:#065f46];
  @apply tw:[border-color:#a7f3d0];
}

.profile-banner.error {
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#991b1b];
  @apply tw:[border-color:#fecaca];
}

.profile-detail-item span,
.profile-field span {
  @apply tw:block;
  @apply tw:[color:#6b7280];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:600];
  @apply tw:[margin-bottom:0.3rem];
}

.profile-detail-item strong {
  @apply tw:block;
  @apply tw:[color:#111827];
  @apply tw:[font-size:1rem];
  @apply tw:[font-weight:700];
}

.profile-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.2fr)_minmax(0,_1fr)];
  @apply tw:[gap:1.25rem];
}

.profile-card {
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-radius:20px];
  @apply tw:[padding:1.35rem];
  @apply tw:[box-shadow:0_14px_32px_rgba(15,_23,_42,_0.06)];
}

.profile-card-header {
  @apply tw:[margin-bottom:1rem];
}

.profile-card-header h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#111827];
}

.profile-card-header p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#6b7280];
}

.profile-summary {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:items-center;
  @apply tw:[gap:1.15rem];
  @apply tw:[padding:1.15rem];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(135deg,_#f8fcf6_0%,_#eef8ea_100%)];
  @apply tw:[border:1px_solid_#c9ddbd];
  @apply tw:[margin-bottom:1rem];
}

.profile-avatar {
  @apply tw:grid;
  @apply tw:[width:96px];
  @apply tw:[height:96px];
  @apply tw:place-items-center;
  @apply tw:[border:1px_solid_#bdd6b1];
  @apply tw:[border-radius:50%];
  @apply tw:[background:rgba(255,_255,_255,_0.85)];
  @apply tw:[box-shadow:0_10px_24px_rgba(49,_95,_35,_0.12)];
}

.profile-avatar img {
  @apply tw:[width:86px];
  @apply tw:[height:86px];
  @apply tw:[border-radius:50%];
  @apply tw:object-cover;
  @apply tw:[border:3px_solid_#ffffff];
}

.profile-avatar > i {
  @apply tw:[color:#245b13];
  @apply tw:[font-size:2rem];
}

.profile-identity {
  @apply tw:[min-width:0];
}

.profile-photo-control {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[min-height:36px];
  @apply tw:[padding:0.48rem_0.8rem];
  @apply tw:[border:1px_solid_#69aa47];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#315f23];
  @apply tw:cursor-pointer;
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:[transition:background-color_0.2s_ease,_border-color_0.2s_ease,_transform_0.2s_ease];
}

.profile-photo-control:hover {
  @apply tw:[border-color:#477d30];
  @apply tw:[background:#f3faef];
  @apply tw:[color:#315f23];
  @apply tw:[transform:translateY(-1px)];
}

.profile-photo-control:focus-within {
  @apply tw:[outline:3px_solid_rgba(105,_170,_71,_0.22)];
  @apply tw:[outline-offset:2px];
}

.profile-photo-control input {
  @apply tw:absolute;
  @apply tw:[width:1px];
  @apply tw:[height:1px];
  @apply tw:overflow-hidden;
  @apply tw:[clip:rect(0_0_0_0)];
  @apply tw:[clip-path:inset(50%)];
  @apply tw:whitespace-nowrap;
}

.profile-photo-actions {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
  @apply tw:flex-wrap;
  @apply tw:[margin-top:0.85rem];
}

.profile-photo-help {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.75rem];
  @apply tw:[line-height:1.45];
}

.profile-identity h4 {
  @apply tw:[margin:0];
  @apply tw:[color:#111827];
  @apply tw:[font-size:1.18rem];
  @apply tw:[line-height:1.3];
}

.profile-identity p {
  @apply tw:overflow-hidden;
  @apply tw:[margin:0.28rem_0_0.6rem];
  @apply tw:[color:#6b7280];
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

.profile-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[border-radius:999px];
  @apply tw:[padding:0.38rem_0.7rem];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:[color:#315f23];
  @apply tw:[background:rgba(105,_170,_71,_0.14)];
}

.profile-detail-list {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.85rem];
}

.profile-detail-item {
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[background:#fcfcfd];
}

.profile-form-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.profile-field {
  @apply tw:flex;
  @apply tw:flex-col;
}

.profile-field--wide {
  @apply tw:[grid-column:1_/_-1];
}

.profile-field input {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_#d1d5db];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[font-size:0.95rem];
  @apply tw:[color:#111827];
  @apply tw:[background:#ffffff];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease];
}

.profile-field input:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:#2563eb];
  @apply tw:[box-shadow:0_0_0_4px_rgba(37,_99,_235,_0.12)];
}

.profile-field-error {
  @apply tw:[color:#b91c1c];
  @apply tw:[font-size:0.8rem];
  @apply tw:[margin-top:0.35rem];
}

.profile-form-actions {
  @apply tw:flex;
  @apply tw:justify-end;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-top:1.1rem];
}

@media (max-width: 1100px) {
  .profile-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .profile-detail-list,
  .profile-form-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }
}

@media (max-width: 768px) {
  .profile-grid,
  .profile-detail-list,
  .profile-form-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .profile-summary {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
    @apply tw:justify-items-center;
    @apply tw:text-center;
  }

  .profile-identity {
    @apply tw:w-full;
  }

  .profile-photo-actions {
    @apply tw:justify-center;
  }

  .profile-identity p {
    @apply tw:whitespace-normal;
    @apply tw:[overflow-wrap:anywhere];
  }

  .profile-form-actions {
    @apply tw:flex-col-reverse;
  }

  .profile-form-actions .btn {
    @apply tw:w-full;
    @apply tw:justify-center;
  }
}

@media (max-width: 480px) {
  .profile-card {
    @apply tw:[padding:1rem];
    @apply tw:[border-radius:16px];
  }

  .profile-summary {
    @apply tw:[gap:0.9rem];
    @apply tw:[padding:0.9rem];
    @apply tw:[border-radius:15px];
  }

  .profile-avatar {
    @apply tw:[width:88px];
    @apply tw:[height:88px];
  }

  .profile-avatar img {
    @apply tw:[width:78px];
    @apply tw:[height:78px];
  }

  .profile-photo-actions {
    @apply tw:grid;
    @apply tw:w-full;
    @apply tw:[gap:0.5rem];
  }

  .profile-photo-control {
    @apply tw:w-full;
  }

  .profile-photo-help {
    @apply tw:[overflow-wrap:anywhere];
  }
}

</style>
