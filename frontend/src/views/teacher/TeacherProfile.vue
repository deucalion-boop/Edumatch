<template>
  <div class="teacher-dashboard">
    <main class="teacher-main">
      <header class="top-header" data-tour="profile-header">
        <div class="header-content">
          <div class="header-left">
            <div>
              <h1>My Profile</h1>
              <p class="header-subtitle">View and update your profile details.</p>
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
      <div class="teacher-profile-page">
        <div v-if="isLoading" class="profile-content">
          <div class="profile-main">
            <div class="profile-details-card">
              <h3 class="details-title">Loading Profile</h3>
              <p>Loading your profile information...</p>
            </div>
          </div>
        </div>

        <div v-else-if="loadError" class="profile-content">
          <div class="profile-main">
            <div class="profile-details-card">
              <h3 class="details-title">Unable to Load Profile</h3>
              <p>{{ loadError }}</p>
              <button class="btn btn-outline" @click="fetchUserData">Retry</button>
            </div>
          </div>
        </div>

        <div v-else class="profile-content">
          <div class="profile-sidebar">
            <div class="profile-card" data-tour="profile-summary-card">
              <div class="profile-header">
                <div class="profile-avatar">
                  <div class="profile-avatar-placeholder" id="profile-image" aria-hidden="true">
                    <img v-if="teacherAvatarUrl" :src="teacherAvatarUrl" alt="Profile avatar">
                    <i v-else class="fas fa-user icon-sem-profile"></i>
                  </div>
                  <div class="avatar-actions">
                    <button class="avatar-action-btn" @click="triggerAvatarUpload">
                      <i class="fas fa-camera student-avatar-camera-icon"></i>
                    </button>
                    <input
                      type="file"
                      ref="avatarUpload"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      hidden
                      @change="handleAvatarUpload"
                    >
                  </div>
                </div>
                <div class="profile-info">
                  <h2>{{ user.displayName || user.username }}</h2>
                  <p class="profile-role">{{ user.role }}</p>
                  <p v-if="user.subject" class="profile-role">{{ user.subject }}</p>
                  <div class="profile-status">
                    <span class="status-indicator active"></span>
                    <span>{{ user.statusLabel }}</span>
                  </div>
                </div>
              </div>

              <div class="profile-actions" data-tour="profile-edit-actions">
                <button class="btn btn-primary btn-block" @click="enableEditMode">
                  <i class="fas fa-edit student-profile-edit-icon"></i>
                  Edit Profile
                </button>
                <button class="btn btn-outline btn-block" @click="shareProfile">
                  <i class="fas fa-share-alt icon-sem-profile"></i>
                  Share Profile
                </button>
              </div>
            </div>

            <div class="profile-details-card">
              <h3 class="details-title">Profile Details</h3>
              <div class="detail-item">
                <div class="detail-icon">
                  <i class="fas fa-envelope icon-sem-profile"></i>
                </div>
                <div class="detail-content">
                  <div class="detail-label">Email</div>
                  <div class="detail-value">{{ user.email }}</div>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon">
                  <i class="fas fa-phone icon-sem-analytics"></i>
                </div>
                <div class="detail-content">
                  <div class="detail-label">Phone</div>
                  <div class="detail-value">{{ user.contactNumber || 'Not provided' }}</div>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon">
                  <i class="fas fa-book-open icon-sem-profile"></i>
                </div>
                <div class="detail-content">
                  <div class="detail-label">Subject</div>
                  <div class="detail-value">{{ user.subject || 'Not assigned' }}</div>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon">
                  <i class="fas fa-user-check icon-sem-profile"></i>
                </div>
                <div class="detail-content">
                  <div class="detail-label">Role</div>
                  <div class="detail-value">{{ user.role || 'teacher' }}</div>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon">
                  <i class="fas fa-calendar icon-sem-assignments"></i>
                </div>
                <div class="detail-content">
                  <div class="detail-label">Joined</div>
                  <div class="detail-value">{{ user.createdAt ? formatDate(user.createdAt) : 'Not provided' }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="profile-main">
            <div class="profile-tab-content">
              <div class="tab-pane active">
                <div class="tab-header">
                  <h3>Personal Information</h3>
                  <p>Manage your personal details and contact information</p>
                </div>

                <form class="profile-form" novalidate @submit.prevent="savePersonalInfo" data-tour="profile-personal-form">
                  <div class="profile-form-section">
                    <h4 class="form-section-title">Basic Information</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="first-name">First Name</label>
                        <input
                          id="first-name"
                          v-model="formData.firstName"
                          type="text"
                          :readonly="!isEditing"
                         :aria-invalid="Boolean(fieldErrors.firstName)" :aria-describedby="fieldErrors.firstName ? 'firstName-error' : undefined" @input="validateCommonFields" maxlength="50">
                        <small v-if="fieldErrors.firstName" id="firstName-error" class="field-error" role="alert">{{ fieldErrors.firstName }}</small>
                      </div>
                      <div class="form-group">
                        <label for="last-name">Last Name</label>
                        <input
                          id="last-name"
                          v-model="formData.lastName"
                          type="text"
                          :readonly="!isEditing"
                         :aria-invalid="Boolean(fieldErrors.lastName)" :aria-describedby="fieldErrors.lastName ? 'lastName-error' : undefined" @input="validateCommonFields" maxlength="50">
                        <small v-if="fieldErrors.lastName" id="lastName-error" class="field-error" role="alert">{{ fieldErrors.lastName }}</small>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="email">Email Address</label>
                      <input
                        id="email"
                        v-model="formData.email"
                        type="email"
                        :readonly="!isEditing"
                       :aria-invalid="Boolean(fieldErrors.email)" :aria-describedby="fieldErrors.email ? 'email-error' : undefined" @input="validateCommonFields">
                        <small v-if="fieldErrors.email" id="email-error" class="field-error" role="alert">{{ fieldErrors.email }}</small>
                    </div>

                    <div class="form-group">
                      <label for="username">Username</label>
                      <input
                        id="username"
                        :value="user.username"
                        type="text"
                        readonly
                      >
                    </div>
                  </div>

                  <div class="profile-form-section">
                    <h4 class="form-section-title">Contact Details</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="phone">Phone Number</label>
                        <input
                          id="phone"
                          v-model="formData.phone"
                          type="tel"
                          inputmode="tel"
                          placeholder="09123456789 or +639123456789"
                          :readonly="!isEditing"
                         :aria-invalid="Boolean(fieldErrors.phone)" :aria-describedby="fieldErrors.phone ? 'phone-error' : undefined" @input="validateCommonFields">
                        <small v-if="fieldErrors.phone" id="phone-error" class="field-error" role="alert">{{ fieldErrors.phone }}</small>
                      </div>
                    </div>
                  </div>

                  <div v-if="isEditing" class="form-actions">
                    <button type="button" class="btn btn-secondary" @click="cancelEdit">
                      Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="isSaving">
                      {{ isSaving ? 'Saving...' : 'Save Changes' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
          :aria-label="`Profile tour step ${tourStepIndex + 1} of ${tourSteps.length}`"
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
import { nameError, phoneError } from '../../utils/teacherValidation.js'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
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
const CURRENT_PAGE_ROUTE = '/teacher/profile'
const TOUR_ROUTE_ORDER = ['/teacher/dashboard', '/teacher/activities', '/teacher/students', '/teacher/records']
const TOUR_PROGRESS_PREFIX = 'edumatch_teacher_tour_progress_v3_'
const SIDEBAR_BREAKPOINT = 1024
const SIDEBAR_WIDTH = 280
const isEditing = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const loadError = ref('')
const selectedAvatarFile = ref(null)
const avatarUpload = ref(null)
const originalFormData = ref(null)
const tourSteps = [
  {
    key: 'profile-header',
    title: 'Profile Overview',
    description: 'Profile is where you manage personal details and professional account information.',
    selector: '[data-tour="profile-header"]'
  },
  {
    key: 'summary-card',
    title: 'Profile Summary Card',
    description: 'This card shows your avatar, role, and live account status.',
    selector: '[data-tour="profile-summary-card"]'
  },
  {
    key: 'edit-actions',
    title: 'Profile Actions',
    description: 'Use these actions to edit account details and update your profile presentation.',
    selector: '[data-tour="profile-edit-actions"]'
  },
  {
    key: 'personal-form',
    title: 'Personal Information Form',
    description: 'Update name, email, contact details, and bio from this form.',
    selector: '[data-tour="profile-personal-form"]'
  }
]
const activeTourStep = computed(() => tourSteps[tourStepIndex.value] || null)
const isLastTourStep = computed(() => tourStepIndex.value >= tourSteps.length - 1)
const isFirstTourStep = computed(() => tourStepIndex.value === 0 && TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE) === 0)
const isFinalTourStep = computed(() => isLastTourStep.value && TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE) === TOUR_ROUTE_ORDER.length - 1)

const user = reactive({
  displayName: '',
  username: '',
  email: '',
  role: 'Teacher',
  status: 'active',
  statusLabel: 'Active',
  subject: '',
  contactNumber: '',
  profileImage: '',
  createdAt: null,
})

const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
})

