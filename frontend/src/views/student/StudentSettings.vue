<template>
  <div class="student-dashboard-page">
    <section class="settings-hero">
      <div class="settings-hero-icon"><i class="fas fa-cogs"></i></div>
      <div>
        <h2>Student Settings</h2>
        <p>Manage notifications, security, and account preferences from one organized workspace.</p>
      </div>
    </section>

    <section v-if="toast.show" class="settings-toast" :class="`toast-${toast.type}`">
      <i class="fas" :class="toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'"></i>
      <span>{{ toast.message }}</span>
    </section>

    <div class="settings-grid student-settings-grid">
      <section class="settings-panel" data-tour="student-settings-security">
        <div class="panel-header security-panel-header">
          <div class="security-panel-copy">
            <span class="security-panel-eyebrow">Student account protection</span>
            <h3>Security Settings</h3>
            <p>Manage your account password and authentication preferences with confidence.</p>
          </div>
          <div class="security-panel-pills" aria-label="Security overview">
            <span class="security-pill security-pill-shield">
              <i class="fas fa-shield-alt"></i>
              Protected account
            </span>
            <span class="security-pill" :class="`security-pill-${passwordStrengthTone}`">
              <i class="fas" :class="passwordStrengthIcon"></i>
              {{ passwordRequirementsMetCount }}/{{ passwordRequirements.length }} checks
            </span>
          </div>
        </div>

        <div class="student-settings-stack security-grid">
          <div class="settings-card security-card security-password-card student-settings-card">
            <div class="settings-card-body">
              <form class="settings-form settings-password-form" @submit.prevent="updatePassword">
                <div class="password-form-main">
                  <div class="security-form-banner">
                    <div class="security-form-banner-icon">
                      <i class="fas fa-lock"></i>
                    </div>
                    <div class="security-form-banner-copy">
                      <strong>Create a stronger password</strong>
                      <p>Use a unique combination of letters, numbers, and symbols to better protect your student account.</p>
                    </div>
                  </div>

                  <div class="form-group current-password-group">
                    <label for="current-password" class="security-field-label">
                      <span>Current Password</span>
                      <small>Required</small>
                    </label>
                    <div class="password-input">
                      <input
                        :type="showCurrentPassword ? 'text' : 'password'"
                        id="current-password"
                        v-model="passwordData.currentPassword"
                        placeholder="Enter current password"
                        minlength="8"
                        maxlength="16"
                        required
                      >
                      <button type="button" class="toggle-password" @click="toggleCurrentPassword" :aria-label="showCurrentPassword ? 'Hide current password' : 'Show current password'">
                        <i class="fas" :class="showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                      </button>
                    </div>
                    <p class="field-help">Enter your existing password so we can verify the update securely.</p>
                  </div>

                  <div class="form-group new-password-group">
                    <label for="new-password" class="security-field-label">
                      <span>New Password</span>
                      <small>Live feedback</small>
                    </label>
                    <div class="password-input">
                      <input
                        :type="showNewPassword ? 'text' : 'password'"
                        id="new-password"
                        v-model="passwordData.newPassword"
                        placeholder="Enter new password"
                        minlength="8"
                        maxlength="16"
                        @input="checkPasswordStrength"
                        required
                      >
                      <button type="button" class="toggle-password" @click="toggleNewPassword" :aria-label="showNewPassword ? 'Hide new password' : 'Show new password'">
                        <i class="fas" :class="showNewPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                      </button>
                    </div>
                    <p class="field-help">Aim for 8 to 16 characters with uppercase, lowercase, a number, and a symbol.</p>
                  </div>

                  <div class="form-group confirm-password-group">
                    <label for="confirm-password" class="security-field-label">
                      <span>Confirm New Password</span>
                      <small>Match exactly</small>
                    </label>
                    <div class="password-input">
                      <input
                        :type="showConfirmPassword ? 'text' : 'password'"
                        id="confirm-password"
                        v-model="passwordData.confirmPassword"
                        placeholder="Confirm new password"
                        minlength="8"
                        maxlength="16"
                        @input="checkPasswordMatch"
                        required
                      >
                      <button type="button" class="toggle-password" @click="toggleConfirmPassword" :aria-label="showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'">
                        <i class="fas" :class="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                      </button>
                    </div>
                    <div v-if="passwordData.confirmPassword" class="password-match" :class="{ valid: passwordsMatch }">
                      <i :class="passwordsMatch ? 'fas fa-check' : 'fas fa-times'"></i>
                      <span>{{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}</span>
                    </div>
                    <p class="field-help">Re-enter the new password exactly as typed above.</p>
                  </div>

                  <div class="form-actions password-form-actions">
                    <p class="password-action-note">{{ passwordActionMessage }}</p>
                    <button
                      type="submit"
                      class="btn btn-primary password-submit-btn"
                      :disabled="!isPasswordValid"
                    >
                      <i class="fas fa-shield-alt"></i>
                      Update Password
                    </button>
                  </div>
                </div>

                <aside class="password-form-side" aria-label="Password guidance">
                  <div class="password-side-header">
                    <div>
                      <span class="password-side-eyebrow">Live checklist</span>
                      <h5>Password guidance</h5>
                    </div>
                    <span class="password-side-count">{{ passwordRequirementsMetCount }}/{{ passwordRequirements.length }}</span>
                  </div>

                  <div class="password-strength-card" :class="`strength-card-${passwordStrengthTone}`">
                    <div class="password-strength-header">
                      <span class="strength-badge">{{ passwordStrengthText }}</span>
                      <span class="strength-percent">{{ passwordStrengthPercent }}%</span>
                    </div>
                    <div class="password-strength">
                      <div class="strength-bar">
                        <div
                          class="strength-fill"
                          :class="passwordStrengthClass"
                          :style="{ width: `${passwordStrengthPercent}%` }"
                        ></div>
                      </div>
                      <div class="strength-text">
                        {{ passwordStrengthSummary }}
                      </div>
                    </div>
                  </div>

                  <div class="password-requirements">
                    <p>Password must contain:</p>
                    <ul>
                      <li
                        v-for="req in passwordRequirements"
                        :key="req.key"
                        class="requirement"
                        :class="{ met: req.met }"
                      >
                        <i class="fas" :class="req.met ? 'fa-check-circle' : 'fa-circle'"></i>
                        <span>{{ req.label }}</span>
                      </li>
                    </ul>
                  </div>
                  <p class="password-side-tip">
                    <i class="fas fa-shield-alt"></i>
                    Avoid using your name, birthday, or previously used passwords.
                  </p>
                </aside>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StudentSettings',
  data() {
    return {
      user: {
        displayName: '',
        username: '',
        email: '',
        role: 'student',
        gradeLevel: ''
      },
      notificationCount: 0,
      isSidebarOpen: false,
      activeTab: 'notification-settings',
      settingsTabs: [
        { id: 'notification-settings', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'security-settings', label: 'Security', icon: 'fas fa-lock' }
      ],

      emailSettings: {
        primaryEmail: '',
        secondaryEmail: ''
      },

      notificationChannels: [
        { id: 'email', name: 'Email Notifications', description: 'Receive notifications via email', enabled: true },
        { id: 'push', name: 'Push Notifications', description: 'Receive browser push notifications', enabled: true },
        { id: 'sms', name: 'SMS Notifications', description: 'Receive text message notifications', enabled: false }
      ],

      passwordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      passwordRequirements: [
        { key: 'length', label: 'At least 8 characters', met: false },
        { key: 'maxLength', label: 'No more than 16 characters', met: false },
        { key: 'uppercase', label: 'One uppercase letter', met: false },
        { key: 'lowercase', label: 'One lowercase letter', met: false },
        { key: 'number', label: 'One number', met: false },
        { key: 'special', label: 'One special character', met: false }
      ],

      showConfirmationModal: false,
      confirmationModalTitle: '',
      confirmationModalMessage: '',
      confirmationModalConfirmText: '',
      confirmationModalButtonClass: '',
      pendingAction: null,

      toast: {
        show: false,
        type: 'success',
        message: ''
      }
    }
  },
  computed: {
    getUserGradeInfo() {
      if (this.user.role?.toLowerCase() === 'student') {
        return this.user.gradeLevel
      }
      return this.user.role || 'Student'
    },
    passwordsMatch() {
      return this.passwordData.newPassword === this.passwordData.confirmPassword
    },
    passwordRequirementsMetCount() {
      return this.passwordRequirements.filter(req => req.met).length
    },
    passwordStrengthClass() {
      if (!this.passwordData.newPassword) return 'strength-none'

      const metCount = this.passwordRequirementsMetCount
      if (metCount <= 2) return 'strength-weak'
      if (metCount <= 4) return 'strength-medium'
      return 'strength-strong'
    },
    passwordStrengthText() {
      if (!this.passwordData.newPassword) return 'Not started'

      const metCount = this.passwordRequirementsMetCount
      if (metCount <= 2) return 'Weak'
      if (metCount <= 4) return 'Medium'
      return 'Strong'
    },
    passwordStrengthTone() {
      if (!this.passwordData.newPassword) return 'idle'

      const metCount = this.passwordRequirementsMetCount
      if (metCount <= 2) return 'weak'
      if (metCount <= 4) return 'medium'
      return 'strong'
    },
    passwordStrengthIcon() {
      const iconByTone = {
        idle: 'fa-circle',
        weak: 'fa-circle',
        medium: 'fa-bolt',
        strong: 'fa-shield-alt'
      }
      return iconByTone[this.passwordStrengthTone] || 'fa-circle'
    },
    passwordStrengthPercent() {
      return Math.round((this.passwordRequirementsMetCount / this.passwordRequirements.length) * 100)
    },
    passwordStrengthSummary() {
      if (!this.passwordData.newPassword) {
        return 'Start typing a new password to see its live security rating.'
      }

      if (this.passwordRequirementsMetCount === this.passwordRequirements.length) {
        return 'Strong password. You are meeting every current requirement.'
      }

      if (this.passwordRequirementsMetCount >= 4) {
        return 'Almost ready. Complete the final checks to make this password stronger.'
      }

      if (this.passwordRequirementsMetCount >= 1) {
        return 'Good start. Add more variety to improve your password strength.'
      }

      return 'Use a mix of letters, numbers, and symbols to increase password strength.'
    },
    passwordActionMessage() {
      if (!this.passwordData.currentPassword.trim()) {
        return 'Enter your current password to continue.'
      }

      if (!this.passwordData.newPassword) {
        return 'Create a new password to begin the security check.'
      }

      if (!this.passwordData.confirmPassword) {
        return 'Re-enter the new password to confirm it.'
      }

      if (!this.passwordsMatch) {
        return 'The confirmation password must match exactly.'
      }

      if (this.passwordRequirementsMetCount < this.passwordRequirements.length) {
        const remaining = this.passwordRequirements.length - this.passwordRequirementsMetCount
        return `Complete ${remaining} more requirement${remaining === 1 ? '' : 's'} to enable the update.`
      }

      return 'Everything looks ready. You can update your password now.'
    },
    isPasswordValid() {
      return Boolean(this.passwordData.currentPassword.trim()) &&
             Boolean(this.passwordData.newPassword) &&
             Boolean(this.passwordData.confirmPassword) &&
             this.passwordsMatch &&
             this.passwordRequirements.every(req => req.met)
    }
  },
  methods: {
    closeSidebar() {
      this.isSidebarOpen = false
    },
    toggleMobileMenu() {
      this.isSidebarOpen = !this.isSidebarOpen
    },
    showNotifications() {
      console.log('Show notifications')
    },
    logout() {
      this.showConfirmationModal = true
      this.confirmationModalTitle = 'Logout'
      this.confirmationModalMessage = 'Are you sure you want to logout?'
      this.confirmationModalConfirmText = 'Logout'
      this.confirmationModalButtonClass = 'btn-primary'
      this.pendingAction = 'logout'
    },
    setActiveTab(tabId) {
      this.activeTab = tabId
      localStorage.setItem('settingsActiveTab', tabId)
    },
    tabIconClass(tabId) {
      const iconByTab = {
        'notification-settings': 'icon-sem-assignments',
        'security-settings': 'icon-sem-settings'
      }
      return iconByTab[tabId] || 'icon-sem-neutral'
    },

    async saveNotificationChannels() {
      try {
        this.showToast('success', 'Notification channels updated successfully')
      } catch (error) {
        this.showToast('error', 'Failed to update notification channels')
      }
    },

    checkPasswordStrength() {
      const password = this.passwordData.newPassword

      this.passwordRequirements[0].met = password.length >= 8
      this.passwordRequirements[1].met = password.length <= 16
      this.passwordRequirements[2].met = /[A-Z]/.test(password)
      this.passwordRequirements[3].met = /[a-z]/.test(password)
      this.passwordRequirements[4].met = /[0-9]/.test(password)
      this.passwordRequirements[5].met = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    },

    checkPasswordMatch() {
      // Computed property handles this
    },

    toggleCurrentPassword() {
      this.showCurrentPassword = !this.showCurrentPassword
    },

    toggleNewPassword() {
      this.showNewPassword = !this.showNewPassword
    },

    toggleConfirmPassword() {
      this.showConfirmPassword = !this.showConfirmPassword
    },

    async updatePassword() {
      if (!this.isPasswordValid) {
        this.showToast('error', 'Password must be between 8 and 16 characters and satisfy all requirements')
        return
      }

      try {
        this.showToast('success', 'Password updated successfully')
        this.resetPasswordForm()
      } catch (error) {
        this.showToast('error', error.response?.data?.message || 'Failed to update password')
      }
    },

    resetPasswordForm() {
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      this.passwordRequirements.forEach(req => req.met = false)
    },

    downloadData() {
      this.showToast('info', 'Preparing your data for download...')
    },

    confirmDeactivateAccount() {
      this.showConfirmationModal = true
      this.confirmationModalTitle = 'Deactivate Account'
      this.confirmationModalMessage = 'Are you sure you want to temporarily deactivate your account? You can reactivate it later by logging in again.'
      this.confirmationModalConfirmText = 'Deactivate'
      this.confirmationModalButtonClass = 'btn-warning'
      this.pendingAction = 'deactivateAccount'
    },

    async deactivateAccount() {
      try {
        this.showToast('success', 'Account deactivated successfully')
        setTimeout(() => {
          this.$router.push('/logout')
        }, 2000)
      } catch (error) {
        this.showToast('error', 'Failed to deactivate account')
      }
    },

    confirmDeleteAccount() {
      this.showConfirmationModal = true
      this.confirmationModalTitle = 'Delete Account'
      this.confirmationModalMessage = 'This action is permanent and cannot be undone. All your data will be permanently removed. Are you absolutely sure?'
      this.confirmationModalConfirmText = 'Delete Permanently'
      this.confirmationModalButtonClass = 'btn-danger'
      this.pendingAction = 'deleteAccount'
    },

    async deleteAccount() {
      try {
        this.showToast('success', 'Account scheduled for deletion')
        setTimeout(() => {
          this.$router.push('/logout')
        }, 2000)
      } catch (error) {
        this.showToast('error', 'Failed to delete account')
      }
    },

    handleConfirmation() {
      switch (this.pendingAction) {
        case 'logout':
          this.$emit('logout')
          break
        case 'deactivateAccount':
          this.deactivateAccount()
          break
        case 'deleteAccount':
          this.deleteAccount()
          break
      }
      this.showConfirmationModal = false
      this.pendingAction = null
    },

    showToast(type, message) {
      this.toast = {
        show: true,
        type,
        message
      }
      setTimeout(() => {
        this.toast.show = false
      }, 3000)
    },

    async fetchSettings() {
      try {
        // const response = await this.$api.get('/student/settings')
        // this.emailSettings = response.data.email
        // this.notificationChannels = response.data.notificationChannels
      } catch (error) {
        this.showToast('error', 'Failed to load settings')
      }
    }
  },
  mounted() {
    const savedTab = localStorage.getItem('settingsActiveTab')
    const availableTabs = this.settingsTabs.map((tab) => tab.id)
    if (savedTab && availableTabs.includes(savedTab)) {
      this.activeTab = savedTab
    } else {
      this.activeTab = 'notification-settings'
    }

    this.emailSettings.primaryEmail = this.user.email
    this.fetchSettings()

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.showConfirmationModal) {
        this.showConfirmationModal = false
      }
      if (e.key === 'Escape' && this.isSidebarOpen) {
        this.closeSidebar()
      }
    })
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.closeSidebar)
  }
}
</script>

