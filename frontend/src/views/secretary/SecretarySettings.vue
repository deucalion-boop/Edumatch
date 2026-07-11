<template>
  <div class="teacher-dashboard secretary-dashboard-page">
    <main class="teacher-main secretary-main dashboard-container">
      <header class="top-header secretary-top-header dashboard-header">
        <div class="header-content secretary-header-content dashboard-header-content">
          <div class="header-left secretary-header-copy dashboard-header-copy">
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

    <section class="section-card dashboard-panel secretary-settings-hero secretary-surface-card">
      <div class="secretary-settings-icon">
        <i class="fas fa-key"></i>
      </div>
      <div>
        <span class="secretary-eyebrow">Security</span>
        <h2>Change Password</h2>
        <p>Use a strong password with a mix of uppercase, lowercase, and numbers before saving.</p>
      </div>
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
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
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
.secretary-main,
.secretary-main.dashboard-container {
  width: 100%;
  max-width: none !important;
  margin: 0;
}

.secretary-settings-grid,
.secretary-settings-hero,
.secretary-banner {
  width: 100%;
}

.secretary-settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.secretary-settings-card {
  width: 100%;
}

.secretary-security-form {
  display: grid;
  gap: 1rem;
}

.secretary-field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.secretary-field {
  display: grid;
  gap: 0.45rem;
}

.secretary-field span {
  color: #475569;
  font-size: 0.85rem;
  font-weight: 700;
}

.secretary-password-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.secretary-input {
  width: 100%;
  min-height: 50px;
  padding: 0.85rem 1rem;
  border: 0;
  outline: none;
  background: transparent;
  color: #0f172a;
}

.secretary-password-toggle {
  width: 48px;
  min-width: 48px;
  height: 48px;
  border: 0;
  background: transparent;
  color: #64748b;
}

.secretary-field-error {
  color: #b91c1c;
  font-size: 0.8rem;
  font-weight: 600;
}

.secretary-password-rules {
  padding: 1rem 1.1rem;
  border: 1px solid #dbe4ec;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #f8fbfb);
}

.secretary-password-rules p {
  margin: 0 0 0.6rem;
  color: #334155;
  font-weight: 700;
}

.secretary-password-rules ul {
  margin: 0;
  padding-left: 1.1rem;
  color: #64748b;
}

.secretary-password-rules li + li {
  margin-top: 0.35rem;
}

.secretary-password-rules li.met {
  color: #15803d;
  font-weight: 700;
}

.secretary-form-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .secretary-settings-card {
    width: 100%;
  }

  .secretary-field-row {
    grid-template-columns: 1fr;
  }

  .secretary-form-actions {
    justify-content: stretch;
  }

  .secretary-form-actions .btn {
    width: 100%;
  }
}
</style>
