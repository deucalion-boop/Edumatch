import { onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'

const DEFAULT_POLL_INTERVAL_MS = 15000

function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}

export function useUserNotifications(options = {}) {
  const authStore = useAuthStore()
  const pollIntervalMs = Number(options.pollIntervalMs || DEFAULT_POLL_INTERVAL_MS)
  const limit = Number(options.limit || 8)
  const notifications = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const showNotificationsPanel = ref(false)
  let pollTimer = null

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
  })

  const fetchNotifications = async ({ silent = false } = {}) => {
    if (!authStore.token) {
      notifications.value = []
      unreadCount.value = 0
      return
    }

    if (!silent) {
      isLoading.value = true
    }

    try {
      const response = await axios.get(`${resolveApiBaseUrl()}/notifications`, {
        ...getAuthConfig(),
        params: { limit },
      })

      notifications.value = Array.isArray(response.data?.notifications) ? response.data.notifications : []
      unreadCount.value = Number(response.data?.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      if (!silent) {
        notifications.value = []
        unreadCount.value = 0
      }
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  const markAllViewed = async () => {
    if (!authStore.token || unreadCount.value <= 0) return

    try {
      await axios.patch(`${resolveApiBaseUrl()}/notifications/view-all`, {}, getAuthConfig())
      unreadCount.value = 0
      notifications.value = notifications.value.map((notification) => ({
        ...notification,
        isViewed: true,
      }))
    } catch (error) {
      console.error('Failed to mark notifications as viewed:', error)
    }
  }

  const toggleNotificationsPanel = async () => {
    showNotificationsPanel.value = !showNotificationsPanel.value
    if (showNotificationsPanel.value) {
      await fetchNotifications()
      await markAllViewed()
    }
  }

  const closeNotificationsPanel = () => {
    showNotificationsPanel.value = false
  }

  const clearAllNotifications = async () => {
    if (!authStore.token || notifications.value.length === 0) return

    try {
      await axios.delete(`${resolveApiBaseUrl()}/notifications`, getAuthConfig())
      notifications.value = []
      unreadCount.value = 0
      showNotificationsPanel.value = false
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  const startPolling = () => {
    if (pollTimer || !authStore.token) return
    pollTimer = window.setInterval(() => {
      fetchNotifications({ silent: true })
    }, Math.max(5000, pollIntervalMs))
  }

  const stopPolling = () => {
    if (!pollTimer) return
    window.clearInterval(pollTimer)
    pollTimer = null
  }

  onMounted(() => {
    fetchNotifications()
    startPolling()
  })

  onBeforeUnmount(() => {
    stopPolling()
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    showNotificationsPanel,
    fetchNotifications,
    markAllViewed,
    clearAllNotifications,
    toggleNotificationsPanel,
    closeNotificationsPanel,
  }
}