<style scoped>
.settings-hero,
.settings-panel,
.settings-toast {
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.settings-hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem 1.2rem;
  border-radius: 20px;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  background:
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box !important;
}

.settings-hero-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1e4307 0%, #365b0d 55%, #5f7418 100%) !important;
  color: #ffffff !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex: 0 0 auto;
}

.settings-hero-icon,
.settings-hero-icon i,
.settings-hero-icon .fas,
.settings-hero-icon::before,
.settings-hero-icon *::before {
  color: #ffffff !important;
  opacity: 1 !important;
}

.settings-hero-icon > .fa-cogs {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.settings-hero h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
}

.settings-hero p {
  margin: 0.35rem 0 0;
  color: #64748b;
  line-height: 1.55;
}

.settings-toast {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border-radius: 16px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  color: #0f172a;
}

.settings-toast.toast-success {
  border-color: #bbf7d0;
  background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
}

.settings-toast.toast-error {
  border-color: #fecaca;
  background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%);
}

.settings-grid.student-settings-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
}

.settings-panel {
  border-radius: 20px;
  padding: 1.1rem 1.15rem;
}

.settings-panel[data-tour="student-settings-security"] {
  width: 100%;
  max-width: none;
  --security-accent-dark: #1e4307;
  --security-accent: #365b0d;
  --security-accent-mid: #5f7418;
  --security-surface: #f8fbf3;
  --security-surface-strong: #eef5e3;
  --security-border: #dbe7c9;
  --security-border-strong: #bfd399;
  --security-ring: rgba(54, 91, 13, 0.14);
  --security-shadow: rgba(54, 91, 13, 0.22);
  border: 1px solid transparent;
  background:
    linear-gradient(180deg, #ffffff 0%, #f8faf7 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #365b0d 55%, #5f7418 100%) border-box;
}

.security-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.security-panel-copy {
  min-width: 0;
}

.security-panel-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.4rem;
  color: var(--security-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.security-panel-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
}

.security-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--security-border);
  background: var(--security-surface);
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.security-pill i {
  font-size: 0.82rem;
}

