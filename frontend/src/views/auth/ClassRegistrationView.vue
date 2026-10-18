<template>
  <main class="class-registration">
    <div class="registration-layout">
      <section class="registration-form-panel">
        <div class="registration-panel-geometry" aria-hidden="true">
          <span class="registration-panel-shape registration-panel-shape-top"></span>
          <span class="registration-panel-shape registration-panel-shape-bottom"></span>
        </div>
        <div class="registration-shell">
      <RouterLink to="/auth/login" class="registration-brand" aria-label="EduMatch sign in">
        <span class="brand-mark"><img src="/logo.png" alt="" /></span>
        <span>EduMatch<small>Student registration</small></span>
      </RouterLink>

      <section class="registration-card" aria-labelledby="registration-title" :aria-busy="loadingInvitation || verifying || submitting">
        <header>
          <p class="eyebrow">CLASS INVITATION</p>
          <h1 id="registration-title">{{ completed ? 'Welcome to your class' : 'Join your class' }}</h1>
          <p v-if="invitation" class="class-name">{{ invitation.className }}</p>
          <p v-else class="intro">Use the class invitation your teacher shared with you.</p>
        </header>

        <div v-if="loadingInvitation" class="loading-state" role="status">
          <i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Checking your invitation…
        </div>

        <div v-else-if="invitationError" class="invitation-error">
          <span class="state-icon"><i class="fas fa-envelope-open" aria-hidden="true"></i></span>
          <h2>{{ invitationUnavailable ? 'Invitation unavailable' : 'Unable to open invitation' }}</h2>
          <p role="alert">{{ invitationError }}</p>
          <p v-if="invitationUnavailable">Ask your teacher for a new invitation link for your class.</p>
          <button v-else type="button" class="primary-button" @click="loadInvitation">Try again</button>
          <RouterLink to="/auth/login" class="text-link">Return to sign in</RouterLink>
        </div>

        <div v-else-if="completed" class="success-state" role="status">
          <span class="state-icon success-icon"><i class="fas fa-check" aria-hidden="true"></i></span>
          <h2>Your account is ready</h2>
          <p><strong>{{ registeredStudent.fullName }}</strong>, you are enrolled in <strong>{{ invitation.className }}</strong>.</p>
          <p v-if="registeredStudent.section">Section: <strong>{{ registeredStudent.section }}</strong></p>
          <p>Sign in with <strong>{{ username.trim() }}</strong> and your new password to start learning.</p>
          <RouterLink to="/auth/login" class="primary-button">Sign in to EduMatch</RouterLink>
        </div>

        <template v-else-if="invitation">
          <ol class="registration-steps" aria-label="Registration progress">
            <li :class="{ current: step === 'verify', done: step === 'account' }" :aria-current="step === 'verify' ? 'step' : undefined"><span>1</span> Verify your name</li>
            <li :class="{ current: step === 'account' }" :aria-current="step === 'account' ? 'step' : undefined"><span>2</span> Create your account</li>
          </ol>

          <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>
          <div v-if="alreadyRegistered" class="registered-guidance">
            <RouterLink to="/auth/login">Sign in to your account</RouterLink>
            <RouterLink to="/auth/forgot-password">Reset your password</RouterLink>
            <p>Ask your teacher for help if you have not created an account.</p>
          </div>

          <form v-if="step === 'verify'" class="registration-form" @submit.prevent="verifyStudent">
            <p class="form-description">Enter the first and last name on your teacher’s class list to continue.</p>
            <div class="name-grid">
              <div class="form-field">
                <label for="student-first-name">First name</label>
                <input id="student-first-name" v-model="firstName" type="text" required maxlength="75" autocomplete="given-name" :disabled="verifying" aria-describedby="name-hint" />
              </div>
              <div class="form-field">
                <label for="student-last-name">Last name</label>
                <input id="student-last-name" v-model="lastName" type="text" required maxlength="75" autocomplete="family-name" :disabled="verifying" aria-describedby="name-hint" />
              </div>
              <small id="name-hint">Spelling must match the class list; capitalization and extra spaces do not matter.</small>
            </div>
            <button type="submit" class="primary-button" :disabled="verifying || !firstName.trim() || !lastName.trim()">
              {{ verifying ? 'Verifying…' : 'Verify and continue' }}<i v-if="!verifying" class="fas fa-arrow-right" aria-hidden="true"></i>
            </button>
          </form>

          <form v-else class="registration-form" @submit.prevent="registerStudent">
            <div class="verified-student">
              <i class="fas fa-circle-check" aria-hidden="true"></i>
              <div><strong>{{ verifiedStudent.fullName }}</strong><small>{{ verifiedStudent.section ? `Section ${verifiedStudent.section}` : 'Your class enrollment is confirmed' }}</small></div>
              <button type="button" class="text-button" :disabled="submitting" @click="backToVerification">Change</button>
            </div>
            <div class="form-field">
              <label for="student-email">Gmail address</label>
              <input id="student-email" v-model="email" type="email" required maxlength="254" autocomplete="email" placeholder="yourname@gmail.com" :disabled="submitting" aria-describedby="email-hint" />
              <small id="email-hint">Use your own Gmail address for account recovery.</small>
            </div>
            <div class="form-field">
              <label for="student-username">Username</label>
              <input id="student-username" v-model="username" type="text" required maxlength="30" autocomplete="username" autocapitalize="none" spellcheck="false" :disabled="submitting" :aria-invalid="usernameStatus === 'unavailable' || usernameStatus === 'invalid'" aria-describedby="username-feedback" />
              <small id="username-feedback" class="username-feedback" :class="{ available: usernameStatus === 'available', invalid: ['unavailable', 'invalid', 'error'].includes(usernameStatus) }" role="status" aria-live="polite">
                <i v-if="usernameStatus === 'checking'" class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>{{ usernameFeedback }}
              </small>
              <div v-if="usernameStatus === 'error'" class="availability-retry"><button type="button" class="text-button" :disabled="submitting" @click="checkUsername">Check again</button></div>
              <div v-if="usernameSuggestions.length" class="username-suggestions" aria-label="Alternative usernames">
                <small>Try an available suggestion:</small>
                <button v-for="suggestion in usernameSuggestions" :key="suggestion" type="button" :disabled="submitting" @click="username = suggestion">{{ suggestion }}</button>
              </div>
            </div>
            <div class="form-field">
              <label for="student-password">Password</label>
              <div class="password-field">
                <input id="student-password" v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="8" maxlength="16" autocomplete="new-password" :disabled="submitting" aria-describedby="password-hint" />
                <button type="button" :aria-label="showPassword ? 'Hide password' : 'Show password'" :disabled="submitting" @click="showPassword = !showPassword"><i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" aria-hidden="true"></i></button>
              </div>
              <small id="password-hint">8–16 characters, with uppercase and lowercase letters and a number.</small>
            </div>
            <div class="form-field">
              <label for="student-confirm-password">Confirm password</label>
              <input id="student-confirm-password" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" required minlength="8" maxlength="16" autocomplete="new-password" :disabled="submitting" :aria-invalid="Boolean(confirmPassword && confirmPassword !== password)" aria-describedby="password-match" />
              <small v-if="confirmPassword && confirmPassword !== password" id="password-match" class="invalid">Passwords do not match.</small>
            </div>
            <p class="enrollment-note"><i class="fas fa-lock" aria-hidden="true"></i> Your account will be assigned to the class and section on your teacher’s list.</p>
            <button type="submit" class="primary-button" :disabled="submitting || alreadyRegistered || !usernameCheckedAndAvailable">
              {{ submitting ? 'Creating your account…' : 'Create account and join class' }}
            </button>
            <button type="button" class="secondary-button" :disabled="submitting" @click="backToVerification">Back to verification</button>
          </form>
          <p v-if="invitation.expiresAt" class="invitation-expiry">Invitation expires {{ formatExpiry(invitation.expiresAt) }}</p>
        </template>

        <footer v-if="!completed && !invitationError" class="registration-footer">Already have an account? <RouterLink to="/auth/login">Sign in</RouterLink></footer>
      </section>
      <p class="registration-help">Your teacher can help if your full name does not match the class list.</p>
        </div>
      </section>

      <aside class="registration-design-panel" aria-label="EduMatch student registration">
        <span class="registration-design-shape registration-design-shape-top" aria-hidden="true"></span>
        <span class="registration-design-shape registration-design-shape-bottom" aria-hidden="true"></span>
        <div class="registration-design-content">
          <div class="registration-design-heading">
            <h2>Join your class and start learning with EduMatch.</h2>
            <img src="/logo.png" alt="EduMatch Logo" class="registration-design-logo" />
          </div>
          <p>Verify your place on the class list, create your student account, and enter a learning workspace built around your progress.</p>
        </div>
      </aside>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { resolveApiBaseUrl } from '../../stores/auth'

