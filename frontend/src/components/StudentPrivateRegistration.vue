<template>
  <section class="student-private-registration">
    <h3 v-if="!hideHeading">Private student registration</h3>
    <p class="registration-description">Share a private link with one student. They’ll enter their name, email, username, and password to join your advisory section.</p>
    <label v-if="isHeadTeacher" class="registration-field">
      <span>Advisory teacher</span>
      <select v-model="selectedTeacherId" :disabled="busy || loadingTeachers || Boolean(link)" required>
        <option value="" disabled>{{ loadingTeachers ? 'Loading teachers...' : 'Select an advisory teacher' }}</option>
        <option v-for="teacher in eligibleTeachers" :key="teacher.id" :value="teacher.id">{{ teacher.name }} — {{ teacher.advisorySectionName }}</option>
      </select>
    </label>
    <p v-if="isHeadTeacher && !loadingTeachers && !eligibleTeachers.length">Assign an advisory section to an active teacher before generating a link.</p>
    <p v-if="error" role="alert" class="registration-error">{{ error }}</p>
    <template v-if="link">
      <label class="registration-field"><span>Private registration link</span><input :value="link" readonly type="url" @focus="$event.target.select()"></label>
      <dl class="registration-details">
        <div><dt>Section</dt><dd>{{ sectionName }}</dd></div>
        <div><dt>Expires</dt><dd>{{ formatExpiry(expiresAt) }}</dd></div>
        <div><dt>Access</dt><dd>One student · Single use</dd></div>
      </dl>
      <div class="registration-actions"><button type="button" @click="copyLink">{{ copied ? 'Copied!' : 'Copy link' }}</button><button type="button" class="secondary" @click="startAnother">Create another link</button></div>
      <small class="registration-hint">Copy this link before creating another one. Existing links remain valid until used or expired.</small>
    </template>
    <button v-else type="button" :disabled="busy || (isHeadTeacher && !selectedTeacherId)" @click="generateLink">{{ busy ? 'Generating...' : 'Generate private link' }}</button>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
const props = defineProps({ apiBaseUrl: { type: String, required: true }, authToken: { type: String, required: true }, isHeadTeacher: Boolean, hideHeading: Boolean, teacherId: { type: String, default: '' } })
const emit = defineEmits(['created'])
const selectedTeacherId = ref(props.teacherId)
const teachers = ref([])
const loadingTeachers = ref(false)
const busy = ref(false)
const error = ref('')
const link = ref('')
const expiresAt = ref('')
const sectionName = ref('')
const copied = ref(false)
const eligibleTeachers = computed(() => teachers.value.filter(teacher => teacher.status === 'active' && teacher.advisorySectionId))
const base = () => String(props.apiBaseUrl).replace(/\/+$/, '')
const config = () => ({ headers: { Authorization: `Bearer ${props.authToken}` } })
const formatExpiry = value => new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
onMounted(async () => {
  if (!props.isHeadTeacher) return
  loadingTeachers.value = true
  try {
    const response = await axios.get(`${base()}/headteacher/teachers`, config())
    teachers.value = response.data?.teachers || []
  } catch (err) { error.value = err.response?.data?.message || 'Unable to load advisory teachers. Please try again.' }
  finally { loadingTeachers.value = false }
})
async function generateLink() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const role = props.isHeadTeacher ? 'headteacher' : 'teacher'
    const response = await axios.post(`${base()}/${role}/students/registration-links`, props.isHeadTeacher ? { teacherId: selectedTeacherId.value } : {}, config())
    link.value = response.data.invite.inviteLink
    expiresAt.value = response.data.invite.inviteExpiresAt
    sectionName.value = response.data.section.name
    emit('created')
  } catch (err) { error.value = err.response?.data?.message || 'Unable to create a private registration link. Please try again.' }
  finally { busy.value = false }
}
async function copyLink() {
  try { await navigator.clipboard.writeText(link.value); copied.value = true; error.value = '' }
  catch { error.value = 'Select the link above and copy it manually.' }
}
function startAnother() { link.value = ''; expiresAt.value = ''; sectionName.value = ''; copied.value = false; error.value = '' }
</script>

<style scoped>
.student-private-registration { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.25rem; min-width: 0; color: #25431b; }
h3, p { margin: 0; }
p, small { line-height: 1.6; }
.registration-description { color: #64748b; font-size: .9rem; }
.registration-field { display: grid; grid-template-columns: minmax(0, 1fr); gap: .5rem; min-width: 0; font-size: .875rem; font-weight: 600; }
input, select { width: 100%; min-width: 0; max-width: 100%; min-height: 46px; box-sizing: border-box; border: 1px solid #cbd9c4; border-radius: 10px; padding: .75rem; background: white; color: #25431b; font: inherit; }
input { font-weight: 400; text-overflow: ellipsis; }
input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid #79a861; outline-offset: 3px; }
.registration-details { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin: 0; padding: 1rem; border: 1px solid #e3ebdd; border-radius: 10px; background: #f7faf4; }
.registration-details > div { min-width: 0; }
.registration-details dt { margin-bottom: .3rem; color: #64748b; font-size: .75rem; }
.registration-details dd { margin: 0; font-size: .85rem; font-weight: 600; overflow-wrap: anywhere; }
button { min-height: 44px; border: 1px solid #35651e; border-radius: 8px; padding: .7rem 1rem; background: #35651e; color: white; font: inherit; font-weight: 600; cursor: pointer; }
button.secondary { background: white; color: #35651e; }
button:disabled { opacity: .6; cursor: not-allowed; }
.registration-actions { display: flex; flex-wrap: wrap; gap: .7rem; }
.registration-hint { color: #64748b; font-size: .78rem; overflow-wrap: anywhere; }
.registration-error { color: #b91c1c; }
@media (max-width: 480px) {
  .registration-actions { flex-direction: column; }
  .registration-actions button { width: 100%; }
  .registration-details { flex-direction: column; gap: .85rem; }
}
</style>
