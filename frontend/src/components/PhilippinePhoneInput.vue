<template>
  <div class="philippine-phone-input">
    <span class="philippine-phone-input__country">
      <svg class="philippine-phone-input__flag" viewBox="0 0 60 30" role="img" aria-label="Philippine flag">
        <title>Philippine flag</title>
        <path fill="#0038a8" d="M0 0h60v15H0z" />
        <path fill="#ce1126" d="M0 15h60v15H0z" />
        <path fill="#fff" d="M0 0l26 15L0 30z" />
        <g fill="#fcd116">
          <circle cx="10" cy="15" r="3" />
          <path v-for="angle in [0, 45, 90, 135, 180, 225, 270, 315]" :key="angle" d="M9.4 10.8l.6-2.2.6 2.2z" :transform="`rotate(${angle} 10 15)`" />
          <path d="M0-2.1l.5 1.5h1.6L.8.4l.5 1.5L0 1l-1.3.9.5-1.5-1.3-1h1.6z" transform="translate(4 4.5)" />
          <path d="M0-2.1l.5 1.5h1.6L.8.4l.5 1.5L0 1l-1.3.9.5-1.5-1.3-1h1.6z" transform="translate(4 25.5)" />
          <path d="M0-2.1l.5 1.5h1.6L.8.4l.5 1.5L0 1l-1.3.9.5-1.5-1.3-1h1.6z" transform="translate(21 15)" />
        </g>
      </svg>
      <span>+63</span>
    </span>
    <input
      :id="id"
      :value="nationalNumber"
      class="philippine-phone-input__number"
      type="tel"
      inputmode="numeric"
      autocomplete="tel-national"
      maxlength="10"
      pattern="[0-9]{7,10}"
      placeholder="9123456789"
      @beforeinput="preventLetters"
      @input="updateNumber"
      @paste="pasteNumber"
      v-bind="$attrs"
    >
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  id: { type: String, required: true },
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const toNationalNumber = (value, stripCountryCode = true) => {
  const raw = String(value || '').trim()
  let digits = raw.replace(/[^0-9]/g, '')
  if (stripCountryCode && (raw.startsWith('+63') || (digits.startsWith('63') && digits.length > 10))) {
    digits = digits.slice(2)
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  return digits.slice(0, 10)
}

const nationalNumber = computed(() => toNationalNumber(props.modelValue))

const preventLetters = (event) => {
  if (event.inputType?.startsWith('insert') && event.data && /[^0-9]/.test(event.data)) {
    event.preventDefault()
  }
}

const updateNumber = (event) => {
  const input = event.target
  const raw = input.value
  const number = toNationalNumber(raw, false)
  if (raw !== number) {
    const cursor = input.selectionStart ?? raw.length
    const digitsBeforeCursor = raw.slice(0, cursor).replace(/[^0-9]/g, '').length
    const removedZero = raw.replace(/[^0-9]/g, '').startsWith('0') ? 1 : 0
    input.value = number
    const nextCursor = Math.max(0, Math.min(number.length, digitsBeforeCursor - removedZero))
    input.setSelectionRange(nextCursor, nextCursor)
  }
  emit('update:modelValue', number ? `+63${number}` : '')
}

const pasteNumber = (event) => {
  event.preventDefault()
  const text = String(event.clipboardData?.getData('text') || '').trim()
  if (text.startsWith('+') && !text.startsWith('+63')) return
  const input = event.target
  const start = input.selectionStart ?? input.value.length
  const end = input.selectionEnd ?? start
  const digits = text.replace(/[^0-9]/g, '')
  const replacingWholeNumber = start === 0 && end === input.value.length
  const hasPhonePrefix = text.startsWith('+63')
    || (digits.startsWith('63') && digits.length > 10)
    || (digits.startsWith('0') && digits.length > 10)
  const number = replacingWholeNumber || hasPhonePrefix ? toNationalNumber(text) : digits
  if (!number) return
  const availableDigits = Math.max(0, 10 - (input.value.length - (end - start)))
  input.setRangeText(number.slice(0, availableDigits), start, end, 'end')
  updateNumber(event)
}
</script>

<style scoped>
@reference "../styles/tailwind.css";

.philippine-phone-input {
  @apply tw:flex tw:items-center tw:w-full tw:min-w-0;
  @apply tw:[min-height:48px] tw:[border:1px_solid_#cbd5e1] tw:[border-radius:12px] tw:[background:#fff];
  @apply tw:[transition:border-color_0.2s,_box-shadow_0.2s];
}

.philippine-phone-input:focus-within {
  @apply tw:[border-color:#86b86a] tw:[box-shadow:0_0_0_3px_rgba(79,_139,_45,_0.14)];
}

.philippine-phone-input__country {
  @apply tw:flex tw:items-center tw:shrink-0 tw:[gap:0.5rem];
  @apply tw:[padding:0_0.85rem] tw:[border-right:1px_solid_#e2e8f0] tw:[color:#334155] tw:[font-size:0.95rem];
}

.philippine-phone-input__flag {
  @apply tw:block tw:shrink-0 tw:[width:28px] tw:[height:14px] tw:[border-radius:2px];
  @apply tw:[box-shadow:0_0_0_1px_rgba(15,_23,_42,_0.12)];
}

.philippine-phone-input > input.philippine-phone-input__number,
.philippine-phone-input > input.philippine-phone-input__number:focus {
  @apply tw:flex-1 tw:w-full tw:min-w-0 tw:[height:46px] tw:[padding:0.75rem_0.85rem];
  @apply tw:[border:0]! tw:[outline:0]! tw:[box-shadow:none]! tw:[background:transparent]!;
  @apply tw:[border-radius:0] tw:[color:#0f172a] tw:[font-size:0.95rem] tw:[font-family:inherit];
}

.philippine-phone-input > input.philippine-phone-input__number[readonly] {
  @apply tw:[background:#f8fafc]! tw:[color:#64748b] tw:[cursor:default];
}
</style>
