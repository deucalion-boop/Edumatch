<template>
  <div class="teacher-dashboard">
    <TeacherSidebar v-model:is-open="isSidebarOpen" />
    <main class="teacher-main">
    <header class="top-header"><div class="header-content"><div class="header-left"><button type="button" class="mobile-menu-toggle" aria-label="Open sidebar" aria-controls="teacher-sidebar-drawer" :aria-expanded="isSidebarOpen" @click="isSidebarOpen = !isSidebarOpen"><i class="fas fa-bars" aria-hidden="true"></i></button><div><h1>Announcements</h1><p class="header-subtitle">School-wide updates from EduMatch administrators.</p></div></div><button class="header-tour-btn dashboard-home-btn" type="button" aria-label="Home Dashboard" @click="router.push('/teacher/dashboard')"><i class="fas fa-home"></i></button></div></header>
    <StudentAnnouncements />
    <DashboardFooter />
  </main></div>
</template>
<script setup>
import DashboardFooter from '../../components/DashboardFooter.vue'
import TeacherSidebar from '../../components/TeacherSidebar.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import StudentAnnouncements from '../student/StudentAnnouncements.vue'
const router = useRouter()
const isSidebarOpen = ref(false)
</script>
