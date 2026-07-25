<template>
  <div class="login-page forgot-password-page">
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
        <div class="auth-card forgot-password-card">
          <div class="auth-card-header">
            <h1 class="auth-card-title">Forgot Password</h1>
            <p class="auth-card-subtitle">
              No worries. Enter your email and we’ll send you a secure reset link.
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
            <RouterLink to="/auth/login"><i class="fas fa-arrow-left"></i> Return to sign in</RouterLink>
          </div>
        </div>
      </div>

      <div class="auth-copyright">
        <p>© 2026 EduMatch. Choose the right path</p>
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

.forgot-password-page {
  background: #ffffff;
}

.forgot-password-page .auth-card-wrapper {
  width: min(100%, 480px);
}

.forgot-password-card {
  position: relative;
  overflow: hidden;
  padding: 2.25rem;
  border: 1px solid rgba(134, 239, 172, 0.78);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 28px 70px rgba(20, 83, 45, 0.16);
  backdrop-filter: blur(16px);
}

.forgot-password-card .auth-card-header {
  margin-bottom: 1.75rem;
  text-align: center;
}

.forgot-password-card .auth-card-title {
  margin-bottom: 0.55rem;
  color: #14532d;
  font-size: clamp(1.7rem, 5vw, 2.1rem);
  letter-spacing: -0.03em;
}

.forgot-password-card .auth-card-subtitle {
  max-width: 360px;
  margin-inline: auto;
  color: #64748b;
  line-height: 1.65;
}

.forgot-password-card .auth-form-label {
  color: #166534;
  font-weight: 700;
}

.forgot-password-card .auth-form-label > i {
  display: none;
}

.forgot-password-card .auth-form-input-wrapper {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #f8fafc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.forgot-password-card .auth-form-input-wrapper:focus-within {
  border-color: #22c55e;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.13);
}

.forgot-password-card .auth-form-icon {
  color: #16a34a;
}

.forgot-password-card .auth-submit-btn {
  min-height: 52px;
  border: 1px solid #15803d !important;
  border-radius: 14px;
  background: #16a34a !important;
  background-image: none !important;
  color: #ffffff !important;
  box-shadow: 0 12px 25px rgba(21, 128, 61, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.forgot-password-card .auth-submit-btn:not(:disabled):hover {
  border-color: #166534 !important;
  background: #15803d !important;
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(21, 128, 61, 0.32);
}

.forgot-password-card .auth-submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  box-shadow: none;
}

.forgot-password-card .auth-footer {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.forgot-password-card .auth-footer a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #15803d;
  font-weight: 700;
}

@media (max-width: 520px) {
  .forgot-password-card {
    padding: 1.65rem 1.25rem;
    border-radius: 22px;
  }

}
</style>
