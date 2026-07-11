import { reactive } from 'vue'
import axios from 'axios'

const TOKEN_STORAGE_KEY = 'edumatch_auth_token'
const USER_STORAGE_KEY = 'edumatch_auth_user'
const REMEMBERED_USERNAME_STORAGE_KEY = 'edumatch_remembered_username'
const PRESENCE_HEARTBEAT_INTERVAL_MS = 5000

function safeRead(storage, key) {
  try {
    return storage.getItem(key) || ''
  } catch (_error) {
    return ''
  }
}

function safeWrite(storage, key, value) {
  try {
    storage.setItem(key, value)
  } catch (_error) {
    // no-op
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key)
  } catch (_error) {
    // no-op
  }
}

function safeReadPersistedValue(key) {
  const localValue = safeRead(localStorage, key)
  if (localValue) return localValue
  return safeRead(sessionStorage, key)
}

function readStoredToken() {
  return safeReadPersistedValue(TOKEN_STORAGE_KEY)
}

function readStoredUser() {
  const raw = safeReadPersistedValue(USER_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (_error) {
    return null
  }
}

function readRememberedUsername() {
  return String(safeRead(localStorage, REMEMBERED_USERNAME_STORAGE_KEY) || '').trim()
}

function loadPersistedUser() {
  return readStoredUser()
}

const state = reactive({
  error: '',
  message: '',
  user: loadPersistedUser(),
  token: readStoredToken(),
})
let authInterceptorInitialized = false
let authPresenceInitialized = false
let presenceHeartbeatTimerId = null
let presenceHeartbeatInFlight = null

function dashboardPathByRole(role) {
  const normalizedRole = String(role || '').toLowerCase().trim()
  if (normalizedRole === 'student') return '/student/dashboard'
  if (normalizedRole === 'teacher') return '/teacher/dashboard'
  if (normalizedRole === 'headteacher') return '/headteacher/dashboard'
  if (normalizedRole === 'secretary') return '/secretary/dashboard'
  return '/admin/dashboard'
}

function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}

function buildAuthHeaders() {
  return state.token
    ? {
        Authorization: `Bearer ${state.token}`,
      }
    : {}
}

function clearPersistedAuth() {
  stopPresenceHeartbeat()
  state.user = null
  state.token = ''
  state.message = ''
  state.error = ''
  safeRemove(localStorage, TOKEN_STORAGE_KEY)
  safeRemove(localStorage, USER_STORAGE_KEY)
  safeRemove(sessionStorage, TOKEN_STORAGE_KEY)
  safeRemove(sessionStorage, USER_STORAGE_KEY)
}

function canSyncPresence() {
  if (!state.token || !state.user) return false
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return false
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
  return true
}

async function sendPresenceHeartbeat({ force = false } = {}) {
  if (!state.token || !state.user) return null
  if (!force && !canSyncPresence()) return null
  if (presenceHeartbeatInFlight) return presenceHeartbeatInFlight

  presenceHeartbeatInFlight = axios.post(
    `${resolveApiBaseUrl()}/auth/presence`,
    {},
    {
      headers: buildAuthHeaders(),
    }
  )
    .catch((error) => {
      if (error?.response?.status === 401) throw error
      return null
    })
    .finally(() => {
      presenceHeartbeatInFlight = null
    })

  return presenceHeartbeatInFlight
}

function stopPresenceHeartbeat() {
  if (typeof window !== 'undefined' && presenceHeartbeatTimerId !== null) {
    window.clearInterval(presenceHeartbeatTimerId)
  }
  presenceHeartbeatTimerId = null
}

function startPresenceHeartbeat() {
  if (typeof window === 'undefined') return
  if (presenceHeartbeatTimerId !== null) return

  presenceHeartbeatTimerId = window.setInterval(() => {
    if (!canSyncPresence()) return
    void sendPresenceHeartbeat().catch(() => null)
  }, PRESENCE_HEARTBEAT_INTERVAL_MS)
}

function initializeAuthPresence() {
  if (authPresenceInitialized || typeof window === 'undefined') return

  const syncPresenceNow = () => {
    if (!canSyncPresence()) return
    void sendPresenceHeartbeat({ force: true }).catch(() => null)
  }

  document.addEventListener('visibilitychange', syncPresenceNow)
  window.addEventListener('focus', syncPresenceNow)
  window.addEventListener('online', syncPresenceNow)

  startPresenceHeartbeat()
  syncPresenceNow()
  authPresenceInitialized = true
}

function persistAuthState({ remember }) {
  const persistInLocal = Boolean(remember)
  const targetStorage = persistInLocal ? localStorage : sessionStorage
  const otherStorage = persistInLocal ? sessionStorage : localStorage

  safeWrite(targetStorage, TOKEN_STORAGE_KEY, String(state.token || ''))
  safeWrite(targetStorage, USER_STORAGE_KEY, JSON.stringify(state.user || null))
  safeRemove(otherStorage, TOKEN_STORAGE_KEY)
  safeRemove(otherStorage, USER_STORAGE_KEY)
}

