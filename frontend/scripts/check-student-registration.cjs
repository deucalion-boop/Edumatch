const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc')
const { computed, ref, watch, reactive, nextTick, effectScope } = require('vue')
const postcss = require('postcss')

// Exercise the actual SFC setup with real Vue reactivity and fake HTTP only.
// Deliberately resolve requests after cancellation to verify stale-response guards.
const filename = path.resolve(__dirname, '../src/views/auth/StudentRegistryRegistrationView.vue')
const { descriptor, errors } = parse(fs.readFileSync(filename, 'utf8'), { filename })
const script = compileScript(descriptor, { id: 'student-registry-check' })
const template = compileTemplate({ source: descriptor.template.content, filename, id: 'student-registry-check', compilerOptions: { bindingMetadata: script.bindings } })
assert.equal(errors.length + template.errors.length, 0, 'SFC must compile')
postcss.parse(descriptor.styles[0].content).walkDecls(() => assert.fail('Use prefixed Tailwind utilities for registration styles'))
const compiled = script.content.replace(/^import .*$/gm, '').replace('export default', 'return')
const future = () => new Date(Date.now() + 600000).toISOString()
const studentProof = 'a'.repeat(64)
const emailProof = 'b'.repeat(64)

async function main() {
  const { isValidTeacherEmail } = await import('../src/utils/emailPolicy.js')
  const route = reactive({ params: { token: 'school-link-one' } })
  const calls = []
  const overrides = new Map()
  let student = { id: 'student-one', fullName: 'Juan Dela Cruz', firstName: 'Juan', lastName: 'Dela Cruz', assignments: [] }
  const identity = () => ({ data: { student: structuredClone(student), studentVerificationToken: studentProof, expiresAt: future() } })
  const verifiedEmail = email => ({ data: { verificationToken: emailProof, verifiedEmail: email.toLowerCase(), expiresAt: future() } })
  const axios = {
    isCancel: () => false,
    async get(url, config) {
      calls.push({ method: 'get', url, config })
      if (overrides.has(url.split('/').at(-1))) return overrides.get(url.split('/').at(-1))(config)
      if (url.endsWith('/username')) return { data: { username: config.params.username, available: config.params.username !== 'taken',
        suggestions: config.params.username === 'taken' ? ['juan.cruz'] : [], message: config.params.username === 'taken' ? 'Username already taken.' : 'Available.' } }
      return { data: { registration: { schoolName: 'EduMatch', status: 'Active', expiresAt: new Date(Date.now() + 3600000).toISOString() } } }
    },
    async post(url, body, config) {
      calls.push({ method: 'post', url, body, config })
      const endpoint = url.split('/').at(-1)
      if (overrides.has(endpoint)) return overrides.get(endpoint)(body, config)
      if (endpoint === 'verify') return identity()
      if (endpoint === 'email-code') return { data: { challengeId: 'email-challenge', retryAfter: 60, expiresIn: 600 } }
      if (endpoint === 'verify-email') return verifiedEmail(body.email)
      if (endpoint === 'register') return { data: { username: body.username, message: 'Registration complete.' } }
      throw new Error(`Unexpected endpoint: ${endpoint}`)
    },
  }
  let cleanup
  const browser = { setInterval: () => 1, clearInterval() {}, setTimeout, clearTimeout }
  const component = new Function('computed', 'onBeforeUnmount', 'ref', 'watch', 'useRoute', 'axios', 'resolveApiBaseUrl', 'window', 'isValidTeacherEmail', compiled)(
    computed, callback => { cleanup = callback }, ref, watch, () => route, axios, () => '/api', browser, isValidTeacherEmail)
  const scope = effectScope()
  const vm = scope.run(() => component.setup({}, { expose() {} }))
  const flush = async () => { await nextTick(); await Promise.resolve(); await Promise.resolve() }
  const enterIdentity = () => { vm.firstName.value = 'Juan'; vm.lastName.value = 'Dela Cruz' }
  const prepareIdentity = async () => { enterIdentity(); await vm.verifyStudent() }
  const prepareEmail = async () => {
    vm.email.value = 'juan@school.edu.ph'; await vm.sendEmailCode(); vm.emailCode.value = '123456'; await vm.verifyEmail()
  }
  try {
    await flush()
    assert.equal(vm.step.value, 'identity')
    assert.equal(vm.canRegister.value, false)
    await prepareIdentity()
    assert.equal(vm.step.value, 'account')
    assert.equal(calls.find(call => call.url.endsWith('/verify')).body.fullName, 'Juan Dela Cruz')
    assert.equal(vm.hasAssignments.value, false)
    vm.username.value = 'taken'; await vm.checkUsername()
    assert.equal(vm.usernameStatus.value, 'unavailable')
    assert.deepEqual(vm.usernameSuggestions.value, ['juan.cruz'])
    vm.username.value = 'juan.cruz'; await vm.checkUsername()
    assert.equal(calls.filter(call => call.url.endsWith('/username')).at(-1).config.params.studentVerificationToken, studentProof)
    await prepareEmail()
    assert.equal(calls.find(call => call.url.endsWith('/email-code')).body.studentVerificationToken, studentProof)
    assert.equal(calls.find(call => call.url.endsWith('/verify-email')).body.challengeId, 'email-challenge')
    assert.equal(vm.emailVerified.value, true)
    vm.password.value = 'Password123'; vm.confirmPassword.value = 'Password123'
    assert.equal(vm.canRegister.value, true, 'Unassigned students can register')
    await vm.registerStudent()
    assert.equal(vm.completed.value, true)
    const payload = calls.find(call => call.url.endsWith('/register')).body
    assert.equal(payload.studentVerificationToken, studentProof)
    assert.equal(payload.verificationToken, emailProof)
    assert.equal(Object.hasOwn(payload, 'sectionId'), false)
    assert.equal(Object.hasOwn(payload, 'role'), false)
    for (const field of ['studentVerificationToken', 'verificationToken', 'emailCode', 'emailChallengeId', 'password', 'confirmPassword']) assert.equal(vm[field].value, '')

    await vm.loadRegistration()
    student.assignments = [{ subjectId: 'math', className: 'Mathematics A', subjectName: 'Mathematics', teacherName: 'Maria Santos', sectionName: 'Charity' },
      { subjectId: 'science', className: 'Science A', subjectName: 'Science', teacherName: 'Jose Reyes', sectionName: 'Charity' }]
    await prepareIdentity()
    assert.equal(vm.hasAssignments.value, true)
    assert.equal(vm.verifiedAssignments.value.length, 2)
    assert.equal(vm.assignedSection.value, 'Charity')
    assert.equal(vm.verifiedAssignments.value[0].teacherName, 'Maria Santos')
    vm.backToVerification()
    let resolveIdentity
    overrides.set('verify', () => new Promise(resolve => { resolveIdentity = resolve }))
    enterIdentity()
    const staleIdentity = vm.verifyStudent()
    vm.firstName.value = 'Different'
    vm.lastName.value = 'Name'
    resolveIdentity(identity()); await staleIdentity
    assert.equal(vm.step.value, 'identity')
    assert.equal(vm.studentVerificationToken.value, '')
    overrides.delete('verify')

    await prepareIdentity()
    vm.email.value = 'juan@school.edu.ph'; await vm.sendEmailCode(); vm.emailCode.value = '123456'
    let resolveEmail
    overrides.set('verify-email', () => new Promise(resolve => { resolveEmail = resolve }))
    const staleEmail = vm.verifyEmail()
    route.params.token = 'school-link-two'; await flush()
    resolveEmail(verifiedEmail('juan@school.edu.ph')); await staleEmail
    assert.equal(vm.step.value, 'identity')
    assert.equal(vm.verificationToken.value, '')
    overrides.delete('verify-email')

    await prepareIdentity(); await prepareEmail()
    vm.password.value = 'Password123'; vm.email.value = 'new@school.edu.ph'
    assert.equal(vm.studentVerificationToken.value, studentProof)
    assert.equal(vm.verificationToken.value, '')
    assert.equal(vm.emailChallengeId.value, '')
    assert.equal(vm.password.value, '')
    vm.handleRegistrationError({ response: { status: 410, data: { code: 'SESSION_EXPIRED', message: 'Verify your school details again.' } } })
    assert.equal(vm.step.value, 'identity')
    assert.equal(vm.studentVerificationToken.value, '')
    assert.equal(vm.formError.value, 'Verify your school details again.')
    cleanup(); scope.stop(); cleanup = null
    assert.equal(vm.controllers.size, 0)
    assert.equal(vm.studentVerificationToken.value, '')
    console.log('PASS: student registration SFC and styles; identity/code normalization; trusted assignments and pending signup; username suggestions; email challenge/proofs; signup cleanup; stale identity/token responses; expired session and unmount cleanup.')
  } finally { cleanup?.(); scope.stop() }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
