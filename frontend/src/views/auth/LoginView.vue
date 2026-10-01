<template>
  <div class="login-page">
    <!-- Background Elements -->
    <div class="auth-bg-pattern"></div>
    <div class="auth-floating-elements">
      <div class="auth-floating-element"></div>
      <div class="auth-floating-element"></div>
      <div class="auth-floating-element"></div>
    </div>

    <div class="auth-container">
      <div class="login-layout">
        <section class="login-form-panel">
          <div class="login-panel-geometry" aria-hidden="true">
            <span class="login-panel-shape login-panel-shape--rectangle"></span>
            <span class="login-panel-shape login-panel-shape--polygon"></span>
            <span class="login-panel-shape login-panel-shape--small"></span>
            <span class="login-panel-accent login-panel-accent--top"></span>
            <span class="login-panel-accent login-panel-accent--bottom"></span>
          </div>
          <div class="login-form-shell">
      <!-- Login Card -->
      <div class="auth-card-wrapper">
        <div class="auth-card-container">
        <div class="auth-card">
          <div class="auth-card-header">
            <span class="auth-card-badge">
              <i class="fas" :class="isInviteMode ? 'fa-user-check' : 'fa-shield-alt'"></i>
              {{ isInviteMode ? 'Account Activation' : 'Secure Sign In' }}
            </span>
            <h1 class="auth-card-title">{{ isInviteMode ? 'Activate your account' : 'Sign In' }}</h1>
            <p class="auth-card-subtitle">
              {{ isInviteMode ? 'Create your password to complete setup and access EduMatch.' : 'Use your assigned EduMatch username and password to access your dashboard.' }}
            </p>
          </div>

          <!-- Alert Messages -->
          <div v-if="error" class="auth-alert error">
            <i class="fas fa-exclamation-circle auth-alert-icon"></i>
            <div>{{ error }}</div>
          </div>

          <div v-if="message" class="auth-alert success">
            <i class="fas fa-check-circle auth-alert-icon"></i>
            <div>{{ message }}</div>
          </div>

          <form v-if="!isInviteMode" class="auth-form" @submit.prevent="handleSubmit">
            <div class="auth-form-section-label">
              {{ otpRequired ? 'Two-factor verification' : 'Account details' }}
            </div>

            <div v-if="!otpRequired" class="auth-form-group">
              <label class="auth-form-label" for="username">
                <i class="fas fa-user"></i> Username
              </label>
              <div class="auth-form-input-wrapper has-icon">
                <i class="auth-form-icon fas fa-at"></i>
                <input
                  type="text"
                  id="username"
                  v-model="form.username"
                  class="auth-form-input"
                  placeholder="Enter your username"
                  required
                  autocomplete="username"
                  @blur="validateUsername"
                  @input="clearValidation('username')"
                />
              </div>
              <div class="validation-message" id="usernameValidation">{{ validation.username }}</div>
            </div>

            <div v-if="!otpRequired" class="auth-form-group">
              <label class="auth-form-label" for="password">
                <i class="fas fa-lock"></i> Password
              </label>
              <div class="auth-form-input-wrapper">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  v-model="form.password"
                  class="auth-form-input"
                  placeholder="Enter your password"
                  required
                  minlength="8"
                  maxlength="16"
                  autocomplete="current-password"
                  @blur="validatePassword"
                  @input="clearValidation('password')"
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
              <div class="validation-message" id="passwordValidation">{{ validation.password }}</div>
            </div>

            <div v-if="otpRequired" class="auth-form-group">
              <label class="auth-form-label" for="otpCode">
                <i class="fas fa-mobile-screen-button"></i> Verify OTP
              </label>
              <p class="auth-form-helper">
                Enter the 6-digit one-time password sent to {{ otpDeliveryHint || 'your registered email address' }}.
              </p>
              <div class="auth-form-input-wrapper has-icon">
                <i class="auth-form-icon fas fa-shield-halved"></i>
                <input
                  id="otpCode"
                  v-model.trim="form.otpCode"
                  class="auth-form-input"
                  placeholder="6-digit OTP"
                  required
                  maxlength="6"
                  inputmode="numeric"
                  pattern="[0-9]{6}"
                  autocomplete="one-time-code"
                  @input="clearValidation('otp')"
                />
              </div>
              <div class="otp-status-row" aria-live="polite">
                <span class="otp-expiry" :class="{ 'otp-expiry--expired': otpSecondsRemaining === 0 }">
                  {{ otpSecondsRemaining > 0 ? `OTP expires in ${otpSecondsRemaining}s` : 'OTP expired' }}
                </span>
                <span class="otp-resend-prompt">
                  <span>Didn’t receive the code?</span>
                  <button
                    type="button"
                    class="otp-resend-button"
                    :disabled="isLoading || isResendingOtp || otpResendSecondsRemaining > 0"
                    @click="handleResendOtp"
                  >
                    {{ isResendingOtp ? 'Sending…' : otpResendSecondsRemaining > 0 ? `Resend in ${otpResendSecondsRemaining}s` : 'Resend OTP' }}
                  </button>
                </span>
              </div>
              <div class="validation-message">{{ validation.otp }}</div>
            </div>

            <div class="auth-form-group captcha-group">
              <div class="auth-form-group-heading">
                <label class="auth-form-label" for="captchaValidation">
                  <i class="fas fa-shield-alt"></i> Security verification
                </label>
                <p class="auth-form-helper">Complete the check below before signing in.</p>
              </div>
              <div ref="recaptchaContainer" class="recaptcha-widget"></div>
              <div v-if="captchaMessage" class="validation-message" id="captchaValidation">{{ captchaMessage }}</div>
            </div>

            <div v-if="!otpRequired" class="auth-options">
              <label class="remember-me">
                <input type="checkbox" v-model="form.remember" />
                <span>Keep me signed in on this device</span>
              </label>
            </div>

            <div class="auth-actions">
              <button type="submit" class="auth-submit-btn" :disabled="isLoading" id="submitBtn">
                <i class="fas login-submit-icon" :class="otpRequired ? 'fa-shield-halved' : 'fa-sign-in-alt'"></i>
                <span>{{ isLoading ? (otpRequired ? 'Verifying...' : 'Signing In...') : (otpRequired ? 'Verify OTP' : 'Sign In') }}</span>
              </button>
              <RouterLink v-if="!otpRequired" to="/auth/forgot-password" class="forgot-password forgot-password--below-submit">
                Forgot password
              </RouterLink>
              <button v-if="otpRequired" type="button" class="auth-submit-btn auth-submit-btn--secondary" :disabled="isLoading" @click="backToCredentials">
                <i class="fas fa-arrow-left login-submit-icon"></i>
                <span>Back to sign in</span>
              </button>
            </div>
          </form>

          <form v-else class="auth-form" @submit.prevent="handleInviteSubmit">
            <div class="auth-form-group">
              <label class="auth-form-label">Invited Email</label>
              <div class="auth-form-input-wrapper has-icon">
                <i class="auth-form-icon fas fa-at"></i>
                <input type="email" class="auth-form-input" :value="invite.email" readonly />
              </div>
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="invitePassword">
                <i class="fas fa-lock"></i> Password
              </label>
              <div class="auth-form-input-wrapper">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="invitePassword"
                  v-model="inviteForm.password"
                  class="auth-form-input"
                  placeholder="Create your password"
                  required
                  minlength="8"
                  maxlength="16"
                  autocomplete="new-password"
                  @input="clearValidation('password')"
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
              <div class="validation-message" id="invitePasswordValidation">{{ validation.password }}</div>
            </div>

            <div class="auth-actions">
              <button type="submit" class="auth-submit-btn" :disabled="isLoading" id="inviteSubmitBtn">
                <i class="fas fa-key login-submit-icon"></i>
                <span>{{ isLoading ? 'Activating...' : 'Activate Account' }}</span>
              </button>
            </div>
          </form>

          <div class="auth-footer auth-support-footer">
          </div>
        </div>
        </div>
      </div>

      <!-- Copyright Footer -->
      <div class="auth-copyright">
        <p class="login-copyright-copy">&copy; 2026 EduMatch. Choose the right path.</p>
        <p>© 2026 EduMatch. Chose the right path</p>
      </div>
          </div>
        </section>

        <aside class="login-design-panel">
          <div class="login-design-shape login-design-shape-top"></div>
          <div class="login-design-shape login-design-shape-bottom"></div>

          <div class="login-design-content">
            <div class="login-design-heading">
              <h2 class="login-design-title">
                {{ isInviteMode ? 'Finish setup and enter a role-based workspace built for momentum.' : 'EduMatch: Academic Learning-Based Recommendation System' }}
              </h2>
              <img src="/logo.png" alt="EduMatch Logo" class="login-design-logo" />
            </div>
            <p class="login-design-copy">
              EduMatch brings together student tracking, learning activities, and role-based management in one focused platform.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 16
