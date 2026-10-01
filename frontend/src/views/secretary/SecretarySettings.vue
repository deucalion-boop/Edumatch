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
              <h1>Change Password</h1>
              <p class="header-subtitle">Update your secretary account password and keep your access secure.</p>
            </div>
          </div>

          <div class="secretary-header-tools">
            <button
              type="button"
              class="header-tour-btn account-menu-trigger"
              aria-label="Home dashboard"
              title="Home Dashboard"
              @click="router.push('/secretary/dashboard')"
            >
              <i class="fas fa-home"></i>
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

    <section v-if="banner.message" class="secretary-banner" :class="banner.type">
      <i class="fas" :class="banner.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"></i>
      <span>{{ banner.message }}</span>
    </section>

    <section class="secretary-settings-grid">
      <article class="section-card dashboard-panel secretary-settings-card secretary-surface-card">
        <div class="secretary-card-head">
          <div>
            <h3>Account Security</h3>
            <p>Enter your current password, then choose a new one that meets the security rules below.</p>
          </div>
        </div>

        <form class="secretary-security-form" @submit.prevent="submitPasswordChange">
          <label class="secretary-field">
            <span>Current Password</span>
            <div class="secretary-password-wrap">
              <input
                :type="showCurrentPassword ? 'text' : 'password'"
                v-model="securityForm.currentPassword"
                class="secretary-input"
                placeholder="Enter current password"
                autocomplete="current-password"
              >
              <button type="button" class="secretary-password-toggle" @click="showCurrentPassword = !showCurrentPassword" :aria-label="showCurrentPassword ? 'Hide current password' : 'Show current password'">
                <i class="fas" :class="showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
            <small v-if="validationErrors.currentPassword" class="secretary-field-error">{{ validationErrors.currentPassword }}</small>
          </label>

          <div class="secretary-field-row">
            <label class="secretary-field">
              <span>New Password</span>
              <div class="secretary-password-wrap">
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  v-model="securityForm.newPassword"
                  class="secretary-input"
                  placeholder="Enter new password"
                  autocomplete="new-password"
                >
                <button type="button" class="secretary-password-toggle" @click="showNewPassword = !showNewPassword" :aria-label="showNewPassword ? 'Hide new password' : 'Show new password'">
                  <i class="fas" :class="showNewPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </label>

            <label class="secretary-field">
              <span>Confirm New Password</span>
              <div class="secretary-password-wrap">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  v-model="securityForm.confirmPassword"
                  class="secretary-input"
                  placeholder="Re-enter new password"
                  autocomplete="new-password"
                >
                <button type="button" class="secretary-password-toggle" @click="showConfirmPassword = !showConfirmPassword" :aria-label="showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'">
                  <i class="fas" :class="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </label>
          </div>

          <small v-if="validationErrors.newPassword" class="secretary-field-error">{{ validationErrors.newPassword }}</small>
          <small v-if="validationErrors.confirmPassword" class="secretary-field-error">{{ validationErrors.confirmPassword }}</small>

          <div class="secretary-password-rules">
            <p>Password must include:</p>
            <ul>
              <li :class="{ met: passwordRules.minLength }">At least 8 characters</li>
              <li :class="{ met: passwordRules.hasUpper }">One uppercase letter</li>
              <li :class="{ met: passwordRules.hasLower }">One lowercase letter</li>
              <li :class="{ met: passwordRules.hasNumber }">One number</li>
            </ul>
          </div>

          <div class="secretary-form-actions">
            <button type="submit" class="btn btn-primary secretary-update-password-btn" :disabled="isSubmitting">
              {{ isSubmitting ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </article>
    </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)

const banner = reactive({
  type: 'success',
  message: '',
})
const securityForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const validationErrors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
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

const handleAccountMenuClickOutside = (event) => {
  const target = event?.target
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  isAccountMenuOpen.value = false
}

const clearBanner = () => {
  banner.message = ''
}

const passwordRules = computed(() => {
  const password = String(securityForm.newPassword || '')
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }
})

const hasStrongPassword = computed(() => Object.values(passwordRules.value).every(Boolean))

const resetValidationErrors = () => {
  validationErrors.currentPassword = ''
  validationErrors.newPassword = ''
  validationErrors.confirmPassword = ''
}

