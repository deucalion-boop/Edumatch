<template>
  <section class="teacher-invitations" aria-labelledby="teacher-invitations-title">
    <header class="invitation-heading">
      <div>
        <span class="invitation-eyebrow">Teacher onboarding</span>
        <h2 id="teacher-invitations-title">Teacher invitations</h2>
        <p>Invite teachers to register and join your department. Links remain available for up to 48 hours.</p>
      </div>
      <div class="invitation-heading-actions">
        <button type="button" class="invitation-button invitation-button-secondary" :disabled="loading" @click="loadInvitations()">
          <i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-rotate-right'" aria-hidden="true"></i>
          <span>{{ loading ? 'Refreshing…' : 'Refresh' }}</span>
        </button>
        <button type="button" class="invitation-button invitation-button-primary" :disabled="working || !authToken" @click="openDialog('create')">
          <i class="fas fa-envelope-open-text" aria-hidden="true"></i> Invite Teacher
        </button>
      </div>
    </header>

    <p v-if="listError" class="invitation-notice is-error" role="alert">{{ listError }}</p>
    <p v-if="notice.message" class="invitation-notice" :class="`is-${notice.type}`" :role="notice.type === 'error' ? 'alert' : 'status'">{{ notice.message }}</p>

    <div v-if="sharedInvitation && statusFor(sharedInvitation) === 'Pending'" class="invitation-link-panel">
      <label for="teacher-invitation-share-link">Invitation link</label>
      <div class="invitation-link-actions">
        <input id="teacher-invitation-share-link" ref="shareInput" :value="sharedInvitation.invitationUrl" type="text" readonly @focus="$event.target.select()">
        <button type="button" class="invitation-button invitation-button-secondary" @click="copyLink(sharedInvitation)">Copy Link</button>
      </div>
      <small>Share this link with the intended teacher. It expires {{ formatDate(sharedInvitation.expiresAt) }}.</small>
    </div>

    <p v-if="loading && !loaded" class="invitation-empty" role="status">Loading teacher invitations…</p>
    <div v-else-if="!invitations.length && !listError" class="invitation-empty">
      <span class="invitation-empty-icon" aria-hidden="true"><i class="fas fa-envelope-open-text"></i></span>
      <h3>No teacher invitations yet</h3>
      <p>Create a link to let a teacher complete their own registration. Add an email to send it directly.</p>
    </div>
    <div v-if="invitations.length" class="invitation-table-wrap" tabindex="0" role="region" aria-label="Teacher invitations table; scroll horizontally to see all columns" :aria-busy="loading">
      <table class="invitation-table">
        <caption class="invitation-sr-only">Teacher invitation names, email addresses, dates, statuses and actions</caption>
        <thead><tr><th scope="col">Teacher name</th><th scope="col">Email</th><th scope="col">Invited</th><th scope="col">Expires</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
        <tbody>
          <tr v-for="invitation in invitations" :key="invitation.id">
            <th scope="row">{{ invitation.name || 'Teacher invitation' }}</th>
            <td class="invitation-email">{{ invitation.email || 'Link only' }}<small v-if="invitation.delivery?.emailSent === false && statusFor(invitation) === 'Pending'">Email not sent; share the link.</small></td>
            <td><time :datetime="invitation.createdAt">{{ formatDate(invitation.createdAt) }}</time></td>
            <td><time :datetime="invitation.expiresAt">{{ formatDate(invitation.expiresAt) }}</time></td>
            <td><span class="invitation-status" :class="`status-${statusFor(invitation).toLowerCase()}`">{{ statusFor(invitation) }}</span></td>
            <td>
              <div v-if="canManage(invitation)" class="invitation-row-actions" :aria-label="`Actions for ${invitation.name || invitation.email || 'teacher invitation'}`">
                <button v-if="statusFor(invitation) === 'Pending' && invitation.invitationUrl" type="button" class="invitation-action" @click="copyLink(invitation)">Copy Link</button>
                <button type="button" class="invitation-action" :disabled="working" @click="openDialog('resend', invitation)">Resend Invitation</button>
                <button type="button" class="invitation-action invitation-action-danger" :disabled="working" @click="openDialog('revoke', invitation)">Revoke</button>
              </div>
              <span v-else class="invitation-no-actions">{{ statusFor(invitation) === 'Accepted' ? 'Registration complete' : 'No actions available' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <dialog ref="dialog" class="teacher-invitation-dialog" aria-labelledby="teacher-invitation-dialog-title" aria-describedby="teacher-invitation-dialog-description" @cancel.prevent="closeDialog" @click="closeOnBackdrop">
        <form class="invitation-dialog-content" novalidate @submit.prevent="submitInvitation">
          <header class="invitation-dialog-header">
            <div>
              <span class="invitation-eyebrow">Teacher invitations</span>
              <h2 id="teacher-invitation-dialog-title">{{ dialogTitle }}</h2>
            </div>
            <button type="button" class="invitation-close" aria-label="Close invitation dialog" :disabled="saving" @click="closeDialog"><i class="fas fa-xmark" aria-hidden="true"></i></button>
          </header>
          <p id="teacher-invitation-dialog-description" class="invitation-dialog-description">{{ dialogDescription }}</p>

          <template v-if="dialogMode === 'create'">
            <label class="invitation-field" for="teacher-invitation-name">
              <span>Teacher name <small>(optional)</small></span>
              <input id="teacher-invitation-name" ref="nameInput" v-model.trim="form.name" type="text" autocomplete="name" maxlength="100" placeholder="e.g. Maria Santos" :aria-invalid="Boolean(formErrors.name)" :aria-describedby="formErrors.name ? 'teacher-invitation-name-error' : undefined">
              <small v-if="formErrors.name" id="teacher-invitation-name-error" class="invitation-field-error">{{ formErrors.name }}</small>
            </label>
            <label class="invitation-field" for="teacher-invitation-email">
              <span>School email <small>(optional)</small></span>
              <input id="teacher-invitation-email" v-model.trim="form.email" type="email" autocomplete="email" maxlength="254" placeholder="teacher@school.edu.ph" :aria-invalid="Boolean(formErrors.email)" :aria-describedby="formErrors.email ? 'teacher-invitation-email-error' : 'teacher-invitation-email-help'">
              <small v-if="formErrors.email" id="teacher-invitation-email-error" class="invitation-field-error">{{ formErrors.email }}</small>
              <small v-else id="teacher-invitation-email-help">Add an email to send the invitation, or leave it blank to copy and share the link.</small>
            </label>
          </template>
          <div v-else-if="selectedInvitation" class="invitation-recipient">
            <strong>{{ selectedInvitation.name || 'Teacher invitation' }}</strong>
            <span>{{ selectedInvitation.email || 'Link only' }}</span>
          </div>

          <label v-if="dialogMode !== 'revoke'" class="invitation-field" for="teacher-invitation-expiry">
            <span>Link expires in</span>
            <select id="teacher-invitation-expiry" v-model.number="form.expiresInHours" :aria-invalid="Boolean(formErrors.expiresInHours)" aria-describedby="teacher-invitation-expiry-help">
              <option :value="12">12 hours</option><option :value="24">24 hours</option><option :value="48">48 hours</option>
            </select>
            <small id="teacher-invitation-expiry-help">Maximum 48 hours from {{ dialogMode === 'resend' ? 'resending' : 'creation' }}.</small>
          </label>
          <p v-if="dialogError" class="invitation-notice is-error" role="alert">{{ dialogError }}</p>
          <footer class="invitation-dialog-actions">
            <button type="button" class="invitation-button invitation-button-secondary" :disabled="saving" @click="closeDialog">Cancel</button>
            <button type="submit" class="invitation-button" :class="dialogMode === 'revoke' ? 'invitation-button-danger' : 'invitation-button-primary'" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              {{ saving ? 'Saving…' : dialogMode === 'create' ? 'Create Invitation' : dialogMode === 'resend' ? 'Resend Invitation' : 'Revoke Invitation' }}
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
import { nameError } from '../../utils/teacherValidation.js'

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
const nameInput = ref(null)
const shareInput = ref(null)
const sharedId = ref('')
const now = ref(Date.now())
const form = reactive({ name: '', email: '', expiresInHours: 48 })
const formErrors = reactive({ name: '', email: '', expiresInHours: '' })
const working = computed(() => saving.value)
const sharedInvitation = computed(() => invitations.value.find(item => item.id === sharedId.value && item.invitationUrl))
const endpoint = computed(() => `${String(props.apiBaseUrl || '/api').replace(/\/+$/, '')}/headteacher/teacher-invitations`)
const dialogTitle = computed(() => dialogMode.value === 'create' ? 'Invite a teacher' : dialogMode.value === 'resend' ? 'Resend invitation' : 'Revoke invitation?')
const dialogDescription = computed(() => dialogMode.value === 'create'
  ? 'The teacher completes their own registration and joins your department. A name and email are optional.'
  : dialogMode.value === 'resend'
    ? 'Create a fresh link and renew its expiry. The previous link will stop working. An email is sent when this invitation has an email address.'
    : 'The current link will stop working. The teacher will need a new invitation to register.')
let listController
let requestVersion = 0
let refreshTimer
let disposed = false
let acceptedIds = new Set()

const authConfig = () => ({ headers: { Authorization: `Bearer ${props.authToken}` } })
const statusFor = invitation => {
  if (invitation?.status === 'Pending' && Date.parse(invitation.expiresAt) <= now.value) return 'Expired'
  return ['Pending', 'Accepted', 'Expired', 'Revoked'].includes(invitation?.status) ? invitation.status : 'Unavailable'
}
const canManage = invitation => ['Pending', 'Expired'].includes(statusFor(invitation))
const formatDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function observeAccepted(items) {
  const newlyAccepted = items.filter(item => item.status === 'Accepted' && !acceptedIds.has(item.id))
  for (const item of items) if (item.status === 'Accepted') acceptedIds.add(item.id)
  if (loaded.value && newlyAccepted.length) emit('accepted', newlyAccepted)
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
    if (!Array.isArray(response.data?.invitations)) throw new Error('The invitation list could not be loaded. Please try again.')
    const items = response.data.invitations
    observeAccepted(items)
    invitations.value = items
    loaded.value = true
    listError.value = ''
  } catch (error) {
    if (version !== requestVersion || disposed || error.code === 'ERR_CANCELED') return
    listError.value = error.response?.data?.message || 'Teacher invitations could not be loaded. Please refresh and try again.'
  } finally { if (version === requestVersion && !disposed) loading.value = false }
}
function updateInvitation(invitation, delivery) {
  // A list request started before this write must not restore an older link.
  ++requestVersion
  listController?.abort()
  loading.value = false
  const item = { ...invitation, ...(delivery ? { delivery } : {}) }
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
  form.name = ''
  form.email = ''
  form.expiresInHours = 48
  Object.keys(formErrors).forEach(key => { formErrors[key] = '' })
  dialogError.value = ''
  await nextTick()
  dialog.value?.showModal()
  if (mode === 'create') nameInput.value?.focus()
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
  formErrors.name = dialogMode.value === 'create' && form.name ? nameError(form.name, 'Teacher name', 100) : ''
  formErrors.email = dialogMode.value === 'create' && form.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.email.length > 254) ? 'Enter a valid school email address or leave this field blank.' : ''
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
    dialogError.value = 'This invitation is no longer available for that action. Refresh the list.'
    return
  }
  saving.value = true
  dialogError.value = ''
  const requestToken = props.authToken
  const requestEndpoint = endpoint.value
  try {
    const url = mode === 'create' ? endpoint.value : `${endpoint.value}/${encodeURIComponent(selected.id)}/${mode}`
    const body = mode === 'revoke' ? {} : {
      expiresInHours: form.expiresInHours,
      ...(mode === 'create' && form.name ? { name: form.name.trim() } : {}),
      ...(mode === 'create' && form.email ? { email: form.email.trim() } : {}),
    }
    const response = await axios.post(url, body, authConfig())
    if (disposed || props.authToken !== requestToken || endpoint.value !== requestEndpoint) return
    if (!response.data?.invitation?.id) throw new Error('The invitation response was incomplete. Refresh the list before trying again.')
    const item = updateInvitation(response.data.invitation, response.data.delivery)
    if (mode === 'revoke') {
      notice.type = 'success'
      notice.message = 'Invitation revoked. Its link can no longer be used.'
    } else {
      sharedId.value = item.id
      const delivery = response.data.delivery || item.delivery
      notice.type = delivery?.emailSent === false ? 'warning' : 'success'
      const action = mode === 'create' ? 'Invitation created.' : 'Invitation renewed. The previous link no longer works.'
      notice.message = `${action} ${delivery?.emailSent === true ? 'The invitation email was sent.' : delivery?.emailSent === false ? 'The email could not be sent. Copy and share the link below.' : 'Copy and share the link below.'}`
    }
    dialog.value?.close()
  } catch (error) {
    if (disposed || props.authToken !== requestToken || endpoint.value !== requestEndpoint) return
    dialogError.value = error.response?.data?.message || error.message || 'Unable to save the invitation. Please try again.'
    if (error.response?.status === 409) await loadInvitations({ force: true })
  } finally { if (!disposed) saving.value = false }
}
async function copyLink(invitation) {
  now.value = Date.now()
  if (statusFor(invitation) !== 'Pending' || !invitation.invitationUrl) return
  sharedId.value = invitation.id
  try {
    await navigator.clipboard.writeText(invitation.invitationUrl)
    notice.type = 'success'
    notice.message = 'Invitation link copied.'
  } catch {
    notice.type = 'warning'
    notice.message = 'Select and copy the invitation link below.'
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
  acceptedIds = new Set()
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
.invitation-table { @apply tw:w-full tw:[min-width:850px] tw:border-collapse tw:text-left tw:[font-size:.78rem]; }
.invitation-table th, .invitation-table td { @apply tw:[padding:.85rem_.8rem] tw:[border-bottom:1px_solid_#e7eee2] tw:align-top tw:[color:#45583c] tw:[line-height:1.55]; }
.invitation-table thead th { @apply tw:[background:#f5f9f1] tw:[color:#416232] tw:[font-size:.7rem] tw:font-bold tw:uppercase tw:[letter-spacing:.04em]; }
.invitation-table tbody th { @apply tw:[color:#2c451f] tw:font-semibold tw:[min-width:130px] tw:[overflow-wrap:anywhere]; }
.invitation-table tbody tr:last-child > * { @apply tw:border-b-0; }
.invitation-email { @apply tw:[max-width:220px] tw:[overflow-wrap:anywhere]; }
.invitation-email small { @apply tw:block tw:[margin-top:.25rem] tw:[color:#92400e] tw:[font-size:.7rem]; }
.invitation-table time { @apply tw:block tw:[min-width:115px]; }
.invitation-status { @apply tw:inline-flex tw:[padding:.25rem_.55rem] tw:rounded-full tw:[font-size:.7rem] tw:font-bold tw:[background:#f1f5f9] tw:[color:#475569]; }
.status-pending { @apply tw:[background:#fef3c7] tw:[color:#92400e]; }
.status-accepted { @apply tw:[background:#dcfce7] tw:[color:#166534]; }
.status-expired { @apply tw:[background:#fff1e8] tw:[color:#9a3412]; }
.invitation-row-actions { @apply tw:flex tw:flex-wrap tw:[gap:.35rem] tw:[min-width:210px]; }
.invitation-action { @apply tw:[padding:.4rem_.5rem] tw:[min-height:36px] tw:[border:1px_solid_#d3dfca] tw:[border-radius:7px] tw:bg-white tw:[color:#35601f] tw:[font-size:.7rem] tw:font-semibold tw:cursor-pointer; }
.invitation-action:hover { @apply tw:[background:#f1f7ed]; }
.invitation-action-danger { @apply tw:[color:#b91c1c] tw:[border-color:#fecaca]; }
.invitation-no-actions { @apply tw:[color:#74836b] tw:[font-size:.72rem]; }
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
.invitation-recipient { @apply tw:grid tw:[gap:.25rem] tw:[padding:1rem] tw:[border-radius:10px] tw:[background:#f3f8ef] tw:[color:#345322] tw:[font-size:.85rem] tw:[overflow-wrap:anywhere]; }
.invitation-recipient span { @apply tw:[color:#617456] tw:[font-size:.8rem]; }
.invitation-dialog-actions { @apply tw:justify-end tw:[margin-top:1.5rem] tw:[padding-top:1rem] tw:[border-top:1px_solid_#e5ecdf]; }
@media (max-width: 600px) {
  .invitation-heading-actions { @apply tw:w-full; }
  .invitation-heading-actions .invitation-button { @apply tw:flex-1; }
  .invitation-dialog-content { @apply tw:[padding:1rem]; }
  .invitation-dialog-actions .invitation-button { @apply tw:flex-1; }
  .invitation-link-actions .invitation-button { @apply tw:w-full; }
}
</style>
