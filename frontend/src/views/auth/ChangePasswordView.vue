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
@reference "../../styles/tailwind.css";

@import '../../styles/auth.tailwind.css';

.password-change-page {
  @apply tw:min-h-screen;
  @apply tw:[background:linear-gradient(145deg,_#f8fbf6_0%,_#f2f7ee_52%,_#edf5e8_100%)];
}

.password-change-page .auth-bg-pattern {
  @apply tw:[background:radial-gradient(circle_at_12%_18%,_rgba(105,_170,_71,_0.13),_transparent_28%),_____radial-gradient(circle_at_88%_82%,_rgba(63,_127,_42,_0.1),_transparent_32%),_____linear-gradient(145deg,_#f8fbf6_0%,_#f2f7ee_100%)];
}

.password-change-page .auth-container { @apply tw:[padding-block:1rem]; }
.password-change-page .auth-logo { @apply tw:[margin-bottom:0.65rem]; @apply tw:[color:#203018]; }
.password-change-page .auth-logo-img { @apply tw:[height:36px]; }
.password-change-page .auth-card-wrapper { @apply tw:[width:min(100%,_700px)]; @apply tw:[max-width:700px]; @apply tw:[margin-bottom:0.65rem]; }

.password-change-page .password-change-card {
  @apply tw:overflow-hidden;
  @apply tw:[padding:1.25rem_1.4rem]!;
  @apply tw:[border:1px_solid_rgba(105,_170,_71,_0.25)]!;
  @apply tw:[border-radius:22px]!;
  @apply tw:[background:rgba(255,_255,_255,_0.96)]!;
  @apply tw:[box-shadow:0_20px_50px_rgba(31,_70,_18,_0.13)]!;
  @apply tw:[backdrop-filter:blur(18px)];
}

.password-change-page .password-change-card::before {
  @apply tw:[content:none];
}

.password-change-page .password-change-card .auth-card-header {
  @apply tw:grid;
  @apply tw:justify-items-center;
  @apply tw:[margin-bottom:0.85rem];
  @apply tw:text-center;
}

.password-change-header-row { @apply tw:relative; @apply tw:[margin-bottom:0.45rem]; }

.password-change-page .password-change-icon {
  @apply tw:[width:46px];
  @apply tw:[height:46px];
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:[margin:0];
  @apply tw:[border:3px_solid_#eef7e8];
  @apply tw:[border-radius:15px];
  @apply tw:[background:linear-gradient(135deg,_#69aa47,_#3f7f2a)];
  @apply tw:[color:#fff];
  @apply tw:[font-size:1.05rem];
  @apply tw:[box-shadow:0_8px_18px_rgba(63,_127,_42,_0.22)];
}

.password-change-eyebrow {
  @apply tw:[margin-bottom:0.2rem];
  @apply tw:[color:#3f7f2a];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.13em];
  @apply tw:uppercase;
}

.password-change-badge {
  @apply tw:absolute;
  @apply tw:[top:-6px];
  @apply tw:[left:36px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.3rem];
  @apply tw:[padding:0.2rem_0.45rem];
  @apply tw:[border:2px_solid_#fff];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#9a3412];
  @apply tw:[font-size:0.6rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.03em];
}

.password-change-page .password-change-card .auth-card-title {
  @apply tw:[margin:0];
  @apply tw:[color:#172111]!;
  @apply tw:[font-size:clamp(1.4rem,_3vw,_1.7rem)];
  @apply tw:[line-height:1.15];
  @apply tw:[letter-spacing:-0.035em];
  @apply tw:[-webkit-text-fill-color:#172111];
}

.password-change-page .password-change-card .auth-card-subtitle {
  @apply tw:[max-width:520px];
  @apply tw:[margin:0.35rem_auto_0];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.45];
}

.password-change-page .password-change-card .auth-form { @apply tw:[gap:0.7rem]; }

.new-password-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
}

.password-form-section {
  @apply tw:[padding:0.8rem_0.9rem];
  @apply tw:[border:1px_solid_#e3eadf];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#fff];
}

.password-section-heading {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.6rem];
  @apply tw:[margin-bottom:0.55rem];
}

.password-step {
  @apply tw:[width:24px];
  @apply tw:[height:24px];
  @apply tw:grid;
  @apply tw:[flex:0_0_24px];
  @apply tw:place-items-center;
  @apply tw:[border-radius:9px];
  @apply tw:[background:#edf7e8];
  @apply tw:[color:#3f7f2a];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
}

.password-section-heading h2 { @apply tw:[margin:0]; @apply tw:[color:#24321d]; @apply tw:[font-size:0.9rem]; @apply tw:[line-height:1.3]; }
.password-section-heading p { @apply tw:[margin:0.1rem_0_0]; @apply tw:[color:#73806d]; @apply tw:[font-size:0.7rem]; @apply tw:[line-height:1.35]; }

.password-change-page .password-change-card .auth-form-label {
  @apply tw:[margin-bottom:0.25rem];
  @apply tw:[color:#3a4933];
  @apply tw:[font-size:0.8rem];
}

.password-change-page .password-change-card .auth-form-input {
  @apply tw:[min-height:42px];
  @apply tw:[border:1px_solid_#d8e2d2]!;
  @apply tw:[border-radius:12px];
  @apply tw:[background:#fbfdf9]!;
  @apply tw:[color:#1f2a1b];
  @apply tw:[font-size:0.82rem];
}

.password-change-page .password-change-card .auth-form-input::placeholder { @apply tw:[color:#9aa695]; }
.password-change-page .password-change-card .auth-form-input:focus {
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[background:#fff]!;
  @apply tw:[box-shadow:0_0_0_4px_rgba(105,_170,_71,_0.14)]!;
}
.password-change-page .password-change-card .input-match .auth-form-input { @apply tw:[border-color:#69aa47]!; }
.password-change-page .password-change-card .input-mismatch .auth-form-input { @apply tw:[border-color:#ef9a91]!; @apply tw:[background:#fffafa]!; }

.password-change-page .password-toggle { @apply tw:[right:0.7rem]; @apply tw:[width:34px]; @apply tw:[height:34px]; }
.password-change-page .password-toggle:hover { @apply tw:[color:#3f7f2a]; @apply tw:[background:rgba(105,_170,_71,_0.1)]; }
.password-change-page .password-toggle:focus-visible { @apply tw:[outline:2px_solid_#69aa47]; @apply tw:[outline-offset:2px]; }

.password-match-message {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
  @apply tw:[min-height:1.1rem];
  @apply tw:[margin:0.25rem_0_0];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:700];
}

.password-match-message.success { @apply tw:[color:#3f7f2a]; }
.password-match-message.error { @apply tw:[color:#b42318]; }

.password-change-page .auth-password-rules {
  @apply tw:[margin-top:0.6rem];
  @apply tw:[padding:0.65rem_0.75rem];
  @apply tw:[border-color:#dfe9d9];
  @apply tw:[background:#f8fbf6];
}

.password-change-page .auth-password-rules ul {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.25rem_0.75rem];
  @apply tw:[margin:0];
  @apply tw:[padding:0];
  @apply tw:[color:#64748b];
  @apply tw:[list-style:none];
}

.password-strength-row { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:1rem]; }
.password-strength-row p,
.password-strength-row span { @apply tw:[margin:0]; @apply tw:[font-size:0.76rem]; @apply tw:[font-weight:800]; }
.password-strength-row p { @apply tw:[color:#405039]; }
.password-strength-row .strength-empty { @apply tw:[color:#899384]; }
.password-strength-row .strength-weak { @apply tw:[color:#b42318]; }
.password-strength-row .strength-medium { @apply tw:[color:#a15c07]; }
.password-strength-row .strength-strong { @apply tw:[color:#3f7f2a]; }

.password-strength-track {
  @apply tw:[height:5px];
  @apply tw:overflow-hidden;
  @apply tw:[margin:0.35rem_0_0.5rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e5ebe2];
}

.password-strength-track span { @apply tw:block; @apply tw:h-full; @apply tw:[border-radius:inherit]; @apply tw:[transition:width_0.25s_ease,_background-color_0.25s_ease]; }
.password-strength-track .strength-weak { @apply tw:[background:#d85b51]; }
.password-strength-track .strength-medium { @apply tw:[background:#d79638]; }
.password-strength-track .strength-strong { @apply tw:[background:#69aa47]; }

.password-change-page .auth-password-rules li {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding-left:0];
  @apply tw:[font-size:0.68rem];
  @apply tw:[transition:color_0.2s_ease];
}

.password-change-page .auth-password-rules li::before { @apply tw:[content:none]; }
.password-change-page .auth-password-rules li i { @apply tw:[width:0.9rem]; @apply tw:[font-size:0.7rem]; }
.password-change-page .auth-password-rules li.met { @apply tw:[color:#3f7f2a]; @apply tw:[font-weight:600]; }

.form-validation-message {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.5rem];
  @apply tw:[margin:0];
  @apply tw:[padding:0.75rem_0.9rem];
  @apply tw:[border:1px_solid_#fecaca];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#fff7f7];
  @apply tw:[color:#b42318];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:650];
}

.password-change-page .password-change-card .auth-submit-btn {
  @apply tw:[min-height:44px];
  @apply tw:[border:1px_solid_#3f7f2a]!;
  @apply tw:[border-radius:14px];
  @apply tw:[background:linear-gradient(135deg,_#69aa47,_#3f7f2a)]!;
  @apply tw:[box-shadow:0_10px_22px_rgba(63,_127,_42,_0.22)];
}
.password-change-page .password-change-card .auth-submit-btn:hover:not(:disabled) {
  @apply tw:[background:linear-gradient(135deg,_#5c9f3d,_#356d24)]!;
  @apply tw:[box-shadow:0_13px_28px_rgba(63,_127,_42,_0.3)];
}
.password-change-page .password-change-card .auth-submit-btn:focus-visible { @apply tw:[outline:3px_solid_rgba(105,_170,_71,_0.35)]; @apply tw:[outline-offset:3px]; }
.password-change-page .password-change-card .auth-submit-btn:disabled { @apply tw:cursor-wait; @apply tw:[opacity:0.7]; }

.auth-action-note {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#7b8775];
  @apply tw:[font-size:0.72rem];
  @apply tw:text-center;
}

@media (min-width: 641px) {
  .password-change-page { @apply tw:[height:100dvh]; @apply tw:overflow-hidden; }
  .password-change-page .auth-container { @apply tw:h-full; @apply tw:[min-height:0]; }
  .current-password-section {
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(190px,_0.75fr)_minmax(280px,_1.25fr)];
    @apply tw:[align-items:end];
    @apply tw:[gap:1rem];
  }
  .current-password-section .password-section-heading { @apply tw:[margin-bottom:0.15rem]; }
}

@media (max-width: 640px) {
  .password-change-page .auth-container { @apply tw:justify-start; @apply tw:[padding:1.25rem_0.75rem]; }
  .password-change-page .auth-logo { @apply tw:[margin-bottom:1rem]; }
  .password-change-page .password-change-card { @apply tw:[padding:1.3rem_1rem]!; @apply tw:[border-radius:22px]!; }
  .password-change-page .password-change-card .auth-card-header { @apply tw:[margin-bottom:1.25rem]; }
  .password-change-page .password-change-card .auth-card-subtitle { @apply tw:[max-width:330px]; }
  .password-form-section { @apply tw:[padding:1rem]; }
  .new-password-grid,
  .password-change-page .auth-password-rules ul { @apply tw:[grid-template-columns:1fr]; }
}

@media (prefers-reduced-motion: reduce) {
  .password-strength-track span,
  .password-change-page .password-change-card .auth-submit-btn { @apply tw:[transition:none]; }
}

</style>