const validateSecurityForm = () => {
  resetValidationErrors()
  clearBanner()

  if (!String(securityForm.currentPassword || '').trim()) {
    validationErrors.currentPassword = 'Current password is required.'
  }

  if (!hasStrongPassword.value) {
    validationErrors.newPassword = 'New password does not meet security requirements.'
  }

  if (securityForm.newPassword !== securityForm.confirmPassword) {
    validationErrors.confirmPassword = 'Confirmation password does not match.'
  }

  return !validationErrors.currentPassword && !validationErrors.newPassword && !validationErrors.confirmPassword
}

const resetSecurityForm = () => {
  securityForm.currentPassword = ''
  securityForm.newPassword = ''
  securityForm.confirmPassword = ''
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
  resetValidationErrors()
}

const handleLogout = () => {
  isAccountMenuOpen.value = false
  authStore.logout()
  router.push('/auth/login')
}

const submitPasswordChange = async () => {
  if (!validateSecurityForm()) return

  isSubmitting.value = true
  try {
    await authStore.changePassword({
      currentPassword: securityForm.currentPassword,
      newPassword: securityForm.newPassword,
      confirmNewPassword: securityForm.confirmPassword,
    })

    banner.type = 'success'
    banner.message = authStore.message || 'Password updated successfully.'
    resetSecurityForm()
  } catch (_error) {
    banner.type = 'error'
    banner.message = authStore.error || 'Unable to update password.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleAccountMenuClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountMenuClickOutside)
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";

.secretary-settings-grid,
.secretary-settings-hero,
.secretary-banner {
  @apply tw:w-full;
}

.secretary-settings-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
}

.secretary-settings-card {
  @apply tw:w-full;
}

.secretary-security-form {
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.secretary-field-row {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.secretary-field {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.secretary-field span {
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.85rem];
  @apply tw:[font-weight:700];
}

.secretary-password-wrap {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#fff];
  @apply tw:overflow-hidden;
}

.secretary-input {
  @apply tw:w-full;
  @apply tw:[min-height:50px];
  @apply tw:[padding:0.85rem_1rem];
  @apply tw:[border:0];
  @apply tw:[outline:none];
  @apply tw:[background:transparent];
  @apply tw:[color:#0f172a];
}

.secretary-password-toggle {
  @apply tw:[width:48px];
  @apply tw:[min-width:48px];
  @apply tw:[height:48px];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#64748b];
}

.secretary-field-error {
  @apply tw:[color:#b91c1c];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:600];
}

.secretary-password-rules {
  @apply tw:[padding:1rem_1.1rem];
  @apply tw:[border:1px_solid_#dbe4ec];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff,_#f8fbfb)];
}

.secretary-password-rules p {
  @apply tw:[margin:0_0_0.6rem];
  @apply tw:[color:#334155];
  @apply tw:[font-weight:700];
}

.secretary-password-rules ul {
  @apply tw:[margin:0];
  @apply tw:[padding-left:1.1rem];
  @apply tw:[color:#64748b];
}

.secretary-password-rules li + li {
  @apply tw:[margin-top:0.35rem];
}

.secretary-password-rules li.met {
  @apply tw:[color:#15803d];
  @apply tw:[font-weight:700];
}

.secretary-form-actions {
  @apply tw:flex;
  @apply tw:justify-end;
}

.secretary-update-password-btn {
  @apply tw:[border-color:#4f8a35];
  @apply tw:[background:#4f8a35];
  @apply tw:bg-none;
  @apply tw:[color:#ffffff];
}

.secretary-update-password-btn:hover:not(:disabled),
.secretary-update-password-btn:focus:not(:disabled) {
  @apply tw:[border-color:#416f2c];
  @apply tw:[background:#416f2c];
  @apply tw:bg-none;
}

.secretary-update-password-btn:active:not(:disabled) {
  @apply tw:[border-color:#365d25];
  @apply tw:[background:#365d25];
  @apply tw:bg-none;
}

@media (max-width: 768px) {
  .secretary-settings-card {
    @apply tw:w-full;
  }

  .secretary-field-row {
    @apply tw:[grid-template-columns:1fr];
  }

  .secretary-form-actions {
    @apply tw:justify-stretch;
  }

  .secretary-form-actions .btn {
    @apply tw:w-full;
  }
}

</style>
