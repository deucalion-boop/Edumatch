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
            <div class="auth-form-section-label">Account details</div>

            <div class="auth-form-group">
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

            <div class="auth-form-group">
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

            <div class="auth-options">
              <label class="remember-me">
                <input type="checkbox" v-model="form.remember" />
                <span>Keep me signed in on this device</span>
              </label>
              <RouterLink to="/auth/forgot-password" class="forgot-password">
                Forgot password
              </RouterLink>
            </div>

            <div class="auth-actions">
              <button type="submit" class="auth-submit-btn" :disabled="isLoading" id="submitBtn">
                <i class="fas fa-sign-in-alt login-submit-icon"></i>
                <span>{{ isLoading ? 'Signing In...' : 'Sign In' }}</span>
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
      remember: Boolean(rememberedUsername)
    })
    
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
      captcha: ''
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
    
    // Form submission
    const handleSubmit = async () => {
      // Validate all fields
      validateUsername()
      validatePassword()
      
      // Check if there are any validation errors
      if (validation.username || validation.password) {
        return
      }
      if (!captchaToken.value) {
        validation.captcha = 'Please verify that you are not a robot'
        return
      }
      
      isLoading.value = true
      
      try {
        // Call your authentication service
        const result = await authStore.login({
          username: form.username,
          password: form.password,
          remember: form.remember,
          captchaToken: captchaToken.value,
        })
        
        const redirectPath = result?.redirectPath || route.query.redirect || authStore.getDashboardPath()
        router.push(redirectPath)
      } catch (err) {
        console.error('Login failed:', err)
        resetCaptcha()
      } finally {
        isLoading.value = false
      }
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
      resetCaptcha()
    })
    
    return {
      form,
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
      handleInviteSubmit
    }
  }
}
</script>

<style scoped>

@import '/css/auth.css';

.login-page {
  min-height: 100dvh;
  background: #fff7f2;
}

.login-page .auth-bg-pattern {
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 82, 82, 0.12) 0%, transparent 32%),
    radial-gradient(circle at 84% 20%, rgba(255, 216, 77, 0.14) 0%, transparent 28%),
    linear-gradient(180deg, #fff9f5 0%, #fffef9 100%) !important;
}

.login-page .auth-floating-element:nth-child(1) {
  background: linear-gradient(135deg, rgba(255, 82, 82, 0.32), rgba(255, 216, 77, 0.2));
}

.login-page .auth-floating-element:nth-child(2) {
  background: linear-gradient(135deg, rgba(255, 139, 77, 0.28), rgba(255, 82, 82, 0.16));
}

.login-page .auth-floating-element:nth-child(3) {
  background: linear-gradient(135deg, rgba(255, 216, 77, 0.28), rgba(255, 82, 82, 0.18));
}

.login-page .auth-container {
  min-height: 100dvh;
  width: 100%;
  padding: 0;
  justify-content: center;
}

.login-layout {
  width: 100%;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  background: transparent;
  border: none;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
  backdrop-filter: none;
}

.login-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: clamp(1rem, 2.8vw, 2.25rem) clamp(1.4rem, 3vw, 2.8rem);
  background: #ffffff;
}

.login-form-shell {
  width: min(100%, 540px);
  display: flex;
  flex-direction: column;
}

.login-page .auth-card-wrapper {
  max-width: none;
  margin-bottom: 0;
  perspective: none;
}

.login-page .auth-card-container {
  position: relative;
  border-radius: 30px;
  padding: 2px;
  background: linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%);
  box-shadow:
    0 0 0 1px rgba(187, 255, 89, 0.24),
    0 14px 34px rgba(30, 67, 7, 0.16),
    0 0 28px rgba(255, 213, 66, 0.24);
  overflow: hidden;
}

.login-page .auth-card-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.02));
  pointer-events: none;
}

.login-page .auth-card {
  position: relative;
  z-index: 1;
  padding: clamp(0.75rem, 0.95vw, 0.95rem) !important;
  border-radius: 29px;
  background: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.92) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    0 10px 22px rgba(17, 17, 17, 0.05);
  backdrop-filter: none;
}