.security-pill-shield,
.security-pill-strong {
  border-color: var(--security-border-strong);
  background: var(--security-surface-strong);
  color: var(--security-accent-dark);
}

.security-pill-medium {
  border-color: #fde68a;
  background: #fffbeb;
  color: #b45309;
}

.security-pill-weak {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.security-pill-idle {
  border-color: var(--security-border);
  background: var(--security-surface);
  color: #55624a;
}

.panel-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.08rem;
}

.panel-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
  line-height: 1.55;
}

.student-settings-stack {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.student-settings-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  padding: 1rem;
}

.student-settings-card .panel-header {
  margin-bottom: 0.85rem;
}

.student-settings-card .panel-header h4 {
  margin: 0;
  color: #0f172a;
  font-size: 0.98rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.student-settings-card .panel-header p {
  margin: 0.3rem 0 0;
}

.student-settings-card .settings-card-body {
  padding-top: 0.1rem;
}

@media (max-width: 768px) {
  .settings-hero {
    align-items: flex-start;
    padding: 1rem;
  }

  .settings-panel {
    padding: 1rem;
  }

  .student-settings-card {
    padding: 0.9rem;
  }
}

.security-tab-pane .security-tab-header {
  margin-bottom: 1rem;
}

.security-tab-pane .security-tab-header h3 {
  color: #0f172a;
  font-size: 1.2rem;
  margin-bottom: 0.35rem;
}

.security-tab-pane .security-tab-header p {
  color: #64748b;
  margin: 0;
}

.security-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
}

