<template>
  <div class="student-dashboard-page" :class="appearanceClasses">
    <section class="settings-hero">
      <div class="settings-hero-icon"><i class="fas fa-cogs"></i></div>
      <div>
        <span class="settings-eyebrow">My preferences</span>
        <h2>Student Settings</h2>
        <p>Choose how EduMatch notifies you, looks on this device, and protects your account.</p>
      </div>
    </section>

    <section v-if="toast.show" class="settings-toast" :class="`toast-${toast.type}`" role="status" aria-live="polite">
      <i class="fas" :class="toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'"></i>
      <span>{{ toast.message }}</span>
    </section>

    <div class="student-settings-workspace">
      <aside class="student-settings-nav" aria-label="Student settings sections">
        <div class="settings-nav-heading">
          <strong>Settings</strong>
          <small>Synced with your account</small>
        </div>
        <button
          v-for="tab in settingsTabs"
          :key="tab.id"
          type="button"
          class="settings-nav-item"
          :class="{ active: activeTab === tab.id }"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          @click="setActiveTab(tab.id)"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
          <i class="fas fa-chevron-right"></i>
        </button>
      </aside>

      <main class="student-settings-content">
        <section v-show="activeTab === 'notifications'" class="settings-panel preference-panel">
          <div class="panel-header section-heading">
            <span class="section-icon"><i class="fas fa-bell"></i></span>
            <div><h3>Notification Preferences</h3><p>Choose the school updates that should get your attention.</p></div>
          </div>
          <div class="preference-list">
            <label v-for="preference in notificationPreferences" :key="preference.id" class="preference-row">
              <span><strong>{{ preference.name }}</strong><small>{{ preference.description }}</small></span>
              <input v-model="preference.enabled" type="checkbox" class="settings-toggle-input">
            </label>
          </div>
          <div class="inline-setting">
            <label for="deadline-reminder">Deadline reminder</label>
            <select id="deadline-reminder" v-model="learningPreferences.deadlineReminder">
              <option value="none">No reminder</option>
              <option value="same-day">On the due date</option>
              <option value="one-day">1 day before</option>
              <option value="three-days">3 days before</option>
            </select>
          </div>
          <div class="panel-actions">
            <small>These preferences are saved in this browser.</small>
            <button type="button" class="btn btn-primary" :disabled="isSavingPreferences" @click="savePreferences"><i class="fas" :class="isSavingPreferences ? 'fa-spinner fa-spin' : 'fa-save'"></i> {{ isSavingPreferences ? 'Saving...' : 'Save preferences' }}</button>
          </div>
        </section>

        <section v-show="activeTab === 'appearance'" class="settings-panel preference-panel">
          <div class="panel-header section-heading">
            <span class="section-icon"><i class="fas fa-palette"></i></span>
            <div><h3>Appearance &amp; Accessibility</h3><p>Make your learning space more comfortable to read and use.</p></div>
          </div>
          <div class="theme-options" role="radiogroup" aria-label="Color theme">
            <button v-for="option in themeOptions" :key="option.value" type="button" class="theme-option" :class="{ active: appearance.theme === option.value }" role="radio" :aria-checked="appearance.theme === option.value" :disabled="isSavingPreferences" @click="selectTheme(option.value)">
              <i :class="option.icon"></i><span><strong>{{ option.label }}</strong><small>{{ option.description }}</small></span>
            </button>
          </div>
          <div class="inline-setting">
            <label for="text-size">Text size</label>
            <select id="text-size" v-model="appearance.textSize" @change="applyAppearance">
              <option value="normal">Normal</option><option value="large">Large</option><option value="larger">Larger</option>
            </select>
          </div>
          <div class="preference-list compact-list">
            <label class="preference-row"><span><strong>Higher contrast</strong><small>Increase borders and text contrast.</small></span><input v-model="appearance.highContrast" type="checkbox" class="settings-toggle-input" @change="applyAppearance"></label>
            <label class="preference-row"><span><strong>Reduce motion</strong><small>Limit non-essential interface animation.</small></span><input v-model="appearance.reduceMotion" type="checkbox" class="settings-toggle-input" @change="applyAppearance"></label>
          </div>
          <div class="panel-actions"><small>Appearance applies immediately and follows your account.</small><button type="button" class="btn btn-primary" :disabled="isSavingPreferences" @click="savePreferences"><i class="fas" :class="isSavingPreferences ? 'fa-spinner fa-spin' : 'fa-save'"></i> {{ isSavingPreferences ? 'Saving...' : 'Save appearance' }}</button></div>
        </section>

        <template v-if="activeTab === 'security'">
          <section class="settings-panel sessions-panel">
            <div class="panel-header sessions-header">
              <div class="section-heading"><span class="section-icon"><i class="fas fa-laptop"></i></span><div><h3>Active Sessions</h3><p>Review devices signed in to your account.</p></div></div>
              <button type="button" class="btn btn-outline" :disabled="isLoadingSessions" @click="loadActiveSessions"><i class="fas" :class="isLoadingSessions ? 'fa-spinner fa-spin' : 'fa-rotate'"></i> Refresh</button>
            </div>
            <div v-if="isLoadingSessions" class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading sessions...</div>
            <div v-else-if="sessionError" class="empty-state error-state">{{ sessionError }}</div>
            <div v-else-if="activeSessions.length === 0" class="empty-state">No active sessions were found.</div>
            <div v-else class="session-list">
              <article v-for="session in sortedSessions" :key="session.id" class="session-item" :class="{ current: session.current }">
                <span class="session-icon"><i class="fas fa-display"></i></span>
                <div><strong>{{ formatSessionDevice(session.userAgent) }}</strong><span v-if="session.current" class="current-badge">Current device</span><small>{{ session.ipAddress || 'Unknown IP' }} · Last active {{ formatSessionTime(session.lastSeenAt || session.createdAt) }}</small></div>
                <button v-if="!session.current" type="button" class="btn btn-outline" :disabled="revokingSessionId === session.id" @click="revokeSession(session.id)">{{ revokingSessionId === session.id ? 'Logging out...' : 'Log out' }}</button>
              </article>
            </div>
          </section>

          <section class="settings-panel" data-tour="student-settings-security">
            <div class="panel-header security-panel-header">
              <div class="security-panel-copy"><span class="security-panel-eyebrow">Student account protection</span><h3>Change Password</h3><p>Use a unique password to keep your learning records secure.</p></div>
              <div class="security-panel-pills" aria-label="Security overview"><span class="security-pill security-pill-shield"><i class="fas fa-shield-alt"></i> Protected account</span><span class="security-pill" :class="`security-pill-${passwordStrengthTone}`"><i class="fas" :class="passwordStrengthIcon"></i>{{ passwordRequirementsMetCount }}/{{ passwordRequirements.length }} checks</span></div>
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
                    <p class="field-help">Use 8 to 16 characters with uppercase, lowercase, a number, and a symbol.</p>
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
                      :disabled="!isPasswordValid || isUpdatingPassword"
                    >
                      <i class="fas" :class="isUpdatingPassword ? 'fa-spinner fa-spin' : 'fa-shield-alt'"></i>
                      {{ isUpdatingPassword ? 'Updating...' : 'Update Password' }}
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
        </template>

        <section v-show="activeTab === 'privacy'" class="settings-panel privacy-panel">
          <div class="panel-header section-heading"><span class="section-icon"><i class="fas fa-user-shield"></i></span><div><h3>Privacy &amp; Account Data</h3><p>Understand what is stored and take a copy of your account preferences.</p></div></div>
          <div class="privacy-grid">
            <article class="privacy-card"><i class="fas fa-database"></i><div><h4>Your information</h4><p>EduMatch stores your profile, class enrollment, learning progress, submissions, grades, and attendance as part of your school record.</p></div></article>
            <article class="privacy-card"><i class="fas fa-file-arrow-down"></i><div><h4>Download settings snapshot</h4><p>Download your visible profile details and settings from this device as a JSON file.</p><button type="button" class="btn btn-outline" @click="downloadData"><i class="fas fa-download"></i> Download snapshot</button></div></article>
            <article class="privacy-card privacy-card-warning"><i class="fas fa-school"></i><div><h4>Deactivate or delete an account</h4><p>Submit a request for a school administrator to review. Deletion permanently removes the account and associated records after approval.</p></div></article>
            <article v-if="accountRequest" class="privacy-card account-request-status"><i class="fas fa-clipboard-check"></i><div><h4>Latest request: {{ formatRequestStatus(accountRequest.status) }}</h4><p>{{ formatRequestAction(accountRequest.action) }} requested {{ formatSessionTime(accountRequest.createdAt) }}.</p><p v-if="accountRequest.reviewerNote"><strong>Administrator note:</strong> {{ accountRequest.reviewerNote }}</p></div></article>
            <form v-if="!hasPendingAccountRequest" class="account-request-form" @submit.prevent="submitAccountRequest">
              <div><label for="account-action">Requested action</label><select id="account-action" v-model="accountRequestForm.action"><option value="deactivate">Deactivate my account</option><option value="delete">Delete my account and records</option></select></div>
              <div><label for="account-reason">Reason</label><textarea id="account-reason" v-model.trim="accountRequestForm.reason" rows="4" maxlength="1000" placeholder="Explain why you are requesting this change..." required></textarea><small>{{ accountRequestForm.reason.length }}/1000 · Minimum 10 characters</small></div>
              <button type="submit" class="btn" :class="accountRequestForm.action === 'delete' ? 'btn-danger' : 'btn-outline'" :disabled="isSubmittingAccountRequest || accountRequestForm.reason.length < 10"><i class="fas" :class="isSubmittingAccountRequest ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i> {{ isSubmittingAccountRequest ? 'Submitting...' : 'Submit for review' }}</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'

