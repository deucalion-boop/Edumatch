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
            <h1 class="auth-card-title">Forgot Password</h1>
            <p class="auth-card-subtitle">
              Enter your email address and we will send you a reset link.
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
              <label class="auth-form-label" for="email">
                <i class="fas fa-envelope"></i> Email Address
              </label>
              <div class="auth-form-input-wrapper has-icon">
                <i class="auth-form-icon fas fa-envelope"></i>
                <input
                  type="email"
                  id="email"
                  v-model="email"
                  class="auth-form-input"
                  placeholder="Enter your email address"
                  required
                  autocomplete="email"
                />
              </div>
              <div class="validation-message" id="emailValidation">{{ validation }}</div>
            </div>

            <div class="auth-actions">
              <button type="submit" class="auth-submit-btn" :disabled="isLoading">
                <i class="fas fa-paper-plane login-submit-icon"></i>
                <span>{{ isLoading ? 'Sending...' : 'Send Reset Link' }}</span>
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
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth.js'

export default {
  name: 'ForgotPasswordView',
  setup() {
    const authStore = useAuthStore()
    const email = ref('')
    const isLoading = ref(false)
    const validation = ref('')
    const successMessage = ref('')

    const error = computed(() => authStore.error)
    const message = computed(() => successMessage.value || authStore.message)

    const handleSubmit = async () => {
      validation.value = ''
      successMessage.value = ''

      if (!email.value) {
        validation.value = 'Email is required'
        return
      }

      isLoading.value = true
      try {
        await authStore.requestPasswordReset({ email: email.value })
        successMessage.value = 'If the email exists, a reset link has been sent.'
      } catch (_error) {
        // Error handled by store
      } finally {
        isLoading.value = false
      }
    }

    return {
      email,
      isLoading,
      validation,
      error,
      message,
      handleSubmit,
    }
  },
}
</script>

<style scoped>
@import '/css/auth.css';
</style>