const route = useRoute()
const invitation = ref(null)
const loadingInvitation = ref(false)
const invitationError = ref('')
const invitationUnavailable = ref(false)
const step = ref('verify')
const firstName = ref('')
const lastName = ref('')
const fullName = computed(() => `${firstName.value.trim()} ${lastName.value.trim()}`.replace(/\s+/g, ' ').trim())
const verifiedStudent = ref(null)
const registeredStudent = ref({})
const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const verifying = ref(false)
const submitting = ref(false)
const completed = ref(false)
const formError = ref('')
const alreadyRegistered = ref(false)
const usernameStatus = ref('idle')
const usernameMessage = ref('')
const checkedUsername = ref('')
const usernameSuggestions = ref([])
let usernameTimer = null
let usernameRequestId = 0
let invitationRequestId = 0
let verificationRequestId = 0
let usernameController = null
let invitationController = null
let disposed = false

const invitationPath = computed(() => `${resolveApiBaseUrl()}/auth/class-invitations/${encodeURIComponent(String(route.params.token || ''))}`)
const usernameCheckedAndAvailable = computed(() => usernameStatus.value === 'available' && checkedUsername.value === username.value.trim() && Boolean(checkedUsername.value))
const usernameFeedback = computed(() => {
  if (usernameStatus.value === 'checking') return 'Checking username availability…'
  if (usernameStatus.value === 'waiting') return 'Waiting to check username…'
  if (usernameStatus.value === 'available') return 'This username is available.'
  return usernameMessage.value || 'Choose a unique username. Uppercase and lowercase versions count as the same username.'
})
const gmailPattern = /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@gmail\.com$/i

