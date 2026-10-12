<template>
  <div class="headteacher-workspace headteacher-dashboard-page"><main class="headteacher-main headteacher-page-container">
    <header class="headteacher-top-header"><div class="headteacher-header-content"><div class="headteacher-header-copy"><div><h1>Announcements</h1><p class="headteacher-header-subtitle">School-wide updates from EduMatch administrators.</p></div></div><button class="headteacher-header-settings-button" type="button" aria-label="Home Dashboard" @click="router.push('/headteacher/dashboard')"><i class="fas fa-home"></i></button></div></header>
    <StudentAnnouncements />
  </main></div>
</template>
<script setup>
import { useRouter } from 'vue-router'
import StudentAnnouncements from '../student/StudentAnnouncements.vue'
const router = useRouter()
</script>