.security-card {
  border: 1px solid var(--security-border);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, var(--security-surface) 100%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.security-card .settings-card-header {
  position: relative;
  border-bottom: 1px solid #e7eef6;
  padding-bottom: 0.85rem;
  margin-bottom: 0.9rem;
}

.security-card .settings-card-header h4 {
  color: #0f172a;
}

.security-card .settings-card-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
}

.security-card .settings-card-body {
  padding-top: 0.1rem;
}

.security-password-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 1rem 1.05rem 1.05rem;
}

.security-password-card::before {
  content: "";
  position: absolute;
  top: -70px;
  right: -50px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(191, 211, 153, 0.48) 0%, rgba(191, 211, 153, 0) 72%);
  pointer-events: none;
}

.security-password-card .settings-card-header {
  padding-bottom: 0.85rem;
  margin-bottom: 0.9rem;
}

.security-password-card .settings-card-body {
  padding: 0.1rem 0 0;
  position: relative;
}

.security-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.security-card-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  min-width: 0;
}

.security-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--security-accent-dark) 0%, var(--security-accent) 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 28px var(--security-shadow);
  flex: 0 0 auto;
}

.security-card-icon i,
.security-card-icon .fas {
  color: #ffffff !important;
}

.security-card-title-copy {
  min-width: 0;
}

