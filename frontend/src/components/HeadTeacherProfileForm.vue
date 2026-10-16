<template>
  <article class="headteacher-section-card headteacher-panel profile-settings">
    <h2 class="headteacher-section-title">Profile</h2>
    <p class="headteacher-section-subtitle">Manage your personal information. Your role and department are assigned by an administrator.</p>
    <p v-if="message" :class="{ error: failed }" role="status">{{ message }}</p>
    <form class="headteacher-form" @submit.prevent="save">
      <div class="photo-row">
        <img v-if="preview || auth.user?.profileImage" :src="preview || auth.user.profileImage" alt="Your profile photo" class="profile-photo">
        <span v-else class="profile-photo placeholder"><i class="fas fa-user" aria-hidden="true"></i></span>
        <label class="headteacher-form-group"><span>Profile photo</span><input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" :disabled="busy" @change="selectPhoto"><small>JPG, PNG or WebP, up to 5 MB.</small></label>
      </div>
      <div class="headteacher-form-grid">
        <label class="headteacher-form-group"><span>First Name</span><input v-model.trim="form.firstName" required maxlength="50" autocomplete="given-name" :disabled="busy"></label>
        <label class="headteacher-form-group"><span>Last Name</span><input v-model.trim="form.lastName" required maxlength="50" autocomplete="family-name" :disabled="busy"></label>
        <label class="headteacher-form-group"><span>Username</span><input v-model.trim="form.username" required minlength="3" maxlength="30" pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}" autocomplete="username" :disabled="busy"></label>
        <label class="headteacher-form-group"><span>Email Address</span><input :value="auth.user?.email" type="email" readonly><small>Contact an administrator to request a verified email change.</small></label>
        <label class="headteacher-form-group"><span>Department</span><input :value="auth.user?.department || 'Not assigned'" readonly></label>
        <label class="headteacher-form-group"><span>Role</span><input value="Head Teacher" readonly></label>
      </div>
      <div class="headteacher-modal-actions">
        <button type="button" class="headteacher-button headteacher-button-outline" :disabled="busy" @click="reset">Reset</button>
        <button type="submit" class="headteacher-button headteacher-button-primary" :disabled="busy || loading">{{ busy ? 'Saving…' : 'Save Profile' }}</button>
      </div>
    </form>
  </article>
</template>
<script setup>
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'
const auth = useAuthStore()
const form = reactive({ firstName: '', lastName: '', username: '' })
const busy = ref(false), loading = ref(true), message = ref(''), failed = ref(false)
const preview = ref(''), fileInput = ref(null)
let photo = null
function clearPhoto() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = ''; photo = null
  if (fileInput.value) fileInput.value.value = ''
}
function reset() {
  const parts = String(auth.user?.name || '').trim().split(/\s+/)
  form.firstName = parts.shift() || ''; form.lastName = parts.join(' ')
  form.username = auth.user?.username || ''
  clearPhoto(); message.value = ''
}
function selectPhoto(event) {
  const file = event.target.files?.[0]
  clearPhoto()
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    failed.value = true; message.value = 'Choose a JPG, PNG or WebP image no larger than 5 MB.'; return
  }
  photo = file; preview.value = URL.createObjectURL(file); message.value = ''
}
async function save() {
  if (busy.value || loading.value) return
  busy.value = true; message.value = ''; failed.value = false
  try {
    let base = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
    if (!base.endsWith('/api')) base += '/api'
    const body = new FormData()
    body.append('name', `${form.firstName} ${form.lastName}`.trim())
    body.append('username', form.username)
    if (photo) body.append('profileImage', photo)
    const { data } = await axios.put(`${base}/headteacher/profile`, body, { headers: { Authorization: `Bearer ${auth.token}` } })
    auth.setUser({ ...data.user, displayName: data.user.name }); reset()
    message.value = 'Profile saved successfully.'
  } catch (error) { failed.value = true; message.value = error.response?.data?.message || 'Unable to save profile. Please try again.' }
  finally { busy.value = false }
}
onMounted(async () => {
  reset()
  try { await auth.refreshProfile(); reset() }
  catch { failed.value = true; message.value = 'Unable to load your profile. Reload this page before saving.'; return }
  loading.value = false
})
onBeforeUnmount(clearPhoto)
</script>
<style scoped>
.profile-settings { padding: 1.5rem; margin-bottom: 1.5rem; color: #1e4307; border: 1px solid #c5dab8; border-radius: 20px; background: #fff; }
.profile-settings form { margin-top: 1.25rem; }
.photo-row { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.profile-photo { width: 88px; height: 88px; object-fit: cover; border-radius: 50%; border: 3px solid #d9ebcd; }
.placeholder { display: grid; place-items: center; background: #edf6e7; color: #4c8333; font-size: 2rem; }
.profile-settings input[readonly] { background: #f2f7ee; color: #53664a; }
.profile-settings input:focus { outline: 2px solid #72a852; outline-offset: 2px; }
.profile-settings small { color: #53664a; }
.profile-settings .headteacher-button-primary { color: #fff; background: #3e7c2b; }
.profile-settings .error { color: #b91c1c; }
.profile-settings button:disabled { opacity: .6; cursor: not-allowed; }
</style>
