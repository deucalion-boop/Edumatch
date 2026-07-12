<template>
  <div class="student-dashboard-page">

      <!-- Profile Content -->
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
        <!-- Left Column: Profile Info -->
        <div class="profile-sidebar">
          <div class="profile-card" data-tour="student-profile-card">
            <div class="profile-header">
              <div class="profile-avatar">
                <div class="profile-avatar-placeholder" id="profile-image" aria-hidden="true">
                  <img v-if="user.profile?.avatar" :src="user.profile.avatar" alt="Profile avatar">
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
                <div class="profile-status">
                  <span class="status-indicator active"></span>
                  <span>{{ user.statusLabel }}</span>
                </div>
                <div class="profile-badges">
                  <span v-for="badge in userBadges" :key="badge" class="badge">{{ badge }}</span>
                </div>
              </div>
            </div>
            
            <div class="profile-actions" data-tour="profile-edit-actions">
              <button class="btn btn-primary btn-block" @click="enableEditMode">
                <i class="fas fa-edit student-profile-edit-icon"></i>
                Edit Profile
              </button>
              <button class="btn btn-outline btn-block student-share-profile-btn" @click="shareProfile">
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
                <i class="fas fa-user-check icon-sem-profile"></i>
              </div>
              <div class="detail-content">
                <div class="detail-label">Role</div>
                <div class="detail-value">{{ user.role || 'student' }}</div>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">
                <i class="fas fa-graduation-cap icon-sem-analytics"></i>
              </div>
              <div class="detail-content">
                <div class="detail-label">Grade Level</div>
                <div class="detail-value">{{ user.gradeLevel || 'Not set' }}</div>
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
        
        <!-- Right Column: Main Content -->
        <div class="profile-main">
          <div class="profile-tab-content">
            <div class="tab-pane active">
              <div class="tab-header">
                <h3>Personal Information</h3>
                <p>Manage your personal details and contact information</p>
              </div>
              
              <form class="profile-form" @submit.prevent="savePersonalInfo">
                <div class="profile-form-section">
                  <h4 class="form-section-title">Basic Information</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="first-name">First Name</label>
                      <input 
                        type="text" 
                        id="first-name" 
                        v-model="formData.firstName"
                        :readonly="!isEditing"
                      >
                    </div>
                    <div class="form-group">
                      <label for="last-name">Last Name</label>
                      <input 
                        type="text" 
                        id="last-name" 
                        v-model="formData.lastName"
                        :readonly="!isEditing"
                      >
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      v-model="formData.email"
                      :readonly="!isEditing"
                    >
                  </div>

                  <div class="form-group">
                    <label for="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      :value="user.username"
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
                        type="tel" 
                        id="phone" 
                        v-model="formData.phone"
                        :readonly="!isEditing"
                      >
                    </div>
                  </div>
                </div>

                <div v-if="isEditing" class="form-actions">
                  <button type="button" class="btn btn-secondary" @click="cancelEdit">
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'

