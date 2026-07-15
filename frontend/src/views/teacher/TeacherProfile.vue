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

                <form class="profile-form" @submit.prevent="savePersonalInfo" data-tour="profile-personal-form">
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
                        >
                      </div>
                      <div class="form-group">
                        <label for="last-name">Last Name</label>
                        <input
                          id="last-name"
                          v-model="formData.lastName"
                          type="text"
                          :readonly="!isEditing"
                        >
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="email">Email Address</label>
                      <input
                        id="email"
                        v-model="formData.email"
                        type="email"
                        :readonly="!isEditing"
                      >
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
                          :readonly="!isEditing"
                        >
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
import axios from 'axios'
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
const TOUR_STORAGE_PREFIX = 'edumatch_teacher_has_seen_tour_'
const PAGE_TOUR_KEY = 'teacher_journey_v2'
const CURRENT_PAGE_ROUTE = '/teacher/profile'
const TOUR_ROUTE_ORDER = ['/teacher/dashboard', '/teacher/records', '/teacher/students', '/teacher/activities', '/teacher/profile', '/teacher/settings']
const TOUR_PROGRESS_PREFIX = 'edumatch_teacher_tour_progress_'
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
  user.contactNumber = apiUser.contactNumber || ''
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

const validateCommonFields = () => {
  const fullName = `${formData.firstName} ${formData.lastName}`.trim()
  const email = String(formData.email || '').trim()
  const contactNumber = String(formData.phone || '').trim().replace(/\s+/g, ' ')

  if (!fullName) return { error: 'Full name is required' }
  if (!email) return { error: 'Email is required' }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return { error: 'Please enter a valid email address' }

  const contactRegex = /^\+?[0-9()\-. ]{7,30}$/
  if (contactNumber && !contactRegex.test(contactNumber)) return { error: 'Please enter a valid contact number' }

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
.teacher-page-tour-layer {
  position: fixed;
  inset: 0;
  z-index: 12000;
  pointer-events: none;
}

.teacher-page-tour-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.58);
}

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

.teacher-page-tour-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.55rem;
  justify-content: flex-end;
}

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

.teacher-profile-page {
  width: 100%;
}

.teacher-main {
  margin-left: 0 !important;
  width: 100%;
  max-width: none;
}

.profile-content {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 28px;
  padding: 4px 0 28px;
  align-items: start;
}

.profile-sidebar,
.profile-main {
  min-width: 0;
}

.teacher-dashboard .teacher-profile-page .profile-card,
.teacher-dashboard .teacher-profile-page .profile-details-card,
.teacher-dashboard .teacher-profile-page .profile-tab-content {
  border: 1px solid rgba(148, 163, 184, 0.22) !important;
  border-radius: 20px !important;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08) !important;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%) !important;
}

.teacher-dashboard .teacher-profile-page .profile-card,
.teacher-dashboard .teacher-profile-page .profile-details-card {
  padding: 22px;
}

