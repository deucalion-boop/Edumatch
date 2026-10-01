<template>
  <div class="teacher-dashboard">
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

    <main class="teacher-main">
      <header class="top-header" data-tour="teacher-header-overview">
        <div class="header-content">
          <div class="header-left">
            <button type="button" class="mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar">
              <i class="fas fa-bars"></i>
            </button>
            <div>
              <h1>Welcome, {{ displayName }}!</h1>
              <p class="header-subtitle">Your main teaching overview for activities, students, records, and progress insights.</p>
            </div>
          </div>
          <div class="header-actions">
            <div class="header-right-controls">
            <button
              type="button"
              class="header-tour-btn"
              data-tour="teacher-help-button"
              @click="launchManualTour"
              aria-label="Help and tour"
              title="Help / Tour"
            >
              <i class="fas fa-question-circle"></i>
            </button>
            <div ref="notificationMenuRef" class="notification-menu">
              <button
                type="button"
                class="notification-bell"
                data-tour="teacher-notifications"
                @click="toggleNotificationsPanel"
                aria-label="Notifications"
                :aria-expanded="showNotificationsPanel ? 'true' : 'false'"
              >
                <i class="fas fa-bell"></i>
                <span v-if="unreadNotificationCount > 0" class="notification-count">{{ unreadNotificationCount }}</span>
              </button>
              <div v-if="showNotificationsPanel" class="notification-dropdown">
                <div class="notification-dropdown-header">
                  <h3>Notifications</h3>
                  <div class="notification-dropdown-actions">
                    <button
                      type="button"
                      class="notification-dropdown-clear"
                      :disabled="messageNotifications.length === 0"
                      @click="clearAllNotifications"
                    >
                      Clear all
                    </button>
                    <button type="button" class="notification-dropdown-close" @click="closeNotificationsPanel" aria-label="Close notifications">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <UserNotificationList :notifications="messageNotifications" :loading="isNotificationsLoading" @select="closeNotificationsPanel" />
              </div>
            </div>
            <div ref="accountMenuRef" class="account-menu">
              <button
                type="button"
                class="header-tour-btn account-menu-trigger"
                data-tour="teacher-account-settings"
                aria-label="Account menu"
                title="Account"
                @click="toggleAccountMenu"
              >
                <i class="fas fa-cog"></i>
              </button>
              <div v-if="isAccountMenuOpen" class="account-menu-dropdown">
                <button type="button" class="account-menu-item" @click="goToProfile">
                  <i class="fas fa-user"></i>
                  <span>Profile</span>
                </button>
                <button type="button" class="account-menu-item" @click="goToSettings">
                  <i class="fas fa-cog"></i>
                  <span>Settings</span>
                </button>
                <button type="button" class="account-menu-item danger" @click="handleLogout">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </header>

      <div class="kpi-grid dashboard-kpi-grid animated-card" data-tour="teacher-kpi">
        <article v-for="card in summaryCards" :key="card.label" class="kpi-card">
          <div class="kpi-icon" :class="card.tone"><i :class="card.icon"></i></div>
          <div class="kpi-content">
            <span class="kpi-label">{{ card.label }}</span>
            <strong class="kpi-value">{{ card.value }}</strong>
            <small class="kpi-note">{{ card.note }}</small>
          </div>
        </article>
      </div>

      <div class="main-content-grid dashboard-layout" data-tour="teacher-main-content">
        <div class="content-column">
          <section class="calendar-card section-card animated-card" data-tour="teacher-calendar-panel">
            <div class="calendar-header">
              <div>
                <p class="calendar-kicker">Academic Calendar</p>
                <h3 class="calendar-title">{{ calendarTitle }}</h3>
              </div>
              <div class="calendar-controls">
                <button type="button" class="calendar-nav-btn" @click="goToPreviousMonth" aria-label="Previous month">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button type="button" class="calendar-today-btn" @click="goToCurrentMonth">Today</button>
                <button type="button" class="calendar-nav-btn" @click="goToNextMonth" aria-label="Next month">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <div class="calendar-filters" role="group" aria-label="Filter calendar events">
              <span class="calendar-filter-label">Show</span>
              <button
                type="button"
                class="calendar-filter-btn is-all"
                :class="{ active: areAllCalendarFiltersEnabled }"
                @click="showAllCalendarEvents"
              >
                <i class="fas fa-layer-group"></i>
                <span>All events</span>
              </button>
              <button
                v-for="filter in calendarFilterOptions"
                :key="filter.key"
                type="button"
                class="calendar-filter-btn"
                :class="[ `is-${filter.key}`, { active: calendarEventFilters[filter.key] } ]"
                :aria-pressed="calendarEventFilters[filter.key] ? 'true' : 'false'"
                @click="toggleCalendarEventFilter(filter.key)"
              >
                <i :class="filter.icon"></i>
                <span>{{ filter.label }}</span>
              </button>
            </div>

            <p v-if="visibleCalendarFilterCount === 0" class="calendar-filter-note">
              No event types selected. Turn on at least one filter to show calendar items.
            </p>

            <p class="calendar-scroll-hint" aria-hidden="true">
              <i class="fas fa-arrows-left-right"></i>
              Swipe to view the full month
            </p>

            <div class="calendar-scroll-area" tabindex="0" aria-label="Monthly calendar. Scroll horizontally to view all days.">
              <div class="calendar-scroll-content">
                <div class="calendar-weekdays">
                  <span v-for="day in weekDays" :key="day">{{ day }}</span>
                </div>

                <div class="calendar-grid">
                  <div
                    v-for="dayCell in calendarCells"
                    :key="dayCell.key"
                    class="calendar-day"
                    :class="{
                      'is-empty': !dayCell.day,
                      'is-today': dayCell.isToday,
                      'has-events': dayCell.eventCount > 0
                    }"
                  >
                    <template v-if="dayCell.day">
                      <span class="day-number">{{ dayCell.day }}</span>
                      <div v-if="dayCell.events.length > 0" class="day-events">
                        <span
                          v-for="event in dayCell.events.slice(0, 2)"
                          :key="event.id"
                          class="day-event-pill"
                          :class="`is-${event.type || 'lesson'}`"
                          :title="event.tooltip"
                        >
                          <span class="event-title">{{ event.title }}</span>
                          <span class="event-time">{{ event.timeLabel }}</span>
                        </span>
                        <span v-if="dayCell.events.length > 2" class="day-event-more">+{{ dayCell.events.length - 2 }} more</span>
                      </div>
                      <span
                        v-if="dayCell.eventCount > 0"
                        class="day-dot"
                        :class="`is-${dayCell.events[0]?.type || 'lesson'}`"
                      ></span>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div class="calendar-legend">
              <span class="is-lesson"><i class="fas fa-circle"></i> Lesson posted event</span>
              <span class="is-deadline"><i class="fas fa-clock"></i> Assessment deadline</span>
              <span class="is-completed"><i class="fas fa-check-circle"></i> Completed assessment</span>
            </div>
          </section>

        </div>
      </div>

    </main>

    <div v-if="isTourActive" class="teacher-tour-layer" aria-live="polite">
      <div class="teacher-tour-backdrop"></div>
      <div v-if="tourSpotlightStyle" class="teacher-tour-spotlight" :style="tourSpotlightStyle"></div>
      <section
        class="teacher-tour-tooltip"
        :style="tourTooltipStyle"
        role="dialog"
        aria-modal="true"
        :aria-label="`Dashboard tour step ${tourStepIndex + 1} of ${tourSteps.length}`"
      >
        <p class="teacher-tour-step">Step {{ tourStepIndex + 1 }} of {{ tourSteps.length }}</p>
        <h3>{{ activeTourStep?.title }}</h3>
        <p>{{ activeTourStep?.description }}</p>
        <div class="teacher-tour-actions">
          <button type="button" class="teacher-tour-btn teacher-tour-btn-ghost" @click="skipTour">Skip</button>
          <button type="button" class="teacher-tour-btn teacher-tour-btn-ghost" :disabled="isFirstTourStep" @click="goToPreviousTourStep">Back</button>
          <button type="button" class="teacher-tour-btn teacher-tour-btn-primary" @click="goToNextTourStep">
            {{ isFinalTourStep ? 'Finish' : 'Next' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { computed, reactive, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'
import UserNotificationList from '../../components/UserNotificationList.vue'
import { useUserNotifications } from '../../composables/useUserNotifications.js'

const CURRENT_PAGE_ROUTE = '/teacher/dashboard'
const TOUR_ROUTE_ORDER = ['/teacher/dashboard', '/teacher/activities', '/teacher/students', '/teacher/records']
const TOUR_PROGRESS_PREFIX = 'edumatch_teacher_tour_progress_v3_'
const SIDEBAR_BREAKPOINT = 1024
const SIDEBAR_WIDTH = 280

export default {
  name: 'TeacherView',
  components: {
    UserNotificationList,
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const isSidebarOpen = ref(false)
    const isAccountMenuOpen = ref(false)
    const accountMenuRef = ref(null)
    const notificationMenuRef = ref(null)
    const isTourActive = ref(false)
    const tourStepIndex = ref(0)
    const tourTargetRect = ref(null)
    const tourTooltipStyle = ref({})
    const hasAttemptedAutoTour = ref(false)
    const activitiesMenuOpen = ref(route.path === '/teacher/activities' || route.path.startsWith('/teacher/activities/'))
    const recordsMenuOpen = ref(route.path === '/teacher/records' || route.path.startsWith('/teacher/records/'))
    const ACTIVITY_TAB_KEYS = ['lesson', 'challenge']
    const RECORDS_TAB_KEYS = ['lessons', 'assessments', 'attendance']

    const teacher = reactive({
      name: '',
      displayName: '',
      strand: '',
      status: 'Online',
      email: ''
    })

    const stats = reactive({
      totalStudents: 0,
      totalActivitiesCreated: 0,
      completedAssessments: 0,
      totalLessons: 0,
      totalAssessments: 0
    })

    const activityNotifications = ref([])
    const isActivityRefreshing = ref(false)
    const {
      notifications: messageNotifications,
      unreadCount: unreadNotificationCount,
      isLoading: isNotificationsLoading,
      showNotificationsPanel,
      toggleNotificationsPanel: toggleUserNotificationsPanel,
      closeNotificationsPanel: closeUserNotificationsPanel,
      clearAllNotifications,
    } = useUserNotifications({ limit: 8, pollIntervalMs: 15000 })
    const students = ref([])
    const calendarLessons = ref([])
    const calendarAssessments = ref([])
    const calendarCompletedAssessments = ref([])
    const currentCalendarDate = ref(new Date())
    const calendarEventFilters = reactive({
      lesson: true,
      deadline: true,
      completed: true,
    })
    const calendarFilterOptions = [
      { key: 'lesson', label: 'Lessons', icon: 'fas fa-circle' },
      { key: 'deadline', label: 'Deadlines', icon: 'fas fa-clock' },
      { key: 'completed', label: 'Completed', icon: 'fas fa-check-circle' },
    ]
    const tourSteps = [
      {
        key: 'navigation-overview',
        title: 'Teacher Sidebar',
        description: 'This sidebar is your main navigation area. The next steps explain each of its core teacher pages before showing what is inside them.',
        selector: '[data-tour="teacher-sidebar"]',
        openSidebar: true
      },
      {
        key: 'dashboard-link',
        title: 'Dashboard',
        description: 'Open Dashboard for a quick overview of your classes, activities, assessments, and schedule.',
        selector: '[data-tour="teacher-dashboard-link"]',
        openSidebar: true
      },
      {
        key: 'activities-link',
        title: 'Activities',
        description: 'Open Activities to upload lessons and create or generate assessments for your students.',
        selector: '[data-tour="teacher-activities-link"]',
        openSidebar: true
      },
      {
        key: 'students-link',
        title: 'Students',
        description: 'Open Students to invite learners, manage your class list, and monitor participation and progress.',
        selector: '[data-tour="teacher-students-link"]',
        openSidebar: true
      },
      {
        key: 'records-link',
        title: 'Records',
        description: 'Open Records to review lesson history, assessment results, submissions, attendance, and performance.',
        selector: '[data-tour="teacher-records-link"]',
        openSidebar: true
      },
      {
        key: 'dashboard-overview',
        title: 'Dashboard Summary',
        description: 'These summary cards show important teacher insights such as total students, total activities, completed assessments, and recent system updates.',
        selector: '[data-tour="teacher-kpi"]'
      },
      {
        key: 'dashboard-content',
        title: 'Dashboard Workspace',
        description: 'Use this area to review your teaching overview, recent updates, and the information that needs your attention.',
        selector: '[data-tour="teacher-main-content"]'
      },
      {
        key: 'dashboard-calendar',
        title: 'Calendar and Schedule',
        description: 'Track lessons, deadlines, and completed assessments from the dashboard calendar before continuing to Activities.',
        selector: '[data-tour="teacher-calendar-panel"]'
      }
    ]
    const activeTourStep = computed(() => tourSteps[tourStepIndex.value] || null)
    const isLastTourStep = computed(() => tourStepIndex.value >= tourSteps.length - 1)
    const isFirstTourStep = computed(() => tourStepIndex.value === 0 && TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE) === 0)
    const isFinalTourStep = computed(() => isLastTourStep.value && TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE) === TOUR_ROUTE_ORDER.length - 1)
    const weekDays = computed(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    const calendarTitle = computed(() => new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(currentCalendarDate.value))
    const visibleCalendarFilterCount = computed(() => (
      calendarFilterOptions.reduce((count, filter) => count + (calendarEventFilters[filter.key] ? 1 : 0), 0)
    ))
    const areAllCalendarFiltersEnabled = computed(() => (
      visibleCalendarFilterCount.value === calendarFilterOptions.length
    ))
    const calendarCells = computed(() => {
      const year = currentCalendarDate.value.getFullYear()
      const month = currentCalendarDate.value.getMonth()
      const firstDay = new Date(year, month, 1)
      const totalDays = new Date(year, month + 1, 0).getDate()
      const startWeekday = firstDay.getDay()
      const cells = []
      const today = new Date()
      const todayStamp = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

      for (let i = 0; i < startWeekday; i += 1) {
        cells.push({
          key: `empty-start-${i}`,
          day: null,
          isToday: false,
          eventCount: 0,
          events: []
        })
      }

      for (let day = 1; day <= totalDays; day += 1) {
        const dateStamp = `${year}-${month}-${day}`
        const events = getCalendarEventsForDate(year, month, day)
        cells.push({
          key: `day-${day}`,
          day,
          isToday: dateStamp === todayStamp,
          eventCount: events.length,
          events
        })
      }

      while (cells.length % 7 !== 0) {
        cells.push({
          key: `empty-end-${cells.length}`,
          day: null,
          isToday: false,
          eventCount: 0,
          events: []
        })
      }

      return cells
    })
    const displayName = computed(() => teacher.displayName || teacher.name || 'Teacher')
    const teacherFullName = computed(() => displayName.value)
    const teacherRole = computed(() => {
      const role = String(authStore.user?.role || 'teacher').trim().toLowerCase()
      if (!role) return 'Teacher'
      return role.charAt(0).toUpperCase() + role.slice(1)
    })
    const teacherStrand = computed(() => String(teacher.strand || '').trim())
    const teacherStatus = computed(() => String(teacher.status || 'Online').trim() || 'Online')
    const summaryCards = computed(() => ([
      {
        label: 'Total Students',
        value: formatNumber(stats.totalStudents),
        note: 'Students currently managed across your classes',
        icon: 'fas fa-users',
        tone: 'students'
      },
      {
        label: 'Total Lesson Created',
        value: formatNumber(stats.totalLessons),
        note: 'Lessons posted across your classes',
        icon: 'fas fa-tasks',
        tone: 'lessons'
      },
      {
        label: 'Total Activities Created',
        value: formatNumber(stats.totalActivitiesCreated),
        note: 'Assessments and classroom activities created',
        icon: 'fas fa-clipboard-check',
        tone: 'classes'
      },
      {
        label: 'Completed Assessment/ Activities',
        value: formatNumber(stats.completedAssessments),
        note: 'Student assessment submissions completed so far',
        icon: 'fas fa-check-double',
        tone: 'assessments'
      }
    ]))

    const teacherAvatarUrl = computed(() => {
      const profileImage = String(authStore.user?.profileImage || '').trim()
      if (profileImage && !profileImage.toLowerCase().includes('ui-avatars.com')) return profileImage
      return ''
    })

    const isActiveRoute = (path) => route.path === path || route.path.startsWith(`${path}/`)
    const normalizeActivitiesTab = (tab) => {
      const normalizedTab = String(tab || '').trim().toLowerCase()
      if (normalizedTab === 'assessment' || normalizedTab === 'assessments') return 'challenge'
      return ACTIVITY_TAB_KEYS.includes(normalizedTab) ? normalizedTab : 'lesson'
    }
    const buildActivitiesTabRoute = (tab) => {
      const normalizedTab = normalizeActivitiesTab(tab)
      return normalizedTab === 'lesson'
        ? { path: '/teacher/activities' }
        : { path: '/teacher/activities', query: { tab: normalizedTab } }
    }
    const isActivitiesRouteActive = computed(() => route.path === '/teacher/activities' || route.path.startsWith('/teacher/activities/'))
    const isActivitiesMenuOpen = computed(() => activitiesMenuOpen.value)
    const isActivitiesSubRouteActive = (tab) => (
      isActivitiesRouteActive.value && normalizeActivitiesTab(route.query.tab) === normalizeActivitiesTab(tab)
    )
    const toggleActivitiesMenu = () => {
      activitiesMenuOpen.value = !activitiesMenuOpen.value
    }
    const normalizeRecordsTab = (tab) => {
      const normalizedTab = String(tab || '').trim().toLowerCase()
      return RECORDS_TAB_KEYS.includes(normalizedTab) ? normalizedTab : 'lessons'
    }
    const buildRecordsTabRoute = (tab) => {
      const normalizedTab = normalizeRecordsTab(tab)
      return normalizedTab === 'lessons'
        ? { path: '/teacher/records' }
        : { path: '/teacher/records', query: { tab: normalizedTab } }
    }
    const isRecordsRouteActive = computed(() => route.path === '/teacher/records' || route.path.startsWith('/teacher/records/'))
    const isRecordsMenuOpen = computed(() => recordsMenuOpen.value)
    const isRecordsSubRouteActive = (tab) => (
      isRecordsRouteActive.value && normalizeRecordsTab(route.query.tab) === normalizeRecordsTab(tab)
    )
    const toggleRecordsMenu = () => {
      recordsMenuOpen.value = !recordsMenuOpen.value
    }

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
    }

    const closeSidebar = () => {
      isSidebarOpen.value = false
    }

    const syncMobileMenuBodyState = () => {
      if (typeof window === 'undefined') return
      const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
      document.body.classList.toggle('teacher-mobile-menu-open', shouldLockBody)
    }

    const toggleNotificationsPanel = () => {
      isAccountMenuOpen.value = false
      toggleUserNotificationsPanel()
    }

    const closeNotificationsPanel = () => {
      closeUserNotificationsPanel()
    }

    const goToPreviousMonth = () => {
      const nextDate = new Date(currentCalendarDate.value)
      nextDate.setMonth(nextDate.getMonth() - 1)
      currentCalendarDate.value = nextDate
    }

    const goToNextMonth = () => {
      const nextDate = new Date(currentCalendarDate.value)
      nextDate.setMonth(nextDate.getMonth() + 1)
      currentCalendarDate.value = nextDate
    }

    const goToCurrentMonth = () => {
      currentCalendarDate.value = new Date()
    }

    const toggleCalendarEventFilter = (type) => {
      if (!Object.prototype.hasOwnProperty.call(calendarEventFilters, type)) return
      calendarEventFilters[type] = !calendarEventFilters[type]
    }

    const showAllCalendarEvents = () => {
      calendarFilterOptions.forEach((filter) => {
        calendarEventFilters[filter.key] = true
      })
    }

    const getCalendarEventsForDate = (year, month, day) => {
      const normalizeDate = (value) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return null
        return {
          year: date.getFullYear(),
          month: date.getMonth(),
          day: date.getDate()
        }
      }

      const formatTime = (value) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'Unknown time'
        return new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(date)
      }

      const formatDateTime = (value) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'Unknown date/time'
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date)
      }

      const lessonEvents = calendarLessons.value
        .map((lesson, index) => {
          const postedAt = lesson?.postedAt || lesson?.createdAt
          const normalized = normalizeDate(postedAt)
          if (!normalized) return null
          if (normalized.year !== year || normalized.month !== month || normalized.day !== day) return null

          const title = String(lesson?.title || 'Lesson')
          return {
            id: String(lesson?.id || `${title}-${postedAt || index}`),
            type: 'lesson',
            title,
            timeLabel: formatTime(postedAt),
            postedAtMs: new Date(postedAt).getTime(),
            tooltip: `${title} - Posted ${formatDateTime(postedAt)}`
          }
        })
        .filter(Boolean)

      const deadlineEvents = calendarAssessments.value
        .map((assessment, index) => {
          const deadline = assessment?.submissionDeadline
          const normalized = normalizeDate(deadline)
          if (!normalized) return null
          if (normalized.year !== year || normalized.month !== month || normalized.day !== day) return null

          const title = String(assessment?.title || 'Assessment')
          return {
            id: String(assessment?.id || `${title}-${deadline || index}`),
            type: 'deadline',
            title,
            timeLabel: formatTime(deadline),
            postedAtMs: new Date(deadline).getTime(),
            tooltip: `${title} - Deadline ${formatDateTime(deadline)}`
          }
        })
        .filter(Boolean)

      const completedAssessmentEvents = calendarCompletedAssessments.value
        .map((result, index) => {
          const completedAt = result?.submittedAt
          const normalized = normalizeDate(completedAt)
          if (!normalized) return null
          if (normalized.year !== year || normalized.month !== month || normalized.day !== day) return null

          const title = String(result?.assessmentTitle || 'Completed assessment')
          const studentName = String(result?.studentName || 'Student')
          return {
            id: String(result?.id || `${title}-${completedAt || index}`),
            type: 'completed',
            title,
            timeLabel: formatTime(completedAt),
            postedAtMs: new Date(completedAt).getTime(),
            tooltip: `${studentName} completed ${title} - Submitted ${formatDateTime(completedAt)}`
          }
        })
        .filter(Boolean)

      return [...lessonEvents, ...deadlineEvents, ...completedAssessmentEvents]
        .filter((event) => calendarEventFilters[event.type] !== false)
        .sort((a, b) => a.postedAtMs - b.postedAtMs)
    }

    const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

    const getTourViewportTopPadding = () => {
      if (typeof window === 'undefined') return 12
      if (window.innerWidth > SIDEBAR_BREAKPOINT) return 12
      const header = document.querySelector('.top-header')
      const headerBottom = header?.getBoundingClientRect?.().bottom || 0
      return Math.max(12, Math.min(Math.round(headerBottom + 10), Math.round(window.innerHeight * 0.4)))
    }

    const getScrollableAncestors = (element) => {
      const containers = []
      let parent = element?.parentElement || null

      while (parent && parent !== document.body) {
        const styles = window.getComputedStyle(parent)
        const overflowY = styles.overflowY
        const isScrollableY = /(auto|scroll|overlay)/.test(overflowY)
        if (isScrollableY && parent.scrollHeight > parent.clientHeight) {
          containers.push(parent)
        }
        parent = parent.parentElement
      }

      const root = document.scrollingElement || document.documentElement
      if (root) containers.push(root)
      return containers
    }

    const smoothScrollIntoView = async (element) => {
      if (!element) return
      const topPadding = getTourViewportTopPadding()
      const bottomPadding = window.innerWidth <= SIDEBAR_BREAKPOINT ? 14 : 16

      const containers = getScrollableAncestors(element)
      containers.forEach((container) => {
        const targetRect = element.getBoundingClientRect()
        const containerRect = container === document.scrollingElement || container === document.documentElement
          ? { top: 0, height: window.innerHeight, bottom: window.innerHeight }
          : container.getBoundingClientRect()

        const above = targetRect.top < containerRect.top + topPadding
        const below = targetRect.bottom > containerRect.bottom - bottomPadding
        if (!above && !below) return

        const currentTop = container === document.scrollingElement || container === document.documentElement
          ? window.scrollY
          : container.scrollTop

        const desiredTop = currentTop + (targetRect.top - containerRect.top) - topPadding - 10
        const safeTop = Math.max(0, desiredTop)

        if (container === document.scrollingElement || container === document.documentElement) {
          window.scrollTo({ top: safeTop, behavior: 'smooth' })
        } else {
          container.scrollTo({ top: safeTop, behavior: 'smooth' })
        }
      })

      element.scrollIntoView({
        behavior: 'smooth',
        block: window.innerWidth <= SIDEBAR_BREAKPOINT ? 'start' : 'center',
        inline: 'nearest'
      })
      await wait(320)
    }

    const getProgressStorageKey = () => {
      const authUser = authStore.user || {}
      const identifier = String(authUser._id || authUser.id || authUser.email || authUser.username || 'teacher').trim().toLowerCase()
      return `${TOUR_PROGRESS_PREFIX}${identifier || 'teacher'}`
    }

    const hasSeenTour = () => {
      return authStore.user?.hasCompletedTeacherTour === true
    }

    const persistTeacherTourPreference = async (value = true) => {
      try {
        const apiBaseUrl = resolveApiBaseUrl()
        const response = await axios.patch(
          `${apiBaseUrl}/teacher/tour-preference`,
          { hasCompletedTeacherTour: value === true },
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`
            }
          }
        )
        authStore.setUser({
          ...(response.data?.user || {}),
          hasCompletedTeacherTour: value === true,
        })
      } catch (error) {
        console.error('Failed to persist teacher tour preference:', error)
      }
    }

    const readTourProgress = () => {
      try {
        const raw = localStorage.getItem(getProgressStorageKey())
        return raw ? JSON.parse(raw) : null
      } catch (_error) {
        return null
      }
    }

    const writeTourProgress = (progress) => {
      try {
        localStorage.setItem(getProgressStorageKey(), JSON.stringify(progress))
      } catch (_error) {
        // no-op
      }
    }

    const clearTourProgress = () => {
      try {
        localStorage.removeItem(getProgressStorageKey())
      } catch (_error) {
        // no-op
      }
    }

    const updateTourPlacement = () => {
      if (!isTourActive.value) return
      const step = activeTourStep.value
      const target = step?.selector ? document.querySelector(step.selector) : null
      const isMobile = window.innerWidth <= SIDEBAR_BREAKPOINT
      const desktopSidebarVisible = window.innerWidth > SIDEBAR_BREAKPOINT
      const mobileSidebarVisible = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
      const sidebarVisible = desktopSidebarVisible || mobileSidebarVisible
      const safeViewportLeft = desktopSidebarVisible ? SIDEBAR_WIDTH + 16 : 12
      const viewportRightPadding = 12
      const viewportTopPadding = getTourViewportTopPadding()
      const viewportBottomPadding = 12
      const minTooltipWidth = isMobile ? 220 : 280
      const maxTooltipWidth = 400
      const availableWidth = Math.max(
        minTooltipWidth,
        window.innerWidth - safeViewportLeft - viewportRightPadding
      )

      if (!target) {
        tourTargetRect.value = null
        tourTooltipStyle.value = {
          width: `${Math.min(maxTooltipWidth, availableWidth)}px`,
          left: `${safeViewportLeft}px`,
          top: '50%',
          transform: 'translateY(-50%)'
        }
        return
      }

      const rect = target.getBoundingClientRect()
      const padding = 10
      const isSidebarTarget = Boolean(target.closest('.teacher-sidebar'))
      const minTargetLeft = sidebarVisible && !isSidebarTarget ? safeViewportLeft : 8
      const paddedRect = {
        top: clamp(rect.top - padding, viewportTopPadding, window.innerHeight - viewportBottomPadding),
        left: clamp(rect.left - padding, minTargetLeft, window.innerWidth - viewportRightPadding),
        width: clamp(rect.width + padding * 2, 0, window.innerWidth - minTargetLeft - viewportRightPadding),
        height: clamp(rect.height + padding * 2, 0, window.innerHeight - viewportTopPadding - viewportBottomPadding)
      }
      tourTargetRect.value = paddedRect

      const tooltipWidth = Math.min(maxTooltipWidth, availableWidth)
      const tooltipElement = document.querySelector('.teacher-tour-tooltip')
      const measuredHeight = tooltipElement?.getBoundingClientRect?.().height || 0
      const estimatedTooltipHeight = Math.max(isMobile ? 260 : 230, measuredHeight)
      const maxTooltipHeight = Math.max(180, window.innerHeight - viewportTopPadding - viewportBottomPadding)
      let tooltipTop = paddedRect.top + paddedRect.height + 16
      if (tooltipTop + estimatedTooltipHeight > window.innerHeight - viewportBottomPadding) {
        tooltipTop = paddedRect.top - estimatedTooltipHeight - 16
      }
      tooltipTop = clamp(
        tooltipTop,
        viewportTopPadding,
        Math.max(viewportTopPadding, window.innerHeight - estimatedTooltipHeight - viewportBottomPadding)
      )

      let tooltipLeft = paddedRect.left + (paddedRect.width / 2) - (tooltipWidth / 2)
      if (desktopSidebarVisible && isSidebarTarget) {
        tooltipLeft = safeViewportLeft
        tooltipTop = clamp(
          20,
          viewportTopPadding,
          Math.max(viewportTopPadding, window.innerHeight - estimatedTooltipHeight - viewportBottomPadding)
        )
      }
      tooltipLeft = clamp(
        tooltipLeft,
        safeViewportLeft,
        Math.max(safeViewportLeft, window.innerWidth - tooltipWidth - viewportRightPadding)
      )

      tourTooltipStyle.value = {
        width: `${tooltipWidth}px`,
        left: `${tooltipLeft}px`,
        top: `${tooltipTop}px`,
        maxHeight: `${maxTooltipHeight}px`,
        transform: 'none'
      }
    }

    const tourSpotlightStyle = computed(() => {
      if (!tourTargetRect.value) return null
      return {
        top: `${tourTargetRect.value.top}px`,
        left: `${tourTargetRect.value.left}px`,
        width: `${tourTargetRect.value.width}px`,
        height: `${tourTargetRect.value.height}px`
      }
    })

    const ensureStepContext = async (step) => {
      if (!step) return
      if (window.innerWidth <= SIDEBAR_BREAKPOINT) {
        isSidebarOpen.value = Boolean(step.openSidebar)
      }
      await nextTick()
      await wait(40)
    }

    const renderCurrentTourStep = async () => {
      await ensureStepContext(activeTourStep.value)
      const target = activeTourStep.value?.selector ? document.querySelector(activeTourStep.value.selector) : null
      if (target) {
        await smoothScrollIntoView(target)
      }
      updateTourPlacement()
    }

    const closeTour = ({ markSeen = true } = {}) => {
      isTourActive.value = false
      tourTargetRect.value = null
      tourTooltipStyle.value = {}
      if (markSeen) {
        authStore.setUser({ hasCompletedTeacherTour: true })
        persistTeacherTourPreference(true)
      }
      if (markSeen) clearTourProgress()
      document.body.classList.remove('teacher-tour-open')
    }

    const startTour = async ({ force = false } = {}) => {
      if (!force && hasSeenTour()) return
      isTourActive.value = true
      tourStepIndex.value = 0
      document.body.classList.add('teacher-tour-open')
      await nextTick()
      await renderCurrentTourStep()
    }

    const launchManualTour = async () => {
      clearTourProgress()
      if (CURRENT_PAGE_ROUTE !== TOUR_ROUTE_ORDER[0]) {
        writeTourProgress({ active: true, step: 0, updatedAt: Date.now() })
        await router.push(TOUR_ROUTE_ORDER[0])
        return
      }
      await startTour({ force: true })
    }

    const goToNextTourStep = async () => {
      if (isLastTourStep.value) {
        const routeIndex = TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE)
        const nextRoute = routeIndex >= 0 ? TOUR_ROUTE_ORDER[routeIndex + 1] : null
        if (nextRoute) {
          writeTourProgress({ active: true, step: 0, updatedAt: Date.now() })
          closeTour({ markSeen: false })
          await router.push(nextRoute)
          return
        }
        closeTour({ markSeen: true })
        return
      }
      tourStepIndex.value += 1
      writeTourProgress({ active: true, step: tourStepIndex.value, updatedAt: Date.now() })
      await renderCurrentTourStep()
    }

    const goToPreviousTourStep = async () => {
      if (tourStepIndex.value === 0) {
        const routeIndex = TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE)
        const previousRoute = routeIndex > 0 ? TOUR_ROUTE_ORDER[routeIndex - 1] : null
        if (previousRoute) {
          writeTourProgress({ active: true, step: 'last', updatedAt: Date.now() })
          closeTour({ markSeen: false })
          await router.push(previousRoute)
        }
        return
      }
      tourStepIndex.value -= 1
      writeTourProgress({ active: true, step: tourStepIndex.value, updatedAt: Date.now() })
      await renderCurrentTourStep()
    }

    const skipTour = () => {
      closeTour({ markSeen: true })
    }

    const maybeAutoStartTour = async () => {
      if (hasAttemptedAutoTour.value) return
      if (route.path !== CURRENT_PAGE_ROUTE) return
      hasAttemptedAutoTour.value = true
      const progress = readTourProgress()
      if (progress?.active) {
        const resolvedStep = progress.step === 'last' ? tourSteps.length - 1 : Number(progress.step || 0)
        isTourActive.value = true
        tourStepIndex.value = clamp(resolvedStep, 0, Math.max(0, tourSteps.length - 1))
        document.body.classList.add('teacher-tour-open')
        await nextTick()
        await renderCurrentTourStep()
        return
      }
      if (hasSeenTour()) return
      if (CURRENT_PAGE_ROUTE !== TOUR_ROUTE_ORDER[0]) return
      await wait(420)
      await startTour()
    }

    const handleTourViewportChange = () => {
      if (!isTourActive.value) return
      updateTourPlacement()
    }

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      if (isTourActive.value) {
        skipTour()
        return
      }
      showNotificationsPanel.value = false
      isAccountMenuOpen.value = false
      closeSidebar()
    }

    const handleLogout = async () => {
      try {
        authStore.logout()
        router.push('/auth/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    const toggleAccountMenu = () => {
      showNotificationsPanel.value = false
      isAccountMenuOpen.value = !isAccountMenuOpen.value
    }

    const goToProfile = () => {
      isAccountMenuOpen.value = false
      router.push('/teacher/profile')
    }

    const goToSettings = () => {
      isAccountMenuOpen.value = false
      router.push('/teacher/settings')
    }

    const handleHeaderMenusClickOutside = (event) => {
      const target = event?.target
      if (notificationMenuRef.value && target instanceof Node && notificationMenuRef.value.contains(target)) return
      if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
      showNotificationsPanel.value = false
      isAccountMenuOpen.value = false
    }

    const handleAccountMenuClickOutside = (event) => {
      handleHeaderMenusClickOutside(event)
    }

    const formatNumber = (num) => new Intl.NumberFormat().format(num)
    const formatActivityMeta = (value, prefix = 'Updated') => {
      if (!value) return prefix
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return prefix
      return `${prefix} ${new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(parsed)}`
    }
    const resolveApiBaseUrl = () => {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      if (configured.endsWith('/api')) return configured
      return `${configured}/api`
    }

    const getAuthConfig = () => ({
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })

    const uniqueBy = (items, keyResolver) => {
      const seen = new Set()
      return (Array.isArray(items) ? items : []).filter((item, index) => {
        const key = String(keyResolver(item, index) || '').trim()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    const fetchTeacherData = async () => {
      try {
        const authUser = authStore.user || {}
        teacher.name = authUser.name || authUser.username || 'Teacher'
      teacher.displayName = authUser.name || authUser.displayName || authUser.username || 'Teacher'
      teacher.strand = authUser.strand || authUser.profile?.strand || ''
      teacher.status = authUser.status || 'Online'
        teacher.email = authUser.email || ''
      } catch (error) {
        console.error('Failed to fetch teacher data:', error)
      }
    }

    const fetchStudents = async () => {
      try {
        if (!authStore.token) {
          students.value = []
          return
        }

        const response = await axios.get(`${resolveApiBaseUrl()}/teacher/students`, getAuthConfig())
        const payload = uniqueBy(
          Array.isArray(response.data?.students) ? response.data.students : [],
          (student, index) => student.id || student._id || `${student.email || ''}-${index}`
        )

        students.value = payload.map((student, index) => ({
          id: student.id || student._id || `student-${index + 1}`,
          name: student.name || 'Unknown Student',
          email: student.email || 'N/A',
          completedChallenges: Number(student.completedChallenges || 0),
          totalChallenges: Number(student.totalChallenges || 0),
          progress: Number(student.progress || 0),
          averageScore: Number(student.averageScore || 0),
          status: String(student.status || 'inactive').toLowerCase(),
          avatar: student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=334155&color=fff`
        }))
      } catch (error) {
        console.error('Failed to fetch students:', error)
        students.value = []
      }
    }

    const fetchStats = async () => {
      try {
        if (!authStore.token) {
          stats.totalStudents = 0
          stats.totalActivitiesCreated = 0
          stats.completedAssessments = 0
          stats.totalLessons = 0
          stats.totalAssessments = 0
          calendarLessons.value = []
          calendarAssessments.value = []
          calendarCompletedAssessments.value = []
          return
        }

        const [subjectsResponse, lessonsResponse, assessmentsResponse, resultsResponse] = await Promise.all([
          axios.get(`${resolveApiBaseUrl()}/teacher/subjects`, getAuthConfig()),
          axios.get(`${resolveApiBaseUrl()}/teacher/lessons`, getAuthConfig()),
          axios.get(`${resolveApiBaseUrl()}/teacher/assessments`, getAuthConfig()),
          axios.get(`${resolveApiBaseUrl()}/teacher/students/assessment-results?sort=recent`, getAuthConfig()).catch(() => ({ data: { results: [] } }))
        ])

        const subjects = uniqueBy(
          Array.isArray(subjectsResponse.data?.subjects) ? subjectsResponse.data.subjects : [],
          (subject, index) => subject.id || subject._id || `${subject.name || ''}-${index}`
        )
        const lessons = uniqueBy(
          Array.isArray(lessonsResponse.data?.lessons) ? lessonsResponse.data.lessons : [],
          (lesson, index) => lesson.id || lesson._id || `${lesson.title || ''}-${lesson.createdAt || ''}-${index}`
        )
        const assessments = uniqueBy(
          Array.isArray(assessmentsResponse.data?.assessments) ? assessmentsResponse.data.assessments : [],
          (assessment, index) => assessment.id || assessment._id || `${assessment.title || ''}-${assessment.createdAt || ''}-${index}`
        )
        stats.totalStudents = students.value.length
        stats.totalActivitiesCreated = assessments.length
        stats.completedAssessments = students.value.reduce((sum, student) => sum + Number(student.completedChallenges || 0), 0)
        stats.totalLessons = lessons.length
        stats.totalAssessments = assessments.length

        calendarLessons.value = lessons.map((lesson, index) => ({
          id: lesson.id || lesson._id || `lesson-${index + 1}`,
          title: lesson.title || 'Lesson',
          postedAt: lesson.postedAt || lesson.createdAt || lesson.updatedAt || null,
          createdAt: lesson.createdAt || lesson.postedAt || lesson.updatedAt || null
        }))

        calendarAssessments.value = assessments
          .filter((assessment) => Boolean(assessment?.submissionDeadline))
          .map((assessment, index) => ({
            id: assessment.id || assessment._id || `assessment-${index + 1}`,
            title: assessment.title || 'Assessment',
            submissionDeadline: assessment.submissionDeadline
          }))

        calendarCompletedAssessments.value = uniqueBy(
          Array.isArray(resultsResponse.data?.results) ? resultsResponse.data.results : [],
          (result, index) => result.id || `${result.studentId || ''}-${result.assessmentId || ''}-${result.submittedAt || index}`
        )
          .filter((result) => Boolean(result?.submittedAt))
          .map((result, index) => ({
            id: result.id || `completed-result-${index + 1}`,
            assessmentId: result.assessmentId || '',
            assessmentTitle: result.assessmentTitle || 'Completed assessment',
            studentId: result.studentId || '',
            studentName: result.studentName || 'Student',
            submittedAt: result.submittedAt
          }))

      } catch (error) {
        console.error('Failed to fetch stats:', error)
        stats.totalStudents = students.value.length
        stats.totalActivitiesCreated = 0
        stats.completedAssessments = students.value.reduce((sum, student) => sum + Number(student.completedChallenges || 0), 0)
        stats.totalLessons = 0
        stats.totalAssessments = 0
        calendarLessons.value = []
        calendarAssessments.value = []
        calendarCompletedAssessments.value = []
      }
    }

    const fetchNotifications = async () => {
      try {
        const lessonLogs = calendarLessons.value
          .slice()
          .map((lesson, index) => ({
            id: `lesson-log-${lesson.id || index}`,
            message: lesson.title || 'Untitled lesson',
            meta: formatActivityMeta(lesson.postedAt || lesson.createdAt, 'Published'),
            label: 'Lesson',
            icon: 'fas fa-book-open',
            tone: 'lesson',
            timestamp: new Date(lesson.postedAt || lesson.createdAt || 0).getTime()
          }))

        const assessmentLogs = calendarAssessments.value
          .slice()
          .map((assessment, index) => ({
            id: `assessment-log-${assessment.id || index}`,
            message: assessment.title || 'Untitled assessment',
            meta: formatActivityMeta(assessment.submissionDeadline, 'Deadline'),
            label: 'Deadline',
            icon: 'fas fa-clipboard-check',
            tone: 'assessment',
            timestamp: new Date(assessment.submissionDeadline || 0).getTime()
          }))

        activityNotifications.value = [...lessonLogs, ...assessmentLogs]
          .sort((left, right) => {
            const rightTime = Number.isFinite(right.timestamp) ? right.timestamp : 0
            const leftTime = Number.isFinite(left.timestamp) ? left.timestamp : 0
            return rightTime - leftTime
          })
          .slice(0, 6)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        activityNotifications.value = []
      }
    }

    const refreshActivityFeed = async () => {
      isActivityRefreshing.value = true
      try {
        await fetchStats()
        await fetchNotifications()
      } finally {
        isActivityRefreshing.value = false
      }
    }

    watch(
      () => isSidebarOpen.value,
      async () => {
        syncMobileMenuBodyState()
        if (isTourActive.value) {
          await nextTick()
          updateTourPlacement()
        }
      }
    )

    onMounted(() => {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('click', handleAccountMenuClickOutside)
      window.addEventListener('resize', handleTourViewportChange)
      window.addEventListener('scroll', handleTourViewportChange, true)
      window.addEventListener('resize', syncMobileMenuBodyState)

      void authStore.refreshProfile().then(fetchTeacherData).catch((error) => {
        console.error('Failed to refresh teacher profile:', error)
      })
      fetchTeacherData()
      Promise.resolve(fetchStudents())
        .then(() => refreshActivityFeed())
        .catch((error) => {
          console.error('Failed to load teacher dashboard data:', error)
        })
      maybeAutoStartTour()
      syncMobileMenuBodyState()
    })

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('click', handleAccountMenuClickOutside)
      window.removeEventListener('resize', handleTourViewportChange)
      window.removeEventListener('scroll', handleTourViewportChange, true)
      window.removeEventListener('resize', syncMobileMenuBodyState)
      closeTour({ markSeen: false })
      document.body.classList.remove('teacher-tour-open')
      document.body.classList.remove('teacher-mobile-menu-open')
    })

    return {
      isSidebarOpen,
      showNotificationsPanel,
      isAccountMenuOpen,
      accountMenuRef,
      notificationMenuRef,
      teacher,
      stats,
      summaryCards,
      activityNotifications,
      isActivityRefreshing,
      messageNotifications,
      unreadNotificationCount,
      isNotificationsLoading,
      students,
      weekDays,
      calendarTitle,
      calendarCells,
      calendarEventFilters,
      calendarFilterOptions,
      visibleCalendarFilterCount,
      areAllCalendarFiltersEnabled,
      displayName,
      teacherFullName,
      teacherRole,
      teacherStrand,
      teacherStatus,
      teacherAvatarUrl,
      isActiveRoute,
      isActivitiesRouteActive,
      isActivitiesMenuOpen,
      isActivitiesSubRouteActive,
      buildActivitiesTabRoute,
      toggleActivitiesMenu,
      isRecordsRouteActive,
      isRecordsMenuOpen,
      isRecordsSubRouteActive,
      buildRecordsTabRoute,
      toggleRecordsMenu,
      toggleSidebar,
      closeSidebar,
      toggleNotificationsPanel,
      closeNotificationsPanel,
      goToPreviousMonth,
      goToNextMonth,
      goToCurrentMonth,
      toggleCalendarEventFilter,
      showAllCalendarEvents,
      refreshActivityFeed,
      handleLogout,
      toggleAccountMenu,
      goToProfile,
      goToSettings,
      formatNumber,
      isTourActive,
      tourSteps,
      tourStepIndex,
      activeTourStep,
      isLastTourStep,
      isFirstTourStep,
      isFinalTourStep,
      tourTooltipStyle,
      tourSpotlightStyle,
      launchManualTour,
      goToNextTourStep,
      goToPreviousTourStep,
      skipTour
    }
  }
}
</script>

