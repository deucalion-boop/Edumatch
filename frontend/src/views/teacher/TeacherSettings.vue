<template>
  <div class="teacher-dashboard">
    <main class="teacher-main">
      <header class="top-header" data-tour="settings-header">
        <div class="header-content">
          <div class="header-left">
            <div>
              <h1>Settings</h1>
              <p class="header-subtitle">Manage account and communication preferences.</p>
            </div>
          </div>
          <div class="header-actions">
            <div class="header-right-controls">
            <button
              type="button"
              class="header-tour-btn dashboard-home-btn"
              aria-label="Home Dashboard"
              title="Home Dashboard"
              @click="router.push('/teacher/dashboard')"
            >
              <i class="fas fa-home"></i>
            </button>
            <button
              type="button"
              class="header-tour-btn"
              @click="launchManualTour"
              aria-label="Help and tour"
              title="Help / Tour"
            >
              <i class="fas fa-question-circle"></i>
            </button>
            <div ref="notificationMenuRef" class="notification-menu">
              <button type="button" class="notification-bell" @click="toggleNotificationsPanel" aria-label="Notifications" :aria-expanded="showNotificationsPanel ? 'true' : 'false'">
                <i class="fas fa-bell"></i>
                <span v-if="unreadNotificationCount > 0" class="notification-count">{{ unreadNotificationCount }}</span>
              </button>
              <div v-if="showNotificationsPanel" class="notification-dropdown">
                <div class="notification-dropdown-header">
                  <h3>Notifications</h3>
                  <div class="notification-dropdown-actions">
                    <button type="button" class="notification-dropdown-clear" :disabled="notifications.length === 0" @click="clearAllNotifications">
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
      <div>
        <section v-if="toast.show" class="settings-toast" :class="`toast-${toast.type}`">
          <i class="fas" :class="toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'"></i>
          <span>{{ toast.message }}</span>
        </section>

        <div class="settings-grid">
          <section class="settings-panel teacher-security-panel" data-tour="settings-security-section">
            <div class="panel-header teacher-security-panel-header">
              <div class="teacher-security-panel-copy">
                <h3>Account Security</h3>
                <p>Update your password and protect your account with stronger security controls.</p>
              </div>
              <div class="teacher-security-pills" aria-label="Security overview">
                <span class="teacher-security-pill teacher-security-pill-shield">
                  <i class="fas fa-shield-alt"></i>
                  Protected account
                </span>
                <span class="teacher-security-pill" :class="`teacher-security-pill-${passwordStrengthTone}`">
                  <i class="fas" :class="passwordStrengthIcon"></i>
                  {{ passwordRulesMetCount }}/{{ passwordRuleItems.length }} checks
                </span>
              </div>
            </div>

            <div class="teacher-security-card">
              <form class="panel-form teacher-security-form" @submit.prevent="saveSecuritySettings">
                <div class="teacher-security-main">
                  <div class="teacher-security-banner">
                    <div class="teacher-security-banner-icon">
                      <i class="fas fa-lock"></i>
                    </div>
                    <div class="teacher-security-banner-copy">
                      <strong>Create a stronger password</strong>
                      <p>Use a unique mix of letters, numbers, and symbols to better protect your teacher account.</p>
                    </div>
                  </div>

                  <div class="field-group teacher-security-field-group">
                    <label for="security-current-password" class="teacher-security-field-label">
                      <span>Current Password</span>
                      <small>Required</small>
                    </label>
                    <div class="password-wrap">
                      <input :type="showCurrentPassword ? 'text' : 'password'" id="security-current-password" v-model="securityForm.currentPassword" class="settings-input" placeholder="Enter current password">
                      <button type="button" class="password-toggle" @click="showCurrentPassword = !showCurrentPassword">
                        <i class="fas" :class="showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                      </button>
                    </div>
                    <p class="teacher-security-field-help">Enter your existing password so we can verify the change securely.</p>
                    <small v-if="validationErrors.currentPassword" class="field-error teacher-security-error">{{ validationErrors.currentPassword }}</small>
                  </div>

                  <div class="field-group teacher-security-field-group">
                    <label for="security-new-password" class="teacher-security-field-label">
                      <span>New Password</span>
                      <small>Live feedback</small>
                    </label>
                    <div class="password-wrap">
                      <input :type="showNewPassword ? 'text' : 'password'" id="security-new-password" v-model="securityForm.newPassword" class="settings-input" placeholder="Enter new password">
                      <button type="button" class="password-toggle" @click="showNewPassword = !showNewPassword">
                        <i class="fas" :class="showNewPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                      </button>
                    </div>
                    <p class="teacher-security-field-help">Use 8 or more characters with uppercase, lowercase, a number, and a symbol.</p>
                    <small v-if="validationErrors.newPassword" class="field-error teacher-security-error">{{ validationErrors.newPassword }}</small>
                  </div>

                  <div class="field-group teacher-security-field-group">
                    <label for="security-confirm-password" class="teacher-security-field-label">
                      <span>Confirm New Password</span>
                      <small>Match exactly</small>
                    </label>
                    <div class="password-wrap">
                      <input :type="showConfirmPassword ? 'text' : 'password'" id="security-confirm-password" v-model="securityForm.confirmPassword" class="settings-input" placeholder="Re-enter new password">
                      <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                        <i class="fas" :class="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                      </button>
                    </div>
                    <div v-if="securityForm.confirmPassword" class="teacher-security-match" :class="{ valid: passwordsMatch }">
                      <i class="fas" :class="passwordsMatch ? 'fa-check' : 'fa-times'"></i>
                      <span>{{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}</span>
                    </div>
                    <p class="teacher-security-field-help">Re-enter the new password exactly as typed above.</p>
                    <small v-if="validationErrors.confirmPassword" class="field-error teacher-security-error">{{ validationErrors.confirmPassword }}</small>
                  </div>

                  <div class="panel-actions teacher-security-actions">
                    <p class="teacher-security-action-note">{{ passwordActionMessage }}</p>
                    <button type="submit" class="btn btn-primary teacher-security-submit" :disabled="!isSecurityFormReady">
                      <i class="fas fa-shield-alt"></i>
                      Update Password
                    </button>
                  </div>
                </div>

                <aside class="teacher-security-side" aria-label="Password guidance">
                  <div class="teacher-security-side-header">
                    <div>
                      <span class="teacher-security-side-eyebrow">Live checklist</span>
                      <h5>Password guidance</h5>
                    </div>
                    <span class="teacher-security-side-count">{{ passwordRulesMetCount }}/{{ passwordRuleItems.length }}</span>
                  </div>

                  <div class="teacher-security-strength-card" :class="`strength-card-${passwordStrengthTone}`">
                    <div class="teacher-security-strength-header">
                      <span class="teacher-security-strength-badge">{{ passwordStrengthText }}</span>
                      <span class="teacher-security-strength-percent">{{ passwordStrengthPercent }}%</span>
                    </div>
                    <div class="teacher-security-strength">
                      <div class="teacher-security-strength-bar">
                        <div
                          class="teacher-security-strength-fill"
                          :class="passwordStrengthClass"
                          :style="{ width: `${passwordStrengthPercent}%` }"
                        ></div>
                      </div>
                      <div class="teacher-security-strength-text">
                        {{ passwordStrengthSummary }}
                      </div>
                    </div>
                  </div>

                  <div class="teacher-security-rules-card">
                    <p>Password must contain:</p>
                    <ul class="password-rules teacher-password-rules">
                      <li v-for="rule in passwordRuleItems" :key="rule.key" :class="{ met: rule.met }">
                        <i class="fas" :class="rule.met ? 'fa-check-circle' : 'fa-circle'"></i>
                        <span>{{ rule.label }}</span>
                      </li>
                    </ul>
                  </div>

                  <p class="teacher-security-tip">
                    <i class="fas fa-shield-alt"></i>
                    Avoid using your name, school details, birthday, or previously used passwords.
                  </p>
                </aside>
              </form>
            </div>
          </section>

        </div>
      </div>

      <div v-if="isTourActive" class="teacher-page-tour-layer" aria-live="polite">
        <div class="teacher-page-tour-backdrop"></div>
        <div v-if="tourSpotlightStyle" class="teacher-page-tour-spotlight" :style="tourSpotlightStyle"></div>
        <section
          class="teacher-page-tour-tooltip"
          :style="tourTooltipStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="`Settings tour step ${tourStepIndex + 1} of ${tourSteps.length}`"
        >
          <p class="teacher-page-tour-step">Step {{ tourStepIndex + 1 }} of {{ tourSteps.length }}</p>
          <h3>{{ activeTourStep?.title }}</h3>
          <p>{{ activeTourStep?.description }}</p>
          <div class="teacher-page-tour-actions">
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-ghost" @click="skipTour">Skip</button>
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-ghost" :disabled="tourStepIndex === 0" @click="goToPreviousTourStep">Back</button>
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-primary" @click="goToNextTourStep">
              {{ isLastTourStep ? 'Finish' : 'Next' }}
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import UserNotificationList from '../../components/UserNotificationList.vue'
import { useUserNotifications } from '../../composables/useUserNotifications.js'

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
const TOUR_STORAGE_PREFIX = 'edumatch_teacher_has_seen_tour_'
const PAGE_TOUR_KEY = 'teacher_journey_v2'
const CURRENT_PAGE_ROUTE = '/teacher/settings'
const TOUR_ROUTE_ORDER = ['/teacher/dashboard', '/teacher/records', '/teacher/students', '/teacher/activities', '/teacher/profile', '/teacher/settings']
const TOUR_PROGRESS_PREFIX = 'edumatch_teacher_tour_progress_'
const SIDEBAR_BREAKPOINT = 1024
const SIDEBAR_WIDTH = 280

const {
  notifications,
  unreadCount: unreadNotificationCount,
  isLoading: isNotificationsLoading,
  showNotificationsPanel,
  toggleNotificationsPanel,
  closeNotificationsPanel,
  clearAllNotifications,
} = useUserNotifications({ limit: 8, pollIntervalMs: 15000 })
const settings = reactive({
  fullName: '',
  email: '',
  contactNumber: '',
  emailAlerts: true,
  inAppAlerts: true,
  twoFactor: false,
  passwordUpdatedAt: 'Not set'
})
const profileForm = reactive({
  displayName: '',
  email: '',
  contactNumber: ''
})
const securityForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const validationErrors = reactive({
  displayName: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const toast = reactive({
  show: false,
  type: 'success',
  message: ''
})
let toastTimer = null

const tourSteps = [
  {
    key: 'settings-header',
    title: 'Settings Overview',
    description: 'Settings contains configurable teacher options for communication, security, and account control.',
    selector: '[data-tour="settings-header"]'
  },
  {
    key: 'security',
    title: 'Security Options',
    description: 'Update your password and strengthen account protection.',
    selector: '[data-tour="settings-security-section"]'
  }
]
const activeTourStep = computed(() => tourSteps[tourStepIndex.value] || null)
const isLastTourStep = computed(() => tourStepIndex.value >= tourSteps.length - 1)

const displayName = computed(() => settings.fullName || 'Teacher')
const teacherFullName = computed(() => displayName.value)
const teacherRole = computed(() => {
  const role = String(authStore.user?.role || 'teacher').trim().toLowerCase()
  if (!role) return 'Teacher'
  return role.charAt(0).toUpperCase() + role.slice(1)
})
const teacherStatus = computed(() => String(authStore.user?.status || 'Online').trim() || 'Online')
const teacherAvatarUrl = computed(() => {
  const profileImage = String(authStore.user?.profileImage || '').trim()
  if (profileImage) return profileImage
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=334155&color=fff`
})

const isActiveRoute = (path) => route.path === path || route.path.startsWith(`${path}/`)
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }
const syncMobileMenuBodyState = () => {
  if (typeof window === 'undefined') return
  const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
  document.body.classList.toggle('teacher-mobile-menu-open', shouldLockBody)
}
const passwordRules = computed(() => {
  const password = String(securityForm.newPassword || '')
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  }
})
const passwordRuleItems = computed(() => [
  { key: 'minLength', label: 'At least 8 characters', met: passwordRules.value.minLength },
  { key: 'hasUpper', label: 'One uppercase letter', met: passwordRules.value.hasUpper },
  { key: 'hasLower', label: 'One lowercase letter', met: passwordRules.value.hasLower },
  { key: 'hasNumber', label: 'One number', met: passwordRules.value.hasNumber },
  { key: 'hasSpecial', label: 'One special character', met: passwordRules.value.hasSpecial }
])
const passwordRulesMetCount = computed(() => passwordRuleItems.value.filter((rule) => rule.met).length)
const hasStrongPassword = computed(() => Object.values(passwordRules.value).every(Boolean))
const passwordsMatch = computed(() => String(securityForm.newPassword || '') === String(securityForm.confirmPassword || ''))
const passwordStrengthClass = computed(() => {
  if (!String(securityForm.newPassword || '')) return 'strength-none'
  if (passwordRulesMetCount.value <= 2) return 'strength-weak'
  if (passwordRulesMetCount.value <= 4) return 'strength-medium'
  return 'strength-strong'
})
const passwordStrengthText = computed(() => {
  if (!String(securityForm.newPassword || '')) return 'Not started'
  if (passwordRulesMetCount.value <= 2) return 'Weak'
  if (passwordRulesMetCount.value <= 4) return 'Medium'
  return 'Strong'
})
const passwordStrengthTone = computed(() => {
  if (!String(securityForm.newPassword || '')) return 'idle'
  if (passwordRulesMetCount.value <= 2) return 'weak'
  if (passwordRulesMetCount.value <= 4) return 'medium'
  return 'strong'
})
const passwordStrengthIcon = computed(() => {
  const iconByTone = {
    idle: 'fa-circle',
    weak: 'fa-circle',
    medium: 'fa-bolt',
    strong: 'fa-shield-alt'
  }
  return iconByTone[passwordStrengthTone.value] || 'fa-circle'
})
const passwordStrengthPercent = computed(() => Math.round((passwordRulesMetCount.value / passwordRuleItems.value.length) * 100))
const passwordStrengthSummary = computed(() => {
  if (!String(securityForm.newPassword || '')) {
    return 'Start typing a new password to see its live security rating.'
  }
  if (passwordRulesMetCount.value === passwordRuleItems.value.length) {
    return 'Strong password. You are meeting every current requirement.'
  }
  if (passwordRulesMetCount.value >= 4) {
    return 'Almost ready. Complete the final checks to make this password stronger.'
  }
  if (passwordRulesMetCount.value >= 1) {
    return 'Good start. Add more variety to improve your password strength.'
  }
  return 'Use a mix of letters, numbers, and symbols to increase password strength.'
})
const passwordActionMessage = computed(() => {
  if (!String(securityForm.currentPassword || '').trim()) {
    return 'Enter your current password to continue.'
  }
  if (!String(securityForm.newPassword || '')) {
    return 'Create a new password to begin the security check.'
  }
  if (!String(securityForm.confirmPassword || '')) {
    return 'Re-enter the new password to confirm it.'
  }
  if (!passwordsMatch.value) {
    return 'The confirmation password must match exactly.'
  }
  if (passwordRulesMetCount.value < passwordRuleItems.value.length) {
    const remaining = passwordRuleItems.value.length - passwordRulesMetCount.value
    return `Complete ${remaining} more requirement${remaining === 1 ? '' : 's'} to enable the update.`
  }
  return 'Everything looks ready. You can update your password now.'
})
const isSecurityFormReady = computed(() =>
  String(securityForm.currentPassword || '').trim().length >= 8 &&
  String(securityForm.newPassword || '').length > 0 &&
  String(securityForm.confirmPassword || '').length > 0 &&
  passwordsMatch.value &&
  hasStrongPassword.value
)
const showToast = (type, message) => {
  if (toastTimer) window.clearTimeout(toastTimer)
  toast.type = String(type || 'success')
  toast.message = String(message || '').trim()
  toast.show = true
  toastTimer = window.setTimeout(() => {
    toast.show = false
  }, 2600)
}
const resetValidationErrors = () => {
  validationErrors.displayName = ''
  validationErrors.email = ''
  validationErrors.currentPassword = ''
  validationErrors.newPassword = ''
  validationErrors.confirmPassword = ''
}
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
const saveProfileInfo = async () => {
  resetValidationErrors()
  if (!String(profileForm.displayName || '').trim()) {
    validationErrors.displayName = 'Display name is required.'
  }
  if (!isValidEmail(profileForm.email)) {
    validationErrors.email = 'Enter a valid email address.'
  }
  if (validationErrors.displayName || validationErrors.email) {
    showToast('error', 'Please resolve the highlighted profile fields.')
    return
  }
  settings.fullName = String(profileForm.displayName || '').trim() || settings.fullName
  settings.email = String(profileForm.email || '').trim()
  settings.contactNumber = String(profileForm.contactNumber || '').trim()
  showToast('success', 'Profile information updated.')
}
const saveSecuritySettings = async () => {
  resetValidationErrors()
  if (!String(securityForm.currentPassword || '').trim()) {
    validationErrors.currentPassword = 'Current password is required.'
  } else if (String(securityForm.currentPassword || '').trim().length < 8) {
    validationErrors.currentPassword = 'Current password must be at least 8 characters.'
  }
  if (!hasStrongPassword.value) {
    validationErrors.newPassword = 'New password does not meet security requirements.'
  }
  if (!String(securityForm.confirmPassword || '')) {
    validationErrors.confirmPassword = 'Please confirm the new password.'
  } else if (!passwordsMatch.value) {
    validationErrors.confirmPassword = 'Confirmation password does not match.'
  }
  if (validationErrors.currentPassword || validationErrors.newPassword || validationErrors.confirmPassword) {
    showToast('error', 'Please fix the security form errors.')
    return
  }
  settings.passwordUpdatedAt = new Date().toLocaleDateString()
  securityForm.currentPassword = ''
  securityForm.newPassword = ''
  securityForm.confirmPassword = ''
  showToast('success', 'Password updated successfully.')
}

const handleEscape = (event) => {
  if (event.key !== 'Escape') return
  if (isTourActive.value) {
    skipTour()
    return
  }
  closeSidebar()
  showNotificationsPanel.value = false
}

const handleLogout = () => {
  authStore.logout()
  router.push('/auth/login')
}

const toggleAccountMenu = () => {
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

const handleAccountMenuClickOutside = (event) => {
  const target = event?.target
  if (notificationMenuRef.value && target instanceof Node && notificationMenuRef.value.contains(target)) return
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  closeNotificationsPanel()
  isAccountMenuOpen.value = false
}

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const getScrollableAncestors = (element) => {
  const containers = []
  let parent = element?.parentElement || null
  while (parent && parent !== document.body) {
    const styles = window.getComputedStyle(parent)
    if (/(auto|scroll|overlay)/.test(styles.overflowY) && parent.scrollHeight > parent.clientHeight) containers.push(parent)
    parent = parent.parentElement
  }
  const root = document.scrollingElement || document.documentElement
  if (root) containers.push(root)
  return containers
}
const smoothScrollIntoView = async (element) => {
  if (!element) return
  const containers = getScrollableAncestors(element)
  containers.forEach((container) => {
    const targetRect = element.getBoundingClientRect()
    const containerRect = container === document.scrollingElement || container === document.documentElement
      ? { top: 0, height: window.innerHeight, bottom: window.innerHeight }
      : container.getBoundingClientRect()
    const above = targetRect.top < containerRect.top + 16
    const below = targetRect.bottom > containerRect.bottom - 16
    if (!above && !below) return
    const currentTop = container === document.scrollingElement || container === document.documentElement ? window.scrollY : container.scrollTop
    const desiredTop = currentTop + (targetRect.top - containerRect.top) - ((containerRect.height - targetRect.height) / 2)
    const safeTop = Math.max(0, desiredTop)
    if (container === document.scrollingElement || container === document.documentElement) window.scrollTo({ top: safeTop, behavior: 'smooth' })
    else container.scrollTo({ top: safeTop, behavior: 'smooth' })
  })
  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  await wait(320)
}
const getTourStorageKey = () => {
  const authUser = authStore.user || {}
  const identifier = String(authUser._id || authUser.id || authUser.email || authUser.username || 'teacher').trim().toLowerCase()
  return `${TOUR_STORAGE_PREFIX}${identifier || 'teacher'}_${PAGE_TOUR_KEY}`
}
const getProgressStorageKey = () => {
  const authUser = authStore.user || {}
  const identifier = String(authUser._id || authUser.id || authUser.email || authUser.username || 'teacher').trim().toLowerCase()
  return `${TOUR_PROGRESS_PREFIX}${identifier || 'teacher'}`
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
  try { localStorage.setItem(getProgressStorageKey(), JSON.stringify(progress)) } catch (_error) {}
}
const clearTourProgress = () => {
  try { localStorage.removeItem(getProgressStorageKey()) } catch (_error) {}
}
const hasSeenTour = () => {
  try { return localStorage.getItem(getTourStorageKey()) === 'true' } catch (_error) { return false }
}
const setHasSeenTour = (value = true) => {
  try { localStorage.setItem(getTourStorageKey(), value ? 'true' : 'false') } catch (_error) {}
}
const updateTourPlacement = () => {
  if (!isTourActive.value) return
  const target = activeTourStep.value?.selector ? document.querySelector(activeTourStep.value.selector) : null
  const desktopSidebarVisible = window.innerWidth > SIDEBAR_BREAKPOINT
  const safeViewportLeft = desktopSidebarVisible ? SIDEBAR_WIDTH + 20 : 12
  const viewportRightPadding = 12
  const viewportBottomPadding = 12
  const viewportTopPadding = (() => {
    const header = document.querySelector('.top-header')
    if (!header) return 12
    return Math.max(12, Math.round(header.getBoundingClientRect().bottom + 8))
  })()
  const minTooltipWidth = 280
  const maxTooltipWidth = 400
  const availableWidth = Math.max(minTooltipWidth, window.innerWidth - safeViewportLeft - viewportRightPadding)
  if (!target) {
    tourTargetRect.value = null
    tourTooltipStyle.value = { width: `${Math.min(maxTooltipWidth, availableWidth)}px`, left: `${safeViewportLeft}px`, top: '50%', transform: 'translateY(-50%)' }
    return
  }
  const rect = target.getBoundingClientRect()
  const padding = 10
  const minTargetLeft = target.closest('.teacher-sidebar') ? 8 : safeViewportLeft
  const paddedRect = {
    top: clamp(rect.top - padding, viewportTopPadding, window.innerHeight - viewportBottomPadding),
    left: clamp(rect.left - padding, minTargetLeft, window.innerWidth - viewportRightPadding),
    width: clamp(rect.width + padding * 2, 0, window.innerWidth - minTargetLeft - viewportRightPadding),
    height: clamp(rect.height + padding * 2, 0, window.innerHeight - viewportTopPadding - viewportBottomPadding)
  }
  tourTargetRect.value = paddedRect
  const tooltipElement = document.querySelector('.teacher-page-tour-tooltip')
  const tooltipWidth = Math.min(maxTooltipWidth, availableWidth)
  const estimatedTooltipHeight = Math.max(220, Number(tooltipElement?.offsetHeight || 0) || 260)
  let tooltipTop = paddedRect.top + paddedRect.height + 16
  if (tooltipTop + estimatedTooltipHeight > window.innerHeight - viewportBottomPadding) tooltipTop = paddedRect.top - estimatedTooltipHeight - 16
  tooltipTop = clamp(tooltipTop, viewportTopPadding, Math.max(viewportTopPadding, window.innerHeight - estimatedTooltipHeight - viewportBottomPadding))
  let tooltipLeft = paddedRect.left + (paddedRect.width / 2) - (tooltipWidth / 2)
  tooltipLeft = clamp(tooltipLeft, safeViewportLeft, Math.max(safeViewportLeft, window.innerWidth - tooltipWidth - viewportRightPadding))
  tourTooltipStyle.value = { width: `${tooltipWidth}px`, left: `${tooltipLeft}px`, top: `${tooltipTop}px`, transform: 'none' }
}
const tourSpotlightStyle = computed(() => {
  if (!tourTargetRect.value) return null
  return { top: `${tourTargetRect.value.top}px`, left: `${tourTargetRect.value.left}px`, width: `${tourTargetRect.value.width}px`, height: `${tourTargetRect.value.height}px` }
})
const renderCurrentTourStep = async () => {
  await nextTick()
  const target = activeTourStep.value?.selector ? document.querySelector(activeTourStep.value.selector) : null
  if (target) await smoothScrollIntoView(target)
  updateTourPlacement()
}
const closeTour = ({ markSeen = true } = {}) => {
  isTourActive.value = false
  tourTargetRect.value = null
  tourTooltipStyle.value = {}
  if (markSeen) setHasSeenTour(true)
  if (markSeen) clearTourProgress()
}
const startTour = async ({ force = false } = {}) => {
  if (!force && hasSeenTour()) return
  isTourActive.value = true
  tourStepIndex.value = 0
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
const skipTour = () => { closeTour({ markSeen: true }) }
const maybeAutoStartTour = async () => {
  if (hasAttemptedAutoTour.value) return
  hasAttemptedAutoTour.value = true
  const progress = readTourProgress()
  if (progress?.active) {
    const resolvedStep = progress.step === 'last' ? tourSteps.length - 1 : Number(progress.step || 0)
    isTourActive.value = true
    tourStepIndex.value = clamp(resolvedStep, 0, Math.max(0, tourSteps.length - 1))
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

  const authUser = authStore.user || {}
  settings.fullName = authUser.name || authUser.displayName || authUser.username || 'Teacher'
  settings.email = authUser.email || ''
  settings.contactNumber = authUser.contactNumber || authUser.profile?.contactNumber || ''
  profileForm.displayName = settings.fullName
  profileForm.email = settings.email
  profileForm.contactNumber = settings.contactNumber
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
  document.body.classList.remove('teacher-mobile-menu-open')
  if (toastTimer) {
    window.clearTimeout(toastTimer)
    toastTimer = null
  }
})
</script>

<style scoped>
.teacher-page-tour-layer {
  position: fixed;
  inset: 0;
  z-index: 12000;
  pointer-events: none;
}
.teacher-page-tour-backdrop { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.58); }
.teacher-page-tour-spotlight {
  position: fixed;
  z-index: 12001;
  border-radius: 16px;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.58);
  border: 2px solid rgba(255, 255, 255, 0.95);
}
.teacher-page-tour-tooltip {
  position: fixed;
  z-index: 12002;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.22);
  padding: 1rem 1.1rem;
  pointer-events: auto;
}
.teacher-page-tour-step {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.teacher-page-tour-actions { margin-top: 1rem; display: flex; gap: 0.55rem; justify-content: flex-end; }
.teacher-page-tour-btn {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  min-height: 36px;
  padding: 0.45rem 0.92rem;
  cursor: pointer;
}
.teacher-page-tour-btn-ghost { background: #ffffff; color: #334155; }
.teacher-page-tour-btn-primary { border-color: #0f172a; background: #0f172a; color: #ffffff; }
.header-tour-btn {
  cursor: pointer;
  background: #ffffff;
  color: #334155;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
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

.settings-panel,
.settings-toast {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
}

.teacher-main > .top-header .btn {
  min-height: 40px;
}

.teacher-main {
  margin-left: 0 !important;
  width: 100%;
  max-width: none;
}

.settings-toast {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.95rem;
  padding: 0.7rem 0.9rem;
  font-size: 0.86rem;
  font-weight: 700;
}

.toast-success {
  border-color: #86efac;
  color: #166534;
  background: #f0fdf4;
}

.toast-error {
  border-color: #fecaca;
  color: #991b1b;
  background: #fef2f2;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.1rem;
}

.settings-panel {
  padding: 1.15rem;
  display: grid;
  gap: 0.95rem;
}

.panel-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.06rem;
}

.panel-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.83rem;
}

.teacher-security-panel {
  grid-column: 1 / -1;
}

.teacher-security-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.teacher-security-panel-copy {
  min-width: 0;
}

.teacher-security-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
}

.teacher-security-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  border: 1px solid #d6e8cc;
  background: #f7fbf4;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.teacher-security-pill i {
  font-size: 0.82rem;
}

.teacher-security-pill-shield,
.teacher-security-pill-strong {
  border-color: #b9dca7;
  background: #eef8e9;
  color: #4f8f2f;
}

.teacher-security-pill-medium {
  border-color: #fde68a;
  background: #fffbeb;
  color: #b45309;
}

.teacher-security-pill-weak {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.teacher-security-pill-idle {
  border-color: #d6e8cc;
  background: #f7fbf4;
  color: #475569;
}

.teacher-security-card {
  border: 1px solid #d6e8cc;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf4 100%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  padding: 1rem 1.05rem 1.05rem;
  position: relative;
  overflow: hidden;
}

.teacher-security-card::before {
  content: "";
  position: absolute;
  top: -70px;
  right: -50px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201, 230, 184, 0.58) 0%, rgba(201, 230, 184, 0) 72%);
  pointer-events: none;
}

.teacher-security-form {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.95fr);
  gap: 1rem 1.15rem;
  align-items: start;
  position: relative;
}

.teacher-security-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.teacher-security-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border: 1px solid #cfe5c3;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef8e9 0%, #f9fcf7 100%);
}

.teacher-security-banner-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #82bf5b 0%, #5ca03c 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(92, 160, 60, 0.24);
  flex: 0 0 auto;
}

.teacher-security-banner-icon i {
  color: #ffffff !important;
}

.teacher-security-banner-copy strong {
  display: block;
  color: #0f172a;
  font-size: 0.92rem;
}

.teacher-security-banner-copy p {
  margin: 0.3rem 0 0;
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.5;
}

.teacher-security-field-group {
  gap: 0.45rem;
}

.teacher-security-field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0;
}

.teacher-security-field-label > span {
  color: #1e293b;
  font-weight: 700;
  font-size: 0.83rem;
  letter-spacing: 0.02em;
}

.teacher-security-field-label small {
  border: 1px solid #d6e8cc;
  border-radius: 999px;
  background: #f7fbf4;
  color: #64748b;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.18rem 0.5rem;
}

.teacher-security-field-help {
  margin: 0;
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.45;
}

.teacher-security-error {
  margin-top: -0.05rem;
}

.teacher-security-actions {
  margin-top: 0.1rem;
  padding-top: 1rem;
  border-top: 1px solid #e1edda;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.teacher-security-action-note {
  margin: 0;
  max-width: 34rem;
  color: #64748b;
  font-size: 0.79rem;
  line-height: 1.5;
}

.teacher-security-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-width: 180px;
  min-height: 44px;
  border-radius: 12px;
  background: #69aa47 !important;
  border-color: #69aa47 !important;
  color: #ffffff !important;
  background-image: none !important;
  box-shadow: 0 12px 24px rgba(105, 170, 71, 0.22);
}

.teacher-security-submit:hover:not(:disabled) {
  background: #5b9b3c !important;
  border-color: #5b9b3c !important;
  transform: translateY(-1px);
}

.teacher-security-submit:disabled {
  background: #a9c99a !important;
  border-color: #a9c99a !important;
  box-shadow: none;
}

.teacher-security-side {
  border: 1px solid #d6e8cc;
  border-radius: 16px;
  background: linear-gradient(180deg, #f7fbf4 0%, #ffffff 100%);
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.teacher-security-side-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.teacher-security-side-eyebrow {
  display: inline-flex;
  color: #5b9b3c;
  font-size: 0.69rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.teacher-security-side-header h5 {
  margin: 0.12rem 0 0;
  color: #0f172a;
  font-size: 0.95rem;
}

.teacher-security-side-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  height: 34px;
  padding: 0 0.7rem;
  border-radius: 999px;
  background: #e7f4df;
  color: #4a7f31;
  font-size: 0.8rem;
  font-weight: 700;
}

.teacher-security-strength-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.8rem 0.85rem;
}

.teacher-security-strength-card.strength-card-idle {
  border-color: #d6e8cc;
}

.teacher-security-strength-card.strength-card-weak {
  border-color: #fecaca;
  background: #fff7f7;
}

.teacher-security-strength-card.strength-card-medium {
  border-color: #fde68a;
  background: #fffcf2;
}

.teacher-security-strength-card.strength-card-strong {
  border-color: #bbf7d0;
  background: #f6fff8;
}

.teacher-security-strength-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.teacher-security-strength-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.24rem 0.55rem;
  border-radius: 999px;
  background: #eef8e9;
  color: #4f8f2f;
  font-size: 0.74rem;
  font-weight: 700;
}

.teacher-security-strength-percent {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}

.teacher-security-strength {
  display: grid;
  gap: 0.45rem;
}

.teacher-security-strength-bar {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #e2e8f0;
}

.teacher-security-strength-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.25s ease, background 0.25s ease;
}

.teacher-security-strength-fill.strength-none {
  background: transparent;
}

.teacher-security-strength-fill.strength-weak {
  background: linear-gradient(90deg, #ef4444 0%, #fca5a5 100%);
}

.teacher-security-strength-fill.strength-medium {
  background: linear-gradient(90deg, #f59e0b 0%, #fcd34d 100%);
}

.teacher-security-strength-fill.strength-strong {
  background: linear-gradient(90deg, #22c55e 0%, #86efac 100%);
}

.teacher-security-strength-text {
  font-size: 0.79rem;
  color: #64748b;
  line-height: 1.5;
}

.teacher-security-rules-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.75rem 0.8rem;
}

.teacher-security-rules-card p {
  margin: 0 0 0.6rem;
  color: #334155;
  font-weight: 600;
  font-size: 0.8rem;
}

.teacher-password-rules {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.45rem;
}

.teacher-password-rules li {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  color: #64748b;
  font-size: 0.79rem;
  line-height: 1.35;
}

.teacher-password-rules li i {
  margin-top: 0.1rem;
  color: #94a3b8;
  font-size: 0.78rem;
}

.teacher-password-rules li.met {
  color: #166534;
}

.teacher-password-rules li.met i {
  color: #16a34a;
}

.teacher-security-tip {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.7rem 0.75rem;
  border: 1px solid #b9dca7;
  border-radius: 12px;
  background: #eef8e9;
  color: #4a7f31;
  font-size: 0.77rem;
  line-height: 1.5;
}

.teacher-security-tip i {
  margin-top: 0.08rem;
}

.teacher-security-match {
  margin-top: 0.1rem;
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fff5f5;
  font-size: 0.79rem;
  color: #b91c1c;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.teacher-security-match.valid {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.panel-form {
  display: grid;
  gap: 0.8rem;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.field-group {
  display: grid;
  gap: 0.3rem;
}

.field-group label {
  color: #64748b;
  font-size: 0.73rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 700;
}

.settings-input {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.68rem 0.78rem;
  font-size: 0.88rem;
  color: #0f172a;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.settings-input:focus-visible {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.teacher-security-form .settings-input {
  min-height: 48px;
  border: 1px solid #d5e5cd;
  border-radius: 12px;
  padding: 0.78rem 0.86rem;
  background: #fcfefb;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.teacher-security-form .settings-input:focus-visible {
  border-color: #8fbd76;
  box-shadow: 0 0 0 4px rgba(105, 170, 71, 0.14);
  background: #ffffff;
}

.helper-text {
  color: #94a3b8;
  font-size: 0.74rem;
  margin: 0;
}

.field-error {
  color: #b91c1c;
  font-size: 0.74rem;
  margin: 0;
}

.password-wrap {
  position: relative;
}

.password-wrap .settings-input {
  padding-right: 2.45rem;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.48rem;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  cursor: pointer;
}

.teacher-security-form .password-wrap .settings-input {
  padding-right: 2.9rem;
}

.teacher-security-form .password-toggle {
  right: 0.6rem;
  width: 34px;
  height: 34px;
  border: 1px solid #d6e8cc;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf4 100%);
  transition: all 0.2s ease;
}

.teacher-security-form .password-toggle:hover {
  background: #eef8e9;
  border-color: #8fbd76;
  color: #4f8f2f;
}

.password-rules {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.2rem;
}

.password-rules li {
  color: #64748b;
  font-size: 0.77rem;
}

.password-rules li.met {
  color: #166534;
}

.toggle-list {
  display: grid;
  gap: 0.5rem;
}

.toggle-item {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0.8rem 0.85rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.toggle-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.panel-actions {
  margin-top: 0.25rem;
  display: flex;
  justify-content: flex-end;
}

.btn:focus-visible,
.password-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.22);
}

@media (max-width: 900px) {
  .teacher-main {
    padding: 0.85rem !important;
  }

  .settings-grid,
  .field-row,
  .teacher-security-form {
    grid-template-columns: 1fr;
  }

  .teacher-security-panel-header,
  .teacher-security-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .teacher-security-pills {
    justify-content: flex-start;
  }

  .teacher-security-submit {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .teacher-security-pills {
    width: 100%;
  }

  .teacher-security-pill {
    width: 100%;
    justify-content: center;
  }

  .teacher-security-field-label {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .teacher-security-card,
  .teacher-security-side {
    padding: 0.85rem;
  }
}
</style>



