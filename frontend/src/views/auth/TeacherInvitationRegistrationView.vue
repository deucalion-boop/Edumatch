<template>
  <LoginView custom-registration>
    <template #registration>
      <section class="teacher-registration-content" aria-labelledby="teacher-registration-title" :aria-busy="loadingInvitation || submitting">
        <header class="teacher-activation-header">
          <span class="teacher-activation-badge"><i class="fas fa-user-check" aria-hidden="true"></i> Account Activation</span>
          <h1 id="teacher-registration-title">{{ completed ? 'Your account is ready' : 'Activate your account' }}</h1>
          <p>Enter your account details and create a password to join EduMatch.</p>
        </header>
        <p v-if="invitation && !invitationError && !completed" class="teacher-department-note"><i class="fas fa-lock" aria-hidden="true"></i> Teacher registration · {{ invitation.department }}</p>
          <div v-if="loadingInvitation" class="loading-state" role="status">
            <i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Checking your invitation…
          </div>

          <div v-else-if="invitationError" class="invitation-error">
            <span class="state-icon"><i class="fas fa-envelope-open" aria-hidden="true"></i></span>
            <h2>{{ invitationUnavailable ? 'Invitation unavailable' : 'Unable to open invitation' }}</h2>
            <p role="alert">{{ invitationError }}</p>
            <p v-if="invitationUnavailable">Ask your Head Teacher for a new invitation link.</p>
            <button v-else type="button" class="primary-button" @click="loadInvitation">Try again</button>
            <RouterLink to="/auth/login" class="text-link">Return to sign in</RouterLink>
          </div>

          <div v-else-if="completed" class="success-state" role="status">
            <span class="state-icon success-icon"><i class="fas fa-check" aria-hidden="true"></i></span>
            <h2>Your teacher account is ready</h2>
            <p><strong>{{ registeredTeacher.name }}</strong>, your account is active{{ registeredTeacher.department ? ` in ${registeredTeacher.department}` : '' }}.</p>
            <p>Sign in with <strong>{{ username.trim() }}</strong> and your new password.</p>
            <RouterLink to="/auth/login" class="primary-button">Sign in to EduMatch</RouterLink>
          </div>

          <form v-else-if="invitation" class="registration-form" @submit.prevent="registerTeacher">
            <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>
            <div class="name-grid">
              <div class="form-field">
                <label for="teacher-first-name"><i class="fas fa-user" aria-hidden="true"></i> First Name</label>
                <input id="teacher-first-name" v-model="firstName" type="text" required maxlength="50" autocomplete="given-name" :disabled="submitting" :aria-invalid="Boolean(firstName && !validFirstName)" aria-describedby="teacher-name-hint" />
              </div>
              <div class="form-field">
                <label for="teacher-last-name"><i class="fas fa-user" aria-hidden="true"></i> Last Name</label>
                <input id="teacher-last-name" v-model="lastName" type="text" required maxlength="50" autocomplete="family-name" :disabled="submitting" :aria-invalid="Boolean(lastName && !validLastName)" aria-describedby="teacher-name-hint" />
              </div>
              <small id="teacher-name-hint" class="name-hint" :class="{ invalid: nameHintInvalid }">Each name uses letters, spaces, hyphens, or apostrophes.</small>
            </div>

            <div class="form-field">
              <label for="teacher-email"><i class="fas fa-at" aria-hidden="true"></i> Email Address</label>
              <input id="teacher-email" v-model="email" type="email" required maxlength="254" autocomplete="email" :readonly="emailIsBound" :disabled="submitting || sendingCode || verifyingEmail" :aria-invalid="Boolean(email && !validEmail)" aria-describedby="teacher-email-hint" />
              <small id="teacher-email-hint">{{ emailIsBound ? 'This invitation is assigned to this email address. Verify it to continue.' : 'Enter your own school email address. We will send you a verification code.' }}</small>
            </div>

            <section class="email-verification" aria-labelledby="email-verification-title" :aria-busy="sendingCode || verifyingEmail">
              <div class="verification-heading">
                <h2 id="email-verification-title"><i :class="emailVerified ? 'fas fa-circle-check' : 'fas fa-envelope'" aria-hidden="true"></i> {{ emailVerified ? 'Email verified' : 'Verify your email' }}</h2>
                <span v-if="emailVerified" class="verified-label">Verified</span>
              </div>
              <p v-if="emailVerified">Your email is confirmed. Complete your account details below.</p>
              <template v-else>
                <p>Confirm your email before creating your account.</p>
                <button type="button" class="secondary-button" :disabled="!validEmail || sendingCode || verifyingEmail || submitting || resendSeconds > 0" @click="sendEmailCode">
                  {{ sendingCode ? 'Sending code…' : resendSeconds > 0 ? `Resend in ${resendSeconds}s` : codeSent ? 'Resend verification code' : 'Send verification code' }}
                </button>
                <div v-if="codeSent" class="code-entry">
                  <div class="form-field">
                    <label for="teacher-email-code">6-digit verification code</label>
                    <input id="teacher-email-code" v-model="emailCode" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" :disabled="verifyingEmail || sendingCode || submitting || codeExpired" aria-describedby="teacher-code-hint" />
                    <small id="teacher-code-hint" :class="{ invalid: codeExpired }">{{ codeExpired ? 'This code has expired. Request a new code.' : `Check your inbox and spam folder. Code expires in ${codeTimeRemaining}.` }}</small>
                  </div>
                  <button type="button" class="primary-button" :disabled="!/^\d{6}$/.test(emailCode.trim()) || codeExpired || sendingCode || verifyingEmail || submitting" @click="verifyEmail">
                    {{ verifyingEmail ? 'Verifying…' : 'Verify email' }}
                  </button>
                </div>
              </template>
              <p v-if="emailMessage" class="verification-message" role="status" aria-live="polite">{{ emailMessage }}</p>
              <p v-if="emailError" class="invalid" role="alert">{{ emailError }}</p>
            </section>

            <div class="form-field">
              <label for="teacher-username"><i class="fas fa-id-badge" aria-hidden="true"></i> Username</label>
              <input id="teacher-username" v-model="username" type="text" required minlength="3" maxlength="30" autocomplete="username" autocapitalize="none" spellcheck="false" :disabled="submitting" :aria-invalid="['unavailable', 'invalid'].includes(usernameStatus)" aria-describedby="teacher-username-feedback" />
              <small id="teacher-username-feedback" class="username-feedback" :class="{ available: usernameStatus === 'available', invalid: ['unavailable', 'invalid', 'error'].includes(usernameStatus) }" role="status" aria-live="polite">
                <i v-if="usernameStatus === 'checking'" class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>{{ usernameFeedback }}
              </small>
              <button v-if="usernameStatus === 'error'" type="button" class="text-button" :disabled="submitting" @click="checkUsername">Check again</button>
              <div v-if="usernameSuggestions.length" class="username-suggestions" aria-label="Alternative usernames">
                <small>Try a suggested username:</small>
                <button v-for="suggestion in usernameSuggestions" :key="suggestion" type="button" :disabled="submitting" @click="username = suggestion">{{ suggestion }}</button>
              </div>
            </div>

            <div class="password-grid">
              <div class="form-field">
                <label for="teacher-password"><i class="fas fa-lock" aria-hidden="true"></i> Password</label>
                <div class="password-field">
                  <input id="teacher-password" v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="8" maxlength="16" autocomplete="new-password" :disabled="submitting" aria-describedby="teacher-password-hint" />
                  <button type="button" :aria-label="showPassword ? 'Hide passwords' : 'Show passwords'" :aria-pressed="showPassword" :disabled="submitting" @click="showPassword = !showPassword"><i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" aria-hidden="true"></i></button>
                </div>
              </div>
              <div class="form-field">
                <label for="teacher-confirm-password"><i class="fas fa-lock" aria-hidden="true"></i> Confirm Password</label>
                <input id="teacher-confirm-password" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" required minlength="8" maxlength="16" autocomplete="new-password" :disabled="submitting" :aria-invalid="Boolean(confirmPassword && confirmPassword !== password)" aria-describedby="teacher-password-match" />
                <small v-if="confirmPassword && confirmPassword !== password" id="teacher-password-match" class="invalid">Passwords do not match.</small>
              </div>
              <small id="teacher-password-hint" class="password-hint">8–16 characters, with uppercase and lowercase letters and a number.</small>
            </div>

            <button type="submit" class="primary-button create-account" :disabled="!canRegister">
              <i v-if="!submitting" class="fas fa-key" aria-hidden="true"></i>{{ submitting ? 'Activating...' : 'Activate Account' }}
            </button>
            <p v-if="!emailVerified" class="verification-reminder">Verify your email to enable account creation.</p>
          </form>
        <footer v-if="!completed && !invitationError" class="registration-footer">Already have an account? <RouterLink to="/auth/login">Sign in</RouterLink></footer>
      </section>
    </template>
  </LoginView>