.teacher-dashboard .teacher-profile-page .profile-card {
  margin-top: 1px;
  border-radius: 24px !important;
  background: linear-gradient(180deg, #F9FAFB 0%, #F9FAFB 100%) padding-box, linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box !important;
}

.teacher-dashboard .teacher-profile-page .profile-tab-content {
  border-color: transparent !important;
  background: linear-gradient(180deg, #F9FAFB 0%, #F9FAFB 100%) padding-box, linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box !important;
}

.teacher-dashboard .teacher-profile-page .profile-details-card {
  border-color: transparent !important;
  background: linear-gradient(180deg, #F9FAFB 0%, #F9FAFB 100%) padding-box, linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box !important;
}

.teacher-dashboard .teacher-profile-page .profile-header {
  display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 6px;
    padding-bottom: 18px;
    margin-bottom: 18px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.profile-avatar {
  position: relative;
  width: 96px;
  height: 96px;
  margin: -6px auto 16px;
}

.profile-avatar-placeholder {
  width: 100%;
  height: 100%;
  min-width: 100%;
  min-height: 100%;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  overflow: hidden;
  border: 0.25px solid #111111 !important;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.16);
  background: linear-gradient(135deg, #f9fafb, rgba(79, 70, 229, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.profile-avatar-placeholder i {
  font-size: 2rem;
  color: #111111;
}

.avatar-actions {
  position: absolute;
  bottom: 0;
  right: 0;
}

.avatar-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #111111;
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(51, 65, 85, 0.3);
}

.avatar-action-btn:hover {
  background: #1f2937;
  transform: scale(1.1);
}

.profile-info h2 {
  font-size: 1.35rem;
  line-height: 1.3;
  margin: 0 0 4px;
  color: #111111;
}

.profile-role {
  font-size: 0.88rem;
  margin: 0 0 10px;
  color: #374151;
}

.profile-status {
  margin-bottom: 12px;
}

.profile-actions {
  display: grid;
  gap: 8px;
}

.profile-actions .btn-primary {
  width: 100%;
  min-height: 40px;
  padding: 10px 16px;
  background: #1e4307 !important;
  border: 1px solid #1e4307 !important;
  border-radius: 11px;
  color: #ffffff !important;
  background-image: none !important;
  box-shadow: 0 2px 5px rgba(30, 67, 7, 0.22);
}

.profile-actions .btn-primary:hover {
  background: #173405 !important;
  border-color: #173405 !important;
  box-shadow: 0 4px 8px rgba(23, 52, 5, 0.24);
}

.profile-actions .btn-primary .student-profile-edit-icon {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.profile-actions .btn-outline {
  width: 100%;
  min-height: 40px;
  padding: 10px 16px;
  background: transparent !important;
  border: none !important;
  border-radius: 0;
  color: #111827 !important;
  background-image: none !important;
  box-shadow: none !important;
}

.profile-actions .btn-outline:hover {
  background: transparent !important;
  color: #111111 !important;
  box-shadow: none !important;
  transform: none;
}

.details-title {
  font-size: 1.04rem;
  margin: 0 0 18px;
}

.profile-details-card .detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.profile-details-card .detail-item:last-child {
  border-bottom: none;
}

.profile-details-card .detail-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f8fafc;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.profile-details-card .detail-label {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: #94a3b8;
  text-transform: uppercase;
}

.profile-details-card .detail-value {
  font-size: 0.9rem;
  line-height: 1.45;
  color: #111111;
}

.profile-tab-content {
  padding: 0;
}

.tab-pane {
  display: none;
  padding: 28px;
}

.tab-pane.active {
  display: block;
}

.tab-header {
  margin-bottom: 24px;
}

.teacher-dashboard .teacher-profile-page .profile-form-section {
  padding: 20px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.tab-header h3 {
  font-size: 1.35rem;
  margin-bottom: 6px;
}

.tab-header p {
  font-size: 0.9rem;
  color: #374151;
  margin: 0;
}

.profile-form {
  max-width: 100%;
}

.profile-form-section {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.form-section-title {
  margin: 0 0 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111111;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 12px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: inline-block;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin-bottom: 6px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  background: #ffffff;
  color: #111111;
  font-size: 0.92rem;
  line-height: 1.45;
  padding: 0.72rem 0.8rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(51, 65, 85, 0.45);
  box-shadow: 0 0 0 3px rgba(51, 65, 85, 0.12);
}

.form-group input:read-only,
.form-group textarea:read-only,
.form-group select:disabled {
  background: #f9fafb;
  color: #475569;
  border-color: rgba(148, 163, 184, 0.25);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
}

.form-actions .btn {
  min-width: 130px;
  justify-content: center;
}

/* Compact desktop profile designed to fit without nested scrolling. */
@media (min-width: 1101px) {
  :global(body.teacher-dashboard) .teacher-main > .top-header[data-tour="profile-header"] {
    margin-bottom: 1rem !important;
    padding: 0.85rem 1rem !important;
  }

  :global(body.teacher-dashboard) .teacher-main > .teacher-profile-page > .profile-content {
    grid-template-columns: minmax(330px, 380px) minmax(0, 1fr) !important;
    gap: 1rem !important;
    padding: 0 !important;
  }

  .profile-sidebar {
    display: grid;
    gap: 0.85rem;
  }

  .teacher-dashboard .teacher-profile-page .profile-card,
  .teacher-dashboard .teacher-profile-page .profile-details-card {
    padding: 1rem;
    border-radius: 16px !important;
  }

  .teacher-dashboard .teacher-profile-page .profile-header {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    padding: 0 0 0.72rem;
    margin-bottom: 0.72rem;
    text-align: center;
  }

  .profile-avatar {
    width: 84px;
    height: 84px;
    flex: 0 0 84px;
    margin: 0;
  }

  .profile-avatar-placeholder i {
    font-size: 1.8rem;
  }

  .avatar-action-btn {
    width: 34px;
    height: 34px;
  }

  .profile-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    width: 100%;
  }

  .profile-info h2 {
    max-width: 100%;
    overflow: hidden;
    margin: 0;
    font-size: 1.2rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-role,
  .profile-status {
    margin: 0;
    font-size: 0.84rem;
  }

  .profile-status {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .profile-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .profile-actions .btn-primary,
  .profile-actions .btn-outline {
    min-height: 42px;
    padding: 0.6rem 0.72rem;
    font-size: 0.82rem;
  }

  .teacher-dashboard .teacher-profile-page .profile-details-card {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
    column-gap: 0.85rem;
  }

  .details-title {
    grid-column: 1 / -1;
    margin-bottom: 0.55rem;
    font-size: 1rem;
  }

  .profile-details-card .detail-item {
    gap: 0.6rem;
    min-width: 0;
    padding: 0.5rem 0;
  }

  .profile-details-card .detail-icon {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    border-radius: 9px;
    font-size: 0.78rem;
  }

  .profile-details-card .detail-label {
    font-size: 0.66rem;
  }

  .profile-details-card .detail-value {
    overflow: hidden;
    font-size: 0.86rem;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .teacher-dashboard .teacher-profile-page .profile-tab-content {
    border-radius: 16px !important;
  }

  .tab-pane {
    padding: 1rem;
  }

  .tab-header {
    margin-bottom: 0.8rem;
  }

  .tab-header h3 {
    margin: 0 0 0.15rem;
    font-size: 1.12rem;
  }

  .tab-header p {
    font-size: 0.82rem;
  }

  .profile-form {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr);
    align-items: start;
    gap: 0.8rem;
  }

  .teacher-dashboard .teacher-profile-page .profile-form-section {
    margin: 0;
    padding: 0.85rem;
    border-radius: 14px;
  }

  .profile-form-section:first-child {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
  }

  .profile-form-section:first-child .form-section-title {
    grid-column: 1 / -1;
  }

  .profile-form-section:first-child .form-row {
    display: contents;
  }

  .form-section-title {
    margin-bottom: 0.55rem;
    font-size: 0.9rem;
  }

  .profile-form-section:first-child .form-group,
  .profile-form-section .form-row,
  .profile-form-section .form-group {
    margin-bottom: 0;
  }

  .form-group label {
    margin-bottom: 0.4rem;
    font-size: 0.72rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.68rem 0.78rem;
    font-size: 0.9rem;
  }

  .form-actions {
    grid-column: 1 / -1;
    margin-top: 0;
    padding-top: 0.7rem;
  }
}

@media (max-width: 1100px) {
  .profile-content {
    grid-template-columns: 1fr;
    padding: 0 16px 16px;
  }
}

@media (max-width: 768px) {
  .profile-card,
  .profile-details-card,
  .profile-tab-content {
    border-radius: 14px;
  }

  .tab-pane {
    padding: 18px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>


