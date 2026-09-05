<template>
  <main class="login-page password-change-page">
    <div class="auth-bg-pattern" aria-hidden="true"></div>
    <div class="auth-floating-elements" aria-hidden="true">
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
          <header class="auth-card-header">
            <div class="password-change-header-row">
              <div class="password-change-icon" aria-hidden="true">
                <i class="fas fa-shield-halved"></i>
              </div>
              <span class="password-change-badge">
                <i class="fas fa-circle-exclamation" aria-hidden="true"></i>
                Required
              </span>
            </div>
            <span class="password-change-eyebrow">Account security</span>
            <h1 class="auth-card-title">Secure your account</h1>
            <p class="auth-card-subtitle">
              Replace your temporary password with one only you know. You’ll sign in again when you’re done.
            </p>
          </header>

          <div v-if="error" class="auth-alert error" role="alert">
            <i class="fas fa-exclamation-circle auth-alert-icon" aria-hidden="true"></i>
            <div>{{ error }}</div>
          </div>

          <div v-if="message" class="auth-alert success" role="status">
            <i class="fas fa-check-circle auth-alert-icon" aria-hidden="true"></i>
            <div>{{ message }}</div>
          </div>

          <form class="auth-form" @submit.prevent="handleSubmit">
            <section class="password-form-section current-password-section" aria-labelledby="current-password-heading">
              <div class="password-section-heading">
                <span class="password-step">1</span>
                <div>
                  <h2 id="current-password-heading">Verify it’s you</h2>
                  <p>Enter the temporary password you used to sign in.</p>
                </div>
              </div>
              <div class="auth-form-group">
                <label class="auth-form-label" for="currentPassword">Temporary password</label>
                <div class="auth-form-input-wrapper">
                  <input
                    id="currentPassword"
                    v-model="form.currentPassword"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    class="auth-form-input"
                    required
                    maxlength="16"
                    autocomplete="current-password"
                    placeholder="Enter your temporary password"
                    :disabled="isLoading"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showCurrentPassword = !showCurrentPassword"
                    :aria-label="showCurrentPassword ? 'Hide password' : 'Show password'"
                    :aria-pressed="showCurrentPassword"
                  >
                    <i class="fas" :class="showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </section>

            <section class="password-form-section" aria-labelledby="new-password-heading">
              <div class="password-section-heading">
                <span class="password-step">2</span>
                <div>
                  <h2 id="new-password-heading">Create a new password</h2>
                  <p>Use 8–16 characters and meet all requirements below.</p>
                </div>
              </div>

              <div class="new-password-grid">
                <div class="auth-form-group">
                  <label class="auth-form-label" for="newPassword">New password</label>
                  <div class="auth-form-input-wrapper">
                    <input
                      id="newPassword"
                      v-model="form.newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      class="auth-form-input"
                      required
                      minlength="8"
                      maxlength="16"
                      autocomplete="new-password"
                      placeholder="Create a new password"
                      aria-describedby="password-requirements password-strength"
                      :aria-invalid="form.newPassword.length > 0 && !meetsPasswordPolicy"
                      :disabled="isLoading"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      @click="showNewPassword = !showNewPassword"
                      :aria-label="showNewPassword ? 'Hide password' : 'Show password'"
                      :aria-pressed="showNewPassword"
                    >
                      <i class="fas" :class="showNewPassword ? 'fa-eye-slash' : 'fa-eye'" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <div class="auth-form-group">
                  <label class="auth-form-label" for="confirmNewPassword">Confirm new password</label>
                  <div class="auth-form-input-wrapper" :class="{ 'input-match': passwordsMatch, 'input-mismatch': passwordsMismatch }">
                    <input
                      id="confirmNewPassword"
                      v-model="form.confirmNewPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="auth-form-input"
                      required
                      minlength="8"
                      maxlength="16"
                      autocomplete="new-password"
                      placeholder="Repeat your new password"
                      aria-describedby="password-match-message"
                      :aria-invalid="passwordsMismatch"
                      :disabled="isLoading"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      @click="showConfirmPassword = !showConfirmPassword"
                      :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                      :aria-pressed="showConfirmPassword"
                    >
                      <i class="fas" :class="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'" aria-hidden="true"></i>
                    </button>
                  </div>
                  <p
                    v-if="form.confirmNewPassword"
                    id="password-match-message"
                    class="password-match-message"
                    :class="passwordsMatch ? 'success' : 'error'"
                    aria-live="polite"
                  >
                    <i class="fas" :class="passwordsMatch ? 'fa-circle-check' : 'fa-circle-xmark'" aria-hidden="true"></i>
                    {{ passwordsMatch ? 'Passwords match' : 'Passwords do not match yet' }}
                  </p>
                </div>
              </div>

              <div id="password-requirements" class="auth-password-rules">
                <div class="password-strength-row">
                  <p>Password strength</p>
                  <span id="password-strength" :class="`strength-${passwordStrength.tone}`">{{ passwordStrength.label }}</span>
                </div>
                <div class="password-strength-track" aria-hidden="true">
                  <span :style="{ width: `${passwordStrength.percent}%` }" :class="`strength-${passwordStrength.tone}`"></span>
                </div>
                <ul>
                  <li :class="{ met: hasMinLength }"><i class="fas" :class="hasMinLength ? 'fa-circle-check' : 'fa-circle'" aria-hidden="true"></i>8–16 characters</li>
                  <li :class="{ met: hasUppercase }"><i class="fas" :class="hasUppercase ? 'fa-circle-check' : 'fa-circle'" aria-hidden="true"></i>One uppercase letter</li>
                  <li :class="{ met: hasLowercase }"><i class="fas" :class="hasLowercase ? 'fa-circle-check' : 'fa-circle'" aria-hidden="true"></i>One lowercase letter</li>
                  <li :class="{ met: hasNumber }"><i class="fas" :class="hasNumber ? 'fa-circle-check' : 'fa-circle'" aria-hidden="true"></i>One number</li>
                </ul>
              </div>
            </section>

            <p v-if="validation" class="form-validation-message" role="alert">
              <i class="fas fa-circle-exclamation" aria-hidden="true"></i>
              {{ validation }}
            </p>

            <div class="auth-actions">
              <button type="submit" class="auth-submit-btn" :disabled="isLoading">
                <i class="fas" :class="isLoading ? 'fa-circle-notch fa-spin' : 'fa-shield-halved'" aria-hidden="true"></i>
                <span>{{ isLoading ? 'Updating...' : 'Update Password' }}</span>
              </button>
              <p class="auth-action-note"><i class="fas fa-lock" aria-hidden="true"></i>Your password is encrypted and never shown to anyone.</p>
            </div>
          </form>
        </div>
      </div>

    </div>
  </main>
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
    const isWithinMaxLength = computed(() => normalizedNewPassword.value.length <= 16)
    const meetsPasswordPolicy = computed(() => (
      hasMinLength.value
      && isWithinMaxLength.value
      && hasUppercase.value
      && hasLowercase.value
      && hasNumber.value
    ))
    const passwordsMatch = computed(() => (
      Boolean(form.confirmNewPassword) && form.newPassword === form.confirmNewPassword
    ))
    const passwordsMismatch = computed(() => (
      Boolean(form.confirmNewPassword) && form.newPassword !== form.confirmNewPassword
    ))
    const passwordStrength = computed(() => {
      if (!form.newPassword) return { label: 'Not started', tone: 'empty', percent: 0 }

      const completedRules = [hasMinLength, hasUppercase, hasLowercase, hasNumber]
        .filter((rule) => rule.value).length
      if (completedRules <= 1) return { label: 'Weak', tone: 'weak', percent: 25 }
      if (completedRules <= 3) return { label: 'Getting stronger', tone: 'medium', percent: 65 }
      return { label: 'Strong', tone: 'strong', percent: 100 }
    })

    const handleSubmit = async () => {
      validation.value = ''

      if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
        validation.value = 'All password fields are required'
        return
      }

      if (!meetsPasswordPolicy.value) {
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
      meetsPasswordPolicy,
      passwordsMatch,
      passwordsMismatch,
      passwordStrength,
      handleSubmit,
    }
  },
}
</script>

