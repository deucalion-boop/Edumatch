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
            <img :src="teacherAvatarUrl" :alt="teacherFullName" />
          </div>
          <div class="teacher-info">
            <h5>{{ teacherFullName }}</h5>
            <p class="teacher-role">{{ teacherRole }}</p>
            <p v-if="teacherStrand" class="teacher-strand">{{ teacherStrand }}</p>
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
                <UserNotificationList :notifications="messageNotifications" :loading="isNotificationsLoading" />
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

            <div class="calendar-legend">
              <span class="is-lesson"><i class="fas fa-circle"></i> Lesson posted event</span>
              <span class="is-deadline"><i class="fas fa-clock"></i> Assessment deadline</span>
              <span class="is-completed"><i class="fas fa-check-circle"></i> Completed assessment</span>
            </div>
          </section>

          <section class="teacher-notifications section-card animated-card" data-tour="teacher-recent-activity" :aria-busy="isActivityRefreshing ? 'true' : 'false'">
            <div class="teacher-activity-header">
              <div class="teacher-activity-copy">
                <span class="teacher-activity-kicker">Classroom Feed</span>
                <h3 class="section-title">Recent Activity</h3>
                <p class="teacher-activity-subtitle">Latest lessons, deadlines, and classroom updates from your workspace.</p>
              </div>
              <div class="teacher-activity-actions">
                <span class="teacher-activity-status" :class="{ 'is-empty': activityNotifications.length === 0 }">
                  <i :class="activityNotifications.length === 0 ? 'fas fa-sparkles' : 'fas fa-wave-square'"></i>
                  {{ activityNotifications.length === 0 ? 'Quiet right now' : `${activityNotifications.length} updates` }}
                </span>
                <button type="button" class="btn btn-outline teacher-activity-refresh" :disabled="isActivityRefreshing" @click="refreshActivityFeed">
                  <i class="fas" :class="isActivityRefreshing ? 'fa-spinner fa-spin' : 'fa-rotate-right'"></i>
                  <span>{{ isActivityRefreshing ? 'Refreshing' : 'Refresh' }}</span>
                </button>
              </div>
            </div>
            <div v-if="activityNotifications.length === 0" class="teacher-activity-empty" :class="{ 'is-loading': isActivityRefreshing }">
              <div class="teacher-activity-empty-visual" aria-hidden="true">
                <span class="teacher-activity-empty-glow"></span>
                <div class="teacher-activity-empty-icon">
                  <i class="fas fa-clock-rotate-left"></i>
                </div>
              </div>
              <div class="teacher-activity-empty-copy">
                <p class="teacher-activity-empty-title">{{ isActivityRefreshing ? 'Checking for classroom updates' : 'No recent activity yet' }}</p>
                <span class="empty-subtext">
                  {{ isActivityRefreshing
                    ? 'We are pulling the latest lessons, assessments, and classroom events for your dashboard.'
                    : 'New lessons, assessments, and classroom updates will appear here as soon as you publish or schedule them.' }}
                </span>
              </div>
              <div class="teacher-activity-empty-tags">
                <span class="teacher-activity-tag">Lessons</span>
                <span class="teacher-activity-tag">Deadlines</span>
                <span class="teacher-activity-tag">Classroom updates</span>
              </div>
            </div>
            <div v-else class="teacher-activity-list">
              <article
                v-for="notification in activityNotifications"
                :key="`feed-${notification.id}`"
                class="teacher-activity-item"
                :class="`is-${notification.tone}`"
              >
                <div class="teacher-activity-icon" :class="`is-${notification.tone}`">
                  <i :class="notification.icon"></i>
                </div>
                <div class="teacher-activity-content">
                  <div class="teacher-activity-item-top">
                    <strong class="teacher-activity-item-title">{{ notification.message }}</strong>
                    <span class="teacher-activity-pill" :class="`is-${notification.tone}`">{{ notification.label }}</span>
                  </div>
                  <p class="teacher-activity-item-meta">{{ notification.meta }}</p>
                </div>
              </article>
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
          <button type="button" class="teacher-tour-btn teacher-tour-btn-ghost" :disabled="tourStepIndex === 0" @click="goToPreviousTourStep">Back</button>
          <button type="button" class="teacher-tour-btn teacher-tour-btn-primary" @click="goToNextTourStep">
            {{ isLastTourStep ? 'Finish' : 'Next' }}
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
const TOUR_PROGRESS_PREFIX = 'edumatch_teacher_tour_progress_'
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
        title: 'Navigation Overview',
        description: 'Use the sidebar to move through the four core teacher pages: Dashboard, Activities, Students, and Records.',
        selector: '[data-tour="teacher-navigation"]',
        openSidebar: true
      },
      {
        key: 'dashboard-overview',
        title: 'Dashboard Overview',
        description: 'These summary cards show important teacher insights such as total students, total activities, completed assessments, and recent system updates.',
        selector: '[data-tour="teacher-kpi"]'
      },
      {
        key: 'recent-activity',
        title: 'Recent Activity',
        description: 'This activity feed highlights recent updates such as lesson publishing, new assessments, and tracked deadlines for your classes.',
        selector: '[data-tour="teacher-recent-activity"]'
      },
      {
        key: 'activities-link',
        title: 'Activities Page',
        description: 'The Activities page is your main content management area for creating lessons, challenges, assessments, and AI-based assessment drafts.',
        selector: '[data-tour="teacher-activities-link"]',
        openSidebar: true
      },
      {
        key: 'students-link',
        title: 'Students Page',
        description: 'The Students page lets you invite learners, review student profiles, and monitor learning progress and activity status.',
        selector: '[data-tour="teacher-students-link"]',
        openSidebar: true
      },
      {
        key: 'records-link',
        title: 'Records Page',
        description: 'The Records page helps you review assessment submissions, student scores, completion rates, and overall performance trends.',
        selector: '[data-tour="teacher-records-link"]',
        openSidebar: true
      },
      {
        key: 'finish',
        title: 'Tour Complete',
        description: 'You are ready to start managing activities and students. Restart this tour anytime from the Help or Tour Guide button.',
        selector: '[data-tour="teacher-help-button"]'
      }
    ]
    const activeTourStep = computed(() => tourSteps[tourStepIndex.value] || null)
    const isLastTourStep = computed(() => tourStepIndex.value >= tourSteps.length - 1)
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
      if (profileImage) return profileImage
      const name = encodeURIComponent(displayName.value)
      return `https://ui-avatars.com/api/?name=${name}&background=334155&color=fff`
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
.notification-menu {
  position: relative;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: min(92vw, 460px);
  max-height: min(70vh, 560px);
  overflow-y: auto;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  border: 1px solid #dbe4f1;
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.16);
  padding: 0.95rem;
  z-index: 1200;
  opacity: 1 !important;
  visibility: visible !important;
  transform: translateY(0) !important;
}