.security-card-kicker {
  display: inline-flex;
  align-items: center;
  color: var(--security-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.security-card-title-copy h4 {
  display: block;
  margin: 0.12rem 0 0;
  font-size: 1.02rem;
}

.security-card-title-copy p {
  max-width: 44ch;
}

.security-status-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.08rem;
  min-width: 116px;
  padding: 0.7rem 0.85rem;
  border-radius: 14px;
  border: 1px solid var(--security-border);
  background: var(--security-surface);
  color: #334155;
}

.security-status-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.8;
}

.security-status-chip strong {
  font-size: 0.95rem;
}

.security-status-chip.status-idle {
  border-color: var(--security-border);
  background: var(--security-surface);
}

.security-status-chip.status-weak {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.security-status-chip.status-medium {
  border-color: #fde68a;
  background: #fffbeb;
  color: #b45309;
}

.security-status-chip.status-strong {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.security-password-card .settings-password-form {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.95fr);
  gap: 1rem 1.15rem;
  align-items: start;
}

.security-password-card .password-form-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.security-form-banner,
.security-password-card .current-password-group,
.security-password-card .password-form-actions {
  grid-column: 1 / -1;
}

.security-password-card .password-form-main .form-group {
  margin-bottom: 0;
}

.security-form-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--security-border);
  border-radius: 16px;
  background: linear-gradient(135deg, var(--security-surface-strong) 0%, var(--security-surface) 100%);
}

