<template>
  <div class="math-captcha" :aria-busy="loading || verifying">
    <div class="math-captcha-heading">
      <label :for="inputId">Solve the math question</label>
      <button
        type="button"
        class="math-captcha-refresh"
        :disabled="disabled || loading || verifying"
        aria-label="Refresh math question"
        @click="refresh()"
      >
        <i class="fas fa-rotate-right" aria-hidden="true"></i>
        Refresh
      </button>
    </div>
    <div class="math-captcha-controls">
      <span class="math-captcha-question" :id="`${inputId}-question`" aria-live="polite">
        {{ loading ? 'Loading…' : question || 'Question unavailable' }}
      </span>
      <input
        :id="inputId"
        v-model="answer"
        class="math-captcha-answer"
        type="text"
        inputmode="numeric"
        pattern="[0-9]{1,2}"
        maxlength="2"
        autocomplete="off"
        placeholder="Answer"
        aria-label="Math CAPTCHA answer"
        :aria-describedby="`${inputId}-question ${inputId}-status`"
        :aria-invalid="status === 'error'"
        :required="!modelValue"
        :disabled="disabled || loading || verifying || !question || Boolean(modelValue)"
        @input="clearVerification"
      />
      <button
        type="button"
        class="math-captcha-verify"
        :disabled="disabled || loading || verifying || !question || Boolean(modelValue)"
        @click="verify()"
      >
        {{ verifying ? 'Checking…' : modelValue ? 'Verified' : 'Verify' }}
      </button>
    </div>
    <p
      :id="`${inputId}-status`"
      class="math-captcha-status"
      :class="{ 'math-captcha-status--error': status === 'error', 'math-captcha-status--success': Boolean(modelValue) }"
      role="status"
      aria-live="polite"
    >
      <i v-if="modelValue" class="fas fa-circle-check" aria-hidden="true"></i>
      {{ modelValue ? 'Answer verified. You can sign in.' : message || 'Use addition or subtraction. Questions expire after 5 minutes.' }}
    </p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import axios from 'axios'
import { resolveApiBaseUrl } from '../stores/auth.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const inputId = `math-captcha-${useId()}`
const answer = ref('')
const question = ref('')
const challengeId = ref('')
const loading = ref(false)
const verifying = ref(false)
const status = ref('')
const message = ref('')
let expiresAt = 0
let expiryTimer = null
let generation = 0
let requestController = null
let verificationPromise = null
let disposed = false

function stopExpiryTimer() {
  window.clearTimeout(expiryTimer)
  expiryTimer = null
}

function clearVerification() {
  emit('update:modelValue', '')
  status.value = ''
  message.value = ''
}

function scheduleExpiry() {
  stopExpiryTimer()
  expiryTimer = window.setTimeout(() => {
    void refresh('The question expired. Solve the new question.')
  }, Math.max(0, expiresAt - Date.now()))
}

async function refresh(notice = '') {
  const currentGeneration = ++generation
  requestController?.abort()
  requestController = new AbortController()
  stopExpiryTimer()
  const previousChallengeId = challengeId.value
  clearVerification()
  answer.value = ''
  question.value = ''
  loading.value = true
  status.value = notice ? 'error' : ''
  message.value = notice

  try {
    const response = await axios.post(`${resolveApiBaseUrl()}/auth/captcha/challenge`,
      { previousChallengeId: previousChallengeId || undefined },
      { signal: requestController.signal, timeout: 10000 })
    if (disposed || currentGeneration !== generation) return
    const data = response.data?.data
    const expiry = Date.parse(data?.expiresAt)
    if (!response.data?.success || !data?.challengeId || !data?.question || !Number.isFinite(expiry) || expiry <= Date.now()) {
      throw new Error('Unable to load a valid math question. Please refresh.')
    }
    challengeId.value = data.challengeId
    question.value = data.question
    expiresAt = expiry
    scheduleExpiry()
  } catch (error) {
    if (disposed || currentGeneration !== generation) return
    status.value = 'error'
    message.value = error.response?.data?.message || (error.response ? 'Unable to load the question. Please refresh.' : 'Unable to load the question. Check your connection and refresh.')
  } finally {
    if (!disposed && currentGeneration === generation) loading.value = false
  }
}

