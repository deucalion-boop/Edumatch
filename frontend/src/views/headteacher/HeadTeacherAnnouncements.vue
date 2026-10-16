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
      <StudentAnnouncements />
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
