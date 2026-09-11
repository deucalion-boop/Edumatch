import { onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'

function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  return !configured ? '/api' : configured.endsWith('/api') ? configured : configured + '/api'
}
export function useUserNotifications(options = {}) {
  const authStore = useAuthStore()
  const notifications = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const notificationError = ref('')
  const showNotificationsPanel = ref(false)
  let pollTimer = null
  let version = 0
  let disposed = false
  let mutating = false
  const config = () => ({ headers: { Authorization: 'Bearer ' + authStore.token } })
  const fetchNotifications = async ({ silent = false } = {}) => {
    if (disposed || mutating || !authStore.token) return
    const requestVersion = ++version
    if (!silent) isLoading.value = true
    try {
      const response = await axios.get(resolveApiBaseUrl() + '/notifications', { ...config(), params: { limit: options.limit || 8 } })
      if (disposed || requestVersion !== version) return
      notifications.value = Array.isArray(response.data?.notifications) ? response.data.notifications : []
      unreadCount.value = Number(response.data?.unreadCount || 0)
      notificationError.value = ''
    } catch (error) {
      console.error('Failed to refresh notifications:', error)
      if (!disposed && requestVersion === version) notificationError.value = 'Unable to refresh notifications. Please try again.'
    } finally {
      if (!silent) isLoading.value = false
    }
  }
  const mutate = async (path, method = 'patch', onSuccess = () => {}) => {
    if (mutating || !authStore.token) return false
    mutating = true
    ++version
    try {
      if (method === 'delete') await axios.delete(resolveApiBaseUrl() + path, config())
      else await axios.patch(resolveApiBaseUrl() + path, {}, config())
      onSuccess()
      notificationError.value = ''
    } catch (error) {
      console.error('Failed to update notification:', error)
      notificationError.value = 'Unable to update notifications. Please try again.'
      return false
    } finally {
      mutating = false
    }
    await fetchNotifications({ silent: true })
    return true
  }
  const markNotificationViewed = (notification) => notification.isViewed ? Promise.resolve(true) : mutate('/notifications/' + encodeURIComponent(notification.id) + '/view', 'patch', () => {
    notifications.value = notifications.value.map(row => row.id === notification.id ? { ...row, isViewed: true } : row)
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  })
  const markAllViewed = () => mutate('/notifications/view-all', 'patch', () => {
    notifications.value = notifications.value.map(row => ({ ...row, isViewed: true }))
    unreadCount.value = 0
  })
  const closeNotificationsPanel = () => { showNotificationsPanel.value = false }
  const toggleNotificationsPanel = async () => {
    showNotificationsPanel.value = !showNotificationsPanel.value
    if (showNotificationsPanel.value) {
      await fetchNotifications()
      if (options.markViewedOnOpen !== false && unreadCount.value > 0) await markAllViewed()
    }
  }
  const clearAllNotifications = async () => {
    if (await mutate('/notifications', 'delete', () => { notifications.value = []; unreadCount.value = 0 })) closeNotificationsPanel()
  }
  const refreshVisible = () => { if (!document.hidden) fetchNotifications({ silent: true }) }
  onMounted(() => {
    fetchNotifications()
    pollTimer = window.setInterval(refreshVisible, Math.max(5000, Number(options.pollIntervalMs || 15000)))
    window.addEventListener('focus', refreshVisible)
    document.addEventListener('visibilitychange', refreshVisible)
  })
  onBeforeUnmount(() => {
    disposed = true
    ++version
    window.clearInterval(pollTimer)
    window.removeEventListener('focus', refreshVisible)
    document.removeEventListener('visibilitychange', refreshVisible)
  })
  return { notifications, unreadCount, isLoading, notificationError, showNotificationsPanel, fetchNotifications, markNotificationViewed, markAllViewed, clearAllNotifications, toggleNotificationsPanel, closeNotificationsPanel }
}