export default {
  name: 'StudentProfile',
  data() {
    return {
      authStore: null,
      user: {
        displayName: '',
        username: '',
        email: '',
        role: 'student',
        status: 'active',
        statusLabel: 'Active',
        contactNumber: '',
        gradeLevel: '',
        strand: '',
        profileImage: '',
        createdAt: null,
        profile: {
          fullName: '',
          phone: '',
          address: '',
          bio: '',
          school: '',
          expectedGraduation: '',
          academicInterests: [],
          learningGoals: '',
          location: '',
          avatar: null
        }
      },
      notificationCount: 0,
      isSidebarOpen: false,
      isEditing: false,
      formData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        gradeLevel: ''
      },
      originalFormData: null,
      stats: {
        subjects: 0,
        completed: 0,
        badges: 0
      },
      userBadges: [],
      isLoading: false,
      loadError: '',
      selectedAvatarFile: null,
      toast: {
        show: false,
        type: 'success',
        message: ''
      }
    }
  },
  computed: {
    fullName() {
      return `${this.formData.firstName} ${this.formData.lastName}`.trim()
    },
    isStudentRole() {
      return String(this.user.role || '').toLowerCase() === 'student'
    }
  },
  methods: {
    resolveProfileImageUrl(value) {
      const raw = String(value || '').trim()
      if (!raw) return ''
      if (/^blob:/i.test(raw)) return raw
      if (/^https?:\/\//i.test(raw)) return raw

      const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`
      return normalizedPath
    },
    resolveApiBaseUrl() {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      if (configured.endsWith('/api')) return configured
      return `${configured}/api`
    },
    getAuthConfig(headers = {}) {
      const token = String(this.authStore?.token || '').trim()
      return {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers
        }
      }
    },
    normalizeRole(role) {
      const normalized = String(role || 'student').trim().toLowerCase()
      return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Student'
    },
    parseName(fullName) {
      const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean)
      return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
      }
    },
    applyUserProfile(apiUser = {}) {
      const fullName = apiUser.name || this.authStore?.user?.name || this.authStore?.user?.displayName || 'Student'
      const role = this.normalizeRole(apiUser.role)
      const profileImage = this.resolveProfileImageUrl(apiUser.profileImage || '')
      const statusValue = String(apiUser.status || 'active').toLowerCase()
      const statusLabel = statusValue ? statusValue.charAt(0).toUpperCase() + statusValue.slice(1) : 'Active'

      this.user = {
        ...this.user,
        displayName: fullName,
        username: apiUser.username || this.authStore?.user?.username || '',
        email: apiUser.email || '',
        role,
        status: statusValue,
        statusLabel,
        contactNumber: apiUser.contactNumber || '',
        strand: apiUser.strand || '',
        profileImage,
        gradeLevel: apiUser.gradeLevel || '',
        createdAt: apiUser.createdAt || null,
        profile: {
          ...this.user.profile,
          fullName,
          phone: apiUser.contactNumber || '',
          avatar: profileImage || null
        }
      }
    },
    getUserGradeInfo() {
      if (this.user.role?.toLowerCase() === 'student') {
        return this.user.gradeLevel
      }
      return this.user.role || 'Student'
    },
    closeSidebar() {
      this.isSidebarOpen = false
    },
    toggleMobileMenu() {
      this.isSidebarOpen = !this.isSidebarOpen
    },
    showNotifications() {
      // Handle notification click
      console.log('Show notifications')
    },
    logout() {
      // Handle logout
      this.$emit('logout')
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    },
    triggerAvatarUpload() {
      this.$refs.avatarUpload.click()
    },
    async handleAvatarUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
      const isValidMimeType = allowedMimeTypes.has(String(file.type || '').toLowerCase())
      if (!isValidMimeType) {
        this.showToast('error', 'Only JPG, JPEG, PNG, or WEBP images are allowed')
        event.target.value = ''
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        this.showToast('error', 'Image size should be less than 5MB')
        event.target.value = ''
        return
      }

      try {
        if (!this.isEditing) {
          this.isEditing = true
          this.saveOriginalData()
        }
        this.selectedAvatarFile = file
        this.user.profile.avatar = URL.createObjectURL(file)
        this.showToast('success', 'Profile picture ready. Click Save Changes to apply.')
      } catch (error) {
        console.error('Error uploading avatar:', error)
        this.showToast('error', 'Failed to upload profile picture')
      }
    },
    enableEditMode() {
      this.isEditing = true
      this.saveOriginalData()
    },
    saveOriginalData() {
      this.originalFormData = JSON.parse(JSON.stringify(this.formData))
    },
    cancelEdit() {
      this.isEditing = false
      if (this.originalFormData) {
        Object.assign(this.formData, this.originalFormData)
      }
      this.selectedAvatarFile = null
      this.user.profile.avatar = this.user.profileImage || null
      this.showToast('info', 'Edit cancelled')
    },
    async savePersonalInfo() {
      try {
        const token = String(this.authStore?.token || '').trim()
        if (!token) {
          this.showToast('error', 'Your session expired. Please login again.')
          return
        }

        const fullName = `${this.formData.firstName} ${this.formData.lastName}`.trim()
        const email = String(this.formData.email || '').trim()
        const contactNumber = String(this.formData.phone || '').trim().replace(/\s+/g, ' ')
        const gradeLevel = String(this.formData.gradeLevel || this.user.gradeLevel || '').trim()

        if (!fullName) {
          this.showToast('error', 'Full name is required')
          return
        }
        if (!email) {
          this.showToast('error', 'Email is required')
          return
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          this.showToast('error', 'Please enter a valid email address')
          return
        }
        const contactRegex = /^\+?[0-9()\-. ]{7,30}$/
        if (contactNumber && !contactRegex.test(contactNumber)) {
          this.showToast('error', 'Please enter a valid contact number')
          return
        }
        const allowedGradeLevels = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
        if (this.isStudentRole && gradeLevel && !allowedGradeLevels.includes(gradeLevel)) {
          this.showToast('error', 'Please select a valid grade level')
          return
        }
        const payload = new FormData()
        payload.append('name', fullName)
        payload.append('email', email)
        payload.append('contactNumber', contactNumber)
        if (gradeLevel) {
          payload.append('gradeLevel', gradeLevel)
        }
        if (this.selectedAvatarFile) {
          payload.append('profileImage', this.selectedAvatarFile)
        }

        console.log('[TEMP][StudentProfile][savePersonalInfo] request summary:', {
          hasToken: Boolean(token),
          name: fullName,
          email,
          contactNumber,
          gradeLevel,
          hasProfileImage: Boolean(this.selectedAvatarFile),
          profileImageName: this.selectedAvatarFile?.name || '',
          profileImageSize: this.selectedAvatarFile?.size || 0,
        })

        const response = await axios.put(
          `${this.resolveApiBaseUrl()}/student/profile`,
          payload,
          this.getAuthConfig()
        )
        console.log('[TEMP][StudentProfile][savePersonalInfo] response:', response.data)
        const updatedUser = response.data?.user
        if (!updatedUser) {
          throw new Error('Profile update response was invalid')
        }

        this.applyUserProfile(updatedUser)
        this.initializeFormData()
        this.authStore.setUser({
          ...updatedUser,
          displayName: updatedUser.name || fullName,
          role: 'student',
          gradeLevel: updatedUser.gradeLevel || gradeLevel
        })

        this.selectedAvatarFile = null
        this.isEditing = false
        this.showToast('success', 'Personal information updated successfully')
      } catch (error) {
        console.error('Error updating personal info:', error)
        this.showToast('error', error.response?.data?.message || 'Failed to update personal information')
      }
    },
    shareProfile() {
      // Implement share functionality
      if (navigator.share) {
        navigator.share({
          title: `${this.user.displayName}'s Profile`,
          text: `Check out ${this.user.displayName}'s profile on EduMatch!`,
          url: window.location.href
        }).catch(console.error)
      } else {
        // Fallback
        navigator.clipboard.writeText(window.location.href)
        this.showToast('success', 'Profile link copied to clipboard!')
      }
    },
    showToast(type, message) {
      this.toast = {
        show: true,
        type,
        message
      }
      // Auto hide after 3 seconds
      setTimeout(() => {
        this.toast.show = false
      }, 3000)
    },
    async fetchUserData() {
      this.isLoading = true
      this.loadError = ''
      try {
        const response = await axios.get(
          `${this.resolveApiBaseUrl()}/student/profile`,
          this.getAuthConfig()
        )
        const apiUser = response.data?.user
        if (!apiUser) {
          throw new Error('Profile response is missing user data')
        }

        this.applyUserProfile(apiUser)
        this.initializeFormData()
        this.authStore.setUser({
          ...apiUser,
          displayName: apiUser.name || this.user.displayName,
          role: 'student',
          gradeLevel: apiUser.gradeLevel || ''
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
        this.loadError = error.response?.data?.message || 'Failed to load profile data'
        this.showToast('error', this.loadError)
      } finally {
        this.isLoading = false
      }
    },
    initializeFormData() {
      const nameParts = this.parseName(this.user.profile?.fullName || this.user.displayName || '')
      
      this.formData = {
        firstName: nameParts.firstName || '',
        lastName: nameParts.lastName || '',
        email: this.user.email || '',
        phone: this.user.contactNumber || this.user.profile?.phone || '',
        address: this.user.profile?.address || '',
        gradeLevel: this.user.gradeLevel || ''
      }
      
      this.saveOriginalData()
    },
    handleKeydown(event) {
      if (event.key === 'Escape' && this.isSidebarOpen) {
        this.closeSidebar()
      }
    }
  },
  created() {
    this.authStore = useAuthStore()
  },
  mounted() {
    this.fetchUserData()
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown)
  }
}
</script>