.login-page .auth-card::before {
  display: none;
}

.login-page .auth-card-header {
  text-align: left;
  margin-bottom: 0.65rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
}

.login-page .auth-card-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.3rem 0.56rem;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(30, 67, 7, 0.12), rgba(187, 255, 89, 0.24));
  border: 1px solid rgba(30, 67, 7, 0.12);
  color: #1e4307;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.login-page .auth-card-badge i {
  color: #6a8f1b;
}

.login-page .auth-card-title {
  background: none;
  -webkit-text-fill-color: #111111;
  color: #111111;
  font-size: clamp(1.35rem, 1.45vw, 1.65rem);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.login-page .auth-card-subtitle {
  color: #4b5563 !important;
  font-size: 0.78rem;
  line-height: 1.35;
  max-width: 64ch;
}

.login-page .auth-alert {
  border-left-width: 5px;
  border-radius: 18px;
}

.login-page .auth-alert.success {
  background: rgba(255, 216, 77, 0.16) !important;
  border-color: #ff9c3f !important;
  color: #5f3b00 !important;
}

.login-page .auth-alert.error {
  background: rgba(255, 82, 82, 0.1) !important;
  border-color: #ff5252 !important;
  color: #8f1f1f !important;
}

.login-page .auth-form {
  gap: 0.45rem;
}

.login-page .auth-form-section-label {
  margin-bottom: 0;
  color: #6b7280;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.login-page .auth-form-label {
  font-weight: 700;
  color: #111111;
  font-size: 0.74rem;
  margin-bottom: 0.22rem;
}

.login-page .auth-form-group-heading {
  margin-bottom: 0.32rem;
}

.login-page .auth-form-helper {
  margin-top: 0.2rem;
  color: #6b7280;
  font-size: 0.68rem;
  line-height: 1.25;
}

.login-page .auth-form-input {
  min-height: 40px;
  background: #ffffff !important;
  border-color: rgba(17, 17, 17, 0.1) !important;
  border-radius: 12px;
  font-weight: 500;
  padding-top: 0.52rem;
  padding-bottom: 0.52rem;
  font-size: 0.84rem;
}

.login-page .auth-form-input:focus {
  border-color: #6a8f1b !important;
  box-shadow: 0 0 0 4px rgba(187, 255, 89, 0.18);
  background: #fbfff4 !important;
  caret-color: #1e4307;
}

.login-page .auth-form-input::placeholder {
  color: #9ca3af;
}

.login-page .password-toggle:hover {
  color: #ff5252;
  background: rgba(255, 82, 82, 0.08);
}

.login-page .captcha-group {
  padding: 0.56rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.34);
  border: 1px solid rgba(17, 17, 17, 0.07);
}

.login-page .auth-options {
  margin-top: 0.1rem;
  padding: 0.5rem 0.7rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.32);
  border: 1px solid rgba(17, 17, 17, 0.07);
}

.login-page .remember-me span,
.login-page .forgot-password,
.login-page .auth-footer p {
  color: #374151 !important;
}

.login-page .remember-me span {
  font-size: 0.72rem;
  line-height: 1.25;
}

.login-page .forgot-password:hover {
  color: #1e4307 !important;
}

.login-page .forgot-password::after {
  background: linear-gradient(90deg, #1e4307, #ffd542, #bbff59);
}

.login-page .auth-submit-btn {
  min-height: 40px;
background: linear-gradient(135deg, #111111 0%, #2d2d2d 100%) !important;  border: none !important;
  box-shadow: 0 16px 32px rgba(15, 81, 50, 0.22);
  font-size: 0.82rem;
}

.login-page .auth-submit-btn:hover {
background: linear-gradient(135deg, #252525 0%, #111111 100%) !important;  box-shadow: 0 18px 36px rgba(15, 81, 50, 0.28);
}

.login-page .auth-footer {
  margin-top: 0.5rem;
  padding-top: 0;
  border-top: none;
}

.login-page .auth-copyright {
  position: static;
  margin-top: 0.5rem;
  padding: 0;
  width: 100%;
  text-align: center;
  color: #6b7280;
  font-size: 0.74rem;
}

.login-page .auth-copyright > p:not(.login-copyright-copy) {
  display: none;
}

.login-page .validation-message:empty {
  display: none;
}

.login-page .validation-message:not(:empty) {
  margin-top: 0.45rem;
  color: #b42318;
  font-size: 0.78rem;
  font-weight: 600;
}

.login-design-panel {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 100dvh;
  overflow: hidden;
  padding: clamp(1.6rem, 3vw, 3rem);
  background: linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%);
}

.login-design-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(128deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.15) 16%, transparent 16%, transparent 56%, rgba(17, 17, 17, 0.08) 56%, rgba(17, 17, 17, 0.08) 60%, transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(17, 17, 17, 0.08));
  pointer-events: none;
}

