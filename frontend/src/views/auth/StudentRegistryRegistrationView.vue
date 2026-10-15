<template>
  <main class="student-registration">
    <div class="registration-shell">
      <section class="registration-card" aria-labelledby="registration-title" :aria-busy="loading || verifyingStudent || submitting">
        <header>
          <p class="eyebrow">STUDENT REGISTRATION</p>
          <h1 id="registration-title">{{ completed ? 'Welcome to EduMatch' : 'Create your student account' }}</h1>
          <p class="intro">{{ completed ? 'Your account is ready for you.' : 'Verify your school registration details, then create your own account.' }}</p>
        </header>

        <div v-if="loading" class="loading-state" role="status"><i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Checking registration link…</div>
        <div v-else-if="linkError" class="state-panel">
          <span class="state-icon"><i class="fas fa-envelope-open" aria-hidden="true"></i></span>
          <h2>{{ linkUnavailable ? 'Registration link unavailable' : 'Unable to open registration' }}</h2>
          <p role="alert">{{ linkError }}</p>
          <p v-if="linkUnavailable">Ask your school for a current registration link.</p>
          <button v-else type="button" class="primary-button" @click="loadRegistration">Try again</button>
          <RouterLink to="/auth/login" class="text-link">Return to sign in</RouterLink>
        </div>
        <div v-else-if="completed" class="state-panel" role="status">
          <span class="state-icon success-icon"><i class="fas fa-check" aria-hidden="true"></i></span>
          <h2>Your student account is ready</h2>
          <p><strong>{{ registeredStudent.fullName || registeredStudent.name || verifiedStudent?.fullName }}</strong>, you can now sign in with <strong>{{ username.trim() }}</strong> and your new password.</p>
          <p v-if="!hasAssignments">Your school can assign your classes after registration.</p>
          <RouterLink to="/auth/login" class="primary-button">Sign in to EduMatch</RouterLink>
        </div>
        <template v-else-if="registration">
          <ol class="registration-steps" aria-label="Registration progress">
            <li :class="{ current: step === 'identity', done: step === 'account' }" :aria-current="step === 'identity' ? 'step' : undefined"><span>1</span> Verify your details</li>
            <li :class="{ current: step === 'account' }" :aria-current="step === 'account' ? 'step' : undefined"><span>2</span> Create your account</li>
          </ol>
          <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>
          <div v-if="alreadyRegistered" class="registered-guidance">
            <RouterLink to="/auth/login">Sign in to your account</RouterLink>
            <RouterLink to="/auth/forgot-password">Reset your password</RouterLink>
            <p>Contact your school if you have not created an account.</p>
          </div>

          <form v-if="step === 'identity'" class="registration-form" @submit.prevent="verifyStudent">
            <p class="form-description">Enter the registration code your school gave you and the full name on your school record.</p>
            <div class="form-field">
              <label for="student-registration-code">Registration code</label>
              <input id="student-registration-code" v-model="registrationCode" type="text" required maxlength="64" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" :disabled="verifyingStudent" aria-describedby="registration-code-hint" />
              <small id="registration-code-hint">Enter your 32-character school registration code. Spaces and hyphens are optional. Keep your code private.</small>
            </div>
            <div class="form-field">
              <label for="student-full-name">Full name</label>
              <input id="student-full-name" v-model="fullName" type="text" required maxlength="150" autocomplete="name" :disabled="verifyingStudent" aria-describedby="student-name-hint" />
              <small id="student-name-hint">Include all names recorded by your school. Capitalization and extra spaces do not matter.</small>
            </div>
            <button type="submit" class="primary-button" :disabled="verifyingStudent || alreadyRegistered || !validRegistrationCode || !fullName.trim()">{{ verifyingStudent ? 'Verifying your details…' : 'Verify and continue' }}<i v-if="!verifyingStudent" class="fas fa-arrow-right" aria-hidden="true"></i></button>
          </form>

          <form v-else class="registration-form" @submit.prevent="registerStudent">
            <div class="verified-student">
              <i class="fas fa-circle-check" aria-hidden="true"></i>
              <div><strong>{{ verifiedStudent.fullName || verifiedStudent.name }}</strong><small>School registration verified</small></div>
              <button type="button" class="text-button" :disabled="submitting" @click="backToVerification">Change</button>
            </div>
            <dl class="assignments" aria-label="School assignments">
              <div><dt>School</dt><dd>{{ verifiedStudent.schoolName || registration.schoolName || 'EduMatch' }}</dd></div>
              <div v-if="verifiedStudent.gradeLevel || verifiedStudent.grade"><dt>Grade level</dt><dd>{{ verifiedStudent.gradeLevel || verifiedStudent.grade }}</dd></div>
              <div v-if="assignedSection"><dt>Section</dt><dd>{{ assignedSection }}</dd></div>
              <div class="assigned-classes"><dt>Classes</dt><dd>
                <ul v-if="verifiedAssignments.length" class="class-list">
                  <li v-for="(assignment, index) in verifiedAssignments" :key="assignment.subjectId || index"><strong>{{ assignment.className || assignment.subjectName || 'Assigned class' }}</strong><small>{{ [assignment.subjectName, assignment.teacherName, assignment.sectionName ? `Section ${assignment.sectionName}` : ''].filter(Boolean).join(' · ') }}</small></li>
                </ul>
                <span v-else>{{ assignedClass || 'Pending assignment' }}</span>
              </dd></div>
            </dl>
            <p class="assignment-note"><i class="fas fa-lock" aria-hidden="true"></i> {{ hasAssignments ? 'Your school manages these assignments.' : 'Your school can assign classes after registration. You can create your account now.' }}</p>
            <div class="form-field">
              <label for="student-email">Your email address</label>
              <input id="student-email" v-model="email" type="email" required maxlength="254" autocomplete="email" :disabled="submitting || sendingCode || verifyingEmail" :aria-invalid="Boolean(email && !validEmail)" aria-describedby="student-email-hint" />
              <small id="student-email-hint">Use your own email address for verification and account recovery.</small>
            </div>
            <section class="email-verification" aria-labelledby="email-verification-title" :aria-busy="sendingCode || verifyingEmail">
              <div class="verification-heading"><h2 id="email-verification-title"><i :class="emailVerified ? 'fas fa-circle-check' : 'fas fa-envelope'" aria-hidden="true"></i> {{ emailVerified ? 'Email verified' : 'Verify your email' }}</h2><span v-if="emailVerified" class="verified-label">Verified</span></div>
              <p v-if="emailVerified">Your email is confirmed. Finish your account details below.</p>
              <template v-else>
                <p>We will send a code to confirm this email belongs to you.</p>
                <button type="button" class="secondary-button" :disabled="!validEmail || sendingCode || verifyingEmail || submitting || resendSeconds > 0" @click="sendEmailCode">{{ sendingCode ? 'Sending code…' : resendSeconds > 0 ? `Resend in ${resendSeconds}s` : codeSent ? 'Resend verification code' : 'Send verification code' }}</button>
                <div v-if="codeSent" class="code-entry">
                  <div class="form-field">
                    <label for="student-email-code">6-digit verification code</label>
                    <input id="student-email-code" v-model="emailCode" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" :disabled="verifyingEmail || sendingCode || submitting || codeExpired" aria-describedby="student-code-hint" />
                    <small id="student-code-hint" :class="{ invalid: codeExpired }">{{ codeExpired ? 'This code has expired. Request a new code.' : `Check your inbox and spam folder. Code expires in ${codeTimeRemaining}.` }}</small>
                  </div>
                  <button type="button" class="primary-button" :disabled="!/^\d{6}$/.test(emailCode.trim()) || codeExpired || sendingCode || verifyingEmail || submitting" @click="verifyEmail">{{ verifyingEmail ? 'Verifying…' : 'Verify email' }}</button>
                </div>
              </template>
              <p v-if="emailMessage" class="verification-message" role="status" aria-live="polite">{{ emailMessage }}</p>
              <p v-if="emailError" class="invalid" role="alert">{{ emailError }}</p>
            </section>
            <div class="form-field">
              <label for="student-username">Username</label>
              <input id="student-username" v-model="username" type="text" required minlength="3" maxlength="30" autocomplete="username" autocapitalize="none" spellcheck="false" :disabled="submitting" :aria-invalid="['unavailable', 'invalid'].includes(usernameStatus)" aria-describedby="student-username-feedback" />
              <small id="student-username-feedback" class="username-feedback" :class="{ available: usernameStatus === 'available', invalid: ['unavailable', 'invalid', 'error'].includes(usernameStatus) }" role="status" aria-live="polite"><i v-if="usernameStatus === 'checking'" class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>{{ usernameFeedback }}</small>
              <button v-if="usernameStatus === 'error'" type="button" class="text-button" :disabled="submitting" @click="checkUsername">Check again</button>
              <div v-if="usernameSuggestions.length" class="username-suggestions" aria-label="Alternative usernames"><small>Try a suggested username:</small><button v-for="suggestion in usernameSuggestions" :key="suggestion" type="button" :disabled="submitting" @click="username = suggestion">{{ suggestion }}</button></div>
            </div>
            <div class="password-grid">
              <div class="form-field"><label for="student-password">Password</label><div class="password-field"><input id="student-password" v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="8" maxlength="16" autocomplete="new-password" :disabled="submitting" aria-describedby="student-password-hint" /><button type="button" :aria-label="showPassword ? 'Hide passwords' : 'Show passwords'" :aria-pressed="showPassword" :disabled="submitting" @click="showPassword = !showPassword"><i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" aria-hidden="true"></i></button></div></div>
              <div class="form-field"><label for="student-confirm-password">Confirm password</label><input id="student-confirm-password" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" required minlength="8" maxlength="16" autocomplete="new-password" :disabled="submitting" :aria-invalid="Boolean(confirmPassword && confirmPassword !== password)" aria-describedby="student-password-match" /><small v-if="confirmPassword && confirmPassword !== password" id="student-password-match" class="invalid">Passwords do not match.</small></div>
              <small id="student-password-hint" class="password-hint">8–16 characters, with uppercase and lowercase letters and a number.</small>
            </div>
            <button type="submit" class="primary-button" :disabled="!canRegister">{{ submitting ? 'Creating your account…' : 'Create student account' }}<i v-if="!submitting" class="fas fa-arrow-right" aria-hidden="true"></i></button>
            <p v-if="!emailVerified" class="verification-reminder">Verify your email to enable account creation.</p>
            <button type="button" class="secondary-button" :disabled="submitting" @click="backToVerification">Back to verification</button>
          </form>
          <p v-if="registration.expiresAt" class="invitation-expiry">Registration link expires {{ formatExpiry(registration.expiresAt) }}</p>
        </template>
        <footer v-if="!completed && !linkError" class="registration-footer">Already have an account? <RouterLink to="/auth/login">Sign in</RouterLink></footer>
      </section>
      <p class="registration-help">Your school can help with your registration code or the name on your school record.</p>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { resolveApiBaseUrl } from '../../stores/auth'