const resolveProfileImageUrl = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^blob:/i.test(raw)) return raw
  if (/^https?:\/\//i.test(raw)) return raw
  return raw.startsWith('/') ? raw : `/${raw}`
}

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}

const getAuthConfig = (headers = {}) => {
  const token = String(authStore.token || '').trim()
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  }
}

const parseName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  }
}

const normalizeRole = (role) => {
  const normalized = String(role || 'teacher').trim().toLowerCase()
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Teacher'
}

const formatDate = (value) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not provided'
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const applyUserProfile = (apiUser = {}) => {
  const fullName = apiUser.name || authStore.user?.name || authStore.user?.displayName || 'Teacher'
  const role = normalizeRole(apiUser.role)
  const profileImage = resolveProfileImageUrl(apiUser.profileImage || '')
  const statusValue = String(apiUser.status || 'active').toLowerCase()
  const statusLabel = statusValue ? statusValue.charAt(0).toUpperCase() + statusValue.slice(1) : 'Active'

  user.displayName = fullName
  user.username = apiUser.username || authStore.user?.username || ''
  user.email = apiUser.email || ''
  user.role = role
  user.status = statusValue
  user.statusLabel = statusLabel
  user.subject = apiUser.subject || authStore.user?.subject || ''
  user.contactNumber = normalizePhilippinePhone(apiUser.contactNumber)
  user.profileImage = profileImage
  user.createdAt = apiUser.createdAt || null
}

