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
            <button v-for="option in themeOptions" :key="option.value" type="button" class="theme-option" :class="{ active: appearance.theme === option.value }" role="radio" :aria-checked="appearance.theme === option.value" @click="appearance.theme = option.value; applyAppearance()">
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

.settings-eyebrow {
  display: block;
  margin-bottom: 0.2rem;
  color: #365b0d;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.student-settings-workspace {
  display: grid;
  grid-template-columns: minmax(210px, 250px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.student-settings-nav {
  position: sticky;
  top: 1rem;
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.settings-nav-heading { padding: 0.35rem 0.55rem 0.8rem; }
.settings-nav-heading strong, .settings-nav-heading small { display: block; }
.settings-nav-heading strong { color: #0f172a; }
.settings-nav-heading small { margin-top: 0.2rem; color: #64748b; }

.settings-nav-item {
  width: 100%;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 0.55rem;
  padding: 0.75rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #475569;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.settings-nav-item:hover { background: #f5f8f0; color: #1e4307; }
.settings-nav-item.active { background: #edf5e2; color: #1e4307; font-weight: 700; }
.settings-nav-item > .fa-chevron-right { font-size: 0.68rem; }

.student-settings-content { min-width: 0; display: grid; gap: 1rem; }
.section-heading { display: flex; align-items: flex-start; gap: 0.8rem; }
.section-icon, .session-icon {
  width: 42px; height: 42px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 12px; color: #fff; background: linear-gradient(135deg, #1e4307, #5f7418);
}
.preference-list { margin-top: 1rem; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.preference-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.9rem 1rem; background: #fff; }
.preference-row + .preference-row { border-top: 1px solid #e2e8f0; }
.preference-row strong, .preference-row small { display: block; }
.preference-row strong { color: #1e293b; font-size: 0.9rem; }
.preference-row small { margin-top: 0.2rem; color: #64748b; line-height: 1.4; }
.settings-toggle-input { width: 20px; height: 20px; flex: 0 0 auto; accent-color: #365b0d; }
.inline-setting { margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.9rem 1rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; }
.inline-setting label { color: #1e293b; font-weight: 700; }
.inline-setting select { min-width: 170px; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; color: #1e293b; }
.panel-actions { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; }
.panel-actions small { color: #64748b; }
.panel-actions .btn, .sessions-header .btn, .session-item .btn, .privacy-card .btn { display: inline-flex; align-items: center; gap: 0.45rem; }

.theme-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; margin-top: 1rem; }
.theme-option { display: flex; align-items: center; gap: 0.7rem; padding: 0.9rem; border: 1px solid #dbe3ec; border-radius: 14px; background: #fff; color: #475569; text-align: left; cursor: pointer; }
.theme-option > i { font-size: 1.15rem; }
.theme-option strong, .theme-option small { display: block; }
.theme-option small { margin-top: 0.15rem; color: #64748b; }
.theme-option.active { border-color: #5f7418; background: #f2f7e9; color: #1e4307; box-shadow: 0 0 0 3px rgba(95, 116, 24, 0.12); }
.compact-list { margin-top: 1rem; }

.sessions-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.empty-state { margin-top: 1rem; padding: 1rem; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b; text-align: center; }
.error-state { border-color: #fecaca; background: #fff7f7; color: #b91c1c; }
.session-list { margin-top: 1rem; display: grid; gap: 0.65rem; }
.session-item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 0.8rem; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; }
.session-item.current { border-color: #bfd399; background: #f8fbf3; }
.session-item strong, .session-item small { display: block; }
.session-item small { margin-top: 0.3rem; color: #64748b; }
.current-badge { display: inline-flex; margin-left: 0.5rem; padding: 0.15rem 0.45rem; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 0.68rem; font-weight: 700; }

.privacy-grid { display: grid; gap: 0.75rem; margin-top: 1rem; }
.privacy-card { display: grid; grid-template-columns: 38px 1fr; gap: 0.8rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; }
.privacy-card > i { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 11px; background: #edf5e2; color: #365b0d; }
.privacy-card h4 { margin: 0; color: #1e293b; }
.privacy-card p { margin: 0.35rem 0 0; color: #64748b; line-height: 1.55; }
.privacy-card .btn { margin-top: 0.75rem; }
.privacy-card-warning { border-color: #fde68a; background: #fffbeb; }
.account-request-form { display: grid; gap: 0.85rem; padding: 1rem; border: 1px solid #dbe3ec; border-radius: 14px; background: #fff; }
.account-request-form > div { display: grid; gap: 0.4rem; }
.account-request-form label { color: #1e293b; font-weight: 700; }
.account-request-form select, .account-request-form textarea { width: 100%; padding: 0.7rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; color: #1e293b; font: inherit; }
.account-request-form small { color: #64748b; }
.account-request-form .btn { justify-self: start; display: inline-flex; align-items: center; gap: 0.45rem; }
.account-request-status { border-color: #bfd399; background: #f8fbf3; }

.student-text-large { font-size: 1.08rem; }
.student-text-larger { font-size: 1.16rem; }
.student-high-contrast .settings-panel, .student-high-contrast .student-settings-nav, .student-high-contrast .preference-row, .student-high-contrast .privacy-card { border-color: #64748b; }
.student-reduce-motion *, .student-reduce-motion *::before, .student-reduce-motion *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
.student-theme-dark { color: #e2e8f0; }
.student-theme-dark .settings-hero, .student-theme-dark .settings-panel, .student-theme-dark .student-settings-nav { background: #152019 !important; border-color: #405348; }
.student-theme-dark .preference-row, .student-theme-dark .inline-setting, .student-theme-dark .theme-option, .student-theme-dark .session-item, .student-theme-dark .privacy-card, .student-theme-dark .account-request-form, .student-theme-dark .security-card, .student-theme-dark .password-form-side, .student-theme-dark .password-strength-card, .student-theme-dark .password-requirements { background: #1e2b23 !important; border-color: #405348 !important; }
.student-theme-dark h2, .student-theme-dark h3, .student-theme-dark h4, .student-theme-dark h5, .student-theme-dark strong, .student-theme-dark label, .student-theme-dark .security-field-label > span { color: #f8fafc !important; }
.student-theme-dark p, .student-theme-dark small, .student-theme-dark .field-help, .student-theme-dark .password-action-note, .student-theme-dark .strength-text { color: #b9c5bd !important; }
.student-theme-dark input, .student-theme-dark select { background: #111b15 !important; border-color: #506157 !important; color: #f8fafc !important; }

@media (prefers-color-scheme: dark) {
  .student-dashboard-page:not(.student-theme-light):not(.student-theme-dark) .settings-panel,
  .student-dashboard-page:not(.student-theme-light):not(.student-theme-dark) .student-settings-nav { border-color: #405348; }
}

@media (max-width: 900px) {
  .student-settings-workspace { grid-template-columns: 1fr; }
  .student-settings-nav { position: static; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.35rem; }
  .settings-nav-heading { grid-column: 1 / -1; }
  .settings-nav-item { grid-template-columns: auto 1fr; justify-items: center; text-align: center; }
  .settings-nav-item > .fa-chevron-right { display: none; }
}

@media (max-width: 640px) {
  .student-settings-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .theme-options { grid-template-columns: 1fr; }
  .panel-actions, .sessions-header, .inline-setting { align-items: stretch; flex-direction: column; }
  .panel-actions .btn, .inline-setting select { width: 100%; }
  .session-item { grid-template-columns: auto minmax(0, 1fr); }
  .session-item .btn { grid-column: 1 / -1; justify-content: center; }
}
</style>
