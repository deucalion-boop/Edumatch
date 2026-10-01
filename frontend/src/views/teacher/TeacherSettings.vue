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
                <UserNotificationList :notifications="notifications" :loading="isNotificationsLoading" @select="closeNotificationsPanel" />
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

        <div class="settings-workspace">
          <aside class="settings-section-sidebar" aria-label="Settings sections">
            <div class="settings-sidebar-heading">
              <span>Settings</span>
              <small>Manage your preferences</small>
            </div>
            <nav class="settings-section-nav">
              <button
                v-for="section in settingsSections"
                :key="section.id"
                type="button"
                class="settings-section-nav-item"
                :class="{ active: activeSettingsSection === section.id }"
                :aria-current="activeSettingsSection === section.id ? 'page' : undefined"
                @click="activeSettingsSection = section.id"
              >
                <i :class="section.icon"></i>
                <span>{{ section.label }}</span>
                <i class="fas fa-chevron-right settings-nav-chevron"></i>
              </button>
            </nav>
          </aside>

          <div class="settings-section-content settings-grid">
          <section v-show="activeSettingsSection === 'notifications'" class="settings-panel preference-panel" data-tour="settings-notifications-section">
            <div class="panel-header settings-section-heading">
              <span class="settings-section-icon"><i class="fas fa-bell"></i></span>
              <div>
                <h3>Notification Preferences</h3>
                <p>Choose which teaching updates should get your attention on this device.</p>
              </div>
            </div>
            <div class="preference-list">
              <label class="preference-row">
                <span><strong>Enrollment requests</strong><small>Notify me when a student requests to join a class.</small></span>
                <input v-model="notificationPreferences.enrollmentRequests" type="checkbox" class="settings-toggle-input">
              </label>
              <label class="preference-row">
                <span><strong>Assessment submissions</strong><small>Notify me when students submit assessments.</small></span>
                <input v-model="notificationPreferences.assessmentSubmissions" type="checkbox" class="settings-toggle-input">
              </label>
              <label class="preference-row">
                <span><strong>Upcoming deadlines</strong><small>Show reminders for lessons and assessment deadlines.</small></span>
                <input v-model="notificationPreferences.deadlineReminders" type="checkbox" class="settings-toggle-input">
              </label>
              <label class="preference-row">
                <span><strong>In-app notifications</strong><small>Display notifications inside EduMatch.</small></span>
                <input v-model="notificationPreferences.inApp" type="checkbox" class="settings-toggle-input">
              </label>
            </div>
            <div class="preference-actions">
              <button type="button" class="btn btn-primary settings-save-button" @click="savePreferences">
                <i class="fas fa-save"></i> Save preferences
              </button>
            </div>
          </section>

          <section v-show="activeSettingsSection === 'appearance'" class="settings-panel appearance-panel" data-tour="settings-appearance-section">
            <div class="panel-header settings-section-heading">
              <span class="settings-section-icon"><i class="fas fa-palette"></i></span>
              <div>
                <h3>Appearance</h3>
                <p>Select how the Teacher workspace looks on this device.</p>
              </div>
            </div>
            <div class="theme-options" role="radiogroup" aria-label="Teacher workspace theme">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                type="button"
                class="theme-option"
                :class="{ active: selectedTheme === option.value }"
                role="radio"
                :aria-checked="selectedTheme === option.value"
                @click="selectTheme(option.value)"
              >
                <span class="theme-option-preview" :class="`theme-preview-${option.value}`"><i :class="option.icon"></i></span>
                <span><strong>{{ option.label }}</strong><small>{{ option.description }}</small></span>
              </button>
            </div>
          </section>

          <section v-show="activeSettingsSection === 'security'" class="settings-panel sessions-panel" data-tour="settings-sessions-section">
            <div class="panel-header sessions-panel-header">
              <div class="settings-section-heading">
                <span class="settings-section-icon"><i class="fas fa-laptop"></i></span>
                <div>
                  <h3>Active Sessions</h3>
                  <p>Review devices signed in to your account and remove access you do not recognize.</p>
                </div>
              </div>
              <button type="button" class="btn btn-outline" :disabled="isLoadingSessions" @click="loadActiveSessions">
                <i class="fas" :class="isLoadingSessions ? 'fa-spinner fa-spin' : 'fa-rotate'"></i>
                Refresh
              </button>
            </div>
            <div v-if="isLoadingSessions" class="sessions-state"><i class="fas fa-spinner fa-spin"></i> Loading sessions...</div>
            <div v-else-if="sessionError" class="sessions-state sessions-state-error">{{ sessionError }}</div>
            <div v-else-if="activeSessions.length === 0" class="sessions-state">No active sessions were found.</div>
            <div v-else class="session-list">
              <article v-for="session in sortedSessions" :key="session.id" class="session-item" :class="{ current: session.current }">
                <span class="session-device-icon"><i class="fas" :class="session.current ? 'fa-laptop' : 'fa-display'"></i></span>
                <div class="session-copy">
                  <div class="session-title-line">
                    <strong>{{ formatSessionDevice(session.userAgent) }}</strong>
                    <span v-if="session.current" class="current-session-badge">Current device</span>
                  </div>
                  <small>{{ session.ipAddress || 'Unknown IP' }} · Last active {{ formatSessionTime(session.lastSeenAt || session.createdAt) }}</small>
                </div>
                <button v-if="!session.current" type="button" class="btn btn-outline session-revoke-button" :disabled="revokingSessionId === session.id" @click="revokeActiveSession(session.id)">
                  {{ revokingSessionId === session.id ? 'Removing...' : 'Log out' }}
                </button>
              </article>
            </div>
            <div class="sessions-footer">
              <p>This action signs out every device, including this one.</p>
              <button type="button" class="btn danger-action" :disabled="isLoggingOutAll" @click="logoutAllDevices">
                <i class="fas fa-right-from-bracket"></i>
                {{ isLoggingOutAll ? 'Signing out...' : 'Log out all devices' }}
              </button>
            </div>
          </section>

          <section v-show="activeSettingsSection === 'security'" class="settings-panel teacher-security-panel" data-tour="settings-security-section">
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
              <form novalidate class="panel-form teacher-security-form" @submit.prevent="saveSecuritySettings">
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
                      <input :type="showCurrentPassword ? 'text' : 'password'" id="security-current-password" v-model="securityForm.currentPassword" minlength="8" maxlength="17" :aria-invalid="Boolean(validationErrors.currentPassword)" @input="validateSecurityFields" class="settings-input" placeholder="Enter current password">
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
                      <input :type="showNewPassword ? 'text' : 'password'" id="security-new-password" v-model="securityForm.newPassword" minlength="8" maxlength="17" :aria-invalid="Boolean(validationErrors.newPassword)" @input="validateSecurityFields" class="settings-input" placeholder="Enter new password">
                      <button type="button" class="password-toggle" @click="showNewPassword = !showNewPassword">
                        <i class="fas" :class="showNewPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                      </button>
                    </div>
                    <p class="teacher-security-field-help">Use 8-17 characters with uppercase, lowercase, a number, and a symbol.</p>
                    <small v-if="validationErrors.newPassword" class="field-error teacher-security-error">{{ validationErrors.newPassword }}</small>
                  </div>

                  <div class="field-group teacher-security-field-group">
                    <label for="security-confirm-password" class="teacher-security-field-label">
                      <span>Confirm New Password</span>
                      <small>Match exactly</small>
                    </label>
                    <div class="password-wrap">
                      <input :type="showConfirmPassword ? 'text' : 'password'" id="security-confirm-password" v-model="securityForm.confirmPassword" minlength="8" maxlength="17" :aria-invalid="Boolean(validationErrors.confirmPassword)" @input="validateSecurityFields" class="settings-input" placeholder="Re-enter new password">
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
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-ghost" :disabled="isFirstTourStep" @click="goToPreviousTourStep">Back</button>
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-primary" @click="goToNextTourStep">
              {{ isFinalTourStep ? 'Finish' : 'Next' }}
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import axios from 'axios'
import { nameError, phoneError, passwordLengthError } from '../../utils/teacherValidation.js'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import UserNotificationList from '../../components/UserNotificationList.vue'
import { useUserNotifications } from '../../composables/useUserNotifications.js'
import { isValidPhilippinePhone, normalizePhilippinePhone } from '../../utils/phone.js'

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
const CURRENT_PAGE_ROUTE = '/teacher/settings'
const TOUR_ROUTE_ORDER = ['/teacher/dashboard', '/teacher/activities', '/teacher/students', '/teacher/records']
const TOUR_PROGRESS_PREFIX = 'edumatch_teacher_tour_progress_v3_'
const SIDEBAR_BREAKPOINT = 1024
const SIDEBAR_WIDTH = 280
const TEACHER_PREFERENCES_KEY = 'edumatch_teacher_settings_v1'
const TEACHER_THEME_KEY = 'edumatch_teacher_theme'

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
const notificationPreferences = reactive({
  enrollmentRequests: true,
  assessmentSubmissions: true,
  deadlineReminders: true,
  inApp: true,
})
const themeOptions = [
  { value: 'light', label: 'Light', description: 'Bright and clear', icon: 'fas fa-sun' },
  { value: 'system', label: 'System', description: 'Match this device', icon: 'fas fa-desktop' },
  { value: 'dark', label: 'Dark', description: 'Comfortable in low light', icon: 'fas fa-moon' },
]
const selectedTheme = ref('system')
const activeSessions = ref([])
const isLoadingSessions = ref(false)
const sessionError = ref('')
const revokingSessionId = ref('')
const isLoggingOutAll = ref(false)
const activeSettingsSection = ref('notifications')
const settingsSections = [
  { id: 'notifications', label: 'Notification Preferences', icon: 'fas fa-bell' },
  { id: 'appearance', label: 'Appearance', icon: 'fas fa-palette' },
  { id: 'security', label: 'Security', icon: 'fas fa-shield-alt' },
]
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
const savingPassword = ref(false)
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
const isFirstTourStep = computed(() => tourStepIndex.value === 0 && TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE) === 0)
const isFinalTourStep = computed(() => isLastTourStep.value && TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE) === TOUR_ROUTE_ORDER.length - 1)

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
const sortedSessions = computed(() => [...activeSessions.value].sort((left, right) => {
  if (left.current !== right.current) return left.current ? -1 : 1
  const leftTime = Date.parse(left.lastSeenAt || left.createdAt) || 0
  const rightTime = Date.parse(right.lastSeenAt || right.createdAt) || 0
  return rightTime - leftTime
}))

const resolveSettingsApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  return configured.endsWith('/api') ? configured : `${configured}/api`
}
const settingsAuthConfig = () => ({ headers: { Authorization: `Bearer ${authStore.token}` } })
const applyTeacherTheme = (theme) => {
  const normalizedTheme = themeOptions.some((option) => option.value === theme) ? theme : 'system'
  selectedTheme.value = normalizedTheme
  document.documentElement.dataset.teacherThemePreference = normalizedTheme
  document.documentElement.dataset.teacherTheme = normalizedTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : normalizedTheme
}
const selectTheme = (theme) => {
  applyTeacherTheme(theme)
  try { localStorage.setItem(TEACHER_THEME_KEY, selectedTheme.value) } catch (_error) {}
  showToast('success', `${themeOptions.find((option) => option.value === selectedTheme.value)?.label || 'System'} theme applied.`)
}
const loadPreferences = () => {
  try {
    const savedPreferences = JSON.parse(localStorage.getItem(TEACHER_PREFERENCES_KEY) || '{}')
    Object.keys(notificationPreferences).forEach((key) => {
      if (typeof savedPreferences[key] === 'boolean') notificationPreferences[key] = savedPreferences[key]
    })
    applyTeacherTheme(localStorage.getItem(TEACHER_THEME_KEY) || 'system')
  } catch (_error) {
    applyTeacherTheme('system')
  }
}
const savePreferences = () => {
  try {
    localStorage.setItem(TEACHER_PREFERENCES_KEY, JSON.stringify({ ...notificationPreferences }))
    window.dispatchEvent(new CustomEvent('edumatch-teacher-preferences-changed'))
    showToast('success', 'Notification preferences saved on this device.')
  } catch (_error) {
    showToast('error', 'Unable to save notification preferences.')
  }
}
const formatSessionDevice = (userAgent) => {
  const agent = String(userAgent || '')
  const browsers = [
    [/Edg(?:e|A|iOS)?\/(\d+)/, 'Edge'],
    [/OPR\/(\d+)/, 'Opera'],
    [/SamsungBrowser\/(\d+)/, 'Samsung Internet'],
    [/(?:Chrome|CriOS)\/(\d+)/, 'Chrome'],
    [/(?:Firefox|FxiOS)\/(\d+)/, 'Firefox'],
    [/Version\/(\d+).*Safari/, 'Safari'],
  ]
  const match = browsers.find(([pattern]) => pattern.test(agent))
  const browserName = match ? `${match[1]} ${agent.match(match[0])?.[1] || ''}`.trim() : 'Unknown browser'
  const platform = /iPad/.test(agent) ? 'iPad' : /iPhone|iPod/.test(agent) ? 'iPhone'
    : /Android/.test(agent) ? 'Android' : /Windows/.test(agent) ? 'Windows'
      : /Macintosh|Mac OS X/.test(agent) ? 'macOS' : /Linux/.test(agent) ? 'Linux' : ''
  return platform ? `${browserName} on ${platform}` : browserName
}
const formatSessionTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
const loadActiveSessions = async () => {
  if (!authStore.token || isLoadingSessions.value) return
  isLoadingSessions.value = true
  sessionError.value = ''
  try {
    const response = await axios.get(`${resolveSettingsApiBaseUrl()}/auth/sessions`, settingsAuthConfig())
    activeSessions.value = Array.isArray(response.data?.sessions) ? response.data.sessions : []
  } catch (error) {
    sessionError.value = error.response?.data?.message || 'Unable to load active sessions.'
  } finally {
    isLoadingSessions.value = false
  }
}
const revokeActiveSession = async (sessionId) => {
  if (!sessionId || revokingSessionId.value) return
  revokingSessionId.value = sessionId
  try {
    await axios.delete(`${resolveSettingsApiBaseUrl()}/auth/sessions/${encodeURIComponent(sessionId)}`, settingsAuthConfig())
    activeSessions.value = activeSessions.value.filter((session) => session.id !== sessionId)
    showToast('success', 'The selected device has been logged out.')
  } catch (error) {
    showToast('error', error.response?.data?.message || 'Unable to log out that device.')
  } finally {
    revokingSessionId.value = ''
  }
}
const logoutAllDevices = async () => {
  if (isLoggingOutAll.value) return
  const confirmed = window.confirm('Log out every device, including this one? You will need to sign in again.')
  if (!confirmed) return
  isLoggingOutAll.value = true
  try {
    const otherSessionIds = activeSessions.value.filter((session) => !session.current).map((session) => session.id)
    await Promise.all(otherSessionIds.map((sessionId) => axios.delete(
      `${resolveSettingsApiBaseUrl()}/auth/sessions/${encodeURIComponent(sessionId)}`,
      settingsAuthConfig(),
    )))
    authStore.logout()
    await router.push('/auth/login')
  } catch (error) {
    showToast('error', error.response?.data?.message || 'Unable to log out all devices.')
    isLoggingOutAll.value = false
  }
}

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
    minLength: password.length >= 8 && password.length <= 17,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  }
})
const passwordRuleItems = computed(() => [
  { key: 'minLength', label: '8-17 characters', met: passwordRules.value.minLength },
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
  !savingPassword.value &&
  !passwordLengthError(securityForm.currentPassword) &&
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
const isValidEmail = (value) => /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@gmail\.com$/i.test(String(value || '').trim())
const saveProfileInfo = async () => {
  resetValidationErrors()
  validationErrors.displayName = nameError(profileForm.displayName, 'Display name', 101)
  if (!isValidEmail(profileForm.email)) {
    validationErrors.email = 'Enter a valid Gmail address (e.g., user@gmail.com).'
  }
  if (validationErrors.displayName || validationErrors.email) {
    showToast('error', 'Please resolve the highlighted profile fields.')
    return
  }
  if (phoneError(profileForm.contactNumber)) {
    showToast('error', 'Please enter a valid Philippine contact number beginning with +63.')
    return
  }
  settings.fullName = String(profileForm.displayName || '').trim() || settings.fullName
  settings.email = String(profileForm.email || '').trim()
  settings.contactNumber = normalizePhilippinePhone(profileForm.contactNumber)
  showToast('success', 'Profile information updated.')
}
const validateSecurityFields = () => {
  resetValidationErrors()
  if (!String(securityForm.currentPassword || '').trim()) {
    validationErrors.currentPassword = 'Current password is required.'
  } else if (passwordLengthError(securityForm.currentPassword)) {
    validationErrors.currentPassword = 'Current password must be 8-17 characters.'
  }
  if (passwordLengthError(securityForm.newPassword)) {
    validationErrors.newPassword = passwordLengthError(securityForm.newPassword)
  } else if (!hasStrongPassword.value) {
    validationErrors.newPassword = 'New password does not meet security requirements.'
  }
  if (!String(securityForm.confirmPassword || '')) {
    validationErrors.confirmPassword = 'Please confirm the new password.'
  } else if (!passwordsMatch.value) {
    validationErrors.confirmPassword = 'Confirmation password does not match.'
  }
  return !validationErrors.currentPassword && !validationErrors.newPassword && !validationErrors.confirmPassword
}
const saveSecuritySettings = async () => {
  if (savingPassword.value) return
  if (!validateSecurityFields()) {
    showToast('error', 'Please fix the security form errors.')
    return
  }
  savingPassword.value = true
  try {
    const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
    const baseUrl = configured ? (configured.endsWith('/api') ? configured : configured + '/api') : '/api'
    await axios.post(baseUrl + '/auth/change-password', {
      currentPassword: securityForm.currentPassword,
      newPassword: securityForm.newPassword,
      confirmNewPassword: securityForm.confirmPassword,
    }, { headers: { Authorization: 'Bearer ' + authStore.token } })
    settings.passwordUpdatedAt = new Date().toLocaleDateString()
    securityForm.currentPassword = ''
    securityForm.newPassword = ''
    securityForm.confirmPassword = ''
    showToast('success', 'Password updated. Please sign in with your new password.')
    authStore.logout()
    router.push('/auth/login')
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update password. Please try again.'
    if (error.response?.status === 401) validationErrors.currentPassword = message
    else validationErrors.newPassword = message
    showToast('error', message)
  } finally {
    savingPassword.value = false
  }
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
  return authStore.user?.hasCompletedTeacherTour === true
}
const persistTeacherTourPreference = async (value = true) => {
  if (!authStore.token) return
  try {
    const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
    const baseUrl = configured ? (configured.endsWith('/api') ? configured : `${configured}/api`) : '/api'
    const response = await axios.patch(`${baseUrl}/teacher/tour-preference`, { hasCompletedTeacherTour: value === true }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    authStore.setUser({ ...(response.data?.user || {}), hasCompletedTeacherTour: value === true })
  } catch (error) {
    console.error('Failed to persist teacher tour preference:', error)
  }
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
  if (markSeen) {
    authStore.setUser({ hasCompletedTeacherTour: true })
    clearTourProgress()
    persistTeacherTourPreference(true)
  }
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
  if (!TOUR_ROUTE_ORDER.includes(CURRENT_PAGE_ROUTE)) return
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
  settings.contactNumber = normalizePhilippinePhone(authUser.contactNumber || authUser.profile?.contactNumber)
  profileForm.displayName = settings.fullName
  profileForm.email = settings.email
  profileForm.contactNumber = settings.contactNumber
  loadPreferences()
  loadActiveSessions()
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
@reference "../../styles/tailwind.css";
.teacher-page-tour-layer {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:12000];
  @apply tw:pointer-events-none;
}
.teacher-page-tour-backdrop { @apply tw:absolute; @apply tw:[inset:0]; @apply tw:[background:rgba(15,_23,_42,_0.58)]; }
.teacher-page-tour-spotlight {
  @apply tw:fixed;
  @apply tw:[z-index:12001];
  @apply tw:[border-radius:16px];
  @apply tw:[box-shadow:0_0_0_9999px_rgba(15,_23,_42,_0.58)];
  @apply tw:[border:2px_solid_rgba(255,_255,_255,_0.95)];
}
.teacher-page-tour-tooltip {
  @apply tw:fixed;
  @apply tw:[z-index:12002];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[box-shadow:0_14px_32px_rgba(15,_23,_42,_0.22)];
  @apply tw:[padding:1rem_1.1rem];
  @apply tw:pointer-events-auto;
}
.teacher-page-tour-step {
  @apply tw:[margin:0_0_0.35rem];
  @apply tw:[font-size:0.72rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-weight:600];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}
.teacher-page-tour-actions { @apply tw:[margin-top:1rem]; @apply tw:flex; @apply tw:[gap:0.55rem]; @apply tw:justify-end; }
.teacher-page-tour-btn {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
  @apply tw:[min-height:36px];
  @apply tw:[padding:0.45rem_0.92rem];
  @apply tw:cursor-pointer;
}
.teacher-page-tour-btn-ghost { @apply tw:[background:#ffffff]; @apply tw:[color:#334155]; }
.teacher-page-tour-btn-primary { @apply tw:[border-color:#0f172a]; @apply tw:[background:#0f172a]; @apply tw:[color:#ffffff]; }
.header-tour-btn {
  @apply tw:cursor-pointer;
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[border-radius:12px];
  @apply tw:inline-flex;
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

.settings-panel,
.settings-toast {
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:18px];
  @apply tw:[box-shadow:0_18px_38px_rgba(15,_23,_42,_0.08)];
}

.teacher-main > .top-header .btn {
  @apply tw:[min-height:40px];
}

.teacher-main {
  @apply tw:[margin-left:0]!;
  @apply tw:w-full;
  @apply tw:max-w-none;
}

.settings-toast {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[margin-bottom:0.95rem];
  @apply tw:[padding:0.7rem_0.9rem];
  @apply tw:[font-size:0.86rem];
  @apply tw:[font-weight:700];
}

.toast-success {
  @apply tw:[border-color:#86efac];
  @apply tw:[color:#166534];
  @apply tw:[background:#f0fdf4];
}

.toast-error {
  @apply tw:[border-color:#fecaca];
  @apply tw:[color:#991b1b];
  @apply tw:[background:#fef2f2];
}

.settings-workspace {
  @apply tw:grid;
  @apply tw:[grid-template-columns:250px_minmax(0,_1fr)];
  @apply tw:[align-items:start];
  @apply tw:[gap:1.1rem];
}

.settings-section-sidebar {
  @apply tw:sticky;
  @apply tw:[top:0.75rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_18px_38px_rgba(15,_23,_42,_0.08)];
  @apply tw:[padding:0.8rem];
}

.settings-sidebar-heading {
  @apply tw:grid;
  @apply tw:[gap:0.12rem];
  @apply tw:[padding:0.55rem_0.65rem_0.8rem];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
  @apply tw:[margin-bottom:0.55rem];
}

.settings-sidebar-heading span {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.95rem];
  @apply tw:[font-weight:800];
}

.settings-sidebar-heading small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.73rem];
}

.settings-section-nav {
  @apply tw:grid;
  @apply tw:[gap:0.35rem];
}

.settings-section-nav-item {
  @apply tw:w-full;
  @apply tw:[min-height:46px];
  @apply tw:grid;
  @apply tw:[grid-template-columns:24px_minmax(0,_1fr)_14px];
  @apply tw:items-center;
  @apply tw:[gap:0.6rem];
  @apply tw:[padding:0.65rem_0.7rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[border-radius:12px];
  @apply tw:[background:transparent];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:700];
  @apply tw:text-left;
  @apply tw:cursor-pointer;
  @apply tw:[transition:all_0.2s_ease];
}

.settings-section-nav-item:hover {
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#1e293b];
}

.settings-section-nav-item.active {
  @apply tw:[border-color:#cfe5c3];
  @apply tw:[background:#eef8e9];
  @apply tw:[color:#4f8f2f];
}

.settings-section-nav-item > i:first-child {
  @apply tw:text-center;
}

.settings-nav-chevron {
  @apply tw:[font-size:0.65rem];
  @apply tw:[opacity:0.55];
}

.settings-section-content,
.settings-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:1.1rem];
}

.settings-panel {
  @apply tw:[padding:1.15rem];
  @apply tw:grid;
  @apply tw:[gap:0.95rem];
}

.panel-header h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.06rem];
}

.panel-header p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.83rem];
}

.teacher-security-panel {
  @apply tw:[grid-column:1_/_-1];
}

.teacher-security-panel-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

.teacher-security-panel-copy {
  @apply tw:[min-width:0];
}

.teacher-security-pills {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:justify-end;
  @apply tw:[gap:0.6rem];
}

.teacher-security-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:0.55rem_0.85rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#d6e8cc];
  @apply tw:[background:#f7fbf4];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:600];
  @apply tw:whitespace-nowrap;
}

.teacher-security-pill i {
  @apply tw:[font-size:0.82rem];
}

.teacher-security-pill-shield,
.teacher-security-pill-strong {
  @apply tw:[border-color:#b9dca7];
  @apply tw:[background:#eef8e9];
  @apply tw:[color:#4f8f2f];
}

.teacher-security-pill-medium {
  @apply tw:[border-color:#fde68a];
  @apply tw:[background:#fffbeb];
  @apply tw:[color:#b45309];
}

.teacher-security-pill-weak {
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
}

.teacher-security-pill-idle {
  @apply tw:[border-color:#d6e8cc];
  @apply tw:[background:#f7fbf4];
  @apply tw:[color:#475569];
}

.teacher-security-card {
  @apply tw:[border:1px_solid_#d6e8cc];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f7fbf4_100%)];
  @apply tw:[box-shadow:0_18px_40px_rgba(15,_23,_42,_0.08)];
  @apply tw:[padding:1rem_1.05rem_1.05rem];
  @apply tw:relative;
  @apply tw:overflow-hidden;
}

.teacher-security-card::before {
  @apply tw:[content:""];
  @apply tw:absolute;
  @apply tw:[top:-70px];
  @apply tw:[right:-50px];
  @apply tw:[width:220px];
  @apply tw:[height:220px];
  @apply tw:[border-radius:50%];
  @apply tw:[background:radial-gradient(circle,_rgba(201,_230,_184,_0.58)_0%,_rgba(201,_230,_184,_0)_72%)];
  @apply tw:pointer-events-none;
}

.teacher-security-form {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.55fr)_minmax(300px,_0.95fr)];
  @apply tw:[gap:1rem_1.15rem];
  @apply tw:[align-items:start];
  @apply tw:relative;
}

.teacher-security-main {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:1rem];
  @apply tw:[align-items:start];
}

.teacher-security-banner {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border:1px_solid_#cfe5c3];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(135deg,_#eef8e9_0%,_#f9fcf7_100%)];
}

.teacher-security-banner-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:12px];
  @apply tw:[background:linear-gradient(135deg,_#82bf5b_0%,_#5ca03c_100%)];
  @apply tw:[color:#ffffff];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[box-shadow:0_12px_24px_rgba(92,_160,_60,_0.24)];
  @apply tw:flex-none;
}

.teacher-security-banner-icon i {
  @apply tw:[color:#ffffff]!;
}

.teacher-security-banner-copy strong {
  @apply tw:block;
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.92rem];
}

.teacher-security-banner-copy p {
  @apply tw:[margin:0.3rem_0_0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.5];
}

.teacher-security-field-group {
  @apply tw:[gap:0.45rem];
}

.teacher-security-field-label {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-bottom:0];
}

.teacher-security-field-label > span {
  @apply tw:[color:#1e293b];
  @apply tw:[font-weight:700];
  @apply tw:[font-size:0.83rem];
  @apply tw:[letter-spacing:0.02em];
}

.teacher-security-field-label small {
  @apply tw:[border:1px_solid_#d6e8cc];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#f7fbf4];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.67rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
  @apply tw:[padding:0.18rem_0.5rem];
}

.teacher-security-field-help {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.75rem];
  @apply tw:[line-height:1.45];
}

.teacher-security-error {
  @apply tw:[margin-top:-0.05rem];
}

.teacher-security-actions {
  @apply tw:[margin-top:0.1rem];
  @apply tw:[padding-top:1rem];
  @apply tw:[border-top:1px_solid_#e1edda];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

.teacher-security-action-note {
  @apply tw:[margin:0];
  @apply tw:[max-width:34rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.79rem];
  @apply tw:[line-height:1.5];
}

.teacher-security-submit {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[min-width:180px];
  @apply tw:[min-height:44px];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#69aa47]!;
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:bg-none!;
  @apply tw:[box-shadow:0_12px_24px_rgba(105,_170,_71,_0.22)];
}

.teacher-security-submit:hover:not(:disabled) {
  @apply tw:[background:#5b9b3c]!;
  @apply tw:[border-color:#5b9b3c]!;
  @apply tw:[transform:translateY(-1px)];
}

.teacher-security-submit:disabled {
  @apply tw:[background:#a9c99a]!;
  @apply tw:[border-color:#a9c99a]!;
  @apply tw:[box-shadow:none];
}

.teacher-security-side {
  @apply tw:[border:1px_solid_#d6e8cc];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(180deg,_#f7fbf4_0%,_#ffffff_100%)];
  @apply tw:[padding:1rem];
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.9)];
}

.teacher-security-side-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.teacher-security-side-eyebrow {
  @apply tw:inline-flex;
  @apply tw:[color:#5b9b3c];
  @apply tw:[font-size:0.69rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.12em];
  @apply tw:uppercase;
}

.teacher-security-side-header h5 {
  @apply tw:[margin:0.12rem_0_0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.95rem];
}

.teacher-security-side-count {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-width:46px];
  @apply tw:[height:34px];
  @apply tw:[padding:0_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e7f4df];
  @apply tw:[color:#4a7f31];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:700];
}

.teacher-security-strength-card {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.8rem_0.85rem];
}

.teacher-security-strength-card.strength-card-idle {
  @apply tw:[border-color:#d6e8cc];
}

.teacher-security-strength-card.strength-card-weak {
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:#fff7f7];
}

.teacher-security-strength-card.strength-card-medium {
  @apply tw:[border-color:#fde68a];
  @apply tw:[background:#fffcf2];
}

.teacher-security-strength-card.strength-card-strong {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#f6fff8];
}

.teacher-security-strength-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-bottom:0.55rem];
}

.teacher-security-strength-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[padding:0.24rem_0.55rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eef8e9];
  @apply tw:[color:#4f8f2f];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
}

.teacher-security-strength-percent {
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
}

.teacher-security-strength {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.teacher-security-strength-bar {
  @apply tw:[height:8px];
  @apply tw:[border-radius:999px];
  @apply tw:overflow-hidden;
  @apply tw:[background:#e2e8f0];
}

.teacher-security-strength-fill {
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[transition:width_0.25s_ease,_background_0.25s_ease];
}

.teacher-security-strength-fill.strength-none {
  @apply tw:[background:transparent];
}

.teacher-security-strength-fill.strength-weak {
  @apply tw:[background:linear-gradient(90deg,_#ef4444_0%,_#fca5a5_100%)];
}

.teacher-security-strength-fill.strength-medium {
  @apply tw:[background:linear-gradient(90deg,_#f59e0b_0%,_#fcd34d_100%)];
}

.teacher-security-strength-fill.strength-strong {
  @apply tw:[background:linear-gradient(90deg,_#22c55e_0%,_#86efac_100%)];
}

.teacher-security-strength-text {
  @apply tw:[font-size:0.79rem];
  @apply tw:[color:#64748b];
  @apply tw:[line-height:1.5];
}

.teacher-security-rules-card {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.75rem_0.8rem];
}

.teacher-security-rules-card p {
  @apply tw:[margin:0_0_0.6rem];
  @apply tw:[color:#334155];
  @apply tw:[font-weight:600];
  @apply tw:[font-size:0.8rem];
}

.teacher-password-rules {
  @apply tw:[margin:0];
  @apply tw:[padding:0];
  @apply tw:[list-style:none];
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.teacher-password-rules li {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.55rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.79rem];
  @apply tw:[line-height:1.35];
}

.teacher-password-rules li i {
  @apply tw:[margin-top:0.1rem];
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.78rem];
}

.teacher-password-rules li.met {
  @apply tw:[color:#166534];
}

.teacher-password-rules li.met i {
  @apply tw:[color:#16a34a];
}

.teacher-security-tip {
  @apply tw:[margin:0];
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.55rem];
  @apply tw:[padding:0.7rem_0.75rem];
  @apply tw:[border:1px_solid_#b9dca7];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#eef8e9];
  @apply tw:[color:#4a7f31];
  @apply tw:[font-size:0.77rem];
  @apply tw:[line-height:1.5];
}

.teacher-security-tip i {
  @apply tw:[margin-top:0.08rem];
}

.teacher-security-match {
  @apply tw:[margin-top:0.1rem];
  @apply tw:[padding:0.45rem_0.6rem];
  @apply tw:[border-radius:10px];
  @apply tw:[border:1px_solid_#fecaca];
  @apply tw:[background:#fff5f5];
  @apply tw:[font-size:0.79rem];
  @apply tw:[color:#b91c1c];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
}

.teacher-security-match.valid {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
}

.panel-form {
  @apply tw:grid;
  @apply tw:[gap:0.8rem];
}

.field-row {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.9rem];
}

.field-group {
  @apply tw:grid;
  @apply tw:[gap:0.3rem];
}

.field-group label {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.73rem];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
  @apply tw:[font-weight:700];
}

.settings-input {
  @apply tw:w-full;
  @apply tw:[min-height:44px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.68rem_0.78rem];
  @apply tw:[font-size:0.88rem];
  @apply tw:[color:#0f172a];
  @apply tw:[background:#ffffff];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease];
}

.settings-input:focus-visible {
  @apply tw:[outline:none];
  @apply tw:[border-color:#3b82f6];
  @apply tw:[box-shadow:0_0_0_3px_rgba(59,_130,_246,_0.18)];
}

.teacher-security-form .settings-input {
  @apply tw:[min-height:48px];
  @apply tw:[border:1px_solid_#d5e5cd];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.78rem_0.86rem];
  @apply tw:[background:#fcfefb];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease,_background_0.2s_ease];
}

.teacher-security-form .settings-input:focus-visible {
  @apply tw:[border-color:#8fbd76];
  @apply tw:[box-shadow:0_0_0_4px_rgba(105,_170,_71,_0.14)];
  @apply tw:[background:#ffffff];
}

.helper-text {
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.74rem];
  @apply tw:[margin:0];
}

.field-error {
  @apply tw:[color:#b91c1c];
  @apply tw:[font-size:0.74rem];
  @apply tw:[margin:0];
}

.password-wrap {
  @apply tw:relative;
}

.password-wrap .settings-input {
  @apply tw:[padding-right:2.45rem];
}

.password-toggle {
  @apply tw:absolute;
  @apply tw:[top:50%];
  @apply tw:[right:0.48rem];
  @apply tw:[transform:translateY(-50%)];
  @apply tw:[width:30px];
  @apply tw:[height:30px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:8px];
  @apply tw:[background:#fff];
  @apply tw:[color:#475569];
  @apply tw:cursor-pointer;
}

.teacher-security-form .password-wrap .settings-input {
  @apply tw:[padding-right:2.9rem];
}

.teacher-security-form .password-toggle {
  @apply tw:[right:0.6rem];
  @apply tw:[width:34px];
  @apply tw:[height:34px];
  @apply tw:[border:1px_solid_#d6e8cc];
  @apply tw:[border-radius:10px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f7fbf4_100%)];
  @apply tw:[transition:all_0.2s_ease];
}

.teacher-security-form .password-toggle:hover {
  @apply tw:[background:#eef8e9];
  @apply tw:[border-color:#8fbd76];
  @apply tw:[color:#4f8f2f];
}

.password-rules {
  @apply tw:[margin:0];
  @apply tw:[padding-left:1rem];
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.password-rules li {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.77rem];
}

.password-rules li.met {
  @apply tw:[color:#166534];
}

.toggle-list {
  @apply tw:grid;
  @apply tw:[gap:0.5rem];
}

.toggle-item {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f8fafc];
  @apply tw:[padding:0.8rem_0.85rem];
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:items-center;
  @apply tw:[gap:0.6rem];
}

.toggle-item input[type='checkbox'] {
  @apply tw:[width:18px];
  @apply tw:[height:18px];
  @apply tw:[accent-color:#2563eb];
}

.panel-actions {
  @apply tw:[margin-top:0.25rem];
  @apply tw:flex;
  @apply tw:justify-end;
}

.preference-panel,
.appearance-panel {
  @apply tw:[align-content:start];
}

.settings-section-heading {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.75rem];
}

.settings-section-icon,
.session-device-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:flex-none;
  @apply tw:[border-radius:12px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[color:#4f8f2f];
  @apply tw:[background:#eef8e9];
  @apply tw:[border:1px_solid_#cfe5c3];
}

.preference-list,
.theme-options,
.session-list {
  @apply tw:grid;
  @apply tw:[gap:0.65rem];
}

.preference-row,
.theme-option,
.session-item {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f8fafc];
}

.preference-row {
  @apply tw:[padding:0.8rem_0.9rem];
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:items-center;
  @apply tw:[gap:1rem];
  @apply tw:cursor-pointer;
}

.preference-row span,
.theme-option > span:last-child,
.session-copy {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.preference-row strong,
.theme-option strong,
.session-copy strong {
  @apply tw:[color:#1e293b];
  @apply tw:[font-size:0.86rem];
}

.preference-row small,
.theme-option small,
.session-copy small,
.sessions-footer p {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:[line-height:1.4];
}

.settings-toggle-input {
  @apply tw:[width:20px];
  @apply tw:[height:20px];
  @apply tw:flex-none;
  @apply tw:[accent-color:#5b9b3c];
}

.preference-actions {
  @apply tw:flex;
  @apply tw:justify-end;
}

.settings-save-button {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[background:#5b9b3c]!;
  @apply tw:[border-color:#5b9b3c]!;
}

.theme-option {
  @apply tw:w-full;
  @apply tw:[padding:0.75rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:text-left;
  @apply tw:cursor-pointer;
  @apply tw:[transition:border-color_0.2s_ease,_background_0.2s_ease,_transform_0.2s_ease];
}

.theme-option:hover,
.theme-option.active {
  @apply tw:[border-color:#8fbd76];
  @apply tw:[background:#f3faef];
  @apply tw:[transform:translateY(-1px)];
}

.theme-option-preview {
  @apply tw:[width:46px];
  @apply tw:[height:38px];
  @apply tw:[border-radius:10px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[border:1px_solid_#cbd5e1];
}

.theme-preview-light { @apply tw:[background:#ffffff]; @apply tw:[color:#f59e0b]; }
.theme-preview-system { @apply tw:[background:linear-gradient(135deg,_#ffffff_50%,_#1e293b_50%)]; @apply tw:[color:#69aa47]; }
.theme-preview-dark { @apply tw:[background:#172033]; @apply tw:[color:#cbd5e1]; }

.sessions-panel,
.teacher-security-panel {
  @apply tw:[grid-column:1_/_-1];
}

.sessions-panel-header,
.sessions-footer,
.session-item,
.session-title-line {
  @apply tw:flex;
  @apply tw:items-center;
}

.sessions-panel-header,
.sessions-footer {
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

.session-item {
  @apply tw:[padding:0.8rem_0.9rem];
  @apply tw:[gap:0.8rem];
}

.session-item.current {
  @apply tw:[border-color:#b9dca7];
  @apply tw:[background:#f5fbf2];
}

.session-copy {
  @apply tw:[flex:1];
  @apply tw:[min-width:0];
}

.session-title-line {
  @apply tw:[gap:0.55rem];
  @apply tw:flex-wrap;
}

.current-session-badge {
  @apply tw:[border-radius:999px];
  @apply tw:[padding:0.18rem_0.5rem];
  @apply tw:[color:#3f7627];
  @apply tw:[background:#e7f4df];
  @apply tw:[font-size:0.67rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
}

.sessions-state {
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[border-radius:14px];
  @apply tw:[color:#64748b];
  @apply tw:text-center;
}

.sessions-state-error { @apply tw:[color:#b91c1c]; @apply tw:[border-color:#fecaca]; @apply tw:[background:#fff7f7]; }
.sessions-footer { @apply tw:[border-top:1px_solid_#e2e8f0]; @apply tw:[padding-top:0.9rem]; }
.sessions-footer p { @apply tw:[margin:0]; }
.danger-action { @apply tw:[background:#fff1f2]; @apply tw:[border:1px_solid_#fecdd3]; @apply tw:[color:#be123c]; }
.danger-action:hover:not(:disabled) { @apply tw:[background:#ffe4e6]; }
.session-revoke-button { @apply tw:ml-auto; }

:global(html[data-teacher-theme='dark']) .settings-panel,
:global(html[data-teacher-theme='dark']) .settings-section-sidebar,
:global(html[data-teacher-theme='dark']) .preference-row,
:global(html[data-teacher-theme='dark']) .theme-option,
:global(html[data-teacher-theme='dark']) .session-item,
:global(html[data-teacher-theme='dark']) .teacher-security-card,
:global(html[data-teacher-theme='dark']) .teacher-security-side,
:global(html[data-teacher-theme='dark']) .teacher-security-strength-card,
:global(html[data-teacher-theme='dark']) .teacher-security-rules-card {
  @apply tw:[background:#172033];
  @apply tw:[border-color:#334155];
  @apply tw:[color:#e2e8f0];
}

:global(html[data-teacher-theme='dark']) .settings-panel h3,
:global(html[data-teacher-theme='dark']) .settings-sidebar-heading span,
:global(html[data-teacher-theme='dark']) .settings-panel strong,
:global(html[data-teacher-theme='dark']) .teacher-security-field-label > span,
:global(html[data-teacher-theme='dark']) .teacher-security-side-header h5 {
  @apply tw:[color:#f8fafc];
}

.btn:focus-visible,
.password-toggle:focus-visible {
  @apply tw:[outline:none];
  @apply tw:[box-shadow:0_0_0_3px_rgba(59,_130,_246,_0.22)];
}

@media (max-width: 900px) {
  .teacher-main {
    @apply tw:[padding:0.85rem]!;
  }

  .settings-workspace,
  .settings-grid,
  .field-row,
  .teacher-security-form {
    @apply tw:[grid-template-columns:1fr];
  }

  .settings-section-sidebar {
    @apply tw:static;
  }

  .settings-section-nav {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }

  .settings-section-nav-item {
    @apply tw:[grid-template-columns:20px_minmax(0,_1fr)];
  }

  .settings-nav-chevron {
    @apply tw:hidden;
  }

  .teacher-security-panel-header,
  .teacher-security-actions {
    @apply tw:flex-col;
    @apply tw:items-stretch;
  }

  .teacher-security-pills {
    @apply tw:justify-start;
  }

  .teacher-security-submit {
    @apply tw:w-full;
  }
}

@media (max-width: 640px) {
  .settings-section-nav {
    @apply tw:[grid-template-columns:1fr];
  }

  .teacher-security-pills {
    @apply tw:w-full;
  }

  .teacher-security-pill {
    @apply tw:w-full;
    @apply tw:justify-center;
  }

  .teacher-security-field-label {
    @apply tw:flex-col;
    @apply tw:items-start;
    @apply tw:[gap:0.35rem];
  }

  .teacher-security-card,
  .teacher-security-side {
    @apply tw:[padding:0.85rem];
  }

  .sessions-panel-header,
  .sessions-footer,
  .session-item {
    @apply tw:items-stretch;
    @apply tw:flex-col;
  }

  .session-revoke-button,
  .danger-action {
    @apply tw:w-full;
  }
}
.teacher-security-form input[aria-invalid="true"] { @apply tw:[border-color:#dc2626]; }

</style>