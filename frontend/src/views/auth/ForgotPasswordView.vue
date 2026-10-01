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
            <RouterLink to="/auth/login"><i class="fas fa-arrow-left return-arrow-icon"></i> Return to sign in</RouterLink>
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
@reference "../../styles/tailwind.css";

@import '../../styles/auth.tailwind.css';

.forgot-password-page {
  @apply tw:[background:radial-gradient(circle_at_15%_15%,_rgba(105,_170,_71,_0.1),_transparent_34%),_____#ffffff];
}

.forgot-password-page .auth-floating-element,
.forgot-password-page .auth-floating-element:nth-child(2),
.forgot-password-page .auth-floating-element:nth-child(3) {
  @apply tw:[background:linear-gradient(135deg,_#69aa47,_#3f7f2a)];
}

.forgot-password-page .auth-card-wrapper {
  @apply tw:[width:min(100%,_480px)];
}

.forgot-password-card {
  @apply tw:relative;
  @apply tw:overflow-hidden;
  @apply tw:[padding:2.25rem];
  @apply tw:[border:2px_solid_transparent]!;
  @apply tw:[border-radius:26px];
  @apply tw:[background:linear-gradient(rgba(255,_255,_255,_0.94),_rgba(255,_255,_255,_0.94))_padding-box,_____linear-gradient(135deg,_#1e4307,_#ffd542_42%,_#bbff59)_border-box]!;
  @apply tw:[box-shadow:0_28px_70px_rgba(63,_127,_42,_0.17)];
  @apply tw:[backdrop-filter:blur(16px)];
}

.forgot-password-card .auth-card-header {
  @apply tw:[margin-bottom:1.75rem];
  @apply tw:text-center;
}

.forgot-password-card .auth-card-title {
  @apply tw:[margin-bottom:0.55rem];
  @apply tw:[color:#3f7f2a];
  @apply tw:[font-size:clamp(1.7rem,_5vw,_2.1rem)];
  @apply tw:[letter-spacing:-0.03em];
}

.forgot-password-card .auth-card-subtitle {
  @apply tw:[max-width:360px];
  @apply tw:[margin-inline:auto];
  @apply tw:[color:#64748b];
  @apply tw:[line-height:1.65];
}

.forgot-password-card .auth-form-label {
  @apply tw:[color:#3f7f2a];
  @apply tw:[font-weight:700];
}

.forgot-password-card .auth-form-label > i {
  @apply tw:hidden;
}

.forgot-password-card .auth-form-input-wrapper {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f8fafc];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease,_background_0.2s_ease];
}

.forgot-password-card .auth-form-input-wrapper:focus-within {
  @apply tw:[border-color:#69aa47];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_0_0_4px_rgba(105,_170,_71,_0.16)];
}

.forgot-password-card .auth-form-icon {
  @apply tw:[color:#69aa47];
}

.forgot-password-card .auth-submit-btn {
  @apply tw:[min-height:52px];
  @apply tw:[border:1px_solid_#3f7f2a]!;
  @apply tw:[border-radius:14px];
  @apply tw:[background:linear-gradient(135deg,_#69aa47,_#3f7f2a)]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_12px_25px_rgba(63,_127,_42,_0.26)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease];
}

.forgot-password-card .auth-submit-btn:not(:disabled):hover {
  @apply tw:[border-color:#3f7f2a]!;
  @apply tw:[background:linear-gradient(135deg,_#3f7f2a,_#69aa47)]!;
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[box-shadow:0_16px_30px_rgba(63,_127,_42,_0.32)];
}

.forgot-password-card .auth-submit-btn:focus-visible {
  @apply tw:[outline:3px_solid_rgba(105,_170,_71,_0.34)];
  @apply tw:[outline-offset:3px];
}

.forgot-password-card .auth-submit-btn:disabled {
  @apply tw:cursor-not-allowed;
  @apply tw:[opacity:0.65];
  @apply tw:[box-shadow:none];
}

.forgot-password-card .auth-footer {
  @apply tw:[margin-top:1.5rem];
  @apply tw:[padding-top:1.25rem];
  @apply tw:[border-top:1px_solid_#e2e8f0];
  @apply tw:text-center;
}

.forgot-password-card .auth-footer a {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[color:#3f7f2a];
  @apply tw:[font-weight:700];
}

.forgot-password-card .auth-footer .return-arrow-icon {
  @apply tw:[color:#3f7f2a]!;
}

.forgot-password-card .auth-footer a:hover {
  @apply tw:[color:#69aa47];
}

.forgot-password-card .auth-footer a::after {
  @apply tw:[background:#69aa47];
}

@media (max-width: 520px) {
  .forgot-password-page .auth-card-wrapper {
    @apply tw:[width:min(100%,_360px)];
  }

  .forgot-password-card {
    @apply tw:[padding:1.2rem_1rem];
    @apply tw:[border-radius:18px];
  }

  .forgot-password-card .auth-card-header {
    @apply tw:[margin-bottom:0.9rem];
  }

  .forgot-password-card .auth-card-title {
    @apply tw:[margin-bottom:0.3rem];
    @apply tw:[font-size:1.4rem];
  }

  .forgot-password-card .auth-card-subtitle {
    @apply tw:[max-width:290px];
    @apply tw:[font-size:0.78rem];
    @apply tw:[line-height:1.4];
  }

  .forgot-password-card .auth-form {
    @apply tw:[gap:0.7rem];
  }

  .forgot-password-card .auth-form-label {
    @apply tw:[margin-bottom:0.35rem];
    @apply tw:[font-size:0.78rem];
  }

  .forgot-password-card .auth-form-input {
    @apply tw:[min-height:42px];
    @apply tw:[padding-block:0.6rem];
    @apply tw:[font-size:0.8rem];
  }

  .forgot-password-card .auth-actions {
    @apply tw:[margin-top:0.55rem];
  }

  .forgot-password-card .auth-submit-btn {
    @apply tw:[min-height:44px];
    @apply tw:[padding:0.65rem];
    @apply tw:[border-radius:11px];
    @apply tw:[font-size:0.8rem];
  }

  .forgot-password-card .auth-footer {
    @apply tw:[margin-top:0.9rem];
    @apply tw:[padding-top:0.75rem];
  }

  .forgot-password-card .auth-footer a {
    @apply tw:[gap:0.4rem];
    @apply tw:[font-size:0.8rem];
  }
}

</style>