.login-design-panel::after {
  content: '';
  position: absolute;
  inset: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  pointer-events: none;
}

.login-design-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  width: min(100%, 560px);
  color: #1f140f;
}

.login-design-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(8rem, 4vw, 3.5rem);
  margin-bottom: 0.35rem;
}

.login-design-logo {
  width: 220px;
  height: 220px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 10px 18px rgba(17, 17, 17, 0.12));
}

.login-design-title {
  margin: 0;
  flex: 1;
  font-size: clamp(2rem, 2.6vw, 3.1rem);
  line-height: 1;
  letter-spacing: -0.05em;
  font-weight: 900;
  max-width: none;
}

.login-design-copy {
  max-width: 34rem;
  color: rgba(31, 20, 15, 0.8);
  font-size: 0.92rem;
  line-height: 1.6;
}

.login-design-shape {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.login-design-shape-top {
  width: 300px;
  height: 190px;
  top: 8%;
  right: 7%;
  clip-path: polygon(14% 0, 100% 0, 86% 100%, 0 100%);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
  transform: rotate(-8deg);
}

.login-design-shape-bottom {
  width: 360px;
  height: 220px;
  bottom: 8%;
  left: 4%;
  clip-path: polygon(0 18%, 76% 0, 100% 82%, 24% 100%);
  background: linear-gradient(135deg, rgba(17, 17, 17, 0.08), rgba(255, 255, 255, 0.12));
  transform: rotate(7deg);
}


.validation-message {
  font-size: 0.85rem;
  margin-top: 0.25rem;
  color: #4b5563;
}

.auth-submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-submit-icon {
  color: #ffffff !important;
}

.captcha-group {
  margin-top: 0.15rem;
}

.recaptcha-widget {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 78px;
  width: 100%;
  overflow: visible;
}

.recaptcha-widget > div {
  margin-inline: auto;
}

@media (max-width: 576px) {
  .auth-card {
    padding: 1.05rem;
  }

  .auth-card-title {
    font-size: 1.3rem;
    margin-bottom: 0.45rem;
  }

  .auth-card-subtitle {
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .auth-form-input,
  .auth-submit-btn {
    font-size: 0.9rem;
    padding: 0.68rem 0.85rem;
  }

}

@media (max-width: 1080px) {
  .login-layout {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .login-form-panel,
  .login-design-panel {
    padding: clamp(1.35rem, 4vw, 2.25rem);
  }

  .login-design-panel {
    min-height: 420px;
  }

}

@media (max-width: 768px) {
  .login-page .auth-container {
    padding: 0;
  }

  .login-layout {
    border-radius: 0;
  }

  .login-page .auth-card {
    border-radius: 25px;
  }

  .login-design-panel {
    min-height: auto;
  }

  .login-design-title {
    font-size: clamp(2rem, 9vw, 2.8rem);
    max-width: none;
  }

  .login-design-heading {
    align-items: center;
    gap: 1rem;
  }

  .login-design-panel::after {
    inset: 0.85rem;
  }

  .login-design-logo {
    width: 140px;
    height: 140px;
  }

  .login-design-shape-top {
    width: 190px;
    height: 120px;
    right: 4%;
  }

  .login-design-shape-bottom {
    width: 230px;
    height: 150px;
    left: -2%;
    bottom: 6%;
  }

  .login-page .auth-options {
    padding: 0.9rem;
  }
}

</style>