const initializeFormData = () => {
  const nameParts = parseName(user.displayName || '')
  formData.firstName = nameParts.firstName || ''
  formData.lastName = nameParts.lastName || ''
  formData.email = user.email || ''
  formData.phone = user.contactNumber || ''
  formData.address = ''
  saveOriginalData()
}

const saveOriginalData = () => {
  originalFormData.value = JSON.parse(JSON.stringify(formData))
}

const showToast = (type, message) => {
  const method = type === 'error' ? 'error' : 'log'
  console[method](message)
}

const enableEditMode = () => {
  isEditing.value = true
  saveOriginalData()
}

const cancelEdit = () => {
  Object.keys(fieldErrors).forEach((field) => { fieldErrors[field] = '' })
  isEditing.value = false
  if (originalFormData.value) {
    Object.assign(formData, originalFormData.value)
  }
  selectedAvatarFile.value = null
  showToast('info', 'Edit cancelled')
}

const triggerAvatarUpload = () => {
  avatarUpload.value?.click()
}

const handleAvatarUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
  const isValidMimeType = allowedMimeTypes.has(String(file.type || '').toLowerCase())
  if (!isValidMimeType) {
    showToast('error', 'Only JPG, JPEG, PNG, or WEBP images are allowed')
    event.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('error', 'Image size should be less than 5MB')
    event.target.value = ''
    return
  }

  if (!isEditing.value) {
    isEditing.value = true
    saveOriginalData()
  }

  selectedAvatarFile.value = file
  user.profileImage = URL.createObjectURL(file)
  showToast('success', 'Profile picture ready. Click Save Changes to apply.')
}

const fieldErrors = reactive({ firstName: '', lastName: '', email: '', phone: '' })
const validateCommonFields = () => {
  const fullName = `${formData.firstName} ${formData.lastName}`.trim()
  const email = String(formData.email || '').trim()
  const contactNumber = normalizePhilippinePhone(formData.phone)

  fieldErrors.firstName = nameError(formData.firstName, 'First name')
  fieldErrors.lastName = nameError(formData.lastName, 'Last name')
  fieldErrors.phone = phoneError(formData.phone)
  fieldErrors.email = ''
  if (!email) fieldErrors.email = 'Email is required'

  const emailRegex = /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@gmail\.com$/i
  if (!emailRegex.test(email)) fieldErrors.email = 'Please enter a valid Gmail address (e.g., user@gmail.com)'

  if (Object.values(fieldErrors).some(Boolean)) return { error: 'Please correct the highlighted fields.' }

  return { fullName, email, contactNumber }
}