<style scoped>
@reference "../../styles/tailwind.css";

.notification-menu {
  @apply tw:relative;
}

.notification-dropdown {
  @apply tw:absolute;
  @apply tw:[top:calc(100%_+_0.75rem)];
  @apply tw:[right:0];
  @apply tw:[width:min(92vw,_460px)];
  @apply tw:[max-height:min(70vh,_560px)];
  @apply tw:overflow-y-auto;
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f9fbff_100%)];
  @apply tw:[border:1px_solid_#dbe4f1];
  @apply tw:[border-radius:20px];
  @apply tw:[box-shadow:0_24px_48px_rgba(15,_23,_42,_0.16)];
  @apply tw:[padding:0.95rem];
  @apply tw:[z-index:1200];
  @apply tw:opacity-100!;
  @apply tw:visible!;
  @apply tw:[transform:translateY(0)]!;
}

.notification-dropdown-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-bottom:0.9rem];
}

.notification-dropdown-actions {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:flex-none;
  @apply tw:whitespace-nowrap;
}

.notification-dropdown-clear {
  @apply tw:[border:1px_solid_#d7dfec];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:[min-height:36px];
  @apply tw:[padding:0.45rem_0.8rem];
  @apply tw:[border-radius:12px];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
  @apply tw:[box-shadow:0_1px_2px_rgba(15,_23,_42,_0.04)];
}

.notification-dropdown-clear:hover:not(:disabled) {
  @apply tw:[background:#f8fafc];
}

.notification-dropdown-clear:disabled {
  @apply tw:[opacity:0.55];
  @apply tw:cursor-not-allowed;
}

.notification-dropdown-header h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.02rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:-0.01em];
  @apply tw:[min-width:0];
  @apply tw:flex-auto;
}

