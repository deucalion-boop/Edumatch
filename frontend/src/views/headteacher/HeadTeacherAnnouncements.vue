<template>
  <div class="headteacher-workspace headteacher-dashboard-page headteacher-content-page headteacher-announcements-page">
    <HeadTeacherSidebar v-model:is-open="isSidebarOpen" :display-name="displayName" />
    <main class="headteacher-main headteacher-page-container">
      <header class="headteacher-top-header headteacher-matched-page-header">
        <div class="headteacher-header-content">
          <div class="headteacher-header-copy">
            <button type="button" class="headteacher-mobile-menu-toggle" :aria-expanded="isSidebarOpen" aria-controls="headteacher-sidebar-drawer" aria-label="Open sidebar" @click="isSidebarOpen = !isSidebarOpen">
              <i class="fas fa-bars" aria-hidden="true"></i>
            </button>
            <div class="headteacher-matched-header-copy">
              <h1>Announcements</h1>
              <p class="headteacher-header-subtitle">School-wide updates from EduMatch administrators.</p>
            </div>
          </div>
          <div class="headteacher-header-tools">
            <HeadTeacherNotifications />
            <RouterLink to="/headteacher/settings" class="headteacher-header-settings-button" aria-label="Head Teacher settings" title="Settings">
              <i class="fas fa-cog" aria-hidden="true"></i>
            </RouterLink>
          </div>
        </div>
      </header>
      <StudentAnnouncements class="headteacher-announcement-content" />
      <DashboardFooter />
    </main>
  </div>
</template>
<script setup>
import DashboardFooter from '../../components/DashboardFooter.vue'
import { computed, ref } from 'vue'
import { useAuthStore } from '../../stores/auth.js'
import HeadTeacherSidebar from '../../components/HeadTeacherSidebar.vue'
import HeadTeacherNotifications from '../../components/HeadTeacherNotifications.vue'
import StudentAnnouncements from '../student/StudentAnnouncements.vue'

const authStore = useAuthStore()
const isSidebarOpen = ref(false)
const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'HeadTeacher').trim())
</script>
<style scoped>
.headteacher-announcement-content {
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  margin: 0;
  color: #1e4307;
}
.headteacher-announcement-content :deep(.page-header h1),
.headteacher-announcement-content :deep(.empty-state h2) { color: #1e4307; }
.headteacher-announcement-content :deep(.eyebrow) { color: #3b7a2a !important; }
.headteacher-announcement-content :deep(.announcement-subject),
.headteacher-announcement-content :deep(.card-arrow) { color: #3b7a2a; }
.headteacher-announcement-content :deep(.announcement-icon) {
  background: #e6f3df;
  color: #3b7a2a;
}
.headteacher-announcement-content :deep(.announcement-card),
.headteacher-announcement-content :deep(.announcement-detail),
.headteacher-announcement-content :deep(.state-card) { border-color: #b8d5a8; }
.headteacher-announcement-content :deep(.announcement-card:hover) {
  border-color: #639c48;
  box-shadow: 0 10px 24px rgb(30 67 7 / 8%);
}
.headteacher-announcement-content :deep(.empty-state) {
  background: linear-gradient(135deg, #f4faef, #e8f4e1);
  color: #48633d;
}
.headteacher-announcement-content :deep(.empty-state > i) { color: #4d8a35; }
.headteacher-announcement-content :deep(.back-button),
.headteacher-announcement-content :deep(.state-card button) {
  border-color: #b8d5a8;
  color: #356b24;
}
</style>