const saveProfile = async (successMessage) => {
  const token = String(authStore.token || '').trim()
  if (!token) {
    showToast('error', 'Your session expired. Please login again.')
    return
  }

  const validation = validateCommonFields()
  if (validation.error) {
    showToast('error', validation.error)
    return
  }

  isSaving.value = true
  try {
    const payload = new FormData()
    payload.append('name', validation.fullName)
    payload.append('email', validation.email)
    payload.append('contactNumber', validation.contactNumber)
    if (selectedAvatarFile.value) {
      payload.append('profileImage', selectedAvatarFile.value)
    }

    const response = await axios.put(`${resolveApiBaseUrl()}/teacher/profile`, payload, getAuthConfig())
    const updatedUser = response.data?.user
    if (!updatedUser) throw new Error('Profile update response was invalid')

    applyUserProfile(updatedUser)
    initializeFormData()
    authStore.setUser({
      ...authStore.user,
      ...updatedUser,
      displayName: updatedUser.name || validation.fullName,
      role: 'teacher',
    })

    selectedAvatarFile.value = null
    isEditing.value = false
    showToast('success', successMessage)
  } catch (error) {
    showToast('error', error.response?.data?.message || 'Failed to update profile information')
  } finally {
    isSaving.value = false
  }
}

const savePersonalInfo = async () => {
  await saveProfile('Personal information updated successfully')
}

const fetchUserData = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/profile`, getAuthConfig())
    const apiUser = response.data?.user
    if (!apiUser) throw new Error('Profile response is missing user data')

    applyUserProfile(apiUser)
    initializeFormData()
    authStore.setUser({
      ...authStore.user,
      ...apiUser,
      displayName: apiUser.name || user.displayName,
      role: 'teacher',
    })
  } catch (error) {
    loadError.value = error.response?.data?.message || 'Failed to load profile data'
    showToast('error', loadError.value)
  } finally {
    isLoading.value = false
  }
}

const shareProfile = () => {
  if (navigator.share) {
    navigator.share({
      title: `${user.displayName}'s Profile`,
      text: `Check out ${user.displayName}'s profile on EduMatch!`,
      url: window.location.href,
    }).catch(() => {})
    return
  }

  navigator.clipboard.writeText(window.location.href)
  showToast('success', 'Profile link copied to clipboard!')
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
    const response = await axios.patch(`${resolveApiBaseUrl()}/teacher/tour-preference`, { hasCompletedTeacherTour: value === true }, getAuthConfig())
    authStore.setUser({ ...(response.data?.user || {}), hasCompletedTeacherTour: value === true })
  } catch (error) {
    console.error('Failed to persist teacher tour preference:', error)
  }
}
const ensureStepContext = async (step) => {
  if (!step) return
  await nextTick()
  await wait(60)
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
  await ensureStepContext(activeTourStep.value)
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
    const routeIndex = TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE)
    const nextRoute = routeIndex >= 0 ? TOUR_ROUTE_ORDER[routeIndex + 1] : null
    if (nextRoute) {
      writeTourProgress({ active: true, step: 0, updatedAt: Date.now() })
      closeTour({ markSeen: false })
      await router.push(nextRoute)
      return
    }
    return closeTour({ markSeen: true })
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

