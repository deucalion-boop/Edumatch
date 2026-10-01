<template>
  <div class="headteacher-workspace headteacher-dashboard-page">
    <main class="headteacher-main headteacher-page-container">
      <header class="headteacher-top-header">
        <div class="headteacher-header-content">
          <div class="headteacher-header-copy">
            <div>
              <h1>Change Password</h1>
              <p class="headteacher-header-subtitle">Update your Head Teacher account password and keep your department access secure.</p>
            </div>
          </div>

          <div class="headteacher-header-tools">
            <HeadTeacherNotifications />
            <button
              type="button"
              class="headteacher-header-settings-button headteacher-account-menu-trigger"
              aria-label="Home dashboard"
              title="Home Dashboard"
              @click="router.push('/headteacher/dashboard')"
            >
              <i class="fas fa-home"></i>
            </button>
            <div ref="accountMenuRef" class="headteacher-account-menu">
              <button
                type="button"
                class="headteacher-header-settings-button headteacher-account-menu-trigger"
                aria-label="Settings menu"
                title="Settings"
                @click="toggleAccountMenu"
              >
                <i class="fas fa-cog"></i>
              </button>
              <div v-if="isAccountMenuOpen" class="headteacher-account-menu-dropdown">
                <button type="button" class="headteacher-account-menu-item" @click="goToProfile">
                  <i class="fas fa-user"></i>
                  <span>Profile</span>
                </button>
                <button type="button" class="headteacher-account-menu-item" @click="goToSettings">
                  <i class="fas fa-cog"></i>
                  <span>Settings</span>
                </button>
                <button type="button" class="headteacher-account-menu-item danger" @click="handleLogout">
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

      <section class="headteacher-section-card headteacher-panel headteacher-profile-hero">
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
        <article class="headteacher-section-card headteacher-panel headteacher-content-card">
          <div class="headteacher-section-head">
            <div>
              <h2 class="headteacher-section-title">Account Security</h2>
              <p class="headteacher-section-subtitle">Enter your current password, then choose a new one that meets the security rules below.</p>
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

            <div class="headteacher-modal-actions">
              <button type="submit" class="headteacher-button headteacher-button-primary" :disabled="isSubmitting">
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
import HeadTeacherNotifications from '../../components/HeadTeacherNotifications.vue'
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
@reference "../../styles/tailwind.css";

.headteacher-main,
.headteacher-main.headteacher-page-container {
  @apply tw:w-full;
  @apply tw:max-w-none!;
  @apply tw:[margin:0];
}

.headteacher-profile-grid,
.headteacher-profile-hero,
.headteacher-banner {
  @apply tw:w-full;
}

.headteacher-profile-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
}

.headteacher-content-card {
  @apply tw:w-full;
}

.headteacher-security-form {
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.headteacher-password-wrap {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#fff];
  @apply tw:overflow-hidden;
}

.headteacher-password-input {
  @apply tw:w-full;
  @apply tw:[min-height:50px];
  @apply tw:[padding:0.85rem_1rem];
  @apply tw:[border:0];
  @apply tw:[outline:none];
  @apply tw:[background:transparent];
  @apply tw:[color:#0f172a];
}

.headteacher-password-toggle {
  @apply tw:[width:48px];
  @apply tw:[min-width:48px];
  @apply tw:[height:48px];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#64748b];
}

.headteacher-password-rules {
  @apply tw:[padding:1rem_1.1rem];
  @apply tw:[border:1px_solid_#dbe4ec];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff,_#f8fbfb)];
}

.headteacher-password-rules p {
  @apply tw:[margin:0_0_0.6rem];
  @apply tw:[color:#334155];
  @apply tw:[font-weight:700];
}

.headteacher-password-rules ul {
  @apply tw:[margin:0];
  @apply tw:[padding-left:1.1rem];
  @apply tw:[color:#64748b];
}

.headteacher-password-rules li + li {
  @apply tw:[margin-top:0.35rem];
}

.headteacher-password-rules li.met {
  @apply tw:[color:#15803d];
  @apply tw:[font-weight:700];
}

@media (max-width: 768px) {
  .headteacher-modal-actions .headteacher-button {
    @apply tw:w-full;
  }
}

</style>