function persistUserStateToActiveStorage() {
  const hasLocalToken = Boolean(safeRead(localStorage, TOKEN_STORAGE_KEY))
  const targetStorage = hasLocalToken ? localStorage : sessionStorage
  safeWrite(targetStorage, USER_STORAGE_KEY, JSON.stringify(state.user || null))
}

function persistRememberedUsername(username) {
  const normalizedUsername = String(username || '').trim()
  if (!normalizedUsername) {
    safeRemove(localStorage, REMEMBERED_USERNAME_STORAGE_KEY)
    return
  }
  safeWrite(localStorage, REMEMBERED_USERNAME_STORAGE_KEY, normalizedUsername)
}

function shouldForceLogout(error) {
  const statusCode = Number(error?.response?.status || 0)
  const message = String(error?.response?.data?.message || '').trim().toLowerCase()

  if (statusCode !== 401) return false

  return [
    'user not found',
    'invalid or expired token',
    'session expired due to inactivity. please sign in again.',
    'authorization token is required',
  ].includes(message)
}

function shouldForceMaintenanceRedirect(error) {
  const statusCode = Number(error?.response?.status || 0)
  const message = String(error?.response?.data?.message || '').trim().toLowerCase()
  return statusCode === 503 && message.includes('maintenance')
}

function shouldForcePasswordChangeRedirect(error) {
  const statusCode = Number(error?.response?.status || 0)
  const message = String(error?.response?.data?.message || '').trim().toLowerCase()
  return statusCode === 403 && message === 'password change required before continuing'
}

export function initializeAuthInterceptor() {
  if (authInterceptorInitialized) return

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (shouldForceLogout(error)) {
        clearPersistedAuth()

        if (typeof window !== 'undefined') {
          const currentPath = `${window.location.pathname || ''}${window.location.search || ''}`
          const loginUrl = new URL('/auth/login', window.location.origin)
          if (currentPath && !currentPath.startsWith('/auth/login')) {
            loginUrl.searchParams.set('redirect', currentPath)
          }
          loginUrl.searchParams.set('error', 'Your session expired. Please sign in again.')
          window.location.assign(loginUrl.toString())
        }
      }

      if (shouldForceMaintenanceRedirect(error) && String(state.user?.role || '').toLowerCase() !== 'admin') {
        const maintenanceMessage = String(error?.response?.data?.message || 'The system is currently under maintenance. Please check back later.')
        clearPersistedAuth()

        if (typeof window !== 'undefined') {
          const loginUrl = new URL('/auth/login', window.location.origin)
          loginUrl.searchParams.set('error', maintenanceMessage)
          window.location.assign(loginUrl.toString())
        }
      }

      if (shouldForcePasswordChangeRedirect(error) && state.token && state.user) {
        state.user = {
          ...state.user,
          forcePasswordChange: true,
        }
        persistUserStateToActiveStorage()

        if (typeof window !== 'undefined' && window.location.pathname !== '/auth/change-password') {
          window.location.assign(new URL('/auth/change-password', window.location.origin).toString())
        }
      }

      return Promise.reject(error)
    }
  )

  authInterceptorInitialized = true
}

