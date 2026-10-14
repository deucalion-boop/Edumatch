<template>
  <Teleport to="body">
    <div class="invitation-backdrop" @click.self="requestClose">
      <section ref="dialogRef" class="invitation-dialog" role="dialog" aria-modal="true" aria-labelledby="class-invitation-title" aria-describedby="class-invitation-description" tabindex="-1" :aria-busy="busy">
        <header class="invitation-header">
          <div><span class="invitation-eyebrow">Student enrollment</span><h2 id="class-invitation-title">Invite Students</h2><p id="class-invitation-description">Import your class list and share one invitation link. Students register by matching their imported full names.</p></div>
          <button type="button" class="invitation-close" :disabled="busy" aria-label="Close invitation workflow" @click="requestClose"><i class="fas fa-times" aria-hidden="true"></i></button>
        </header>
        <ol class="invitation-steps" aria-label="Invitation steps"><li :class="{ active: step === 1, complete: step > 1 }"><span>1</span>Upload</li><li :class="{ active: step === 2, complete: step > 2 }"><span>2</span>Review</li><li :class="{ active: step === 3 }"><span>3</span>Share</li></ol>

        <div class="invitation-body">
          <p v-if="error" class="invitation-feedback error" role="alert">{{ error }}</p>
          <p v-if="notice" class="invitation-feedback success" role="status">{{ notice }}</p>
          <template v-if="step < 3">
            <label class="invitation-field"><span>Choose a class</span><select v-model="subjectId" :disabled="busy"><option value="">Select a class</option><option v-for="subject in subjects" :key="subject.id" :value="String(subject.id)">{{ subject.className || subject.name }}</option></select></label>
            <label class="invitation-field"><span>Assign section</span><select v-model="sectionId" :disabled="busy || !sections.length"><option value="">Select a section</option><option v-for="section in sections" :key="section.id" :value="String(section.id)">{{ section.name }}</option></select></label>
            <p v-if="sectionsLoadError" class="invitation-feedback error" role="alert">{{ sectionsLoadError }} <button type="button" class="invitation-retry" :disabled="busy" @click="emit('retry-sections')">Retry sections</button></p>
            <p v-else-if="!sections.length" class="invitation-feedback error" role="alert">No active sections are available. Ask your Head Teacher to create or activate a section. <button type="button" class="invitation-retry" :disabled="busy" @click="emit('retry-sections')">Retry sections</button></p>
            <p v-if="selectedSectionName" class="invitation-section-context">Assigned section: <strong>{{ selectedSectionName }}</strong>. All students in this upload will join this section.</p>
          </template>
          <template v-if="step === 1">
            <div class="invitation-upload">
              <i class="fas fa-file-excel" aria-hidden="true"></i><strong>Upload an Excel class list</strong><p>Use only two columns: <b>First Name</b> and <b>Last Name</b>. Add one student per row. Choose the section above; do not include a Section column in the spreadsheet.</p>
              <label class="invitation-file-label"><span>Excel file (.xlsx, up to 2 MB and 1,000 student rows)</span><input ref="fileInputRef" type="file" accept=".xlsx" :disabled="busy" @change="chooseFile"></label>
              <small v-if="file">{{ file.name }}</small>
            </div>
            <p class="invitation-help">We check required fields, repeated names, and students already imported or registered before creating the invitation.</p>
            <button type="button" class="invitation-manual" :disabled="busy || !canCreateIndividual" @click="emit('manual')"><i class="fas fa-user-plus" aria-hidden="true"></i>Create an individual student account instead</button>
            <p v-if="!canCreateIndividual" class="invitation-help">An advisory section must be assigned before you can create individual accounts.</p>
          </template>
          <template v-else-if="step === 2">
            <div class="invitation-review-summary" aria-live="polite"><span><strong>{{ validRecords.length }}</strong> ready to invite</span><span :class="{ invalid: invalidRecords.length > 0 }"><strong>{{ invalidRecords.length }}</strong> need correction</span></div>
            <p class="invitation-help">Review each first and last name carefully. We combine them into the full name students verify during registration.</p>
            <div class="invitation-table-wrap" tabindex="0" aria-label="Imported student preview"><table><thead><tr><th>Row</th><th>First name</th><th>Last name</th><th>Validation</th></tr></thead><tbody><tr v-for="(record, index) in records" :key="`${record.rowNumber}-${index}`" :class="{ 'invalid-row': !isValidRecord(record) }"><td>{{ record.rowNumber || index + 2 }}</td><td>{{ record.firstName || 'Missing first name' }}</td><td>{{ record.lastName || 'Missing last name' }}</td><td><span v-if="isValidRecord(record)" class="invitation-row-valid"><i class="fas fa-check-circle" aria-hidden="true"></i>Ready</span><ul v-else class="invitation-row-errors"><li v-for="(message, messageIndex) in record.errors?.length ? record.errors : ['This record cannot be imported.']" :key="messageIndex">{{ message }}</li></ul></td></tr></tbody></table></div>
            <label v-if="invalidRecords.length > 0 && validRecords.length > 0" class="invitation-discard"><input v-model="discardInvalid" type="checkbox" :disabled="busy"><span>Exclude the {{ invalidRecords.length }} invalid {{ invalidRecords.length === 1 ? 'row' : 'rows' }} and invite only the {{ validRecords.length }} valid {{ validRecords.length === 1 ? 'student' : 'students' }}.</span></label>
            <p v-if="!validRecords.length" class="invitation-feedback error">No valid students are available. Correct the spreadsheet and upload it again.</p>
            <label class="invitation-field invitation-expiry"><span>Invitation expires after</span><select v-model.number="expiresInDays" :disabled="busy"><option :value="7">7 days</option><option :value="30">30 days</option><option :value="90">90 days</option></select></label>
          </template>
          <template v-else-if="generatedInvitation">
            <div class="invitation-success"><i class="fas fa-check-circle" aria-hidden="true"></i><div><h3>{{ generatedInvitation.className || selectedClassName }}</h3><p>{{ generatedInvitation.totalCount }} students · {{ generatedInvitation.registeredCount }} registered · {{ generatedInvitation.unregisteredCount }} unregistered</p></div><span class="invitation-status" :class="{ expired: isExpired }">{{ isExpired ? 'Expired' : 'Ready to share' }}</span></div>
            <progress class="invitation-progress" :value="generatedInvitation.registeredCount || 0" :max="generatedInvitation.totalCount || 1" :aria-label="`${generatedInvitation.registeredCount || 0} of ${generatedInvitation.totalCount || 0} students registered`"></progress>
            <p v-if="isExpired" class="invitation-feedback error">This invitation has expired. Renew it to let unregistered students register using their imported full names.</p>
            <div v-if="isExpired" class="invitation-renew"><label class="invitation-field"><span>Renew invitation for</span><select v-model.number="expiresInDays" :disabled="busy"><option :value="7">7 days</option><option :value="30">30 days</option><option :value="90">90 days</option></select></label><button type="button" class="invitation-button primary" :disabled="busy" @click="renewInvitation"><i class="fas" :class="busy ? 'fa-spinner fa-spin' : 'fa-clock-rotate-left'" aria-hidden="true"></i>{{ busy ? 'Renewing…' : 'Renew invitation' }}</button></div>
            <label class="invitation-field"><span>Class invitation link</span><div class="invitation-link-field"><input :value="generatedInvitation.invitationUrl" type="url" readonly aria-label="Shareable class invitation link" @focus="$event.target.select()"><button type="button" class="invitation-button primary" :disabled="isExpired" @click="copyLink"><i class="fas fa-copy" aria-hidden="true"></i>{{ copied ? 'Copied' : 'Copy link' }}</button></div></label>
            <p class="invitation-help">Expires {{ formatExpiry(generatedInvitation.expiresAt) }}. Share this link with the class. Students enter their full names as listed below.</p>
            <div class="invitation-share-instructions"><strong>Students complete their own registration</strong><ol><li>Open the class invitation link.</li><li>Enter their full name to match the imported class list.</li><li>Provide an email, choose an available username, and create a password.</li></ol><p>Successful registration automatically enrolls the student in the selected class and section.</p></div>
            <div class="invitation-table-wrap" tabindex="0" aria-label="Invited student enrollment"><table><thead><tr><th>Full name</th><th>Section</th><th>Enrollment</th></tr></thead><tbody><tr v-for="student in generatedInvitation.students || []" :key="student.id"><td>{{ student.fullName }}</td><td>{{ student.section }}</td><td><span class="invitation-status" :class="{ waiting: student.status !== 'registered' }">{{ student.status === 'registered' ? 'Registered' : 'Unregistered' }}</span></td></tr></tbody></table></div>
          </template>
        </div>

        <footer class="invitation-footer">
          <button type="button" class="invitation-button secondary" :disabled="busy" @click="step === 1 ? requestClose() : resetUpload()">{{ step === 1 ? 'Cancel' : step === 2 ? 'Replace spreadsheet' : 'Import another list' }}</button>
          <button v-if="step === 1" type="button" class="invitation-button primary" :disabled="busy || !subjectId || !selectedSectionName || !file" @click="previewImport"><i class="fas" :class="busy ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'" aria-hidden="true"></i>{{ busy ? 'Checking spreadsheet…' : 'Preview students' }}</button>
          <button v-else-if="step === 2" type="button" class="invitation-button primary" :disabled="busy || !canCreateInvitation" @click="createInvitation"><i class="fas" :class="busy ? 'fa-spinner fa-spin' : 'fa-link'" aria-hidden="true"></i>{{ busy ? 'Creating invitation…' : 'Create invitation' }}</button>
          <div v-else class="invitation-footer-share"><button type="button" class="invitation-button primary" :disabled="busy" @click="requestClose">Done</button></div>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  subjects: { type: Array, default: () => [] },
  sections: { type: Array, default: () => [] },
  initialSectionId: { type: String, default: '' },
  sectionsLoadError: { type: String, default: '' },
  apiBaseUrl: { type: String, required: true },
  authToken: { type: String, required: true },
  initialSubjectId: { type: String, default: '' },
  invitation: { type: Object, default: null },
  canCreateIndividual: { type: Boolean, default: true },
})
const emit = defineEmits(['close', 'imported', 'manual', 'retry-sections'])
const dialogRef = ref(null)
const fileInputRef = ref(null)
const subjectId = ref(props.initialSubjectId || (props.subjects.length === 1 ? String(props.subjects[0].id) : ''))
const sectionId = ref(props.initialSectionId)
const step = ref(props.invitation ? 3 : 1)
const generatedInvitation = ref(props.invitation)
const file = ref(null)
const records = ref([])
const discardInvalid = ref(false)
const expiresInDays = ref(30)
const busy = ref(false)
const copied = ref(false)
const error = ref('')
const notice = ref('')
const controller = new AbortController()
let previousFocus = null
let previousOverflow = ''
let copyTimer = null
const requestConfig = () => ({ headers: { Authorization: `Bearer ${props.authToken}` }, signal: controller.signal, timeout: 60000 })
const isValidRecord = record => record.status === 'valid' && !(record.errors?.length)
const validRecords = computed(() => records.value.filter(isValidRecord))
const invalidRecords = computed(() => records.value.filter(record => !isValidRecord(record)))
const selectedSectionName = computed(() => props.sections.find(section => String(section.id) === sectionId.value)?.name || '')
const canCreateInvitation = computed(() => !!subjectId.value && !!selectedSectionName.value && validRecords.value.length > 0 && (!invalidRecords.value.length || discardInvalid.value))
const selectedClassName = computed(() => {
  const subject = props.subjects.find(item => String(item.id) === subjectId.value)
  return subject?.className || subject?.name || 'Selected class'
})
const isExpired = computed(() => generatedInvitation.value?.status === 'expired' || new Date(generatedInvitation.value?.expiresAt).getTime() <= Date.now())
const formatExpiry = value => value ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'not available'
const requestClose = () => { if (!busy.value) emit('close') }