.notification-dropdown-close {
  @apply tw:[border:1px_solid_#d7dfec];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:[width:36px];
  @apply tw:[height:36px];
  @apply tw:[border-radius:12px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:cursor-pointer;
  @apply tw:[box-shadow:0_1px_2px_rgba(15,_23,_42,_0.04)];
  @apply tw:[flex:0_0_36px];
}

.notification-dropdown-clear,
.notification-dropdown-close {
  @apply tw:shrink-0;
}

.notification-dropdown-clear {
  @apply tw:[min-width:max-content];
  @apply tw:whitespace-nowrap;
  @apply tw:w-auto!;
  @apply tw:[height:36px]!;
}

.notification-dropdown .notification-dropdown-clear,
.notification-dropdown .notification-dropdown-close {
  @apply tw:[min-width:unset];
}

.notification-dropdown .notification-dropdown-clear {
  @apply tw:w-auto!;
  @apply tw:[min-width:max-content]!;
  @apply tw:[padding-inline:0.8rem]!;
  @apply tw:overflow-visible!;
  @apply tw:text-clip!;
}

.notification-dropdown .notification-dropdown-close {
  @apply tw:[width:36px]!;
  @apply tw:[min-width:36px]!;
  @apply tw:[height:36px]!;
}

.notification-dropdown-close:hover {
  @apply tw:[background:#f8fafc];
}

.kpi-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.dashboard-kpi-grid {
  @apply tw:[margin-bottom:1.5rem];
}

.kpi-card {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.75rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.52)];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#ffffff];
  @apply tw:[min-height:124px];
  @apply tw:[box-shadow:0_14px_28px_rgba(30,_67,_7,_0.06)];
}

.kpi-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:12px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[font-size:1rem];
}

