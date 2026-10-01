<template>
  <section class="announcement-page mx-auto max-w-[980px] p-8 text-slate-900 max-sm:p-5">
    <header class="mb-6 flex items-start justify-between gap-4 max-sm:flex-col">
      <div>
        <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-blue-600! student-dark:text-[#b9dfa5]!">Class updates</p>
        <h1 class="my-[0.15rem] mb-[0.35rem] [font-size:clamp(1.8rem,3vw,2.4rem)]">Announcements</h1>
        <p class="m-0 text-slate-500">Important messages posted by your teachers appear here.</p>
      </div>
      <button
        v-if="selectedAnnouncement"
        type="button"
        class="cursor-pointer rounded-[10px] border border-slate-300 bg-white px-4 py-[0.7rem] font-semibold text-blue-800 student-dark:border-[#526b59]! student-dark:bg-[#203127]! student-dark:text-[#e7efe9]! student-dark:hover:border-[#6b8974]! student-dark:hover:bg-[#293d30]!"
        aria-label="Back to announcements"
        @click="showAll"
      >
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
        Back
      </button>
    </header>

    <p
      v-if="loading"
      class="[overflow-wrap:anywhere] rounded-[18px] border border-[#d8e1ef] bg-white p-6 text-center text-slate-500 student-dark:border-[#405348]! student-dark:bg-[#101913]! student-dark:text-[#f1f5f2]! student-dark:shadow-none!"
      role="status"
    >Loading announcements...</p>
    <div
      v-else-if="error"
      class="[overflow-wrap:anywhere] rounded-[18px] border border-[#d8e1ef] bg-white p-6 text-center text-red-700 student-dark:border-[#405348]! student-dark:bg-[#101913]! student-dark:text-[#f1f5f2]! student-dark:shadow-none!"
      role="alert"
    >
      <p class="mt-[0.35rem] mb-4 student-dark:text-[#aebdb2]!">{{ error }}</p>
      <button
        type="button"
        class="cursor-pointer rounded-[10px] border border-slate-300 bg-white px-4 py-[0.7rem] font-semibold text-blue-800 student-dark:border-[#526b59]! student-dark:bg-[#203127]! student-dark:text-[#e7efe9]! student-dark:hover:border-[#6b8974]! student-dark:hover:bg-[#293d30]!"
        @click="load"
      >Try again</button>
    </div>

    <article
      v-else-if="selectedAnnouncement"
      class="[overflow-wrap:anywhere] rounded-[18px] border border-[#d8e1ef] bg-white p-6 student-dark:border-[#405348]! student-dark:bg-[#101913]! student-dark:text-[#f1f5f2]! student-dark:shadow-none!"
    >
      <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-blue-600! student-dark:text-[#b9dfa5]!">Announcement &middot; {{ selectedAnnouncement.subject }}</p>
      <h2 class="my-2 text-[1.7rem] student-dark:text-slate-50!">{{ selectedAnnouncement.title }}</h2>
      <p class="text-[0.88rem] text-slate-500 student-dark:text-[#aebdb2]!">{{ selectedAnnouncement.teacher }} &middot; {{ formatDate(selectedAnnouncement.createdAt) }}</p>
      <p class="whitespace-pre-wrap leading-[1.7] student-dark:text-[#aebdb2]!">{{ selectedAnnouncement.content }}</p>
    </article>

    <div v-else-if="announcements.length" class="grid gap-[0.85rem]">
      <button
        v-for="item in announcements"
        :key="item.id"
        type="button"
        class="grid w-full cursor-pointer grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-[#d8e1ef] bg-white p-[1.1rem] text-left text-inherit transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] max-sm:grid-cols-[40px_minmax(0,1fr)] student-dark:border-[#405348]! student-dark:bg-[#101913]! student-dark:text-[#f1f5f2]! student-dark:shadow-none! student-dark:hover:border-[#6b8974]! student-dark:hover:bg-[#18251d]! student-dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.24)]!"
        @click="openAnnouncement(item)"
      >
        <span class="grid size-[46px] place-items-center rounded-[13px] bg-blue-100 text-blue-600 max-sm:size-10 student-dark:bg-[#203127]! student-dark:text-[#b9dfa5]!"><i class="fas fa-bullhorn student-dark:text-[#b9dfa5]!" aria-hidden="true"></i></span>
        <span class="grid min-w-0 gap-1">
          <span class="text-[0.78rem] font-bold uppercase text-blue-600 student-dark:text-[#b9dfa5]!">{{ item.subject }}</span>
          <strong class="text-[1.05rem] student-dark:text-slate-50!">{{ item.title }}</strong>
          <span class="overflow-hidden text-ellipsis whitespace-nowrap text-slate-600 student-dark:text-[#aebdb2]!">{{ item.content }}</span>
          <span class="text-[0.88rem] text-slate-500 student-dark:text-[#aebdb2]!">{{ item.teacher }} &middot; {{ formatDate(item.createdAt) }}</span>
        </span>
        <i class="fas fa-chevron-right text-slate-400 max-sm:hidden student-dark:text-[#b9dfa5]!" aria-hidden="true"></i>
      </button>
    </div>

    <div
      v-else
      class="[overflow-wrap:anywhere] rounded-[18px] border border-[#d8e1ef] bg-white px-6 py-12 text-center text-slate-500 student-dark:border-[#405348]! student-dark:bg-[#101913]! student-dark:text-[#f1f5f2]! student-dark:shadow-none!"
    >
      <i class="fas fa-bullhorn text-2xl text-blue-300 student-dark:text-[#b9dfa5]!" aria-hidden="true"></i>
      <h2 class="mt-3 mb-1 text-slate-900 student-dark:text-slate-50!">No announcements yet</h2>
      <p class="mt-[0.35rem] mb-4 student-dark:text-[#aebdb2]!">Announcements from your teachers will appear here.</p>
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
