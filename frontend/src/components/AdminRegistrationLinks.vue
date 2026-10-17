<template>
  <section class="section-card registration-links-panel" aria-labelledby="staff-links-title">
    <div class="links-heading"><div><h3 id="staff-links-title">Staff registration links</h3><p>One link can register multiple accounts until it expires or you revoke it. Each Head Teacher department can be occupied only once.</p></div></div>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="loading">Loading registration links…</p>
    <p v-else-if="!links.length">No registration links generated yet.</p>
    <article v-for="link in links" :key="link.id" class="staff-link-card">
      <div><strong>{{ link.role === 'headteacher' ? 'Head Teacher' : 'Teacher' }}</strong><span class="link-status">{{ link.revokedAt ? 'Revoked' : Date.parse(link.expiresAt) <= now ? 'Expired' : 'Active' }}</span></div>
      <p>{{ link.registrationCount }} registered · Expires {{ new Date(link.expiresAt).toLocaleString() }}</p>
      <input :value="link.inviteLink" readonly aria-label="Staff registration link" @focus="$event.target.select()">
      <div class="link-actions">
        <button type="button" class="btn btn-outline" :disabled="busy || Boolean(link.revokedAt) || Date.parse(link.expiresAt) <= now" @click="copy(link)">Copy link</button>
        <button type="button" class="btn btn-outline" :disabled="busy || Boolean(link.revokedAt)" @click="change(link, false)">Revoke</button>
        <button type="button" class="btn btn-outline" :disabled="busy" @click="change(link, true)">Remove</button>
      </div>
    </article>
  </section>
</template>
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import axios from 'axios'
import { resolveApiBaseUrl, useAuthStore } from '../stores/auth.js'
const auth = useAuthStore()
const props = defineProps({ managementRole: { type: String, default: 'admin', validator: value => ['admin','secretary'].includes(value) } })
const links = ref([]), busy = ref(false), loading = ref(false), message = ref(''), now = ref(Date.now())
const base = () => `${resolveApiBaseUrl()}/${props.managementRole}/registration-links`
const config = () => ({ headers: { Authorization: `Bearer ${auth.token}` } })
async function refresh() {
  loading.value = true
  try { links.value = (await axios.get(base(), config())).data.links || [] }
  catch (error) { message.value = error.response?.data?.message || 'Unable to load registration links. Apply migration 025 and retry.' }
  finally { loading.value = false }
}
async function change(link, remove) {
  if (!window.confirm(`${remove ? 'Remove and invalidate' : 'Revoke'} this link? Existing accounts will not be deleted.`)) return
  busy.value = true; message.value = ''
  try {
    if (remove) await axios.delete(`${base()}/${link.id}`, config())
    else await axios.post(`${base()}/${link.id}/revoke`, {}, config())
    await refresh()
  } catch (error) { message.value = error.response?.data?.message || 'Unable to update link.' }
  finally { busy.value = false }
}
async function copy(link) {
  try { await navigator.clipboard.writeText(link.inviteLink); message.value = 'Link copied.' }
  catch { message.value = 'Select the link and copy it manually.' }
}
let timer
onMounted(() => { refresh(); timer = window.setInterval(() => { now.value = Date.now() }, 30000) })
onBeforeUnmount(() => window.clearInterval(timer))
defineExpose({ refresh })
</script>
<style scoped>
.registration-links-panel { margin-bottom: 1.5rem; padding: 1.25rem; border: 1px solid #9abd85; border-radius: 16px; background: #fff; color: #25431b; }
.registration-links-panel h3 { margin: 0 0 .5rem; }
.registration-links-panel p { font-size: .85rem; line-height: 1.6; overflow-wrap: anywhere; }
.link-actions { display: flex; flex-wrap: wrap; gap: .75rem; align-items: end; margin: 1rem 0; }
.registration-links-panel input,.registration-links-panel select { padding: .7rem; border: 1px solid #c5dab8; border-radius: 8px; background: #fff; color: #25431b; max-width: 100%; }
.registration-links-panel input { width: 100%; box-sizing: border-box; min-width: 0; }
.staff-link-card { padding: 1rem; margin-top: 1rem; border: 1px solid #c5dab8; border-radius: 10px; }
.link-status { margin-left: .75rem; font-size: .8rem; }
.registration-links-panel button:disabled { opacity: .55; cursor: not-allowed; }
</style>