const STUDENT_SETTINGS_KEY = 'edumatch_student_settings_v2'

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
      activeTab: 'notifications',
      settingsTabs: [
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'appearance', label: 'Appearance', icon: 'fas fa-palette' },
        { id: 'security', label: 'Security', icon: 'fas fa-lock' },
        { id: 'privacy', label: 'Privacy & Data', icon: 'fas fa-user-shield' }
      ],
      notificationPreferences: [
        { id: 'announcements', name: 'Announcements', description: 'Notify me when a teacher posts an announcement.', enabled: true },
        { id: 'lessons', name: 'Lessons and activities', description: 'Notify me when new learning materials are available.', enabled: true },
        { id: 'deadlines', name: 'Upcoming deadlines', description: 'Remind me before an activity or assessment is due.', enabled: true },
        { id: 'results', name: 'Grades and results', description: 'Notify me when a result or grade is released.', enabled: true },
        { id: 'enrollment', name: 'Class enrollment', description: 'Notify me when a class request changes status.', enabled: true },
        { id: 'inApp', name: 'In-app notifications', description: 'Show enabled updates in the EduMatch notification menu.', enabled: true }
      ],
      learningPreferences: { deadlineReminder: 'one-day' },
      appearance: { theme: 'system', textSize: 'normal', highContrast: false, reduceMotion: false },
      isSystemDark: false,
      themeOptions: [
        { value: 'system', label: 'System', description: 'Follow this device', icon: 'fas fa-desktop' },
        { value: 'light', label: 'Light', description: 'Bright workspace', icon: 'fas fa-sun' },
        { value: 'dark', label: 'Dark', description: 'Dim workspace', icon: 'fas fa-moon' }
      ],
      activeSessions: [],
      isLoadingSessions: false,
      sessionError: '',
      revokingSessionId: '',
      isUpdatingPassword: false,
      isSavingPreferences: false,
      accountRequest: null,
      accountRequestForm: { action: 'deactivate', reason: '' },
      isSubmittingAccountRequest: false,

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
    },
    sortedSessions() {
      return [...this.activeSessions].sort((left, right) => Number(right.current) - Number(left.current))
    },
    hasPendingAccountRequest() {
      return this.accountRequest?.status === 'pending'
    },
    appearanceClasses() {
      return {
        'student-theme-dark': this.appearance.theme === 'dark' || (this.appearance.theme === 'system' && this.isSystemDark),
        'student-theme-light': this.appearance.theme === 'light',
        'student-text-large': this.appearance.textSize === 'large',
        'student-text-larger': this.appearance.textSize === 'larger',
        'student-high-contrast': this.appearance.highContrast,
        'student-reduce-motion': this.appearance.reduceMotion
      }
    }
  },
  methods: {
    resolveApiBaseUrl() {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      return configured.endsWith('/api') ? configured : `${configured}/api`
    },
    authConfig() {
      const authStore = useAuthStore()
      return { headers: { Authorization: `Bearer ${authStore.token}` } }
    },
    preferenceStorageKey() {
      const identity = this.user.id || this.user._id || this.user.username || 'student'
      return `${STUDENT_SETTINGS_KEY}_${identity}`
    },
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
      localStorage.setItem('edumatch_student_settings_tab', tabId)
      if (tabId === 'security' && this.activeSessions.length === 0) this.loadActiveSessions()
    },
    settingsPayload() {
      return {
        notifications: Object.fromEntries(this.notificationPreferences.map(item => [item.id, item.enabled])),
        learning: { ...this.learningPreferences },
        appearance: { ...this.appearance }
      }
    },
    applySettingsPayload(saved = {}) {
      this.notificationPreferences.forEach(item => {
        if (typeof saved.notifications?.[item.id] === 'boolean') item.enabled = saved.notifications[item.id]
      })
      if (saved.learning?.deadlineReminder) this.learningPreferences.deadlineReminder = saved.learning.deadlineReminder
      if (saved.appearance && typeof saved.appearance === 'object') this.appearance = { ...this.appearance, ...saved.appearance }
      this.applyAppearance()
    },
    async savePreferences() {
      this.isSavingPreferences = true
      try {
        const payload = this.settingsPayload()
        const response = await axios.put(`${this.resolveApiBaseUrl()}/student/settings`, payload, this.authConfig())
        const saved = response.data?.settings || payload
        this.applySettingsPayload(saved)
        localStorage.setItem(this.preferenceStorageKey(), JSON.stringify(payload))
        window.dispatchEvent(new CustomEvent('edumatch-student-preferences-changed', { detail: saved }))
        this.showToast('success', 'Preferences saved to your account.')
      } catch (error) {
        this.showToast('error', error.response?.data?.message || 'Unable to save preferences.')
      } finally {
        this.isSavingPreferences = false
      }
    },
    async loadPreferences() {
      try {
        const cached = JSON.parse(localStorage.getItem(this.preferenceStorageKey()) || '{}')
        this.applySettingsPayload(cached)
      } catch (_cacheError) {
        localStorage.removeItem(this.preferenceStorageKey())
      }
      try {
        const response = await axios.get(`${this.resolveApiBaseUrl()}/student/settings`, this.authConfig())
        const saved = response.data?.settings || {}
        this.applySettingsPayload(saved)
        localStorage.setItem(this.preferenceStorageKey(), JSON.stringify(saved))
        window.dispatchEvent(new CustomEvent('edumatch-student-preferences-changed', { detail: saved }))
      } catch (error) {
        this.showToast('error', error.response?.data?.message || 'Using locally saved preferences because account settings could not be loaded.')
      }
    },
    applyAppearance() {
      this.isSystemDark = this.appearance.theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
      document.documentElement.dataset.studentTheme = this.appearance.theme
      document.documentElement.dataset.studentTextSize = this.appearance.textSize
      document.documentElement.classList.toggle('student-reduce-motion-enabled', this.appearance.reduceMotion)
      document.documentElement.classList.toggle('student-high-contrast-enabled', this.appearance.highContrast)
      try {
        const cacheKey = this.preferenceStorageKey()
        const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')
        localStorage.setItem(cacheKey, JSON.stringify({
          ...cached,
          appearance: { ...this.appearance }
        }))
      } catch (_error) {
        // The live theme still works if browser storage is unavailable.
      }
      window.dispatchEvent(new CustomEvent('edumatch-student-preferences-changed', {
        detail: { appearance: { ...this.appearance } }
      }))
    },

    async selectTheme(theme) {
      if (!this.themeOptions.some(option => option.value === theme)) return
      this.appearance.theme = theme
      this.applyAppearance()
      await this.savePreferences()
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

      this.isUpdatingPassword = true
      const authStore = useAuthStore()
      try {
        await authStore.changePassword({
          currentPassword: this.passwordData.currentPassword,
          newPassword: this.passwordData.newPassword,
          confirmNewPassword: this.passwordData.confirmPassword
        })
        this.resetPasswordForm()
        this.showToast('success', 'Password updated. Please sign in again with your new password.')
        setTimeout(() => this.$router.replace('/auth/login?message=Password updated successfully'), 900)
      } catch (error) {
        this.showToast('error', authStore.error || error.message || 'Failed to update password')
      } finally {
        this.isUpdatingPassword = false
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

    async loadActiveSessions() {
      if (this.isLoadingSessions) return
      this.isLoadingSessions = true
      this.sessionError = ''
      try {
        const response = await axios.get(`${this.resolveApiBaseUrl()}/auth/sessions`, this.authConfig())
        this.activeSessions = Array.isArray(response.data?.sessions) ? response.data.sessions : []
      } catch (error) {
        this.sessionError = error.response?.data?.message || 'Unable to load active sessions.'
      } finally {
        this.isLoadingSessions = false
      }
    },
    async revokeSession(sessionId) {
      this.revokingSessionId = sessionId
      try {
        await axios.delete(`${this.resolveApiBaseUrl()}/auth/sessions/${encodeURIComponent(sessionId)}`, this.authConfig())
        this.activeSessions = this.activeSessions.filter(session => session.id !== sessionId)
        this.showToast('success', 'The selected device has been logged out.')
      } catch (error) {
        this.showToast('error', error.response?.data?.message || 'Unable to log out that device.')
      } finally {
        this.revokingSessionId = ''
      }
    },
    formatSessionDevice(userAgent) {
      const value = String(userAgent || '')
      const browser = value.includes('Edg/') ? 'Microsoft Edge' : value.includes('Firefox/') ? 'Firefox' : value.includes('Chrome/') ? 'Chrome' : value.includes('Safari/') ? 'Safari' : 'Browser'
      const device = /Android|iPhone|iPad|Mobile/i.test(value) ? 'mobile device' : 'computer'
      return `${browser} on ${device}`
    },
    formatSessionTime(value) {
      if (!value) return 'unknown'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? 'unknown' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    },
    downloadData() {
      const snapshot = {
        exportedAt: new Date().toISOString(),
        profile: {
          displayName: this.user.displayName || '', username: this.user.username || '',
          email: this.user.email || '', role: this.user.role || 'student', gradeLevel: this.user.gradeLevel || ''
        },
        preferences: {
          notifications: Object.fromEntries(this.notificationPreferences.map(item => [item.id, item.enabled])),
          learning: { ...this.learningPreferences }, appearance: { ...this.appearance }
        },
        notice: 'This snapshot does not include official academic records. Contact the school for a complete record request.'
      }
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `edumatch-student-settings-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      this.showToast('success', 'Settings snapshot downloaded.')
    },
    async loadAccountRequest() {
      try {
        const response = await axios.get(`${this.resolveApiBaseUrl()}/student/account-requests/current`, this.authConfig())
        this.accountRequest = response.data?.request || null
      } catch (error) {
        this.showToast('error', error.response?.data?.message || 'Unable to load account request status.')
      }
    },
    async submitAccountRequest() {
      if (this.accountRequestForm.reason.length < 10) return
      if (this.accountRequestForm.action === 'delete' && !window.confirm('Deletion is permanent after administrator approval and may remove associated records. Submit this request?')) return
      this.isSubmittingAccountRequest = true
      try {
        const response = await axios.post(`${this.resolveApiBaseUrl()}/student/account-requests`, this.accountRequestForm, this.authConfig())
        this.accountRequest = response.data?.request || null
        this.accountRequestForm.reason = ''
        this.showToast('success', response.data?.message || 'Account request submitted for review.')
      } catch (error) {
        this.showToast('error', error.response?.data?.message || 'Unable to submit account request.')
      } finally {
        this.isSubmittingAccountRequest = false
      }
    },
    formatRequestStatus(status) {
      return ({ pending: 'Pending review', approved: 'Approved', rejected: 'Rejected', completed: 'Completed' })[status] || 'Unknown'
    },
    formatRequestAction(action) {
      return action === 'delete' ? 'Account deletion' : 'Account deactivation'
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

    handleEscape(event) {
      if (event.key === 'Escape' && this.isSidebarOpen) this.closeSidebar()
    }
  },
  mounted() {
    const authStore = useAuthStore()
    if (authStore.user) this.user = { ...this.user, ...authStore.user }
    const savedTab = localStorage.getItem('edumatch_student_settings_tab')
    const availableTabs = this.settingsTabs.map((tab) => tab.id)
    this.activeTab = savedTab && availableTabs.includes(savedTab) ? savedTab : 'notifications'
    this.loadPreferences()
    this.loadAccountRequest()
    if (this.activeTab === 'security') this.loadActiveSessions()
    document.addEventListener('keydown', this.handleEscape)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscape)
  }
}
</script>

<style scoped>
@reference "../../styles/tailwind.css";

.settings-hero,
.settings-panel,
.settings-toast {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[box-shadow:0_10px_28px_rgba(15,_23,_42,_0.06)];
}

.settings-hero {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:1rem];
  @apply tw:[padding:1.15rem_1.2rem];
  @apply tw:[border-radius:20px];
  @apply tw:[margin-bottom:1rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)_padding-box,_____linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box]!;
}

.settings-hero-icon {
  @apply tw:[width:52px];
  @apply tw:[height:52px];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(135deg,_#1e4307_0%,_#365b0d_55%,_#5f7418_100%)]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[font-size:1.2rem];
  @apply tw:flex-none;
}

.settings-hero-icon,
.settings-hero-icon i,
.settings-hero-icon .fas,
.settings-hero-icon::before,
.settings-hero-icon *::before {
  @apply tw:[color:#ffffff]!;
  @apply tw:opacity-100!;
}

.settings-hero-icon > .fa-cogs {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.settings-hero h2 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.35rem];
}

.settings-hero p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[line-height:1.55];
}

.settings-toast {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.85rem_1rem];
  @apply tw:[margin-bottom:1rem];
  @apply tw:[color:#0f172a];
}

.settings-toast.toast-success {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:linear-gradient(180deg,_#f0fdf4_0%,_#dcfce7_100%)];
}

.settings-toast.toast-error {
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:linear-gradient(180deg,_#fef2f2_0%,_#fee2e2_100%)];
}

.settings-grid.student-settings-grid {
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
}

.settings-panel {
  @apply tw:[border-radius:20px];
  @apply tw:[padding:1.1rem_1.15rem];
}

.settings-panel[data-tour="student-settings-security"] {
  @apply tw:w-full;
  @apply tw:max-w-none;
  --security-accent-dark: #1e4307;
  --security-accent: #365b0d;
  --security-accent-mid: #5f7418;
  --security-surface: #f8fbf3;
  --security-surface-strong: #eef5e3;
  --security-border: #dbe7c9;
  --security-border-strong: #bfd399;
  --security-ring: rgba(54, 91, 13, 0.14);
  --security-shadow: rgba(54, 91, 13, 0.22);
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8faf7_100%)_padding-box,_____linear-gradient(135deg,_#1e4307_0%,_#365b0d_55%,_#5f7418_100%)_border-box];
}

.security-panel-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

.security-panel-copy {
  @apply tw:[min-width:0];
}

.security-panel-eyebrow {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
  @apply tw:[margin-bottom:0.4rem];
  @apply tw:[color:var(--security-accent)];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.14em];
  @apply tw:uppercase;
}

.security-panel-pills {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:justify-end;
  @apply tw:[gap:0.6rem];
}

.security-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:0.55rem_0.85rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_var(--security-border)];
  @apply tw:[background:var(--security-surface)];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:600];
  @apply tw:whitespace-nowrap;
}

.security-pill i {
  @apply tw:[font-size:0.82rem];
}

.security-pill-shield,
.security-pill-strong {
  @apply tw:[border-color:var(--security-border-strong)];
  @apply tw:[background:var(--security-surface-strong)];
  @apply tw:[color:var(--security-accent-dark)];
}

.security-pill-medium {
  @apply tw:[border-color:#fde68a];
  @apply tw:[background:#fffbeb];
  @apply tw:[color:#b45309];
}

.security-pill-weak {
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
}

.security-pill-idle {
  @apply tw:[border-color:var(--security-border)];
  @apply tw:[background:var(--security-surface)];
  @apply tw:[color:#55624a];
}

.panel-header h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.08rem];
}

.panel-header p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[line-height:1.55];
}

.student-settings-stack {
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[margin-top:1rem];
}

.student-settings-card {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_8px_18px_rgba(15,_23,_42,_0.04)];
  @apply tw:[padding:1rem];
}

.student-settings-card .panel-header {
  @apply tw:[margin-bottom:0.85rem];
}

.student-settings-card .panel-header h4 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.98rem];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
}

.student-settings-card .panel-header p {
  @apply tw:[margin:0.3rem_0_0];
}

.student-settings-card .settings-card-body {
  @apply tw:[padding-top:0.1rem];
}

@media (max-width: 768px) {
  .settings-hero {
    @apply tw:items-start;
    @apply tw:[padding:1rem];
  }

  .settings-panel {
    @apply tw:[padding:1rem];
  }

  .student-settings-card {
    @apply tw:[padding:0.9rem];
  }
}

.security-tab-pane .security-tab-header {
  @apply tw:[margin-bottom:1rem];
}

.security-tab-pane .security-tab-header h3 {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.2rem];
  @apply tw:[margin-bottom:0.35rem];
}

.security-tab-pane .security-tab-header p {
  @apply tw:[color:#64748b];
  @apply tw:[margin:0];
}

.security-grid {
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
}

.security-card {
  @apply tw:[border:1px_solid_var(--security-border)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_var(--security-surface)_100%)];
  @apply tw:[box-shadow:0_18px_40px_rgba(15,_23,_42,_0.08)];
}

.security-card .settings-card-header {
  @apply tw:relative;
  @apply tw:[border-bottom:1px_solid_#e7eef6];
  @apply tw:[padding-bottom:0.85rem];
  @apply tw:[margin-bottom:0.9rem];
}

.security-card .settings-card-header h4 {
  @apply tw:[color:#0f172a];
}

.security-card .settings-card-header p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
}

.security-card .settings-card-body {
  @apply tw:[padding-top:0.1rem];
}

.security-password-card {
  @apply tw:relative;
  @apply tw:overflow-hidden;
  @apply tw:w-full;
  @apply tw:[padding:1rem_1.05rem_1.05rem];
}

.security-password-card::before {
  @apply tw:[content:""];
  @apply tw:absolute;
  @apply tw:[top:-70px];
  @apply tw:[right:-50px];
  @apply tw:[width:220px];
  @apply tw:[height:220px];
  @apply tw:[border-radius:50%];
  @apply tw:[background:radial-gradient(circle,_rgba(191,_211,_153,_0.48)_0%,_rgba(191,_211,_153,_0)_72%)];
  @apply tw:pointer-events-none;
}

.security-password-card .settings-card-header {
  @apply tw:[padding-bottom:0.85rem];
  @apply tw:[margin-bottom:0.9rem];
}

.security-password-card .settings-card-body {
  @apply tw:[padding:0.1rem_0_0];
  @apply tw:relative;
}

.security-card-top {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

.security-card-title-wrap {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.85rem];
  @apply tw:[min-width:0];
}

.security-card-icon {
  @apply tw:[width:48px];
  @apply tw:[height:48px];
  @apply tw:[border-radius:14px];
  @apply tw:[background:linear-gradient(135deg,_var(--security-accent-dark)_0%,_var(--security-accent)_100%)];
  @apply tw:[color:#ffffff];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[box-shadow:0_14px_28px_var(--security-shadow)];
  @apply tw:flex-none;
}

.security-card-icon i,
.security-card-icon .fas {
  @apply tw:[color:#ffffff]!;
}

.security-card-title-copy {
  @apply tw:[min-width:0];
}

.security-card-kicker {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[color:var(--security-accent)];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.14em];
  @apply tw:uppercase;
}

.security-card-title-copy h4 {
  @apply tw:block;
  @apply tw:[margin:0.12rem_0_0];
  @apply tw:[font-size:1.02rem];
}

.security-card-title-copy p {
  @apply tw:[max-width:44ch];
}

.security-status-chip {
  @apply tw:inline-flex;
  @apply tw:flex-col;
  @apply tw:items-start;
  @apply tw:[gap:0.08rem];
  @apply tw:[min-width:116px];
  @apply tw:[padding:0.7rem_0.85rem];
  @apply tw:[border-radius:14px];
  @apply tw:[border:1px_solid_var(--security-border)];
  @apply tw:[background:var(--security-surface)];
  @apply tw:[color:#334155];
}

.security-status-label {
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
  @apply tw:[opacity:0.8];
}

.security-status-chip strong {
  @apply tw:[font-size:0.95rem];
}

.security-status-chip.status-idle {
  @apply tw:[border-color:var(--security-border)];
  @apply tw:[background:var(--security-surface)];
}

.security-status-chip.status-weak {
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
}

.security-status-chip.status-medium {
  @apply tw:[border-color:#fde68a];
  @apply tw:[background:#fffbeb];
  @apply tw:[color:#b45309];
}

.security-status-chip.status-strong {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
}

.security-password-card .settings-password-form {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.55fr)_minmax(300px,_0.95fr)];
  @apply tw:[gap:1rem_1.15rem];
  @apply tw:[align-items:start];
}

.security-password-card .password-form-main {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:1rem];
  @apply tw:[align-items:start];
}

.security-form-banner,
.security-password-card .current-password-group,
.security-password-card .password-form-actions {
  @apply tw:[grid-column:1_/_-1];
}

.security-password-card .password-form-main .form-group {
  @apply tw:[margin-bottom:0];
}

.security-form-banner {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border:1px_solid_var(--security-border)];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(135deg,_var(--security-surface-strong)_0%,_var(--security-surface)_100%)];
}

.security-form-banner-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:12px];
  @apply tw:[background:linear-gradient(135deg,_var(--security-accent)_0%,_var(--security-accent-dark)_100%)];
  @apply tw:[color:#ffffff];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[box-shadow:0_12px_24px_var(--security-shadow)];
  @apply tw:flex-none;
}

.security-form-banner-icon i {
  @apply tw:[color:#ffffff]!;
}

.security-form-banner-icon > .fa-lock {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.security-form-banner-copy strong {
  @apply tw:block;
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.92rem];
}

.security-form-banner-copy p {
  @apply tw:[margin:0.3rem_0_0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.5];
}

.security-field-label {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-bottom:0.45rem];
}

.security-field-label > span {
  @apply tw:[color:#1e293b];
  @apply tw:[font-weight:700];
  @apply tw:[font-size:0.83rem];
  @apply tw:[letter-spacing:0.02em];
}

.security-field-label small {
  @apply tw:[border:1px_solid_var(--security-border)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:var(--security-surface)];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.67rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
  @apply tw:[padding:0.18rem_0.5rem];
}

.field-help {
  @apply tw:[margin:0.45rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.75rem];
  @apply tw:[line-height:1.45];
}

.security-password-card .password-form-side {
  @apply tw:[border:1px_solid_var(--security-border)];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(180deg,_var(--security-surface)_0%,_#ffffff_100%)];
  @apply tw:[padding:1rem];
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.9)];
}

.security-password-card .password-form-actions {
  @apply tw:[margin-top:0.1rem];
  @apply tw:[padding-top:1rem];
  @apply tw:[border-top:1px_solid_#e7eef6];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

.password-action-note {
  @apply tw:[margin:0];
  @apply tw:[max-width:34rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.79rem];
  @apply tw:[line-height:1.5];
}

.security-card .password-input {
  @apply tw:relative;
}

.security-card .password-input input {
  @apply tw:[min-height:48px];
  @apply tw:[padding-right:2.9rem];
  @apply tw:[border:1px_solid_#d7e2ee];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#fcfdff];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease,_background_0.2s_ease];
}

.security-card .password-input input:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:var(--security-accent-mid)];
  @apply tw:[box-shadow:0_0_0_4px_var(--security-ring)];
  @apply tw:[background:#ffffff];
}

.security-card .toggle-password {
  @apply tw:absolute;
  @apply tw:[top:50%];
  @apply tw:[right:0.6rem];
  @apply tw:[transform:translateY(-50%)];
  @apply tw:[width:34px];
  @apply tw:[height:34px];
  @apply tw:[border-radius:10px];
  @apply tw:[border:1px_solid_#d9e3ef];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[color:#475569];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:cursor-pointer;
  @apply tw:[transition:all_0.2s_ease];
}

.security-card .toggle-password:hover {
  @apply tw:[background:var(--security-surface-strong)];
  @apply tw:[border-color:var(--security-accent-mid)];
  @apply tw:[color:var(--security-accent-dark)];
}

.password-submit-btn {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[min-width:180px];
  @apply tw:[min-height:44px];
  @apply tw:[border-radius:12px];
  @apply tw:[border-color:var(--security-accent)]!;
  @apply tw:[background:linear-gradient(135deg,_var(--security-accent-dark)_0%,_var(--security-accent)_100%)]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_12px_24px_var(--security-shadow)];
}

.password-submit-btn:not(:disabled):hover {
  @apply tw:[background:linear-gradient(135deg,_var(--security-accent)_0%,_var(--security-accent-mid)_100%)]!;
  @apply tw:[border-color:var(--security-accent-mid)]!;
}

.password-submit-btn:disabled {
  @apply tw:[box-shadow:none];
}

.password-side-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.password-side-eyebrow {
  @apply tw:inline-flex;
  @apply tw:[color:var(--security-accent)];
  @apply tw:[font-size:0.69rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.12em];
  @apply tw:uppercase;
}

.password-side-header h5 {
  @apply tw:[margin:0.12rem_0_0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.95rem];
}

.password-side-count {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-width:46px];
  @apply tw:[height:34px];
  @apply tw:[padding:0_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:var(--security-surface-strong)];
  @apply tw:[color:var(--security-accent-dark)];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:700];
}

.password-strength-card {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.8rem_0.85rem];
}

.password-strength-card.strength-card-idle {
  @apply tw:[border-color:var(--security-border)];
}

.password-strength-card.strength-card-weak {
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:#fff7f7];
}

.password-strength-card.strength-card-medium {
  @apply tw:[border-color:#fde68a];
  @apply tw:[background:#fffcf2];
}

.password-strength-card.strength-card-strong {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#f6fff8];
}

.password-strength-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-bottom:0.55rem];
}

.strength-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[padding:0.24rem_0.55rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:var(--security-surface-strong)];
  @apply tw:[color:var(--security-accent-dark)];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
}

.strength-percent {
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
}

.security-card .password-strength {
  @apply tw:[margin-top:0];
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.security-card .strength-bar {
  @apply tw:[height:8px];
  @apply tw:[border-radius:999px];
  @apply tw:overflow-hidden;
  @apply tw:[background:#e2e8f0];
  @apply tw:[margin-bottom:0];
}

.security-card .strength-fill {
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[transition:width_0.25s_ease,_background_0.25s_ease];
}

.security-card .strength-fill.strength-none {
  @apply tw:[background:transparent];
}

.security-card .strength-fill.strength-weak {
  @apply tw:[background:linear-gradient(90deg,_#ef4444_0%,_#fca5a5_100%)];
}

.security-card .strength-fill.strength-medium {
  @apply tw:[background:linear-gradient(90deg,_#f59e0b_0%,_#fcd34d_100%)];
}

.security-card .strength-fill.strength-strong {
  @apply tw:[background:linear-gradient(90deg,_#22c55e_0%,_#86efac_100%)];
}

.security-card .strength-text {
  @apply tw:[font-size:0.79rem];
  @apply tw:[color:#64748b];
  @apply tw:[line-height:1.5];
}

.security-card .password-requirements {
  @apply tw:[margin-top:0];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.75rem_0.8rem];
}

.security-card .password-requirements p {
  @apply tw:[margin:0_0_0.6rem];
  @apply tw:[color:#334155];
  @apply tw:[font-weight:600];
  @apply tw:[font-size:0.8rem];
}

.security-card .password-requirements ul {
  @apply tw:[margin:0];
  @apply tw:[padding:0];
  @apply tw:[list-style:none];
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.security-card .requirement {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.55rem];
  @apply tw:[font-size:0.79rem];
  @apply tw:[color:#64748b];
  @apply tw:[line-height:1.35];
}

.security-card .requirement i {
  @apply tw:[margin-top:0.1rem];
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.78rem];
}

.security-card .requirement.met {
  @apply tw:[color:#166534];
}

.security-card .requirement.met i {
  @apply tw:[color:#16a34a];
}

.security-card .password-match {
  @apply tw:[margin-top:0.55rem];
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

.security-card .password-match.valid {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
}

.password-side-tip {
  @apply tw:[margin:0];
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.55rem];
  @apply tw:[padding:0.7rem_0.75rem];
  @apply tw:[border:1px_solid_var(--security-border-strong)];
  @apply tw:[border-radius:12px];
  @apply tw:[background:var(--security-surface-strong)];
  @apply tw:[color:var(--security-accent-dark)];
  @apply tw:[font-size:0.77rem];
  @apply tw:[line-height:1.5];
}

.password-side-tip i {
  @apply tw:[margin-top:0.08rem];
}

.security-card .two-factor-status {
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.8rem];
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
  @apply tw:items-center;
}

.security-card .status-info h5 {
  @apply tw:[margin:0_0_0.2rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.92rem];
}

.security-card .status-info p {
  @apply tw:[margin:0.2rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
}

.security-card .status-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[padding:0.18rem_0.55rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[color:#334155];
  @apply tw:[background:#f8fafc];
}

.security-card .status-badge.enabled {
  @apply tw:[border-color:#86efac];
  @apply tw:[color:#166534];
  @apply tw:[background:#f0fdf4];
}

.security-card .status-badge.disabled {
  @apply tw:[border-color:#fecaca];
  @apply tw:[color:#b91c1c];
  @apply tw:[background:#fef2f2];
}

.security-card .two-factor-setup {
  @apply tw:[margin-top:0.9rem];
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

.security-card .setup-step {
  @apply tw:[border:1px_solid_#e5e7eb];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.75rem];
  @apply tw:[background:#ffffff];
}

.security-card .setup-step h6 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.86rem];
}

.security-card .setup-step p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
}

.security-card .verification-code {
  @apply tw:[margin-top:0.5rem];
  @apply tw:flex;
  @apply tw:[gap:0.45rem];
}

.security-card .verification-code input {
  @apply tw:[flex:1];
  @apply tw:[min-height:40px];
}

.security-card .backup-codes {
  @apply tw:[margin:0.55rem_0];
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.35rem];
}

.security-card .backup-codes code {
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[background:#f8fafc];
  @apply tw:[border-radius:8px];
  @apply tw:[font-size:0.74rem];
  @apply tw:[padding:0.35rem_0.4rem];
  @apply tw:[color:#334155];
}

@media (max-width: 860px) {
  .security-panel-header,
  .security-card-top,
  .security-password-card .password-form-actions {
    @apply tw:flex-col;
    @apply tw:items-stretch;
  }

  .security-panel-pills {
    @apply tw:justify-start;
  }

  .security-password-card .settings-password-form,
  .security-password-card .password-form-main {
    @apply tw:[grid-template-columns:1fr];
  }

  .security-password-card .password-form-actions {
    @apply tw:[min-height:auto];
  }

  .password-submit-btn {
    @apply tw:w-full;
  }

  .security-card .two-factor-status {
    @apply tw:items-start;
    @apply tw:flex-col;
  }

  .security-card .backup-codes {
    @apply tw:[grid-template-columns:1fr];
  }
}

@media (max-width: 640px) {
  .security-panel-pills {
    @apply tw:w-full;
  }

  .security-pill {
    @apply tw:w-full;
    @apply tw:justify-center;
  }

  .security-field-label {
    @apply tw:flex-col;
    @apply tw:items-start;
    @apply tw:[gap:0.35rem];
  }

  .security-password-card,
  .security-password-card .password-form-side {
    @apply tw:[padding:0.85rem];
  }
}

.settings-eyebrow {
  @apply tw:block;
  @apply tw:[margin-bottom:0.2rem];
  @apply tw:[color:#365b0d];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.12em];
  @apply tw:uppercase;
}

.student-settings-workspace {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(210px,_250px)_minmax(0,_1fr)];
  @apply tw:[gap:1rem];
  @apply tw:[align-items:start];
}

.student-settings-nav {
  @apply tw:sticky;
  @apply tw:[top:1rem];
  @apply tw:[padding:0.8rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#fff];
  @apply tw:[box-shadow:0_10px_28px_rgba(15,_23,_42,_0.06)];
}

.settings-nav-heading { @apply tw:[padding:0.35rem_0.55rem_0.8rem]; }
.settings-nav-heading strong, .settings-nav-heading small { @apply tw:block; }
.settings-nav-heading strong { @apply tw:[color:#0f172a]; }
.settings-nav-heading small { @apply tw:[margin-top:0.2rem]; @apply tw:[color:#64748b]; }

.settings-nav-item {
  @apply tw:w-full;
  @apply tw:grid;
  @apply tw:[grid-template-columns:22px_1fr_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[padding:0.75rem];
  @apply tw:[border:0];
  @apply tw:[border-radius:12px];
  @apply tw:[background:transparent];
  @apply tw:[color:#475569];
  @apply tw:[font:inherit];
  @apply tw:text-left;
  @apply tw:cursor-pointer;
}
.settings-nav-item:hover { @apply tw:[background:#f5f8f0]; @apply tw:[color:#1e4307]; }
.settings-nav-item.active { @apply tw:[background:#edf5e2]; @apply tw:[color:#1e4307]; @apply tw:[font-weight:700]; }
.settings-nav-item > .fa-chevron-right { @apply tw:[font-size:0.68rem]; }

.student-settings-content { @apply tw:[min-width:0]; @apply tw:grid; @apply tw:[gap:1rem]; }
.section-heading { @apply tw:flex; @apply tw:items-start; @apply tw:[gap:0.8rem]; }
.section-icon, .session-icon {
  @apply tw:[width:42px]; @apply tw:[height:42px]; @apply tw:flex-none; @apply tw:inline-flex; @apply tw:items-center; @apply tw:justify-center;
  @apply tw:[border-radius:12px]; @apply tw:[color:#fff]; @apply tw:[background:linear-gradient(135deg,_#1e4307,_#5f7418)];
}
.section-icon i,
.session-icon i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
  @apply tw:opacity-100!;
}
.preference-list { @apply tw:[margin-top:1rem]; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:14px]; @apply tw:overflow-hidden; }
.preference-row { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:1rem]; @apply tw:[padding:0.9rem_1rem]; @apply tw:[background:#fff]; }
.preference-row + .preference-row { @apply tw:[border-top:1px_solid_#e2e8f0]; }
.preference-row strong, .preference-row small { @apply tw:block; }
.preference-row strong { @apply tw:[color:#1e293b]; @apply tw:[font-size:0.9rem]; }
.preference-row small { @apply tw:[margin-top:0.2rem]; @apply tw:[color:#64748b]; @apply tw:[line-height:1.4]; }
.settings-toggle-input { @apply tw:[width:20px]; @apply tw:[height:20px]; @apply tw:flex-none; @apply tw:[accent-color:#365b0d]; }
.inline-setting { @apply tw:[margin-top:1rem]; @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:1rem]; @apply tw:[padding:0.9rem_1rem]; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:14px]; @apply tw:[background:#fff]; }
.inline-setting label { @apply tw:[color:#1e293b]; @apply tw:[font-weight:700]; }
.inline-setting select { @apply tw:[min-width:170px]; @apply tw:[padding:0.65rem]; @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:10px]; @apply tw:[background:#fff]; @apply tw:[color:#1e293b]; }
.panel-actions { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:1rem]; @apply tw:[margin-top:1rem]; }
.panel-actions small { @apply tw:[color:#64748b]; }
.panel-actions .btn, .sessions-header .btn, .session-item .btn, .privacy-card .btn { @apply tw:inline-flex; @apply tw:items-center; @apply tw:[gap:0.45rem]; }

.theme-options { @apply tw:grid; @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))]; @apply tw:[gap:0.75rem]; @apply tw:[margin-top:1rem]; }
.theme-option { @apply tw:flex; @apply tw:items-center; @apply tw:[gap:0.7rem]; @apply tw:[padding:0.9rem]; @apply tw:[border:1px_solid_#dbe3ec]; @apply tw:[border-radius:14px]; @apply tw:[background:#fff]; @apply tw:[color:#475569]; @apply tw:text-left; @apply tw:cursor-pointer; }
.theme-option > i { @apply tw:[font-size:1.15rem]; }
.theme-option strong, .theme-option small { @apply tw:block; }
.theme-option small { @apply tw:[margin-top:0.15rem]; @apply tw:[color:#64748b]; }
.theme-option.active { @apply tw:[border-color:#5f7418]; @apply tw:[background:#f2f7e9]; @apply tw:[color:#1e4307]; @apply tw:[box-shadow:0_0_0_3px_rgba(95,_116,_24,_0.12)]; }
.compact-list { @apply tw:[margin-top:1rem]; }

.sessions-header { @apply tw:flex; @apply tw:justify-between; @apply tw:items-start; @apply tw:[gap:1rem]; }
.empty-state { @apply tw:[margin-top:1rem]; @apply tw:[padding:1rem]; @apply tw:[border:1px_dashed_#cbd5e1]; @apply tw:[border-radius:12px]; @apply tw:[color:#64748b]; @apply tw:text-center; }
.error-state { @apply tw:[border-color:#fecaca]; @apply tw:[background:#fff7f7]; @apply tw:[color:#b91c1c]; }
.session-list { @apply tw:[margin-top:1rem]; @apply tw:grid; @apply tw:[gap:0.65rem]; }
.session-item { @apply tw:grid; @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto]; @apply tw:items-center; @apply tw:[gap:0.8rem]; @apply tw:[padding:0.8rem]; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:14px]; @apply tw:[background:#fff]; }
.session-item.current { @apply tw:[border-color:#bfd399]; @apply tw:[background:#f8fbf3]; }
.session-item strong, .session-item small { @apply tw:block; }
.session-item small { @apply tw:[margin-top:0.3rem]; @apply tw:[color:#64748b]; }
.current-badge { @apply tw:inline-flex; @apply tw:[margin-left:0.5rem]; @apply tw:[padding:0.15rem_0.45rem]; @apply tw:[border-radius:999px]; @apply tw:[background:#dcfce7]; @apply tw:[color:#166534]; @apply tw:[font-size:0.68rem]; @apply tw:[font-weight:700]; }

.privacy-grid { @apply tw:grid; @apply tw:[gap:0.75rem]; @apply tw:[margin-top:1rem]; }
.privacy-card { @apply tw:grid; @apply tw:[grid-template-columns:38px_1fr]; @apply tw:[gap:0.8rem]; @apply tw:[padding:1rem]; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:14px]; @apply tw:[background:#fff]; }
.privacy-card > i { @apply tw:[width:38px]; @apply tw:[height:38px]; @apply tw:inline-flex; @apply tw:items-center; @apply tw:justify-center; @apply tw:[border-radius:11px]; @apply tw:[background:#edf5e2]; @apply tw:[color:#365b0d]; }
.privacy-card h4 { @apply tw:[margin:0]; @apply tw:[color:#1e293b]; }
.privacy-card p { @apply tw:[margin:0.35rem_0_0]; @apply tw:[color:#64748b]; @apply tw:[line-height:1.55]; }
.privacy-card .btn { @apply tw:[margin-top:0.75rem]; }
.privacy-card-warning { @apply tw:[border-color:#fde68a]; @apply tw:[background:#fffbeb]; }
.account-request-form { @apply tw:grid; @apply tw:[gap:0.85rem]; @apply tw:[padding:1rem]; @apply tw:[border:1px_solid_#dbe3ec]; @apply tw:[border-radius:14px]; @apply tw:[background:#fff]; }
.account-request-form > div { @apply tw:grid; @apply tw:[gap:0.4rem]; }
.account-request-form label { @apply tw:[color:#1e293b]; @apply tw:[font-weight:700]; }
.account-request-form select, .account-request-form textarea { @apply tw:w-full; @apply tw:[padding:0.7rem_0.8rem]; @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:10px]; @apply tw:[background:#fff]; @apply tw:[color:#1e293b]; @apply tw:[font:inherit]; }
.account-request-form small { @apply tw:[color:#64748b]; }
.account-request-form .btn { @apply tw:[justify-self:start]; @apply tw:inline-flex; @apply tw:items-center; @apply tw:[gap:0.45rem]; }
.account-request-status { @apply tw:[border-color:#bfd399]; @apply tw:[background:#f8fbf3]; }

.student-text-large { @apply tw:[font-size:1.08rem]; }
.student-text-larger { @apply tw:[font-size:1.16rem]; }
.student-high-contrast .settings-panel, .student-high-contrast .student-settings-nav, .student-high-contrast .preference-row, .student-high-contrast .privacy-card { @apply tw:[border-color:#64748b]; }
.student-reduce-motion *, .student-reduce-motion *::before, .student-reduce-motion *::after { @apply tw:scroll-auto!; @apply tw:[transition-duration:0.01ms]!; @apply tw:[animation-duration:0.01ms]!; }
.student-theme-dark { @apply tw:[color:#e2e8f0]; }
.student-theme-dark .settings-hero, .student-theme-dark .settings-panel, .student-theme-dark .student-settings-nav { @apply tw:[background:#152019]!; @apply tw:[border-color:#405348]; }
.student-theme-dark .preference-row, .student-theme-dark .inline-setting, .student-theme-dark .theme-option, .student-theme-dark .session-item, .student-theme-dark .privacy-card, .student-theme-dark .account-request-form, .student-theme-dark .security-card, .student-theme-dark .password-form-side, .student-theme-dark .password-strength-card, .student-theme-dark .password-requirements { @apply tw:[background:#1e2b23]!; @apply tw:[border-color:#405348]!; }
.student-theme-dark h2, .student-theme-dark h3, .student-theme-dark h4, .student-theme-dark h5, .student-theme-dark strong, .student-theme-dark label, .student-theme-dark .security-field-label > span { @apply tw:[color:#f8fafc]!; }
.student-theme-dark p, .student-theme-dark small, .student-theme-dark .field-help, .student-theme-dark .password-action-note, .student-theme-dark .strength-text { @apply tw:[color:#b9c5bd]!; }
.student-theme-dark input, .student-theme-dark select { @apply tw:[background:#111b15]!; @apply tw:[border-color:#506157]!; @apply tw:[color:#f8fafc]!; }
.student-theme-dark .student-settings-nav .settings-nav-item.active,
.student-theme-dark .student-settings-nav .settings-nav-item.active > span,
.student-theme-dark .student-settings-nav .settings-nav-item.active > i,
.student-theme-dark .student-settings-nav .settings-nav-item.active > i::before {
  @apply tw:[color:#1e4307]!;
  @apply tw:[-webkit-text-fill-color:#1e4307]!;
  @apply tw:opacity-100!;
}
.student-theme-dark .student-settings-nav .settings-nav-item.active > svg,
.student-theme-dark .student-settings-nav .settings-nav-item.active > svg path {
  @apply tw:[color:#1e4307]!;
  @apply tw:[fill:#1e4307]!;
  @apply tw:opacity-100!;
}
.student-theme-dark .security-card .password-match,
.student-theme-dark .security-card .password-match :is(span, i, i::before) {
  @apply tw:[color:#b91c1c]!;
  @apply tw:[-webkit-text-fill-color:#b91c1c]!;
  @apply tw:opacity-100!;
}
.student-theme-dark .security-card .password-match.valid,
.student-theme-dark .security-card .password-match.valid :is(span, i, i::before) {
  @apply tw:[color:#166534]!;
  @apply tw:[-webkit-text-fill-color:#166534]!;
}
.student-theme-dark .security-panel-pills .security-pill > i,
.student-theme-dark .security-card .password-side-tip > i {
  @apply tw:[width:1.35rem];
  @apply tw:[height:1.35rem];
  @apply tw:[flex:0_0_1.35rem];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[border-radius:50%];
  @apply tw:[background:#365b0d]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
  @apply tw:opacity-100!;
}
.student-theme-dark .security-panel-pills .security-pill > i::before,
.student-theme-dark .security-card .password-side-tip > i::before {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
  @apply tw:opacity-100!;
}
.student-theme-dark .security-card .password-input .toggle-password {
  @apply tw:[background:#365b0d]!;
  @apply tw:[border-color:#5f7418]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:opacity-100!;
}
.student-theme-dark .security-card .password-input .toggle-password > i,
.student-theme-dark .security-card .password-input .toggle-password > i::before {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
  @apply tw:opacity-100!;
}

@media (prefers-color-scheme: dark) {
  .student-dashboard-page:not(.student-theme-light):not(.student-theme-dark) .settings-panel,
  .student-dashboard-page:not(.student-theme-light):not(.student-theme-dark) .student-settings-nav { @apply tw:[border-color:#405348]; }
}

@media (max-width: 900px) {
  .student-settings-workspace { @apply tw:[grid-template-columns:1fr]; }
  .student-settings-nav { @apply tw:static; @apply tw:grid; @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))]; @apply tw:[gap:0.35rem]; }
  .settings-nav-heading { @apply tw:[grid-column:1_/_-1]; }
  .settings-nav-item { @apply tw:[grid-template-columns:auto_1fr]; @apply tw:justify-items-center; @apply tw:text-center; }
  .settings-nav-item > .fa-chevron-right { @apply tw:hidden; }
}

@media (max-width: 640px) {
  .student-settings-nav { @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))]; }
  .theme-options { @apply tw:[grid-template-columns:1fr]; }
  .panel-actions, .sessions-header, .inline-setting { @apply tw:items-stretch; @apply tw:flex-col; }
  .panel-actions .btn, .inline-setting select { @apply tw:w-full; }
  .session-item { @apply tw:[grid-template-columns:auto_minmax(0,_1fr)]; }
  .session-item .btn { @apply tw:[grid-column:1_/_-1]; @apply tw:justify-center; }
}

</style>
