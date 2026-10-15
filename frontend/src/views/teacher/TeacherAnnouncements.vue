<template>
  <div class="teacher-dashboard"><main class="teacher-main">
    <header class="top-header"><div class="header-content"><div class="header-left"><div><h1>Announcements</h1><p class="header-subtitle">School-wide updates from EduMatch administrators.</p></div></div><button class="header-tour-btn dashboard-home-btn" type="button" aria-label="Home Dashboard" @click="router.push('/teacher/dashboard')"><i class="fas fa-home"></i></button></div></header>
    <StudentAnnouncements />
    <DashboardFooter />
  </main></div>
</template>
<script setup>
import DashboardFooter from '../../components/DashboardFooter.vue'
import { useRouter } from 'vue-router'
import StudentAnnouncements from '../student/StudentAnnouncements.vue'
const router = useRouter()
</script>
