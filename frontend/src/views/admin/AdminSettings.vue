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
              <p>Update account verification, security rules, and maintenance access for all users.</p>
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

                  <div class="settings-row settings-row--toggle">
                    <div class="settings-label">
                      <label id="email-verification-label">Email verification required</label>
                      <span class="settings-desc">Gmail verification is mandatory. Users must enter the code sent to their Gmail address to sign in.</span>
                    </div>
                    <div class="settings-input settings-input--toggle">
                      <span class="mode-state" :class="{ 'mode-state--active': settings.user.emailVerificationRequired }">
                        {{ settings.user.emailVerificationRequired ? 'Required' : 'Optional' }}
                      </span>
                      <label class="toggle-switch">
                        <input type="checkbox" :checked="true" disabled title="Gmail verification is required to sign in" aria-labelledby="email-verification-label">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="settings-row settings-row--sessions">
                    <div class="settings-label">
                      <label>Active sessions</label>
                      <span class="settings-desc">Review signed-in devices and revoke any session you do not recognize.</span>
                    </div>
                    <div class="settings-input settings-input--stack active-sessions">
                      <div id="active-sessions-list" class="active-sessions-list" tabindex="0" role="region" aria-label="Signed-in sessions">
                        <div v-for="session in visibleSessions" :key="session.id" class="settings-meta session-row" :class="{ 'session-row--current': session.current }">
                          <div class="session-details">
                            <strong>{{ session.current ? 'Current device' : 'Other device' }}</strong>
                            <span class="session-device" :title="session.userAgent || 'Unknown browser'">{{ formatSessionDevice(session.userAgent) }}</span>
                            <span class="session-ip" :title="session.ipAddress || 'Unknown IP'">{{ session.ipAddress || 'Unknown IP' }}</span>
                          </div>
                          <button v-if="!session.current" type="button" class="btn btn-outline session-revoke" :aria-label="'Revoke ' + formatSessionDevice(session.userAgent) + ' session at ' + (session.ipAddress || 'unknown IP')" @click="revokeSession(session.id)">Revoke</button>
                        </div>
                      </div>
                      <button v-if="otherSessions.length > 3" type="button" class="btn btn-outline sessions-toggle" :aria-expanded="showAllSessions" aria-controls="active-sessions-list" @click="showAllSessions = !showAllSessions">
                        {{ showAllSessions ? 'Show Less' : 'View All Sessions' }}
                      </button>
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
                class="btn btn-primary save-settings-btn tw:inline:[background:#4f8a35]! tw:inline:[background-image:none]! tw:inline:[border-color:#4f8a35]! tw:inline:[color:#ffffff]!"
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
            :class="['Reset Settings', 'Create Backup', 'Creating...'].includes(confirmButtonLabel)
              ? 'tw:inline:[background:#4f8a35]! tw:inline:[background-image:none]! tw:inline:[border-color:#4f8a35]! tw:inline:[color:#ffffff]! tw:inline:[box-shadow:none]!'
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
  user: {
    emailVerificationRequired: true,
  },
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
    backupHistory: [],
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
    const showAllSessions = ref(false)
    const sessionActivityTime = (session) => Date.parse(session.lastSeenAt) || Date.parse(session.createdAt) || 0
    const otherSessions = computed(() => activeSessions.value
      .filter((session) => !session.current)
      .sort((left, right) => sessionActivityTime(right) - sessionActivityTime(left)))
    const visibleSessions = computed(() => [
      ...activeSessions.value.filter((session) => session.current),
      ...(showAllSessions.value ? otherSessions.value : otherSessions.value.slice(0, 3)),
    ])
    watch(() => otherSessions.value.length, (count) => {
      if (count <= 3) showAllSessions.value = false
    })
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
      const browser = match ? match[1] + ' ' + agent.match(match[0])[1] : 'Unknown browser'
      const platform = /iPad/.test(agent) ? 'iPad' : /iPhone|iPod/.test(agent) ? 'iPhone'
        : /Android/.test(agent) ? 'Android' : /Windows/.test(agent) ? 'Windows'
          : /Macintosh|Mac OS X/.test(agent) ? 'macOS' : /Linux/.test(agent) ? 'Linux' : ''
      return platform ? browser + ' on ' + platform : browser
    }
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
      settings.user.emailVerificationRequired = snapshot.user.emailVerificationRequired
      settings.security.sessionTimeout = snapshot.security.sessionTimeout
      settings.security.maxLoginAttempts = snapshot.security.maxLoginAttempts
      settings.security.accountLockoutDuration = snapshot.security.accountLockoutDuration
      settings.maintenance.maintenanceModeEnabled = snapshot.maintenance.maintenanceModeEnabled
      settings.maintenance.maintenanceMessage = snapshot.maintenance.maintenanceMessage
      settings.maintenance.systemVersion = snapshot.maintenance.systemVersion
      settings.maintenance.lastBackupAt = snapshot.maintenance.lastBackupAt
      settings.maintenance.lastBackupFileName = snapshot.maintenance.lastBackupFileName
      settings.maintenance.backupHistory = snapshot.maintenance.backupHistory
      settings.maintenance.lastCacheClearedAt = snapshot.maintenance.lastCacheClearedAt
    }

    const buildSnapshotFromResponse = (systemSettings = {}) => ({
      user: {
        emailVerificationRequired: systemSettings.user?.emailVerificationRequired !== false,
      },
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
        backupHistory: Array.isArray(systemSettings.maintenance?.backupHistory)
          ? systemSettings.maintenance.backupHistory.map((backup) => ({
            fileName: String(backup?.fileName || ''),
            generatedAt: backup?.generatedAt || null,
            collectionCount: Number(backup?.collectionCount || 0),
            sizeBytes: Number(backup?.sizeBytes || 0),
          }))
          : [],
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
        user: {
          emailVerificationRequired: settings.user.emailVerificationRequired,
        },
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
        resetSnapshot.maintenance.backupHistory = cloneSettings(settings.maintenance.backupHistory)
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
      visibleSessions,
      otherSessions,
      showAllSessions,
      formatSessionDevice,
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
      formatDateTime,
    }
  },
}
</script>