const isActiveRoute = (path) => route.path === path || route.path.startsWith(`${path}/`)
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }
const syncMobileMenuBodyState = () => {
  if (typeof window === 'undefined') return
  const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
  document.body.classList.toggle('teacher-mobile-menu-open', shouldLockBody)
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

const handleEscape = (event) => {
  if (event.key !== 'Escape') return
  if (isTourActive.value) {
    skipTour()
    return
  }
  if (isSidebarOpen.value) closeSidebar()
}

const teacherAvatarUrl = computed(() => {
  const userProfileImage = String(user.profileImage || '').trim()
  if (userProfileImage && !userProfileImage.toLowerCase().includes('ui-avatars.com')) return userProfileImage
  const profileImage = String(authStore.user?.profileImage || '').trim()
  if (profileImage && !profileImage.toLowerCase().includes('ui-avatars.com')) return resolveProfileImageUrl(profileImage)
  return ''
})

onMounted(() => {
  fetchUserData()
  document.addEventListener('keydown', handleEscape)
  document.addEventListener('click', handleAccountMenuClickOutside)
  window.addEventListener('resize', handleTourViewportChange)
  window.addEventListener('scroll', handleTourViewportChange, true)
  window.addEventListener('resize', syncMobileMenuBodyState)
  maybeAutoStartTour()
  syncMobileMenuBodyState()
})

watch(
  () => isSidebarOpen.value,
  () => {
    syncMobileMenuBodyState()
  }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  document.removeEventListener('click', handleAccountMenuClickOutside)
  window.removeEventListener('resize', handleTourViewportChange)
  window.removeEventListener('scroll', handleTourViewportChange, true)
  window.removeEventListener('resize', syncMobileMenuBodyState)
  closeTour({ markSeen: false })
  document.body.classList.remove('teacher-mobile-menu-open')
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

.teacher-page-tour-backdrop {
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[background:rgba(15,_23,_42,_0.58)];
}

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

.teacher-page-tour-actions {
  @apply tw:[margin-top:1rem];
  @apply tw:flex;
  @apply tw:[gap:0.55rem];
  @apply tw:justify-end;
}

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

.teacher-profile-page {
  @apply tw:w-full;
}

.teacher-main {
  @apply tw:[margin-left:0]!;
  @apply tw:w-full;
  @apply tw:max-w-none;
}

.profile-content {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(300px,_360px)_minmax(0,_1fr)];
  @apply tw:[gap:28px];
  @apply tw:[padding:4px_0_28px];
  @apply tw:[align-items:start];
}

.profile-sidebar,
.profile-main {
  @apply tw:[min-width:0];
}

.teacher-dashboard .teacher-profile-page .profile-card,
.teacher-dashboard .teacher-profile-page .profile-details-card,
.teacher-dashboard .teacher-profile-page .profile-tab-content {
  @apply tw:[border:1px_solid_rgba(148,_163,_184,_0.22)]!;
  @apply tw:[border-radius:20px]!;
  @apply tw:[box-shadow:0_18px_38px_rgba(15,_23,_42,_0.08)]!;
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)]!;
}

.teacher-dashboard .teacher-profile-page .profile-card,
.teacher-dashboard .teacher-profile-page .profile-details-card {
  @apply tw:[padding:22px];
}

