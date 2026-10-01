<template>
  <div class="student-dashboard" :class="[{ 'sidebar-open': isSidebarOpen, 'no-route-sidebar': shouldHideSidebar }, studentAppearanceClasses]">
    <aside v-if="!shouldHideSidebar" id="student-sidebar-drawer" class="student-sidebar" :class="{ active: isSidebarOpen }" data-tour="sidebar">
      <div class="sidebar-header">
        <div class="student-logo">
          <div class="student-logo-icon">
            <img src="/logo.png" alt="EduMatch" class="student-logo-img" />
          </div>
          <div class="student-logo-text">
            <h2>EduMatch</h2>
            <p>Student Portal</p>
          </div>
        </div>
        <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <nav class="sidebar-nav" data-tour="navigation">
        <div class="nav-section">
          <h4 class="nav-section-title">Navigation</h4>
          <div class="nav-dropdown nav-dropdown-dashboard">
            <router-link
              to="/student/dashboard"
              class="nav-link nav-link-dropdown"
              :class="{ active: isActiveRoute('/student/dashboard'), 'is-expanded': isDashboardMenuExpanded }"
              @click="closeSidebar"
            >
              <span class="nav-link-main">
                <i class="fas fa-home"></i>
                <span class="nav-link-copy">
                  <span class="nav-link-title">Dashboard</span>
                </span>
              </span>
              <span
                class="nav-link-caret"
                :aria-expanded="isDashboardMenuExpanded ? 'true' : 'false'"
                aria-controls="student-dashboard-submenu"
                aria-label="Toggle dashboard menu"
                role="button"
                tabindex="0"
                @click.stop.prevent="toggleDashboardMenu"
                @keydown.enter.stop.prevent="toggleDashboardMenu"
                @keydown.space.stop.prevent="toggleDashboardMenu"
              >
                <i class="fas fa-chevron-down nav-link-caret-icon" aria-hidden="true"></i>
              </span>
            </router-link>
            <transition name="nav-submenu">
              <div v-if="isDashboardMenuExpanded" id="student-dashboard-submenu" class="nav-sublinks">
                <button type="button" class="nav-sublink" :class="{ active: isDashboardSectionActive('grades') }" @click="openDashboardSection('grades')">
                  <span class="nav-sublink-copy">
                    <span class="nav-sublink-title">Grades</span>
                    <span class="nav-sublink-caption">Recent results</span>
                  </span>
                </button>
                <button
                  type="button"
                  class="nav-sublink"
                  :class="{ active: isDashboardSectionActive('recommendations') }"
                  @click="openDashboardSection('recommendations')"
                >
                  <span class="nav-sublink-copy">
                    <span class="nav-sublink-title">Recommendations</span>
                    <span class="nav-sublink-caption">Recommendation progress</span>
                  </span>
                </button>
              </div>
            </transition>
          </div>
          <router-link to="/student/lessons" class="nav-link" data-tour="lessons-link" :class="{ active: isActiveRoute('/student/lessons') }" @click="closeSidebar">
            <i class="fas fa-book"></i>
            <span>Lessons</span>
          </router-link>
          <router-link to="/student/activities" class="nav-link" data-tour="challenges-link" :class="{ active: isActiveRoute('/student/activities') }" @click="closeSidebar">
            <i class="fas fa-tasks"></i>
            <span>Activities</span>
          </router-link>
          <router-link to="/student/announcements" class="nav-link" :class="{ active: isActiveRoute('/student/announcements') }" @click="closeSidebar">
            <i class="fas fa-bullhorn"></i>
            <span>Announcements</span>
          </router-link>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar">
            <img v-if="sidebarAvatarUrl" :src="sidebarAvatarUrl" :alt="displayName" class="user-avatar-img">
            <i v-else class="fas fa-user"></i>
          </div>
          <div class="user-info">
            <h5>{{ displayName }}</h5>
            <p>{{ user.gradeLevel || 'Student' }}</p>
            <div class="user-status">
              <span class="status-indicator active"></span>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
    <button
      v-if="!shouldHideSidebar && isSidebarOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="Close sidebar"
      @click="closeSidebar"
    ></button>

    <main class="student-main">
      <header class="top-header">
        <div class="header-content">
          <div class="header-left">
            <button
              v-if="!shouldHideSidebar"
              type="button"
              class="mobile-menu-toggle"
              @click="toggleSidebar"
              :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'"
              :aria-expanded="isSidebarOpen ? 'true' : 'false'"
              aria-controls="student-sidebar-drawer"
              title="Menu"
            >
              <i class="fas fa-bars"></i>
            </button>
            <div class="header-title-group">
              <h1>Welcome, {{ displayName }}!</h1>
              <p class="header-subtitle">{{ user.role }}</p>
            </div>
          </div>

          <div class="header-actions header-primary-actions">
            <button
              v-if="shouldHideSidebar"
              type="button"
              class="header-tour-btn dashboard-home-btn"
              @click="goToDashboard"
              aria-label="Go to dashboard"
              title="Home Dashboard"
            >
              <i class="fas fa-home"></i>
            </button>
            <button
              type="button"
              class="header-tour-btn help-tour-trigger"
              data-tour="help-button"
              @click="launchManualTour"
              aria-label="Open student tour guide"
              title="Open Tour Guide"
            >
              <i class="fas fa-question-circle"></i>
            </button>
            <div ref="notificationMenuRef" class="notification-menu">
              <button
                type="button"
                class="notification-bell"
                data-tour="notifications"
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
                      :disabled="notifications.length === 0"
                      @click="clearAllNotifications"
                    >
                      Clear all
                    </button>
                    <button type="button" class="notification-dropdown-clear" :disabled="!unreadNotificationCount" @click="markAllViewed">Mark All as Read</button>
                    <button type="button" class="notification-dropdown-close" @click="closeNotificationsPanel" aria-label="Close notifications">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <p v-if="notificationError" role="alert">{{ notificationError }}</p>
                <UserNotificationList
                  :notifications="notifications"
                  :loading="isNotificationsLoading"
                  manual-navigation show-read-actions
                  @mark-read="markNotificationViewed"
                  @select="openNotification"
                />
              </div>
            </div>
            <div ref="accountMenuRef" class="account-menu">
              <button
                type="button"
                class="header-tour-btn account-menu-trigger"
                @click="toggleAccountMenu"
                aria-label="Account menu"
                title="Account"
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
      </header>

      <template v-if="$slots.default">
        <slot />
      </template>
      <template v-else>
        <router-view />
      </template>
    </main>

    <div v-if="isTourActive" class="student-tour-layer" aria-live="polite">
      <div class="student-tour-backdrop"></div>
      <div v-if="tourSpotlightStyle" class="student-tour-spotlight" :style="tourSpotlightStyle"></div>

      <section
        class="student-tour-tooltip"
        :style="tourTooltipStyle"
        role="dialog"
        aria-modal="true"
        :aria-label="`Dashboard tour step ${tourStepIndex + 1} of ${tourSteps.length}`"
      >
        <p class="student-tour-step">Step {{ tourStepIndex + 1 }} of {{ tourSteps.length }}</p>
        <h3>{{ activeTourStep?.title }}</h3>
        <p>{{ activeTourStep?.description }}</p>
        <div class="student-tour-actions">
          <button type="button" class="student-tour-btn student-tour-btn-ghost" @click="skipTour">Skip</button>
          <button type="button" class="student-tour-btn student-tour-btn-ghost" :disabled="tourStepIndex === 0" @click="goToPreviousTourStep">Back</button>
          <button type="button" class="student-tour-btn student-tour-btn-primary" @click="goToNextTourStep">
            {{ isLastTourStep ? 'Finish' : 'Next' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { computed, reactive, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import UserNotificationList from '../../components/UserNotificationList.vue'
import { useUserNotifications } from '../../composables/useUserNotifications.js'

const SIDEBAR_BREAKPOINT = 1024
const SIDEBAR_WIDTH = 280
const STUDENT_TOUR_START_ROUTE = '/student/dashboard'

export default {
  name: 'StudentView',
  components: {
    UserNotificationList
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const isSidebarOpen = ref(false)
    const isAccountMenuOpen = ref(false)
    const dashboardMenuExpanded = ref(route.path === '/student/dashboard')
    const accountMenuRef = ref(null)
    const notificationMenuRef = ref(null)
    const user = reactive({
      username: '',
      displayName: '',
      email: '',
      role: 'student',
      gradeLevel: '',
      profileImage: '',
      profile: {}
    })
    const defaultStudentAppearance = { theme: 'system', textSize: 'normal', highContrast: false, reduceMotion: false }
    const preferenceIdentity = authStore.user?.id || authStore.user?._id || authStore.user?.username || 'student'
    const studentPreferenceCacheKey = `edumatch_student_settings_v2_${preferenceIdentity}`
    let cachedStudentAppearance = {}
    try {
      const cachedSettings = JSON.parse(localStorage.getItem(studentPreferenceCacheKey) || '{}')
      if (cachedSettings.appearance && typeof cachedSettings.appearance === 'object') cachedStudentAppearance = cachedSettings.appearance
    } catch (_error) {
      localStorage.removeItem(studentPreferenceCacheKey)
    }
    const studentAppearance = reactive({ ...defaultStudentAppearance, ...cachedStudentAppearance })
    const studentColorScheme = window.matchMedia?.('(prefers-color-scheme: dark)')
    const systemDark = ref(studentAppearance.theme === 'system' && studentColorScheme?.matches === true)
    const studentAppearanceClasses = computed(() => ({
      'student-theme-dark': studentAppearance.theme === 'dark' || (studentAppearance.theme === 'system' && systemDark.value),
      'student-theme-light': studentAppearance.theme === 'light',
      'student-text-large': studentAppearance.textSize === 'large',
      'student-text-larger': studentAppearance.textSize === 'larger',
      'student-high-contrast': studentAppearance.highContrast,
      'student-reduce-motion': studentAppearance.reduceMotion,
    }))

    const applyStudentPreferences = (settings = {}) => {
      if (settings.appearance && typeof settings.appearance === 'object') Object.assign(studentAppearance, settings.appearance)
      systemDark.value = studentAppearance.theme === 'system' && studentColorScheme?.matches === true
      const resolvedTheme = studentAppearance.theme === 'system'
        ? (studentColorScheme?.matches ? 'dark' : 'light')
        : studentAppearance.theme
      document.documentElement.dataset.studentTheme = studentAppearance.theme
      document.documentElement.dataset.studentThemeResolved = resolvedTheme
    }

    const handleStudentColorSchemeChange = () => {
      if (studentAppearance.theme === 'system') applyStudentPreferences()
    }

    const loadStudentPreferences = async () => {
      try { applyStudentPreferences(JSON.parse(localStorage.getItem(studentPreferenceCacheKey) || '{}')) } catch (_error) { localStorage.removeItem(studentPreferenceCacheKey) }
      if (!authStore.token) return
      try {
        const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
        const baseUrl = !configured ? '/api' : (configured.endsWith('/api') ? configured : `${configured}/api`)
        const response = await fetch(`${baseUrl}/student/settings`, { headers: { Authorization: `Bearer ${authStore.token}` } })
        if (!response.ok) return
        const payload = await response.json()
        const settings = payload?.settings || {}
        applyStudentPreferences(settings)
        localStorage.setItem(studentPreferenceCacheKey, JSON.stringify(settings))
      } catch (_error) {
        // Cached preferences remain active when the server is temporarily unavailable.
      }
    }

    const handleStudentPreferencesChanged = (event) => applyStudentPreferences(event.detail || {})

    const {
      notifications,
      unreadCount: unreadNotificationCount,
      isLoading: isNotificationsLoading,
      showNotificationsPanel,
      toggleNotificationsPanel,
      closeNotificationsPanel,
      clearAllNotifications,
      markAllViewed, markNotificationViewed, notificationError,
    } = useUserNotifications({ limit: 50, pollIntervalMs: 5000, markViewedOnOpen: false })
    const openNotification = async (notification) => {
      if (!await markNotificationViewed(notification)) return
      const route = String(notification.meta?.route || '')
      if (!route.startsWith('/student/')) return
      await router.push(route)
      closeNotificationsPanel()
    }

    const isTourActive = ref(false)
    const tourStepIndex = ref(0)
    const tourTargetRect = ref(null)
    const tourTooltipStyle = ref({})
    const hasAttemptedAutoTour = ref(false)

    const tourSteps = [
      {
        key: 'welcome',
        title: 'Welcome to EduMatch',
        description: 'EduMatch helps you access lessons, complete activities, track your progress, and receive strand recommendations based on your learning strengths.',
        route: '/student/dashboard'
      },
      {
        key: 'sidebar',
        title: 'Navigation Overview',
        description: 'Use this navigation menu to move between your Dashboard, Lessons, Activities, and Announcements.',
        selector: '[data-tour="sidebar"]',
        route: '/student/dashboard',
        openSidebar: true
      },
      {
        key: 'dashboard',
        title: 'Dashboard Overview',
        description: 'Your dashboard gives you a quick overview of learning materials, completed activities, recent progress, and important updates from your classes.',
        selector: '[data-tour="dashboard-overview"]',
        route: '/student/dashboard'
      },
      {
        key: 'dashboard-recent-activity',
        title: 'Recent Activity',
        description: 'This section shows new lessons, posted updates, and recently completed work so you can stay current with class activity.',
        selector: '[data-tour="dashboard-recent-activity"]',
        route: '/student/dashboard'
      },
      {
        key: 'dashboard-insights',
        title: 'Progress and Insights',
        description: 'Review your completed activities, scores, and progress indicators here to understand your strengths and areas that need more focus.',
        selector: '[data-tour="dashboard-progress-insights"]',
        route: '/student/dashboard'
      },
      {
        key: 'strand-recommendation',
        title: 'Strand Recommendation',
        description: 'EduMatch analyzes your assessment performance to suggest senior high school strands like STEM, HUMSS, ABM, or TVL that fit your strengths.',
        selector: '[data-tour="dashboard-strand-recommendation"]',
        route: '/student/dashboard'
      },
      {
        key: 'lessons',
        title: 'Lessons Page',
        description: 'Your Lessons page shows learning materials shared by your teacher, including lesson files and supporting attachments.',
        selector: '[data-tour="student-lessons-table"]',
        route: '/student/lessons'
      },
      {
        key: 'lesson-details',
        title: 'Lesson Details',
        description: 'Open a lesson to review the lesson content and attachments before moving on to related activities or assessments.',
        selector: '[data-tour="student-lesson-detail"]',
        route: '/student/lessons',
        action: 'open-first-lesson'
      },
      {
        key: 'activities',
        title: 'Choose Your Classwork',
        description: 'Select an activity, quiz, or exam from the task list. The highlighted card shows which task you are currently reviewing.',
        selector: '[data-tour="student-activities-table"]',
        route: '/student/activities'
      },
      {
        key: 'activity-details',
        title: 'Review Before You Begin',
        description: 'Check the instructions, deadline, timer, question count, and linked lesson here before starting your work.',
        selector: '[data-tour="student-activity-detail"]',
        route: '/student/activities',
        action: 'open-first-assessment'
      },
      {
        key: 'assessment-page',
        title: 'Start a Secure Assessment',
        description: 'Exams open in a focused one-question workspace with autosave, a timer, progress navigation, and academic-integrity monitoring. Stay on the exam screen until you submit.',
        selector: '[data-tour="student-activity-start"]',
        route: '/student/activities',
        action: 'open-first-assessment'
      },
      {
        key: 'finish',
        title: 'You Are Ready to Begin',
        description: 'Start exploring your lessons and classwork. You can reopen this updated guide anytime using the Tour Guide button in the header.',
        selector: '[data-tour="help-button"]',
        route: '/student/dashboard'
      }
    ]

    const activeTourStep = computed(() => tourSteps[tourStepIndex.value] || null)
    const isLastTourStep = computed(() => tourStepIndex.value >= tourSteps.length - 1)
    const shouldHideSidebar = computed(() => route.path === '/student/profile' || route.path === '/student/settings')

    const displayName = computed(() => user.displayName || user.username || 'Student')
    const sidebarAvatarUrl = computed(() => {
      const raw = String(user.profileImage || authStore.user?.profileImage || '').trim()
      if (!raw) return ''
      if (/^https?:\/\//i.test(raw) || /^blob:/i.test(raw)) return raw
      return raw.startsWith('/') ? raw : `/${raw}`
    })

    const isActiveRoute = (path) => route.path === path || route.path.startsWith(`${path}/`)
    const isDashboardSectionActive = (section) => route.path === '/student/dashboard' && String(route.query.section || '').trim().toLowerCase() === section

    const dispatchDashboardSectionFocus = (section) => {
      if (typeof window === 'undefined') return
      window.dispatchEvent(new CustomEvent('student-dashboard-section-focus', { detail: { section } }))
    }

    const toggleDashboardMenu = () => {
      dashboardMenuExpanded.value = !dashboardMenuExpanded.value
    }

    const toggleSidebar = () => {
      if (shouldHideSidebar.value) return
      isSidebarOpen.value = !isSidebarOpen.value
    }

    const closeSidebar = () => {
      isSidebarOpen.value = false
    }

    const toggleAccountMenu = () => {
      isAccountMenuOpen.value = !isAccountMenuOpen.value
    }

    const goToProfile = () => {
      isAccountMenuOpen.value = false
      closeSidebar()
      router.push('/student/profile')
    }

    const goToDashboard = () => {
      isAccountMenuOpen.value = false
      closeSidebar()
      router.push('/student/dashboard')
    }

    const openDashboardSection = async (section) => {
      const normalizedSection = section === 'recommendations' ? 'recommendations' : 'grades'
      isAccountMenuOpen.value = false
      dashboardMenuExpanded.value = true
      closeSidebar()

      if (route.path !== '/student/dashboard' || String(route.query.section || '').trim().toLowerCase() !== normalizedSection) {
        await router.push({ path: '/student/dashboard', query: { section: normalizedSection } })
      }

      await nextTick()
      window.setTimeout(() => {
        dispatchDashboardSectionFocus(normalizedSection)
      }, 120)
    }

    const goToSettings = () => {
      isAccountMenuOpen.value = false
      closeSidebar()
      router.push('/student/settings')
    }

    const handleAccountMenuClickOutside = (event) => {
      const target = event?.target
      if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
      if (notificationMenuRef.value && target instanceof Node && notificationMenuRef.value.contains(target)) return
      isAccountMenuOpen.value = false
      closeNotificationsPanel()
    }

    const syncMobileMenuBodyState = () => {
      if (typeof window === 'undefined') return
      const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
      document.body.classList.toggle('student-mobile-menu-open', shouldLockBody)
    }

    const handleLogout = async () => {
      try {
        isAccountMenuOpen.value = false
        authStore.logout()
        router.push('/auth/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

    const hasSeenTour = () => authStore.user?.hasCompletedStudentTour === true

    const persistStudentTourPreference = async (hasCompletedStudentTour = true) => {
      if (!authStore.token) return
      try {
        const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
        const resolvedApiBaseUrl = !apiBaseUrl ? '/api' : (apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`)
        await fetch(`${resolvedApiBaseUrl}/student/tour-preference`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.token}`
          },
          body: JSON.stringify({ hasCompletedStudentTour })
        })
      } catch (error) {
        console.error('Failed to persist student tour preference:', error)
      }
    }

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

    const emitTourFocus = async (action = '') => {
      if (!action || typeof window === 'undefined') return
      window.dispatchEvent(new CustomEvent('edumatch-student-tour-focus', {
        detail: { action }
      }))
      await wait(180)
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
      const isSidebarTarget = Boolean(target.closest('.student-sidebar'))
      const minTargetLeft = sidebarVisible && !isSidebarTarget ? safeViewportLeft : 8
      const paddedRect = {
        top: clamp(rect.top - padding, viewportTopPadding, window.innerHeight - viewportBottomPadding),
        left: clamp(rect.left - padding, minTargetLeft, window.innerWidth - viewportRightPadding),
        width: clamp(rect.width + padding * 2, 0, window.innerWidth - minTargetLeft - viewportRightPadding),
        height: clamp(rect.height + padding * 2, 0, window.innerHeight - viewportTopPadding - viewportBottomPadding)
      }

      tourTargetRect.value = paddedRect

      const tooltipWidth = Math.min(maxTooltipWidth, availableWidth)
      const tooltipElement = document.querySelector('.student-tour-tooltip')
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

    const getDashboardTourSection = (step) => {
      if (step?.route !== '/student/dashboard') return ''
      if (step?.key === 'dashboard-insights' || step?.key === 'strand-recommendation') return 'recommendations'
      return ''
    }

    const ensureStepContext = async (step) => {
      if (!step) return
      const requiredDashboardSection = getDashboardTourSection(step)
      const currentDashboardSection = String(route.query.section || '').trim().toLowerCase()
      const needsDashboardQueryUpdate = step.route === '/student/dashboard' && currentDashboardSection !== requiredDashboardSection

      if (step.route && (route.path !== step.route || needsDashboardQueryUpdate)) {
        if (step.route === '/student/dashboard') {
          await router.push(requiredDashboardSection ? { path: step.route, query: { section: requiredDashboardSection } } : { path: step.route })
        } else {
          await router.push(step.route)
        }
        await nextTick()
      }
      if (window.innerWidth <= SIDEBAR_BREAKPOINT) {
        isSidebarOpen.value = Boolean(step.openSidebar)
      }
      await nextTick()
      await emitTourFocus(step.action)
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
        authStore.setUser({ hasCompletedStudentTour: true })
        persistStudentTourPreference(true)
      }
      document.body.classList.remove('student-tour-open')
    }

    const startTour = async ({ force = false } = {}) => {
      if (!force && hasSeenTour()) return
      if (route.path !== STUDENT_TOUR_START_ROUTE) {
        await router.push(STUDENT_TOUR_START_ROUTE)
      }

      isTourActive.value = true
      tourStepIndex.value = 0
      document.body.classList.add('student-tour-open')
      await nextTick()
      await renderCurrentTourStep()
    }

    const launchManualTour = async () => {
      await startTour({ force: true })
    }

    const goToNextTourStep = async () => {
      if (isLastTourStep.value) {
        closeTour({ markSeen: true })
        return
      }
      tourStepIndex.value += 1
      await renderCurrentTourStep()
    }

    const goToPreviousTourStep = async () => {
      if (tourStepIndex.value === 0) return
      tourStepIndex.value -= 1
      await renderCurrentTourStep()
    }

    const skipTour = () => {
      closeTour({ markSeen: true })
    }

    const maybeAutoStartTour = async () => {
      if (hasAttemptedAutoTour.value) return
      if (route.path !== STUDENT_TOUR_START_ROUTE) return

      hasAttemptedAutoTour.value = true
      if (hasSeenTour()) return

      await wait(400)
      await startTour()
    }

    const fetchUserData = async () => {
      try {
        const authUser = authStore.user || {}
        user.username = authUser.username || authUser.email || ''
        user.displayName = authUser.name || authUser.displayName || authUser.username || 'Student'
        user.email = authUser.email || ''
        user.role = authUser.role || 'student'
        user.gradeLevel = authUser.gradeLevel || ''
        user.profileImage = authUser.profileImage || ''
        user.profile = authUser.profile || {}
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      if (isTourActive.value) {
        skipTour()
        return
      }
      closeSidebar()
    }

    const handleTourViewportChange = () => {
      if (!isTourActive.value) return
      updateTourPlacement()
    }

    watch(
      () => route.path,
      async (path) => {
        dashboardMenuExpanded.value = path === '/student/dashboard'
        closeSidebar()
        isAccountMenuOpen.value = false
        if (isTourActive.value) {
          await renderCurrentTourStep()
          return
        }
        await maybeAutoStartTour()
      }
    )

    watch(
      () => isSidebarOpen.value,
      () => {
        syncMobileMenuBodyState()
      }
    )

    onMounted(() => {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('click', handleAccountMenuClickOutside)
      window.addEventListener('resize', handleTourViewportChange)
      window.addEventListener('scroll', handleTourViewportChange, true)
      window.addEventListener('resize', syncMobileMenuBodyState)
      fetchUserData()
      loadStudentPreferences()
      window.addEventListener('edumatch-student-preferences-changed', handleStudentPreferencesChanged)
      studentColorScheme?.addEventListener('change', handleStudentColorSchemeChange)
      maybeAutoStartTour()
      syncMobileMenuBodyState()
    })

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('click', handleAccountMenuClickOutside)
      window.removeEventListener('resize', handleTourViewportChange)
      window.removeEventListener('scroll', handleTourViewportChange, true)
      window.removeEventListener('resize', syncMobileMenuBodyState)
      window.removeEventListener('edumatch-student-preferences-changed', handleStudentPreferencesChanged)
      studentColorScheme?.removeEventListener('change', handleStudentColorSchemeChange)
      closeTour({ markSeen: false })
      document.body.classList.remove('student-mobile-menu-open')
    })

    return {
      isSidebarOpen,
      isAccountMenuOpen,
      isDashboardMenuExpanded: dashboardMenuExpanded,
      accountMenuRef,
      notificationMenuRef,
      user,
      notifications,
      unreadNotificationCount,
      isNotificationsLoading,
      showNotificationsPanel,
      studentAppearanceClasses,
      shouldHideSidebar,
      displayName,
      sidebarAvatarUrl,
      isActiveRoute,
      isDashboardSectionActive,
      toggleDashboardMenu,
      toggleSidebar,
      toggleAccountMenu,
      goToDashboard,
      openDashboardSection,
      goToProfile,
      goToSettings,
      closeSidebar,
      handleLogout,
      toggleNotificationsPanel,
      closeNotificationsPanel,
      openNotification, markAllViewed, markNotificationViewed, notificationError,
      clearAllNotifications,
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

<style>
@reference "../../styles/tailwind.css";

body.student-tour-open {
  @apply tw:overflow-hidden;
}

body.student-dashboard .student-dashboard.no-route-sidebar .student-main {
  @apply tw:[margin-left:0]!;
}

.student-dashboard.student-text-large { @apply tw:[font-size:1.08rem]; }
.student-dashboard.student-text-larger { @apply tw:[font-size:1.16rem]; }
.student-dashboard.student-reduce-motion *,
.student-dashboard.student-reduce-motion *::before,
.student-dashboard.student-reduce-motion *::after { @apply tw:scroll-auto!; @apply tw:[transition-duration:0.01ms]!; @apply tw:[animation-duration:0.01ms]!; }
.student-dashboard.student-high-contrast { --border-color: #475569; }
.student-dashboard.student-high-contrast :is(.section-card, .settings-panel, .student-card, .dashboard-card, table, input, select, textarea) { @apply tw:[border-color:#475569]!; }
html[data-student-theme-resolved='dark'],
html[data-student-theme-resolved='dark'] body.student-dashboard {
  @apply tw:[color-scheme:dark];
  @apply tw:[background:#0b120e];
}

.student-dashboard.student-theme-dark {
  --background-color: #0b120e;
  --surface-color: #162019;
  --text-primary: #f1f5f2;
  --text-secondary: #bdc9c0;
  --text-tertiary: #91a096;
  --border-color: #34483b;
  --shadow-color: rgba(0, 0, 0, 0.32);
  --primary-lighter: #202d24;
  --bg-light: #101913;
  --bg-hover: #26362b;
  @apply tw:[color-scheme:dark];
  @apply tw:[color:var(--text-primary)];
  @apply tw:[background:var(--background-color)];
}

.student-dashboard.student-theme-dark :is(.student-main, .student-dashboard-page, .premium-dashboard, .announcement-page) {
  @apply tw:[background-color:var(--background-color)]!;
  @apply tw:[color:var(--text-primary)]!;
}

.student-dashboard.student-theme-dark :is(.student-sidebar, .top-header, .notification-dropdown, .account-menu-dropdown) {
  @apply tw:[background:#121c16]!;
  @apply tw:[border-color:var(--border-color)]!;
  @apply tw:[color:var(--text-primary)]!;
  @apply tw:[box-shadow:0_14px_34px_rgba(0,_0,_0,_0.3)]!;
}

.student-dashboard.student-theme-dark :is(.sidebar-header, .sidebar-footer) {
  @apply tw:[border-color:var(--border-color)]!;
}

.student-dashboard.student-theme-dark :is(.nav-link, .nav-sublink, .account-menu-item, .notification-dropdown-clear, .notification-dropdown-close) {
  @apply tw:[color:var(--text-secondary)]!;
}

.student-dashboard.student-theme-dark :is(.nav-link:hover, .nav-link.active, .nav-sublink:hover, .nav-sublink.active, .account-menu-item:hover) {
  @apply tw:[background-color:#223128]!;
  @apply tw:[border-color:#496050]!;
  @apply tw:[color:#ffffff]!;
}

.student-dashboard.student-theme-dark :is(.nav-link i, .nav-sublink i, .user-avatar) {
  @apply tw:[background-color:#202d24]!;
  @apply tw:[border-color:#425749]!;
}

.student-dashboard.student-theme-dark .premium-dashboard {
  --canvas: #0b120e !important;
  --ink: #f1f5f2 !important;
  --muted: #adbbb1 !important;
  --line: #34483b !important;
  --white: #ffffff !important;
}

.student-dashboard.student-theme-dark :is(
  .section-card,
  .settings-panel,
  .student-settings-nav,
  .student-card,
  .dashboard-card,
  .stat-card,
  .lesson-card,
  .activity-card,
  .profile-card,
  .profile-details-card,
  .activity-response-shell,
  .classes-panel,
  .lessons-panel,
  .announcement-card,
  .state-card,
  .grades-stat-card,
  .grades-performance-card,
  .grades-table-wrap,
  .pathway-progress-card,
  .pathway-stat-card,
  .academic-progress-overview,
  .subject-performance-card,
  .recommendation-ranking-section,
  .recommendation-highlight-grid article,
  .modal-content,
  .dialog-content
) {
  @apply tw:[border-color:var(--border-color)]!;
  @apply tw:[color:var(--text-primary)]!;
  @apply tw:[box-shadow:0_12px_30px_rgba(0,_0,_0,_0.22)]!;
}

.student-dashboard.student-theme-dark :is(.grades-premium-header, .pathway-premium-header, .section-header, .page-header, table th, table td) {
  @apply tw:[border-color:var(--border-color)]!;
}

.student-dashboard.student-theme-dark :is(table, thead, tbody, tr, td, th) {
  @apply tw:[color:var(--text-primary)];
}

.student-dashboard.student-theme-dark :is(table th, .table-header) {
  @apply tw:[background-color:#101913]!;
}

.student-dashboard.student-theme-dark :is(table tr:hover td, .table-row:hover) {
  @apply tw:[background-color:#202d24]!;
}

.student-dashboard.student-theme-dark :is(h1, h2, h3, h4, h5, h6, strong, label, .detail-value, .section-title) {
  @apply tw:[color:#f8fafc]!;
}

.student-dashboard.student-theme-dark :is(p, small, .header-subtitle, .detail-label, .section-subtitle, .field-help) {
  @apply tw:[color:#b9c5bd]!;
}

.student-dashboard.student-theme-dark :is(input, select, textarea) {
  @apply tw:[background:#0e1711]!;
  @apply tw:[border-color:#506157]!;
  @apply tw:[color:#f8fafc]!;
}

.student-dashboard.student-theme-dark :is(input, textarea)::placeholder {
  @apply tw:[color:#839188]!;
}

.student-dashboard.student-theme-dark :is(.preference-row, .inline-setting, .theme-option, .session-item, .privacy-card, .account-request-form) {
  @apply tw:[background:#1b2820]!;
  @apply tw:[border-color:var(--border-color)]!;
}

body.student-dashboard .dashboard-home-btn {
  @apply tw:inline-flex!;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:42px]!;
  @apply tw:[height:42px]!;
  @apply tw:[min-width:42px]!;
  @apply tw:[padding:0]!;
}

.account-menu {
  @apply tw:relative;
}

.account-menu-trigger {
  @apply tw:[box-shadow:none];
}

.account-menu-dropdown {
  @apply tw:absolute;
  @apply tw:[top:calc(100%_+_10px)];
  @apply tw:[right:0];
  @apply tw:[min-width:190px];
  @apply tw:[padding:10px];
  @apply tw:[border:1px_solid_rgba(148,_163,_184,_0.22)];
  @apply tw:[border-radius:16px];
  @apply tw:[background:rgba(255,_255,_255,_0.98)];
  @apply tw:[backdrop-filter:blur(14px)];
  @apply tw:[box-shadow:0_20px_40px_rgba(15,_23,_42,_0.14)];
  @apply tw:grid;
  @apply tw:[gap:6px];
  @apply tw:[z-index:80];
}

.account-menu-dropdown::before {
  @apply tw:[content:""];
  @apply tw:absolute;
  @apply tw:[top:-7px];
  @apply tw:[right:18px];
  @apply tw:[width:14px];
  @apply tw:[height:14px];
  @apply tw:[background:rgba(255,_255,_255,_0.98)];
  @apply tw:[border-top:1px_solid_rgba(148,_163,_184,_0.22)];
  @apply tw:[border-left:1px_solid_rgba(148,_163,_184,_0.22)];
  @apply tw:[transform:rotate(45deg)];
}

.account-menu-item {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[background:transparent];
  @apply tw:[color:#0f172a];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:10px_12px];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:10px];
  @apply tw:[font-size:0.85rem];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
  @apply tw:[transition:background-color_0.2s_ease,_border-color_0.2s_ease,_color_0.2s_ease];
}

.account-menu-item i {
  @apply tw:[width:30px];
  @apply tw:[height:30px];
  @apply tw:[border-radius:10px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#334155];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:shrink-0;
}

.account-menu-item:hover {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-color:#e2e8f0];
}

.account-menu-item.danger {
  @apply tw:[color:#b91c1c];
}

.account-menu-item.danger i {
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
  @apply tw:[border-color:#fecaca];
}

.account-menu-item.danger:hover {
  @apply tw:[background:#fef2f2];
  @apply tw:[border-color:#fecaca];
}

.student-tour-layer {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:4000];
  @apply tw:pointer-events-none;
}

.student-tour-backdrop {
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[background:rgba(15,_23,_42,_0.58)];
  @apply tw:[backdrop-filter:none];
}

.student-tour-spotlight {
  @apply tw:fixed;
  @apply tw:[border-radius:16px];
  @apply tw:[box-shadow:0_0_0_9999px_rgba(15,_23,_42,_0.58)];
  @apply tw:[border:2px_solid_rgba(255,_255,_255,_0.95)];
  @apply tw:[transition:top_0.24s_ease,_left_0.24s_ease,_width_0.24s_ease,_height_0.24s_ease];
  @apply tw:pointer-events-none;
}

.student-tour-tooltip {
  @apply tw:fixed;
  @apply tw:[z-index:4002];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[box-shadow:0_20px_40px_rgba(15,_23,_42,_0.2)];
  @apply tw:[padding:1rem_1.05rem];
  @apply tw:pointer-events-auto;
  @apply tw:[transition:left_0.24s_ease,_top_0.24s_ease,_width_0.24s_ease];
  @apply tw:overflow-y-auto;
}

.student-tour-step {
  @apply tw:[margin:0_0_0.35rem];
  @apply tw:[font-size:0.72rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-weight:600];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.student-tour-tooltip h3 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.05rem];
  @apply tw:[line-height:1.25];
  @apply tw:[font-weight:700];
}

.student-tour-tooltip p {
  @apply tw:[margin:0.5rem_0_0];
  @apply tw:[font-size:0.9rem];
  @apply tw:[color:#475569];
  @apply tw:[line-height:1.45];
}

.student-tour-actions {
  @apply tw:[margin-top:0.9rem];
  @apply tw:flex;
  @apply tw:[gap:0.5rem];
  @apply tw:justify-end;
  @apply tw:flex-wrap;
}

.student-tour-btn {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:10px];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:600];
  @apply tw:[padding:0.42rem_0.72rem];
  @apply tw:cursor-pointer;
}

.student-tour-btn:disabled {
  @apply tw:[opacity:0.5];
  @apply tw:cursor-not-allowed;
}

.student-tour-btn-ghost {
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
}

.student-tour-btn-ghost:hover:not(:disabled) {
  @apply tw:[background:#f8fafc];
}

.student-tour-btn-primary {
  @apply tw:[border-color:#0f172a];
  @apply tw:[background:#0f172a];
  @apply tw:[color:#ffffff];
}

.student-tour-btn-primary:hover {
  @apply tw:[background:#1e293b];
  @apply tw:[border-color:#1e293b];
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
  .student-tour-tooltip {
    @apply tw:[max-width:calc(100vw_-_20px)];
    @apply tw:[padding:0.9rem];
    @apply tw:[border-radius:14px];
  }

  .student-tour-tooltip h3 {
    @apply tw:[font-size:1rem];
  }

  .student-tour-tooltip p {
    @apply tw:[font-size:0.86rem];
    @apply tw:[line-height:1.45];
  }

  .student-tour-actions {
    @apply tw:justify-stretch;
    @apply tw:[gap:0.45rem];
  }

  .student-tour-btn {
    @apply tw:[flex:1_1_calc(33.33%_-_0.35rem)];
    @apply tw:[min-height:40px];
    @apply tw:[padding:0.46rem_0.62rem];
    @apply tw:[font-size:0.78rem];
  }
}

/* Final student dark-mode layer: overrides legacy light surfaces and !important rules. */
body.student-dashboard .student-dashboard.student-theme-dark {
  @apply tw:[background:#0b120e]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar,
body.student-dashboard .student-dashboard.student-theme-dark .top-header {
  @apply tw:[background:#101a14]!;
  @apply tw:[border-color:#34483b]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link > span,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link-title,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar :is(.student-logo-text h2, .student-logo-text p, .nav-section-title, .user-info h5, .user-info p, .user-status) {
  @apply tw:[color:#b9c5bd]!;
  @apply tw:[-webkit-text-fill-color:#b9c5bd]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link:hover,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link.active,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link.router-link-active,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link.router-link-exact-active,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link-dropdown.is-expanded {
  @apply tw:[background:#1c2921]!;
  @apply tw:[border-color:#4f6d58]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_10px_24px_rgba(0,_0,_0,_0.24)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link:is(:hover, .active, .router-link-active, .router-link-exact-active) > span,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link-dropdown.is-expanded > span,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link:is(:hover, .active, .router-link-active, .router-link-exact-active) .nav-link-title,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link-dropdown.is-expanded .nav-link-title {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .nav-link i,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .nav-link.active i:not(.nav-link-caret-icon),
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .nav-link.router-link-active i:not(.nav-link-caret-icon) {
  @apply tw:[background:#26362b]!;
  @apply tw:[border-color:#4a6151]!;
  @apply tw:[color:#e8f0ea]!;
  @apply tw:[-webkit-text-fill-color:#e8f0ea]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .sidebar-footer .user-profile {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[box-shadow:none]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .header-actions :is(.header-tour-btn, .notification-bell[data-tour='notifications']) {
  @apply tw:[background:#1c2921]!;
  @apply tw:[border-color:#4a6151]!;
  @apply tw:[color:#f8fafc]!;
  @apply tw:[box-shadow:none]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .header-actions :is(.header-tour-btn, .notification-bell[data-tour='notifications']):hover {
  @apply tw:[background:#26362b]!;
  @apply tw:[border-color:#6b8974]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .header-actions :is(.header-tour-btn, .notification-bell[data-tour='notifications']) i {
  @apply tw:[background:transparent]!;
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(
  .premium-summary-card,
  .premium-panel,
  .premium-course-card,
  .premium-task,
  .premium-empty-state,
  .premium-results-list article,
  .grades-results-feed,
  .grades-premium-empty,
  .complete-grade-history,
  .strand-ranking-list > li,
  .strand-subject-evidence article,
  .pathway-milestone,
  .academic-progress-counts > span,
  .subject-score-pair > div,
  .period-grade-grid > span,
  .category-score-grid > span
) {
  @apply tw:[background:transparent]!;
  @apply tw:[border-color:#34483b]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:0_12px_30px_rgba(0,_0,_0,_0.22)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(
  .premium-summary-card__icon,
  .premium-summary-card__arrow,
  .premium-task__rail > span,
  .premium-course-card__metrics span,
  .premium-course-card__actions a,
  .premium-focus-stats > div,
  .grades-empty-guidance span
) {
  @apply tw:[background:#202f25]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#e2ebe4]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-panel {
  @apply tw:[background:#101913]!;
  @apply tw:[border-color:#405348]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-empty-state {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.03)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-empty-state__art {
  @apply tw:[background:linear-gradient(145deg,_#2c4032,_#203127)]!;
  @apply tw:[border:1px_solid_#6b8974]!;
  @apply tw:[color:#dff3d5]!;
  @apply tw:[box-shadow:0_12px_26px_rgba(0,_0,_0,_0.28)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-empty-state__art > i,
body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-empty-state__art > i::before {
  @apply tw:[color:#dff3d5]!;
  @apply tw:[-webkit-text-fill-color:#dff3d5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-empty-state .premium-eyebrow {
  @apply tw:[color:#b9dfa5]!;
  @apply tw:[-webkit-text-fill-color:#b9dfa5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-empty-state h3 {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-empty-state p {
  @apply tw:[color:#c4d0c7]!;
  @apply tw:[-webkit-text-fill-color:#c4d0c7]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-empty-state .empty-check {
  @apply tw:[border-color:#162019]!;
  @apply tw:[background:#4f8a35]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.visual-chip, .premium-text-link, .premium-button--soft) {
  @apply tw:[background:#202f25]!;
  @apply tw:[border-color:#496050]!;
  @apply tw:[color:#f1f5f2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.visual-chip, .premium-text-link, .premium-button--soft) :is(i, span) {
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[-webkit-text-fill-color:#f1f5f2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-summary-card::after {
  @apply tw:[opacity:0.2];
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.premium-summary-card__copy > span, .premium-summary-card__copy p, .premium-panel__header p, .premium-course-card__teacher, .premium-course-card__schedule) {
  @apply tw:[color:#aebdb2]!;
  @apply tw:[-webkit-text-fill-color:#aebdb2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.premium-summary-card__copy strong, .premium-task h3, .premium-course-card h3, .premium-panel h2, .premium-focus-card h2) {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.premium-task__progress > span, .premium-progress-track, .academic-progress-track, .subject-progress-track, .strand-fit-track) {
  @apply tw:[background:#2a3b30]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.visual-book, .pathway-progress-ring > div) {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#496050]!;
  @apply tw:[color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-focus-ring::before {
  @apply tw:[background:#162019]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-focus-ring {
  @apply tw:[background:conic-gradient(var(--leaf)_var(--focus-progress),_#2a3b30_0deg)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.premium-due-badge, .premium-result-count, .grades-result-count, .pathway-status) {
  @apply tw:[background:#26362b]!;
  @apply tw:[border-color:#496050]!;
  @apply tw:[color:#e4ede6]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.premium-task__chips span, .premium-task__progress small, .premium-focus-stats span, .premium-course-card__metrics span) {
  @apply tw:[color:#aebdb2]!;
  @apply tw:[-webkit-text-fill-color:#aebdb2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.complete-grade-history__table-wrap, .strand-ranking-section, .subject-performance-section) {
  @apply tw:[background:#101913]!;
  @apply tw:[border-color:#34483b]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard :is(.complete-grade-history tbody tr, .complete-grade-history th, .complete-grade-history td) {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#34483b]!;
}

body.student-dashboard .student-dashboard.student-theme-dark :is(.student-tour-tooltip, .confirm-dialog, .confirmation-modal, .join-class-modal, .exam-modal) {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f1f5f2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark :is(.account-menu-dropdown, .notification-dropdown) {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#405348]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown-actions :is(
  .notification-dropdown-clear,
  .notification-dropdown-close
) {
  @apply tw:[background:#203127]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#e7efe9]!;
  @apply tw:[box-shadow:none]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown-actions :is(
  .notification-dropdown-clear,
  .notification-dropdown-close
):hover:not(:disabled) {
  @apply tw:[background:#293d30]!;
  @apply tw:[border-color:#6b8974]!;
  @apply tw:[color:#ffffff]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown-actions :is(
  .notification-dropdown-clear,
  .notification-dropdown-close
) i,
body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown-actions :is(
  .notification-dropdown-clear,
  .notification-dropdown-close
) i::before {
  @apply tw:[color:#e7efe9]!;
  @apply tw:[-webkit-text-fill-color:#e7efe9]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown-actions .notification-dropdown-clear:disabled {
  @apply tw:[background:#1a2820]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#8fa096]!;
  @apply tw:[opacity:0.65]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-item {
  @apply tw:[background:#101913]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.03)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-item.unread {
  @apply tw:[box-shadow:0_10px_24px_rgba(0,_0,_0,_0.2)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-item.urgent {
  @apply tw:[background:#261f14]!;
  @apply tw:[border-color:#806739]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-item.clickable:hover,
body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-item.clickable:focus-visible {
  @apply tw:[background:#18251d]!;
  @apply tw:[border-color:#6b8974]!;
  @apply tw:[box-shadow:0_12px_28px_rgba(0,_0,_0,_0.26)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown :is(
  .user-notification-title,
  .user-notification-subject
) {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown :is(
  .user-notification-preview,
  .user-notification-meta,
  .user-notification-state,
  .empty-subtext
) {
  @apply tw:[color:#aebdb2]!;
  @apply tw:[-webkit-text-fill-color:#aebdb2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-icon {
  @apply tw:[background:#203127]!;
  @apply tw:[color:#b9dfa5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-icon i,
body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-icon i::before,
body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-chevron {
  @apply tw:[color:#b9dfa5]!;
  @apply tw:[-webkit-text-fill-color:#b9dfa5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-icon i.fa-book-open,
body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .user-notification-icon i.fa-book-open::before {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .notification-read-action {
  @apply tw:[background:#203127]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#dcefd2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .notification-dropdown .notification-read-action:hover {
  @apply tw:[background:#293d30]!;
  @apply tw:[border-color:#78a865]!;
}

/* Keep foreground content readable over every dark student surface. */
body.student-dashboard .student-dashboard.student-theme-dark .student-main :is(h1, h2, h3, h4, h5, h6, strong, label),
body.student-dashboard .student-dashboard.student-theme-dark .student-main :is(h1, h2, h3, h4, h5, h6, strong, label) * {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-main :is(p, small, .header-subtitle, .section-subtitle, .detail-label) {
  @apply tw:[color:#b9c5bd]!;
  @apply tw:[-webkit-text-fill-color:#b9c5bd]!;
}

body.student-dashboard .student-dashboard.student-theme-dark :is(.student-main, .student-sidebar, .top-header) span {
  @apply tw:[color:#dce7df]!;
  @apply tw:[-webkit-text-fill-color:#dce7df]!;
}

body.student-dashboard .student-dashboard.student-theme-dark :is(.account-menu-dropdown, .notification-dropdown, .student-tour-tooltip) span {
  @apply tw:[color:#dce7df]!;
  @apply tw:[-webkit-text-fill-color:#dce7df]!;
}

body.student-dashboard .student-dashboard.student-theme-dark :is(.student-main, .student-sidebar, .top-header) i,
body.student-dashboard .student-dashboard.student-theme-dark :is(.student-main, .student-sidebar, .top-header) i::before {
  @apply tw:[color:#eaf2ec]!;
  @apply tw:[-webkit-text-fill-color:#eaf2ec]!;
}

/* Keep light active controls readable when the dashboard is using the dark theme. */
body.student-dashboard .student-dashboard.student-theme-dark .student-main .settings-nav-item.active,
body.student-dashboard .student-dashboard.student-theme-dark .student-main .settings-nav-item.active :is(span, i, i::before) {
  @apply tw:[color:#1e4307]!;
  @apply tw:[-webkit-text-fill-color:#1e4307]!;
}

/* Preserve dark foregrounds on the security panel's intentionally light surfaces. */
body.student-dashboard .student-dashboard.student-theme-dark .student-main :is(
  .security-pill-shield,
  .security-pill-strong,
  .password-side-count,
  .strength-badge,
  .password-side-tip
),
body.student-dashboard .student-dashboard.student-theme-dark .student-main :is(
  .security-pill-shield,
  .security-pill-strong,
  .password-side-count,
  .strength-badge,
  .password-side-tip
) :is(span, i, i::before) {
  @apply tw:[color:#1e4307]!;
  @apply tw:[-webkit-text-fill-color:#1e4307]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-main :is(
  .security-pill-idle,
  .security-field-label small,
  .strength-percent,
  .password-action-note
),
body.student-dashboard .student-dashboard.student-theme-dark .student-main :is(
  .security-pill-idle,
  .security-field-label small
) :is(i, i::before) {
  @apply tw:[color:#475569]!;
  @apply tw:[-webkit-text-fill-color:#475569]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-pill-medium,
body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-pill-medium :is(i, i::before) {
  @apply tw:[color:#b45309]!;
  @apply tw:[-webkit-text-fill-color:#b45309]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-pill-weak,
body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-pill-weak :is(i, i::before) {
  @apply tw:[color:#b91c1c]!;
  @apply tw:[-webkit-text-fill-color:#b91c1c]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-form-banner-copy strong {
  @apply tw:[color:#0f172a]!;
  @apply tw:[-webkit-text-fill-color:#0f172a]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-form-banner-copy p {
  @apply tw:[color:#475569]!;
  @apply tw:[-webkit-text-fill-color:#475569]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-card .toggle-password,
body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-card .toggle-password :is(i, i::before) {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-card .toggle-password {
  @apply tw:[background:#365b0d]!;
  @apply tw:[border-color:#5f7418]!;
  @apply tw:opacity-100!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-main .security-card .toggle-password:hover {
  @apply tw:[background:#4b7018]!;
  @apply tw:[border-color:#7d942d]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-hero :is(h1, h2, h3, p, span, strong, i, i::before),
body.student-dashboard .student-dashboard.student-theme-dark :is(.premium-button, .pathway-primary-button, .grades-primary-button) :is(span, strong, i, i::before) {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

body.student-dashboard .student-dashboard.student-theme-dark :is(.notification-count, .status-indicator, .premium-status--danger, .premium-status--warning, .premium-status--success) {
  @apply tw:[-webkit-text-fill-color:currentColor]!;
}

body.student-dashboard .student-dashboard.student-theme-dark :is(.notification-count, .premium-button, .pathway-primary-button, .grades-primary-button, .btn-primary) span {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

/* Dark icon tiles: override the legacy white navigation and course icon boxes. */
body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-course-card .premium-course-card__banner .premium-course-card__icon {
  @apply tw:[background:#18261d]!;
  @apply tw:[border:1px_solid_#6f8c76]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_8px_18px_rgba(0,_0,_0,_0.28)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-course-card .premium-course-card__banner .premium-course-card__icon i,
body.student-dashboard .student-dashboard.student-theme-dark .premium-dashboard .premium-course-card .premium-course-card__banner .premium-course-card__icon i::before {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link > i,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link .nav-link-main > i {
  @apply tw:[background:transparent]!;
  @apply tw:[border:1px_solid_#526b59]!;
  @apply tw:[color:#f4f8f5]!;
  @apply tw:[-webkit-text-fill-color:#f4f8f5]!;
  @apply tw:[box-shadow:none]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link > i::before,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link .nav-link-main > i::before {
  @apply tw:[color:#f4f8f5]!;
  @apply tw:[-webkit-text-fill-color:#f4f8f5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link > span,
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-section .nav-link .nav-link-title {
  @apply tw:[color:#e3ece6]!;
  @apply tw:[-webkit-text-fill-color:#e3ece6]!;
}

/* Student Profile dark-mode surfaces and form contrast. */
body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content :is(
  .profile-card,
  .profile-details-card,
  .profile-tab-content
) {
  @apply tw:[background:linear-gradient(180deg,_#162019_0%,_#121c16_100%)_padding-box,_____linear-gradient(135deg,_#405348_0%,_#668b59_52%,_#405348_100%)_border-box]!;
  @apply tw:[border-color:transparent]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:0_18px_38px_rgba(0,_0,_0,_0.26)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-header,
body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-details-card .detail-item {
  @apply tw:[border-color:#34483b]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content :is(
  .profile-info h2,
  .details-title,
  .tab-header h3,
  .form-section-title,
  .detail-value
) {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content :is(
  .profile-role,
  .profile-status,
  .detail-label,
  .tab-header p,
  .form-group label
) {
  @apply tw:[color:#aebdb2]!;
  @apply tw:[-webkit-text-fill-color:#aebdb2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-details-card .detail-icon {
  @apply tw:[background:#203127]!;
  @apply tw:[border:1px_solid_#405348]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-details-card .detail-icon i,
body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-details-card .detail-icon i::before {
  @apply tw:[color:#b9dfa5]!;
  @apply tw:[-webkit-text-fill-color:#b9dfa5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-form-section {
  @apply tw:[background:#101913]!;
  @apply tw:[border-color:#34483b]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content :is(
  .form-group input,
  .form-group select,
  .form-group textarea
) {
  @apply tw:[background:#0e1711]!;
  @apply tw:[border-color:#506157]!;
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content :is(
  .form-group input:read-only,
  .form-group textarea:read-only,
  .form-group select:disabled
) {
  @apply tw:[background:#111b15]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#dce7df]!;
  @apply tw:[-webkit-text-fill-color:#dce7df]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content :is(
  .form-group input,
  .form-group select,
  .form-group textarea
):focus {
  @apply tw:[border-color:#78a865]!;
  @apply tw:[box-shadow:0_0_0_3px_rgba(120,_168,_101,_0.18)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-actions .btn-outline {
  @apply tw:[color:#dce7df]!;
  @apply tw:[-webkit-text-fill-color:#dce7df]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-actions .btn-outline:hover {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-actions .btn-outline i,
body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-actions .btn-outline i::before {
  @apply tw:[color:#b9dfa5]!;
  @apply tw:[-webkit-text-fill-color:#b9dfa5]!;
}

/* Grade Results dark-mode contrast. */
body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-back-button {
  @apply tw:[background:#1b2a20]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#f4f8f5]!;
  @apply tw:[-webkit-text-fill-color:#f4f8f5]!;
  @apply tw:[box-shadow:none]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-back-button:hover {
  @apply tw:[background:#294032]!;
  @apply tw:[border-color:#779580]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-stat-card {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:0_10px_26px_rgba(0,_0,_0,_0.22)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-stat-card:hover {
  @apply tw:[background:#1b2a20]!;
  @apply tw:[border-color:#6b8974]!;
  @apply tw:[box-shadow:0_16px_32px_rgba(0,_0,_0,_0.28)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-stat-card > div > span {
  @apply tw:[color:#b9c8bd]!;
  @apply tw:[-webkit-text-fill-color:#b9c8bd]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-stat-card strong {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-stat-card small {
  @apply tw:[color:#9fafa4]!;
  @apply tw:[-webkit-text-fill-color:#9fafa4]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-stat-card__icon {
  @apply tw:[background:#203127]!;
  @apply tw:[border:1px_solid_#526b59]!;
  @apply tw:[color:#f4f8f5]!;
  @apply tw:[-webkit-text-fill-color:#f4f8f5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-stat-card__icon :is(i, i::before) {
  @apply tw:[color:#f4f8f5]!;
  @apply tw:[-webkit-text-fill-color:#f4f8f5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-stat-card::after {
  @apply tw:[background:#294032]!;
  @apply tw:[opacity:0.64]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-visual-sheet {
  @apply tw:[background:#1b2a20]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#eef5f0]!;
  @apply tw:[box-shadow:0_22px_45px_rgba(0,_0,_0,_0.32)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .grades-visual-badge {
  @apply tw:[background:#315a3c]!;
  @apply tw:[border-color:#162019]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .complete-grade-history thead th {
  @apply tw:[background:#101913]!;
  @apply tw:[color:#b9c8bd]!;
  @apply tw:[-webkit-text-fill-color:#b9c8bd]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .complete-grade-history tbody :is(th, td, strong) {
  @apply tw:[color:#edf4ef]!;
  @apply tw:[-webkit-text-fill-color:#edf4ef]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-grades-panel .complete-grade-history tbody small {
  @apply tw:[color:#aebdb2]!;
  @apply tw:[-webkit-text-fill-color:#aebdb2]!;
}

/* Recommendation Progress dark-mode contrast. */
body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-back-button {
  @apply tw:[background:#1b2a20]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#f4f8f5]!;
  @apply tw:[-webkit-text-fill-color:#f4f8f5]!;
  @apply tw:[box-shadow:none]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-back-button:hover {
  @apply tw:[background:#294032]!;
  @apply tw:[border-color:#779580]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel :is(
  .pathway-stat-card,
  .academic-progress-overview,
  .strand-ranking-section,
  .subject-performance-section,
  .recommendation-ranking-section,
  .pathway-loading
) {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:0_10px_26px_rgba(0,_0,_0,_0.2)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-stat-card:hover {
  @apply tw:[background:#1b2a20]!;
  @apply tw:[border-color:#6b8974]!;
  @apply tw:[box-shadow:0_15px_30px_rgba(0,_0,_0,_0.26)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-stat-card > div > span {
  @apply tw:[color:#b9c8bd]!;
  @apply tw:[-webkit-text-fill-color:#b9c8bd]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-stat-card strong {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-stat-card small {
  @apply tw:[color:#9fafa4]!;
  @apply tw:[-webkit-text-fill-color:#9fafa4]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel :is(
  .subject-performance-card,
  .strand-ranking-list > li,
  .strand-subject-evidence article,
  .academic-ranking-list li
) {
  @apply tw:[background:#101913]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:none]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .strand-ranking-list > li.is-top-strand {
  @apply tw:[background:#18271d]!;
  @apply tw:[border-color:#668b59]!;
  @apply tw:[box-shadow:0_10px_24px_rgba(0,_0,_0,_0.2)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel :is(
  .academic-progress-counts > span,
  .subject-score-pair > div,
  .period-grade-grid > span,
  .category-score-grid > span
) {
  @apply tw:[background:#1b2a20]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#b9c8bd]!;
  @apply tw:[box-shadow:none]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .period-grade-grid > span.is-final {
  @apply tw:[background:#203127]!;
  @apply tw:[border-color:#668b59]!;
  @apply tw:[color:#cde6c0]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel :is(
  .academic-progress-counts,
  .subject-score-pair,
  .period-grade-grid,
  .category-score-grid
) strong {
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[-webkit-text-fill-color:#f1f5f2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .recommendation-highlight-grid .strength {
  @apply tw:[background:#17271d]!;
  @apply tw:[border-color:#496b50]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .recommendation-highlight-grid .priority {
  @apply tw:[background:#281b1b]!;
  @apply tw:[border-color:#704848]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel :is(
  .recommendation-highlight-grid span,
  .recommendation-highlight-grid p,
  .subject-formula,
  .subject-performance-section > header p,
  .strand-ranking-section > header > p,
  .strand-rank-name small,
  .strand-rank-score span,
  .strand-subject-evidence article small,
  .academic-ranking-list small,
  .academic-ranking-list em
) {
  @apply tw:[color:#aebdb2]!;
  @apply tw:[-webkit-text-fill-color:#aebdb2]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel :is(
  .recommendation-highlight-grid strong,
  .subject-performance-head > div strong,
  .strand-rank-name strong,
  .strand-rank-score strong,
  .strand-subject-evidence article strong,
  .academic-ranking-list span
) {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .strand-ranking-list details {
  @apply tw:[border-color:#34483b]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .strand-ranking-list summary,
body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .strand-ranking-list summary i {
  @apply tw:[color:#b9dfa5]!;
  @apply tw:[-webkit-text-fill-color:#b9dfa5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel :is(.pathway-stat-card__icon, .pathway-milestone__icon) {
  @apply tw:[background:#203127]!;
  @apply tw:[border:1px_solid_#526b59]!;
  @apply tw:[color:#f4f8f5]!;
  @apply tw:[-webkit-text-fill-color:#f4f8f5]!;
  @apply tw:[box-shadow:none]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel :is(.pathway-stat-card__icon, .pathway-milestone__icon) :is(i, i::before) {
  @apply tw:[color:#f4f8f5]!;
  @apply tw:[-webkit-text-fill-color:#f4f8f5]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-primary-button {
  @apply tw:[background:#315a3c]!;
  @apply tw:[border:1px_solid_#6f8c76]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-primary-button:hover {
  @apply tw:[background:#3e704b]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-progress-ring {
  @apply tw:[background:conic-gradient(#74a85f_var(--pathway-progress),_#2a3b30_0deg)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .pathway-progress-ring::before {
  @apply tw:[background:#101913]!;
  @apply tw:[box-shadow:inset_0_0_0_1px_#405348]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .subject-performance-head > span {
  @apply tw:[background:#24352a]!;
  @apply tw:[border:1px_solid_#526b59]!;
  @apply tw:[color:#e7efe9]!;
  @apply tw:[-webkit-text-fill-color:#e7efe9]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .premium-pathway-panel .academic-progress-counts > span {
  @apply tw:[background:#1b2a20]!;
  @apply tw:[border-color:#405348]!;
}

/* Active dashboard submenu uses a light surface, so keep every label dark. */
body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-sublink.active {
  @apply tw:[background:#edf5e2]!;
  @apply tw:[border-color:#bfd399]!;
  @apply tw:[color:#1e4307]!;
  @apply tw:[box-shadow:0_8px_18px_rgba(0,_0,_0,_0.2)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-sublink.active::before {
  @apply tw:[background:#365b0d]!;
  @apply tw:[box-shadow:0_0_0_3px_rgba(54,_91,_13,_0.18)]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-sublink.active .nav-sublink-title {
  @apply tw:[color:#1e4307]!;
  @apply tw:[-webkit-text-fill-color:#1e4307]!;
  @apply tw:opacity-100!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-sidebar .sidebar-nav .nav-sublink.active .nav-sublink-caption {
  @apply tw:[color:#475569]!;
  @apply tw:[-webkit-text-fill-color:#475569]!;
  @apply tw:opacity-100!;
}

/* Keep the profile editor canvas consistent with its dark form sections. */
body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-main .profile-tab-content,
body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-main .profile-tab-content .tab-pane.active {
  @apply tw:[background:#152019]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-main .tab-header h3 {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

body.student-dashboard .student-dashboard.student-theme-dark .student-dashboard-page > .profile-content .profile-main .tab-header p {
  @apply tw:[color:#b9c5bd]!;
  @apply tw:[-webkit-text-fill-color:#b9c5bd]!;
  @apply tw:opacity-100!;
}


</style>