watch([subjectId, sectionId], () => {
  records.value = []
  discardInvalid.value = false
  error.value = ''
  notice.value = ''
  if (step.value === 2) step.value = 1
})
watch(() => props.initialSectionId, (value, previousValue) => {
  if (!sectionId.value || sectionId.value === previousValue) sectionId.value = value
})
watch(() => props.invitation, value => {
  if (value && step.value === 3) generatedInvitation.value = value
})

function chooseFile(event) {
  file.value = null
  records.value = []
  error.value = ''
  notice.value = ''
  const selected = event.target.files?.[0]
  if (!selected) return
  if (!/\.xlsx$/i.test(selected.name)) { error.value = 'Choose an Excel workbook ending in .xlsx. Save older .xls files as .xlsx first.'; event.target.value = ''; return }
  if (selected.size > 2 * 1024 * 1024) { error.value = 'This file is larger than 2 MB. Upload a smaller spreadsheet.'; event.target.value = ''; return }
  if (!selected.size) { error.value = 'The file is empty. Add your student list and upload it again.'; event.target.value = ''; return }
  file.value = selected
}
function resetUpload() {
  if (busy.value) return
  step.value = 1
  records.value = []
  file.value = null
  discardInvalid.value = false
  generatedInvitation.value = null
  error.value = ''
  notice.value = ''
  nextTick(() => fileInputRef.value?.focus())
}
async function previewImport() {
  if (busy.value || !file.value || !subjectId.value || !selectedSectionName.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const payload = new FormData()
    payload.append('file', file.value)
    payload.append('subjectId', subjectId.value)
    payload.append('sectionId', sectionId.value)
    const response = await axios.post(`${props.apiBaseUrl}/teacher/class-invitations/preview`, payload, requestConfig())
    records.value = Array.isArray(response.data?.records) ? response.data.records : []
    if (!records.value.length) { error.value = 'No student rows were found. Include only First Name and Last Name headers and at least one student.'; return }
    discardInvalid.value = false
    step.value = 2
    await nextTick()
    dialogRef.value?.focus()
  } catch (failure) {
    if (failure.code !== 'ERR_CANCELED') error.value = failure.response?.data?.message || 'Unable to read this spreadsheet. Check the file and try again.'
  } finally { busy.value = false }
}
async function createInvitation() {
  if (busy.value || !canCreateInvitation.value) return
  busy.value = true
  error.value = ''
  try {
    const response = await axios.post(`${props.apiBaseUrl}/teacher/class-invitations`, { subjectId: subjectId.value, sectionId: sectionId.value, records: validRecords.value.map(({ firstName, lastName }) => ({ firstName, lastName })), expiresInDays: expiresInDays.value }, requestConfig())
    if (!response.data?.invitation?.id) throw new Error('The invitation could not be confirmed. Refresh enrollment before trying again.')
    generatedInvitation.value = response.data.invitation
    step.value = 3
    notice.value = 'Your class invitation is ready. Share the link so students can register using their full names.'
    emit('imported', generatedInvitation.value)
    await nextTick()
    dialogRef.value?.focus()
  } catch (failure) {
    if (failure.code !== 'ERR_CANCELED') {
      error.value = failure.response?.data?.message || (failure.isAxiosError ? 'Unable to create the invitation. Check your connection and try again.' : failure.message) || 'Unable to create the invitation. Please try again.'
      if (Array.isArray(failure.response?.data?.records)) { records.value = failure.response.data.records; discardInvalid.value = false }
    }
  } finally { busy.value = false }
}
async function copyLink() {
  error.value = ''
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(generatedInvitation.value.invitationUrl)
    copied.value = true
    notice.value = 'Invitation link copied. Students register using their imported full names.'
    window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => { copied.value = false }, 2500)
  } catch { error.value = 'Copying is unavailable in this browser. Select the invitation link and copy it manually.' }
}
async function renewInvitation() {
  if (busy.value || !generatedInvitation.value?.id) return
  busy.value = true
  error.value = ''
  try {
    const response = await axios.post(`${props.apiBaseUrl}/teacher/class-invitations/${encodeURIComponent(generatedInvitation.value.id)}/renew`, { expiresInDays: expiresInDays.value }, requestConfig())
    if (!response.data?.invitation) throw new Error('The renewed invitation could not be confirmed. Refresh enrollment and try again.')
    generatedInvitation.value = response.data.invitation
    notice.value = 'Invitation renewed. Unregistered students can register using their imported full names.'
    emit('imported', generatedInvitation.value)
  } catch (failure) {
    if (failure.code !== 'ERR_CANCELED') error.value = failure.response?.data?.message || (failure.isAxiosError ? 'Unable to renew this invitation. Check your connection and try again.' : failure.message) || 'Unable to renew this invitation. Please try again.'
  } finally { busy.value = false }
}
function handleKeydown(event) {
  if (event.key === 'Escape') { event.stopImmediatePropagation(); event.preventDefault(); requestClose(); return }
  if (event.key !== 'Tab') return
  const elements = Array.from(dialogRef.value?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]') || []).filter(element => element.getClientRects().length)
  if (!elements.length) { event.preventDefault(); dialogRef.value?.focus(); return }
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.value)) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && (document.activeElement === last || !dialogRef.value.contains(document.activeElement))) { event.preventDefault(); first.focus() }
}
onMounted(() => {
  previousFocus = document.activeElement
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleKeydown, true)
  nextTick(() => dialogRef.value?.focus())
})
onBeforeUnmount(() => {
  controller.abort()
  window.clearTimeout(copyTimer)
  document.removeEventListener('keydown', handleKeydown, true)
  document.body.style.overflow = previousOverflow
  if (previousFocus?.isConnected) previousFocus.focus()
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";
.invitation-backdrop { @apply tw:fixed tw:inset-0 tw:[z-index:11000] tw:flex tw:items-center tw:justify-center tw:[padding:1rem] tw:[background:rgba(15,35,10,0.5)]; }
.invitation-dialog { @apply tw:[width:min(820px,100%)] tw:[max-height:calc(100dvh_-_2rem)] tw:flex tw:flex-col tw:[border-radius:20px] tw:[border:1px_solid_#c9ddbf] tw:bg-white tw:[box-shadow:0_24px_80px_rgba(15,35,10,0.2)] tw:[color:#243322] tw:outline-none; }
.invitation-header { @apply tw:flex tw:items-start tw:justify-between tw:[gap:1rem] tw:[padding:1.3rem_1.5rem_1rem]; }
.invitation-eyebrow { @apply tw:[font-size:.65rem] tw:font-bold tw:uppercase tw:[letter-spacing:.09em] tw:[color:#4c7e34]; }
.invitation-header h2 { @apply tw:[font-size:1.3rem] tw:[margin:.2rem_0]; }
.invitation-header p { @apply tw:[font-size:.82rem] tw:[line-height:1.5] tw:[color:#62715d] tw:[margin:0]; }
.invitation-close { @apply tw:[width:34px] tw:[height:34px] tw:shrink-0 tw:[border:1px_solid_#dce7d7] tw:[border-radius:10px] tw:bg-white tw:[color:#466839] tw:cursor-pointer; }
.invitation-steps { @apply tw:flex tw:[gap:.5rem] tw:list-none tw:[margin:0_1.5rem] tw:[padding:0_0_1rem] tw:[border-bottom:1px_solid_#e4ebdf]; }
.invitation-steps li { @apply tw:flex tw:items-center tw:[gap:.4rem] tw:flex-1 tw:[font-size:.78rem] tw:[color:#718168]; }
.invitation-steps li span { @apply tw:inline-flex tw:items-center tw:justify-center tw:[width:26px] tw:[height:26px] tw:rounded-full tw:[background:#eef2eb] tw:font-bold; }
.invitation-steps li.active { @apply tw:[color:#315e1b] tw:font-bold; }
.invitation-steps li.active span, .invitation-steps li.complete span { @apply tw:[background:#4c8734] tw:text-white; }
.invitation-body { @apply tw:overflow-y-auto tw:[padding:1.2rem_1.5rem] tw:[min-height:0]; }
.invitation-field { @apply tw:grid tw:[gap:.4rem] tw:[font-size:.8rem] tw:font-bold tw:[margin-bottom:1rem]; }
.invitation-field input, .invitation-field select { @apply tw:[min-width:0] tw:w-full tw:[min-height:42px] tw:[padding:.6rem_.7rem] tw:[border:1px_solid_#cfddc8] tw:[border-radius:9px] tw:bg-white tw:[color:#33452b] tw:[font:inherit] tw:font-normal; }
.invitation-upload { @apply tw:grid tw:[gap:.6rem] tw:justify-items-center tw:[padding:1.7rem_1rem] tw:[border:2px_dashed_#bbd4af] tw:[border-radius:14px] tw:[background:#f8fbf5] tw:text-center; }
.invitation-upload > i { @apply tw:[font-size:2rem] tw:[color:#4b8033]; }
.invitation-upload p { @apply tw:[font-size:.8rem] tw:[line-height:1.6] tw:[color:#62715d] tw:[max-width:480px] tw:[margin:0]; }
.invitation-file-label { @apply tw:grid tw:[gap:.5rem] tw:[font-size:.74rem] tw:[max-width:100%]; }
.invitation-file-label input { @apply tw:[font:inherit] tw:[max-width:100%] tw:[color:#3e6530]; }
.invitation-upload small { @apply tw:[font-size:.75rem] tw:break-all tw:[color:#456a32]; }
.invitation-help { @apply tw:[font-size:.77rem] tw:[line-height:1.6] tw:[color:#687760] tw:[margin:.8rem_0]; }
.invitation-section-context { @apply tw:[font-size:.77rem] tw:[line-height:1.5] tw:[color:#597148] tw:[margin:0_0_1rem] tw:[padding:.6rem_.75rem] tw:[border-radius:9px] tw:[background:#f3f8ee]; }
.invitation-retry { @apply tw:[border:0] tw:bg-transparent tw:[color:#42702c] tw:[font:inherit] tw:underline tw:cursor-pointer; }
.invitation-manual { @apply tw:inline-flex tw:items-center tw:[gap:.4rem] tw:[padding:.6rem_0] tw:[border:0] tw:bg-transparent tw:[color:#407227] tw:[font:inherit] tw:[font-size:.78rem] tw:font-semibold tw:cursor-pointer tw:text-left; }
.invitation-feedback { @apply tw:[padding:.7rem_.85rem] tw:[border-radius:9px] tw:[font-size:.79rem] tw:[line-height:1.5] tw:[margin:0_0_.9rem]; }
.invitation-feedback.error { @apply tw:[background:#fff1ef] tw:[color:#a32e26] tw:[border:1px_solid_#f0cec8]; }
.invitation-feedback.success { @apply tw:[background:#eef8e8] tw:[color:#38631f] tw:[border:1px_solid_#d2e6c6]; }
.invitation-review-summary { @apply tw:flex tw:flex-wrap tw:[gap:.6rem] tw:[margin-bottom:.6rem]; }
.invitation-review-summary > span { @apply tw:[padding:.65rem_.8rem] tw:[border:1px_solid_#d7e4d0] tw:[border-radius:9px] tw:[background:#f3f9ee] tw:[color:#4b7038] tw:[font-size:.8rem]; }
.invitation-review-summary .invalid { @apply tw:[background:#fff7ec] tw:[border-color:#ecd9ba] tw:[color:#985818]; }
.invitation-table-wrap { @apply tw:overflow-auto tw:[max-height:300px] tw:[border:1px_solid_#e0e8db] tw:[border-radius:10px]; }
.invitation-table-wrap table { @apply tw:w-full tw:[border-collapse:collapse] tw:[font-size:.78rem] tw:text-left; }
.invitation-table-wrap th { @apply tw:sticky tw:top-0 tw:[background:#f3f7ef] tw:[padding:.65rem_.7rem] tw:[color:#577245] tw:[font-size:.7rem] tw:whitespace-nowrap; }
.invitation-table-wrap td { @apply tw:[padding:.6rem_.7rem] tw:[border-top:1px_solid_#e6ecdf] tw:align-top; }
.invalid-row { @apply tw:[background:#fff8f4]; }
.invitation-row-valid { @apply tw:inline-flex tw:items-center tw:[gap:.3rem] tw:[color:#4b8133]; }
.invitation-row-errors { @apply tw:[margin:0] tw:[padding-left:1rem] tw:[color:#a84030] tw:[font-size:.73rem]; }
.invitation-discard { @apply tw:flex tw:items-start tw:[gap:.55rem] tw:[padding:.8rem] tw:[margin:.85rem_0] tw:[border:1px_solid_#e5d7b6] tw:[border-radius:9px] tw:[background:#fffaf0] tw:[font-size:.78rem] tw:[line-height:1.5]; }
.invitation-discard input { @apply tw:[margin-top:.2rem] tw:[accent-color:#4c8734] tw:shrink-0; }
.invitation-expiry { @apply tw:[max-width:230px] tw:[margin-top:1rem]; }
.invitation-success { @apply tw:flex tw:flex-wrap tw:items-center tw:[gap:.8rem] tw:[margin-bottom:.7rem]; }
.invitation-success > i { @apply tw:[font-size:1.8rem] tw:[color:#5b903d]; }
.invitation-success h3 { @apply tw:[margin:0] tw:[font-size:1rem]; }
.invitation-success p { @apply tw:[margin:.25rem_0_0] tw:[font-size:.75rem] tw:[color:#667660]; }
.invitation-status { @apply tw:inline-flex tw:[padding:.25rem_.5rem] tw:rounded-full tw:[background:#eaf5e3] tw:[color:#3b6c23] tw:[font-size:.68rem] tw:font-semibold tw:whitespace-nowrap; }
.invitation-status.waiting { @apply tw:[background:#fff3df] tw:[color:#8c591e]; }
.invitation-status.expired { @apply tw:[background:#ffeae4] tw:[color:#a43b2c]; }
.invitation-progress { @apply tw:w-full tw:[height:9px] tw:[margin:0_0_1rem] tw:[accent-color:#5b903d]; }
.invitation-link-field { @apply tw:flex tw:[gap:.5rem]; }
.invitation-link-field input { @apply tw:flex-1 tw:[font-size:.78rem]; }
.invitation-renew { @apply tw:flex tw:flex-wrap tw:items-end tw:[gap:.7rem] tw:[margin-bottom:1rem]; }
.invitation-renew .invitation-field { @apply tw:[margin:0]; }
.invitation-share-instructions { @apply tw:[padding:.9rem] tw:[margin:1rem_0] tw:[border:1px_solid_#dfe9d8] tw:[border-radius:11px] tw:[background:#f7faf4] tw:[font-size:.78rem] tw:[line-height:1.6]; }
.invitation-share-instructions ol { @apply tw:[margin:.4rem_0] tw:[padding-left:1.2rem]; }
.invitation-share-instructions p { @apply tw:[margin:0] tw:[color:#687760]; }
.invitation-footer { @apply tw:flex tw:justify-between tw:flex-wrap tw:[gap:.6rem] tw:[padding:1rem_1.5rem] tw:[border-top:1px_solid_#e4ebdf]; }
.invitation-footer-share { @apply tw:flex tw:flex-wrap tw:[gap:.6rem]; }
.invitation-button { @apply tw:inline-flex tw:items-center tw:justify-center tw:[gap:.4rem] tw:[min-height:40px] tw:[padding:.55rem_.85rem] tw:[border:1px_solid_#ccdec2] tw:[border-radius:9px] tw:[font:inherit] tw:[font-size:.78rem] tw:font-semibold tw:cursor-pointer; }
.invitation-button.primary { @apply tw:[background:#4c8734] tw:[border-color:#4c8734] tw:text-white; }
.invitation-button.secondary { @apply tw:bg-white tw:[color:#456b32]; }
.invitation-button.primary:hover:not(:disabled) { @apply tw:[background:#3a6d27]; }
.invitation-button.secondary:hover:not(:disabled) { @apply tw:[background:#f2f8ec]; }
button:disabled { @apply tw:cursor-not-allowed tw:opacity-60; }
button:focus-visible, input:focus-visible, select:focus-visible, .invitation-table-wrap:focus-visible { @apply tw:[outline:3px_solid_#b2d798] tw:[outline-offset:2px]; }
@media (max-width: 600px) {
  .invitation-backdrop { @apply tw:[padding:.5rem]; }
  .invitation-dialog { @apply tw:[max-height:calc(100dvh_-_1rem)] tw:[border-radius:14px]; }
  .invitation-header, .invitation-body, .invitation-footer { @apply tw:[padding:1rem]; }
  .invitation-steps { @apply tw:[margin:0_1rem]; }
  .invitation-steps li { @apply tw:[font-size:.7rem]; }
  .invitation-link-field { @apply tw:flex-col; }
  .invitation-footer > .invitation-button, .invitation-footer-share { @apply tw:w-full; }
  .invitation-footer-share > .invitation-button { @apply tw:flex-1; }
  .invitation-table-wrap table { @apply tw:[min-width:460px]; }
}
</style>
