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
            <h1 class="auth-card-title">Reset Password</h1>
            <p class="auth-card-subtitle">
              Choose a new password for your account.
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
              <label class="auth-form-label" for="password">
                <i class="fas fa-lock"></i> New Password
              </label>
              <div class="auth-form-input-wrapper">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  v-model="password"
                  class="auth-form-input"
                  required
                  minlength="8"
                  maxlength="16"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="confirmPassword">
                <i class="fas fa-lock"></i> Confirm Password
              </label>
              <div class="auth-form-input-wrapper">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="confirmPassword"
                  v-model="confirmPassword"
                  class="auth-form-input"
                  required
                  minlength="8"
                  maxlength="16"
                  autocomplete="new-password"
                />
              </div>
              <div class="validation-message" id="passwordValidation">{{ validation }}</div>
            </div>

            <div class="auth-actions">
              <button type="submit" class="auth-submit-btn" :disabled="isLoading || !tokenValid">
                <i class="fas fa-key login-submit-icon"></i>
                <span>{{ isLoading ? 'Updating...' : 'Update Password' }}</span>
              </button>
            </div>
          </form>

          <div class="auth-footer">
            <RouterLink to="/auth/login">Return to sign in</RouterLink>
          </div>
        </div>
      </div>

      <div class="auth-copyright">
        <p>© 2026 EduMatch. Chose the right path</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 16

export default {
  name: 'ResetPasswordView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const password = ref('')
    const confirmPassword = ref('')
    const validation = ref('')
    const showPassword = ref(false)
    const isLoading = ref(false)
    const tokenValid = ref(true)
    const successMessage = ref('')

    const error = computed(() => authStore.error)
    const message = computed(() => successMessage.value || authStore.message)

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    const validateToken = async () => {
      const token = String(route.params.token || '').trim()
      if (!token) {
        tokenValid.value = false
        return
      }

      try {
        await authStore.validatePasswordReset({ token })
        tokenValid.value = true
      } catch (_error) {
        tokenValid.value = false
      }
    }

    const handleSubmit = async () => {
      validation.value = ''
      successMessage.value = ''

      if (!password.value || !confirmPassword.value) {
        validation.value = 'Password is required'
        return
      }

      if (password.value !== confirmPassword.value) {
        validation.value = 'Passwords do not match'
        return
      }

      if (password.value.length < PASSWORD_MIN_LENGTH || password.value.length > PASSWORD_MAX_LENGTH) {
        validation.value = `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`
        return
      }

      const token = String(route.params.token || '').trim()
      if (!token) {
        validation.value = 'Reset token is missing'
        return
      }

      isLoading.value = true
      try {
        await authStore.completePasswordReset({ token, password: password.value })
        successMessage.value = 'Password updated. You can now sign in.'
        setTimeout(() => {
          router.push('/auth/login')
        }, 800)
      } catch (_error) {
        // Error handled by store
      } finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      validateToken()
    })

    return {
      password,
      confirmPassword,
      validation,
      showPassword,
      isLoading,
      tokenValid,
      error,
      message,
      togglePasswordVisibility,
      handleSubmit,
    }
  },
}
</script>

<style scoped>
@import '/css/auth.css';
</style>
