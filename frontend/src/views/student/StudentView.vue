<template>
  <div class="student-dashboard" :class="{ 'sidebar-open': isSidebarOpen, 'no-route-sidebar': shouldHideSidebar }">
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
          <div class="nav-group" :class="{ open: isDashboardMenuExpanded }">
            <router-link
              to="/student/dashboard"
              class="nav-link nav-link-group"
              :class="{ active: isActiveRoute('/student/dashboard') }"
              @click="closeSidebar"
            >
              <span class="nav-link-main">
                <i class="fas fa-home"></i>
                <span>Dashboard</span>
              </span>
              <span
                class="nav-group-toggle"
                :class="{ active: isDashboardMenuExpanded }"
                :aria-expanded="isDashboardMenuExpanded ? 'true' : 'false'"
                aria-controls="student-dashboard-submenu"
                aria-label="Toggle dashboard menu"
                role="button"
                tabindex="0"
                @click.stop.prevent="toggleDashboardMenu"
                @keydown.enter.stop.prevent="toggleDashboardMenu"
                @keydown.space.stop.prevent="toggleDashboardMenu"
              >
                <i class="fas fa-chevron-down"></i>
              </span>
            </router-link>
            <transition name="nav-submenu">
              <div v-if="isDashboardMenuExpanded" id="student-dashboard-submenu" class="nav-submenu">
                <button type="button" class="nav-sublink" :class="{ active: isDashboardSectionActive('grades') }" @click="openDashboardSection('grades')">
                  <span class="nav-sublink-copy">
                    <span class="nav-sublink-label">Grades</span>
                    <small>Recent results</small>
                  </span>
                </button>
                <button
                  type="button"
                  class="nav-sublink"
                  :class="{ active: isDashboardSectionActive('recommendations') }"
                  @click="openDashboardSection('recommendations')"
                >
                  <span class="nav-sublink-copy">
                    <span class="nav-sublink-label">Recommendations</span>
                    <small>Recommendation progress</small>
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
              class="header-tour-btn"
              data-tour="help-button"
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
                    <button type="button" class="notification-dropdown-close" @click="closeNotificationsPanel" aria-label="Close notifications">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <UserNotificationList :notifications="notifications" :loading="isNotificationsLoading" />
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

    const {
      notifications,
      unreadCount: unreadNotificationCount,
      isLoading: isNotificationsLoading,
      showNotificationsPanel,
      toggleNotificationsPanel,
      closeNotificationsPanel,
      clearAllNotifications,
    } = useUserNotifications({ limit: 8, pollIntervalMs: 15000 })
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
        description: 'Use this navigation menu to move between your Dashboard, Lessons, and Activities.',
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
        title: 'Activities Page',
        description: 'Activities is where you find tasks and assessments assigned by your teacher and continue work that is already in progress.',
        selector: '[data-tour="student-activities-table"]',
        route: '/student/activities'
      },
      {
        key: 'activity-details',
        title: 'Activity Details',
        description: 'Open an activity to review its details, deadline, progress, and lesson connection before starting or continuing it.',
        selector: '[data-tour="student-activity-detail"]',
        route: '/student/activities',
        action: 'open-first-assessment'
      },
      {
        key: 'assessment-page',
        title: 'Assessment or Challenge Page',
        description: 'Start an activity here to answer questions and submit your work. Some assessments may use timers or full-screen mode to help you stay focused.',
        selector: '[data-tour="student-activity-start"]',
        route: '/student/activities',
        action: 'open-first-assessment'
      },
      {
        key: 'finish',
        title: 'You Are Ready to Begin',
        description: 'Start exploring your lessons and completing activities. You can restart this tour anytime using the Help or Tour Guide button.',
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
body.student-tour-open {
  overflow: hidden;
}

body.student-dashboard .student-dashboard.no-route-sidebar .student-main {
  margin-left: 0 !important;
}

body.student-dashboard .dashboard-home-btn {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  padding: 0 !important;
}

.account-menu {
  position: relative;
}

.account-menu-trigger {
  box-shadow: none;
}

.account-menu-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 190px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14);
  display: grid;
  gap: 6px;
  z-index: 80;
}

.account-menu-dropdown::before {
  content: "";
  position: absolute;
  top: -7px;
  right: 18px;
  width: 14px;
  height: 14px;
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid rgba(148, 163, 184, 0.22);
  border-left: 1px solid rgba(148, 163, 184, 0.22);
  transform: rotate(45deg);
}

.account-menu-item {
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  color: #0f172a;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.account-menu-item i {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #334155;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.account-menu-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.account-menu-item.danger {
  color: #b91c1c;
}

.account-menu-item.danger i {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.account-menu-item.danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
}

.student-tour-layer {
  position: fixed;
  inset: 0;
  z-index: 4000;
  pointer-events: none;
}

.student-tour-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: none;
}

.student-tour-spotlight {
  position: fixed;
  border-radius: 16px;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.58);
  border: 2px solid rgba(255, 255, 255, 0.95);
  transition: top 0.24s ease, left 0.24s ease, width 0.24s ease, height 0.24s ease;
  pointer-events: none;
}

.student-tour-tooltip {
  position: fixed;
  z-index: 4002;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  padding: 1rem 1.05rem;
  pointer-events: auto;
  transition: left 0.24s ease, top 0.24s ease, width 0.24s ease;
  overflow-y: auto;
}

.student-tour-step {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.student-tour-tooltip h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.25;
  font-weight: 700;
}

.student-tour-tooltip p {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.45;
}

.student-tour-actions {
  margin-top: 0.9rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.student-tour-btn {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.42rem 0.72rem;
  cursor: pointer;
}

.student-tour-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.student-tour-btn-ghost {
  background: #ffffff;
  color: #334155;
}

.student-tour-btn-ghost:hover:not(:disabled) {
  background: #f8fafc;
}

.student-tour-btn-primary {
  border-color: #0f172a;
  background: #0f172a;
  color: #ffffff;
}

.student-tour-btn-primary:hover {
  background: #1e293b;
  border-color: #1e293b;
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
  .student-tour-tooltip {
    max-width: calc(100vw - 20px);
    padding: 0.9rem;
    border-radius: 14px;
  }

  .student-tour-tooltip h3 {
    font-size: 1rem;
  }

  .student-tour-tooltip p {
    font-size: 0.86rem;
    line-height: 1.45;
  }

  .student-tour-actions {
    justify-content: stretch;
    gap: 0.45rem;
  }

  .student-tour-btn {
    flex: 1 1 calc(33.33% - 0.35rem);
    min-height: 40px;
    padding: 0.46rem 0.62rem;
    font-size: 0.78rem;
  }
}

</style>

