<template>
  <section class="teacher-invitations" aria-labelledby="teacher-invitations-title">
    <header class="invitation-heading">
      <div>
        <span class="invitation-eyebrow">Teacher self-registration</span>
        <h2 id="teacher-invitations-title">Department registration link</h2>
        <p>Post one link in your teachers’ group chat. Each teacher enters their own profile and verifies their email to join your department.</p>
      </div>
      <div class="invitation-heading-actions">
        <button type="button" class="invitation-button invitation-button-secondary" :disabled="loading" @click="loadInvitations()">
          <i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-rotate-right'" aria-hidden="true"></i>
          <span>{{ loading ? 'Refreshing…' : 'Refresh' }}</span>
        </button>
        <button type="button" class="invitation-button invitation-button-primary" :disabled="working || !authToken" @click="openDialog('create')">
          <i class="fas fa-link" aria-hidden="true"></i> Generate Group Link
        </button>
      </div>
    </header>

    <p v-if="listError" class="invitation-notice is-error" role="alert">{{ listError }}</p>
    <p v-if="notice.message" class="invitation-notice" :class="`is-${notice.type}`" :role="notice.type === 'error' ? 'alert' : 'status'">{{ notice.message }}</p>

    <div v-if="sharedInvitation && statusFor(sharedInvitation) === 'Active'" class="invitation-link-panel">
      <label for="teacher-invitation-share-link">Group registration link</label>
      <div class="invitation-link-actions">
        <input id="teacher-invitation-share-link" ref="shareInput" :value="sharedInvitation.invitationUrl" type="text" readonly @focus="$event.target.select()">
        <button type="button" class="invitation-button invitation-button-secondary" @click="copyLink(sharedInvitation)">Copy Link</button>
      </div>
      <small>Copy this link into your teachers’ group chat. Multiple teachers can register until {{ formatDate(sharedInvitation.expiresAt) }}.</small>
    </div>

    <p v-if="loading && !loaded" class="invitation-empty" role="status">Loading registration links…</p>
    <div v-else-if="!groupInvitations.length && !listError" class="invitation-empty">
      <span class="invitation-empty-icon" aria-hidden="true"><i class="fas fa-link"></i></span>
      <h3>One link for your department</h3>
      <p>Generate a group link and share it with your teachers. They complete their own registration.</p>
    </div>
    <div v-if="groupInvitations.length" class="invitation-table-wrap" tabindex="0" role="region" aria-label="Department registration links; scroll horizontally to see all columns" :aria-busy="loading">
      <table class="invitation-table">
        <caption class="invitation-sr-only">Department group registration links, expiry dates, statuses and registrations</caption>
        <thead><tr><th scope="col">Link created</th><th scope="col">Expires</th><th scope="col">Status</th><th scope="col">Registrations</th><th scope="col">Actions</th></tr></thead>
        <tbody>
          <tr v-for="invitation in groupInvitations" :key="invitation.id">
            <th scope="row"><time :datetime="invitation.createdAt">{{ formatDate(invitation.createdAt) }}</time></th>
            <td><time :datetime="invitation.expiresAt">{{ formatDate(invitation.expiresAt) }}</time></td>
            <td><span class="invitation-status" :class="`status-${statusFor(invitation).toLowerCase()}`">{{ statusFor(invitation) }}</span></td>
            <td><strong class="invitation-registration-count">{{ registrationCount(invitation) }}</strong><span class="invitation-registration-label"> teachers registered</span></td>
            <td>
              <div v-if="canManage(invitation)" class="invitation-row-actions" :aria-label="`Actions for group link created ${formatDate(invitation.createdAt)}`">
                <button v-if="statusFor(invitation) === 'Active' && invitation.invitationUrl" type="button" class="invitation-action" @click="copyLink(invitation)">Copy Link</button>
                <button type="button" class="invitation-action" :disabled="working" @click="openDialog('resend', invitation)">Renew Link</button>
                <button type="button" class="invitation-action invitation-action-danger" :disabled="working" @click="openDialog('revoke', invitation)">Revoke Link</button>
              </div>
              <span v-else class="invitation-no-actions">No actions available</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <details v-if="legacyInvitations.length" class="invitation-history">
      <summary>Previous individual invitations ({{ legacyInvitations.length }})</summary>
      <p>Individual invitations are shown for reference. Share a department group link for new registrations.</p>
      <ul><li v-for="invitation in legacyInvitations" :key="invitation.id"><span>{{ invitation.name || invitation.email || 'Teacher invitation' }}</span><span>{{ statusFor(invitation) }}</span></li></ul>
    </details>

    <Teleport to="body">
      <dialog ref="dialog" class="teacher-invitation-dialog" aria-labelledby="teacher-invitation-dialog-title" aria-describedby="teacher-invitation-dialog-description" @cancel.prevent="closeDialog" @click="closeOnBackdrop">
        <form class="invitation-dialog-content" novalidate @submit.prevent="submitInvitation">
          <header class="invitation-dialog-header">
            <div>
              <span class="invitation-eyebrow">Department registration</span>
              <h2 id="teacher-invitation-dialog-title">{{ dialogTitle }}</h2>
            </div>
            <button type="button" class="invitation-close" aria-label="Close invitation dialog" :disabled="saving" @click="closeDialog"><i class="fas fa-xmark" aria-hidden="true"></i></button>
          </header>
          <p id="teacher-invitation-dialog-description" class="invitation-dialog-description">{{ dialogDescription }}</p>

          <label v-if="dialogMode !== 'revoke'" class="invitation-field" for="teacher-invitation-expiry">
            <span>Link expires in</span>
            <select id="teacher-invitation-expiry" ref="expiryInput" v-model.number="form.expiresInHours" :aria-invalid="Boolean(formErrors.expiresInHours)" aria-describedby="teacher-invitation-expiry-help">
              <option :value="12">12 hours</option><option :value="24">24 hours</option><option :value="48">48 hours</option>
            </select>
            <small id="teacher-invitation-expiry-help">Maximum 48 hours. {{ dialogMode === 'create' ? 'An existing active group link keeps its current expiry.' : 'Renewing starts a new expiry period.' }}</small>
          </label>
          <p v-if="dialogError" class="invitation-notice is-error" role="alert">{{ dialogError }}</p>
          <footer class="invitation-dialog-actions">
            <button type="button" class="invitation-button invitation-button-secondary" :disabled="saving" @click="closeDialog">Cancel</button>
            <button type="submit" class="invitation-button" :class="dialogMode === 'revoke' ? 'invitation-button-danger' : 'invitation-button-primary'" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              {{ saving ? 'Saving…' : dialogMode === 'create' ? 'Generate Group Link' : dialogMode === 'resend' ? 'Renew Link' : 'Revoke Link' }}
            </button>
          </footer>
        </form>
      </dialog>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({ apiBaseUrl: { type: String, required: true }, authToken: { type: String, default: '' } })