.security-form-banner-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--security-accent) 0%, var(--security-accent-dark) 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px var(--security-shadow);
  flex: 0 0 auto;
}

.security-form-banner-icon i {
  color: #ffffff !important;
}

.security-form-banner-icon > .fa-lock {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.security-form-banner-copy strong {
  display: block;
  color: #0f172a;
  font-size: 0.92rem;
}

.security-form-banner-copy p {
  margin: 0.3rem 0 0;
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.5;
}

.security-field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.45rem;
}

.security-field-label > span {
  color: #1e293b;
  font-weight: 700;
  font-size: 0.83rem;
  letter-spacing: 0.02em;
}

.security-field-label small {
  border: 1px solid var(--security-border);
  border-radius: 999px;
  background: var(--security-surface);
  color: #64748b;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.18rem 0.5rem;
}

.field-help {
  margin: 0.45rem 0 0;
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.45;
}

.security-password-card .password-form-side {
  border: 1px solid var(--security-border);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--security-surface) 0%, #ffffff 100%);
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.security-password-card .password-form-actions {
  margin-top: 0.1rem;
  padding-top: 1rem;
  border-top: 1px solid #e7eef6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.password-action-note {
  margin: 0;
  max-width: 34rem;
  color: #64748b;
  font-size: 0.79rem;
  line-height: 1.5;
}

