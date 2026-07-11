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
          <div class="header-actions">
            <button
              type="button"
              class="btn btn-primary save-settings-btn"
              style="background: #000000 !important; background-image: none !important; border-color: #000000 !important; color: #ffffff !important; box-shadow: none !important;"
              @click="saveAllSettings"
              :disabled="saving || !hasUnsavedChanges"
            >
              <i :class="saving ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
              {{ saving ? 'Saving...' : 'Save Settings' }}
            </button>
            <button type="button" class="btn btn-outline" @click="resetToDefaults">
              <i class="fas fa-undo"></i>
              Reset to Defaults
            </button>
          </div>
        </div>

        <section class="settings-section section-card">
          <div class="settings-page">
            <div class="settings-sections-container">
              <article class="settings-card settings-card--security">
                <div class="settings-header">
                  <h3 class="settings-title">
                    <i class="fas fa-lock"></i>
                    Security Settings
                  </h3>
                </div>
                <div class="settings-body">
                  <div class="settings-row">
                    <div class="settings-label">
                      <label>Session Timeout</label>
                      <span class="settings-desc">Sign out users after this many minutes of inactivity.</span>
                    </div>
                    <div class="settings-input">
                      <input type="number" class="form-control" v-model="settings.security.sessionTimeout" min="5" max="1440" @change="markAsUnsaved">
                    </div>
                  </div>

                  <div class="settings-row">
                    <div class="settings-label">
                      <label>Maximum Login Attempts</label>
                      <span class="settings-desc">Lock the account after this many failed sign-in attempts.</span>
                    </div>
                    <div class="settings-input">
                      <input type="number" class="form-control" v-model="settings.security.maxLoginAttempts" min="3" max="10" @change="markAsUnsaved">
                    </div>
                  </div>

                  <div class="settings-row">
                    <div class="settings-label">
                      <label>Lockout Duration</label>
                      <span class="settings-desc">Keep the account locked for this many minutes after too many failed sign-in attempts.</span>
                    </div>
                    <div class="settings-input">
                      <input type="number" class="form-control" v-model="settings.security.accountLockoutDuration" min="1" max="1440" @change="markAsUnsaved">
                    </div>
                  </div>
                </div>
              </article>

              <article class="settings-card settings-card--maintenance">
                <div class="settings-header">
                  <h3 class="settings-title">
                    <i class="fas fa-tools"></i>
                    Maintenance Settings
                  </h3>
                </div>
                <div class="settings-body">
                  <div class="settings-row">
                    <div class="settings-label">
                      <label>Maintenance Mode</label>
                      <span class="settings-desc">Restrict non-admin access while administrators remain signed in.</span>
                    </div>
                    <div class="settings-input">
                      <label class="toggle-switch">
                        <input type="checkbox" v-model="settings.maintenance.maintenanceModeEnabled" @change="markAsUnsaved">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="settings-row">
                    <div class="settings-label">
                      <label>Maintenance Message</label>
                      <span class="settings-desc">Customize the message displayed to non-admin users during maintenance.</span>
                    </div>
                    <div class="settings-input settings-input--stack">
                      <textarea
                        v-model="settings.maintenance.maintenanceMessage"
                        class="form-control form-control--textarea"
                        rows="4"
                        maxlength="500"
                        placeholder="The system is currently under maintenance. Please check back later."
                        @input="markAsUnsaved"
                      ></textarea>
                    </div>
                  </div>

                  <div class="settings-row">
                    <div class="settings-label">
                      <label>System Version</label>
                      <span class="settings-desc">Current EduMatch version stored in system configuration.</span>
                    </div>
                    <div class="settings-input settings-input--stack">
                      <input type="text" class="form-control" :value="settings.maintenance.systemVersion" readonly>
                      <span class="settings-meta" v-if="formattedUpdatedAt">Last updated {{ formattedUpdatedAt }}</span>
                    </div>
                  </div>

                  <div class="settings-row">
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
            <button
              type="button"
              class="btn btn-primary save-settings-btn"
              style="background: #000000 !important; background-image: none !important; border-color: #000000 !important; color: #ffffff !important; box-shadow: none !important;"
              @click="saveAllSettings"
              :disabled="saving || !hasUnsavedChanges"
            >
              <i :class="saving ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
              {{ saving ? 'Saving...' : 'Save Settings' }}
            </button>
            <button type="button" class="btn btn-outline" @click="cancelChanges" :disabled="!hasUnsavedChanges">
              <i class="fas fa-times"></i>
              Cancel
            </button>
            <button type="button" class="btn btn-outline" @click="resetToDefaults">
              <i class="fas fa-undo"></i>
              Reset to Defaults
            </button>
          </div>
        </section>
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
          <button class="btn btn-danger" @click="executeConfirmAction" :disabled="confirmSubmitting">
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
.save-settings-btn:hover,
.save-settings-btn:focus,
.save-settings-btn:active,
.save-settings-btn:disabled {
  background: #000000 !important;
  background-image: none !important;
  border-color: #000000 !important;
  color: #ffffff !important;
  box-shadow: none !important;
  opacity: 1 !important;
}

.settings-card--maintenance {
  --settings-icon-color: #0f766e;
  --settings-icon-bg: rgba(15, 118, 110, 0.12);
  --settings-icon-bg-hover: rgba(15, 118, 110, 0.18);
  --settings-icon-bg-active: rgba(15, 118, 110, 0.24);
  --settings-icon-hover: #0f766e;
  --settings-icon-active: #115e59;
  --settings-accent-border: rgba(15, 118, 110, 0.34);
  --settings-accent-shadow: rgba(15, 118, 110, 0.18);
}

