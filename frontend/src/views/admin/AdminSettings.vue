<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <div class="container">
        <div class="admin-header-content">
          <button
            type="button"
            class="mobile-menu-toggle"
            @click="toggleSidebar"
            :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="isSidebarOpen ? 'true' : 'false'"
            aria-controls="admin-sidebar-drawer"
            title="Menu"
          >
            <i class="fas fa-bars"></i>
          </button>
          <div class="admin-logo">
            <div class="admin-logo-icon">
              <img src="/logo.png" alt="EduMatch" class="admin-logo-img" />
            </div>
            <div class="admin-logo-text">
              <h1>EduMatch Admin</h1>
              <span class="page-title">System Settings</span>
            </div>
          </div>
          <div class="admin-actions">
            <div ref="accountMenuRef" class="account-menu">
              <button
                type="button"
                class="header-account-trigger"
                aria-label="Account menu"
                title="Settings"
                :aria-expanded="isAccountMenuOpen ? 'true' : 'false'"
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

    <div class="admin-layout">
      <aside id="admin-sidebar-drawer" class="admin-sidebar" :class="{ active: isSidebarOpen }">
        <div class="sidebar-header">
          <div class="admin-sidebar-brand">
            <div class="admin-sidebar-brand-icon">
              <img src="/logo.png" alt="EduMatch" class="admin-sidebar-logo-img" />
            </div>
            <div class="admin-sidebar-brand-copy">
              <h3>EduMatch</h3>
              <p>Admin Portal</p>
            </div>
          </div>
          <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <nav class="sidebar-menu sidebar-nav">
          <div class="nav-section">
            <h4 class="nav-section-title">Navigation</h4>
            <router-link to="/admin/dashboard" class="nav-link sidebar-item sidebar-item--dashboard" :class="{ active: isActive('/admin/dashboard') }" @click="closeSidebar">
              <i class="fas fa-tachometer-alt"></i>
              <span>Overview</span>
            </router-link>
            <router-link to="/admin/users" class="nav-link sidebar-item sidebar-item--users" :class="{ active: isActive('/admin/users') }" @click="closeSidebar">
              <i class="fas fa-user-cog"></i>
              <span>User Management</span>
            </router-link>
            <router-link to="/admin/requests" class="nav-link sidebar-item sidebar-item--requests" :class="{ active: isActive('/admin/requests') }" @click="closeSidebar">
              <i class="fas fa-inbox"></i>
              <span>Request</span>
            </router-link>
            <router-link to="/admin/login-attempts" class="nav-link sidebar-item sidebar-item--login-attempts" :class="{ active: isActive('/admin/login-attempts') }" @click="closeSidebar">
              <i class="fas fa-right-to-bracket"></i>
              <span>Login Attempts</span>
            </router-link>
            <router-link to="/admin/audit-logs" class="nav-link sidebar-item sidebar-item--audit-logs" :class="{ active: isActive('/admin/audit-logs') }" @click="closeSidebar">
              <i class="fas fa-clipboard-list"></i>
              <span>Audit Logs</span>
            </router-link>
          </div>
        </nav>
      </aside>
      <button
        v-if="isSidebarOpen"
        type="button"
        class="sidebar-backdrop"
        aria-label="Close sidebar"
        @click="closeSidebar"
      ></button>

      <main class="admin-main">
        <div class="page-header fade-in">
          <div class="header-left">
            <h2>System Settings</h2>
            <p>Configure platform settings and preferences.</p>
          </div>
        </div>

        <section class="settings-section section-card">
          <div class="settings-intro">
            <div>
              <span class="settings-eyebrow">Platform configuration</span>
              <h3>Manage system preferences</h3>
              <p>Update account security rules and control maintenance access for all users.</p>
            </div>
            <span class="change-status" :class="{ 'change-status--pending': hasUnsavedChanges }">
              <i :class="hasUnsavedChanges ? 'fas fa-circle' : 'fas fa-check-circle'"></i>
              {{ hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved' }}
            </span>
          </div>

          <div class="settings-page">
            <div class="settings-sections-container">
              <article class="settings-card settings-card--security">
                <div class="settings-header">
                  <div>
                    <h3 class="settings-title">Security</h3>
                    <p class="settings-subtitle">Set sign-in limits and automatic account protection.</p>
                  </div>
                </div>
                <div class="settings-body settings-body--security">
                  <div class="settings-row">
                    <div class="settings-label">
                      <label for="session-timeout">Session timeout</label>
                      <span class="settings-desc">Sign out users after this many minutes of inactivity.</span>
                    </div>
                    <div class="settings-input">
                      <div class="number-field">
                        <input id="session-timeout" type="number" class="form-control" v-model="settings.security.sessionTimeout" min="5" max="1440" @change="markAsUnsaved">
                        <span>minutes</span>
                      </div>
                    </div>
                  </div>

                  <div class="settings-row">
                    <div class="settings-label">
                      <label for="max-login-attempts">Maximum login attempts</label>
                      <span class="settings-desc">Lock the account after this many failed sign-in attempts.</span>
                    </div>
                    <div class="settings-input">
                      <div class="number-field">
                        <input id="max-login-attempts" type="number" class="form-control" v-model="settings.security.maxLoginAttempts" min="3" max="10" @change="markAsUnsaved">
                        <span>attempts</span>
                      </div>
                    </div>
                  </div>

                  <div class="settings-row">
                    <div class="settings-label">
                      <label for="lockout-duration">Lockout duration</label>
                      <span class="settings-desc">Keep the account locked for this many minutes after too many failed sign-in attempts.</span>
                    </div>
                    <div class="settings-input">
                      <div class="number-field">
                        <input id="lockout-duration" type="number" class="form-control" v-model="settings.security.accountLockoutDuration" min="1" max="1440" @change="markAsUnsaved">
                        <span>minutes</span>
                      </div>
                    </div>
                  </div>

                  <div class="settings-row">
                    <div class="settings-label">
                      <label>Active sessions</label>
                      <span class="settings-desc">Review signed-in devices and revoke any session you do not recognize.</span>
                    </div>
                    <div class="settings-input settings-input--stack">
                      <div v-for="session in activeSessions" :key="session.id" class="settings-meta">
                        <strong>{{ session.current ? 'Current device' : 'Other device' }}</strong>
                        <span>{{ session.ipAddress || 'Unknown IP' }} · {{ session.userAgent || 'Unknown browser' }}</span>
                        <button v-if="!session.current" type="button" class="btn btn-outline" @click="revokeSession(session.id)">Revoke</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article class="settings-card settings-card--maintenance">
                <div class="settings-header">
                  <div>
                    <h3 class="settings-title">Maintenance</h3>
                    <p class="settings-subtitle">Control downtime messaging and system utilities.</p>
                  </div>
                </div>
                <div class="settings-body">
                  <div class="settings-row settings-row--toggle">
                    <div class="settings-label">
                      <label id="maintenance-mode-label">Maintenance mode</label>
                      <span class="settings-desc">Restrict non-admin access while administrators remain signed in.</span>
                    </div>
                    <div class="settings-input settings-input--toggle">
                      <span class="mode-state" :class="{ 'mode-state--active': settings.maintenance.maintenanceModeEnabled }">
                        {{ settings.maintenance.maintenanceModeEnabled ? 'Enabled' : 'Disabled' }}
                      </span>
                      <label class="toggle-switch">
                        <input type="checkbox" v-model="settings.maintenance.maintenanceModeEnabled" @change="markAsUnsaved" aria-labelledby="maintenance-mode-label">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="settings-row">
                    <div class="settings-label">
                      <label for="maintenance-message">Maintenance message</label>
                      <span class="settings-desc">Customize the message displayed to non-admin users during maintenance.</span>
                    </div>
                    <div class="settings-input settings-input--stack">
                      <textarea
                        id="maintenance-message"
                        v-model="settings.maintenance.maintenanceMessage"
                        class="form-control form-control--textarea"
                        rows="4"
                        maxlength="500"
                        placeholder="The system is currently under maintenance. Please check back later."
                        @input="markAsUnsaved"
                      ></textarea>
                      <span class="settings-meta settings-meta--count">{{ settings.maintenance.maintenanceMessage.length }}/500</span>
                    </div>
                  </div>

                  <div class="settings-row settings-row--utility">
                    <div class="settings-label">
                      <label for="system-version">System version</label>
                      <span class="settings-desc">Current EduMatch version stored in system configuration.</span>
                    </div>
                    <div class="settings-input settings-input--stack">
                      <input id="system-version" type="text" class="form-control" :value="settings.maintenance.systemVersion" readonly>
                      <span class="settings-meta" v-if="formattedUpdatedAt">Last updated {{ formattedUpdatedAt }}</span>
                    </div>
                  </div>

                  <div class="settings-row settings-row--utility">
                    <div class="settings-label">
                      <label>Clear System Cache</label>
                      <span class="settings-desc">Clear temporary cache files and invalidate active non-admin sessions.</span>
                    </div>
                    <div class="settings-input settings-input--stack">
                      <button type="button" class="btn btn-outline" @click="confirmClearCache" :disabled="clearCacheLoading">
                        <i :class="clearCacheLoading ? 'fas fa-spinner fa-spin' : 'fas fa-broom'"></i>
                        {{ clearCacheLoading ? 'Clearing...' : 'Clear System Cache' }}
                      </button>
                      <span class="settings-meta" v-if="formattedLastCacheClearedAt">Last cleared {{ formattedLastCacheClearedAt }}</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div class="settings-actions">
            <button type="button" class="btn btn-ghost reset-settings-btn" @click="resetToDefaults">
              <i class="fas fa-undo"></i>
              Reset to Defaults
            </button>
            <div class="settings-actions__primary">
              <button type="button" class="btn btn-outline" @click="cancelChanges" :disabled="!hasUnsavedChanges">
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary save-settings-btn"
                style="background: #4f8a35 !important; background-image: none !important; border-color: #4f8a35 !important; color: #ffffff !important;"
                @click="saveAllSettings"
                :disabled="saving || !hasUnsavedChanges"
              >
                <i :class="saving ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </section>
        <footer>© 2026 EduMatch</footer>
      </main>
    </div>

    <div v-if="showToast" class="toast show">
      <div class="toast-content" :class="toastType">
        <div class="toast-icon">
          <i :class="toastIcon"></i>
        </div>
        <div class="toast-message">
          <h4>{{ toastTitle }}</h4>
          <p>{{ toastMessage }}</p>
        </div>
        <button class="toast-close" @click="showToast = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <div class="modal" :class="{ active: showConfirmModal }">
      <div class="modal-overlay" @click="closeConfirmModal"></div>
      <div class="modal-content small">
        <div class="modal-header">
          <h3>{{ confirmTitle }}</h3>
          <button class="modal-close" @click="closeConfirmModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="confirm-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>{{ confirmMessage }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="closeConfirmModal" :disabled="confirmSubmitting">
            Cancel
          </button>
          <button
            class="btn btn-danger"
            :style="confirmButtonLabel === 'Reset Settings'
              ? 'background: #4f8a35 !important; background-image: none !important; border-color: #4f8a35 !important; color: #ffffff !important; box-shadow: none !important;'
              : ''"
            @click="executeConfirmAction"
            :disabled="confirmSubmitting"
          >
            <i v-if="confirmSubmitting" class="fas fa-spinner fa-spin"></i>
            {{ confirmButtonLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'

const DEFAULT_SETTINGS = {
  security: {
    sessionTimeout: 120,
    maxLoginAttempts: 5,
    accountLockoutDuration: 30,
  },
  maintenance: {
    maintenanceModeEnabled: false,
    maintenanceMessage: 'The system is currently under maintenance. Please check back later.',
    systemVersion: 'v1.0.0',
    lastBackupAt: null,
    lastBackupFileName: '',
    lastCacheClearedAt: null,
  },
}

function cloneSettings(value) {
  return JSON.parse(JSON.stringify(value))
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default {
  name: 'AdminSettings',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const SIDEBAR_BREAKPOINT = 1024
    const isSidebarOpen = ref(false)

    const resolveApiBaseUrl = () => {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      if (configured.endsWith('/api')) return configured
      return `${configured}/api`
    }

    const apiBaseUrl = resolveApiBaseUrl()
    const getAuthConfig = () => ({
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
    })

    const saving = ref(false)
    const clearCacheLoading = ref(false)
    const activeSessions = ref([])
    const hasUnsavedChanges = ref(false)
    const originalSettings = ref(null)
    const settingsMeta = reactive({
      updatedAt: null,
    })

    const showToast = ref(false)
    const toastType = ref('success')
    const toastTitle = ref('Success')
    const toastMessage = ref('')

    const showConfirmModal = ref(false)
    const confirmTitle = ref('Confirm Action')
    const confirmMessage = ref('')
    const confirmButtonLabel = ref('Confirm')
    const confirmSubmitting = ref(false)
    const confirmAction = ref(null)

    const settings = reactive(cloneSettings(DEFAULT_SETTINGS))
    const accountMenuRef = ref(null)
    const isAccountMenuOpen = ref(false)

    const toastIcon = computed(() => {
      switch (toastType.value) {
        case 'success': return 'fas fa-check-circle'
        case 'error': return 'fas fa-exclamation-circle'
        case 'warning': return 'fas fa-exclamation-triangle'
        default: return 'fas fa-info-circle'
      }
    })

    const formattedUpdatedAt = computed(() => formatDateTime(settingsMeta.updatedAt))
    const formattedLastCacheClearedAt = computed(() => formatDateTime(settings.maintenance.lastCacheClearedAt))

    const isActive = (path) => route.path === path

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
    }

    const closeSidebar = () => {
      isSidebarOpen.value = false
    }

    const toggleAccountMenu = () => {
      isAccountMenuOpen.value = !isAccountMenuOpen.value
    }

    const closeAccountMenu = () => {
      isAccountMenuOpen.value = false
    }

    const goToProfile = () => {
      closeAccountMenu()
      router.push('/admin/profile')
    }

    const goToSettings = () => {
      closeAccountMenu()
      if (route.path !== '/admin/settings') {
        router.push('/admin/settings')
      }
    }

    const syncMobileMenuBodyState = () => {
      if (typeof window === 'undefined') return
      const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
      document.body.classList.toggle('admin-mobile-menu-open', shouldLockBody)
    }

    const handleLogout = async () => {
      try {
        closeAccountMenu()
        authStore.logout()
        router.push('/auth/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    const handleDocumentClick = (event) => {
      if (!isAccountMenuOpen.value) return
      if (accountMenuRef.value?.contains(event.target)) return
      closeAccountMenu()
    }

    const handleDocumentKeydown = (event) => {
      if (event.key === 'Escape') {
        closeAccountMenu()
      }
    }

    const markAsUnsaved = () => {
      hasUnsavedChanges.value = true
    }

    const loadSecurityState = async () => {
      try {
        const sessionsResponse = await axios.get(`${apiBaseUrl}/auth/sessions`, getAuthConfig())
        activeSessions.value = sessionsResponse.data?.sessions || []
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to load account security', 'error')
      }
    }

    const revokeSession = async (sessionId) => {
      try {
        await axios.delete(`${apiBaseUrl}/auth/sessions/${encodeURIComponent(sessionId)}`, getAuthConfig())
        activeSessions.value = activeSessions.value.filter((session) => session.id !== sessionId)
        showToastMessage('Session revoked', 'success')
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to revoke session', 'error')
      }
    }

    const applySettingsSnapshot = (snapshot) => {
      settings.security.sessionTimeout = snapshot.security.sessionTimeout
      settings.security.maxLoginAttempts = snapshot.security.maxLoginAttempts
      settings.security.accountLockoutDuration = snapshot.security.accountLockoutDuration
      settings.maintenance.maintenanceModeEnabled = snapshot.maintenance.maintenanceModeEnabled
      settings.maintenance.maintenanceMessage = snapshot.maintenance.maintenanceMessage
      settings.maintenance.systemVersion = snapshot.maintenance.systemVersion
      settings.maintenance.lastBackupAt = snapshot.maintenance.lastBackupAt
      settings.maintenance.lastBackupFileName = snapshot.maintenance.lastBackupFileName
      settings.maintenance.lastCacheClearedAt = snapshot.maintenance.lastCacheClearedAt
    }

    const buildSnapshotFromResponse = (systemSettings = {}) => ({
      security: {
        sessionTimeout: Number(systemSettings.security?.sessionTimeoutMinutes || DEFAULT_SETTINGS.security.sessionTimeout),
        maxLoginAttempts: Number(systemSettings.security?.maxLoginAttempts || DEFAULT_SETTINGS.security.maxLoginAttempts),
        accountLockoutDuration: Number(
          systemSettings.security?.accountLockoutDurationMinutes || DEFAULT_SETTINGS.security.accountLockoutDuration
        ),
      },
      maintenance: {
        maintenanceModeEnabled: systemSettings.maintenance?.maintenanceModeEnabled === true,
        maintenanceMessage: String(
          systemSettings.maintenance?.maintenanceMessage || DEFAULT_SETTINGS.maintenance.maintenanceMessage
        ),
        systemVersion: String(systemSettings.maintenance?.systemVersion || DEFAULT_SETTINGS.maintenance.systemVersion),
        lastBackupAt: systemSettings.maintenance?.lastBackupAt || null,
        lastBackupFileName: String(systemSettings.maintenance?.lastBackupFileName || ''),
        lastCacheClearedAt: systemSettings.maintenance?.lastCacheClearedAt || null,
      },
    })

    const buildSavePayload = () => {
      const sessionTimeoutMinutes = Number(settings.security.sessionTimeout)
      const maxLoginAttempts = Number(settings.security.maxLoginAttempts)
      const accountLockoutDurationMinutes = Number(settings.security.accountLockoutDuration)

      if (!Number.isInteger(sessionTimeoutMinutes) || sessionTimeoutMinutes < 5 || sessionTimeoutMinutes > 1440) {
        throw new Error('Session Timeout must be an integer between 5 and 1440 minutes')
      }
      if (!Number.isInteger(maxLoginAttempts) || maxLoginAttempts < 3 || maxLoginAttempts > 10) {
        throw new Error('Max Login Attempts must be an integer between 3 and 10')
      }
      if (
        !Number.isInteger(accountLockoutDurationMinutes) ||
        accountLockoutDurationMinutes < 1 ||
        accountLockoutDurationMinutes > 1440
      ) {
        throw new Error('Account Lockout Duration must be an integer between 1 and 1440 minutes')
      }

      const maintenanceMessage = String(settings.maintenance.maintenanceMessage || '').trim()
      if (!maintenanceMessage) {
        throw new Error('Maintenance Message is required')
      }

      return {
        security: {
          sessionTimeoutMinutes,
          maxLoginAttempts,
          accountLockoutDurationMinutes,
        },
        maintenance: {
          maintenanceModeEnabled: settings.maintenance.maintenanceModeEnabled,
          maintenanceMessage,
          systemVersion: settings.maintenance.systemVersion,
        },
      }
    }

    const loadSettings = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/admin/settings/system`, getAuthConfig())
        const systemSettings = response.data?.settings || {}
        const snapshot = buildSnapshotFromResponse(systemSettings)
        applySettingsSnapshot(snapshot)
        originalSettings.value = cloneSettings(snapshot)
        settingsMeta.updatedAt = systemSettings.updatedAt || null
        hasUnsavedChanges.value = false
      } catch (error) {
        console.error('Failed to load settings:', error)
        showToastMessage(error.response?.data?.message || 'Failed to load settings', 'error')
      }
    }

    const saveAllSettings = async () => {
      saving.value = true

      try {
        const response = await axios.put(`${apiBaseUrl}/admin/settings/system`, buildSavePayload(), getAuthConfig())
        const savedSettings = response.data?.settings || {}
        const snapshot = buildSnapshotFromResponse(savedSettings)
        applySettingsSnapshot(snapshot)
        originalSettings.value = cloneSettings(snapshot)
        settingsMeta.updatedAt = savedSettings.updatedAt || null
        hasUnsavedChanges.value = false
        showToastMessage(response.data?.message || 'Settings saved successfully', 'success')
      } catch (error) {
        console.error('Failed to save settings:', error)
        showToastMessage(error.response?.data?.message || error.message || 'Failed to save settings', 'error')
      } finally {
        saving.value = false
      }
    }

    const cancelChanges = () => {
      if (originalSettings.value) {
        applySettingsSnapshot(cloneSettings(originalSettings.value))
      }
      hasUnsavedChanges.value = false
      showToastMessage('Changes discarded', 'info')
    }

    const closeConfirmModal = () => {
      if (confirmSubmitting.value) return
      showConfirmModal.value = false
      confirmTitle.value = 'Confirm Action'
      confirmMessage.value = ''
      confirmButtonLabel.value = 'Confirm'
      confirmAction.value = null
    }

    const resetToDefaults = () => {
      confirmTitle.value = 'Reset to Defaults'
      confirmMessage.value = 'Are you sure you want to reset all settings to their default values? This action cannot be undone.'
      confirmButtonLabel.value = 'Reset Settings'
      confirmAction.value = async () => {
        const resetSnapshot = cloneSettings(DEFAULT_SETTINGS)
        resetSnapshot.maintenance.systemVersion = settings.maintenance.systemVersion || DEFAULT_SETTINGS.maintenance.systemVersion
        resetSnapshot.maintenance.lastBackupAt = settings.maintenance.lastBackupAt
        resetSnapshot.maintenance.lastBackupFileName = settings.maintenance.lastBackupFileName
        resetSnapshot.maintenance.lastCacheClearedAt = settings.maintenance.lastCacheClearedAt
        applySettingsSnapshot(resetSnapshot)
        hasUnsavedChanges.value = true
        closeConfirmModal()
        showToastMessage('Settings reset to defaults', 'success')
      }
      showConfirmModal.value = true
    }

    const confirmClearCache = () => {
      confirmTitle.value = 'Clear System Cache'
      confirmMessage.value = 'Clear cached files and invalidate active non-admin sessions? Users may need to sign in again.'
      confirmButtonLabel.value = 'Clear Cache'
      confirmAction.value = async () => {
        clearCacheLoading.value = true
        confirmSubmitting.value = true
        confirmButtonLabel.value = 'Clearing...'

        try {
          const response = await axios.post(`${apiBaseUrl}/admin/settings/system/clear-cache`, {}, getAuthConfig())
          const cache = response.data?.cache || {}
          settings.maintenance.lastCacheClearedAt = cache.clearedAt || new Date().toISOString()
          if (originalSettings.value) {
            originalSettings.value.maintenance.lastCacheClearedAt = settings.maintenance.lastCacheClearedAt
          }
          confirmSubmitting.value = false
          closeConfirmModal()
          showToastMessage(response.data?.message || 'System cache cleared successfully', 'success')
        } catch (error) {
          console.error('Failed to clear cache:', error)
          showToastMessage(error.response?.data?.message || 'Failed to clear system cache', 'error')
        } finally {
          clearCacheLoading.value = false
          confirmSubmitting.value = false
          confirmButtonLabel.value = 'Confirm'
        }
      }
      showConfirmModal.value = true
    }

    const showToastMessage = (message, type = 'success', title = null) => {
      toastType.value = type
      toastMessage.value = message

      switch (type) {
        case 'success':
          toastTitle.value = title || 'Success'
          break
        case 'error':
          toastTitle.value = title || 'Error'
          break
        case 'warning':
          toastTitle.value = title || 'Warning'
          break
        default:
          toastTitle.value = title || 'Info'
      }

      showToast.value = true

      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }

    const executeConfirmAction = async () => {
      if (typeof confirmAction.value === 'function') {
        await confirmAction.value()
      }
    }

    watch(settings, () => {
      if (originalSettings.value) {
        hasUnsavedChanges.value = JSON.stringify(settings) !== JSON.stringify(originalSettings.value)
      }
    }, { deep: true })

    watch(
      () => route.path,
      () => {
        closeSidebar()
        showToast.value = false
        toastMessage.value = ''
      }
    )

    watch(
      () => isSidebarOpen.value,
      () => {
        syncMobileMenuBodyState()
      }
    )

    watch(
      () => route.path,
      () => {
        closeSidebar()
        closeAccountMenu()
      }
    )

    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges.value) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    onMounted(() => {
      document.body.classList.add('admin-dashboard')
      loadSettings()
      loadSecurityState()
      window.addEventListener('resize', syncMobileMenuBodyState)
      syncMobileMenuBodyState()
      window.addEventListener('beforeunload', handleBeforeUnload)
      document.addEventListener('click', handleDocumentClick)
      document.addEventListener('keydown', handleDocumentKeydown)
    })

    onBeforeUnmount(() => {
      document.body.classList.remove('admin-dashboard')
      document.body.classList.remove('admin-mobile-menu-open')
      window.removeEventListener('resize', syncMobileMenuBodyState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleDocumentClick)
      document.removeEventListener('keydown', handleDocumentKeydown)
    })

    return {
      isActive,
      accountMenuRef,
      isAccountMenuOpen,
      toggleAccountMenu,
      goToProfile,
      goToSettings,
      handleLogout,
      settings,
      saving,
      clearCacheLoading,
      activeSessions,
      revokeSession,
      hasUnsavedChanges,
      showToast,
      toastType,
      toastTitle,
      toastMessage,
      toastIcon,
      showConfirmModal,
      confirmTitle,
      confirmMessage,
      confirmButtonLabel,
      confirmSubmitting,
      markAsUnsaved,
      saveAllSettings,
      cancelChanges,
      resetToDefaults,
      confirmClearCache,
      closeConfirmModal,
      executeConfirmAction,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      formattedUpdatedAt,
      formattedLastCacheClearedAt,
    }
  },
}
</script>

<style>
@import url('/css/admin.css');

.save-settings-btn,
.save-settings-btn:focus,
.save-settings-btn:active {
  background: #4f8a35 !important;
  background-image: none !important;
  border-color: #4f8a35 !important;
  color: #ffffff !important;
}

.save-settings-btn:hover:not(:disabled) {
  background: #477d30 !important;
  border-color: #477d30 !important;
}

.save-settings-btn:disabled {
  background: #69aa47 !important;
  border-color: #69aa47 !important;
  color: #ffffff !important;
  cursor: not-allowed;
  opacity: 0.65 !important;
}

body.admin-dashboard .settings-section {
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid #e2e8f0 !important;
  border-radius: 20px !important;
  background: #f8fafc !important;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06) !important;
}

.settings-intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 1.6rem;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.settings-eyebrow {
  display: block;
  margin-bottom: 0.35rem;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.settings-intro h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.25rem;
  letter-spacing: -0.025em;
}

.settings-intro p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.55;
}

.change-status {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  background: #f0fdf4;
  color: #15803d;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.change-status--pending {
  border-color: #fde68a;
  background: #fffbeb;
  color: #b45309;
}

.change-status--pending i {
  font-size: 0.5rem;
}

.settings-page {
  padding: 1.25rem;
}

body.admin-dashboard .settings-sections-container {
  display: grid !important;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.3fr) !important;
  gap: 1rem !important;
  align-items: start !important;
}

body.admin-dashboard .settings-card {
  padding: 0 !important;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0 !important;
  border-radius: 16px !important;
  background: #ffffff !important;
  box-shadow: none !important;
}

body.admin-dashboard .settings-card::before {
  display: none;
}

body.admin-dashboard .settings-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin: 0 !important;
  padding: 1.1rem 1.2rem !important;
  border-bottom: 1px solid #e2e8f0 !important;
  background: #f8fafc;
}

body.admin-dashboard .settings-title {
  margin: 0 !important;
  color: #0f172a !important;
  font-size: 0.98rem !important;
  letter-spacing: -0.015em;
}

body.admin-dashboard .settings-subtitle {
  margin: 0.2rem 0 0 !important;
  color: #64748b !important;
  font-size: 0.76rem !important;
  line-height: 1.45;
}

body.admin-dashboard .settings-body {
  display: grid;
  gap: 0 !important;
  padding: 0 !important;
}

body.admin-dashboard .settings-row {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) minmax(150px, 0.8fr) !important;
  align-items: center !important;
  gap: 1rem !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 1rem 1.2rem !important;
  border: 0 !important;
  border-bottom: 1px solid #eef2f7 !important;
  border-radius: 0 !important;
  background: #ffffff !important;
  box-shadow: none !important;
  transform: none !important;
}

body.admin-dashboard .settings-row:last-child {
  padding-bottom: 1rem !important;
  border-bottom: 0 !important;
}

body.admin-dashboard .settings-label {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

body.admin-dashboard .settings-label label {
  color: #1e293b;
  font-size: 0.82rem;
  font-weight: 750;
  line-height: 1.4;
}

body.admin-dashboard .settings-desc {
  color: #64748b;
  font-size: 0.74rem;
  line-height: 1.5;
}

body.admin-dashboard .settings-input {
  display: flex;
  min-width: 0;
  width: 100%;
  justify-content: flex-end;
}

body.admin-dashboard .settings-input--stack {
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
}

body.admin-dashboard .settings-input--toggle {
  align-items: center;
  gap: 0.65rem;
}

.number-field {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(70px, 1fr) auto;
  align-items: center;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.number-field:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

body.admin-dashboard .number-field .form-control {
  min-width: 0;
  min-height: 42px !important;
  padding-right: 0.35rem !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.number-field span {
  padding: 0 0.75rem 0 0.45rem;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 650;
}

body.admin-dashboard .settings-input > .form-control,
body.admin-dashboard .settings-input--stack .form-control {
  width: 100%;
  min-height: 42px !important;
  border-color: #cbd5e1 !important;
  border-radius: 10px !important;
}

body.admin-dashboard .settings-section .form-control:focus {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
}

body.admin-dashboard .settings-section .form-control--textarea {
  min-height: 96px !important;
  resize: vertical;
}

body.admin-dashboard .settings-section .form-control[readonly] {
  background: #f8fafc !important;
  color: #475569 !important;
}

body.admin-dashboard .settings-meta {
  color: #64748b;
  font-size: 0.7rem;
  line-height: 1.4;
}

.settings-meta--count {
  align-self: flex-end;
}

.mode-state {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
}

.mode-state--active {
  color: #0f766e;
}

body.admin-dashboard .settings-input--stack .btn {
  width: 100%;
  min-height: 42px;
  justify-content: center;
  border-radius: 10px !important;
}

body.admin-dashboard .settings-actions {
  display: flex !important;
  align-items: center;
  justify-content: space-between !important;
  gap: 1rem !important;
  margin-top: 0 !important;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

body.admin-dashboard .settings-actions__primary {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

body.admin-dashboard .settings-actions .btn {
  min-height: 42px;
  padding: 0.65rem 1rem !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
}

body.admin-dashboard .settings-actions .save-settings-btn {
  min-width: 150px;
}

body.admin-dashboard .settings-actions .reset-settings-btn {
  padding-left: 0.25rem !important;
  padding-right: 0.25rem !important;
  color: #64748b !important;
  background: transparent !important;
  border-color: transparent !important;
}

@media (max-width: 1180px) {
  body.admin-dashboard .settings-sections-container {
    grid-template-columns: 1fr !important;
  }

  body.admin-dashboard .settings-body--security {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }

  body.admin-dashboard .settings-body--security .settings-row {
    grid-template-columns: 1fr !important;
    align-content: space-between !important;
    border-right: 1px solid #eef2f7 !important;
    border-bottom: 0 !important;
  }

  body.admin-dashboard .settings-body--security .settings-row:last-child {
    border-right: 0 !important;
  }
}

@media (max-width: 768px) {
  body.admin-dashboard .settings-section {
    border-radius: 16px !important;
  }

  .settings-intro {
    align-items: stretch;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1.15rem;
  }

  .change-status {
    align-self: flex-start;
  }

  .settings-page {
    padding: 0.85rem;
  }

  body.admin-dashboard .settings-sections-container {
    gap: 0.85rem !important;
  }

  body.admin-dashboard .settings-body--security {
    grid-template-columns: 1fr !important;
  }

  body.admin-dashboard .settings-body--security .settings-row,
  body.admin-dashboard .settings-row {
    grid-template-columns: 1fr !important;
    gap: 0.7rem !important;
    padding: 0.9rem 1rem !important;
    border-right: 0 !important;
    border-bottom: 1px solid #eef2f7 !important;
  }

  body.admin-dashboard .settings-input {
    justify-content: flex-start;
  }

  body.admin-dashboard .settings-actions {
    align-items: stretch !important;
    flex-direction: column-reverse !important;
    padding: 0.9rem;
  }

  body.admin-dashboard .settings-actions__primary {
    display: grid;
    grid-template-columns: 0.75fr 1.25fr;
  }

  body.admin-dashboard .settings-actions .reset-settings-btn {
    align-self: center;
  }
}

@media (max-width: 480px) {
  .settings-intro h3 {
    font-size: 1.1rem;
  }

  body.admin-dashboard .settings-header {
    padding: 1rem !important;
  }

  body.admin-dashboard .settings-actions__primary {
    grid-template-columns: 1fr;
  }

  body.admin-dashboard .settings-actions__primary .save-settings-btn {
    grid-row: 1;
    width: 100%;
  }

  body.admin-dashboard .settings-actions__primary .btn {
    justify-content: center;
    width: 100%;
  }
}
</style>