.security-card .password-input {
  position: relative;
}

.security-card .password-input input {
  min-height: 48px;
  padding-right: 2.9rem;
  border: 1px solid #d7e2ee;
  border-radius: 12px;
  background: #fcfdff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.security-card .password-input input:focus {
  outline: none;
  border-color: var(--security-accent-mid);
  box-shadow: 0 0 0 4px var(--security-ring);
  background: #ffffff;
}

.security-card .toggle-password {
  position: absolute;
  top: 50%;
  right: 0.6rem;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #d9e3ef;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.security-card .toggle-password:hover {
  background: var(--security-surface-strong);
  border-color: var(--security-accent-mid);
  color: var(--security-accent-dark);
}

.password-submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-width: 180px;
  min-height: 44px;
  border-radius: 12px;
  border-color: var(--security-accent) !important;
  background: linear-gradient(135deg, var(--security-accent-dark) 0%, var(--security-accent) 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 12px 24px var(--security-shadow);
}

.password-submit-btn:not(:disabled):hover {
  background: linear-gradient(135deg, var(--security-accent) 0%, var(--security-accent-mid) 100%) !important;
  border-color: var(--security-accent-mid) !important;
}

.password-submit-btn:disabled {
  box-shadow: none;
}

.password-side-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.password-side-eyebrow {
  display: inline-flex;
  color: var(--security-accent);
  font-size: 0.69rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.password-side-header h5 {
  margin: 0.12rem 0 0;
  color: #0f172a;
  font-size: 0.95rem;
}

.password-side-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  height: 34px;
  padding: 0 0.7rem;
  border-radius: 999px;
  background: var(--security-surface-strong);
  color: var(--security-accent-dark);
  font-size: 0.8rem;
  font-weight: 700;
}

.password-strength-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.8rem 0.85rem;
}

.password-strength-card.strength-card-idle {
  border-color: var(--security-border);
}

.password-strength-card.strength-card-weak {
  border-color: #fecaca;
  background: #fff7f7;
}

.password-strength-card.strength-card-medium {
  border-color: #fde68a;
  background: #fffcf2;
}

.password-strength-card.strength-card-strong {
  border-color: #bbf7d0;
  background: #f6fff8;
}

.password-strength-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.strength-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.24rem 0.55rem;
  border-radius: 999px;
  background: var(--security-surface-strong);
  color: var(--security-accent-dark);
  font-size: 0.74rem;
  font-weight: 700;
}

.strength-percent {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}

.security-card .password-strength {
  margin-top: 0;
  display: grid;
  gap: 0.45rem;
}