</template>

<script setup>
import LoginView from './LoginView.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { resolveApiBaseUrl } from '../../stores/auth'
import { isValidTeacherEmail } from '../../utils/emailPolicy.js'

const route = useRoute()
const invitation = ref(null)
const loadingInvitation = ref(false)
const invitationError = ref('')
const invitationUnavailable = ref(false)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const completed = ref(false)
const registeredTeacher = ref({})
const formError = ref('')
const emailCode = ref('')
const verificationToken = ref('')
const verifiedEmail = ref('')
const verificationExpiresAt = ref(0)
const sendingCode = ref(false)
const verifyingEmail = ref(false)
const emailMessage = ref('')
const emailError = ref('')
const codeSent = ref(false)
const codeExpiresAt = ref(0)
const resendAvailableAt = ref(0)
const usernameStatus = ref('idle')
const usernameMessage = ref('')
const checkedUsername = ref('')
const usernameSuggestions = ref([])
const now = ref(Date.now())
const controllers = new Map()
let sessionId = 0
let emailRequestId = 0
let usernameRequestId = 0
let usernameTimer = null
let disposed = false
const clockTimer = window.setInterval(() => { now.value = Date.now() }, 1000)
const namePattern = /^[\p{L}\p{M} '’\-]+$/u
const usernamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$/
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/
const isGroupInvitation = computed(() => invitation.value?.isGroup === true)
const emailIsBound = computed(() => !isGroupInvitation.value && Boolean(invitation.value?.email))
const normalizedEmail = computed(() => email.value.trim().toLowerCase())
const validEmail = computed(() => isValidTeacherEmail(email.value))
const validFirstName = computed(() => Boolean(firstName.value.trim()) && firstName.value.trim().length <= 50 && namePattern.test(firstName.value.trim()) && /\p{L}/u.test(firstName.value))
const validLastName = computed(() => Boolean(lastName.value.trim()) && lastName.value.trim().length <= 50 && namePattern.test(lastName.value.trim()) && /\p{L}/u.test(lastName.value))
const fullName = computed(() => `${firstName.value.trim()} ${lastName.value.trim()}`.replace(/\s+/g, ' ').trim())
const validName = computed(() => validFirstName.value && validLastName.value && fullName.value.length <= 100)
const nameHintInvalid = computed(() => (Boolean(firstName.value) && !validFirstName.value) || (Boolean(lastName.value) && !validLastName.value))
const invitationPath = computed(() => `${resolveApiBaseUrl()}/auth/teacher-invitations/${encodeURIComponent(String(route.params.token || ''))}`)
const usernameAvailable = computed(() => usernameStatus.value === 'available' && checkedUsername.value === username.value.trim().toLowerCase())
const emailVerified = computed(() => Boolean(verificationToken.value) && verifiedEmail.value === normalizedEmail.value && verificationExpiresAt.value > now.value)
const codeExpired = computed(() => codeSent.value && codeExpiresAt.value <= now.value)
const resendSeconds = computed(() => Math.max(0, Math.ceil((resendAvailableAt.value - now.value) / 1000)))
const codeTimeRemaining = computed(() => {
  const seconds = Math.max(0, Math.ceil((codeExpiresAt.value - now.value) / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})
const canRegister = computed(() => invitation.value && !invitationError.value && !submitting.value && !sendingCode.value && !verifyingEmail.value && validName.value && validEmail.value && emailVerified.value && usernameAvailable.value && passwordPattern.test(password.value) && password.value === confirmPassword.value)
const usernameFeedback = computed(() => {
  if (usernameStatus.value === 'checking') return 'Checking username availability…'
  if (usernameStatus.value === 'waiting') return 'Waiting to check username…'
  if (usernameStatus.value === 'available') return 'This username is available.'
  return usernameMessage.value || '3–30 characters: letters, numbers, periods, underscores, or hyphens. Uppercase and lowercase versions count as the same username.'
})

function responseMessage(error, fallback) {
  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}

function cancelRequest(key) {
  controllers.get(key)?.abort()
  controllers.delete(key)
}

function requestConfig(key) {
  cancelRequest(key)
  const controller = new AbortController()
  controllers.set(key, controller)
  return { signal: controller.signal, timeout: 20000 }
}

function live(requestSession) {
  return !disposed && requestSession === sessionId
}

function clearSecrets() {
  password.value = ''
  confirmPassword.value = ''
  showPassword.value = false
}

function clearEmailVerification() {
  emailRequestId += 1
  cancelRequest('send-code')
  cancelRequest('verify-email')
  sendingCode.value = false
  verifyingEmail.value = false
  emailCode.value = ''
  verificationToken.value = ''
  verifiedEmail.value = ''
  verificationExpiresAt.value = 0
  codeSent.value = false
  codeExpiresAt.value = 0
  resendAvailableAt.value = 0
  emailMessage.value = ''
  emailError.value = ''
  clearSecrets()
}

function invalidateUsername() {
  clearTimeout(usernameTimer)
  usernameRequestId += 1
  cancelRequest('username')
  usernameStatus.value = 'idle'
  usernameMessage.value = ''
  checkedUsername.value = ''
  usernameSuggestions.value = []
}

function makeInvitationUnavailable(message) {
  invitationUnavailable.value = true
  invitationError.value = message || 'This invitation has expired or is no longer available.'
  clearEmailVerification()
  invalidateUsername()
}

function handleUnavailable(error) {
  const data = error?.response?.data
  const code = String(data?.code || data?.details?.code || '')
  const message = responseMessage(error, '')
  if (code === 'ISSUER_UNAVAILABLE' || /INVITATION_(?:EXPIRED|REVOKED|ACCEPTED|USED|INVALID|NOT_FOUND)/i.test(code) || /invitation.*(?:expired|revoked|accepted|already used|no longer available|invalid)/i.test(message)) {
    makeInvitationUnavailable(message)
    return true
  }
  return false
}

async function loadInvitation() {
  sessionId += 1
  const requestSession = sessionId
  for (const key of controllers.keys()) cancelRequest(key)
  clearEmailVerification()
  invalidateUsername()
  invitation.value = null
  invitationError.value = ''
  invitationUnavailable.value = false
  loadingInvitation.value = true
  completed.value = false
  submitting.value = false
  registeredTeacher.value = {}
  formError.value = ''
  firstName.value = ''
  lastName.value = ''
  email.value = ''
  username.value = ''
  try {
    const { data } = await axios.get(invitationPath.value, requestConfig('invitation'))
    if (!live(requestSession)) return
    if (!data.invitation) throw new Error('Invitation information is missing')
    if (String(data.invitation.status || 'Pending').toLowerCase() !== 'pending') {
      makeInvitationUnavailable('This invitation has already been accepted, expired, or been revoked. Ask your Head Teacher for a new link.')
      return
    }
    invitation.value = data.invitation
    const invitedName = data.invitation.isGroup ? '' : String(data.invitation.name || '').trim()
    firstName.value = invitedName.split(/\s+/)[0] || ''
    lastName.value = invitedName.split(/\s+/).slice(1).join(' ') || ''
    email.value = data.invitation.isGroup ? '' : String(data.invitation.email || '')
  } catch (error) {
    if (!live(requestSession) || axios.isCancel(error)) return
    invitationUnavailable.value = [404, 409, 410].includes(Number(error?.response?.status)) || error?.response?.data?.code === 'ISSUER_UNAVAILABLE'
    invitationError.value = responseMessage(error, 'We could not load your invitation. Check your internet connection and try again.')
  } finally {
    if (live(requestSession)) loadingInvitation.value = false
  }
}

async function sendEmailCode() {
  if (!validEmail.value || !invitation.value || submitting.value || sendingCode.value || verifyingEmail.value || resendSeconds.value > 0) return
  const requestSession = sessionId
  const requestId = ++emailRequestId
  const submittedEmail = email.value.trim()
  sendingCode.value = true
  emailError.value = ''
  emailMessage.value = ''
  verificationToken.value = ''
  verifiedEmail.value = ''
  verificationExpiresAt.value = 0
  emailCode.value = ''
  codeSent.value = false
  codeExpiresAt.value = 0
  try {
    const { data } = await axios.post(`${invitationPath.value}/email-code`, { email: submittedEmail }, requestConfig('send-code'))
    if (!live(requestSession) || requestId !== emailRequestId) return
    const expiresAt = Date.parse(data.verification?.expiresAt)
    if (!Number.isFinite(expiresAt)) throw new Error('Verification information is missing')
    now.value = Date.now()
    codeExpiresAt.value = expiresAt
    resendAvailableAt.value = Date.parse(data.verification?.resendAvailableAt) || now.value
    codeSent.value = true
    emailMessage.value = data.message || 'A verification code has been sent. Check your inbox and spam folder.'
  } catch (error) {
    if (!live(requestSession) || requestId !== emailRequestId || axios.isCancel(error)) return
    if (!handleUnavailable(error)) {
      now.value = Date.now()
      const nextResend = Date.parse(error?.response?.data?.verification?.resendAvailableAt)
      const headers = error?.response?.headers
      const retryAfter = Number(headers?.get?.('retry-after') || headers?.['retry-after'])
      if (Number.isFinite(nextResend)) resendAvailableAt.value = nextResend
      else if (Number.isFinite(retryAfter) && retryAfter > 0) resendAvailableAt.value = now.value + retryAfter * 1000
      emailError.value = responseMessage(error, 'We could not send your verification code. Try again.')
    }
  } finally {
    if (live(requestSession) && requestId === emailRequestId) sendingCode.value = false
  }
}

async function verifyEmail() {
  if (!codeSent.value || codeExpired.value || !/^\d{6}$/.test(emailCode.value.trim()) || sendingCode.value || verifyingEmail.value || submitting.value) return
  const requestSession = sessionId
  const requestId = ++emailRequestId
  const submittedEmail = email.value.trim()
  verifyingEmail.value = true
  emailError.value = ''
  emailMessage.value = ''
  try {
    const { data } = await axios.post(`${invitationPath.value}/verify-email`, { email: submittedEmail, code: emailCode.value.trim() }, requestConfig('verify-email'))
    if (!live(requestSession) || requestId !== emailRequestId) return
    const expiresAt = Date.parse(data.expiresAt)
    if (!data.verificationToken || String(data.verifiedEmail || '').toLowerCase() !== normalizedEmail.value || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error('Verification information is missing')
    verificationToken.value = data.verificationToken
    verifiedEmail.value = String(data.verifiedEmail).toLowerCase()
    verificationExpiresAt.value = expiresAt
    emailCode.value = ''
    emailMessage.value = 'Your email address is verified.'
  } catch (error) {
    if (!live(requestSession) || requestId !== emailRequestId || axios.isCancel(error)) return
    if (!handleUnavailable(error)) emailError.value = responseMessage(error, 'We could not verify that code. Check the code and try again.')
  } finally {
    if (live(requestSession) && requestId === emailRequestId) verifyingEmail.value = false
  }
}

async function checkUsername() {
  clearTimeout(usernameTimer)
  const submittedUsername = username.value.trim()
  if (!usernamePattern.test(submittedUsername) || !invitation.value || invitationError.value || completed.value) return
  const requestSession = sessionId
  const requestId = ++usernameRequestId
  usernameStatus.value = 'checking'
  usernameMessage.value = ''
  usernameSuggestions.value = []
  try {
    const { data } = await axios.get(`${invitationPath.value}/username`, { ...requestConfig('username'), params: { username: submittedUsername } })
    if (!live(requestSession) || requestId !== usernameRequestId || submittedUsername !== username.value.trim()) return
    checkedUsername.value = submittedUsername.toLowerCase()
    usernameStatus.value = data.valid === false ? 'invalid' : data.available ? 'available' : 'unavailable'
    usernameMessage.value = data.message || 'This username is already taken. Choose another username.'
    usernameSuggestions.value = Array.isArray(data.suggestions) ? data.suggestions.filter(suggestion => typeof suggestion === 'string' && usernamePattern.test(suggestion)).slice(0, 5) : []
  } catch (error) {
    if (!live(requestSession) || requestId !== usernameRequestId || axios.isCancel(error)) return
    if (!handleUnavailable(error)) {
      usernameStatus.value = 'error'
      usernameMessage.value = responseMessage(error, 'We could not check username availability. Please try again.')
    }
  }
}

async function registerTeacher() {
  if (submitting.value) return
  formError.value = ''
  if (!validName.value) { formError.value = 'Enter a valid first and last name (up to 100 characters in total).'; return }
  if (!validEmail.value) { formError.value = 'Enter a valid school email address.'; return }
  if (!emailVerified.value) { formError.value = 'Verify your email address before creating your account.'; return }
  if (!usernameAvailable.value) { formError.value = 'Choose a username and wait for its availability check.'; return }
  if (!passwordPattern.test(password.value)) { formError.value = 'Use an 8–16 character password with uppercase and lowercase letters and a number.'; return }
  if (password.value !== confirmPassword.value) { formError.value = 'Your passwords do not match.'; return }
  if (!canRegister.value) return
  const requestSession = sessionId
  submitting.value = true
  try {
    const { data } = await axios.post(`${invitationPath.value}/register`, {
      fullName: fullName.value.trim(), email: email.value.trim(), username: username.value.trim(),
      password: password.value, confirmPassword: confirmPassword.value, verificationToken: verificationToken.value,
    }, requestConfig('register'))
    if (!live(requestSession)) return
    if (!data.registered || !data.user) throw new Error('Registration could not be confirmed')
    registeredTeacher.value = data.user
    completed.value = true
    clearEmailVerification()
    invalidateUsername()
  } catch (error) {
    if (!live(requestSession) || axios.isCancel(error)) return
    if (handleUnavailable(error)) return
    formError.value = responseMessage(error, 'We could not create your account. Check your connection and try again. If your account was already created, sign in instead.')
    if (Number(error?.response?.status) === 409 && /username/i.test(formError.value)) {
      invalidateUsername()
      await checkUsername()
    }
    if (/verification.*(?:expired|invalid)|verify your email/i.test(formError.value)) {
      verificationToken.value = ''
      emailError.value = 'Your email verification has expired. Request a new verification code.'
    }
  } finally {
    if (live(requestSession)) submitting.value = false
  }
}

function formatExpiry(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'soon' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

watch(email, clearEmailVerification, { flush: 'sync' })
watch(username, () => {
  invalidateUsername()
  if (!username.value.trim() || !invitation.value || invitationError.value || completed.value) return
  if (!usernamePattern.test(username.value.trim())) {
    usernameStatus.value = 'invalid'
    usernameMessage.value = 'Use 3–30 characters, starting with a letter or number. Only letters, numbers, periods, underscores, and hyphens are allowed.'
    return
  }
  usernameStatus.value = 'waiting'
  usernameTimer = window.setTimeout(checkUsername, 400)
}, { flush: 'sync' })
watch(now, () => {
  if (completed.value || loadingInvitation.value || invitationError.value || !invitation.value || submitting.value) return
  const expiresAt = Date.parse(invitation.value.expiresAt)
  if (Number.isFinite(expiresAt) && expiresAt <= now.value) makeInvitationUnavailable('This invitation has expired. Ask your Head Teacher for a new link.')
  else if (verificationToken.value && verificationExpiresAt.value <= now.value) {
    verificationToken.value = ''
    emailMessage.value = ''
    emailError.value = 'Your email verification has expired. Request a new verification code.'
  }
})
watch(() => route.params.token, loadInvitation, { immediate: true })

onBeforeUnmount(() => {
  disposed = true
  sessionId += 1
  emailRequestId += 1
  usernameRequestId += 1
  clearTimeout(usernameTimer)
  window.clearInterval(clockTimer)
  for (const key of controllers.keys()) cancelRequest(key)
  clearSecrets()
  verificationToken.value = ''
  emailCode.value = ''
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";
.teacher-registration { @apply tw:[min-height:100dvh] tw:[padding:40px_20px] tw:[background:radial-gradient(ellipse_at_top,_#eaf5e7,_#f6f9f4_65%)] tw:[color:#182b21] tw:[font-family:'Inter',_'Segoe_UI',_sans-serif]; }
.teacher-registration *, .teacher-registration *::before, .teacher-registration *::after { @apply tw:box-border; }
.registration-shell { @apply tw:[max-width:1000px] tw:[margin:0_auto]; }
.registration-brand { @apply tw:flex tw:items-center tw:w-fit tw:[gap:12px] tw:[margin:0_auto_26px] tw:[font-size:23px] tw:[font-weight:750] tw:[text-decoration:none] tw:[color:#1d3826]; }
.registration-brand small { @apply tw:block tw:[margin-top:2px] tw:[font-size:12px] tw:[font-weight:500] tw:[color:#657869]; }
.brand-mark { @apply tw:grid tw:place-items-center tw:[width:49px] tw:[height:49px] tw:[border:1px_solid_#cbdcc7] tw:[background:#fff] tw:[border-radius:16px] tw:[font-size:24px] tw:[color:#4e873e]; }
.registration-card { @apply tw:[padding:32px] tw:[background:#fff] tw:[border:1px_solid_#d9e7d5] tw:[border-radius:20px] tw:[box-shadow:0_18px_45px_#2448200b]; @apply tw:grid tw:[grid-template-columns:minmax(260px,0.85fr)_minmax(0,1.3fr)] tw:[gap:0_2.4rem]; }
.registration-aside { @apply tw:[padding-top:6px] tw:[border-right:1px_solid_#eaf0e6] tw:[padding-right:2.4rem]; }
.registration-main { @apply tw:[min-width:0]; }
.registration-card > .registration-footer { @apply tw:[grid-column:1/-1]; }
.eyebrow { @apply tw:[margin:0_0_8px] tw:[color:#4a7b36] tw:[font-size:10px] tw:[font-weight:800] tw:[letter-spacing:1.5px]; }
h1 { @apply tw:[margin:0] tw:[font-size:27px] tw:[line-height:1.3] tw:[font-weight:750]; }
h2 { @apply tw:[font-size:20px] tw:[margin:18px_0_12px]; }
.intro { @apply tw:[margin:10px_0_0] tw:[color:#647368] tw:[font-size:14px] tw:[line-height:1.6]; }
.assignment-card { @apply tw:flex tw:items-center tw:flex-wrap tw:[gap:12px] tw:[margin:24px_0] tw:[padding:16px] tw:[border:1px_solid_#d9e8d3] tw:[border-radius:12px] tw:[background:#f5faf1]; }
.assignment-icon { @apply tw:grid tw:place-items-center tw:shrink-0 tw:[width:38px] tw:[height:38px] tw:[border-radius:10px] tw:[background:#e6f0df] tw:[color:#4b7d39] tw:[font-size:19px]; }
.assignment-card > div { @apply tw:[flex:1] tw:[min-width:120px]; }
.assignment-card strong { @apply tw:block tw:[font-size:14px] tw:[overflow-wrap:anywhere]; }
.assignment-card small { @apply tw:block tw:[margin-top:5px] tw:[font-size:12px] tw:[line-height:1.5] tw:[color:#677960] tw:[overflow-wrap:anywhere]; }
.verified-invitation { @apply tw:flex tw:items-center tw:[gap:5px] tw:[font-size:10px] tw:[font-weight:650] tw:[color:#416d34]; }
.registration-form { @apply tw:grid tw:[gap:20px]; }
.name-grid { @apply tw:grid tw:[grid-template-columns:1fr_1fr] tw:[gap:10px_16px]; }
.name-grid .name-hint { @apply tw:[grid-column:1/-1] tw:[margin-top:-4px]; }
.form-field { @apply tw:grid tw:[gap:7px] tw:content-start; }
.form-field label { @apply tw:[font-size:13px] tw:[color:#263d2c] tw:[font-weight:650]; }
.form-field input { @apply tw:block tw:w-full tw:[min-width:0] tw:[min-height:46px] tw:[padding:11px_13px] tw:[border:1px_solid_#cddccb] tw:[border-radius:9px] tw:[background:#fff] tw:[color:#203127] tw:[font:inherit] tw:[font-size:14px]; }
.form-field input[readonly] { @apply tw:[background:#f5f7f3] tw:[color:#52624d]; }
.teacher-registration :is(input, button, a):focus-visible { @apply tw:[outline:3px_solid_#609e46] tw:[outline-offset:3px]; }
.form-field input:focus { @apply tw:[border-color:#609e46]; }
.form-field input[aria-invalid='true'] { @apply tw:[border-color:#c14d45]; }
.form-field small, .password-hint { @apply tw:[color:#69776d] tw:[font-size:11px] tw:[line-height:1.6]; }
.teacher-registration .invalid { @apply tw:[color:#a13b30]; }
.teacher-registration .available { @apply tw:[color:#36762e]; }
.email-verification { @apply tw:grid tw:[gap:12px] tw:[padding:18px] tw:[border:1px_solid_#dce7d7] tw:[border-radius:12px] tw:[background:#fafcf8]; }
.verification-heading { @apply tw:flex tw:items-center tw:justify-between tw:[gap:8px]; }
.verification-heading h2 { @apply tw:flex tw:items-center tw:[gap:8px] tw:[margin:0] tw:[font-size:13px] tw:[color:#3e6634] tw:[font-weight:650]; }
.verified-label { @apply tw:[padding:4px_7px] tw:[border-radius:5px] tw:[background:#e4f2db] tw:[color:#39722c] tw:[font-size:10px] tw:[font-weight:700]; }
.email-verification p { @apply tw:[margin:0] tw:[font-size:12px] tw:[line-height:1.6] tw:[color:#697665] tw:[overflow-wrap:anywhere]; }
.email-verification .verification-message { @apply tw:[color:#427433]; }
.code-entry { @apply tw:grid tw:[gap:12px]; }
.code-entry input { @apply tw:[letter-spacing:4px] tw:[font-weight:600]; }
.username-feedback { @apply tw:[min-height:17px]; }
.username-feedback i { @apply tw:[margin-right:7px]; }
.primary-button, .secondary-button { @apply tw:flex tw:justify-center tw:items-center tw:[gap:10px] tw:w-full tw:[min-height:46px] tw:[border-radius:9px] tw:[padding:11px_15px] tw:[border:1px_solid_#50823d] tw:[background:#50863f] tw:[color:#fff] tw:[font:inherit] tw:[font-size:13px] tw:[font-weight:650] tw:text-center tw:[text-decoration:none] tw:cursor-pointer; }
.primary-button:hover:enabled { @apply tw:[background:#427133]; }
.secondary-button { @apply tw:[background:#fff] tw:[border-color:#cbdcc4] tw:[color:#3d6338]; }
.secondary-button:hover:enabled { @apply tw:[background:#f1f7ec]; }
.teacher-registration button:disabled, .teacher-registration input:disabled { @apply tw:cursor-default tw:[opacity:.58]; }
.teacher-registration button { @apply tw:[font-family:inherit]; }
.password-grid { @apply tw:grid tw:[grid-template-columns:1fr_1fr] tw:[gap:10px_16px]; }
.password-hint { @apply tw:[grid-column:1/-1]; }
.password-field { @apply tw:relative; }
.password-field input { @apply tw:[padding-right:45px]; }
.password-field button { @apply tw:absolute tw:[right:3px] tw:[top:3px] tw:[width:40px] tw:[height:40px] tw:[border:0] tw:[border-radius:7px] tw:[background:transparent] tw:[color:#6b7e66] tw:cursor-pointer; }
.text-button { @apply tw:w-fit tw:[border:0] tw:[padding:4px_0] tw:[background:transparent] tw:[color:#426f35] tw:[font-size:12px] tw:[font-weight:600] tw:cursor-pointer tw:underline tw:[text-underline-offset:3px]; }
.username-suggestions { @apply tw:flex tw:flex-wrap tw:[gap:6px] tw:[margin-top:3px]; }
.username-suggestions small { @apply tw:[flex-basis:100%]; }
.username-suggestions button { @apply tw:max-w-full tw:[overflow-wrap:anywhere] tw:[padding:6px_10px] tw:[border:1px_solid_#d1dfca] tw:[border-radius:7px] tw:[color:#3d6935] tw:[background:#f5f9f1] tw:cursor-pointer tw:[font-size:12px]; }
.form-error { @apply tw:[padding:12px_14px] tw:[margin-bottom:18px] tw:[border:1px_solid_#edd6cc] tw:[border-radius:9px] tw:[background:#fff5f0] tw:[color:#913d2d] tw:[font-size:13px] tw:[line-height:1.6]; }
.assignment-note { @apply tw:[margin:0] tw:flex tw:items-start tw:[gap:9px] tw:[color:#6d786e] tw:[font-size:11px] tw:[line-height:1.6]; }
.assignment-note i { @apply tw:[margin-top:3px] tw:[color:#64805a]; }
.verification-reminder { @apply tw:[margin:-9px_0_0] tw:[color:#6d786e] tw:[font-size:11px] tw:text-center tw:[line-height:1.6]; }
.registration-footer { @apply tw:[margin-top:24px] tw:[padding-top:19px] tw:[border-top:1px_solid_#eaf0e7] tw:[color:#73806f] tw:[font-size:12px] tw:text-center; }
.registration-footer a, .text-link { @apply tw:[color:#427433] tw:[font-weight:600] tw:underline tw:[text-underline-offset:3px]; }
.registration-help { @apply tw:[margin:19px_auto_0] tw:[padding:0_14px] tw:[color:#6e7c69] tw:[font-size:11px] tw:text-center tw:[line-height:1.6]; }
.invitation-expiry { @apply tw:[margin:22px_0_0] tw:[color:#74816e] tw:[font-size:11px] tw:text-center tw:[line-height:1.6]; }
.invitation-expiry i { @apply tw:[margin-right:5px]; }
.loading-state { @apply tw:flex tw:items-center tw:justify-center tw:[gap:10px] tw:[padding:40px_0] tw:[color:#527c45] tw:[font-size:14px]; }
.invitation-error, .success-state { @apply tw:[padding-top:25px] tw:text-center; }
.invitation-error p, .success-state p { @apply tw:[font-size:14px] tw:[line-height:1.7] tw:[color:#647267] tw:[overflow-wrap:anywhere]; }
.success-state .primary-button, .invitation-error .primary-button { @apply tw:[margin-top:24px]; }
.invitation-error .text-link { @apply tw:inline-block tw:[margin-top:20px] tw:[font-size:13px]; }
.state-icon { @apply tw:grid tw:place-items-center tw:[width:60px] tw:[height:60px] tw:[margin:0_auto] tw:[border-radius:50%] tw:[background:#f2f6ef] tw:[color:#6a8660] tw:[font-size:23px]; }
.success-icon { @apply tw:[background:#eaf5e2] tw:[color:#4b8737]; }
@media (max-width: 540px) {
  .teacher-registration { @apply tw:[padding:24px_12px]; }
  .registration-brand { @apply tw:[margin-bottom:20px]; }
  .registration-card { @apply tw:[padding:25px_20px] tw:[border-radius:16px] tw:[grid-template-columns:1fr]; }
  .registration-aside { @apply tw:[border-right:0] tw:[padding-right:0] tw:[padding-bottom:4px]; }
  h1 { @apply tw:[font-size:24px]; }
  .assignment-card { @apply tw:[padding:14px]; }
  .verified-invitation { @apply tw:[flex-basis:100%] tw:[padding-left:50px]; }
  .name-grid, .password-grid { @apply tw:[grid-template-columns:1fr] tw:[gap:18px]; }
  .password-hint, .name-grid .name-hint { @apply tw:[margin-top:-8px]; }
  .email-verification { @apply tw:[padding:15px]; }
}
@media (min-width: 541px) and (max-width: 860px) {
  .registration-card { @apply tw:[grid-template-columns:1fr]; }
  .registration-aside { @apply tw:[border-right:0] tw:[border-bottom:1px_solid_#eaf0e6] tw:[padding-right:0] tw:[padding-bottom:20px]; }
}
@media (prefers-reduced-motion: reduce) { .fa-spin { @apply tw:animate-none; } }
.teacher-registration-content { min-width: 0; color: #111; }
.teacher-activation-header { margin-bottom: 1rem; padding-bottom: .5rem; border-bottom: 1px solid #e5e7eb; }
.teacher-activation-badge { display: inline-flex; align-items: center; gap: .45rem; padding: .4rem .65rem; border: 1px solid #d4e4c5; border-radius: 999px; background: linear-gradient(135deg, #e6e9e1, #efffdc); color: #1e4307; font-size: .7rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.teacher-activation-badge i { color: #69aa47; }
.teacher-activation-header h1 { margin: .5rem 0 .35rem; font-size: 1.9rem; font-weight: 750; line-height: 1.15; letter-spacing: -.045em; }
.teacher-activation-header p, .teacher-department-note { margin: 0; color: #526170; font-size: .8rem; line-height: 1.5; }
.teacher-department-note { margin-bottom: 1rem; }
.teacher-department-note i { margin-right: .3rem; color: #69aa47; }
.teacher-registration-content .registration-form { gap: .85rem; }
.teacher-registration-content .name-grid, .teacher-registration-content .password-grid { grid-template-columns: minmax(0, 1fr); gap: .85rem; }
.teacher-registration-content .form-field { min-width: 0; gap: .25rem; }
.teacher-registration-content .form-field label { color: #111; font-size: .82rem; font-weight: 700; }
.teacher-registration-content .form-field label i { color: #69aa47; margin-right: .3rem; }
.teacher-registration-content .form-field input { box-sizing: border-box; min-height: 40px; padding: .52rem 1rem; border: 2px solid #e5e7eb; border-radius: 12px; color: #111; font-size: .95rem; }
.teacher-registration-content .form-field input:focus { outline: none; border-color: #69aa47; box-shadow: 0 0 0 4px rgba(105, 170, 71, .16); }
.teacher-registration-content .form-field input::placeholder { color: #9ca3af; }
.teacher-registration-content .primary-button { border: 0; border-radius: 12px; background: linear-gradient(135deg, #69aa47, #3f7f2a); color: #fff; font-size: .95rem; font-weight: 700; box-shadow: 0 8px 18px rgba(63, 127, 42, .15); }
.teacher-registration-content .primary-button:hover:enabled { background: linear-gradient(135deg, #58983b, #326b21); }
.teacher-registration-content .email-verification { padding: .85rem; gap: .65rem; background: #f8fcf5; }
.teacher-registration-content .password-field input { padding-right: 45px; }
.teacher-registration-content .password-field button { top: 0; right: 3px; }
.teacher-registration-content .invalid { color: #a13b30; }
.teacher-registration-content .available { color: #36762e; }
.teacher-registration-content button:disabled, .teacher-registration-content input:disabled { opacity: .58; cursor: not-allowed; }
@media (max-width: 600px) { .teacher-activation-header h1 { font-size: 1.6rem; } }
</style>
