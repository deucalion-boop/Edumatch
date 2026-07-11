<template>
  <div class="login-page">
    <div class="auth-bg-pattern"></div>
    <div class="auth-floating-elements">
      <div class="auth-floating-element"></div>
      <div class="auth-floating-element"></div>
      <div class="auth-floating-element"></div>
    </div>

    <div class="auth-container">
      <RouterLink to="/auth/login" class="auth-logo">
        <img src="/logo.png" alt="EduMatch Logo" class="auth-logo-img" />EduMatch
      </RouterLink>

      <div class="auth-card-wrapper">
        <div class="auth-card">
          <div class="auth-card-header">
            <h1 class="auth-card-title">Change Temporary Password</h1>
            <p class="auth-card-subtitle">
              Update your temporary password before continuing to your dashboard.
            </p>
          </div>

          <div v-if="error" class="auth-alert error">
            <i class="fas fa-exclamation-circle auth-alert-icon"></i>
            <div>{{ error }}</div>
          </div>

          <div v-if="message" class="auth-alert success">
            <i class="fas fa-check-circle auth-alert-icon"></i>
            <div>{{ message }}</div>
          </div>

          <form class="auth-form" @submit.prevent="handleSubmit">
            <div class="auth-form-group">
              <label class="auth-form-label" for="currentPassword">
                <i class="fas fa-lock"></i> Current Temporary Password
              </label>
              <div class="auth-form-input-wrapper">
                <input
                  :type="showCurrentPassword ? 'text' : 'password'"
                  id="currentPassword"
                  v-model="form.currentPassword"
                  class="auth-form-input"
                  required
                  maxlength="16"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showCurrentPassword = !showCurrentPassword"
                  :aria-label="showCurrentPassword ? 'Hide password' : 'Show password'"
                >
                  <i class="fas" :class="showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="newPassword">
                <i class="fas fa-key"></i> New Password
              </label>
              <div class="auth-form-input-wrapper">
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  id="newPassword"
                  v-model="form.newPassword"
                  class="auth-form-input"
                  required
                  minlength="8"
                  maxlength="16"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showNewPassword = !showNewPassword"
                  :aria-label="showNewPassword ? 'Hide password' : 'Show password'"
                >
                  <i class="fas" :class="showNewPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="confirmNewPassword">
                <i class="fas fa-check-circle"></i> Confirm New Password
              </label>
              <div class="auth-form-input-wrapper">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="confirmNewPassword"
                  v-model="form.confirmNewPassword"
                  class="auth-form-input"
                  required
                  minlength="8"
                  maxlength="16"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showConfirmPassword = !showConfirmPassword"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                >
                  <i class="fas" :class="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
              <div class="validation-message">{{ validation }}</div>
            </div>

            <div class="auth-password-rules">
              <p>Password must include:</p>
              <ul>
                <li :class="{ met: hasMinLength }">At least 8 characters</li>
                <li :class="{ met: hasUppercase }">One uppercase letter</li>
                <li :class="{ met: hasLowercase }">One lowercase letter</li>
                <li :class="{ met: hasNumber }">One number</li>
              </ul>
            </div>

            <div class="auth-actions">
              <button type="submit" class="auth-submit-btn" :disabled="isLoading">
                <i class="fas fa-key login-submit-icon"></i>
                <span>{{ isLoading ? 'Updating...' : 'Update Password' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="auth-copyright">
        <p>© 2026 EduMatch. Chose the right path</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

export default {
  name: 'ChangePasswordView',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const form = reactive({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    })
    const validation = ref('')
    const isLoading = ref(false)
    const showCurrentPassword = ref(false)
    const showNewPassword = ref(false)
    const showConfirmPassword = ref(false)

    const error = computed(() => authStore.error)
    const message = computed(() => authStore.message)
    const normalizedNewPassword = computed(() => String(form.newPassword || ''))
    const hasMinLength = computed(() => normalizedNewPassword.value.length >= 8)
    const hasUppercase = computed(() => /[A-Z]/.test(normalizedNewPassword.value))
    const hasLowercase = computed(() => /[a-z]/.test(normalizedNewPassword.value))
    const hasNumber = computed(() => /[0-9]/.test(normalizedNewPassword.value))

    const handleSubmit = async () => {
      validation.value = ''

      if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
        validation.value = 'All password fields are required'
        return
      }

      if (!hasMinLength.value || !hasUppercase.value || !hasLowercase.value || !hasNumber.value) {
        validation.value = 'New password does not meet the password requirements'
        return
      }

      if (form.newPassword !== form.confirmNewPassword) {
        validation.value = 'New password and confirmation password do not match'
        return
      }

      isLoading.value = true
      try {
        await authStore.changePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmNewPassword: form.confirmNewPassword,
        })
        router.push(authStore.getDashboardPath())
      } catch (_error) {
        // Error is handled by the auth store.
      } finally {
        isLoading.value = false
      }
    }

    return {
      form,
      validation,
      isLoading,
      error,
      message,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      handleSubmit,
    }
  },
}
</script>

<style scoped>
@import '/css/auth.css';

.auth-password-rules {
  margin-top: -0.25rem;
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(248, 250, 252, 0.9);
}

.auth-password-rules p {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: #334155;
  font-weight: 600;
}

.auth-password-rules ul {
  margin: 0;
  padding-left: 1.1rem;
  color: #64748b;
}

.auth-password-rules li {
  margin-bottom: 0.2rem;
}

.auth-password-rules li.met {
  color: #166534;
  font-weight: 600;
}
</style>