.security-card .strength-bar {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #e2e8f0;
  margin-bottom: 0;
}

.security-card .strength-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.25s ease, background 0.25s ease;
}

.security-card .strength-fill.strength-none {
  background: transparent;
}

.security-card .strength-fill.strength-weak {
  background: linear-gradient(90deg, #ef4444 0%, #fca5a5 100%);
}

.security-card .strength-fill.strength-medium {
  background: linear-gradient(90deg, #f59e0b 0%, #fcd34d 100%);
}

.security-card .strength-fill.strength-strong {
  background: linear-gradient(90deg, #22c55e 0%, #86efac 100%);
}

.security-card .strength-text {
  font-size: 0.79rem;
  color: #64748b;
  line-height: 1.5;
}

.security-card .password-requirements {
  margin-top: 0;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.75rem 0.8rem;
}

.security-card .password-requirements p {
  margin: 0 0 0.6rem;
  color: #334155;
  font-weight: 600;
  font-size: 0.8rem;
}

.security-card .password-requirements ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.45rem;
}

.security-card .requirement {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.79rem;
  color: #64748b;
  line-height: 1.35;
}

.security-card .requirement i {
  margin-top: 0.1rem;
  color: #94a3b8;
  font-size: 0.78rem;
}

.security-card .requirement.met {
  color: #166534;
}

.security-card .requirement.met i {
  color: #16a34a;
}

.security-card .password-match {
  margin-top: 0.55rem;
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

.security-card .password-match.valid {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.password-side-tip {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.7rem 0.75rem;
  border: 1px solid var(--security-border-strong);
  border-radius: 12px;
  background: var(--security-surface-strong);
  color: var(--security-accent-dark);
  font-size: 0.77rem;
  line-height: 1.5;
}

.password-side-tip i {
  margin-top: 0.08rem;
}

.security-card .two-factor-status {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  padding: 0.8rem;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
}

.security-card .status-info h5 {
  margin: 0 0 0.2rem;
  color: #0f172a;
  font-size: 0.92rem;
}

.security-card .status-info p {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.8rem;
}

.security-card .status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  color: #334155;
  background: #f8fafc;
}

.security-card .status-badge.enabled {
  border-color: #86efac;
  color: #166534;
  background: #f0fdf4;
}

.security-card .status-badge.disabled {
  border-color: #fecaca;
  color: #b91c1c;
  background: #fef2f2;
}

.security-card .two-factor-setup {
  margin-top: 0.9rem;
  display: grid;
  gap: 0.75rem;
}

.security-card .setup-step {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem;
  background: #ffffff;
}

.security-card .setup-step h6 {
  margin: 0;
  color: #0f172a;
  font-size: 0.86rem;
}

.security-card .setup-step p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.8rem;
}

.security-card .verification-code {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.45rem;
}

.security-card .verification-code input {
  flex: 1;
  min-height: 40px;
}

.security-card .backup-codes {
  margin: 0.55rem 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
}

.security-card .backup-codes code {
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.74rem;
  padding: 0.35rem 0.4rem;
  color: #334155;
}

@media (max-width: 860px) {
  .security-panel-header,
  .security-card-top,
  .security-password-card .password-form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .security-panel-pills {
    justify-content: flex-start;
  }

  .security-password-card .settings-password-form,
  .security-password-card .password-form-main {
    grid-template-columns: 1fr;
  }

  .security-password-card .password-form-actions {
    min-height: auto;
  }

  .password-submit-btn {
    width: 100%;
  }

  .security-card .two-factor-status {
    align-items: flex-start;
    flex-direction: column;
  }

  .security-card .backup-codes {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .security-panel-pills {
    width: 100%;
  }

  .security-pill {
    width: 100%;
    justify-content: center;
  }

  .security-field-label {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .security-password-card,
  .security-password-card .password-form-side {
    padding: 0.85rem;
  }
}
</style>