function responseMessage(error, fallback) {
  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}

function isUnavailableInvitation(error) {
  return [404, 410].includes(Number(error?.response?.status))
}

function studentAlreadyRegistered(error) {
  const data = error?.response?.data
  const errorCode = data?.code || data?.details?.code
  return errorCode === 'STUDENT_REGISTERED' || (Number(error?.response?.status) === 409 && /already registered/i.test(String(data?.message || '')))
}

function expireInvitation(error) {
  invitationUnavailable.value = true
  invitationError.value = responseMessage(error, 'This invitation has expired or is no longer available. Ask your teacher for a new link.')
  invalidateUsername()
}

function invalidateUsername() {
  clearTimeout(usernameTimer)
  usernameRequestId += 1
  usernameController?.abort()
  usernameStatus.value = 'idle'
  usernameMessage.value = ''
  checkedUsername.value = ''
  usernameSuggestions.value = []
}

function backToVerification() {
  if (submitting.value) return
  step.value = 'verify'
  verifiedStudent.value = null
  formError.value = ''
  alreadyRegistered.value = false
  password.value = ''
  confirmPassword.value = ''
  showPassword.value = false
  invalidateUsername()
}

async function loadInvitation() {
  const requestId = ++invitationRequestId
  invitationController?.abort()
  invitationController = new AbortController()
  loadingInvitation.value = true
  invitationError.value = ''
  invitationUnavailable.value = false
  invitation.value = null
  try {
    const { data } = await axios.get(invitationPath.value, { signal: invitationController.signal, timeout: 15000 })
    if (disposed || requestId !== invitationRequestId) return
    if (!data.invitation) throw new Error('Invitation information is missing')
    if (['expired', 'revoked', 'inactive'].includes(String(data.invitation.status || '').toLowerCase())) {
      invitationUnavailable.value = true
      invitationError.value = 'This invitation has expired or is no longer available. Ask your teacher for a new link.'
      return
    }
    invitation.value = data.invitation
  } catch (error) {
    if (disposed || requestId !== invitationRequestId || axios.isCancel(error)) return
    invitationUnavailable.value = isUnavailableInvitation(error)
    invitationError.value = responseMessage(error, 'We could not load this invitation. Check your internet connection and try again.')
  } finally {
    if (!disposed && requestId === invitationRequestId) loadingInvitation.value = false
  }
}

async function verifyStudent() {
  if (verifying.value || !invitation.value) return
  formError.value = ''
  alreadyRegistered.value = false
  const submittedName = fullName.value.trim()
  if (!submittedName) {
    formError.value = 'Enter your full name as it appears on your teacher’s class list.'
    return
  }
  const requestId = ++verificationRequestId
  const submittedPath = invitationPath.value
  verifying.value = true
  try {
    const { data } = await axios.post(`${submittedPath}/verify`, { fullName: submittedName }, { timeout: 15000 })
    if (disposed || requestId !== verificationRequestId || submittedPath !== invitationPath.value || submittedName !== fullName.value.trim()) return
    if (!data.student?.fullName) throw new Error('Student verification is incomplete')
    verifiedStudent.value = data.student
    step.value = 'account'
    if (username.value.trim()) scheduleUsernameCheck()
  } catch (error) {
    if (disposed || requestId !== verificationRequestId || submittedPath !== invitationPath.value) return
    if (isUnavailableInvitation(error)) expireInvitation(error)
    else {
      alreadyRegistered.value = studentAlreadyRegistered(error)
      formError.value = responseMessage(error, 'We could not verify your name. Check your connection and try again, or ask your teacher to check the spelling on the class list.')
    }
  } finally {
    if (!disposed && requestId === verificationRequestId) verifying.value = false
  }
}

function scheduleUsernameCheck() {
  invalidateUsername()
  if (step.value !== 'account' || !username.value.trim() || completed.value) return
  usernameStatus.value = 'waiting'
  usernameTimer = setTimeout(checkUsername, 400)
}

