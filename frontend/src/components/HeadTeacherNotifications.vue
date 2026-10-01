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
@reference "../styles/tailwind.css";
.headteacher-notifications { @apply tw:relative; @apply tw:shrink-0; @apply tw:pointer-events-auto; }
.notification-trigger { @apply tw:relative; }
.notification-count { @apply tw:absolute; @apply tw:[top:-4px]; @apply tw:[right:-4px]; @apply tw:[min-width:18px]; @apply tw:[padding:2px_4px]; @apply tw:[border-radius:12px]; @apply tw:[background:#b91c1c]; @apply tw:[color:white]; @apply tw:[font-size:10px]; @apply tw:[line-height:1.2]; }
.notification-panel { @apply tw:absolute; @apply tw:[top:calc(100%_+_10px)]; @apply tw:[right:0]; @apply tw:[width:min(360px,_calc(100vw_-_32px))]; @apply tw:[max-height:min(480px,_70vh)]; @apply tw:overflow-y-auto; @apply tw:[background:white]; @apply tw:[border:1px_solid_#dce5d7]; @apply tw:[border-radius:14px]; @apply tw:[box-shadow:0_12px_36px_#17201424]; @apply tw:[z-index:100]; }
.notification-panel-header { @apply tw:flex; @apply tw:items-center; @apply tw:[gap:12px]; @apply tw:[padding:14px]; @apply tw:[border-bottom:1px_solid_#edf2ea]; @apply tw:[color:#1e4307]; }
.notification-panel-header strong { @apply tw:[flex:1]; }
.notification-panel-header button { @apply tw:[background:transparent]; @apply tw:[border:0]; @apply tw:[color:inherit]; @apply tw:cursor-pointer; }
.notification-panel-header button:disabled { @apply tw:[opacity:0.5]; @apply tw:cursor-default; }
@media (max-width: 600px) { .notification-panel { @apply tw:fixed; @apply tw:[top:80px]; @apply tw:[right:16px]; } }

</style>