export function useAuthStore() {
  const clearAlerts = () => {
    state.error = ''
    state.message = ''
  }

  const consumeMessage = () => {
    const current = String(state.message || '')
    state.message = ''
    return current
  }

  const login = async ({ username, password, remember = false, captchaToken = '' }) => {
    clearAlerts()
    const normalizedUsername = String(username || '').trim()
    const shouldRememberAccount = remember === true

    if (!normalizedUsername || !password) {
      state.error = 'Username and password are required'
      throw new Error(state.error)
    }

    try {
      const apiBaseUrl = resolveApiBaseUrl()
      const response = await axios.post(
        `${apiBaseUrl}/auth/login`,
        { username: normalizedUsername, password, captchaToken, remember: shouldRememberAccount }
      )
      const responseData = response.data || {}
      const normalizedRole = String(responseData.user?.role || '').toLowerCase().trim()

      if (!responseData.success || !normalizedRole) {
        state.error = 'Unable to determine user role'
        throw new Error(state.error)
      }

      state.user = {
        ...responseData.user,
        role: normalizedRole,
        forcePasswordChange: responseData.user?.forcePasswordChange === true,
        hasCompletedTeacherTour: responseData.user?.hasCompletedTeacherTour === true,
        hasCompletedStudentTour: responseData.user?.hasCompletedStudentTour === true,
      }
      state.token = responseData.token
      persistAuthState({ remember: shouldRememberAccount })
      persistRememberedUsername(shouldRememberAccount ? normalizedUsername : '')
      startPresenceHeartbeat()
      await sendPresenceHeartbeat({ force: true })

      return {
        redirectPath: responseData.redirectPath || dashboardPathByRole(normalizedRole),
        role: normalizedRole,
      }
    } catch (error) {
      if (!error.response) {
        state.error = `Unable to connect to the server. Check backend status and VITE_API_BASE_URL (current: ${resolveApiBaseUrl()}).`
      } else {
        state.error = error.response?.data?.message || 'Unable to sign in'
      }
      throw new Error(state.error)
    }
  }

  const googleLogin = async () => {
    clearAlerts()
    state.error = 'Google login is not configured yet'
    throw new Error(state.error)
  }

  const validateInvite = async (token) => {
    clearAlerts()
    const inviteToken = String(token || '').trim()
    if (!inviteToken) {
      state.error = 'Invite token is required'
      throw new Error(state.error)
    }

    try {
      const apiBaseUrl = resolveApiBaseUrl()
      const response = await axios.get(`${apiBaseUrl}/auth/invite/${encodeURIComponent(inviteToken)}`)
      return response.data?.invite || null
    } catch (error) {
      state.error = error.response?.data?.message || 'Invalid invite link'
      throw new Error(state.error)
    }
  }

  const completeInvite = async ({ token, password }) => {
    clearAlerts()
    const inviteToken = String(token || '').trim()
    if (!inviteToken) {
      state.error = 'Invite token is required'
      throw new Error(state.error)
    }

    try {
      const apiBaseUrl = resolveApiBaseUrl()
      const payload = {
        password,
      }
      const response = await axios.post(`${apiBaseUrl}/auth/invite/${encodeURIComponent(inviteToken)}/complete`, payload)
      return response.data?.user || null
    } catch (error) {
      state.error = error.response?.data?.message || 'Unable to complete account setup'
      throw new Error(state.error)
    }
  }

  const requestPasswordReset = async ({ email }) => {
    clearAlerts()
    const normalizedEmail = String(email || '').trim()
    if (!normalizedEmail) {
      state.error = 'Email is required'
      throw new Error(state.error)
    }

    try {
      const apiBaseUrl = resolveApiBaseUrl()
      await axios.post(`${apiBaseUrl}/auth/forgot-password`, { email: normalizedEmail })
      state.message = 'If the email exists, a reset link has been sent.'
      return true
    } catch (error) {
      state.error = error.response?.data?.message || 'Unable to send reset email'
      throw new Error(state.error)
    }
  }

  const validatePasswordReset = async ({ token }) => {
    clearAlerts()
    const resetToken = String(token || '').trim()
    if (!resetToken) {
      state.error = 'Reset token is required'
      throw new Error(state.error)
    }

    try {
      const apiBaseUrl = resolveApiBaseUrl()
      const response = await axios.get(`${apiBaseUrl}/auth/reset/${encodeURIComponent(resetToken)}`)
      return response.data?.reset || null
    } catch (error) {
      state.error = error.response?.data?.message || 'Reset link is invalid or expired'
      throw new Error(state.error)
    }
  }

  const completePasswordReset = async ({ token, password }) => {
    clearAlerts()
    const resetToken = String(token || '').trim()
    if (!resetToken) {
      state.error = 'Reset token is required'
      throw new Error(state.error)
    }

    try {
      const apiBaseUrl = resolveApiBaseUrl()
      await axios.post(`${apiBaseUrl}/auth/reset/${encodeURIComponent(resetToken)}/complete`, { password })
      state.message = 'Password reset successful. You can now sign in.'
      return true
    } catch (error) {
      state.error = error.response?.data?.message || 'Unable to reset password'
      throw new Error(state.error)
    }
  }

  const changePassword = async ({ currentPassword, newPassword, confirmNewPassword }) => {
    clearAlerts()

    try {
      const apiBaseUrl = resolveApiBaseUrl()
      const response = await axios.post(
        `${apiBaseUrl}/auth/change-password`,
        { currentPassword, newPassword, confirmNewPassword },
        {
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        }
      )

      state.message = response.data?.message || 'Password updated successfully'
      if (state.user) {
        state.user = {
          ...state.user,
          forcePasswordChange: false,
          temporaryPasswordIssuedAt: null,
        }
        persistUserStateToActiveStorage()
      }

      return response.data?.user || null
    } catch (error) {
      state.error = error.response?.data?.message || 'Unable to update password'
      throw new Error(state.error)
    }
  }

  const logout = () => {
    clearPersistedAuth()
  }

  const isAuthenticated = () => Boolean(state.token && state.user)
  const isAdmin = () => state.user?.role === 'admin'
  const getDashboardPath = () => dashboardPathByRole(state.user?.role)

  const setUser = (userPatch = {}) => {
    if (!state.user) return
    state.user = {
      ...state.user,
      ...userPatch,
      role: String(userPatch.role || state.user.role || '').toLowerCase().trim() || state.user.role,
    }
    persistUserStateToActiveStorage()
  }

  return {
    get error() {
      return state.error
    },
    get message() {
      return state.message
    },
    get user() {
      return state.user
    },
    get token() {
      return state.token
    },
    isAuthenticated,
    isAdmin,
    getDashboardPath,
    setUser,
    logout,
    login,
    googleLogin,
    clearAlerts,
    consumeMessage,
    sendPresenceHeartbeat,
    startPresenceHeartbeat,
    stopPresenceHeartbeat,
    getRememberedUsername: readRememberedUsername,
    validateInvite,
    completeInvite,
    requestPasswordReset,
    validatePasswordReset,
    completePasswordReset,
    changePassword,
  }
}

export {
  initializeAuthPresence,
}