.teacher-dashboard .teacher-profile-page .profile-card {
  @apply tw:[margin-top:1px];
  @apply tw:[border-radius:24px]!;
  @apply tw:[background:linear-gradient(180deg,_#F9FAFB_0%,_#F9FAFB_100%)_padding-box,_linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!;
}

.teacher-dashboard .teacher-profile-page .profile-tab-content {
  @apply tw:[border-color:transparent]!;
  @apply tw:[background:linear-gradient(180deg,_#F9FAFB_0%,_#F9FAFB_100%)_padding-box,_linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!;
}

.teacher-dashboard .teacher-profile-page .profile-details-card {
  @apply tw:[border-color:transparent]!;
  @apply tw:[background:linear-gradient(180deg,_#F9FAFB_0%,_#F9FAFB_100%)_padding-box,_linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!;
}

.teacher-dashboard .teacher-profile-page .profile-header {
  @apply tw:flex;
    @apply tw:flex-col;
    @apply tw:items-center;
    @apply tw:text-center;
    @apply tw:[padding-top:6px];
    @apply tw:[padding-bottom:18px];
    @apply tw:[margin-bottom:18px];
    @apply tw:[border-bottom:1px_solid_rgba(148,_163,_184,_0.2)];
}

.profile-avatar {
  @apply tw:relative;
  @apply tw:[width:96px];
  @apply tw:[height:96px];
  @apply tw:[margin:-6px_auto_16px];
}

.profile-avatar-placeholder {
  @apply tw:w-full;
  @apply tw:h-full;
  @apply tw:min-w-full;
  @apply tw:min-h-full;
  @apply tw:max-w-full;
  @apply tw:max-h-full;
  @apply tw:[aspect-ratio:1_/_1];
  @apply tw:[border-radius:50%];
  @apply tw:overflow-hidden;
  @apply tw:[border:0.25px_solid_#111111]!;
  @apply tw:[box-shadow:0_4px_12px_rgba(79,_70,_229,_0.16)];
  @apply tw:[background:linear-gradient(135deg,_#f9fafb,_rgba(79,_70,_229,_0.15))];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
}

.profile-avatar-placeholder img {
  @apply tw:w-full;
  @apply tw:h-full;
  @apply tw:object-cover;
  @apply tw:[object-position:center];
  @apply tw:block;
}

.profile-avatar-placeholder i {
  @apply tw:[font-size:2rem];
  @apply tw:[color:#111111];
}

.avatar-actions {
  @apply tw:absolute;
  @apply tw:[bottom:0];
  @apply tw:[right:0];
}

.avatar-action-btn {
  @apply tw:[width:36px];
  @apply tw:[height:36px];
  @apply tw:[border-radius:50%];
  @apply tw:[background:#111111];
  @apply tw:[color:#ffffff];
  @apply tw:[border:none];
  @apply tw:cursor-pointer;
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[transition:all_0.3s_ease];
  @apply tw:[box-shadow:0_4px_12px_rgba(51,_65,_85,_0.3)];
}

.avatar-action-btn:hover {
  @apply tw:[background:#1f2937];
  @apply tw:[transform:scale(1.1)];
}

.avatar-action-btn .student-avatar-camera-icon {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.profile-info h2 {
  @apply tw:[font-size:1.35rem];
  @apply tw:[line-height:1.3];
  @apply tw:[margin:0_0_4px];
  @apply tw:[color:#111111];
}

.profile-role {
  @apply tw:[font-size:0.88rem];
  @apply tw:[margin:0_0_10px];
  @apply tw:[color:#374151];
}

.profile-status {
  @apply tw:[margin-bottom:12px];
}

.profile-actions {
  @apply tw:grid;
  @apply tw:[gap:8px];
}

.profile-actions .btn-primary {
  @apply tw:w-full;
  @apply tw:[min-height:40px];
  @apply tw:[padding:10px_16px];
  @apply tw:[background:#4f8a35]!;
  @apply tw:[border:1px_solid_#4f8a35]!;
  @apply tw:[border-radius:11px];
  @apply tw:[color:#ffffff]!;
  @apply tw:bg-none!;
  @apply tw:[box-shadow:0_2px_5px_rgba(30,_67,_7,_0.22)];
}

.profile-actions .btn-primary:hover {
  @apply tw:[background:#3f702b]!;
  @apply tw:[border-color:#3f702b]!;
  @apply tw:[box-shadow:0_4px_8px_rgba(23,_52,_5,_0.24)];
}

.profile-actions .btn-primary .student-profile-edit-icon {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.profile-actions .btn-outline {
  @apply tw:w-full;
  @apply tw:[min-height:40px];
  @apply tw:[padding:10px_16px];
  @apply tw:[background:transparent]!;
  @apply tw:[border:none]!;
  @apply tw:rounded-none;
  @apply tw:[color:#111827]!;
  @apply tw:bg-none!;
  @apply tw:[box-shadow:none]!;
}

.profile-actions .btn-outline:hover {
  @apply tw:[background:transparent]!;
  @apply tw:[color:#111111]!;
  @apply tw:[box-shadow:none]!;
  @apply tw:transform-none;
}

.details-title {
  @apply tw:[font-size:1.04rem];
  @apply tw:[margin:0_0_18px];
}

.profile-details-card .detail-item {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:12px];
  @apply tw:[padding:12px_0];
  @apply tw:[margin-bottom:0];
  @apply tw:[border-bottom:1px_solid_rgba(148,_163,_184,_0.16)];
}

.profile-details-card .detail-item:last-child {
  @apply tw:[border-bottom:none];
}

.profile-details-card .detail-icon {
  @apply tw:[width:36px];
  @apply tw:[height:36px];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#f8fafc];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
}

.profile-details-card .detail-label {
  @apply tw:[font-size:0.68rem];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:[color:#94a3b8];
  @apply tw:uppercase;
}

.profile-details-card .detail-value {
  @apply tw:[font-size:0.9rem];
  @apply tw:[line-height:1.45];
  @apply tw:[color:#111111];
}

.profile-tab-content {
  @apply tw:[padding:0];
}

.tab-pane {
  @apply tw:hidden;
  @apply tw:[padding:28px];
}

.tab-pane.active {
  @apply tw:block;
}

.tab-header {
  @apply tw:[margin-bottom:24px];
}

.teacher-dashboard .teacher-profile-page .profile-form-section {
  @apply tw:[padding:20px];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#f8fafc];
  @apply tw:[border:1px_solid_rgba(148,_163,_184,_0.14)];
}

.tab-header h3 {
  @apply tw:[font-size:1.35rem];
  @apply tw:[margin-bottom:6px];
}

.tab-header p {
  @apply tw:[font-size:0.9rem];
  @apply tw:[color:#374151];
  @apply tw:[margin:0];
}

.profile-form {
  @apply tw:max-w-full;
}

.profile-form-section {
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_rgba(148,_163,_184,_0.2)];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:16px];
  @apply tw:[margin-bottom:16px];
}

.form-section-title {
  @apply tw:[margin:0_0_12px];
  @apply tw:[font-size:0.95rem];
  @apply tw:[font-weight:600];
  @apply tw:[color:#111111];
}

.form-row {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:14px];
  @apply tw:[margin-bottom:12px];
}

.form-group {
  @apply tw:[margin-bottom:14px];
}

.form-group:last-child {
  @apply tw:[margin-bottom:0];
}

.form-group label {
  @apply tw:inline-block;
  @apply tw:[font-size:0.78rem];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.06em];
  @apply tw:[color:#94a3b8];
  @apply tw:[margin-bottom:6px];
}

.form-group input,
.form-group select,
.form-group textarea {
  @apply tw:w-full;
  @apply tw:[border-radius:10px];
  @apply tw:[border:1px_solid_rgba(148,_163,_184,_0.32)];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#111111];
  @apply tw:[font-size:0.92rem];
  @apply tw:[line-height:1.45];
  @apply tw:[padding:0.72rem_0.8rem];
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:rgba(51,_65,_85,_0.45)];
  @apply tw:[box-shadow:0_0_0_3px_rgba(51,_65,_85,_0.12)];
}

.form-group input:read-only,
.form-group textarea:read-only,
.form-group select:disabled {
  @apply tw:[background:#f9fafb];
  @apply tw:[color:#475569];
  @apply tw:[border-color:rgba(148,_163,_184,_0.25)];
}

.form-actions {
  @apply tw:flex;
  @apply tw:justify-end;
  @apply tw:[gap:10px];
  @apply tw:[margin-top:20px];
  @apply tw:[padding-top:16px];
}

.form-actions .btn {
  @apply tw:[min-width:130px];
  @apply tw:justify-center;
}

/* Compact desktop profile designed to fit without nested scrolling. */
@media (min-width: 1101px) {
  :global(body.teacher-dashboard) .teacher-main > .top-header[data-tour="profile-header"] {
    @apply tw:[margin-bottom:1rem]!;
    @apply tw:[padding:0.85rem_1rem]!;
  }

  :global(body.teacher-dashboard) .teacher-main > .teacher-profile-page > .profile-content {
    @apply tw:[grid-template-columns:minmax(330px,_380px)_minmax(0,_1fr)]!;
    @apply tw:[gap:1rem]!;
    @apply tw:[padding:0]!;
  }

  .profile-sidebar {
    @apply tw:grid;
    @apply tw:[gap:0.85rem];
  }

  .teacher-dashboard .teacher-profile-page .profile-card,
  .teacher-dashboard .teacher-profile-page .profile-details-card {
    @apply tw:[padding:1rem];
    @apply tw:[border-radius:16px]!;
  }

  .teacher-dashboard .teacher-profile-page .profile-header {
    @apply tw:flex-col;
    @apply tw:items-center;
    @apply tw:justify-center;
    @apply tw:[gap:0.65rem];
    @apply tw:[padding:0_0_0.72rem];
    @apply tw:[margin-bottom:0.72rem];
    @apply tw:text-center;
  }

  .profile-avatar {
    @apply tw:[width:84px];
    @apply tw:[height:84px];
    @apply tw:[flex:0_0_84px];
    @apply tw:[margin:0];
  }

  .profile-avatar-placeholder i {
    @apply tw:[font-size:1.8rem];
  }

  .avatar-action-btn {
    @apply tw:[width:34px];
    @apply tw:[height:34px];
  }

  .profile-info {
    @apply tw:[min-width:0];
    @apply tw:flex;
    @apply tw:flex-col;
    @apply tw:items-center;
    @apply tw:justify-center;
    @apply tw:[gap:0.2rem];
    @apply tw:w-full;
  }

  .profile-info h2 {
    @apply tw:max-w-full;
    @apply tw:overflow-hidden;
    @apply tw:[margin:0];
    @apply tw:[font-size:1.2rem];
    @apply tw:text-ellipsis;
    @apply tw:whitespace-nowrap;
  }

  .profile-role,
  .profile-status {
    @apply tw:[margin:0];
    @apply tw:[font-size:0.84rem];
  }

  .profile-status {
    @apply tw:flex;
    @apply tw:items-center;
    @apply tw:justify-center;
  }

  .profile-actions {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
    @apply tw:[gap:0.5rem];
  }

  .profile-actions .btn-primary,
  .profile-actions .btn-outline {
    @apply tw:[min-height:42px];
    @apply tw:[padding:0.6rem_0.72rem];
    @apply tw:[font-size:0.82rem];
  }

  .teacher-dashboard .teacher-profile-page .profile-details-card {
    @apply tw:grid;
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
    @apply tw:[align-content:start];
    @apply tw:[column-gap:0.85rem];
  }

  .details-title {
    @apply tw:[grid-column:1_/_-1];
    @apply tw:[margin-bottom:0.55rem];
    @apply tw:[font-size:1rem];
  }

  .profile-details-card .detail-item {
    @apply tw:[gap:0.6rem];
    @apply tw:[min-width:0];
    @apply tw:[padding:0.5rem_0];
  }

  .profile-details-card .detail-icon {
    @apply tw:[width:32px];
    @apply tw:[height:32px];
    @apply tw:[flex:0_0_32px];
    @apply tw:[border-radius:9px];
    @apply tw:[font-size:0.78rem];
  }

  .profile-details-card .detail-label {
    @apply tw:[font-size:0.66rem];
  }

  .profile-details-card .detail-value {
    @apply tw:overflow-hidden;
    @apply tw:[font-size:0.86rem];
    @apply tw:[line-height:1.35];
    @apply tw:text-ellipsis;
    @apply tw:whitespace-nowrap;
  }

  .teacher-dashboard .teacher-profile-page .profile-tab-content {
    @apply tw:[border-radius:16px]!;
  }

  .tab-pane {
    @apply tw:[padding:1rem];
  }

  .tab-header {
    @apply tw:[margin-bottom:0.8rem];
  }

  .tab-header h3 {
    @apply tw:[margin:0_0_0.15rem];
    @apply tw:[font-size:1.12rem];
  }

  .tab-header p {
    @apply tw:[font-size:0.82rem];
  }

  .profile-form {
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(0,_2fr)_minmax(220px,_1fr)];
    @apply tw:[align-items:start];
    @apply tw:[gap:0.8rem];
  }

  .teacher-dashboard .teacher-profile-page .profile-form-section {
    @apply tw:[margin:0];
    @apply tw:[padding:0.85rem];
    @apply tw:[border-radius:14px];
  }

  .profile-form-section:first-child {
    @apply tw:grid;
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
    @apply tw:[gap:0.7rem];
  }

  .profile-form-section:first-child .form-section-title {
    @apply tw:[grid-column:1_/_-1];
  }

  .profile-form-section:first-child .form-row {
    @apply tw:contents;
  }

  .form-section-title {
    @apply tw:[margin-bottom:0.55rem];
    @apply tw:[font-size:0.9rem];
  }

  .profile-form-section:first-child .form-group,
  .profile-form-section .form-row,
  .profile-form-section .form-group {
    @apply tw:[margin-bottom:0];
  }

  .form-group label {
    @apply tw:[margin-bottom:0.4rem];
    @apply tw:[font-size:0.72rem];
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    @apply tw:[padding:0.68rem_0.78rem];
    @apply tw:[font-size:0.9rem];
  }

  .form-actions {
    @apply tw:[grid-column:1_/_-1];
    @apply tw:[margin-top:0];
    @apply tw:[padding-top:0.7rem];
  }
}

@media (max-width: 1100px) {
  .profile-content {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:[padding:0_16px_16px];
  }
}

@media (max-width: 768px) {
  .profile-card,
  .profile-details-card,
  .profile-tab-content {
    @apply tw:[border-radius:14px];
  }

  .tab-pane {
    @apply tw:[padding:18px];
  }

  .form-row {
    @apply tw:[grid-template-columns:1fr];
  }
}
.profile-form .field-error { @apply tw:block; @apply tw:[color:#dc2626]; @apply tw:[font-size:0.75rem]; @apply tw:[margin-top:0.3rem]; }
.profile-form input[aria-invalid="true"] { @apply tw:[border-color:#dc2626]; }

</style>