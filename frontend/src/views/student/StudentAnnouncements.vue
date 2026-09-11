<template>
  <section class="announcement-page">
    <router-link to="/student/dashboard">Back to Dashboard</router-link>
    <p v-if="loading" role="status">Loading announcement...</p>
    <p v-else-if="error" role="alert">{{ error }} <button @click="load">Retry</button></p>
    <article v-else-if="announcement">
      <p class="eyebrow">Announcement &middot; {{ announcement.subject }}</p>
      <h1>{{ announcement.title }}</h1>
      <p class="meta">{{ announcement.teacher }} &middot; {{ new Date(announcement.createdAt).toLocaleString() }}</p>
      <p class="content">{{ announcement.content }}</p>
    </article>
  </section>
</template>
<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'
const route = useRoute()
const auth = useAuthStore()
const announcement = ref(null)
const loading = ref(false)
const error = ref('')
let version = 0
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  let base = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
  if (!base.endsWith('/api')) base += '/api'
  try {
    const response = await axios.get(base + '/notifications/announcement', { params: { event: route.query.event }, headers: { Authorization: 'Bearer ' + auth.token } })
    if (current === version) announcement.value = response.data.announcement
  } catch (failure) {
    if (current === version) error.value = failure.response?.data?.message || 'Unable to load this announcement.'
  } finally { if (current === version) loading.value = false }
}
watch(() => route.query.event, load, { immediate: true })
</script>
<style scoped>
.announcement-page { max-width: 900px; margin: 0 auto; padding: 1.5rem; color: #0f172a; }
article { margin-top: 1rem; background: white; border: 1px solid #d8e1ef; border-radius: 18px; padding: 1.5rem; overflow-wrap: anywhere; }
.eyebrow { color: #2563eb; font-weight: 600; }
.meta { color: #64748b; }
.content { white-space: pre-wrap; line-height: 1.7; }
</style>