<style scoped>
@import '/css/auth.css';

.password-change-page {
  min-height: 100vh;
  background: linear-gradient(145deg, #f8fbf6 0%, #f2f7ee 52%, #edf5e8 100%);
}

.password-change-page .auth-bg-pattern {
  background:
    radial-gradient(circle at 12% 18%, rgba(105, 170, 71, 0.13), transparent 28%),
    radial-gradient(circle at 88% 82%, rgba(63, 127, 42, 0.1), transparent 32%),
    linear-gradient(145deg, #f8fbf6 0%, #f2f7ee 100%);
}

.password-change-page .auth-container { padding-block: 1rem; }
.password-change-page .auth-logo { margin-bottom: 0.65rem; color: #203018; }
.password-change-page .auth-logo-img { height: 36px; }
.password-change-page .auth-card-wrapper { width: min(100%, 700px); max-width: 700px; margin-bottom: 0.65rem; }

.password-change-page .password-change-card {
  overflow: hidden;
  padding: 1.25rem 1.4rem !important;
  border: 1px solid rgba(105, 170, 71, 0.25) !important;
  border-radius: 22px !important;
  background: rgba(255, 255, 255, 0.96) !important;
  box-shadow: 0 20px 50px rgba(31, 70, 18, 0.13) !important;
  backdrop-filter: blur(18px);
}

.password-change-page .password-change-card::before {
  content: none;
}

.password-change-page .password-change-card .auth-card-header {
  display: grid;
  justify-items: center;
  margin-bottom: 0.85rem;
  text-align: center;
}

.password-change-header-row { position: relative; margin-bottom: 0.45rem; }

.password-change-page .password-change-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  margin: 0;
  border: 3px solid #eef7e8;
  border-radius: 15px;
  background: linear-gradient(135deg, #69aa47, #3f7f2a);
  color: #fff;
  font-size: 1.05rem;
  box-shadow: 0 8px 18px rgba(63, 127, 42, 0.22);
}

.password-change-eyebrow {
  margin-bottom: 0.2rem;
  color: #3f7f2a;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.password-change-badge {
  position: absolute;
  top: -6px;
  left: 36px;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.45rem;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.password-change-page .password-change-card .auth-card-title {
  margin: 0;
  color: #172111 !important;
  font-size: clamp(1.4rem, 3vw, 1.7rem);
  line-height: 1.15;
  letter-spacing: -0.035em;
  -webkit-text-fill-color: #172111;
}

.password-change-page .password-change-card .auth-card-subtitle {
  max-width: 520px;
  margin: 0.35rem auto 0;
  font-size: 0.8rem;
  line-height: 1.45;
}

.password-change-page .password-change-card .auth-form { gap: 0.7rem; }

.new-password-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.password-form-section {
  padding: 0.8rem 0.9rem;
  border: 1px solid #e3eadf;
  border-radius: 14px;
  background: #fff;
}

.password-section-heading {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-bottom: 0.55rem;
}

.password-step {
  width: 24px;
  height: 24px;
  display: grid;
  flex: 0 0 24px;
  place-items: center;
  border-radius: 9px;
  background: #edf7e8;
  color: #3f7f2a;
  font-size: 0.7rem;
  font-weight: 800;
}

.password-section-heading h2 { margin: 0; color: #24321d; font-size: 0.9rem; line-height: 1.3; }
.password-section-heading p { margin: 0.1rem 0 0; color: #73806d; font-size: 0.7rem; line-height: 1.35; }

.password-change-page .password-change-card .auth-form-label {
  margin-bottom: 0.25rem;
  color: #3a4933;
  font-size: 0.8rem;
}

.password-change-page .password-change-card .auth-form-input {
  min-height: 42px;
  border: 1px solid #d8e2d2 !important;
  border-radius: 12px;
  background: #fbfdf9 !important;
  color: #1f2a1b;
  font-size: 0.82rem;
}

.password-change-page .password-change-card .auth-form-input::placeholder { color: #9aa695; }
.password-change-page .password-change-card .auth-form-input:focus {
  border-color: #69aa47 !important;
  background: #fff !important;
  box-shadow: 0 0 0 4px rgba(105, 170, 71, 0.14) !important;
}
.password-change-page .password-change-card .input-match .auth-form-input { border-color: #69aa47 !important; }
.password-change-page .password-change-card .input-mismatch .auth-form-input { border-color: #ef9a91 !important; background: #fffafa !important; }

.password-change-page .password-toggle { right: 0.7rem; width: 34px; height: 34px; }
.password-change-page .password-toggle:hover { color: #3f7f2a; background: rgba(105, 170, 71, 0.1); }
.password-change-page .password-toggle:focus-visible { outline: 2px solid #69aa47; outline-offset: 2px; }

.password-match-message {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 1.1rem;
  margin: 0.25rem 0 0;
  font-size: 0.68rem;
  font-weight: 700;
}

.password-match-message.success { color: #3f7f2a; }
.password-match-message.error { color: #b42318; }

.password-change-page .auth-password-rules {
  margin-top: 0.6rem;
  padding: 0.65rem 0.75rem;
  border-color: #dfe9d9;
  background: #f8fbf6;
}

.password-change-page .auth-password-rules ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem 0.75rem;
  margin: 0;
  padding: 0;
  color: #64748b;
  list-style: none;
}

.password-strength-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.password-strength-row p,
.password-strength-row span { margin: 0; font-size: 0.76rem; font-weight: 800; }
.password-strength-row p { color: #405039; }
.password-strength-row .strength-empty { color: #899384; }
.password-strength-row .strength-weak { color: #b42318; }
.password-strength-row .strength-medium { color: #a15c07; }
.password-strength-row .strength-strong { color: #3f7f2a; }

.password-strength-track {
  height: 5px;
  overflow: hidden;
  margin: 0.35rem 0 0.5rem;
  border-radius: 999px;
  background: #e5ebe2;
}

.password-strength-track span { display: block; height: 100%; border-radius: inherit; transition: width 0.25s ease, background-color 0.25s ease; }
.password-strength-track .strength-weak { background: #d85b51; }
.password-strength-track .strength-medium { background: #d79638; }
.password-strength-track .strength-strong { background: #69aa47; }

.password-change-page .auth-password-rules li {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding-left: 0;
  font-size: 0.68rem;
  transition: color 0.2s ease;
}

.password-change-page .auth-password-rules li::before { content: none; }
.password-change-page .auth-password-rules li i { width: 0.9rem; font-size: 0.7rem; }
.password-change-page .auth-password-rules li.met { color: #3f7f2a; font-weight: 600; }

.form-validation-message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 0.9rem;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff7f7;
  color: #b42318;
  font-size: 0.8rem;
  font-weight: 650;
}

.password-change-page .password-change-card .auth-submit-btn {
  min-height: 44px;
  border: 1px solid #3f7f2a !important;
  border-radius: 14px;
  background: linear-gradient(135deg, #69aa47, #3f7f2a) !important;
  box-shadow: 0 10px 22px rgba(63, 127, 42, 0.22);
}
.password-change-page .password-change-card .auth-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5c9f3d, #356d24) !important;
  box-shadow: 0 13px 28px rgba(63, 127, 42, 0.3);
}
.password-change-page .password-change-card .auth-submit-btn:focus-visible { outline: 3px solid rgba(105, 170, 71, 0.35); outline-offset: 3px; }
.password-change-page .password-change-card .auth-submit-btn:disabled { cursor: wait; opacity: 0.7; }

.auth-action-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.35rem 0 0;
  color: #7b8775;
  font-size: 0.72rem;
  text-align: center;
}

@media (min-width: 641px) {
  .password-change-page { height: 100dvh; overflow: hidden; }
  .password-change-page .auth-container { height: 100%; min-height: 0; }
  .current-password-section {
    display: grid;
    grid-template-columns: minmax(190px, 0.75fr) minmax(280px, 1.25fr);
    align-items: end;
    gap: 1rem;
  }
  .current-password-section .password-section-heading { margin-bottom: 0.15rem; }
}

@media (max-width: 640px) {
  .password-change-page .auth-container { justify-content: flex-start; padding: 1.25rem 0.75rem; }
  .password-change-page .auth-logo { margin-bottom: 1rem; }
  .password-change-page .password-change-card { padding: 1.3rem 1rem !important; border-radius: 22px !important; }
  .password-change-page .password-change-card .auth-card-header { margin-bottom: 1.25rem; }
  .password-change-page .password-change-card .auth-card-subtitle { max-width: 330px; }
  .password-form-section { padding: 1rem; }
  .new-password-grid,
  .password-change-page .auth-password-rules ul { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .password-strength-track span,
  .password-change-page .password-change-card .auth-submit-btn { transition: none; }
}
</style>
