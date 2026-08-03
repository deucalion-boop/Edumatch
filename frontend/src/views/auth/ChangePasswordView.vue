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
        <div class="auth-card password-change-card">
          <div class="auth-card-header">
            <div class="password-change-icon" aria-hidden="true">
              <i class="fas fa-shield-halved"></i>
            </div>
            <span class="password-change-eyebrow">Account security</span>
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
            <div class="auth-form-group current-password-group">
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

            <div class="new-password-grid">
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
        router.push({ path: '/auth/login', query: { message: 'Password updated. Please sign in again.' } })
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

.auth-card-wrapper {
  width: min(100%, 720px);
  max-width: 720px;
}

.password-change-card {
  padding: 2rem !important;
  border: 1px solid rgba(105, 170, 71, 0.24) !important;
  border-radius: 24px !important;
  background: rgba(255, 255, 255, 0.97) !important;
  box-shadow: 0 24px 60px rgba(30, 67, 18, 0.13) !important;
}

.password-change-card .auth-card-header {
  display: grid;
  justify-items: center;
  margin-bottom: 1.5rem;
  text-align: center;
}

.password-change-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  margin-bottom: 0.75rem;
  border-radius: 18px;
  background: linear-gradient(135deg, #69aa47, #3f7f2a);
  color: #ffffff;
  font-size: 1.35rem;
  box-shadow: 0 10px 24px rgba(63, 127, 42, 0.25);
}

.password-change-icon i {
  color: #ffffff !important;
}

.password-change-eyebrow {
  margin-bottom: 0.35rem;
  color: #3f7f2a;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.password-change-card .auth-card-title {
  color: #172111 !important;
  font-size: clamp(1.45rem, 4vw, 1.9rem);
  line-height: 1.2;
}

.password-change-card .auth-card-subtitle {
  max-width: 500px;
  margin: 0.55rem auto 0;
  color: #64748b !important;
  line-height: 1.55;
}

.password-change-card .auth-form {
  gap: 1rem;
}

.current-password-group {
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.new-password-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.password-change-card .auth-form-label {
  color: #27331f;
  font-weight: 700;
}

.password-change-card .auth-form-label i {
  width: 1rem;
  color: #69aa47;
  text-align: center;
}

.password-change-card .auth-form-input {
  min-height: 46px;
  border: 1px solid #d8e2d2 !important;
  border-radius: 12px;
  background: #fbfdf9 !important;
}

.password-change-card .auth-form-input:focus {
  border-color: #69aa47 !important;
  background: #ffffff !important;
  box-shadow: 0 0 0 4px rgba(105, 170, 71, 0.14) !important;
}

.password-change-card .password-toggle:hover {
  color: #3f7f2a;
  background: rgba(105, 170, 71, 0.1);
}

.auth-password-rules {
  margin: 0;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  border: 1px solid rgba(105, 170, 71, 0.24);
  background: rgba(105, 170, 71, 0.07);
}

.auth-password-rules p {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: #334155;
  font-weight: 600;
}

.auth-password-rules ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem 1rem;
  margin: 0;
  padding: 0;
  color: #64748b;
  list-style: none;
}

.auth-password-rules li {
  position: relative;
  margin: 0;
  padding-left: 1.35rem;
  font-size: 0.82rem;
}

.auth-password-rules li::before {
  content: '○';
  position: absolute;
  left: 0;
  color: #94a3b8;
  font-weight: 700;
}

.auth-password-rules li.met {
  color: #3f7f2a;
  font-weight: 600;
}

.auth-password-rules li.met::before {
  content: '✓';
  color: #69aa47;
}

.password-change-card .auth-submit-btn {
  min-height: 48px;
  background: linear-gradient(135deg, #69aa47, #3f7f2a) !important;
  border: 1px solid #3f7f2a !important;
  border-radius: 12px;
  box-shadow: 0 10px 22px rgba(63, 127, 42, 0.22);
}

.password-change-card .auth-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5c9f3d, #356d24) !important;
  box-shadow: 0 13px 28px rgba(63, 127, 42, 0.3);
}

.password-change-card .validation-message:not(:empty) {
  margin-top: 0.45rem;
  color: #b42318;
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .password-change-card {
    padding: 1.35rem !important;
    border-radius: 20px !important;
  }

  .new-password-grid,
  .auth-password-rules ul {
    grid-template-columns: 1fr;
  }
}
</style>
