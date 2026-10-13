<template>
  <aside id="headteacher-sidebar-drawer" class="headteacher-sidebar" :class="{ active: isOpen }">
    <div class="headteacher-sidebar-header">
      <div class="headteacher-brand">
        <div class="headteacher-brand-icon">
          <img src="/logo.png" alt="EduMatch" class="headteacher-brand-image">
        </div>
        <div class="headteacher-brand-copy">
          <h2>EduMatch</h2>
          <p>Head Teacher Portal</p>
        </div>
      </div>
      <button type="button" class="headteacher-sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <nav class="headteacher-sidebar-nav" aria-label="Head Teacher navigation">
      <div class="headteacher-nav-section">
        <h4 class="headteacher-nav-section-title">Workspace</h4>
        <router-link
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          class="headteacher-nav-link"
          :class="{ active: route.path === item.path }"
          @click="closeSidebar"
        >
          <i class="fas" :class="item.icon" aria-hidden="true"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <div class="headteacher-sidebar-footer">
      <div class="headteacher-sidebar-profile">
        <div class="headteacher-sidebar-avatar">
          <i class="fas fa-user" aria-hidden="true"></i>
        </div>
        <div class="headteacher-sidebar-info">
          <h5>{{ displayName }}</h5>
          <div class="headteacher-sidebar-meta">
            <p class="headteacher-sidebar-role">Head Teacher</p>
            <div class="headteacher-sidebar-status">
              <span class="headteacher-sidebar-status-indicator active"></span>
              <span>active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <button v-if="isOpen" type="button" class="headteacher-sidebar-backdrop" @click="closeSidebar" aria-label="Close sidebar"></button>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  displayName: { type: String, default: 'HeadTeacher' },
  isOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['update:isOpen'])
const route = useRoute()
const navigationItems = [
  { path: '/headteacher/dashboard', label: 'Dashboard', icon: 'fa-home' },
  { path: '/headteacher/management', label: 'Teacher Management', icon: 'fa-users-cog' },
  { path: '/headteacher/lessons', label: 'Lessons & Exams', icon: 'fa-book-open' },
  { path: '/headteacher/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
]

const closeSidebar = () => emit('update:isOpen', false)
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.isOpen) closeSidebar()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))
</script>
