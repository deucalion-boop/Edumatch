<template>
  <section class="announcement-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Class updates</p>
        <h1>Announcements</h1>
        <p>Important messages posted by your teachers appear here.</p>
      </div>
      <button v-if="selectedAnnouncement" type="button" class="back-button" aria-label="Back to announcements" @click="showAll">
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
        Back
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
@reference "../../styles/tailwind.css";
.announcement-page { @apply tw:[max-width:980px]; @apply tw:[margin:0_auto]; @apply tw:[padding:2rem]; @apply tw:[color:#0f172a]; }
.announcement-page .page-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1.5rem];
  @apply tw:[padding:0];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:inherit];
  @apply tw:text-left;
  @apply tw:overflow-visible;
}
.announcement-page .page-header::before,
.announcement-page .page-header::after { @apply tw:hidden; @apply tw:[content:none]; }
.page-header h1 { @apply tw:[margin:.15rem_0_.35rem]; @apply tw:[font-size:clamp(1.8rem,_3vw,_2.4rem)]; }
.page-header p { @apply tw:[margin:0]; @apply tw:[color:#64748b]; }
.eyebrow { @apply tw:[margin:0]; @apply tw:[color:#2563eb]!; @apply tw:[font-size:.8rem]; @apply tw:[font-weight:700]; @apply tw:[letter-spacing:.08em]; @apply tw:uppercase; }
.back-button, .state-card button { @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:10px]; @apply tw:[background:#fff]; @apply tw:[color:#1e40af]; @apply tw:[padding:.7rem_1rem]; @apply tw:[font-weight:600]; @apply tw:cursor-pointer; }
.announcement-list { @apply tw:grid; @apply tw:[gap:.85rem]; }
.announcement-card { @apply tw:w-full; @apply tw:grid; @apply tw:[grid-template-columns:46px_minmax(0,_1fr)_auto]; @apply tw:items-center; @apply tw:[gap:1rem]; @apply tw:[padding:1.1rem]; @apply tw:[border:1px_solid_#d8e1ef]; @apply tw:[border-radius:16px]; @apply tw:[background:#fff]; @apply tw:[color:inherit]; @apply tw:text-left; @apply tw:cursor-pointer; @apply tw:[transition:transform_.18s_ease,_border-color_.18s_ease,_box-shadow_.18s_ease]; }
.announcement-card:hover { @apply tw:[transform:translateY(-2px)]; @apply tw:[border-color:#93c5fd]; @apply tw:[box-shadow:0_10px_24px_rgba(15,_23,_42,_.08)]; }
.announcement-icon { @apply tw:[width:46px]; @apply tw:[height:46px]; @apply tw:grid; @apply tw:place-items-center; @apply tw:[border-radius:13px]; @apply tw:[background:#dbeafe]; @apply tw:[color:#2563eb]; }
.announcement-summary { @apply tw:[min-width:0]; @apply tw:grid; @apply tw:[gap:.25rem]; }
.announcement-summary strong { @apply tw:[font-size:1.05rem]; }
.announcement-subject { @apply tw:[color:#2563eb]; @apply tw:[font-size:.78rem]; @apply tw:[font-weight:700]; @apply tw:uppercase; }
.announcement-preview { @apply tw:overflow-hidden; @apply tw:[color:#475569]; @apply tw:text-ellipsis; @apply tw:whitespace-nowrap; }
.card-arrow { @apply tw:[color:#94a3b8]; }
.announcement-detail, .state-card { @apply tw:[background:#fff]; @apply tw:[border:1px_solid_#d8e1ef]; @apply tw:[border-radius:18px]; @apply tw:[padding:1.5rem]; @apply tw:[overflow-wrap:anywhere]; }
.announcement-detail h2 { @apply tw:[margin:.5rem_0]; @apply tw:[font-size:1.7rem]; }
.meta { @apply tw:[color:#64748b]; @apply tw:[font-size:.88rem]; }
.content { @apply tw:whitespace-pre-wrap; @apply tw:[line-height:1.7]; }
.state-card { @apply tw:text-center; @apply tw:[color:#64748b]; }
.state-card p { @apply tw:[margin:.35rem_0_1rem]; }
.state-card-error { @apply tw:[color:#b91c1c]; }
.empty-state { @apply tw:[padding:3rem_1.5rem]; }
.empty-state > i { @apply tw:[color:#93c5fd]; @apply tw:[font-size:2rem]; }
.empty-state h2 { @apply tw:[margin:.8rem_0_.25rem]; @apply tw:[color:#0f172a]; }

:global(.student-dashboard.student-theme-dark .announcement-page :is(
  .announcement-card,
  .announcement-detail,
  .state-card
)) {
  @apply tw:[background:#101913]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:none]!;
}

:global(.student-dashboard.student-theme-dark .announcement-page .announcement-card:hover) {
  @apply tw:[background:#18251d]!;
  @apply tw:[border-color:#6b8974]!;
  @apply tw:[box-shadow:0_12px_28px_rgba(0,_0,_0,_0.24)]!;
}

:global(.student-dashboard.student-theme-dark .announcement-page :is(
  .announcement-summary strong,
  .announcement-detail h2,
  .empty-state h2
)) {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

:global(.student-dashboard.student-theme-dark .announcement-page :is(
  .announcement-preview,
  .meta,
  .content,
  .state-card p
)) {
  @apply tw:[color:#aebdb2]!;
  @apply tw:[-webkit-text-fill-color:#aebdb2]!;
}

:global(.student-dashboard.student-theme-dark .announcement-page :is(
  .eyebrow,
  .announcement-subject
)) {
  @apply tw:[color:#b9dfa5]!;
  @apply tw:[-webkit-text-fill-color:#b9dfa5]!;
}

:global(.student-dashboard.student-theme-dark .announcement-page .announcement-icon) {
  @apply tw:[background:#203127]!;
  @apply tw:[color:#b9dfa5]!;
}

:global(.student-dashboard.student-theme-dark .announcement-page .announcement-icon i),
:global(.student-dashboard.student-theme-dark .announcement-page .announcement-icon i::before),
:global(.student-dashboard.student-theme-dark .announcement-page .card-arrow) {
  @apply tw:[color:#b9dfa5]!;
  @apply tw:[-webkit-text-fill-color:#b9dfa5]!;
}

:global(.student-dashboard.student-theme-dark .announcement-page :is(
  .back-button,
  .state-card button
)) {
  @apply tw:[background:#203127]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#e7efe9]!;
}

:global(.student-dashboard.student-theme-dark .announcement-page :is(
  .back-button,
  .state-card button
):hover) {
  @apply tw:[background:#293d30]!;
  @apply tw:[border-color:#6b8974]!;
}

@media (max-width: 640px) {
  .announcement-page { @apply tw:[padding:1.25rem]; }
  .page-header { @apply tw:flex-col; }
  .announcement-card { @apply tw:[grid-template-columns:40px_minmax(0,_1fr)]; }
  .announcement-icon { @apply tw:[width:40px]; @apply tw:[height:40px]; }
  .card-arrow { @apply tw:hidden; }
}

</style>