.notification-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.notification-dropdown-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
  white-space: nowrap;
}

.notification-dropdown-clear {
  border: 1px solid #d7dfec;
  background: #ffffff;
  color: #334155;
  min-height: 36px;
  padding: 0.45rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.notification-dropdown-clear:hover:not(:disabled) {
  background: #f8fafc;
}

.notification-dropdown-clear:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.notification-dropdown-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  min-width: 0;
  flex: 1 1 auto;
}

.notification-dropdown-close {
  border: 1px solid #d7dfec;
  background: #ffffff;
  color: #475569;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  flex: 0 0 36px;
}

.notification-dropdown-clear,
.notification-dropdown-close {
  flex-shrink: 0;
}

.notification-dropdown-clear {
  min-width: max-content;
  white-space: nowrap;
  width: auto !important;
  height: 36px !important;
}

.notification-dropdown .notification-dropdown-clear,
.notification-dropdown .notification-dropdown-close {
  min-width: unset;
}

.notification-dropdown .notification-dropdown-clear {
  width: auto !important;
  min-width: max-content !important;
  padding-inline: 0.8rem !important;
  overflow: visible !important;
  text-overflow: clip !important;
}

.notification-dropdown .notification-dropdown-close {
  width: 36px !important;
  min-width: 36px !important;
  height: 36px !important;
}

.notification-dropdown-close:hover {
  background: #f8fafc;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.dashboard-kpi-grid {
  margin-bottom: 1.5rem;
}