const emit = defineEmits(['accepted'])
const invitations = ref([])
const loading = ref(false)
const loaded = ref(false)
const listError = ref('')
const notice = reactive({ type: 'success', message: '' })
const saving = ref(false)
const dialog = ref(null)
const dialogMode = ref('create')
const selectedInvitation = ref(null)
const dialogError = ref('')
const expiryInput = ref(null)
const shareInput = ref(null)
const sharedId = ref('')
const now = ref(Date.now())
const form = reactive({ expiresInHours: 48 })
const formErrors = reactive({ expiresInHours: '' })
const working = computed(() => saving.value)
const groupInvitations = computed(() => invitations.value.filter(item => item.isGroup === true))
const legacyInvitations = computed(() => invitations.value.filter(item => item.isGroup !== true))
const sharedInvitation = computed(() => groupInvitations.value.find(item => item.id === sharedId.value && item.invitationUrl)
  || groupInvitations.value.find(item => statusFor(item) === 'Active' && item.invitationUrl))
const endpoint = computed(() => `${String(props.apiBaseUrl || '/api').replace(/\/+$/, '')}/headteacher/teacher-invitations`)
const dialogTitle = computed(() => dialogMode.value === 'create' ? 'Generate a group link' : dialogMode.value === 'resend' ? 'Renew group link' : 'Revoke group link?')
const dialogDescription = computed(() => dialogMode.value === 'create'
  ? 'Share one link in your teachers’ group chat. Each teacher creates their own account and verifies their email. You can have one active group link for your department.'
  : dialogMode.value === 'resend'
    ? 'Create a fresh link and renew its expiry, then post it in your group chat. The previous link will stop accepting registrations.'
    : 'This link will stop accepting new registrations. Existing teacher accounts stay active.')
let listController
let requestVersion = 0
let refreshTimer
let disposed = false
let registrationCounts = new Map()