async function checkUsername() {
  clearTimeout(usernameTimer)
  usernameController?.abort()
  const requestedUsername = username.value.trim()
  if (!requestedUsername || step.value !== 'account' || completed.value) return
  const requestId = ++usernameRequestId
  const requestedPath = invitationPath.value
  usernameController = new AbortController()
  usernameStatus.value = 'checking'
  checkedUsername.value = ''
  usernameSuggestions.value = []
  try {
    const { data } = await axios.get(`${requestedPath}/username`, { params: { username: requestedUsername }, signal: usernameController.signal, timeout: 10000 })
    if (disposed || requestId !== usernameRequestId || requestedUsername !== username.value.trim() || requestedPath !== invitationPath.value) return
    checkedUsername.value = requestedUsername
    usernameStatus.value = !data.valid ? 'invalid' : data.available ? 'available' : 'unavailable'
    usernameMessage.value = data.message || (data.valid ? 'This username is already taken. Try one of the suggestions below.' : 'Please choose a valid username.')
    usernameSuggestions.value = Array.isArray(data.suggestions) ? [...new Set(data.suggestions.filter(value => typeof value === 'string' && value.trim()))].slice(0, 5) : []
  } catch (error) {
    if (disposed || requestId !== usernameRequestId || axios.isCancel(error) || requestedUsername !== username.value.trim()) return
    if (isUnavailableInvitation(error)) expireInvitation(error)
    else {
      usernameStatus.value = 'error'
      usernameMessage.value = responseMessage(error, 'Availability could not be checked. Check your connection and try again.')
    }
  }
}

async function registerStudent() {
  if (submitting.value || alreadyRegistered.value || !verifiedStudent.value || step.value !== 'account') return
  formError.value = ''
  const submittedEmail = email.value.trim()
  if (!gmailPattern.test(submittedEmail) || submittedEmail.length > 254 || submittedEmail.split('@')[0].length > 64) {
    formError.value = 'Please enter a valid Gmail address (e.g., user@gmail.com).'
    return
  }
  if (!usernameCheckedAndAvailable.value) {
    formError.value = 'Check that your current username is available before continuing.'
    if (username.value.trim()) checkUsername()
    return
  }
  if (password.value.length < 8 || password.value.length > 16 || !/[A-Z]/.test(password.value) || !/[a-z]/.test(password.value) || !/[0-9]/.test(password.value)) {
    formError.value = 'Use a password of 8–16 characters with uppercase and lowercase letters and a number.'
    return
  }
  if (password.value !== confirmPassword.value) {
    formError.value = 'Passwords do not match.'
    return
  }
  submitting.value = true
  const submittedPath = invitationPath.value
  try {
    await axios.post(`${submittedPath}/register`, {
      fullName: fullName.value.trim(),
      email: submittedEmail, username: username.value.trim(), password: password.value, confirmPassword: confirmPassword.value,
    }, { timeout: 25000 })
    if (disposed || submittedPath !== invitationPath.value) return
    registeredStudent.value = { ...verifiedStudent.value }
    completed.value = true
    password.value = ''
    confirmPassword.value = ''
    invalidateUsername()
  } catch (error) {
    if (disposed || submittedPath !== invitationPath.value) return
    if (isUnavailableInvitation(error)) expireInvitation(error)
    else {
      formError.value = responseMessage(error, 'We could not confirm registration. If your account was created, you can sign in; otherwise check your connection and try again.')
      alreadyRegistered.value = studentAlreadyRegistered(error)
      if (error?.response?.status === 409 && !alreadyRegistered.value) await checkUsername()
    }
  } finally {
    if (!disposed && submittedPath === invitationPath.value) submitting.value = false
  }
}