.kpi-icon.students,
.kpi-icon.lessons,
.kpi-icon.classes,
.kpi-icon.assessments {
  @apply tw:[background:#edf7e7];
  @apply tw:[color:#2f6810];
}

.kpi-content {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[min-width:0];
}

.kpi-label {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:600];
}

.kpi-value {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.12rem];
  @apply tw:[line-height:1.2];
}

.kpi-note {
  @apply tw:[margin-top:0.35rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.75rem];
  @apply tw:[line-height:1.35];
}

.dashboard-layout {
  @apply tw:[align-items:start];
  @apply tw:[grid-template-columns:minmax(0,_1fr)]!;
  @apply tw:[margin-top:1.15rem];
}

.dashboard-layout > .content-column {
  @apply tw:[min-width:0];
}

.panel-card {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[box-shadow:0_4px_14px_rgba(15,_23,_42,_0.05)];
}

.calendar-card {
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#ffffff_100%)_padding-box,______linear-gradient(135deg,_#8bc66a_0%,_#d8edcc_48%,_#a9d58f_100%)_border-box];
  @apply tw:[box-shadow:0_8px_22px_rgba(15,_23,_42,_0.08)];
  @apply tw:[padding:1rem_1.05rem];
  @apply tw:[margin-bottom:1rem];
}