const authConfig = () => ({ headers: { Authorization: `Bearer ${props.authToken}` } })
const statusFor = invitation => {
  if (invitation?.status === 'Pending' && Date.parse(invitation.expiresAt) <= now.value) return 'Expired'
  if (invitation?.isGroup === true && invitation.status === 'Pending') return 'Active'
  return ['Pending', 'Accepted', 'Expired', 'Revoked'].includes(invitation?.status) ? invitation.status : 'Unavailable'
}
const canManage = invitation => invitation?.isGroup === true && ['Active', 'Expired'].includes(statusFor(invitation))
const registrationCount = invitation => Math.max(0, Number(invitation?.registrationCount) || 0)
const formatDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function observeRegistrations(items) {
  const groups = items.filter(item => item.isGroup === true)
  const increased = groups.filter(item => registrationCount(item) > (registrationCounts.get(item.id) || 0))
  for (const item of groups) registrationCounts.set(item.id, registrationCount(item))
  if (loaded.value && increased.length) emit('accepted', increased)
}
async function loadInvitations(options = {}) {
  if (!props.authToken || disposed || (loading.value && !options.force)) return
  listController?.abort()
  const controller = new AbortController()
  listController = controller
  const version = ++requestVersion
  loading.value = true
  try {
    const response = await axios.get(endpoint.value, { ...authConfig(), signal: controller.signal })
    if (version !== requestVersion || disposed) return
    if (!Array.isArray(response.data?.invitations)) throw new Error('Registration links could not be loaded. Please try again.')
    const items = response.data.invitations
    observeRegistrations(items)
    invitations.value = items
    loaded.value = true
    listError.value = ''
  } catch (error) {
    if (version !== requestVersion || disposed || error.code === 'ERR_CANCELED') return
    listError.value = error.response?.data?.message || 'Department registration links could not be loaded. Please refresh and try again.'
  } finally { if (version === requestVersion && !disposed) loading.value = false }
}
function updateInvitation(invitation) {
  // A list request started before this write must not restore an older link.
  ++requestVersion
  listController?.abort()
  loading.value = false
  const item = { ...invitation }
  observeRegistrations([item])
  const index = invitations.value.findIndex(entry => entry.id === item.id)
  if (index < 0) invitations.value.unshift(item)
  else invitations.value.splice(index, 1, item)
  listError.value = ''
  return item
}
async function openDialog(mode, invitation = null) {
  if (saving.value || !props.authToken || (mode !== 'create' && !canManage(invitation))) return
  selectedInvitation.value = invitation
  dialogMode.value = mode
  form.expiresInHours = 48
  Object.keys(formErrors).forEach(key => { formErrors[key] = '' })
  dialogError.value = ''
  await nextTick()
  dialog.value?.showModal()
  if (mode !== 'revoke') expiryInput.value?.focus()
}
function closeDialog() {
  if (!saving.value) dialog.value?.close()
}
function closeOnBackdrop(event) {
  if (event.target === dialog.value) {
    const bounds = dialog.value.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog()
  }
}
function validateForm() {
  formErrors.expiresInHours = dialogMode.value !== 'revoke' && (!Number.isInteger(form.expiresInHours) || form.expiresInHours < 1 || form.expiresInHours > 48) ? 'Choose an expiry between 1 and 48 hours.' : ''
  dialogError.value = formErrors.expiresInHours
  return !Object.values(formErrors).some(Boolean)
}
async function submitInvitation() {
  if (saving.value || !props.authToken) return
  if (!validateForm()) {
    await nextTick()
    dialog.value?.querySelector('[aria-invalid="true"]')?.focus()
    return
  }
  const mode = dialogMode.value
  const selected = invitations.value.find(item => item.id === selectedInvitation.value?.id) || selectedInvitation.value
  if (mode !== 'create' && !canManage(selected)) {
    dialogError.value = 'This group link is no longer available for that action. Refresh the list.'
    return
  }
  saving.value = true
  dialogError.value = ''
  const requestToken = props.authToken
  const requestEndpoint = endpoint.value
  try {
    const url = mode === 'create' ? endpoint.value : `${endpoint.value}/${encodeURIComponent(selected.id)}/${mode}`
    const body = mode === 'revoke' ? {} : { expiresInHours: form.expiresInHours }
    const response = await axios.post(url, body, authConfig())
    if (disposed || props.authToken !== requestToken || endpoint.value !== requestEndpoint) return
    if (!response.data?.invitation?.id || response.data.invitation.isGroup !== true) throw new Error('The group link response was incomplete. Refresh the list before trying again.')
    const item = updateInvitation(response.data.invitation)
    if (mode === 'revoke') {
      notice.type = 'success'
      notice.message = 'Group link revoked. Generate a new link when you are ready to accept registrations.'
    } else {
      sharedId.value = item.id
      notice.type = 'success'
      notice.message = mode === 'create' ? 'Your department group link is ready. Copy it into your teachers’ group chat.' : 'Group link renewed. Post the new link in your teachers’ group chat; the previous link no longer works.'
    }
    dialog.value?.close()
  } catch (error) {
    if (disposed || props.authToken !== requestToken || endpoint.value !== requestEndpoint) return
    dialogError.value = error.response?.data?.message || error.message || 'Unable to save the group link. Please try again.'
    if (error.response?.status === 409) await loadInvitations({ force: true })
  } finally { if (!disposed) saving.value = false }
}
async function copyLink(invitation) {
  now.value = Date.now()
  if (statusFor(invitation) !== 'Active' || !invitation.invitationUrl) return
  sharedId.value = invitation.id
  try {
    await navigator.clipboard.writeText(invitation.invitationUrl)
    notice.type = 'success'
    notice.message = 'Group link copied. Share it in your teachers’ group chat.'
  } catch {
    notice.type = 'warning'
    notice.message = 'Select and copy the group link below, then share it in your teachers’ group chat.'
    await nextTick()
    shareInput.value?.focus()
    shareInput.value?.select()
  }
}
function refreshVisible() {
  now.value = Date.now()
  if (document.visibilityState === 'visible' && !saving.value) loadInvitations()
}
watch(() => [props.authToken, props.apiBaseUrl], () => {
  ++requestVersion
  listController?.abort()
  invitations.value = []
  loading.value = false
  loaded.value = false
  listError.value = ''
  notice.message = ''
  sharedId.value = ''
  registrationCounts = new Map()
  dialog.value?.close()
  selectedInvitation.value = null
  loadInvitations()
})
onMounted(() => {
  loadInvitations()
  window.addEventListener('focus', refreshVisible)
  document.addEventListener('visibilitychange', refreshVisible)
  refreshTimer = window.setInterval(refreshVisible, 30000)
})
onBeforeUnmount(() => {
  disposed = true
  listController?.abort()
  window.clearInterval(refreshTimer)
  window.removeEventListener('focus', refreshVisible)
  document.removeEventListener('visibilitychange', refreshVisible)
  dialog.value?.close()
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";

.teacher-invitations { @apply tw:[margin-bottom:1.35rem] tw:[padding:clamp(1rem,_2vw,_1.5rem)] tw:[border:1px_solid_#dce7d8] tw:[border-radius:20px] tw:bg-white tw:[box-shadow:0_12px_28px_rgba(30,_67,_7,_0.05)] tw:min-w-0; }
.invitation-heading { @apply tw:flex tw:items-start tw:justify-between tw:[gap:1rem] tw:flex-wrap; }
.invitation-heading > div:first-child { @apply tw:[flex:1_1_260px] tw:min-w-0; }
.invitation-eyebrow { @apply tw:[color:#4c733b] tw:[font-size:.7rem] tw:font-bold tw:uppercase tw:[letter-spacing:.09em]; }
.invitation-heading h2, .invitation-dialog-header h2 { @apply tw:[margin:.3rem_0_.45rem] tw:[color:#1e4307] tw:[font-size:1.25rem] tw:font-bold tw:[line-height:1.3]; }
.invitation-heading p, .invitation-dialog-description { @apply tw:m-0 tw:[color:#63745c] tw:[font-size:.85rem] tw:[line-height:1.6]; }
.invitation-heading-actions, .invitation-link-actions, .invitation-dialog-actions { @apply tw:flex tw:items-center tw:[gap:.6rem] tw:flex-wrap; }
.invitation-button { @apply tw:inline-flex tw:items-center tw:justify-center tw:[gap:.45rem] tw:[min-height:44px] tw:[padding:.65rem_.9rem] tw:[border:1px_solid_transparent] tw:[border-radius:10px] tw:[font-size:.8rem] tw:font-bold tw:cursor-pointer tw:[transition:background-color_.15s_ease]; }
.invitation-button-primary { @apply tw:[background:#2f6018] tw:text-white; }
.invitation-button-primary:hover { @apply tw:[background:#244b12]; }
.invitation-button-primary > i { @apply tw:text-white; }
.invitation-button-secondary { @apply tw:[border-color:#cfddc7] tw:bg-white tw:[color:#355927]; }
.invitation-button-secondary:hover { @apply tw:[background:#f1f7ed]; }
.invitation-button-danger { @apply tw:[background:#b91c1c] tw:text-white; }
.invitation-button-danger:hover { @apply tw:[background:#991b1b]; }
.invitation-button:disabled, .invitation-action:disabled, .invitation-close:disabled { @apply tw:opacity-50 tw:cursor-not-allowed; }
.invitation-button:focus-visible, .invitation-action:focus-visible, .invitation-close:focus-visible, .invitation-table-wrap:focus-visible { @apply tw:[outline:3px_solid_#86b96a] tw:[outline-offset:3px]; }
.invitation-notice { @apply tw:[margin:1rem_0_0] tw:[padding:.8rem_1rem] tw:[border:1px_solid_#cfe1c4] tw:[border-radius:10px] tw:[background:#f1f8ec] tw:[color:#2f571b] tw:[font-size:.83rem] tw:[line-height:1.55]; }
.invitation-notice.is-error { @apply tw:[background:#fff1f2] tw:[border-color:#fecdd3] tw:[color:#9f1239]; }
.invitation-notice.is-warning { @apply tw:[background:#fffbeb] tw:[border-color:#fde68a] tw:[color:#92400e]; }
.invitation-link-panel { @apply tw:[margin-top:1rem] tw:[padding:1rem] tw:[border:1px_solid_#d7e5ce] tw:[border-radius:12px] tw:[background:#f8fbf5]; }
.invitation-link-panel > label { @apply tw:block tw:[margin-bottom:.5rem] tw:[color:#335329] tw:[font-size:.8rem] tw:font-bold; }
.invitation-link-panel input { @apply tw:[flex:1_1_240px] tw:min-w-0; }
.invitation-link-panel small { @apply tw:block tw:[margin-top:.5rem] tw:[color:#607656] tw:[font-size:.74rem] tw:[line-height:1.5]; }
.invitation-link-panel input, .invitation-field input, .invitation-field select { @apply tw:w-full tw:[min-height:44px] tw:[padding:.7rem_.75rem] tw:[border:1px_solid_#cbd9c4] tw:[border-radius:9px] tw:bg-white tw:[color:#21371a] tw:[font-size:.85rem] tw:box-border; }
.invitation-field input:focus, .invitation-field select:focus, .invitation-link-panel input:focus { @apply tw:[outline:2px_solid_#79a861] tw:[outline-offset:2px]; }
.invitation-field input[aria-invalid="true"] { @apply tw:[border-color:#be123c]; }
.invitation-empty { @apply tw:[padding:2rem_1rem_1rem] tw:text-center tw:[color:#65795b] tw:[font-size:.85rem] tw:[line-height:1.6]; }
.invitation-empty h3 { @apply tw:[margin:.7rem_0_.35rem] tw:[font-size:1rem] tw:[color:#2c4d1d] tw:font-bold; }
.invitation-empty p { @apply tw:[max-width:440px] tw:mx-auto tw:mb-0; }
.invitation-empty-icon { @apply tw:inline-flex tw:items-center tw:justify-center tw:[width:48px] tw:[height:48px] tw:rounded-full tw:[background:#edf5e6] tw:[color:#4a7a31] tw:[font-size:1.1rem]; }
.invitation-table-wrap { @apply tw:[margin-top:1.25rem] tw:w-full tw:overflow-x-auto tw:[border:1px_solid_#e1e9dc] tw:[border-radius:12px]; }
.invitation-table { @apply tw:w-full tw:[min-width:760px] tw:border-collapse tw:text-left tw:[font-size:.78rem]; }
.invitation-table th, .invitation-table td { @apply tw:[padding:.85rem_.8rem] tw:[border-bottom:1px_solid_#e7eee2] tw:align-top tw:[color:#45583c] tw:[line-height:1.55]; }
.invitation-table thead th { @apply tw:[background:#f5f9f1] tw:[color:#416232] tw:[font-size:.7rem] tw:font-bold tw:uppercase tw:[letter-spacing:.04em]; }
.invitation-table tbody th { @apply tw:[color:#2c451f] tw:font-semibold tw:[min-width:130px] tw:[overflow-wrap:anywhere]; }
.invitation-table tbody tr:last-child > * { @apply tw:border-b-0; }
.invitation-table time { @apply tw:block tw:[min-width:115px]; }
.invitation-registration-count { @apply tw:[font-size:.95rem] tw:[color:#2f6018]; }
.invitation-registration-label { @apply tw:[color:#65795b] tw:[font-size:.72rem]; }
.invitation-status { @apply tw:inline-flex tw:[padding:.25rem_.55rem] tw:rounded-full tw:[font-size:.7rem] tw:font-bold tw:[background:#f1f5f9] tw:[color:#475569]; }
.status-pending { @apply tw:[background:#fef3c7] tw:[color:#92400e]; }
.status-accepted, .status-active { @apply tw:[background:#dcfce7] tw:[color:#166534]; }
.status-expired { @apply tw:[background:#fff1e8] tw:[color:#9a3412]; }
.invitation-row-actions { @apply tw:flex tw:flex-wrap tw:[gap:.35rem] tw:[min-width:210px]; }
.invitation-action { @apply tw:[padding:.4rem_.5rem] tw:[min-height:36px] tw:[border:1px_solid_#d3dfca] tw:[border-radius:7px] tw:bg-white tw:[color:#35601f] tw:[font-size:.7rem] tw:font-semibold tw:cursor-pointer; }
.invitation-action:hover { @apply tw:[background:#f1f7ed]; }
.invitation-action-danger { @apply tw:[color:#b91c1c] tw:[border-color:#fecaca]; }
.invitation-no-actions { @apply tw:[color:#74836b] tw:[font-size:.72rem]; }
.invitation-history { @apply tw:[margin-top:1rem] tw:[border-top:1px_solid_#e1e9dc] tw:[padding-top:.85rem] tw:[font-size:.78rem] tw:[color:#6b7b62]; }
.invitation-history summary { @apply tw:cursor-pointer tw:font-semibold tw:[color:#476839]; }
.invitation-history summary:focus-visible { @apply tw:[outline:3px_solid_#86b96a] tw:[outline-offset:3px]; }
.invitation-history p { @apply tw:[margin:.65rem_0] tw:[line-height:1.5]; }
.invitation-history ul { @apply tw:list-none tw:p-0 tw:m-0; }
.invitation-history li { @apply tw:flex tw:justify-between tw:flex-wrap tw:[gap:.5rem] tw:[padding:.45rem_0] tw:[overflow-wrap:anywhere]; }
.invitation-sr-only { @apply tw:sr-only; }
.teacher-invitation-dialog { @apply tw:[width:min(520px,_calc(100vw_-_24px))] tw:[max-width:calc(100vw_-_24px)] tw:[max-height:calc(100dvh_-_32px)] tw:[padding:0] tw:[border:1px_solid_#d9e6d1] tw:[border-radius:18px] tw:bg-white tw:[box-shadow:0_24px_80px_rgba(18,_43,_5,_.22)] tw:overflow-y-auto tw:box-border; }
.teacher-invitation-dialog::backdrop { @apply tw:[background:rgba(12,_30,_5,_.5)]; }
.invitation-dialog-content { @apply tw:[padding:1.4rem]; }
.invitation-dialog-header { @apply tw:flex tw:items-start tw:justify-between tw:[gap:1rem]; }
.invitation-close { @apply tw:inline-flex tw:items-center tw:justify-center tw:[width:40px] tw:[height:40px] tw:[border:1px_solid_#dce6d6] tw:[border-radius:9px] tw:bg-white tw:[color:#426334] tw:cursor-pointer tw:shrink-0; }
.invitation-dialog-description { @apply tw:[margin-bottom:1.25rem]; }
.invitation-field { @apply tw:grid tw:[gap:.45rem] tw:[margin-top:1rem] tw:[color:#344d29] tw:[font-size:.85rem] tw:font-semibold; }
.invitation-field > span small { @apply tw:font-normal tw:[color:#708166]; }
.invitation-field > small { @apply tw:[font-size:.74rem] tw:font-normal tw:[color:#6a7d60] tw:[line-height:1.5]; }
.invitation-field > .invitation-field-error { @apply tw:[color:#be123c]; }
.invitation-dialog-actions { @apply tw:justify-end tw:[margin-top:1.5rem] tw:[padding-top:1rem] tw:[border-top:1px_solid_#e5ecdf]; }
@media (max-width: 600px) {
  .invitation-heading-actions { @apply tw:w-full; }
  .invitation-heading-actions .invitation-button { @apply tw:flex-1; }
  .invitation-dialog-content { @apply tw:[padding:1rem]; }
  .invitation-dialog-actions .invitation-button { @apply tw:flex-1; }
  .invitation-link-actions .invitation-button { @apply tw:w-full; }
}
</style>
