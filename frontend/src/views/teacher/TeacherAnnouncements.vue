<template>
  <div class="teacher-dashboard">
    <TeacherSidebar v-model:is-open="isSidebarOpen" />
    <main class="teacher-main">
      <header class="top-header">
        <div class="header-content">
          <div class="header-left">
            <button type="button" class="mobile-menu-toggle" aria-label="Open sidebar" aria-controls="teacher-sidebar-drawer" :aria-expanded="isSidebarOpen" @click="isSidebarOpen = !isSidebarOpen"><i class="fas fa-bars" aria-hidden="true"></i></button>
            <div><h1>Announcements</h1><p class="header-subtitle">School-wide updates from EduMatch administrators.</p></div>
          </div>
          <div class="header-actions">
            <div class="header-right-controls">
              <div ref="notificationMenuRef" class="notification-menu">
                <button type="button" class="notification-bell" aria-label="Notifications" :aria-expanded="showNotificationsPanel" @click="toggleNotifications">
                  <i class="fas fa-bell" aria-hidden="true"></i>
                  <span v-if="unreadCount > 0" class="notification-count">{{ unreadCount }}</span>
                </button>
                <div v-if="showNotificationsPanel" class="notification-dropdown">
                  <div class="notification-dropdown-header">
                    <h3>Notifications</h3>
                    <div class="notification-dropdown-actions">
                      <button type="button" class="notification-dropdown-clear" :disabled="notifications.length === 0" @click="clearAllNotifications">Clear all</button>
                      <button type="button" class="notification-dropdown-close" aria-label="Close notifications" @click="closeNotificationsPanel"><i class="fas fa-times" aria-hidden="true"></i></button>
                    </div>
                  </div>
                  <UserNotificationList :notifications="notifications" :loading="isLoading" @select="closeNotificationsPanel" />
                </div>
              </div>
              <div ref="accountMenuRef" class="account-menu">
                <button type="button" class="header-tour-btn account-menu-trigger" aria-label="Account menu" title="Account" :aria-expanded="isAccountMenuOpen" @click="toggleAccountMenu"><i class="fas fa-cog" aria-hidden="true"></i></button>
                <div v-if="isAccountMenuOpen" class="account-menu-dropdown">
                  <button type="button" class="account-menu-item" @click="goToAccountPage('/teacher/profile')"><i class="fas fa-user" aria-hidden="true"></i><span>Profile</span></button>
                  <button type="button" class="account-menu-item" @click="goToAccountPage('/teacher/settings')"><i class="fas fa-cog" aria-hidden="true"></i><span>Settings</span></button>
                  <button type="button" class="account-menu-item danger" @click="handleLogout"><i class="fas fa-sign-out-alt" aria-hidden="true"></i><span>Logout</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    <StudentAnnouncements class="teacher-announcement-content" />
    <DashboardFooter />
  </main></div>
</template>
<script setup>
import DashboardFooter from '../../components/DashboardFooter.vue'
import TeacherSidebar from '../../components/TeacherSidebar.vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StudentAnnouncements from '../student/StudentAnnouncements.vue'
import UserNotificationList from '../../components/UserNotificationList.vue'
import { useUserNotifications } from '../../composables/useUserNotifications.js'
import { useAuthStore } from '../../stores/auth.js'
const router = useRouter()
const isSidebarOpen = ref(false)
const authStore = useAuthStore()
const notificationMenuRef = ref(null)
const accountMenuRef = ref(null)
const isAccountMenuOpen = ref(false)
const { notifications, unreadCount, isLoading, showNotificationsPanel, toggleNotificationsPanel, closeNotificationsPanel, clearAllNotifications } = useUserNotifications({ limit: 8, pollIntervalMs: 60000 })
const toggleNotifications = () => { isAccountMenuOpen.value = false; toggleNotificationsPanel() }
const toggleAccountMenu = () => { closeNotificationsPanel(); isAccountMenuOpen.value = !isAccountMenuOpen.value }
const goToAccountPage = path => { isAccountMenuOpen.value = false; router.push(path) }
const handleLogout = () => { isAccountMenuOpen.value = false; authStore.logout(); router.push('/auth/login') }
const closeHeaderMenus = event => {
  if (!notificationMenuRef.value?.contains(event.target)) closeNotificationsPanel()
  if (!accountMenuRef.value?.contains(event.target)) isAccountMenuOpen.value = false
}
const closeOnEscape = event => {
  if (event.key !== 'Escape') return
  closeNotificationsPanel()
  isAccountMenuOpen.value = false
  isSidebarOpen.value = false
}
onMounted(() => { document.addEventListener('click', closeHeaderMenus); document.addEventListener('keydown', closeOnEscape) })
onBeforeUnmount(() => { document.removeEventListener('click', closeHeaderMenus); document.removeEventListener('keydown', closeOnEscape) })
</script>
<style scoped>
.teacher-announcement-content { width: 100%; max-width: none; box-sizing: border-box; color: #1e4307; }
.teacher-announcement-content :deep(.page-header h1),
.teacher-announcement-content :deep(.empty-state h2),
.teacher-announcement-content :deep(.announcement-detail h2) { color: #1e4307; }
.teacher-announcement-content :deep(.eyebrow) { color: #4f8a35 !important; }
.teacher-announcement-content :deep(.announcement-subject),
.teacher-announcement-content :deep(.card-arrow) { color: #4f8a35; }
.teacher-announcement-content :deep(.announcement-icon) { color: #4f8a35; background: #e6f3df; }
.teacher-announcement-content :deep(.announcement-card),
.teacher-announcement-content :deep(.announcement-detail),
.teacher-announcement-content :deep(.state-card) { border-color: #b8d5a8; }
.teacher-announcement-content :deep(.announcement-card:hover) { border-color: #4f8a35; box-shadow: 0 10px 24px rgb(30 67 7 / 8%); }
.teacher-announcement-content :deep(.empty-state) { background: linear-gradient(135deg, #f4faef, #e8f4e1); color: #53664a; }
.teacher-announcement-content :deep(.empty-state > i) { color: #4f8a35; }
.teacher-announcement-content :deep(.back-button),
.teacher-announcement-content :deep(.state-card button) { color: #3e7028; border-color: #b8d5a8; }
.teacher-announcement-content :deep(.page-header p:not(.eyebrow)),
.teacher-announcement-content :deep(.announcement-preview),
.teacher-announcement-content :deep(.meta) { color: #53664a; }
</style>