.settings-input--stack {
  flex-direction: column;
  align-items: stretch;
  gap: 0.45rem;
}

.settings-section .form-control--textarea {
  max-width: 100%;
  resize: vertical;
}

.settings-section .form-control[readonly] {
  background: #f8fafc;
  color: #475569;
}

.settings-meta {
  font-size: 0.78rem;
  color: #64748b;
}

.settings-page {
  display: grid;
  gap: 1.35rem;
}

.settings-section {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
  border-radius: 24px !important;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06) !important;
}

.settings-page-header {
  align-items: flex-start !important;
  gap: 1rem !important;
  padding: 0.25rem 0 0.15rem !important;
}

.settings-page-title {
  display: grid;
  gap: 0.45rem;
}

.settings-page-title h3 {
  letter-spacing: -0.03em;
}

.settings-page-title p {
  max-width: 52rem;
  line-height: 1.6;
}

.settings-page-badge {
  align-self: flex-start;
  min-height: 34px;
  padding: 0.5rem 0.9rem !important;
  border-radius: 999px !important;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
  border: 1px solid #dbe2ea !important;
  color: #334155 !important;
  font-weight: 700 !important;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.settings-sections-container {
  grid-template-columns: repeat(2, minmax(320px, 1fr)) !important;
  gap: 1rem !important;
  align-items: stretch !important;
}

.settings-card {
  min-height: 540px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 22px !important;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07) !important;
}

.settings-card::before {
  height: 5px !important;
}

.settings-header {
  padding-bottom: 1rem;
  margin-bottom: 0.15rem;
}

.settings-title {
  letter-spacing: -0.02em;
}

.settings-subtitle {
  max-width: 34rem;
  line-height: 1.55;
}

.settings-body {
  display: grid;
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
  flex: 1 1 auto;
  padding: 0.4rem 1.4rem 1rem !important;
}

.settings-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.35fr) minmax(240px, 1fr);
  min-height: 0;
  height: 100%;
  gap: 1.25rem !important;
  padding: 1.1rem 1.2rem !important;
  border-radius: 18px !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, #f8fafc 100%) !important;
  border: 1px solid #e2e8f0 !important;
  align-items: start !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.settings-row:hover {
  border-color: #cbd5e1 !important;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.settings-row:last-child {
  margin-bottom: 0 !important;
}

.settings-label {
  display: grid;
  gap: 0.32rem;
  padding-left: 0.15rem;
}

.settings-label label {
  display: block;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
}

.settings-desc {
  display: block;
  font-size: 0.79rem;
  line-height: 1.6;
  color: #64748b;
  max-width: 28ch;
}

.settings-input {
  min-width: 160px;
  width: 100%;
  justify-content: flex-end;
}

.settings-input .form-control {
  width: 100%;
  min-height: 46px !important;
  border-radius: 14px !important;
}

.settings-input--stack .form-control {
  width: 100%;
}

.settings-input--stack .btn {
  align-self: flex-start;
}

.settings-actions {
  margin-top: 1.1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.settings-actions .btn {
  min-height: 44px;
  border-radius: 14px !important;
  padding: 0.75rem 1rem !important;
  font-weight: 700 !important;
}

.settings-actions .btn-primary {
  min-width: 170px;
}

.settings-section .toggle-switch {
  transform: scale(1.02);
  transform-origin: right center;
}

@media (max-width: 1100px) {
  .settings-sections-container {
    grid-template-columns: 1fr !important;
  }

  .settings-card {
    min-height: 0;
  }

  .settings-body {
    grid-template-rows: none;
  }
}

@media (max-width: 768px) {
  .settings-section {
    border-radius: 20px !important;
    padding: 1rem !important;
  }

  .settings-page {
    gap: 1rem;
  }

  .settings-page-header {
    gap: 0.85rem !important;
  }

  .settings-page-badge {
    align-self: stretch;
    text-align: center;
    justify-content: center;
  }

  .settings-card {
    min-height: 0;
    border-radius: 18px !important;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06) !important;
  }

  .settings-row {
    grid-template-columns: 1fr !important;
    gap: 0.85rem !important;
    padding: 1rem !important;
    border-radius: 16px !important;
  }

  .settings-title {
    font-size: 1rem !important;
    line-height: 1.3 !important;
  }

  .settings-subtitle {
    font-size: 0.82rem !important;
    line-height: 1.45 !important;
  }

  .settings-label label {
    font-size: 0.84rem;
  }

  .settings-desc {
    font-size: 0.76rem;
    max-width: none;
  }

  .settings-input {
    min-width: 0;
    width: 100%;
    justify-content: flex-start;
  }

  .settings-input .form-control,
  .settings-input--stack .btn,
  .settings-actions .btn {
    width: 100%;
  }

  .settings-input--stack .btn {
    justify-content: center;
  }

  .settings-section .toggle-switch {
    transform: none;
  }

  .settings-actions {
    position: sticky;
    bottom: 0;
    z-index: 5;
    margin-top: 1rem;
    padding-top: 0.9rem;
    padding-bottom: 0.2rem;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.15) 0%, #ffffff 18%);
    gap: 0.65rem;
  }

  .settings-actions .btn {
    justify-content: center;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .settings-section {
    padding: 0.9rem !important;
  }

  .settings-card {
    border-radius: 16px !important;
  }

  .settings-header {
    padding-bottom: 0.85rem;
  }

  .settings-row {
    padding: 0.85rem !important;
    border-radius: 14px !important;
  }

  .settings-title {
    font-size: 0.95rem !important;
  }

  .settings-actions {
    gap: 0.55rem;
  }
}
</style>