.calendar-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-bottom:0.85rem];
}

.calendar-kicker {
  @apply tw:[margin:0];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:600];
  @apply tw:[color:#5b9b3c];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.calendar-title {
  @apply tw:[margin:0.18rem_0_0];
  @apply tw:[font-size:1.2rem];
  @apply tw:[font-weight:700];
  @apply tw:[color:#0f172a];
}

.calendar-controls {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
}

.calendar-nav-btn,
.calendar-today-btn {
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:[border-radius:10px];
  @apply tw:[height:34px];
  @apply tw:[min-width:34px];
  @apply tw:[padding:0_0.65rem];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:600];
  @apply tw:cursor-pointer;
  @apply tw:[transition:all_0.2s_ease];
}

.calendar-nav-btn:hover,
.calendar-today-btn:hover {
  @apply tw:[border-color:#a9d295];
  @apply tw:[background:#f2f9ee];
}

.calendar-today-btn {
  @apply tw:[border-color:#b9dca7];
  @apply tw:[background:#eef8e9];
  @apply tw:[color:#4f8f2f];
}

.calendar-filters {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:flex-wrap;
  @apply tw:[margin-bottom:0.85rem];
}

.calendar-filter-label {
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[color:#64748b];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.calendar-filter-btn {
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:[border-radius:999px];
  @apply tw:[min-height:34px];
  @apply tw:[padding:0_0.8rem];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.42rem];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
  @apply tw:[transition:border-color_0.2s_ease,_background-color_0.2s_ease,_color_0.2s_ease,_box-shadow_0.2s_ease,_transform_0.2s_ease];
}

.calendar-filter-btn i {
  @apply tw:text-current!;
}

.calendar-filter-btn.is-all {
  @apply tw:[background:#eef8e9];
  @apply tw:[border-color:#b9dca7];
  @apply tw:[color:#4f8f2f];
}

.calendar-filter-btn.is-lesson {
  @apply tw:[background:#eff6ff];
  @apply tw:[border-color:#bfdbfe];
  @apply tw:[color:#1d4ed8];
}

.calendar-filter-btn.is-deadline {
  @apply tw:[background:#fffbeb];
  @apply tw:[border-color:#fde68a];
  @apply tw:[color:#b45309];
}

.calendar-filter-btn.is-completed {
  @apply tw:[background:#f0fdf4];
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[color:#15803d];
}

.calendar-filter-btn:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[filter:brightness(0.98)];
}

.calendar-filter-btn.active {
  @apply tw:[box-shadow:0_10px_18px_rgba(15,_23,_42,_0.08)];
  @apply tw:[transform:translateY(-1px)];
}

.calendar-filter-note {
  @apply tw:[margin:-0.1rem_0_0.8rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.45];
}

.calendar-scroll-hint {
  @apply tw:hidden;
}

.calendar-scroll-area {
  @apply tw:max-w-full;
  @apply tw:overflow-x-auto;
  @apply tw:overflow-y-hidden;
  @apply tw:[border-radius:12px];
  @apply tw:[overscroll-behavior-inline:contain];
  @apply tw:[scrollbar-width:thin];
  @apply tw:[scrollbar-color:#b9dca7_transparent];
  @apply tw:[-webkit-overflow-scrolling:touch];
}

.calendar-scroll-area:focus-visible {
  @apply tw:[outline:3px_solid_rgba(105,_170,_71,_0.22)];
  @apply tw:[outline-offset:3px];
}

.calendar-scroll-content {
  @apply tw:[min-width:0];
}

.calendar-weekdays {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(7,_minmax(0,_1fr))];
  @apply tw:[gap:0.45rem];
  @apply tw:[margin-bottom:0.45rem];
}

.calendar-weekdays span {
  @apply tw:text-center;
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:600];
  @apply tw:[color:#64748b];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.04em];
}

.calendar-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(7,_minmax(0,_1fr))];
  @apply tw:[gap:0.45rem];
}

.calendar-day {
  @apply tw:[min-height:92px];
  @apply tw:[border-radius:12px];
  @apply tw:[border:1px_solid_#edf2f7];
  @apply tw:[background:#ffffff];
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[padding:0.5rem];
  @apply tw:relative;
}

.calendar-day.is-empty {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-style:dashed];
}

.calendar-day.has-events {
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[background:#f8fbff];
}

.calendar-day.is-today {
  @apply tw:[border-color:#8fbd76];
  @apply tw:[background:#f7fbf4];
  @apply tw:[box-shadow:inset_0_0_0_1px_#8fbd76];
}

.calendar-day.is-today .day-number {
  @apply tw:[color:#4f8f2f];
  @apply tw:[font-weight:800];
}

.day-number {
  @apply tw:[font-size:0.84rem];
  @apply tw:[font-weight:600];
  @apply tw:[color:#0f172a];
}

.day-dot {
  @apply tw:[width:7px];
  @apply tw:[height:7px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#334155];
  @apply tw:[margin-top:0.2rem];
}

.day-dot.is-lesson {
  @apply tw:[background:#334155];
}

.day-dot.is-deadline {
  @apply tw:[background:#d97706];
}

.day-dot.is-completed {
  @apply tw:[background:#16a34a];
}

.day-events {
  @apply tw:absolute;
  @apply tw:[left:0.45rem];
  @apply tw:[right:0.45rem];
  @apply tw:[bottom:0.35rem];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.2rem];
}

.day-event-pill {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.35rem];
  @apply tw:w-full;
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[border-radius:8px];
  @apply tw:[background:#f8fbff];
  @apply tw:[padding:0.15rem_0.32rem];
  @apply tw:[font-size:0.62rem];
  @apply tw:[line-height:1.2];
  @apply tw:[color:#334155];
}

.day-event-pill.is-lesson {
  @apply tw:[border-color:#dbe2ea];
  @apply tw:[background:#f8fbff];
  @apply tw:[color:#334155];
}

.day-event-pill.is-deadline {
  @apply tw:[border-color:#fde68a];
  @apply tw:[background:#fffbeb];
  @apply tw:[color:#92400e];
}

.day-event-pill.is-completed {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
}

.event-title {
  @apply tw:overflow-hidden;
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
  @apply tw:[max-width:70%];
  @apply tw:[font-weight:600];
}

.event-time {
  @apply tw:[font-size:0.58rem];
  @apply tw:[color:#64748b];
  @apply tw:whitespace-nowrap;
}

.day-event-more {
  @apply tw:[font-size:0.58rem];
  @apply tw:[color:#64748b];
  @apply tw:[padding-left:0.1rem];
}

.calendar-legend {
  @apply tw:[margin-top:0.7rem];
  @apply tw:[font-size:0.78rem];
  @apply tw:[color:#64748b];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.9rem];
  @apply tw:flex-wrap;
}

.calendar-legend span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.28rem];
  @apply tw:[padding:0.38rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[background:#ffffff];
  @apply tw:[font-weight:700];
}

.calendar-legend i {
  @apply tw:[font-size:0.5rem];
  @apply tw:text-current;
}

.calendar-legend .is-lesson {
  @apply tw:[background:#eff6ff];
  @apply tw:[border-color:#bfdbfe];
  @apply tw:[color:#1d4ed8];
}

.calendar-legend .is-deadline {
  @apply tw:[background:#fffbeb];
  @apply tw:[border-color:#fde68a];
  @apply tw:[color:#b45309];
}

.calendar-legend .is-completed {
  @apply tw:[background:#f0fdf4];
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[color:#15803d];
}

.teacher-notifications {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)];
  @apply tw:[box-shadow:0_12px_28px_rgba(15,_23,_42,_0.08)];
  @apply tw:[padding:1rem_1.05rem];
}

.teacher-activity-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1rem];
}

.teacher-activity-copy {
  @apply tw:[min-width:0];
}

.teacher-activity-kicker {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.42rem];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[color:#1d4ed8];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

.teacher-activity-kicker::before {
  @apply tw:[content:''];
  @apply tw:[width:8px];
  @apply tw:[height:8px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:linear-gradient(135deg,_#60a5fa,_#2563eb)];
  @apply tw:[box-shadow:0_0_0_4px_rgba(96,_165,_250,_0.14)];
}

.teacher-activity-subtitle {
  @apply tw:[margin:0.38rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.9rem];
  @apply tw:[line-height:1.45];
  @apply tw:[max-width:38rem];
}

.teacher-activity-actions {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-end;
  @apply tw:[gap:0.65rem];
  @apply tw:flex-wrap;
}

.teacher-activity-status {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:0.48rem_0.8rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#dbeafe];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}

.teacher-activity-status.is-empty {
  @apply tw:[border-color:#e2e8f0];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
}

.teacher-activity-refresh {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.48rem];
  @apply tw:[min-height:38px];
  @apply tw:[border-radius:12px];
  @apply tw:[font-weight:700];
  @apply tw:[box-shadow:0_8px_18px_rgba(15,_23,_42,_0.05)];
}

.teacher-activity-refresh:disabled {
  @apply tw:[opacity:0.7];
  @apply tw:cursor-not-allowed;
  @apply tw:transform-none;
}

.teacher-activity-empty {
  @apply tw:relative;
  @apply tw:overflow-hidden;
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[padding:1.2rem];
  @apply tw:[border:1px_dashed_#dbe4f1];
  @apply tw:[border-radius:18px];
  @apply tw:[background:radial-gradient(circle_at_top,_rgba(59,_130,_246,_0.1),_transparent_44%),______linear-gradient(180deg,_#f8fbff_0%,_#ffffff_100%)];
}

.teacher-activity-empty::after {
  @apply tw:[content:''];
  @apply tw:absolute;
  @apply tw:[inset:auto_-32px_-44px_auto];
  @apply tw:[width:160px];
  @apply tw:[height:160px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:radial-gradient(circle,_rgba(148,_163,_184,_0.18),_rgba(148,_163,_184,_0))];
  @apply tw:pointer-events-none;
}

.teacher-activity-empty-visual {
  @apply tw:relative;
  @apply tw:[width:74px];
  @apply tw:[height:74px];
}

.teacher-activity-empty-glow {
  @apply tw:absolute;
  @apply tw:[inset:10px];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(135deg,_rgba(59,_130,_246,_0.2),_rgba(148,_163,_184,_0.08))];
  @apply tw:[filter:blur(4px)];
}

.teacher-activity-empty-icon {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:[width:74px];
  @apply tw:[height:74px];
  @apply tw:[border-radius:22px];
  @apply tw:[border:1px_solid_#dbeafe];
  @apply tw:[background:linear-gradient(135deg,_#ffffff_0%,_#eff6ff_100%)];
  @apply tw:[box-shadow:0_16px_28px_rgba(37,_99,_235,_0.14)];
  @apply tw:[color:#2563eb];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[font-size:1.4rem];
}

.teacher-activity-empty.is-loading .teacher-activity-empty-icon {
  @apply tw:[animation:activityPulse_1.5s_ease-in-out_infinite];
}

.teacher-activity-empty-copy {
  @apply tw:relative;
  @apply tw:[z-index:1];
}

.teacher-activity-empty-title {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.02rem];
  @apply tw:[font-weight:800];
}

.teacher-activity-empty-copy .empty-subtext {
  @apply tw:[margin-top:0.45rem];
  @apply tw:[max-width:36rem];
  @apply tw:[line-height:1.5];
}

.teacher-activity-empty-tags {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.55rem];
}

.teacher-activity-tag {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[padding:0.38rem_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#dbe4f1];
  @apply tw:[background:rgba(255,_255,_255,_0.92)];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
}

.teacher-activity-list {
  @apply tw:grid;
  @apply tw:[gap:0.78rem];
}

.teacher-activity-item {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.82rem];
  @apply tw:[padding:0.95rem];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:rgba(255,_255,_255,_0.94)];
  @apply tw:[box-shadow:0_6px_18px_rgba(15,_23,_42,_0.04)];
  @apply tw:[transition:transform_0.18s_ease,_box-shadow_0.18s_ease,_border-color_0.18s_ease];
}

.teacher-activity-item:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[box-shadow:0_12px_28px_rgba(15,_23,_42,_0.08)];
}

.teacher-activity-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:shrink-0;
  @apply tw:[font-size:1rem];
}

.teacher-activity-icon.is-lesson {
  @apply tw:[background:#ecfeff];
  @apply tw:[color:#0f766e];
}

.teacher-activity-icon.is-assessment {
  @apply tw:[background:#eef2ff];
  @apply tw:[color:#4338ca];
}

.teacher-activity-content {
  @apply tw:[min-width:0];
  @apply tw:[flex:1];
}

.teacher-activity-item-top {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.teacher-activity-item-title {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.95rem];
  @apply tw:[line-height:1.4];
}

.teacher-activity-item-meta {
  @apply tw:[margin:0.34rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.45];
}

.teacher-activity-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[padding:0.3rem_0.6rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
  @apply tw:[border:1px_solid_transparent];
}

.teacher-activity-pill.is-lesson {
  @apply tw:[border-color:#bae6fd];
  @apply tw:[background:#f0fdfa];
  @apply tw:[color:#0f766e];
}

.teacher-activity-pill.is-assessment {
  @apply tw:[border-color:#c7d2fe];
  @apply tw:[background:#eef2ff];
  @apply tw:[color:#4338ca];
}

@keyframes activityPulse {
  0%, 100% {
    transform: translateY(0);
    box-shadow: 0 16px 28px rgba(37, 99, 235, 0.14);
  }
  50% {
    transform: translateY(-2px);
    box-shadow: 0 20px 34px rgba(37, 99, 235, 0.22);
  }
}

.performance-table {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:overflow-hidden;
  @apply tw:[background:#fff];
}

.table-header {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
}

.table-row {
  @apply tw:[border-bottom:1px_solid_#eef2f7];
}

.table-row:last-child {
  @apply tw:[border-bottom:none];
}

.table-row:hover {
  @apply tw:[background:#f8fafc];
}

@media (max-width: 1100px) {
  .kpi-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }
}

@media (max-width: 768px) {
  .notification-dropdown {
    @apply tw:[right:-0.35rem];
    @apply tw:[width:min(340px,_calc(100vw_-_1rem))];
  }

  .kpi-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .dashboard-layout {
    @apply tw:[margin-top:0.9rem];
  }

  .teacher-activity-header {
    @apply tw:flex-col;
    @apply tw:items-stretch;
  }

  .teacher-activity-actions {
    @apply tw:justify-between;
  }

  .teacher-activity-refresh {
    @apply tw:justify-center;
  }

  .calendar-header {
    @apply tw:items-center;
    @apply tw:[margin-bottom:0.7rem];
  }

  .calendar-filters {
    @apply tw:w-full;
    @apply tw:flex-nowrap;
    @apply tw:overflow-x-auto;
    @apply tw:[padding:0.1rem_0_0.45rem];
    @apply tw:[margin-bottom:0.5rem];
    @apply tw:[overscroll-behavior-inline:contain];
    @apply tw:[scrollbar-width:none];
    @apply tw:[-webkit-overflow-scrolling:touch];
  }

  .calendar-filters::-webkit-scrollbar,
  .calendar-legend::-webkit-scrollbar {
    @apply tw:hidden;
  }

  .calendar-filter-btn {
    @apply tw:flex-none;
    @apply tw:[min-height:40px];
    @apply tw:[padding-inline:0.85rem];
  }

  .calendar-controls {
    @apply tw:flex-none;
  }

  .calendar-nav-btn,
  .calendar-today-btn {
    @apply tw:[min-width:42px];
    @apply tw:[height:42px];
  }

  .calendar-today-btn {
    @apply tw:[min-width:68px];
  }

  .calendar-scroll-hint {
    @apply tw:flex;
    @apply tw:items-center;
    @apply tw:justify-end;
    @apply tw:[gap:0.35rem];
    @apply tw:[margin:0_0_0.45rem];
    @apply tw:[color:#6b7f61];
    @apply tw:[font-size:0.7rem];
    @apply tw:[font-weight:700];
  }

  .calendar-scroll-area {
    @apply tw:[margin-inline:-0.15rem];
    @apply tw:[padding:0.15rem_0.15rem_0.45rem];
  }

  .calendar-scroll-content {
    @apply tw:[min-width:620px];
  }

  .calendar-day {
    @apply tw:[min-height:86px];
    @apply tw:[padding:0.42rem];
  }

  .calendar-weekdays,
  .calendar-grid {
    @apply tw:[gap:0.35rem];
  }

  .calendar-legend {
    @apply tw:flex-nowrap;
    @apply tw:overflow-x-auto;
    @apply tw:[padding-bottom:0.2rem];
    @apply tw:[scrollbar-width:none];
    @apply tw:[-webkit-overflow-scrolling:touch];
  }

  .calendar-legend span {
    @apply tw:flex-none;
  }

  .teacher-activity-item {
    @apply tw:[padding:0.85rem];
  }

  .teacher-activity-item-top {
    @apply tw:flex-col;
    @apply tw:[gap:0.45rem];
  }

}

@media (max-width: 560px) {
  .kpi-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .teacher-activity-actions {
    @apply tw:flex-col;
    @apply tw:items-stretch;
  }

  .calendar-title {
    @apply tw:[font-size:1.05rem];
  }

  .calendar-kicker {
    @apply tw:[font-size:0.66rem];
  }

  .calendar-controls {
    @apply tw:[gap:0.25rem];
  }

  .calendar-nav-btn,
  .calendar-today-btn {
    @apply tw:[min-width:40px];
    @apply tw:[height:40px];
    @apply tw:[padding-inline:0.5rem];
  }

  .calendar-today-btn {
    @apply tw:[min-width:60px];
  }

  .calendar-filter-label {
    @apply tw:hidden;
  }

  .calendar-filter-btn {
    @apply tw:[min-height:38px];
    @apply tw:[padding-inline:0.7rem];
    @apply tw:[font-size:0.73rem];
  }

  .calendar-scroll-content {
    @apply tw:[min-width:560px];
  }

  .calendar-day {
    @apply tw:[min-height:78px];
  }

  .day-event-pill {
    @apply tw:[font-size:0.58rem];
  }

  .day-event-pill .event-time {
    @apply tw:hidden;
  }

  .day-event-pill .event-title {
    @apply tw:max-w-full;
  }

  .teacher-activity-status,
  .teacher-activity-refresh {
    @apply tw:w-full;
    @apply tw:justify-center;
  }

  .teacher-activity-empty {
    @apply tw:[padding:1rem];
  }
}

.teacher-tour-layer {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:12000];
  @apply tw:pointer-events-none;
}

.teacher-tour-backdrop {
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[background:rgba(15,_23,_42,_0.58)];
}

.teacher-tour-spotlight {
  @apply tw:fixed;
  @apply tw:[z-index:12001];
  @apply tw:[border-radius:16px];
  @apply tw:[box-shadow:0_0_0_9999px_rgba(15,_23,_42,_0.58)];
  @apply tw:[border:2px_solid_rgba(255,_255,_255,_0.95)];
  @apply tw:[transition:top_0.24s_ease,_left_0.24s_ease,_width_0.24s_ease,_height_0.24s_ease];
  @apply tw:pointer-events-none;
}

.teacher-tour-tooltip {
  @apply tw:fixed;
  @apply tw:[z-index:12002];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[box-shadow:0_14px_32px_rgba(15,_23,_42,_0.22)];
  @apply tw:[padding:1rem_1.1rem];
  @apply tw:pointer-events-auto;
  @apply tw:[transition:left_0.24s_ease,_top_0.24s_ease,_width_0.24s_ease];
  @apply tw:[max-height:min(70vh,_calc(100vh_-_24px))];
  @apply tw:overflow-y-auto;
  @apply tw:[-webkit-overflow-scrolling:touch];
}

.teacher-tour-step {
  @apply tw:[margin:0_0_0.35rem];
  @apply tw:[font-size:0.72rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-weight:600];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.teacher-tour-tooltip h3 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.05rem];
  @apply tw:[line-height:1.25];
  @apply tw:[font-weight:700];
}

.teacher-tour-tooltip p {
  @apply tw:[margin:0.5rem_0_0];
  @apply tw:[font-size:0.9rem];
  @apply tw:[color:#475569];
  @apply tw:[line-height:1.45];
}

.teacher-tour-actions {
  @apply tw:[margin-top:1rem];
  @apply tw:flex;
  @apply tw:[gap:0.55rem];
  @apply tw:justify-end;
  @apply tw:flex-wrap;
}

.teacher-tour-btn {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
  @apply tw:[min-height:40px];
  @apply tw:[min-width:88px];
  @apply tw:[padding:0.45rem_0.92rem];
  @apply tw:cursor-pointer;
  @apply tw:[transition:background-color_0.18s_ease,_border-color_0.18s_ease,_color_0.18s_ease,_transform_0.18s_ease];
}

.teacher-tour-btn:disabled {
  @apply tw:[opacity:0.5];
  @apply tw:cursor-not-allowed;
}

.teacher-tour-btn-ghost {
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
}

.teacher-tour-btn-ghost:hover:not(:disabled) {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-color:#94a3b8];
}

.teacher-tour-btn-primary {
  @apply tw:[border-color:#0f172a];
  @apply tw:[background:#0f172a];
  @apply tw:[color:#ffffff];
}

.teacher-tour-btn-primary:hover {
  @apply tw:[background:#1e293b];
  @apply tw:[border-color:#1e293b];
  @apply tw:[transform:translateY(-1px)];
}

.header-tour-btn {
  @apply tw:cursor-pointer;
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[border-radius:12px];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[transition:all_0.2s_ease];
}

.header-tour-btn:hover {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[transform:translateY(-1px)];
}

@media (max-width: 768px) {
  .notification-dropdown {
    @apply tw:fixed;
    @apply tw:[top:78px];
    @apply tw:[right:12px];
    @apply tw:[left:12px];
    @apply tw:w-auto;
    @apply tw:[max-height:calc(100vh_-_96px)];
  }

  .teacher-tour-tooltip {
    @apply tw:[max-width:calc(100vw_-_16px)];
    @apply tw:[border-radius:14px];
    @apply tw:[padding:0.8rem_0.82rem];
  }

  .teacher-tour-actions {
    @apply tw:grid;
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
    @apply tw:[gap:0.5rem];
  }

  .teacher-tour-btn {
    @apply tw:w-full;
    @apply tw:[min-height:42px];
    @apply tw:[font-size:0.84rem];
    @apply tw:[padding:0.5rem_0.65rem];
  }

  .teacher-tour-btn-primary {
    @apply tw:[grid-column:1_/_-1];
  }

  .teacher-tour-tooltip h3 {
    @apply tw:[font-size:0.98rem];
    @apply tw:[line-height:1.24];
  }

  .teacher-tour-tooltip p {
    @apply tw:[font-size:0.84rem];
    @apply tw:[line-height:1.38];
  }
}

@media (max-width: 480px) {
  .teacher-tour-spotlight {
    @apply tw:[border-radius:12px];
    @apply tw:[border-width:1.5px];
  }

  .teacher-tour-tooltip {
    @apply tw:[border-radius:12px];
    @apply tw:[padding:0.72rem_0.72rem];
  }

  .teacher-tour-step {
    @apply tw:[font-size:0.66rem];
  }

  .teacher-tour-tooltip h3 {
    @apply tw:[font-size:0.92rem];
  }

  .teacher-tour-tooltip p {
    @apply tw:[font-size:0.8rem];
  }
}

/* Compact desktop overview designed to fit without page-level scrolling. */
@media (min-width: 900px) {
  .teacher-main > .top-header {
    @apply tw:[margin-bottom:1.15rem]!;
    @apply tw:[padding:0.75rem_0.9rem]!;
  }

  .teacher-main > .top-header .header-left h1 {
    @apply tw:[font-size:1.4rem];
  }

  .teacher-main > .top-header .header-subtitle {
    @apply tw:hidden;
  }

  .kpi-grid {
    @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
    @apply tw:[gap:0.5rem];
  }

  .dashboard-kpi-grid {
    @apply tw:[margin-bottom:0.6rem];
  }

  .kpi-card {
    @apply tw:[min-height:64px];
    @apply tw:items-center;
    @apply tw:[gap:0.5rem];
    @apply tw:[padding:0.55rem_0.65rem];
    @apply tw:[border-radius:12px];
  }

  .kpi-icon {
    @apply tw:[width:36px];
    @apply tw:[height:36px];
    @apply tw:[flex:0_0_36px];
    @apply tw:[border-radius:10px];
    @apply tw:[font-size:0.88rem];
  }

  .kpi-content {
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(0,_1fr)_auto];
    @apply tw:items-center;
    @apply tw:[gap:0.35rem];
    @apply tw:w-full;
  }

  .kpi-label {
    @apply tw:overflow-hidden;
    @apply tw:[font-size:0.74rem];
    @apply tw:text-ellipsis;
    @apply tw:whitespace-nowrap;
  }

  .kpi-value {
    @apply tw:[font-size:1.12rem];
  }

  .kpi-note {
    @apply tw:hidden;
  }

  .dashboard-layout {
    @apply tw:[margin-top:0];
  }

  .calendar-card {
    @apply tw:[margin-bottom:0];
    @apply tw:[padding:0.7rem_0.8rem];
    @apply tw:[border-radius:14px];
  }

  .calendar-header {
    @apply tw:[margin-bottom:0.4rem];
  }

  .calendar-kicker {
    @apply tw:[font-size:0.66rem];
  }

  .calendar-title {
    @apply tw:[margin-top:0.05rem];
    @apply tw:[font-size:1.12rem];
  }

  .calendar-nav-btn,
  .calendar-today-btn {
    @apply tw:[height:30px];
    @apply tw:[min-width:30px];
    @apply tw:[padding-inline:0.5rem];
    @apply tw:[border-radius:8px];
    @apply tw:[font-size:0.75rem];
  }

  .calendar-filters {
    @apply tw:flex-nowrap;
    @apply tw:[gap:0.35rem];
    @apply tw:[margin-bottom:0.4rem];
  }

  .calendar-filter-btn {
    @apply tw:[min-height:30px];
    @apply tw:[padding-inline:0.6rem];
    @apply tw:[font-size:0.72rem];
  }

  .calendar-weekdays {
    @apply tw:[gap:0.3rem];
    @apply tw:[margin-bottom:0.25rem];
  }

  .calendar-weekdays span {
    @apply tw:[font-size:0.66rem];
  }

  .calendar-grid {
    @apply tw:[gap:0.3rem];
  }

  .calendar-day {
    @apply tw:[min-height:70px];
    @apply tw:[padding:0.4rem];
    @apply tw:[border-radius:10px];
  }

  .day-number {
    @apply tw:[font-size:0.78rem];
  }

  .day-events {
    @apply tw:[left:0.3rem];
    @apply tw:[right:0.3rem];
    @apply tw:[bottom:0.25rem];
    @apply tw:[gap:0.12rem];
  }

  .day-event-pill {
    @apply tw:[padding:0.1rem_0.25rem];
    @apply tw:[border-radius:6px];
    @apply tw:[font-size:0.56rem];
  }

  .calendar-legend {
    @apply tw:hidden;
  }
}

:global(body.teacher-tour-open) {
  @apply tw:overflow-hidden;
}


</style>



