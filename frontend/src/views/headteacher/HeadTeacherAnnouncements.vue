<template>
  <div class="headteacher-workspace headteacher-dashboard-page">
    <HeadTeacherSidebar v-model:is-open="isSidebarOpen" :display-name="displayName" />
    <main class="headteacher-main headteacher-page-container">
      <header class="headteacher-top-header">
        <div class="headteacher-header-content">
          <div class="headteacher-header-copy">
            <button type="button" class="headteacher-mobile-menu-toggle" :aria-expanded="isSidebarOpen" aria-controls="headteacher-sidebar-drawer" aria-label="Open sidebar" @click="isSidebarOpen = !isSidebarOpen">
              <i class="fas fa-bars" aria-hidden="true"></i>
            </button>
            <div>
              <h1>Announcements</h1>
              <p class="headteacher-header-subtitle">School-wide updates from EduMatch administrators.</p>
            </div>
          </div>
          <div class="headteacher-header-tools">
            <button class="headteacher-header-settings-button" type="button" aria-label="Home Dashboard" @click="router.push('/headteacher/dashboard')">
              <i class="fas fa-home" aria-hidden="true"></i>
            </button>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import HeadTeacherSidebar from '../../components/HeadTeacherSidebar.vue'
import StudentAnnouncements from '../student/StudentAnnouncements.vue'

const router = useRouter()
const authStore = useAuthStore()
const isSidebarOpen = ref(false)
const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'HeadTeacher').trim())
</script>
