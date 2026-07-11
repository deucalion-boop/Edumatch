<template>
  <div class="teacher-dashboard headteacher-dashboard-page">
    <main class="teacher-main headteacher-main dashboard-container">
      <header class="top-header headteacher-top-header dashboard-header">
        <div class="header-content headteacher-header-content dashboard-header-content">
          <div class="header-left headteacher-header-copy dashboard-header-copy">
            <div>
              <h1>Change Password</h1>
              <p class="header-subtitle">Update your Head Teacher account password and keep your department access secure.</p>
            </div>
          </div>

          <div class="headteacher-header-tools">
            <button
              type="button"
              class="header-tour-btn account-menu-trigger"
              aria-label="Home dashboard"
              title="Home Dashboard"
              @click="router.push('/headteacher/dashboard')"
            >
              <i class="fas fa-home"></i>
            </button>
            <div ref="accountMenuRef" class="account-menu">
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

      <section v-if="banner.message" class="headteacher-banner" :class="banner.type">
        <i class="fas" :class="banner.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"></i>
        <span>{{ banner.message }}</span>
      </section>

      <section class="section-card dashboard-panel headteacher-profile-hero">
        <div class="headteacher-settings-icon">
          <i class="fas fa-key"></i>
        </div>
        <div class="headteacher-profile-copy">
          <span class="headteacher-eyebrow">Security</span>
          <h2>Change Password</h2>
          <p>Use a strong password with a mix of uppercase, lowercase, and numbers before saving.</p>
        </div>
      </section>

      <section class="headteacher-profile-grid">
        <article class="section-card dashboard-panel content-card">
          <div class="headteacher-section-head">
            <div>
              <h2 class="section-title">Account Security</h2>
              <p class="toolbar-subtitle">Enter your current password, then choose a new one that meets the security rules below.</p>
            </div>
          </div>

          <form class="headteacher-security-form" @submit.prevent="submitPasswordChange">
            <label class="headteacher-form-group">
              <span>Current Password</span>
              <div class="headteacher-password-wrap">
                <input
                  v-model="securityForm.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  class="headteacher-password-input"
                  placeholder="Enter current password"
                  autocomplete="current-password"
                >
                <button
                  type="button"
                  class="headteacher-password-toggle"
                  :aria-label="showCurrentPassword ? 'Hide current password' : 'Show current password'"
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <i class="fas" :class="showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
              <small v-if="validationErrors.currentPassword" class="headteacher-form-feedback error">{{ validationErrors.currentPassword }}</small>
            </label>

            <div class="headteacher-form-grid">
              <label class="headteacher-form-group">
                <span>New Password</span>
                <div class="headteacher-password-wrap">
                  <input
                    v-model="securityForm.newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    class="headteacher-password-input"
                    placeholder="Enter new password"
                    autocomplete="new-password"
                  >
                  <button
                    type="button"
                    class="headteacher-password-toggle"
                    :aria-label="showNewPassword ? 'Hide new password' : 'Show new password'"
                    @click="showNewPassword = !showNewPassword"
                  >
                    <i class="fas" :class="showNewPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
              </label>

              <label class="headteacher-form-group">
                <span>Confirm New Password</span>
                <div class="headteacher-password-wrap">
                  <input
                    v-model="securityForm.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    class="headteacher-password-input"
                    placeholder="Re-enter new password"
                    autocomplete="new-password"
                  >
                  <button
                    type="button"
                    class="headteacher-password-toggle"
                    :aria-label="showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <i class="fas" :class="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
              </label>
            </div>

            <small v-if="validationErrors.newPassword" class="headteacher-form-feedback error">{{ validationErrors.newPassword }}</small>
            <small v-if="validationErrors.confirmPassword" class="headteacher-form-feedback error">{{ validationErrors.confirmPassword }}</small>

            <div class="headteacher-password-rules">
              <p>Password must include:</p>
              <ul>
                <li :class="{ met: passwordRules.minLength }">At least 8 characters</li>
                <li :class="{ met: passwordRules.hasUpper }">One uppercase letter</li>
                <li :class="{ met: passwordRules.hasLower }">One lowercase letter</li>
                <li :class="{ met: passwordRules.hasNumber }">One number</li>
              </ul>
            </div>

            <div class="modal-panel-actions">
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

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

const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }

const goToProfile = () => {
  isAccountMenuOpen.value = false
  router.push('/headteacher/profile')
}

const goToSettings = () => {
  isAccountMenuOpen.value = false
  router.push('/headteacher/settings')
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
.headteacher-main,
.headteacher-main.dashboard-container {
  width: 100%;
  max-width: none !important;
  margin: 0;
}

.headteacher-profile-grid,
.headteacher-profile-hero,
.headteacher-banner {
  width: 100%;
}

.headteacher-profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.content-card {
  width: 100%;
}

.headteacher-security-form {
  display: grid;
  gap: 1rem;
}

.headteacher-password-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.headteacher-password-input {
  width: 100%;
  min-height: 50px;
  padding: 0.85rem 1rem;
  border: 0;
  outline: none;
  background: transparent;
  color: #0f172a;
}

.headteacher-password-toggle {
  width: 48px;
  min-width: 48px;
  height: 48px;
  border: 0;
  background: transparent;
  color: #64748b;
}

.headteacher-password-rules {
  padding: 1rem 1.1rem;
  border: 1px solid #dbe4ec;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #f8fbfb);
}

.headteacher-password-rules p {
  margin: 0 0 0.6rem;
  color: #334155;
  font-weight: 700;
}

.headteacher-password-rules ul {
  margin: 0;
  padding-left: 1.1rem;
  color: #64748b;
}

.headteacher-password-rules li + li {
  margin-top: 0.35rem;
}

.headteacher-password-rules li.met {
  color: #15803d;
  font-weight: 700;
}

@media (max-width: 768px) {
  .modal-panel-actions .btn {
    width: 100%;
  }
}
</style>