function formatExpiry(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

watch(username, scheduleUsernameCheck, { flush: 'sync' })
watch([firstName, lastName], () => {
  verificationRequestId += 1
  alreadyRegistered.value = false
  if (verifiedStudent.value) backToVerification()
}, { flush: 'sync' })
watch(() => route.params.token, () => {
  backToVerification()
  verificationRequestId += 1
  verifying.value = false
  submitting.value = false
  completed.value = false
  firstName.value = ''
  lastName.value = ''
  email.value = ''
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
  formError.value = ''
  alreadyRegistered.value = false
  loadInvitation()
}, { immediate: true })

onBeforeUnmount(() => {
  disposed = true
  clearTimeout(usernameTimer)
  usernameController?.abort()
  invitationController?.abort()
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";
.registered-guidance { @apply tw:grid tw:[gap:8px] tw:[margin-bottom:20px] tw:[font-size:12px] tw:[line-height:1.6]; }
.registered-guidance a { @apply tw:[color:#427433] tw:[font-weight:600] tw:underline tw:[text-underline-offset:3px]; }
.registered-guidance p { @apply tw:[margin:0] tw:[color:#647267]; }
.class-registration { @apply tw:[min-height:100dvh]; @apply tw:[background:#f8fafc]; @apply tw:[color:#182b21]; @apply tw:[font-family:'Inter',_'Segoe_UI',_sans-serif]; }
.class-registration *, .class-registration *::before, .class-registration *::after { @apply tw:box-border; }
.registration-layout { @apply tw:grid; @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(0,_1fr)]; @apply tw:[min-height:100dvh]; @apply tw:w-full; @apply tw:overflow-hidden; }
.registration-form-panel { @apply tw:relative tw:isolate tw:flex tw:items-center tw:justify-center tw:overflow-x-hidden tw:overflow-y-auto; @apply tw:[min-height:100dvh]; @apply tw:[padding:clamp(1rem,_2.8vw,_2.25rem)_clamp(1.4rem,_3vw,_2.8rem)]; @apply tw:[background:#f8fafc]; }
.registration-form-panel::before { @apply tw:[content:''] tw:absolute tw:[inset:0] tw:[z-index:-2] tw:pointer-events-none; @apply tw:[background:radial-gradient(ellipse_62%_54%_at_50%_48%,_rgba(255,_255,_255,_0.98)_0%,_rgba(255,_255,_255,_0.76)_42%,_rgba(248,_250,_252,_0)_76%),______radial-gradient(circle_at_0_0,_rgba(126,_185,_77,_0.72)_0_3px,_transparent_3.5px)_77px_64px_/_204px_164px,______radial-gradient(circle_at_0_0,_rgba(232,_184,_36,_0.7)_0_3px,_transparent_3.5px)_115px_64px_/_268px_195px,______linear-gradient(rgba(148,_163,_184,_0.07)_1px,_transparent_1px)_0_0_/_40px_40px,______linear-gradient(90deg,_rgba(148,_163,_184,_0.07)_1px,_transparent_1px)_0_0_/_40px_40px]; }
.registration-panel-geometry { @apply tw:absolute tw:[inset:0] tw:[z-index:-1] tw:overflow-hidden tw:pointer-events-none; }
.registration-panel-shape { @apply tw:absolute tw:block; }
.registration-panel-shape-top { @apply tw:[width:clamp(112px,_14vw,_178px)] tw:[height:clamp(112px,_14vw,_178px)] tw:[top:34px] tw:left-0; @apply tw:[background:linear-gradient(135deg,_rgba(165,_203,_126,_0.94),_rgba(83,_151,_70,_0.72))]; @apply tw:[clip-path:polygon(0_0,_78%_0,_0_78%)]; }
.registration-panel-shape-bottom { @apply tw:[width:clamp(145px,_18vw,_230px)] tw:[height:clamp(130px,_17vw,_215px)] tw:right-0 tw:bottom-0; @apply tw:[background:linear-gradient(135deg,_rgba(165,_203,_126,_0.42),_rgba(73,_143,_67,_0.8))]; @apply tw:[clip-path:polygon(100%_20%,_100%_100%,_18%_100%)]; }
.registration-shell { @apply tw:relative tw:[z-index:1] tw:w-full; @apply tw:[max-width:540px]; @apply tw:[margin:0_auto]; @apply tw:[animation:registration-card-enter_650ms_cubic-bezier(0.2,_0.75,_0.25,_1)_both]; }
.registration-brand { @apply tw:flex; @apply tw:[gap:12px]; @apply tw:items-center; @apply tw:w-fit; @apply tw:[margin:0_auto_26px]; @apply tw:[font-size:23px]; @apply tw:[font-weight:750]; @apply tw:[text-decoration:none]; @apply tw:[color:#1d3826]; }
.registration-brand small { @apply tw:block; @apply tw:[margin-top:2px]; @apply tw:[font-size:12px]; @apply tw:[font-weight:500]; @apply tw:[color:#657869]; }
.brand-mark { @apply tw:[width:49px]; @apply tw:[height:49px]; @apply tw:grid; @apply tw:place-items-center; @apply tw:[border:1px_solid_#cbdcc7]; @apply tw:[background:#fff]; @apply tw:[border-radius:16px]; @apply tw:overflow-hidden; }
.brand-mark img { @apply tw:[width:43px] tw:[height:43px] tw:object-contain; }
.registration-card { @apply tw:[padding:32px]; @apply tw:[border:2px_solid_transparent]; @apply tw:[border-radius:30px]; @apply tw:[background:linear-gradient(#ffffff,_#ffffff)_padding-box,linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]; @apply tw:[box-shadow:0_0_0_1px_rgba(187,_255,_89,_0.2),_0_18px_45px_rgba(30,_67,_7,_0.15),_0_0_28px_rgba(255,_213,_66,_0.2)]; }
.registration-design-panel { @apply tw:relative tw:flex tw:items-stretch tw:overflow-hidden; @apply tw:[min-height:100dvh]; @apply tw:[padding:clamp(1.6rem,_3vw,_3rem)]; @apply tw:[background:linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)]; }
.registration-design-panel::before { @apply tw:[content:''] tw:absolute tw:[inset:0] tw:pointer-events-none; @apply tw:[background:linear-gradient(128deg,_rgba(255,_255,_255,_0.15)_0%,_rgba(255,_255,_255,_0.15)_16%,_transparent_16%,_transparent_56%,_rgba(17,_17,_17,_0.08)_56%,_rgba(17,_17,_17,_0.08)_60%,_transparent_60%),linear-gradient(180deg,_rgba(255,_255,_255,_0.04),_rgba(17,_17,_17,_0.08))]; }
.registration-design-panel::after { @apply tw:[content:''] tw:absolute tw:[inset:1.2rem] tw:[border:1px_solid_rgba(255,_255,_255,_0.18)] tw:pointer-events-none; }
.registration-design-content { @apply tw:relative tw:[z-index:1] tw:flex tw:flex-col tw:justify-center tw:[gap:1rem]; @apply tw:[width:min(100%,_560px)] tw:[color:#1f140f]; }
.registration-design-heading { @apply tw:flex tw:items-start tw:justify-between; @apply tw:[gap:clamp(2rem,_4vw,_3.5rem)] tw:[margin-bottom:.35rem]; }
.registration-design-heading h2 { @apply tw:[margin:0] tw:flex-1 tw:[font-size:clamp(2rem,_2.6vw,_3.1rem)] tw:[line-height:1] tw:[letter-spacing:-.05em] tw:[font-weight:900]; }
.registration-design-logo { @apply tw:[width:220px] tw:[height:220px] tw:object-contain tw:shrink-0; @apply tw:[filter:drop-shadow(0_10px_18px_rgba(17,_17,_17,_0.12))]; }
.registration-design-content > p { @apply tw:[max-width:34rem] tw:[margin:0] tw:[color:rgba(31,_20,_15,_.8)] tw:[font-size:1rem] tw:[line-height:1.6]; }
.registration-design-shape { @apply tw:absolute tw:pointer-events-none tw:[z-index:0] tw:[border:1px_solid_rgba(255,_255,_255,_0.18)]; }
.registration-design-shape-top { @apply tw:[width:300px] tw:[height:190px] tw:[top:8%] tw:[right:7%] tw:[clip-path:polygon(14%_0,_100%_0,_86%_100%,_0_100%)] tw:[background:linear-gradient(135deg,_rgba(255,_255,_255,_0.16),_rgba(255,_255,_255,_0.05))] tw:[transform:rotate(-8deg)]; }
.registration-design-shape-bottom { @apply tw:[width:360px] tw:[height:220px] tw:[bottom:8%] tw:[left:4%] tw:[clip-path:polygon(0_18%,_76%_0,_100%_82%,_24%_100%)] tw:[background:linear-gradient(135deg,_rgba(17,_17,_17,_0.08),_rgba(255,_255,_255,_0.12))] tw:[transform:rotate(7deg)]; }
@keyframes registration-card-enter { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
.eyebrow { @apply tw:[margin:0_0_6px]; @apply tw:[color:#4a7b36]; @apply tw:[font-size:10px]; @apply tw:[font-weight:800]; @apply tw:[letter-spacing:1.5px]; }
h1 { @apply tw:[margin:0]; @apply tw:[font-size:27px]; @apply tw:[line-height:1.25]; @apply tw:[font-weight:750]; }
h2 { @apply tw:[font-size:20px]; @apply tw:[margin:18px_0_12px]; }
.class-name, .intro { @apply tw:[margin:10px_0_0]; @apply tw:[color:#647368]; @apply tw:[font-size:14px]; @apply tw:[line-height:1.6]; @apply tw:[overflow-wrap:anywhere]; }
.class-name { @apply tw:[color:#3d6838]; @apply tw:[font-weight:600]; }
.registration-steps { @apply tw:[list-style:none]; @apply tw:flex; @apply tw:[gap:15px]; @apply tw:[padding:18px_0]; @apply tw:[margin:22px_0]; @apply tw:[border-top:1px_solid_#edf2ea]; @apply tw:[border-bottom:1px_solid_#edf2ea]; }
.registration-steps li { @apply tw:[flex:1]; @apply tw:flex; @apply tw:items-center; @apply tw:[gap:8px]; @apply tw:[color:#67706b]; @apply tw:[font-size:12px]; @apply tw:[line-height:1.4]; }
.registration-steps li span { @apply tw:grid; @apply tw:place-items-center; @apply tw:[width:25px]; @apply tw:[height:25px]; @apply tw:shrink-0; @apply tw:[border-radius:50%]; @apply tw:[background:#f1f4ef]; @apply tw:[color:#626d60]; @apply tw:[font-size:11px]; @apply tw:[font-weight:700]; }
.registration-steps .current { @apply tw:[color:#36682d]; @apply tw:[font-weight:650]; }
.registration-steps .current span, .registration-steps .done span { @apply tw:[color:#fff]; @apply tw:[background:#518b40]; }
.registration-form { @apply tw:grid; @apply tw:[gap:19px]; }
.name-grid { @apply tw:grid; @apply tw:grid-cols-2; @apply tw:[gap:10px_16px]; }
.name-grid > small { @apply tw:[grid-column:1/-1]; }
.form-description { @apply tw:[margin:0]; @apply tw:[color:#607065]; @apply tw:[font-size:14px]; @apply tw:[line-height:1.6]; }
.form-field { @apply tw:grid; @apply tw:[gap:7px]; }
.form-field label { @apply tw:[font-size:13px]; @apply tw:[color:#263d2c]; @apply tw:[font-weight:650]; }
.form-field input { @apply tw:block; @apply tw:w-full; @apply tw:[min-height:46px]; @apply tw:[padding:11px_13px]; @apply tw:[border:1px_solid_#cddccb]; @apply tw:[border-radius:9px]; @apply tw:[background:#fff]; @apply tw:[color:#203127]; @apply tw:[font:inherit]; @apply tw:[font-size:14px]; }
.class-registration :is(input, button, a):focus-visible { @apply tw:[outline:3px_solid_#609e46]; @apply tw:[outline-offset:3px]; }
.form-field input:focus { @apply tw:[border-color:#609e46]; }
.form-field input[aria-invalid='true'] { @apply tw:[border-color:#c14d45]; }
.form-field small { @apply tw:[color:#69776d]; @apply tw:[font-size:11px]; @apply tw:[line-height:1.5]; }
.class-registration .invalid { @apply tw:[color:#a13b30]; }
.username-feedback { @apply tw:[min-height:17px]; }
.username-feedback i { @apply tw:[margin-right:7px]; }
.class-registration .available { @apply tw:[color:#36762e]; }
.primary-button, .secondary-button { @apply tw:flex; @apply tw:justify-center; @apply tw:items-center; @apply tw:[gap:10px]; @apply tw:w-full; @apply tw:[min-height:46px]; @apply tw:[border-radius:9px]; @apply tw:[padding:11px_15px]; @apply tw:[border:1px_solid_#50823d]; @apply tw:[background:#50863f]; @apply tw:[color:#fff]; @apply tw:[font:inherit]; @apply tw:[font-size:13px]; @apply tw:[font-weight:650]; @apply tw:text-center; @apply tw:[text-decoration:none]; @apply tw:cursor-pointer; }
.primary-button:hover:enabled { @apply tw:[background:#427133]; }
.secondary-button { @apply tw:[background:#fff]; @apply tw:[border-color:#d7e2d2]; @apply tw:[color:#3d6338]; }
.class-registration button:disabled, .class-registration input:disabled { @apply tw:cursor-default; @apply tw:[opacity:.58]; }
.class-registration button { @apply tw:[font-family:inherit]; }
.password-field { @apply tw:relative; }
.password-field input { @apply tw:[padding-right:48px]; }
.password-field button { @apply tw:absolute; @apply tw:[right:3px]; @apply tw:[top:3px]; @apply tw:[width:40px]; @apply tw:[height:40px]; @apply tw:[border:0]; @apply tw:[border-radius:7px]; @apply tw:[background:transparent]; @apply tw:[color:#6b7e66]; @apply tw:cursor-pointer; }
.verified-student { @apply tw:flex; @apply tw:[gap:11px]; @apply tw:items-center; @apply tw:[padding:14px]; @apply tw:[border:1px_solid_#d9e8d3]; @apply tw:[border-radius:11px]; @apply tw:[background:#f5faf1]; }
.verified-student > i { @apply tw:[color:#51843e]; @apply tw:[font-size:20px]; }
.verified-student > div { @apply tw:[flex:1]; @apply tw:[min-width:0]; }
.verified-student strong { @apply tw:block; @apply tw:[font-size:13px]; @apply tw:[overflow-wrap:anywhere]; }
.verified-student small { @apply tw:block; @apply tw:[margin-top:4px]; @apply tw:[font-size:11px]; @apply tw:[line-height:1.5]; @apply tw:[color:#677960]; @apply tw:[overflow-wrap:anywhere]; }
.text-button { @apply tw:[border:0]; @apply tw:[padding:4px_0]; @apply tw:[background:transparent]; @apply tw:[color:#426f35]; @apply tw:[font-size:12px]; @apply tw:[font-weight:600]; @apply tw:cursor-pointer; @apply tw:[text-decoration:underline]; @apply tw:[text-underline-offset:3px]; }
.username-suggestions { @apply tw:flex; @apply tw:flex-wrap; @apply tw:[gap:6px]; @apply tw:[margin-top:3px]; }
.username-suggestions small { @apply tw:[flex-basis:100%]; }
.username-suggestions button { @apply tw:max-w-full; @apply tw:[overflow-wrap:anywhere]; @apply tw:[padding:5px_9px]; @apply tw:[border:1px_solid_#d1dfca]; @apply tw:[border-radius:7px]; @apply tw:[color:#3d6935]; @apply tw:[background:#f5f9f1]; @apply tw:cursor-pointer; @apply tw:[font-size:12px]; }
.form-error { @apply tw:[padding:12px_14px]; @apply tw:[margin-bottom:18px]; @apply tw:[border:1px_solid_#edd6cc]; @apply tw:[border-radius:9px]; @apply tw:[background:#fff5f0]; @apply tw:[color:#913d2d]; @apply tw:[font-size:13px]; @apply tw:[line-height:1.6]; }
.enrollment-note { @apply tw:[margin:0]; @apply tw:flex; @apply tw:items-start; @apply tw:[gap:9px]; @apply tw:[color:#6d786e]; @apply tw:[font-size:11px]; @apply tw:[line-height:1.6]; }
.enrollment-note i { @apply tw:[margin-top:3px]; @apply tw:[color:#64805a]; }
.registration-footer { @apply tw:[margin-top:24px]; @apply tw:[padding-top:19px]; @apply tw:[border-top:1px_solid_#eaf0e7]; @apply tw:[color:#73806f]; @apply tw:[font-size:12px]; @apply tw:text-center; }
.registration-footer a, .text-link { @apply tw:[color:#427433]; @apply tw:[font-weight:600]; @apply tw:[text-decoration:underline]; @apply tw:[text-underline-offset:3px]; }
.registration-help { @apply tw:[margin:19px_auto_0]; @apply tw:[padding:0_14px]; @apply tw:[color:#6e7c69]; @apply tw:[font-size:11px]; @apply tw:text-center; @apply tw:[line-height:1.6]; }
.invitation-expiry { @apply tw:[margin:20px_0_0]; @apply tw:[color:#798675]; @apply tw:[font-size:10px]; @apply tw:text-center; }
.loading-state { @apply tw:flex; @apply tw:items-center; @apply tw:justify-center; @apply tw:[gap:10px]; @apply tw:[padding:40px_0]; @apply tw:[color:#527c45]; @apply tw:[font-size:14px]; }
.invitation-error, .success-state { @apply tw:[padding-top:25px]; @apply tw:text-center; }
.invitation-error p, .success-state p { @apply tw:[font-size:14px]; @apply tw:[line-height:1.7]; @apply tw:[color:#647267]; @apply tw:[overflow-wrap:anywhere]; }
.success-state .primary-button, .invitation-error .primary-button { @apply tw:[margin-top:24px]; }
.invitation-error .text-link { @apply tw:inline-block; @apply tw:[margin-top:20px]; @apply tw:[font-size:13px]; }
.state-icon { @apply tw:grid; @apply tw:place-items-center; @apply tw:[width:60px]; @apply tw:[height:60px]; @apply tw:[margin:0_auto]; @apply tw:[border-radius:50%]; @apply tw:[background:#f2f6ef]; @apply tw:[color:#6a8660]; @apply tw:[font-size:23px]; }
.success-icon { @apply tw:[background:#eaf5e2]; @apply tw:[color:#4b8737]; }
@media (max-width: 1080px) { .registration-layout { @apply tw:[grid-template-columns:1fr]; } .registration-design-panel { @apply tw:[min-height:420px]; } }
@media (max-width: 768px) { .registration-design-panel { @apply tw:hidden; } .registration-form-panel { @apply tw:[padding:max(1rem,_env(safe-area-inset-top))_max(.75rem,_env(safe-area-inset-right))_max(1rem,_env(safe-area-inset-bottom))_max(.75rem,_env(safe-area-inset-left))]; } }
@media (max-width: 540px) { .registration-brand { @apply tw:[margin-bottom:20px]; } .registration-card { @apply tw:[padding:25px_20px]; @apply tw:[border-radius:20px]; } h1 { @apply tw:[font-size:24px]; } .registration-steps { @apply tw:[gap:10px]; } .registration-steps li { @apply tw:[font-size:11px]; } .name-grid { @apply tw:grid-cols-1; } .name-grid > small { @apply tw:[grid-column:auto]; } }
@media (prefers-reduced-motion: reduce) { .fa-spin { @apply tw:animate-none; } }

</style>
