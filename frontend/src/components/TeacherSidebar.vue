<template>
<aside id="teacher-sidebar-drawer" class="teacher-sidebar" :class="{ active: isSidebarOpen }" data-tour="teacher-sidebar">
      <div class="sidebar-header">
        <div class="teacher-logo">
          <div class="teacher-logo-icon">
            <i class="fas fa-graduation-cap" aria-hidden="true"></i>
          </div>
          <div class="teacher-logo-text">
            <h2>EduMatch</h2>
            <p>Teacher Portal</p>
          </div>
        </div>
        <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <nav class="sidebar-nav" data-tour="teacher-navigation">
        <div class="nav-section">
          <h4 class="nav-section-title">Navigation</h4>
          <router-link to="/teacher/dashboard" class="nav-link" data-tour="teacher-dashboard-link" :class="{ active: isActiveRoute('/teacher/dashboard') }" @click="closeSidebar">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </router-link>
          <div class="nav-dropdown nav-dropdown-activities">
            <button
              type="button"
              class="nav-link nav-link-dropdown"
              data-nav-group="activities"
              data-tour="teacher-activities-link"
              :class="{ active: isActivitiesRouteActive || isActivitiesMenuOpen, 'is-expanded': isActivitiesMenuOpen }"
              :aria-expanded="isActivitiesMenuOpen ? 'true' : 'false'"
              aria-controls="teacher-activities-sublinks"
              @click="toggleActivitiesMenu"
            >
              <span class="nav-link-main">
                <i class="fas fa-tasks"></i>
                <span class="nav-link-copy">
                  <span class="nav-link-title">Activities</span>
                </span>
              </span>
              <i class="fas fa-chevron-down nav-link-caret" aria-hidden="true"></i>
            </button>
            <div v-if="isActivitiesMenuOpen" id="teacher-activities-sublinks" class="nav-sublinks">
              <router-link :to="buildActivitiesTabRoute('lesson')" class="nav-sublink" :class="{ active: isActivitiesSubRouteActive('lesson') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Lesson Upload</span>
                  <span class="nav-sublink-caption">Upload lesson PDFs and materials</span>
                </span>
              </router-link>
              <router-link :to="buildActivitiesTabRoute('challenge')" class="nav-sublink" :class="{ active: isActivitiesSubRouteActive('challenge') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Assessment Creation</span>
                  <span class="nav-sublink-caption">Create quizzes, activities, and exams</span>
                </span>
              </router-link>
            </div>
          </div>
          <router-link to="/teacher/students" class="nav-link" data-tour="teacher-students-link" :class="{ active: isActiveRoute('/teacher/students') }" @click="closeSidebar">
            <i class="fas fa-user-graduate"></i>
            <span>Students</span>
          </router-link>
          <router-link to="/teacher/announcements" class="nav-link" :class="{ active: isActiveRoute('/teacher/announcements') }" @click="closeSidebar">
            <i class="fas fa-bullhorn"></i>
            <span>Announcements</span>
          </router-link>
          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-link nav-link-dropdown"
              data-nav-group="records"
              data-tour="teacher-records-link"
              :class="{ active: isRecordsRouteActive || isRecordsMenuOpen, 'is-expanded': isRecordsMenuOpen }"
              :aria-expanded="isRecordsMenuOpen ? 'true' : 'false'"
              aria-controls="teacher-records-sublinks"
              @click="toggleRecordsMenu"
            >
              <span class="nav-link-main">
                <i class="fas fa-clipboard-list"></i>
                <span class="nav-link-copy">
                  <span class="nav-link-title">Records</span>
                </span>
              </span>
              <i class="fas fa-chevron-down nav-link-caret" aria-hidden="true"></i>
            </button>
            <div v-if="isRecordsMenuOpen" id="teacher-records-sublinks" class="nav-sublinks">
              <router-link :to="buildRecordsTabRoute('lessons')" class="nav-sublink" :class="{ active: isRecordsSubRouteActive('lessons') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Lessons</span>
                  <span class="nav-sublink-caption">Uploaded lesson materials</span>
                </span>
              </router-link>
              <router-link :to="buildRecordsTabRoute('assessments')" class="nav-sublink" :class="{ active: isRecordsSubRouteActive('assessments') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Activities / Exams</span>
                  <span class="nav-sublink-caption">Scores and assessment records</span>
                </span>
              </router-link>
              <router-link :to="buildRecordsTabRoute('attendance')" class="nav-sublink" :class="{ active: isRecordsSubRouteActive('attendance') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Attendance</span>
                  <span class="nav-sublink-caption">Daily class attendance logs</span>
                </span>
              </router-link>
            </div>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="teacher-profile">
          <div class="teacher-avatar">
            <img v-if="teacherAvatarUrl" :src="teacherAvatarUrl" alt="" @error="$event.currentTarget.remove()">
            <i class="fas fa-user" aria-hidden="true"></i>
          </div>
          <div class="teacher-info">
            <h5>{{ teacherFullName }}</h5>
            <p class="teacher-role">{{ teacherRole }}</p>
            <div class="teacher-status">
              <span class="status-indicator active"></span>
              <span>{{ teacherStatus }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
    <button
      v-if="isSidebarOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="Close sidebar"
      @click="closeSidebar"
    ></button>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
const props = defineProps({ isOpen: Boolean })
const emit = defineEmits(['update:isOpen'])
const route = useRoute()
const authStore = useAuthStore()
const isSidebarOpen = computed(() => props.isOpen)
const closeSidebar = () => emit('update:isOpen', false)
const teacherAvatarUrl = computed(() => authStore.user?.profileImage || '')
const teacherFullName = computed(() => authStore.user?.name || 'Teacher')
const teacherRole = 'Teacher'
const teacherStatus = computed(() => authStore.user?.status === 'active' ? 'Active' : 'Offline')
const activitiesOpen = ref(false)
const recordsOpen = ref(false)
const isActivitiesRouteActive = computed(() => route.path.startsWith('/teacher/activities'))
const isRecordsRouteActive = computed(() => route.path.startsWith('/teacher/records'))
const isActivitiesMenuOpen = computed(() => activitiesOpen.value || isActivitiesRouteActive.value)
const isRecordsMenuOpen = computed(() => recordsOpen.value || isRecordsRouteActive.value)
const toggleActivitiesMenu = () => { activitiesOpen.value = !activitiesOpen.value }
const toggleRecordsMenu = () => { recordsOpen.value = !recordsOpen.value }
const isActiveRoute = path => route.path === path
const buildActivitiesTabRoute = tab => ({ path: '/teacher/activities', query: { tab } })
const buildRecordsTabRoute = tab => ({ path: '/teacher/records', query: { tab } })
const isActivitiesSubRouteActive = tab => isActivitiesRouteActive.value && String(route.query.tab || 'lesson') === tab
const isRecordsSubRouteActive = tab => isRecordsRouteActive.value && String(route.query.tab || 'lessons') === tab
</script>
