<template>
  <div ref="root" class="headteacher-notifications" @keydown.esc="closeNotificationsPanel">
    <button type="button" class="headteacher-header-settings-button notification-trigger" aria-label="Notifications" :aria-expanded="showNotificationsPanel" @click="toggleNotificationsPanel">
      <i class="fas fa-bell" aria-hidden="true"></i>
      <span v-if="unreadCount" class="notification-count">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>
    <section v-if="showNotificationsPanel" class="notification-panel" aria-label="Notifications">
      <div class="notification-panel-header">
        <strong>Notifications</strong>
        <button type="button" :disabled="!notifications.length" @click="clearAllNotifications">Clear all</button>
        <button type="button" aria-label="Close notifications" @click="closeNotificationsPanel"><i class="fas fa-times" aria-hidden="true"></i></button>
      </div>
      <UserNotificationList :notifications="notifications" :loading="isLoading" @select="closeNotificationsPanel" />
    </section>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import UserNotificationList from './UserNotificationList.vue'
import { useUserNotifications } from '../composables/useUserNotifications.js'
const root = ref(null)
const { notifications, unreadCount, isLoading, showNotificationsPanel, toggleNotificationsPanel, closeNotificationsPanel, clearAllNotifications } = useUserNotifications()
const closeOutside = (event) => { if (!root.value?.contains(event.target)) closeNotificationsPanel() }
onMounted(() => document.addEventListener('click', closeOutside))
onBeforeUnmount(() => document.removeEventListener('click', closeOutside))
</script>
<style scoped>
.headteacher-notifications { position: relative; flex-shrink: 0; pointer-events: auto; }
.notification-trigger { position: relative; }
.notification-count { position: absolute; top: -4px; right: -4px; min-width: 18px; padding: 2px 4px; border-radius: 12px; background: #b91c1c; color: white; font-size: 10px; line-height: 1.2; }
.notification-panel { position: absolute; top: calc(100% + 10px); right: 0; width: min(360px, calc(100vw - 32px)); max-height: min(480px, 70vh); overflow-y: auto; background: white; border: 1px solid #dce5d7; border-radius: 14px; box-shadow: 0 12px 36px #17201424; z-index: 100; }
.notification-panel-header { display: flex; align-items: center; gap: 12px; padding: 14px; border-bottom: 1px solid #edf2ea; color: #1e4307; }
.notification-panel-header strong { flex: 1; }
.notification-panel-header button { background: transparent; border: 0; color: inherit; cursor: pointer; }
.notification-panel-header button:disabled { opacity: 0.5; cursor: default; }
@media (max-width: 600px) { .notification-panel { position: fixed; top: 80px; right: 16px; } }
</style>