.kpi-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid rgba(169, 213, 95, 0.52);
  border-radius: 16px;
  background: linear-gradient(180deg, #fbfce9 0%, #fbfce9 100%);
  min-height: 124px;
  box-shadow: 0 14px 28px rgba(30, 67, 7, 0.06);
}

.kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.kpi-icon.students {
  background: #eff6ff;
  color: #1d4ed8;
}

.kpi-icon.lessons {
  background: #ecfeff;
  color: #0f766e;
}

.kpi-icon.classes,
.kpi-icon.assessments {
  background: #eef2ff;
  color: #4338ca;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-label {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.kpi-value {
  color: #0f172a;
  font-size: 1.12rem;
  line-height: 1.2;
}

.kpi-note {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.35;
}

.dashboard-layout {
  align-items: start;
  grid-template-columns: minmax(0, 1fr) !important;
  margin-top: 1.15rem;
}

.dashboard-layout > .content-column {
  min-width: 0;
}

.panel-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.calendar-card {
  border: 1px solid transparent;
  border-radius: 16px;
  background:
    linear-gradient(180deg, #ffffff 0%, #ffffff 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  padding: 1rem 1.05rem;
  margin-bottom: 1rem;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.calendar-kicker {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.calendar-title {
  margin: 0.18rem 0 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.calendar-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.calendar-nav-btn,
.calendar-today-btn {
  border: 1px solid #dbe2ea;
  background: #ffffff;
  color: #334155;
  border-radius: 10px;
  height: 34px;
  min-width: 34px;
  padding: 0 0.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-nav-btn:hover,
.calendar-today-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.calendar-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.85rem;
}

.calendar-filter-label {
  font-size: 0.72rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.calendar-filter-btn {
  border: 1px solid #dbe2ea;
  background: #ffffff;
  color: #475569;
  border-radius: 999px;
  min-height: 34px;
  padding: 0 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.calendar-filter-btn i {
  color: currentColor !important;
}

.calendar-filter-btn.is-all {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #0f172a;
}

.calendar-filter-btn.is-lesson {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.calendar-filter-btn.is-deadline {
  background: #fffbeb;
  border-color: #fde68a;
  color: #b45309;
}

.calendar-filter-btn.is-completed {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

.calendar-filter-btn:hover {
  transform: translateY(-1px);
  filter: brightness(0.98);
}

.calendar-filter-btn.active {
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.calendar-filter-note {
  margin: -0.1rem 0 0.8rem;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.45;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.45rem;
  margin-bottom: 0.45rem;
}

.calendar-weekdays span {
  text-align: center;
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.45rem;
}

.calendar-day {
  min-height: 92px;
  border-radius: 12px;
  border: 1px solid #edf2f7;
  background: #ffffff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.5rem;
  position: relative;
}

.calendar-day.is-empty {
  background: #f8fafc;
  border-style: dashed;
}

.calendar-day.has-events {
  border-color: #cbd5e1;
  background: #f8fbff;
}

.calendar-day.is-today {
  border-color: #334155;
  box-shadow: inset 0 0 0 1px #334155;
}

.day-number {
  font-size: 0.84rem;
  font-weight: 600;
  color: #0f172a;
}

.day-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #334155;
  margin-top: 0.2rem;
}

.day-dot.is-lesson {
  background: #334155;
}

.day-dot.is-deadline {
  background: #d97706;
}

.day-dot.is-completed {
  background: #16a34a;
}

.day-events {
  position: absolute;
  left: 0.45rem;
  right: 0.45rem;
  bottom: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.day-event-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  width: 100%;
  border: 1px solid #dbe2ea;
  border-radius: 8px;
  background: #f8fbff;
  padding: 0.15rem 0.32rem;
  font-size: 0.62rem;
  line-height: 1.2;
  color: #334155;
}

.day-event-pill.is-lesson {
  border-color: #dbe2ea;
  background: #f8fbff;
  color: #334155;
}

.day-event-pill.is-deadline {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.day-event-pill.is-completed {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.event-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
  font-weight: 600;
}

.event-time {
  font-size: 0.58rem;
  color: #64748b;
  white-space: nowrap;
}

.day-event-more {
  font-size: 0.58rem;
  color: #64748b;
  padding-left: 0.1rem;
}

.calendar-legend {
  margin-top: 0.7rem;
  font-size: 0.78rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.calendar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  padding: 0.38rem 0.72rem;
  border-radius: 999px;
  border: 1px solid #dbe2ea;
  background: #ffffff;
  font-weight: 700;
}

.calendar-legend i {
  font-size: 0.5rem;
  color: currentColor;
}

.calendar-legend .is-lesson {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.calendar-legend .is-deadline {
  background: #fffbeb;
  border-color: #fde68a;
  color: #b45309;
}

.calendar-legend .is-completed {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

.teacher-notifications {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  padding: 1rem 1.05rem;
}

.teacher-activity-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.teacher-activity-copy {
  min-width: 0;
}

.teacher-activity-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #1d4ed8;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.teacher-activity-kicker::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #60a5fa, #2563eb);
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.14);
}

.teacher-activity-subtitle {
  margin: 0.38rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.45;
  max-width: 38rem;
}

.teacher-activity-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.teacher-activity-status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.48rem 0.8rem;
  border-radius: 999px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.teacher-activity-status.is-empty {
  border-color: #e2e8f0;
  background: #f8fafc;
  color: #475569;
}

.teacher-activity-refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
  min-height: 38px;
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.teacher-activity-refresh:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.teacher-activity-empty {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
  border: 1px dashed #dbe4f1;
  border-radius: 18px;
  background:
    radial-gradient(circle at top, rgba(59, 130, 246, 0.1), transparent 44%),
    linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.teacher-activity-empty::after {
  content: '';
  position: absolute;
  inset: auto -32px -44px auto;
  width: 160px;
  height: 160px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(148, 163, 184, 0.18), rgba(148, 163, 184, 0));
  pointer-events: none;
}

.teacher-activity-empty-visual {
  position: relative;
  width: 74px;
  height: 74px;
}

.teacher-activity-empty-glow {
  position: absolute;
  inset: 10px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(148, 163, 184, 0.08));
  filter: blur(4px);
}

.teacher-activity-empty-icon {
  position: relative;
  z-index: 1;
  width: 74px;
  height: 74px;
  border-radius: 22px;
  border: 1px solid #dbeafe;
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.14);
  color: #2563eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.teacher-activity-empty.is-loading .teacher-activity-empty-icon {
  animation: activityPulse 1.5s ease-in-out infinite;
}

.teacher-activity-empty-copy {
  position: relative;
  z-index: 1;
}

.teacher-activity-empty-title {
  margin: 0;
  color: #0f172a;
  font-size: 1.02rem;
  font-weight: 800;
}

.teacher-activity-empty-copy .empty-subtext {
  margin-top: 0.45rem;
  max-width: 36rem;
  line-height: 1.5;
}

.teacher-activity-empty-tags {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.teacher-activity-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #dbe4f1;
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
  font-size: 0.76rem;
  font-weight: 700;
}

.teacher-activity-list {
  display: grid;
  gap: 0.78rem;
}

.teacher-activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.82rem;
  padding: 0.95rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.teacher-activity-item:hover {
  transform: translateY(-1px);
  border-color: #cbd5e1;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.teacher-activity-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.teacher-activity-icon.is-lesson {
  background: #ecfeff;
  color: #0f766e;
}

.teacher-activity-icon.is-assessment {
  background: #eef2ff;
  color: #4338ca;
}

.teacher-activity-content {
  min-width: 0;
  flex: 1;
}

.teacher-activity-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.teacher-activity-item-title {
  color: #0f172a;
  font-size: 0.95rem;
  line-height: 1.4;
}

.teacher-activity-item-meta {
  margin: 0.34rem 0 0;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.45;
}

.teacher-activity-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid transparent;
}

.teacher-activity-pill.is-lesson {
  border-color: #bae6fd;
  background: #f0fdfa;
  color: #0f766e;
}

.teacher-activity-pill.is-assessment {
  border-color: #c7d2fe;
  background: #eef2ff;
  color: #4338ca;
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
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}

.table-header {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.table-row {
  border-bottom: 1px solid #eef2f7;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f8fafc;
}

@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .notification-dropdown {
    right: -0.35rem;
    width: min(340px, calc(100vw - 1rem));
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-layout {
    margin-top: 0.9rem;
  }

  .teacher-activity-header {
    flex-direction: column;
    align-items: stretch;
  }

  .teacher-activity-actions {
    justify-content: space-between;
  }

  .teacher-activity-refresh {
    justify-content: center;
  }

  .calendar-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .calendar-filters {
    width: 100%;
  }

  .calendar-filter-label {
    width: 100%;
  }

  .calendar-filter-btn {
    flex: 1 1 calc(50% - 0.5rem);
  }

  .calendar-controls {
    width: 100%;
    justify-content: space-between;
  }

  .calendar-nav-btn,
  .calendar-today-btn {
    flex: 1;
  }

  .calendar-day {
    min-height: 80px;
    padding: 0.35rem;
  }

  .calendar-weekdays,
  .calendar-grid {
    gap: 0.25rem;
  }

  .teacher-activity-item {
    padding: 0.85rem;
  }

  .teacher-activity-item-top {
    flex-direction: column;
    gap: 0.45rem;
  }

}

@media (max-width: 560px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .teacher-activity-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .teacher-activity-status,
  .teacher-activity-refresh {
    width: 100%;
    justify-content: center;
  }

  .teacher-activity-empty {
    padding: 1rem;
  }
}

.teacher-tour-layer {
  position: fixed;
  inset: 0;
  z-index: 12000;
  pointer-events: none;
}

.teacher-tour-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.58);
}

.teacher-tour-spotlight {
  position: fixed;
  z-index: 12001;
  border-radius: 16px;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.58);
  border: 2px solid rgba(255, 255, 255, 0.95);
  transition: top 0.24s ease, left 0.24s ease, width 0.24s ease, height 0.24s ease;
  pointer-events: none;
}

.teacher-tour-tooltip {
  position: fixed;
  z-index: 12002;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.22);
  padding: 1rem 1.1rem;
  pointer-events: auto;
  transition: left 0.24s ease, top 0.24s ease, width 0.24s ease;
  max-height: min(70vh, calc(100vh - 24px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.teacher-tour-step {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.teacher-tour-tooltip h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.25;
  font-weight: 700;
}

.teacher-tour-tooltip p {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.45;
}

.teacher-tour-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.55rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.teacher-tour-btn {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  min-height: 40px;
  min-width: 88px;
  padding: 0.45rem 0.92rem;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.teacher-tour-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.teacher-tour-btn-ghost {
  background: #ffffff;
  color: #334155;
}

.teacher-tour-btn-ghost:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.teacher-tour-btn-primary {
  border-color: #0f172a;
  background: #0f172a;
  color: #ffffff;
}

.teacher-tour-btn-primary:hover {
  background: #1e293b;
  border-color: #1e293b;
  transform: translateY(-1px);
}

.header-tour-btn {
  cursor: pointer;
  background: #ffffff;
  color: #334155;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbe2ea;
  transition: all 0.2s ease;
}

.header-tour-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .notification-dropdown {
    position: fixed;
    top: 78px;
    right: 12px;
    left: 12px;
    width: auto;
    max-height: calc(100vh - 96px);
  }

  .teacher-tour-tooltip {
    max-width: calc(100vw - 16px);
    border-radius: 14px;
    padding: 0.8rem 0.82rem;
  }

  .teacher-tour-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .teacher-tour-btn {
    width: 100%;
    min-height: 42px;
    font-size: 0.84rem;
    padding: 0.5rem 0.65rem;
  }

  .teacher-tour-btn-primary {
    grid-column: 1 / -1;
  }

  .teacher-tour-tooltip h3 {
    font-size: 0.98rem;
    line-height: 1.24;
  }

  .teacher-tour-tooltip p {
    font-size: 0.84rem;
    line-height: 1.38;
  }
}

@media (max-width: 480px) {
  .teacher-tour-spotlight {
    border-radius: 12px;
    border-width: 1.5px;
  }

  .teacher-tour-tooltip {
    border-radius: 12px;
    padding: 0.72rem 0.72rem;
  }

  .teacher-tour-step {
    font-size: 0.66rem;
  }

  .teacher-tour-tooltip h3 {
    font-size: 0.92rem;
  }

  .teacher-tour-tooltip p {
    font-size: 0.8rem;
  }
}

:global(body.teacher-tour-open) {
  overflow: hidden;
}

</style>



