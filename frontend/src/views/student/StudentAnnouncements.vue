<template>
  <section class="announcement-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Class updates</p>
        <h1>Announcements</h1>
        <p>Important messages posted by your teachers appear here.</p>
      </div>
      <button v-if="selectedAnnouncement" type="button" class="back-button" @click="showAll">
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
        All announcements
      </button>
    </header>

    <p v-if="loading" class="state-card" role="status">Loading announcements...</p>
    <div v-else-if="error" class="state-card state-card-error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="load">Try again</button>
    </div>

    <article v-else-if="selectedAnnouncement" class="announcement-detail">
      <p class="eyebrow">Announcement &middot; {{ selectedAnnouncement.subject }}</p>
      <h2>{{ selectedAnnouncement.title }}</h2>
      <p class="meta">{{ selectedAnnouncement.teacher }} &middot; {{ formatDate(selectedAnnouncement.createdAt) }}</p>
      <p class="content">{{ selectedAnnouncement.content }}</p>
    </article>

    <div v-else-if="announcements.length" class="announcement-list">
      <button
        v-for="item in announcements"
        :key="item.id"
        type="button"
        class="announcement-card"
        @click="openAnnouncement(item)"
      >
        <span class="announcement-icon"><i class="fas fa-bullhorn" aria-hidden="true"></i></span>
        <span class="announcement-summary">
          <span class="announcement-subject">{{ item.subject }}</span>
          <strong>{{ item.title }}</strong>
          <span class="announcement-preview">{{ item.content }}</span>
          <span class="meta">{{ item.teacher }} &middot; {{ formatDate(item.createdAt) }}</span>
        </span>
        <i class="fas fa-chevron-right card-arrow" aria-hidden="true"></i>
      </button>
    </div>

    <div v-else class="state-card empty-state">
      <i class="fas fa-bullhorn" aria-hidden="true"></i>
      <h2>No announcements yet</h2>
      <p>Announcements from your teachers will appear here.</p>
    </div>
  </section>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const announcements = ref([])
const fallbackAnnouncement = ref(null)
const loading = ref(false)
const error = ref('')
let version = 0
const selectedAnnouncement = computed(() => {
  const eventKey = String(route.query.event || '')
  return announcements.value.find(item => item.eventKey === eventKey)
    || (fallbackAnnouncement.value?.eventKey === eventKey ? fallbackAnnouncement.value : null)
})
function apiBaseUrl() {
  let base = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
  if (!base.endsWith('/api')) base += '/api'
  return base
}
const config = () => ({ headers: { Authorization: 'Bearer ' + auth.token } })
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get(apiBaseUrl() + '/notifications/announcements', config())
    if (current !== version) return
    announcements.value = Array.isArray(response.data?.announcements) ? response.data.announcements : []
    fallbackAnnouncement.value = null
    const eventKey = String(route.query.event || '')
    if (eventKey && !announcements.value.some(item => item.eventKey === eventKey)) {
      const detail = await axios.get(apiBaseUrl() + '/notifications/announcement', {
        ...config(),
        params: { event: eventKey },
      })
      if (current === version) fallbackAnnouncement.value = detail.data?.announcement || null
    }
  } catch (failure) {
    if (current === version) error.value = failure.response?.data?.message || 'Unable to load announcements.'
  } finally { if (current === version) loading.value = false }
}
function openAnnouncement(item) {
  router.push({ path: '/student/announcements', query: { event: item.eventKey } })
}
function showAll() {
  router.push('/student/announcements')
}
function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString()
}
watch(() => route.query.event, (eventKey, previousEventKey) => {
  if (!announcements.value.length || (eventKey && eventKey !== previousEventKey && !selectedAnnouncement.value)) load()
}, { immediate: true })
</script>
<style scoped>
.announcement-page { max-width: 980px; margin: 0 auto; padding: 2rem; color: #0f172a; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.page-header h1 { margin: .15rem 0 .35rem; font-size: clamp(1.8rem, 3vw, 2.4rem); }
.page-header p { margin: 0; color: #64748b; }
.eyebrow { margin: 0; color: #2563eb !important; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.back-button, .state-card button { border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; color: #1e40af; padding: .7rem 1rem; font-weight: 600; cursor: pointer; }
.announcement-list { display: grid; gap: .85rem; }
.announcement-card { width: 100%; display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; align-items: center; gap: 1rem; padding: 1.1rem; border: 1px solid #d8e1ef; border-radius: 16px; background: #fff; color: inherit; text-align: left; cursor: pointer; transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
.announcement-card:hover { transform: translateY(-2px); border-color: #93c5fd; box-shadow: 0 10px 24px rgba(15, 23, 42, .08); }
.announcement-icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 13px; background: #dbeafe; color: #2563eb; }
.announcement-summary { min-width: 0; display: grid; gap: .25rem; }
.announcement-summary strong { font-size: 1.05rem; }
.announcement-subject { color: #2563eb; font-size: .78rem; font-weight: 700; text-transform: uppercase; }
.announcement-preview { overflow: hidden; color: #475569; text-overflow: ellipsis; white-space: nowrap; }
.card-arrow { color: #94a3b8; }
.announcement-detail, .state-card { background: #fff; border: 1px solid #d8e1ef; border-radius: 18px; padding: 1.5rem; overflow-wrap: anywhere; }
.announcement-detail h2 { margin: .5rem 0; font-size: 1.7rem; }
.meta { color: #64748b; font-size: .88rem; }
.content { white-space: pre-wrap; line-height: 1.7; }
.state-card { text-align: center; color: #64748b; }
.state-card p { margin: .35rem 0 1rem; }
.state-card-error { color: #b91c1c; }
.empty-state { padding: 3rem 1.5rem; }
.empty-state > i { color: #93c5fd; font-size: 2rem; }
.empty-state h2 { margin: .8rem 0 .25rem; color: #0f172a; }
@media (max-width: 640px) {
  .announcement-page { padding: 1.25rem; }
  .page-header { flex-direction: column; }
  .announcement-card { grid-template-columns: 40px minmax(0, 1fr); }
  .announcement-icon { width: 40px; height: 40px; }
  .card-arrow { display: none; }
}
</style>