const RECAPTCHA_SITE_KEY = String(import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim()
const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-v2-script'
let recaptchaLoaderPromise = null

function waitForRecaptchaReady(resolve, reject) {
  const startedAt = Date.now()

  const checkReady = () => {
    if (typeof window === 'undefined') {
      reject(new Error('reCAPTCHA is unavailable'))
      return
    }

    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      resolve(window.grecaptcha)
      return
    }

    if (Date.now() - startedAt > 10000) {
      reject(new Error('Timed out while loading reCAPTCHA'))
      return
    }

    window.setTimeout(checkReady, 100)
  }

  checkReady()
}

export default {
  name: 'LoginView',
  
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const rememberedUsername = String(authStore.getRememberedUsername?.() || '').trim()
    const invite = reactive({
      email: '',
      role: '',
      expiresAt: null
    })
    
    // Form state
    const form = reactive({
      username: rememberedUsername,
      password: '',
      remember: Boolean(rememberedUsername),
      otpCode: '',
    })
    const otpRequired = ref(false)
    const otpChallengeToken = ref('')
    const otpDeliveryHint = ref('')
    const otpSecondsRemaining = ref(0)
    const otpResendSecondsRemaining = ref(0)
    const isResendingOtp = ref(false)
    let otpCountdownTimerId = null
    
    const showPassword = ref(false)
    const isLoading = ref(false)
    const isInviteMode = computed(() => Boolean(String(route.params.token || '').trim()))
    const flashMessage = ref('')
    const captchaToken = ref('')
    const recaptchaContainer = ref(null)
    const recaptchaWidgetId = ref(null)
    const captchaLoadError = ref('')
    
    // Validation state
    const validation = reactive({
      username: '',
      password: '',
      captcha: '',
      otp: '',
    })
    const inviteForm = reactive({
      password: '',
    })
    
    // Get error/success messages from store or route query
    const error = computed(() => {
      return authStore.error || route.query.error
    })
    
    const message = computed(() => flashMessage.value)
    const captchaMessage = computed(() => validation.captcha || captchaLoadError.value)
    
    // Validation methods
    const validateUsername = () => {
      if (!form.username) {
        validation.username = 'Username is required'
      } else {
        validation.username = ''
      }
    }
    
    const validatePassword = () => {
      if (!form.password) {
        validation.password = 'Password is required'
      } else if (form.password.length < PASSWORD_MIN_LENGTH || form.password.length > PASSWORD_MAX_LENGTH) {
        validation.password = `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`
      } else {
        validation.password = ''
      }
    }
    
    const clearValidation = (field) => {
      validation[field] = ''
    }

    const ensureRecaptchaScript = () => {
      if (!RECAPTCHA_SITE_KEY) {
        return Promise.reject(new Error('Missing reCAPTCHA site key'))
      }

      if (recaptchaLoaderPromise) {
        return recaptchaLoaderPromise
      }

      recaptchaLoaderPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          reject(new Error('reCAPTCHA is unavailable'))
          return
        }

        if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
          resolve(window.grecaptcha)
          return
        }

        const finishWhenReady = () => waitForRecaptchaReady(resolve, reject)
        const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID)

        if (existingScript) {
          existingScript.addEventListener('load', finishWhenReady, { once: true })
          existingScript.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA')), { once: true })
          finishWhenReady()
          return
        }

        const script = document.createElement('script')
        script.id = RECAPTCHA_SCRIPT_ID
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
        script.async = true
        script.defer = true
        script.addEventListener('load', finishWhenReady, { once: true })
        script.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA')), { once: true })
        document.head.appendChild(script)
      }).catch((error) => {
        recaptchaLoaderPromise = null
        throw error
      })

      return recaptchaLoaderPromise
    }

    const resetCaptcha = () => {
      captchaToken.value = ''
      validation.captcha = ''
      if (typeof window === 'undefined') return
      if (!window.grecaptcha || recaptchaWidgetId.value === null) return
      window.grecaptcha.reset(recaptchaWidgetId.value)
    }

    const renderRecaptchaWidget = async () => {
      if (isInviteMode.value) return
      await nextTick()
      if (!recaptchaContainer.value) return

      try {
        captchaLoadError.value = ''
        const grecaptcha = await ensureRecaptchaScript()
        if (!grecaptcha) {
          throw new Error('reCAPTCHA is unavailable')
        }

        if (recaptchaWidgetId.value !== null) {
          grecaptcha.reset(recaptchaWidgetId.value)
          return
        }

        recaptchaContainer.value.innerHTML = ''
        recaptchaWidgetId.value = grecaptcha.render(recaptchaContainer.value, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token) => {
            captchaToken.value = String(token || '').trim()
            validation.captcha = ''
            captchaLoadError.value = ''
          },
          'expired-callback': () => {
            captchaToken.value = ''
          },
          'error-callback': () => {
            captchaToken.value = ''
            captchaLoadError.value = 'CAPTCHA could not load. Check the site key and allowed domain.'
          },
        })
      } catch (error) {
        console.error('reCAPTCHA render failed:', error)
        captchaLoadError.value = 'CAPTCHA could not load. Check the site key and allowed domain.'
      }
    }
    
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    const stopOtpCountdown = () => {
      if (otpCountdownTimerId !== null) window.clearInterval(otpCountdownTimerId)
      otpCountdownTimerId = null
    }

    const startOtpCountdown = (expiresAt, resendAvailableAt) => {
      stopOtpCountdown()
      const expiryTime = new Date(expiresAt || Date.now() + 120000).getTime()
      const resendTime = new Date(resendAvailableAt || Date.now() + 30000).getTime()
      const updateCountdown = () => {
        otpSecondsRemaining.value = Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000))
        otpResendSecondsRemaining.value = Math.max(0, Math.ceil((resendTime - Date.now()) / 1000))
        if (otpSecondsRemaining.value === 0) {
          validation.otp = 'OTP expired. Request a new code below.'
        }
        if (otpSecondsRemaining.value === 0 && otpResendSecondsRemaining.value === 0) stopOtpCountdown()
      }
      updateCountdown()
      if (otpSecondsRemaining.value > 0 || otpResendSecondsRemaining.value > 0) {
        otpCountdownTimerId = window.setInterval(updateCountdown, 1000)
      }
    }
    
    // Form submission
    const handleSubmit = async () => {
      // Validate all fields
      if (!otpRequired.value) {
        validateUsername()
        validatePassword()
      }
      
      // Check if there are any validation errors
      if (!otpRequired.value && (validation.username || validation.password)) {
        return
      }
      if (!captchaToken.value) {
        validation.captcha = 'Please verify that you are not a robot'
        return
      }
      if (otpRequired.value && !/^\d{6}$/.test(form.otpCode)) {
        validation.otp = 'Enter the 6-digit OTP sent to your email'
        return
      }
      if (otpRequired.value && otpSecondsRemaining.value === 0) {
        validation.otp = 'OTP expired. Request a new code below.'
        return
      }
      
      isLoading.value = true
      
      try {
        // Call your authentication service
        const result = otpRequired.value
          ? await authStore.verifyLoginOtp({
              challengeToken: otpChallengeToken.value,
              otpCode: form.otpCode,
              captchaToken: captchaToken.value,
              remember: form.remember,
              username: form.username,
            })
          : await authStore.login({
              username: form.username,
              password: form.password,
              remember: form.remember,
              captchaToken: captchaToken.value,
            })

        if (result?.requiresOtp) {
          otpRequired.value = true
          otpChallengeToken.value = result.challengeToken
          otpDeliveryHint.value = result.deliveryHint || ''
          form.otpCode = ''
          startOtpCountdown(result.expiresAt, result.resendAvailableAt)
          resetCaptcha()
          return
        }
        
        const redirectPath = result?.redirectPath || route.query.redirect || authStore.getDashboardPath()
        router.push(redirectPath)
      } catch (err) {
        console.error('Login failed:', err)
        resetCaptcha()
      } finally {
        isLoading.value = false
      }
    }

    const handleResendOtp = async () => {
      if (!otpChallengeToken.value || isLoading.value || isResendingOtp.value || otpResendSecondsRemaining.value > 0) return
      isResendingOtp.value = true
      try {
        const result = await authStore.resendLoginOtp(otpChallengeToken.value)
        otpChallengeToken.value = result.challengeToken
        otpDeliveryHint.value = result.deliveryHint
        form.otpCode = ''
        validation.otp = ''
        startOtpCountdown(result.expiresAt, result.resendAvailableAt)
      } catch (_error) {
        // The auth store displays the server error.
      } finally {
        isResendingOtp.value = false
      }
    }

    const backToCredentials = () => {
      otpRequired.value = false
      otpChallengeToken.value = ''
      otpDeliveryHint.value = ''
      otpSecondsRemaining.value = 0
      otpResendSecondsRemaining.value = 0
      stopOtpCountdown()
      form.otpCode = ''
      form.password = ''
      validation.password = ''
      validation.otp = ''
      authStore.clearAlerts()
      resetCaptcha()
    }

    const loadInvite = async () => {
      const inviteToken = String(route.params.token || '').trim()
      if (!inviteToken) return

      isLoading.value = true
      try {
        const inviteDetails = await authStore.validateInvite(inviteToken)
        invite.email = inviteDetails?.email || ''
        invite.role = inviteDetails?.role || ''
        invite.expiresAt = inviteDetails?.expiresAt || null
      } catch (_error) {
        // The store exposes the error for rendering.
      } finally {
        isLoading.value = false
      }
    }

    const handleInviteSubmit = async () => {
      if (
        !inviteForm.password ||
        inviteForm.password.length < PASSWORD_MIN_LENGTH ||
        inviteForm.password.length > PASSWORD_MAX_LENGTH
      ) {
        validation.password = `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`
        return
      }

      const inviteToken = String(route.params.token || '').trim()
      if (!inviteToken) {
        return
      }

      isLoading.value = true
      try {
        await authStore.completeInvite({
          token: inviteToken,
          password: inviteForm.password,
        })

        router.push({
          path: '/auth/login',
          query: { message: 'Account activated successfully. Please sign in.' },
        })
      } catch (_error) {
        // Error is handled by the store.
      } finally {
        isLoading.value = false
      }
    }

    onMounted(async () => {
      loadInvite()
      if (!isInviteMode.value) {
        await renderRecaptchaWidget()
      }

      const queryMessage = String(route.query.message || '').trim()
      const storeMessage = String(authStore.consumeMessage?.() || '').trim()
      flashMessage.value = queryMessage || storeMessage

      if (queryMessage) {
        const nextQuery = { ...route.query }
        delete nextQuery.message
        await router.replace({ path: route.path, query: nextQuery })
      }
    })

    watch(
      () => isInviteMode.value,
      async (inviteMode) => {
        if (inviteMode) {
          resetCaptcha()
          return
        }
        await renderRecaptchaWidget()
      }
    )

    onBeforeUnmount(() => {
      stopOtpCountdown()
      resetCaptcha()
    })
    
    return {
      form,
      otpRequired,
      otpDeliveryHint,
      otpSecondsRemaining,
      otpResendSecondsRemaining,
      isResendingOtp,
      invite,
      inviteForm,
      recaptchaContainer,
      isInviteMode,
      showPassword,
      isLoading,
      validation,
      captchaMessage,
      error,
      message,
      validateUsername,
      validatePassword,
      clearValidation,
      togglePasswordVisibility,
      handleSubmit,
      handleResendOtp,
      backToCredentials,
      handleInviteSubmit
    }
  }
}
</script>