<style>
@reference "../../styles/tailwind.css";

@import '../../styles/roles/admin.tailwind.css';

.save-settings-btn,
.save-settings-btn:focus,
.save-settings-btn:active {
  @apply tw:[background:#4f8a35]!;
  @apply tw:bg-none!;
  @apply tw:[border-color:#4f8a35]!;
  @apply tw:[color:#ffffff]!;
}

.save-settings-btn:hover:not(:disabled) {
  @apply tw:[background:#477d30]!;
  @apply tw:[border-color:#477d30]!;
}

.save-settings-btn:disabled {
  @apply tw:[background:#69aa47]!;
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:cursor-not-allowed;
  @apply tw:[opacity:0.65]!;
}

body.admin-dashboard .settings-section {
  @apply tw:[padding:0]!;
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#e2e8f0]!;
  @apply tw:[border-radius:20px]!;
  @apply tw:[background:#f8fafc]!;
  @apply tw:[box-shadow:0_12px_30px_rgba(15,_23,_42,_0.06)]!;
}

.settings-intro {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1.5rem];
  @apply tw:[padding:1.5rem_1.6rem];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
}

.settings-eyebrow {
  @apply tw:block;
  @apply tw:[margin-bottom:0.35rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.09em];
  @apply tw:uppercase;
}

.settings-intro h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.25rem];
  @apply tw:[letter-spacing:-0.025em];
}

.settings-intro p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.88rem];
  @apply tw:[line-height:1.55];
}

.change-status {
  @apply tw:inline-flex;
  @apply tw:flex-none;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:0.5rem_0.75rem];
  @apply tw:[border:1px_solid_#bbf7d0];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#15803d];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}

.change-status--pending {
  @apply tw:[border-color:#fde68a];
  @apply tw:[background:#fffbeb];
  @apply tw:[color:#b45309];
}

.change-status--pending i {
  @apply tw:[font-size:0.5rem];
}

.settings-page {
  @apply tw:[padding:1.25rem];
}

body.admin-dashboard .settings-sections-container {
  @apply tw:grid!;
  @apply tw:[grid-template-columns:minmax(0,_0.9fr)_minmax(0,_1.3fr)]!;
  @apply tw:[gap:1rem]!;
  @apply tw:[align-items:start]!;
}

body.admin-dashboard .settings-card {
  @apply tw:[padding:0]!;
  @apply tw:[min-width:0];
  @apply tw:[min-height:0];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#e2e8f0]!;
  @apply tw:[border-radius:16px]!;
  @apply tw:[background:#ffffff]!;
  @apply tw:[box-shadow:none]!;
}

body.admin-dashboard .settings-card::before {
  @apply tw:hidden;
}

body.admin-dashboard .settings-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.85rem];
  @apply tw:[margin:0]!;
  @apply tw:[padding:1.1rem_1.2rem]!;
  @apply tw:[border-bottom:1px_solid_#e2e8f0]!;
  @apply tw:[background:#f8fafc];
}

body.admin-dashboard .settings-title {
  @apply tw:[margin:0]!;
  @apply tw:[color:#0f172a]!;
  @apply tw:[font-size:0.98rem]!;
  @apply tw:[letter-spacing:-0.015em];
}

body.admin-dashboard .settings-subtitle {
  @apply tw:[margin:0.2rem_0_0]!;
  @apply tw:[color:#64748b]!;
  @apply tw:[font-size:0.76rem]!;
  @apply tw:[line-height:1.45];
}

body.admin-dashboard .settings-body {
  @apply tw:grid;
  @apply tw:[gap:0]!;
  @apply tw:[padding:0]!;
}

body.admin-dashboard .settings-row {
  @apply tw:grid!;
  @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(150px,_0.8fr)]!;
  @apply tw:items-center!;
  @apply tw:[gap:1rem]!;
  @apply tw:[min-height:0]!;
  @apply tw:[margin:0]!;
  @apply tw:[padding:1rem_1.2rem]!;
  @apply tw:[border:0]!;
  @apply tw:[border-bottom:1px_solid_#eef2f7]!;
  @apply tw:rounded-none!;
  @apply tw:[background:#ffffff]!;
  @apply tw:[box-shadow:none]!;
  @apply tw:transform-none!;
}

body.admin-dashboard .settings-row:last-child {
  @apply tw:[padding-bottom:1rem]!;
  @apply tw:[border-bottom:0]!;
}

body.admin-dashboard .settings-label {
  @apply tw:grid;
  @apply tw:[gap:0.25rem];
  @apply tw:[min-width:0];
}

body.admin-dashboard .settings-label label {
  @apply tw:[color:#1e293b];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:750];
  @apply tw:[line-height:1.4];
}

body.admin-dashboard .settings-desc {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.74rem];
  @apply tw:[line-height:1.5];
}

body.admin-dashboard .settings-input {
  @apply tw:flex;
  @apply tw:[min-width:0];
  @apply tw:w-full;
  @apply tw:justify-end;
}

body.admin-dashboard .settings-input--stack {
  @apply tw:flex-col;
  @apply tw:items-stretch;
  @apply tw:[gap:0.35rem];
}

body.admin-dashboard .settings-input--toggle {
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
}

.number-field {
  @apply tw:grid;
  @apply tw:w-full;
  @apply tw:[grid-template-columns:minmax(70px,_1fr)_auto];
  @apply tw:items-center;
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#ffffff];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease];
}

.number-field:focus-within {
  @apply tw:[border-color:#6366f1];
  @apply tw:[box-shadow:0_0_0_3px_rgba(99,_102,_241,_0.12)];
}

body.admin-dashboard .number-field .form-control {
  @apply tw:[min-width:0];
  @apply tw:[min-height:42px]!;
  @apply tw:[padding-right:0.35rem]!;
  @apply tw:[border:0]!;
  @apply tw:rounded-none!;
  @apply tw:[box-shadow:none]!;
}

.number-field span {
  @apply tw:[padding:0_0.75rem_0_0.45rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:650];
}

body.admin-dashboard .settings-input > .form-control,
body.admin-dashboard .settings-input--stack .form-control {
  @apply tw:w-full;
  @apply tw:[min-height:42px]!;
  @apply tw:[border-color:#cbd5e1]!;
  @apply tw:[border-radius:10px]!;
}

body.admin-dashboard .settings-section .form-control:focus {
  @apply tw:[border-color:#6366f1]!;
  @apply tw:[box-shadow:0_0_0_3px_rgba(99,_102,_241,_0.12)]!;
}

body.admin-dashboard .settings-section .form-control--textarea {
  @apply tw:[min-height:96px]!;
  @apply tw:resize-y;
}

body.admin-dashboard .settings-section .form-control[readonly] {
  @apply tw:[background:#f8fafc]!;
  @apply tw:[color:#475569]!;
}

body.admin-dashboard .settings-meta {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.7rem];
  @apply tw:[line-height:1.4];
}

.settings-meta--count {
  @apply tw:self-end;
}

.mode-state {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
}

.mode-state--active {
  @apply tw:[color:#0f766e];
}

body.admin-dashboard .settings-input--stack .btn {
  @apply tw:w-full;
  @apply tw:[min-height:42px];
  @apply tw:justify-center;
  @apply tw:[border-radius:10px]!;
}

body.admin-dashboard .settings-actions {
  @apply tw:flex!;
  @apply tw:items-center;
  @apply tw:justify-between!;
  @apply tw:[gap:1rem]!;
  @apply tw:[margin-top:0]!;
  @apply tw:[padding:1rem_1.25rem];
  @apply tw:[border-top:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
}

body.admin-dashboard .settings-actions__primary {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
}

body.admin-dashboard .settings-actions .btn {
  @apply tw:[min-height:42px];
  @apply tw:[padding:0.65rem_1rem]!;
  @apply tw:[border-radius:10px]!;
  @apply tw:[font-weight:700]!;
}

body.admin-dashboard .settings-actions .save-settings-btn {
  @apply tw:[min-width:150px];
}

body.admin-dashboard .settings-actions .reset-settings-btn {
  @apply tw:[padding-left:0.25rem]!;
  @apply tw:[padding-right:0.25rem]!;
  @apply tw:[color:#64748b]!;
  @apply tw:[background:transparent]!;
  @apply tw:[border-color:transparent]!;
}

@media (max-width: 1180px) {
  body.admin-dashboard .settings-sections-container {
    @apply tw:[grid-template-columns:1fr]!;
  }

  body.admin-dashboard .settings-body--security {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))]!;
  }

  body.admin-dashboard .settings-body--security .settings-row {
    @apply tw:[grid-template-columns:1fr]!;
    @apply tw:content-between!;
    @apply tw:[border-right:1px_solid_#eef2f7]!;
    @apply tw:[border-bottom:0]!;
  }

  body.admin-dashboard .settings-body--security .settings-row:last-child {
    @apply tw:[border-right:0]!;
  }
}

@media (max-width: 768px) {
  body.admin-dashboard .settings-section {
    @apply tw:[border-radius:16px]!;
  }

  .settings-intro {
    @apply tw:items-stretch;
    @apply tw:flex-col;
    @apply tw:[gap:0.85rem];
    @apply tw:[padding:1.15rem];
  }

  .change-status {
    @apply tw:self-start;
  }

  .settings-page {
    @apply tw:[padding:0.85rem];
  }

  body.admin-dashboard .settings-sections-container {
    @apply tw:[gap:0.85rem]!;
  }

  body.admin-dashboard .settings-body--security {
    @apply tw:[grid-template-columns:1fr]!;
  }

  body.admin-dashboard .settings-body--security .settings-row,
  body.admin-dashboard .settings-row {
    @apply tw:[grid-template-columns:1fr]!;
    @apply tw:[gap:0.7rem]!;
    @apply tw:[padding:0.9rem_1rem]!;
    @apply tw:[border-right:0]!;
    @apply tw:[border-bottom:1px_solid_#eef2f7]!;
  }

  body.admin-dashboard .settings-input {
    @apply tw:justify-start;
  }

  body.admin-dashboard .settings-actions {
    @apply tw:items-stretch!;
    @apply tw:flex-col-reverse!;
    @apply tw:[padding:0.9rem];
  }

  body.admin-dashboard .settings-actions__primary {
    @apply tw:grid;
    @apply tw:[grid-template-columns:0.75fr_1.25fr];
  }

  body.admin-dashboard .settings-actions .reset-settings-btn {
    @apply tw:self-center;
  }
}

@media (max-width: 480px) {
  .settings-intro h3 {
    @apply tw:[font-size:1.1rem];
  }

  body.admin-dashboard .settings-header {
    @apply tw:[padding:1rem]!;
  }

  body.admin-dashboard .settings-actions__primary {
    @apply tw:[grid-template-columns:1fr];
  }

  body.admin-dashboard .settings-actions__primary .save-settings-btn {
    @apply tw:[grid-row:1];
    @apply tw:w-full;
  }

  body.admin-dashboard .settings-actions__primary .btn {
    @apply tw:justify-center;
    @apply tw:w-full;
  }
}

body.admin-dashboard .settings-body--security .settings-row.settings-row--sessions {
  @apply tw:[grid-column:1_/_-1];
  @apply tw:[grid-template-columns:minmax(0,_1fr)]!;
  @apply tw:[border-right:0]!;
}
body.admin-dashboard .active-sessions { @apply tw:[min-width:0]; }
.active-sessions-list {
  @apply tw:w-full;
  @apply tw:[max-height:260px];
  @apply tw:overflow-y-auto;
  @apply tw:overscroll-contain;
  @apply tw:[scrollbar-width:thin];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#fff];
}
.active-sessions-list:focus-visible { @apply tw:[outline:2px_solid_#6366f1]; @apply tw:[outline-offset:2px]; }
body.admin-dashboard .session-row {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:[padding:0.55rem_0.75rem];
  @apply tw:[min-width:460px];
  @apply tw:box-border;
}
.session-row + .session-row { @apply tw:[border-top:1px_solid_#eef2f7]; }
.session-row--current { @apply tw:[background:#f8fafc]; }
.session-details {
  @apply tw:[flex:1];
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[grid-template-columns:100px_minmax(110px,_1fr)_minmax(95px,_0.8fr)];
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
}
.session-details strong { @apply tw:[color:#334155]; }
.session-device, .session-ip { @apply tw:overflow-hidden; @apply tw:text-ellipsis; @apply tw:whitespace-nowrap; }
body.admin-dashboard .active-sessions .session-revoke {
  @apply tw:flex-none;
  @apply tw:w-auto;
  @apply tw:[min-height:32px];
  @apply tw:[padding:0.35rem_0.65rem];
  @apply tw:[font-size:0.7rem];
}
body.admin-dashboard .active-sessions .sessions-toggle { @apply tw:w-auto; @apply tw:self-end; @apply tw:[min-height:36px]; @apply tw:[font-size:0.75rem]; }


</style>