async function verifyAnswer() {
  if (props.modelValue && Date.now() < expiresAt) return props.modelValue
  if (loading.value || disposed) return ''
  if (!challengeId.value || !question.value || Date.now() >= expiresAt) {
    await refresh('The question expired. Solve the new question.')
    return ''
  }
  if (!/^\d{1,2}$/.test(answer.value.trim())) {
    status.value = 'error'
    message.value = 'Enter the answer to the math question.'
    return ''
  }

  const currentGeneration = generation
  verifying.value = true
  status.value = ''
  message.value = ''
  try {
    const response = await axios.post(`${resolveApiBaseUrl()}/auth/captcha/verify`,
      { challengeId: challengeId.value, answer: answer.value.trim() },
      { signal: requestController.signal, timeout: 10000 })
    if (disposed || currentGeneration !== generation) return ''
    const data = response.data?.data
    if (!response.data?.success || !data?.captchaToken) throw new Error('Unable to verify the answer. Please refresh.')
    expiresAt = Date.parse(data.expiresAt)
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      await refresh('The question expired. Solve the new question.')
      return ''
    }
    emit('update:modelValue', data.captchaToken)
    scheduleExpiry()
    return data.captchaToken
  } catch (error) {
    if (disposed || currentGeneration !== generation) return ''
    const notice = error.response?.data?.message || 'Unable to verify the answer. Check your connection and try again.'
    if (error.response?.data?.data?.refreshRequired) await refresh(notice)
    else {
      status.value = 'error'
      message.value = notice
    }
    return ''
  } finally {
    if (!disposed) verifying.value = false
  }
}

function verify() {
  if (!verificationPromise) {
    verificationPromise = verifyAnswer().finally(() => { verificationPromise = null })
  }
  return verificationPromise
}

onMounted(() => { void refresh() })
onBeforeUnmount(() => {
  disposed = true
  generation++
  stopExpiryTimer()
  requestController?.abort()
  emit('update:modelValue', '')
})
defineExpose({ verify, refresh })
</script>

<style scoped>
@reference "../styles/tailwind.css";

.math-captcha {
  @apply tw:w-full tw:min-w-0 tw:rounded-xl tw:border tw:[border-color:rgba(105,_170,_71,_0.22)] tw:[background:#fbfff8] tw:p-3;
}
.math-captcha-heading {
  @apply tw:flex tw:items-center tw:justify-between tw:gap-2 tw:text-xs tw:font-semibold tw:text-slate-700;
}
.math-captcha-refresh {
  @apply tw:flex tw:items-center tw:gap-1 tw:rounded tw:border-0 tw:bg-transparent tw:p-1 tw:[min-height:44px] tw:[color:#3f7f2a] tw:cursor-pointer;
}
.math-captcha-controls {
  @apply tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-2;
}
.math-captcha-question {
  @apply tw:grow tw:text-base tw:font-bold tw:text-slate-800;
}
.math-captcha-answer {
  @apply tw:w-20 tw:min-w-0 tw:rounded-lg tw:border tw:border-slate-300 tw:bg-white tw:p-2 tw:[min-height:44px] tw:text-center tw:text-base tw:text-slate-800;
}
.math-captcha-verify {
  @apply tw:rounded-lg tw:border-0 tw:[background:linear-gradient(135deg,_#69aa47_0%,_#3f7f2a_100%)] tw:px-3 tw:py-2 tw:[min-height:44px] tw:text-sm tw:font-semibold tw:text-white tw:cursor-pointer;
}
.math-captcha button:disabled {
  @apply tw:cursor-not-allowed tw:opacity-60;
}
.math-captcha button:focus-visible, .math-captcha-answer:focus-visible {
  @apply tw:outline-2 tw:outline-offset-2 tw:[outline-color:#69aa47];
}
.math-captcha-status {
  @apply tw:mb-0 tw:mt-2 tw:text-xs tw:leading-relaxed tw:text-slate-600;
}
.math-captcha-status--error {
  @apply tw:text-red-700;
}
.math-captcha-status--success {
  @apply tw:[color:#3f7f2a];
}
</style>