import { isValidTeacherEmail } from '../../utils/emailPolicy.js'

const route = useRoute()
const registration = ref(null)
const loading = ref(false)
const linkError = ref('')
const linkUnavailable = ref(false)
const step = ref('identity')
const registrationCode = ref('')
const fullName = ref('')
const verifiedStudent = ref(null)
const studentVerificationToken = ref('')
const studentVerificationExpiresAt = ref(0)
const verifyingStudent = ref(false)
const email = ref('')
const emailCode = ref('')
const emailChallengeId = ref('')
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
const username = ref('')
const usernameStatus = ref('idle')
const usernameMessage = ref('')
const checkedUsername = ref('')
const usernameSuggestions = ref([])
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const completed = ref(false)
const registeredStudent = ref({})
const formError = ref('')
const alreadyRegistered = ref(false)
const now = ref(Date.now())
const controllers = new Map()
let sessionId = 0
let identityRequestId = 0
let emailRequestId = 0
let usernameRequestId = 0
let usernameTimer = null
let resetting = false
let disposed = false
const clockTimer = window.setInterval(() => { now.value = Date.now() }, 1000)
const registrationPath = computed(() => `${resolveApiBaseUrl()}/auth/student-registry/${encodeURIComponent(String(route.params.token || ''))}`)
const normalizedRegistrationCode = computed(() => registrationCode.value.replace(/[\s-]+/g, '').toUpperCase())
const validRegistrationCode = computed(() => /^[A-F0-9]{32}$/.test(normalizedRegistrationCode.value))
const usernamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$/
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/
const normalizedEmail = computed(() => email.value.trim().toLowerCase())
const validEmail = computed(() => isValidTeacherEmail(email.value))
const identityVerified = computed(() => Boolean(studentVerificationToken.value && verifiedStudent.value) && studentVerificationExpiresAt.value > now.value)
const emailVerified = computed(() => Boolean(verificationToken.value) && verifiedEmail.value === normalizedEmail.value && verificationExpiresAt.value > now.value)
const usernameAvailable = computed(() => usernameStatus.value === 'available' && checkedUsername.value === username.value.trim().toLowerCase())
const codeExpired = computed(() => codeSent.value && codeExpiresAt.value <= now.value)
const resendSeconds = computed(() => Math.max(0, Math.ceil((resendAvailableAt.value - now.value) / 1000)))
const codeTimeRemaining = computed(() => {
  const seconds = Math.max(0, Math.ceil((codeExpiresAt.value - now.value) / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})
const verifiedAssignments = computed(() => Array.isArray(verifiedStudent.value?.assignments) ? verifiedStudent.value.assignments.filter(value => value && typeof value === 'object') : [])
const assignedSection = computed(() => displayAssignment(verifiedStudent.value?.sectionName || verifiedStudent.value?.section) || [...new Set(verifiedAssignments.value.map(value => value.sectionName).filter(value => typeof value === 'string' && value))].join(', '))
const assignedClass = computed(() => displayAssignment(verifiedStudent.value?.className || verifiedStudent.value?.class))
const hasAssignments = computed(() => verifiedAssignments.value.length > 0 || Boolean(assignedClass.value))
const canRegister = computed(() => step.value === 'account' && identityVerified.value && emailVerified.value && validEmail.value && usernameAvailable.value && passwordPattern.test(password.value) && password.value === confirmPassword.value && !submitting.value && !sendingCode.value && !verifyingEmail.value && !alreadyRegistered.value && !linkError.value)
const usernameFeedback = computed(() => {
  if (usernameStatus.value === 'checking') return 'Checking username availability…'
  if (usernameStatus.value === 'waiting') return 'Waiting to check username…'
  if (usernameStatus.value === 'available') return 'This username is available.'
  return usernameMessage.value || '3–30 characters: letters, numbers, periods, underscores, or hyphens. Uppercase and lowercase versions count as the same username.'
})

function displayAssignment(value) { return typeof value === 'string' ? value : value?.name || '' }
function responseMessage(error, fallback) { const message = error?.response?.data?.message; return typeof message === 'string' && message.trim() ? message : fallback }
function cancelRequest(key) { controllers.get(key)?.abort(); controllers.delete(key) }
function requestConfig(key, timeout = 20000) { cancelRequest(key); const controller = new AbortController(); controllers.set(key, controller); return { signal: controller.signal, timeout } }
function live(requestSession) { return !disposed && requestSession === sessionId }
function clearPasswords() { password.value = ''; confirmPassword.value = ''; showPassword.value = false }
function invalidateUsername() {
  clearTimeout(usernameTimer); usernameRequestId += 1; cancelRequest('username')
  usernameStatus.value = 'idle'; usernameMessage.value = ''; checkedUsername.value = ''; usernameSuggestions.value = []
}
function clearEmailVerification() {
  emailRequestId += 1; cancelRequest('send-code'); cancelRequest('verify-email')
  sendingCode.value = false; verifyingEmail.value = false; emailCode.value = ''; emailChallengeId.value = ''; verificationToken.value = ''; verifiedEmail.value = ''
  verificationExpiresAt.value = 0; codeSent.value = false; codeExpiresAt.value = 0; resendAvailableAt.value = 0
  emailMessage.value = ''; emailError.value = ''; clearPasswords()
}
function resetIdentity() {
  identityRequestId += 1; cancelRequest('verify-student'); cancelRequest('register')
  verifyingStudent.value = false; submitting.value = false; step.value = 'identity'; verifiedStudent.value = null
  studentVerificationToken.value = ''; studentVerificationExpiresAt.value = 0; formError.value = ''; alreadyRegistered.value = false
  clearEmailVerification(); invalidateUsername(); email.value = ''; username.value = ''
}
function backToVerification() { if (!submitting.value) resetIdentity() }
function handleRegistrationError(error) {
  const data = error?.response?.data || {}
  const code = String(data.code || data.details?.code || '')
  if (/^(?:REGISTRATION_LINK|STUDENT_REGISTRY_LINK|REGISTRY_LINK|INVITATION)_(?:INVALID|EXPIRED|REVOKED|INACTIVE|NOT_FOUND)$/.test(code)) {
    linkUnavailable.value = true; linkError.value = responseMessage(error, 'This registration link is no longer available. Ask your school for a new link.'); resetIdentity(); return true
  }
  if (/^(?:STUDENT_VERIFICATION|REGISTRY_VERIFICATION|SESSION)_(?:REQUIRED|INVALID|EXPIRED)$/.test(code) || ['CODE_EXPIRED', 'CODE_REVOKED', 'CLAIM_INVALID'].includes(code)) {
    resetIdentity(); formError.value = responseMessage(error, 'Verify your registration code and full name again to continue.'); return true
  }
  if (code === 'STUDENT_REGISTERED' || (Number(error?.response?.status) === 409 && /already (?:registered|has an account)/i.test(String(data.message || '')))) alreadyRegistered.value = true
  return false
}

async function loadRegistration() {
  sessionId += 1
  const requestSession = sessionId
  for (const key of controllers.keys()) cancelRequest(key)
  resetting = true
  resetIdentity(); registrationCode.value = ''; fullName.value = ''; completed.value = false; registeredStudent.value = {}
  registration.value = null; linkError.value = ''; linkUnavailable.value = false; loading.value = true
  resetting = false
  try {
    const { data } = await axios.get(registrationPath.value, requestConfig('registration'))
    if (!live(requestSession)) return
    if (!data.registration) throw new Error('Registration information is missing')
    if (['revoked', 'expired', 'inactive'].includes(String(data.registration.status || '').toLowerCase())) {
      linkUnavailable.value = true; linkError.value = 'This registration link is no longer available. Ask your school for a new link.'; return
    }
    registration.value = data.registration
  } catch (error) {
    if (!live(requestSession) || axios.isCancel(error)) return
    linkUnavailable.value = [403, 404, 410].includes(Number(error?.response?.status))
    linkError.value = responseMessage(error, 'We could not open registration. Check your connection and try again.')
  } finally { if (live(requestSession)) loading.value = false }
}

async function verifyStudent() {
  if (!registration.value || verifyingStudent.value || alreadyRegistered.value || !validRegistrationCode.value || !fullName.value.trim()) return
  const requestSession = sessionId
  const requestId = ++identityRequestId
  verifyingStudent.value = true; formError.value = ''
  try {
    const { data } = await axios.post(`${registrationPath.value}/verify`, { registrationCode: normalizedRegistrationCode.value, fullName: fullName.value.trim() }, requestConfig('verify-student'))
    if (!live(requestSession) || requestId !== identityRequestId) return
    const expiresAt = Date.parse(data.expiresAt)
    if (!data.student || !data.studentVerificationToken || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error('Student verification is incomplete')
    verifiedStudent.value = data.student; studentVerificationToken.value = data.studentVerificationToken; studentVerificationExpiresAt.value = expiresAt
    step.value = 'account'
  } catch (error) {
    if (!live(requestSession) || requestId !== identityRequestId || axios.isCancel(error)) return
    if (!handleRegistrationError(error)) formError.value = responseMessage(error, 'We could not verify your details. Check your registration code and the full name on your school record, then try again.')
  } finally { if (live(requestSession) && requestId === identityRequestId) verifyingStudent.value = false }
}

async function sendEmailCode() {
  if (!identityVerified.value || !validEmail.value || sendingCode.value || verifyingEmail.value || submitting.value || resendSeconds.value > 0) return
  const requestSession = sessionId
  const requestId = ++emailRequestId
  sendingCode.value = true; emailError.value = ''; emailMessage.value = ''; verificationToken.value = ''; verifiedEmail.value = ''; verificationExpiresAt.value = 0
  emailCode.value = ''; emailChallengeId.value = ''; codeSent.value = false; codeExpiresAt.value = 0
  try {
    const { data } = await axios.post(`${registrationPath.value}/email-code`, { email: email.value.trim(), studentVerificationToken: studentVerificationToken.value }, requestConfig('send-code'))
    if (!live(requestSession) || requestId !== emailRequestId) return
    const expiresIn = Number(data.expiresIn)
    const retryAfter = Number(data.retryAfter)
    if (!data.challengeId || !Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error('Verification information is missing')
    now.value = Date.now(); emailChallengeId.value = data.challengeId; codeExpiresAt.value = now.value + expiresIn * 1000
    resendAvailableAt.value = now.value + (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 0); codeSent.value = true
    emailMessage.value = data.message || 'A verification code has been sent. Check your inbox and spam folder.'
  } catch (error) {
    if (!live(requestSession) || requestId !== emailRequestId || axios.isCancel(error)) return
    if (!handleRegistrationError(error)) {
      now.value = Date.now()
      const resendAt = Date.parse(error?.response?.data?.verification?.resendAvailableAt)
      const headers = error?.response?.headers
      const retryAfter = Number(headers?.get?.('retry-after') || headers?.['retry-after'] || error?.response?.data?.retryAfter || (['EMAIL_DELIVERY_FAILED', 'INVITATION_COOLDOWN'].includes(error?.response?.data?.code) ? 60 : 0))
      if (Number.isFinite(resendAt)) resendAvailableAt.value = resendAt
      else if (Number.isFinite(retryAfter) && retryAfter > 0) resendAvailableAt.value = now.value + retryAfter * 1000
      emailError.value = responseMessage(error, 'We could not send your verification code. Try again.')
    }
  } finally { if (live(requestSession) && requestId === emailRequestId) sendingCode.value = false }
}

async function verifyEmail() {
  if (!identityVerified.value || !emailChallengeId.value || !codeSent.value || codeExpired.value || !/^\d{6}$/.test(emailCode.value.trim()) || sendingCode.value || verifyingEmail.value || submitting.value) return
  const requestSession = sessionId
  const requestId = ++emailRequestId
  verifyingEmail.value = true; emailError.value = ''; emailMessage.value = ''
  try {
    const { data } = await axios.post(`${registrationPath.value}/verify-email`, { email: email.value.trim(), code: emailCode.value.trim(), challengeId: emailChallengeId.value, studentVerificationToken: studentVerificationToken.value }, requestConfig('verify-email'))
    if (!live(requestSession) || requestId !== emailRequestId) return
    const expiresAt = Date.parse(data.expiresAt)
    if (!data.verificationToken || String(data.verifiedEmail || '').toLowerCase() !== normalizedEmail.value || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error('Verification information is missing')
    verificationToken.value = data.verificationToken; verifiedEmail.value = String(data.verifiedEmail).toLowerCase(); verificationExpiresAt.value = expiresAt
    emailCode.value = ''; emailChallengeId.value = ''; codeSent.value = false; codeExpiresAt.value = 0; emailMessage.value = 'Your email address is verified.'
  } catch (error) {
    if (!live(requestSession) || requestId !== emailRequestId || axios.isCancel(error)) return
    if (!handleRegistrationError(error)) emailError.value = responseMessage(error, 'We could not verify that code. Check the code and try again.')
  } finally { if (live(requestSession) && requestId === emailRequestId) verifyingEmail.value = false }
}

async function checkUsername() {
  clearTimeout(usernameTimer)
  const submittedUsername = username.value.trim()
  if (!identityVerified.value || !usernamePattern.test(submittedUsername) || completed.value || linkError.value) return
  const requestSession = sessionId
  const requestId = ++usernameRequestId
  usernameStatus.value = 'checking'; usernameMessage.value = ''; usernameSuggestions.value = []
  try {
    const { data } = await axios.get(`${registrationPath.value}/username`, { ...requestConfig('username'), params: { username: submittedUsername, studentVerificationToken: studentVerificationToken.value } })
    if (!live(requestSession) || requestId !== usernameRequestId || submittedUsername !== username.value.trim()) return
    checkedUsername.value = submittedUsername.toLowerCase(); usernameStatus.value = data.valid === false ? 'invalid' : data.available ? 'available' : 'unavailable'
    usernameMessage.value = data.message || 'This username is already taken. Choose another username.'
    usernameSuggestions.value = Array.isArray(data.suggestions) ? [...new Set(data.suggestions.filter(value => typeof value === 'string' && usernamePattern.test(value)))].slice(0, 5) : []
  } catch (error) {
    if (!live(requestSession) || requestId !== usernameRequestId || axios.isCancel(error)) return
    if (!handleRegistrationError(error)) { usernameStatus.value = 'error'; usernameMessage.value = responseMessage(error, 'We could not check username availability. Please try again.') }
  }
}

async function registerStudent() {
  if (submitting.value || alreadyRegistered.value) return
  formError.value = ''
  if (!identityVerified.value) { resetIdentity(); formError.value = 'Verify your registration code and full name again to continue.'; return }
  if (!validEmail.value || !emailVerified.value) { formError.value = 'Verify your own email address before creating your account.'; return }
  if (!usernameAvailable.value) { formError.value = 'Choose a username and wait for its availability check.'; return }
  if (!passwordPattern.test(password.value)) { formError.value = 'Use an 8–16 character password with uppercase and lowercase letters and a number.'; return }
  if (password.value !== confirmPassword.value) { formError.value = 'Your passwords do not match.'; return }
  if (!canRegister.value) return
  const requestSession = sessionId
  const requestIdentity = identityRequestId
  const requestEmail = emailRequestId
  submitting.value = true
  try {
    const { data } = await axios.post(`${registrationPath.value}/register`, { studentVerificationToken: studentVerificationToken.value, verificationToken: verificationToken.value,
      email: email.value.trim(), username: username.value.trim(), password: password.value, confirmPassword: confirmPassword.value }, requestConfig('register', 35000))
    if (!live(requestSession) || requestIdentity !== identityRequestId || requestEmail !== emailRequestId) return
    if (typeof data.username !== 'string' || !data.username.trim()) throw new Error('Registration could not be confirmed')
    registeredStudent.value = data.student || data.user || { ...verifiedStudent.value }; completed.value = true; username.value = data.username
    studentVerificationToken.value = ''; studentVerificationExpiresAt.value = 0; registrationCode.value = ''; clearEmailVerification(); invalidateUsername()
  } catch (error) {
    if (!live(requestSession) || requestIdentity !== identityRequestId || requestEmail !== emailRequestId || axios.isCancel(error)) return
    if (handleRegistrationError(error)) return
    formError.value = responseMessage(error, 'We could not confirm registration. If your account was created, sign in; otherwise check your connection and try again.')
    if (Number(error?.response?.status) === 409 && /username/i.test(formError.value)) { invalidateUsername(); await checkUsername() }
    if (/email.*verif.*(?:expired|invalid)|verify your email/i.test(formError.value)) { verificationToken.value = ''; emailError.value = 'Verify your email again before creating your account.' }
  } finally { if (live(requestSession) && requestIdentity === identityRequestId) submitting.value = false }
}

function formatExpiry(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'soon' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date) }
watch(email, clearEmailVerification, { flush: 'sync' })
watch([registrationCode, fullName], () => { if (!resetting && !disposed && !completed.value) resetIdentity() }, { flush: 'sync' })
watch(username, () => {
  invalidateUsername()
  if (!identityVerified.value || !username.value.trim() || completed.value) return
  if (!usernamePattern.test(username.value.trim())) { usernameStatus.value = 'invalid'; usernameMessage.value = 'Use 3–30 characters, starting with a letter or number. Only letters, numbers, periods, underscores, and hyphens are allowed.'; return }
  usernameStatus.value = 'waiting'; usernameTimer = window.setTimeout(checkUsername, 400)
}, { flush: 'sync' })
watch(now, () => {
  if (completed.value || loading.value || linkError.value || submitting.value) return
  const expiresAt = Date.parse(registration.value?.expiresAt)
  if (Number.isFinite(expiresAt) && expiresAt <= now.value) { linkUnavailable.value = true; linkError.value = 'This registration link has expired. Ask your school for a new link.'; resetIdentity() }
  else if (studentVerificationToken.value && studentVerificationExpiresAt.value <= now.value) { resetIdentity(); formError.value = 'Your school record verification has expired. Verify your registration code and name again.' }
  else if (verificationToken.value && verificationExpiresAt.value <= now.value) { verificationToken.value = ''; emailMessage.value = ''; emailError.value = 'Your email verification has expired. Request a new code.' }
})
watch(() => route.params.token, loadRegistration, { immediate: true })
onBeforeUnmount(() => {
  disposed = true; sessionId += 1; identityRequestId += 1; emailRequestId += 1; usernameRequestId += 1
  clearTimeout(usernameTimer); window.clearInterval(clockTimer)
  for (const key of controllers.keys()) cancelRequest(key)
  registrationCode.value = ''; studentVerificationToken.value = ''; verificationToken.value = ''; emailCode.value = ''; emailChallengeId.value = ''; clearPasswords()
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";
.student-registration { @apply tw:[min-height:100dvh] tw:[padding:36px_20px] tw:[background:radial-gradient(ellipse_at_top,_#eaf5e7,_#f6f9f4_65%)] tw:[color:#182b21] tw:[font-family:'Inter',_'Segoe_UI',_sans-serif]; }
.student-registration *, .student-registration *::before, .student-registration *::after { @apply tw:box-border; }
.registration-shell { @apply tw:[max-width:640px] tw:[margin:0_auto]; }
.registration-card { @apply tw:[padding:32px] tw:[background:#fff] tw:[border:1px_solid_#d9e7d5] tw:[border-radius:20px] tw:[box-shadow:0_18px_45px_#2448200b]; }
.eyebrow { @apply tw:[margin:0_0_8px] tw:[color:#4a7b36] tw:[font-size:10px] tw:[font-weight:800] tw:[letter-spacing:1.5px]; }
h1 { @apply tw:[margin:0] tw:[font-size:27px] tw:[line-height:1.3] tw:[font-weight:750]; }
h2 { @apply tw:[font-size:20px] tw:[margin:18px_0_12px]; }
.intro, .form-description { @apply tw:[margin:10px_0_0] tw:[color:#647368] tw:[font-size:14px] tw:[line-height:1.6]; }
.form-description { @apply tw:[margin:0]; }
.registration-steps { @apply tw:flex tw:[list-style:none] tw:[gap:14px] tw:[padding:19px_0] tw:[margin:23px_0] tw:[border-top:1px_solid_#edf2ea] tw:[border-bottom:1px_solid_#edf2ea]; }
.registration-steps li { @apply tw:flex tw:items-center tw:[flex:1] tw:[gap:8px] tw:[color:#67706b] tw:[font-size:12px] tw:[line-height:1.4]; }
.registration-steps li span { @apply tw:grid tw:place-items-center tw:shrink-0 tw:[width:26px] tw:[height:26px] tw:[border-radius:50%] tw:[background:#f1f4ef] tw:[color:#626d60] tw:[font-size:11px] tw:[font-weight:700]; }
.registration-steps .current { @apply tw:[color:#36682d] tw:[font-weight:650]; }
.registration-steps .current span, .registration-steps .done span { @apply tw:[background:#518b40] tw:[color:#fff]; }
.registration-form { @apply tw:grid tw:[gap:20px]; }
.form-field { @apply tw:grid tw:[gap:7px] tw:content-start; }
.form-field label { @apply tw:[font-size:13px] tw:[color:#263d2c] tw:[font-weight:650]; }
.form-field input { @apply tw:block tw:w-full tw:[min-width:0] tw:[min-height:46px] tw:[padding:11px_13px] tw:[border:1px_solid_#cddccb] tw:[border-radius:9px] tw:[background:#fff] tw:[color:#203127] tw:[font:inherit] tw:[font-size:14px]; }
.student-registration :is(input, button, a):focus-visible { @apply tw:[outline:3px_solid_#609e46] tw:[outline-offset:3px]; }
.form-field input:focus { @apply tw:[border-color:#609e46]; }
.form-field input[aria-invalid='true'] { @apply tw:[border-color:#c14d45]; }
.form-field small, .password-hint { @apply tw:[color:#69776d] tw:[font-size:11px] tw:[line-height:1.6]; }
.student-registration .invalid { @apply tw:[color:#a13b30]; }
.student-registration .available { @apply tw:[color:#36762e]; }
.verified-student { @apply tw:flex tw:items-center tw:[gap:11px] tw:[padding:15px] tw:[border:1px_solid_#d9e8d3] tw:[border-radius:11px] tw:[background:#f5faf1]; }
.verified-student > i { @apply tw:[color:#51843e] tw:[font-size:21px]; }
.verified-student > div { @apply tw:[flex:1] tw:[min-width:0]; }
.verified-student strong { @apply tw:block tw:[font-size:14px] tw:[overflow-wrap:anywhere]; }
.verified-student small { @apply tw:block tw:[margin-top:4px] tw:[font-size:11px] tw:[color:#677960]; }
.assignments { @apply tw:grid tw:[grid-template-columns:1fr_1fr] tw:[gap:15px_18px] tw:[margin:0] tw:[padding:16px] tw:[border:1px_solid_#e3ebde] tw:[border-radius:11px] tw:[background:#fcfdfb]; }
.assignments > div { @apply tw:[min-width:0]; }
.assignments dt { @apply tw:[font-size:10px] tw:[color:#74806f] tw:[font-weight:600] tw:[margin-bottom:5px]; }
.assignments dd { @apply tw:[margin:0] tw:[color:#3e5638] tw:[font-size:12px] tw:[font-weight:600] tw:[overflow-wrap:anywhere] tw:[line-height:1.5]; }
.assigned-classes { @apply tw:[grid-column:1/-1]; }
.class-list { @apply tw:grid tw:[gap:10px] tw:[margin:0] tw:[padding:0] tw:[list-style:none]; }
.class-list strong { @apply tw:block tw:[font-size:12px] tw:[font-weight:650]; }
.class-list small { @apply tw:block tw:[margin-top:3px] tw:[font-size:11px] tw:[font-weight:400] tw:[color:#697665]; }
.assignment-note { @apply tw:flex tw:items-start tw:[gap:9px] tw:[margin:-6px_0_0] tw:[font-size:11px] tw:[line-height:1.6] tw:[color:#697665]; }
.assignment-note i { @apply tw:[margin-top:3px] tw:[color:#64805a]; }
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
.student-registration button:disabled, .student-registration input:disabled { @apply tw:cursor-default tw:[opacity:.58]; }
.student-registration button { @apply tw:[font-family:inherit]; }
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
.registered-guidance { @apply tw:grid tw:[gap:8px] tw:[margin-bottom:20px] tw:[font-size:12px] tw:[line-height:1.6]; }
.registered-guidance a { @apply tw:[color:#427433] tw:[font-weight:600] tw:underline tw:[text-underline-offset:3px]; }
.registered-guidance p { @apply tw:[margin:0] tw:[color:#647267]; }
.verification-reminder { @apply tw:[margin:-9px_0_0] tw:[color:#6d786e] tw:[font-size:11px] tw:text-center tw:[line-height:1.6]; }
.registration-footer { @apply tw:[margin-top:24px] tw:[padding-top:19px] tw:[border-top:1px_solid_#eaf0e7] tw:[color:#73806f] tw:[font-size:12px] tw:text-center; }
.registration-footer a, .text-link { @apply tw:[color:#427433] tw:[font-weight:600] tw:underline tw:[text-underline-offset:3px]; }
.registration-help { @apply tw:[margin:19px_auto_0] tw:[padding:0_14px] tw:[color:#6e7c69] tw:[font-size:11px] tw:text-center tw:[line-height:1.6]; }
.invitation-expiry { @apply tw:[margin:22px_0_0] tw:[color:#74816e] tw:[font-size:11px] tw:text-center tw:[line-height:1.6]; }
.loading-state { @apply tw:flex tw:items-center tw:justify-center tw:[gap:10px] tw:[padding:40px_0] tw:[color:#527c45] tw:[font-size:14px]; }
.state-panel { @apply tw:[padding-top:25px] tw:text-center; }
.state-panel p { @apply tw:[font-size:14px] tw:[line-height:1.7] tw:[color:#647267] tw:[overflow-wrap:anywhere]; }
.state-panel .primary-button { @apply tw:[margin-top:24px]; }
.state-panel .text-link { @apply tw:inline-block tw:[margin-top:20px] tw:[font-size:13px]; }
.state-icon { @apply tw:grid tw:place-items-center tw:[width:60px] tw:[height:60px] tw:[margin:0_auto] tw:[border-radius:50%] tw:[background:#f2f6ef] tw:[color:#6a8660] tw:[font-size:23px]; }
.success-icon { @apply tw:[background:#eaf5e2] tw:[color:#4b8737]; }
@media (max-width: 540px) {
  .student-registration { @apply tw:[padding:24px_12px]; }
  .registration-card { @apply tw:[padding:25px_20px] tw:[border-radius:16px]; }
  h1 { @apply tw:[font-size:24px]; }
  .password-grid { @apply tw:[grid-template-columns:1fr] tw:[gap:18px]; }
  .password-hint { @apply tw:[margin-top:-8px]; }
  .email-verification { @apply tw:[padding:15px]; }
  .registration-steps { @apply tw:[gap:9px]; }
  .registration-steps li { @apply tw:[font-size:11px]; }
}
@media (prefers-reduced-motion: reduce) { .fa-spin { @apply tw:animate-none; } }
</style>