<style scoped>
@reference "../../styles/tailwind.css";

@import '../../styles/auth.tailwind.css';

.login-page {
  @apply tw:[min-height:100dvh];
  @apply tw:[background:#fff7f2];
}

.login-page .auth-bg-pattern {
  @apply tw:[background:radial-gradient(circle_at_12%_18%,_rgba(255,_82,_82,_0.12)_0%,_transparent_32%),______radial-gradient(circle_at_84%_20%,_rgba(255,_216,_77,_0.14)_0%,_transparent_28%),______linear-gradient(180deg,_#fff9f5_0%,_#fffef9_100%)]!;
}

.login-page .auth-floating-element:nth-child(1) {
  @apply tw:[background:linear-gradient(135deg,_rgba(255,_82,_82,_0.32),_rgba(255,_216,_77,_0.2))];
}

.login-page .auth-floating-element:nth-child(2) {
  @apply tw:[background:linear-gradient(135deg,_rgba(255,_139,_77,_0.28),_rgba(255,_82,_82,_0.16))];
}

.login-page .auth-floating-element:nth-child(3) {
  @apply tw:[background:linear-gradient(135deg,_rgba(255,_216,_77,_0.28),_rgba(255,_82,_82,_0.18))];
}

.login-page .auth-container {
  @apply tw:[min-height:100dvh];
  @apply tw:w-full;
  @apply tw:[padding:0];
  @apply tw:justify-center;
}

.auth-actions .auth-submit-btn--secondary {
  @apply tw:[margin-top:0.75rem];
  @apply tw:[color:#ffffff]!;
  @apply tw:[border:1px_solid_#d1d5db]!;
  @apply tw:[box-shadow:none]!;
}

.auth-actions .forgot-password--below-submit {
  @apply tw:block;
  @apply tw:w-fit;
  @apply tw:[margin:0.75rem_auto_0];
  @apply tw:text-center;
}

.auth-actions .auth-submit-btn--secondary span,
.auth-actions .auth-submit-btn--secondary i {
  @apply tw:[color:#ffffff]!;
}

.otp-status-row {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem_1rem];
  @apply tw:[margin-top:0.55rem];
  @apply tw:[padding:0.55rem_0.7rem];
  @apply tw:[border:1px_solid_rgba(105,_170,_71,_0.22)];
  @apply tw:[border-radius:12px];
  @apply tw:[background:rgba(248,_251,_243,_0.78)];
  @apply tw:[color:#4b5563];
  @apply tw:[font-size:0.68rem];
  @apply tw:[line-height:1.35];
}

.otp-expiry {
  @apply tw:flex-none;
  @apply tw:[color:#365b0d];
  @apply tw:[font-weight:700];
}

.otp-expiry--expired {
  @apply tw:[color:#b91c1c];
}

.otp-resend-prompt {
  @apply tw:inline-flex;
  @apply tw:items-baseline;
  @apply tw:justify-end;
  @apply tw:[gap:0.28rem];
  @apply tw:[min-width:0];
  @apply tw:text-right;
}

.otp-resend-button {
  @apply tw:inline;
  @apply tw:flex-none;
  @apply tw:[padding:0];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#3f7f2a];
  @apply tw:[font:inherit];
  @apply tw:[font-weight:800];
  @apply tw:cursor-pointer;
}

.otp-resend-button:hover:not(:disabled) {
  @apply tw:[text-decoration:underline];
  @apply tw:[color:#2f641f];
}

.otp-resend-button:focus-visible {
  @apply tw:[outline:2px_solid_rgba(63,_127,_42,_0.5)];
  @apply tw:[outline-offset:3px];
  @apply tw:[border-radius:3px];
}

.otp-resend-button:disabled {
  @apply tw:[color:#9ca3af];
  @apply tw:cursor-not-allowed;
}

.remember-me input[type='checkbox'] {
  @apply tw:appearance-none;
  @apply tw:[width:16px];
  @apply tw:[height:16px];
  @apply tw:[margin:0];
  @apply tw:[background:#ffffff]!;
  @apply tw:[border:1px_solid_#9ca3af]!;
  @apply tw:[border-radius:3px];
  @apply tw:inline-grid;
  @apply tw:place-content-center;
  @apply tw:cursor-pointer;
}

.remember-me input[type='checkbox']::before {
  @apply tw:[content:''];
  @apply tw:[width:8px];
  @apply tw:[height:8px];
  @apply tw:[transform:scale(0)];
  @apply tw:[background:#111111];
  @apply tw:[clip-path:polygon(14%_44%,_0_65%,_42%_100%,_100%_16%,_80%_0,_40%_62%)];
}

.remember-me input[type='checkbox']:checked::before {
  @apply tw:[transform:scale(1)];
}

.login-layout {
  @apply tw:w-full;
  @apply tw:[min-height:100dvh];
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(0,_1fr)];
  @apply tw:[background:transparent];
  @apply tw:[border:none];
  @apply tw:rounded-none;
  @apply tw:overflow-hidden;
  @apply tw:[box-shadow:none];
  @apply tw:[backdrop-filter:none];
}

.login-form-panel {
  @apply tw:relative;
  @apply tw:isolate;
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-height:100dvh];
  @apply tw:[padding:clamp(1rem,_2.8vw,_2.25rem)_clamp(1.4rem,_3vw,_2.8rem)];
  @apply tw:overflow-hidden;
  @apply tw:[background:#f8fafc];
}

.login-form-panel::before {
  @apply tw:[content:''];
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[z-index:-2];
  @apply tw:pointer-events-none;
  @apply tw:[background:radial-gradient(ellipse_62%_54%_at_50%_48%,_rgba(255,_255,_255,_0.98)_0%,_rgba(255,_255,_255,_0.76)_42%,_rgba(248,_250,_252,_0)_76%),______radial-gradient(circle_at_0_0,_rgba(126,_185,_77,_0.72)_0_3px,_transparent_3.5px)_77px_64px_/_204px_164px,______radial-gradient(circle_at_0_0,_rgba(232,_184,_36,_0.7)_0_3px,_transparent_3.5px)_115px_64px_/_268px_195px,______radial-gradient(circle_at_0_0,_rgba(148,_163,_184,_0.18)_0_1.15px,_transparent_1.5px)_17px_31px_/_40px_32px,______linear-gradient(rgba(148,_163,_184,_0.07)_1px,_transparent_1px)_0_0_/_40px_40px,______linear-gradient(90deg,_rgba(148,_163,_184,_0.07)_1px,_transparent_1px)_0_0_/_40px_40px];
}

.login-form-panel::after {
  @apply tw:[content:''];
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[z-index:0];
  @apply tw:pointer-events-none;
  @apply tw:[background:radial-gradient(circle_at_17%_10%,_rgba(63,_143,_70,_0.08)_0_2px,_transparent_2.5px),______radial-gradient(circle_at_85%_72%,_rgba(212,_175,_55,_0.1)_0_2px,_transparent_2.5px)];
}

.login-panel-geometry {
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[z-index:-1];
  @apply tw:overflow-hidden;
  @apply tw:pointer-events-none;
}

.login-panel-shape {
  @apply tw:absolute;
  @apply tw:block;
}

.login-panel-shape--rectangle {
  @apply tw:[width:clamp(112px,_14vw,_178px)];
  @apply tw:[height:clamp(112px,_14vw,_178px)];
  @apply tw:[top:34px];
  @apply tw:[left:0];
  @apply tw:[background:linear-gradient(135deg,_rgba(165,_203,_126,_0.94),_rgba(83,_151,_70,_0.72))];
  @apply tw:[clip-path:polygon(0_0,_78%_0,_0_78%)];
  @apply tw:[filter:drop-shadow(0_12px_24px_rgba(63,_143,_70,_0.1))];
}

.login-panel-shape--polygon {
  @apply tw:[width:clamp(145px,_18vw,_230px)];
  @apply tw:[height:clamp(130px,_17vw,_215px)];
  @apply tw:[right:0];
  @apply tw:[bottom:0];
  @apply tw:[background:linear-gradient(135deg,_rgba(165,_203,_126,_0.42),_rgba(73,_143,_67,_0.8))];
  @apply tw:[clip-path:polygon(100%_20%,_100%_100%,_18%_100%)];
  @apply tw:[filter:drop-shadow(-10px_-12px_28px_rgba(63,_143,_70,_0.08))];
}

.login-panel-shape--small {
  @apply tw:[width:clamp(200px,_25vw,_315px)];
  @apply tw:[height:clamp(200px,_25vw,_315px)];
  @apply tw:[left:clamp(-165px,_-12vw,_-96px)];
  @apply tw:[bottom:clamp(-165px,_-12vw,_-96px)];
  @apply tw:[border-radius:50%];
  @apply tw:[background:rgba(151,_196,_107,_0.1)];
  @apply tw:[box-shadow:58px_-44px_0_rgba(151,_196,_107,_0.055),______116px_-88px_0_rgba(151,_196,_107,_0.025)];
}

.login-panel-accent {
  @apply tw:absolute;
  @apply tw:block;
  @apply tw:[width:clamp(125px,_14vw,_180px)];
  @apply tw:[height:2px];
  @apply tw:[background:linear-gradient(90deg,_rgba(212,_175,_55,_0),_#e0b52e_24%,_#e0b52e_76%,_rgba(212,_175,_55,_0))];
  @apply tw:[box-shadow:0_9px_0_rgba(212,_175,_55,_0.15)];
}

.login-panel-accent--top {
  @apply tw:[top:48px];
  @apply tw:[left:62px];
  @apply tw:[transform:rotate(-45deg)];
}

.login-panel-accent--bottom {
  @apply tw:[right:38px];
  @apply tw:[bottom:58px];
  @apply tw:[transform:rotate(-45deg)];
}

.login-form-shell {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:[width:min(100%,_540px)];
  @apply tw:flex;
  @apply tw:flex-col;
}

.login-page .auth-card-wrapper {
  @apply tw:max-w-none;
  @apply tw:[margin-bottom:0];
  @apply tw:[perspective:none];
}

.login-page .auth-card-container {
  @apply tw:relative;
  @apply tw:[border-radius:30px];
  @apply tw:[padding:2px];
  @apply tw:[background:linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)];
  @apply tw:[box-shadow:0_0_0_1px_rgba(187,_255,_89,_0.24),______0_14px_34px_rgba(30,_67,_7,_0.16),______0_0_28px_rgba(255,_213,_66,_0.24)];
  @apply tw:overflow-hidden;
}

.login-page .auth-card-container::before {
  @apply tw:[content:''];
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[background:linear-gradient(135deg,_rgba(255,_255,_255,_0.28),_rgba(255,_255,_255,_0.02))];
  @apply tw:pointer-events-none;
}

.login-page .auth-card {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:[padding:clamp(0.75rem,_0.95vw,_0.95rem)]!;
  @apply tw:[border-radius:29px];
  @apply tw:[background:#ffffff]!;
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.92)]!;
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.96),______0_10px_22px_rgba(17,_17,_17,_0.05)];
  @apply tw:[backdrop-filter:none];
}

.login-page .auth-card::before {
  @apply tw:hidden;
}

.login-page .auth-card-header {
  @apply tw:text-left;
  @apply tw:[margin-bottom:0.65rem];
  @apply tw:[padding-bottom:0.55rem];
  @apply tw:[border-bottom:1px_solid_rgba(17,_17,_17,_0.08)];
}

.login-page .auth-card-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[margin-bottom:0.5rem];
  @apply tw:[padding:0.3rem_0.56rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:linear-gradient(135deg,_rgba(30,_67,_7,_0.12),_rgba(187,_255,_89,_0.24))];
  @apply tw:[border:1px_solid_rgba(30,_67,_7,_0.12)];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:0.66rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.14em];
  @apply tw:uppercase;
}

.login-page .auth-card-badge i {
  @apply tw:[color:#6a8f1b];
}

.login-page .auth-card-title {
  @apply tw:[background:none];
  @apply tw:[-webkit-text-fill-color:#111111];
  @apply tw:[color:#111111];
  @apply tw:[font-size:clamp(1.35rem,_1.45vw,_1.65rem)];
  @apply tw:[line-height:1.02];
  @apply tw:[letter-spacing:-0.04em];
}

.login-page .auth-card-subtitle {
  @apply tw:[color:#4b5563]!;
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.35];
  @apply tw:[max-width:64ch];
}

.login-page .auth-alert {
  @apply tw:[border-left-width:5px];
  @apply tw:[border-radius:18px];
}

.login-page .auth-alert.success {
  @apply tw:[background:rgba(255,_216,_77,_0.16)]!;
  @apply tw:[border-color:#ff9c3f]!;
  @apply tw:[color:#5f3b00]!;
}

.login-page .auth-alert.error {
  @apply tw:[background:rgba(255,_82,_82,_0.1)]!;
  @apply tw:[border-color:#ff5252]!;
  @apply tw:[color:#8f1f1f]!;
}

.login-page .auth-form {
  @apply tw:[gap:0.45rem];
}

.login-page .auth-form-section-label {
  @apply tw:[margin-bottom:0];
  @apply tw:[color:#3f7f2a];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.14em];
  @apply tw:uppercase;
}

.login-page .auth-form-label {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[font-weight:700];
  @apply tw:[color:#111111];
  @apply tw:[font-size:0.74rem];
  @apply tw:[line-height:1.2];
  @apply tw:[margin-bottom:0.22rem];
}

.login-page .auth-form-label i,
.login-page .auth-form-icon {
  @apply tw:[color:#69aa47];
}

.login-page .auth-form-group-heading {
  @apply tw:[margin-bottom:0.32rem];
}

.login-page .auth-form-helper {
  @apply tw:[margin-top:0.2rem];
  @apply tw:[color:#6b7280];
  @apply tw:[font-size:0.68rem];
  @apply tw:[line-height:1.25];
}

.login-page .auth-form-input {
  @apply tw:[min-height:40px];
  @apply tw:[background:#ffffff]!;
  @apply tw:[border-color:rgba(17,_17,_17,_0.1)]!;
  @apply tw:[border-radius:12px];
  @apply tw:[font-weight:500];
  @apply tw:[padding-top:0.52rem];
  @apply tw:[padding-bottom:0.52rem];
  @apply tw:[font-size:0.84rem];
}

.login-page .auth-form-input:focus {
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[box-shadow:0_0_0_4px_rgba(105,_170,_71,_0.16)];
  @apply tw:[background:#fbfff8]!;
  @apply tw:[caret-color:#3f7f2a];
}

.login-page .auth-form-input::placeholder {
  @apply tw:[color:#9ca3af];
}

.login-page .password-toggle:hover {
  @apply tw:[color:#3f7f2a];
  @apply tw:[background:rgba(105,_170,_71,_0.1)];
}

.login-page .captcha-group {
  @apply tw:[padding:0.56rem];
  @apply tw:[border-radius:14px];
  @apply tw:[background:rgba(255,_255,_255,_0.34)];
  @apply tw:[border:1px_solid_rgba(105,_170,_71,_0.22)];
}

.login-page .auth-options {
  @apply tw:[margin-top:0.1rem];
  @apply tw:[padding:0.5rem_0.7rem];
  @apply tw:[border-radius:14px];
  @apply tw:[background:rgba(255,_255,_255,_0.32)];
  @apply tw:[border:1px_solid_rgba(105,_170,_71,_0.22)];
}

.login-page .remember-me input[type="checkbox"] {
  @apply tw:[accent-color:#69aa47];
}

.login-page .remember-me span,
.login-page .forgot-password,
.login-page .auth-footer p {
  @apply tw:[color:#374151]!;
}

.login-page .remember-me span {
  @apply tw:[font-size:0.72rem];
  @apply tw:[line-height:1.25];
}

.login-page .forgot-password:hover {
  @apply tw:[color:#3f7f2a]!;
}

.login-page .forgot-password::after {
  @apply tw:[background:#69aa47];
}

.login-page .auth-submit-btn {
  @apply tw:[min-height:40px];
  @apply tw:[background:linear-gradient(135deg,_#69aa47_0%,_#3f7f2a_100%)]!;
  @apply tw:[border:none]!;
  @apply tw:[box-shadow:0_16px_32px_rgba(63,_127,_42,_0.22)];
  @apply tw:[font-size:0.82rem];
}

.login-page .auth-submit-btn:hover {
  @apply tw:[background:linear-gradient(135deg,_#5c9f3d_0%,_#356d24_100%)]!;
  @apply tw:[box-shadow:0_18px_36px_rgba(63,_127,_42,_0.3)];
}

.login-page .auth-footer {
  @apply tw:[margin-top:0.5rem];
  @apply tw:[padding-top:0];
  @apply tw:[border-top:none];
}

.login-page .auth-copyright {
  @apply tw:static;
  @apply tw:[margin-top:0.5rem];
  @apply tw:[padding:0];
  @apply tw:w-full;
  @apply tw:text-center;
  @apply tw:[color:#6b7280];
  @apply tw:[font-size:0.74rem];
}

.login-page .auth-copyright > p:not(.login-copyright-copy) {
  @apply tw:hidden;
}

.login-page .validation-message:empty {
  @apply tw:hidden;
}

.login-page .validation-message:not(:empty) {
  @apply tw:[margin-top:0.45rem];
  @apply tw:[color:#b42318];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:600];
}

.login-design-panel {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:items-stretch;
  @apply tw:[min-height:100dvh];
  @apply tw:overflow-hidden;
  @apply tw:[padding:clamp(1.6rem,_3vw,_3rem)];
  @apply tw:[background:linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)];
}

.login-design-panel::before {
  @apply tw:[content:''];
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[background:linear-gradient(128deg,_rgba(255,_255,_255,_0.15)_0%,_rgba(255,_255,_255,_0.15)_16%,_transparent_16%,_transparent_56%,_rgba(17,_17,_17,_0.08)_56%,_rgba(17,_17,_17,_0.08)_60%,_transparent_60%),______linear-gradient(180deg,_rgba(255,_255,_255,_0.04),_rgba(17,_17,_17,_0.08))];
  @apply tw:pointer-events-none;
}

.login-design-panel::after {
  @apply tw:[content:''];
  @apply tw:absolute;
  @apply tw:[inset:1.2rem];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.18)];
  @apply tw:pointer-events-none;
}

.login-design-content {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:justify-center;
  @apply tw:[gap:1rem];
  @apply tw:[width:min(100%,_560px)];
  @apply tw:[color:#1f140f];
}

.login-design-heading {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:clamp(8rem,_4vw,_3.5rem)];
  @apply tw:[margin-bottom:0.35rem];
}

.login-design-logo {
  @apply tw:[width:220px];
  @apply tw:[height:220px];
  @apply tw:object-contain;
  @apply tw:shrink-0;
  @apply tw:[filter:drop-shadow(0_10px_18px_rgba(17,_17,_17,_0.12))];
}

.login-design-title {
  @apply tw:[margin:0];
  @apply tw:[flex:1];
  @apply tw:[font-size:clamp(2rem,_2.6vw,_3.1rem)];
  @apply tw:[line-height:1];
  @apply tw:[letter-spacing:-0.05em];
  @apply tw:[font-weight:900];
  @apply tw:max-w-none;
}

.login-design-copy {
  @apply tw:[max-width:34rem];
  @apply tw:[color:rgba(31,_20,_15,_0.8)];
  @apply tw:[font-size:0.92rem];
  @apply tw:[line-height:1.6];
}

.login-design-shape {
  @apply tw:absolute;
  @apply tw:pointer-events-none;
  @apply tw:[z-index:0];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.18)];
}

.login-design-shape-top {
  @apply tw:[width:300px];
  @apply tw:[height:190px];
  @apply tw:[top:8%];
  @apply tw:[right:7%];
  @apply tw:[clip-path:polygon(14%_0,_100%_0,_86%_100%,_0_100%)];
  @apply tw:[background:linear-gradient(135deg,_rgba(255,_255,_255,_0.16),_rgba(255,_255,_255,_0.05))];
  @apply tw:[transform:rotate(-8deg)];
}

.login-design-shape-bottom {
  @apply tw:[width:360px];
  @apply tw:[height:220px];
  @apply tw:[bottom:8%];
  @apply tw:[left:4%];
  @apply tw:[clip-path:polygon(0_18%,_76%_0,_100%_82%,_24%_100%)];
  @apply tw:[background:linear-gradient(135deg,_rgba(17,_17,_17,_0.08),_rgba(255,_255,_255,_0.12))];
  @apply tw:[transform:rotate(7deg)];
}


.validation-message {
  @apply tw:[font-size:0.85rem];
  @apply tw:[margin-top:0.25rem];
  @apply tw:[color:#4b5563];
}

.auth-submit-btn:disabled {
  @apply tw:[opacity:0.7];
  @apply tw:cursor-not-allowed;
}

.login-submit-icon {
  @apply tw:[color:#ffffff]!;
}

.captcha-group {
  @apply tw:[margin-top:0.15rem];
}

.recaptcha-widget {
  @apply tw:flex;
  @apply tw:justify-center;
  @apply tw:items-start;
  @apply tw:[min-height:78px];
  @apply tw:w-full;
  @apply tw:overflow-visible;
}

.recaptcha-widget > div {
  @apply tw:[margin-inline:auto];
}

@media (max-width: 576px) {
  .auth-card {
    @apply tw:[padding:1.05rem];
  }

  .auth-card-title {
    @apply tw:[font-size:1.3rem];
    @apply tw:[margin-bottom:0.45rem];
  }

  .auth-card-subtitle {
    @apply tw:[font-size:0.9rem];
    @apply tw:[line-height:1.45];
  }

  .auth-form-input,
  .auth-submit-btn {
    @apply tw:[font-size:0.9rem];
    @apply tw:[padding:0.68rem_0.85rem];
  }

  .otp-status-row {
    @apply tw:items-start;
    @apply tw:flex-col;
    @apply tw:[gap:0.3rem];
  }

  .otp-resend-prompt {
    @apply tw:justify-start;
    @apply tw:text-left;
  }

}

@media (max-width: 1080px) {
  .login-layout {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:[min-height:auto];
  }

  .login-form-panel,
  .login-design-panel {
    @apply tw:[padding:clamp(1.35rem,_4vw,_2.25rem)];
  }

  .login-design-panel {
    @apply tw:[min-height:420px];
  }

}

@media (max-width: 768px) {
  .login-page .auth-container {
    @apply tw:[padding:0];
  }

  .login-layout {
    @apply tw:rounded-none;
  }

  .login-design-panel {
    @apply tw:hidden;
    @apply tw:[min-height:auto];
  }

  .login-form-panel {
    @apply tw:[min-height:100dvh];
    @apply tw:[padding:max(1rem,_env(safe-area-inset-top))________max(0.75rem,_env(safe-area-inset-right))________max(1rem,_env(safe-area-inset-bottom))________max(0.75rem,_env(safe-area-inset-left))];
  }

  .login-form-shell {
    @apply tw:[width:min(100%,_520px)];
  }

  .login-page .auth-card {
    @apply tw:[padding:0.85rem]!;
    @apply tw:[border-radius:21px];
  }

  .login-page .auth-card-container {
    @apply tw:[border-radius:22px];
  }

  .login-design-title {
    @apply tw:[font-size:clamp(2rem,_9vw,_2.8rem)];
    @apply tw:max-w-none;
  }

  .login-design-heading {
    @apply tw:items-center;
    @apply tw:[gap:1rem];
  }

  .login-design-panel::after {
    @apply tw:[inset:0.85rem];
  }

  .login-design-logo {
    @apply tw:[width:140px];
    @apply tw:[height:140px];
  }

  .login-design-shape-top {
    @apply tw:[width:190px];
    @apply tw:[height:120px];
    @apply tw:[right:4%];
  }

  .login-design-shape-bottom {
    @apply tw:[width:230px];
    @apply tw:[height:150px];
    @apply tw:[left:-2%];
    @apply tw:[bottom:6%];
  }

  .login-page .auth-options {
    @apply tw:[padding:0.9rem];
    @apply tw:w-full;
  }

  .login-form-panel::after {
    @apply tw:[opacity:0.72];
  }

  .login-panel-accent {
    @apply tw:[width:118px];
  }
}

@media (max-width: 400px) {
  .login-form-panel {
    @apply tw:[padding-inline:0.55rem];
  }

  .login-page .auth-card {
    @apply tw:[padding:0.72rem]!;
  }

  .login-page .auth-card-title {
    @apply tw:[font-size:1.25rem];
  }

  .login-page .auth-card-subtitle {
    @apply tw:[font-size:0.72rem];
  }

  .login-page .captcha-group {
    @apply tw:[padding-inline:0.35rem];
    @apply tw:overflow-hidden;
  }

  .recaptcha-widget {
    --captcha-scale: clamp(0.76, calc((100vw - 4.25rem) / 304), 1);
    @apply tw:[min-height:calc(78px_*_var(--captcha-scale))];
    @apply tw:overflow-hidden;
  }

  .recaptcha-widget > div {
    @apply tw:[flex:0_0_304px];
    @apply tw:[transform:scale(var(--captcha-scale))];
    @apply tw:[transform-origin:top_center];
  }

  .login-page .auth-options {
    @apply tw:[gap:0.65rem];
    @apply tw:[padding:0.75rem];
  }

  .login-page .auth-copyright {
    @apply tw:[font-size:0.68rem];
  }
}


</style>
