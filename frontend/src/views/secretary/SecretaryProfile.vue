<template>
  <div class="teacher-dashboard secretary-dashboard-page">
    <main class="teacher-main secretary-main dashboard-container">
      <header class="top-header secretary-top-header dashboard-header">
        <div class="header-content secretary-header-content dashboard-header-content">
          <div class="header-left secretary-header-copy dashboard-header-copy">
            <div>
              <h1>Secretary Profile</h1>
              <p class="header-subtitle">Review your account information and keep your secretary details up to date.</p>
            </div>
          </div>

          <div class="secretary-header-tools">
            <button
              type="button"
              class="header-tour-btn account-menu-trigger"
              aria-label="Home dashboard"
              title="Home Dashboard"
              @click="router.push('/secretary/dashboard')"
            >
              <i class="fas fa-home"></i>
            </button>
            <div ref="accountMenuRef" class="account-menu secretary-account-menu">
              <button
                type="button"
                class="header-tour-btn account-menu-trigger"
                aria-label="Settings menu"
                title="Settings"
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
      </header>

    <section v-if="banner.message" class="secretary-banner" :class="banner.type">
      <i class="fas" :class="banner.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"></i>
      <span>{{ banner.message }}</span>
    </section>

    <section class="secretary-profile-grid">
      <article class="section-card dashboard-panel secretary-profile-card secretary-surface-card">
        <div class="secretary-card-head">
          <div>
            <h3>Profile Summary</h3>
            <p>Core account details used across your secretary dashboard.</p>
          </div>
        </div>

        <div class="secretary-detail-list">
          <div class="secretary-detail-item">
            <span>Full Name</span>
            <strong>{{ displayName }}</strong>
          </div>
          <div class="secretary-detail-item">
            <span>Email Address</span>
            <strong>{{ profileForm.email || 'Not provided' }}</strong>
          </div>
          <div class="secretary-detail-item">
            <span>Username</span>
            <strong>{{ authStore.user?.username || 'Not provided' }}</strong>
          </div>
          <div class="secretary-detail-item">
            <span>Contact Number</span>
            <strong>{{ profileForm.contactNumber || 'Not provided' }}</strong>
          </div>
          <div class="secretary-detail-item">
            <span>Role</span>
            <strong>Secretary</strong>
          </div>
          <div class="secretary-detail-item">
            <span>Department Scope</span>
            <strong>All academic departments</strong>
          </div>
        </div>
      </article>

      <article class="section-card dashboard-panel secretary-profile-card secretary-surface-card">
        <div class="secretary-card-head">
          <div>
            <h3>Edit Basic Information</h3>
            <p>Update your local account details for dashboard display and quick reference.</p>
          </div>
        </div>

        <form class="secretary-form" @submit.prevent="saveProfile">
          <div class="secretary-form-grid">
            <label class="secretary-field">
              <span>Display Name</span>
              <input v-model.trim="profileForm.name" type="text" placeholder="Enter display name">
              <small v-if="errors.name" class="secretary-field-error">{{ errors.name }}</small>
            </label>

            <label class="secretary-field">
              <span>Email Address</span>
              <input v-model.trim="profileForm.email" type="email" placeholder="Enter email address">
              <small v-if="errors.email" class="secretary-field-error">{{ errors.email }}</small>
            </label>

            <label class="secretary-field secretary-field-wide">
              <span>Contact Number</span>
              <input v-model.trim="profileForm.contactNumber" type="text" placeholder="Enter contact number">
            </label>
          </div>

          <div class="secretary-form-actions">
            <button type="button" class="btn btn-outline" @click="resetProfile">Reset</button>
            <button type="submit" class="btn btn-primary" style="color: #ffffff !important;">Save Profile</button>
          </div>
        </form>
      </article>
    </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)

const banner = reactive({
  type: 'success',
  message: '',
})
const profileForm = reactive({
  name: '',
  email: '',
  contactNumber: '',
})
const errors = reactive({
  name: '',
  email: '',
})

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'Secretary').trim())
const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }

const goToProfile = () => {
  isAccountMenuOpen.value = false
  if (route.path !== '/secretary/profile') router.push('/secretary/profile')
}

const goToSettings = () => {
  isAccountMenuOpen.value = false
  if (route.path !== '/secretary/settings') router.push('/secretary/settings')
}

const handleLogout = () => {
  isAccountMenuOpen.value = false
  authStore.logout()
  router.push('/auth/login')
}

const handleAccountMenuClickOutside = (event) => {
  const target = event?.target
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  isAccountMenuOpen.value = false
}

const syncProfileForm = () => {
  profileForm.name = String(authStore.user?.name || authStore.user?.displayName || '').trim()
  profileForm.email = String(authStore.user?.email || '').trim()
  profileForm.contactNumber = String(authStore.user?.contactNumber || '').trim()
}

const clearBanner = () => {
  banner.message = ''
}

const validateProfile = () => {
  errors.name = ''
  errors.email = ''

  if (!String(profileForm.name || '').trim()) {
    errors.name = 'Display name is required.'
  }

  const emailValue = String(profileForm.email || '').trim()
  if (!emailValue) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    errors.email = 'Enter a valid email address.'
  }

  return !errors.name && !errors.email
}

const saveProfile = () => {
  clearBanner()
  if (!validateProfile()) {
    banner.type = 'error'
    banner.message = 'Please review the highlighted fields before saving.'
    return
  }

  authStore.setUser({
    name: String(profileForm.name || '').trim(),
    displayName: String(profileForm.name || '').trim(),
    email: String(profileForm.email || '').trim(),
    contactNumber: String(profileForm.contactNumber || '').trim(),
  })

  banner.type = 'success'
  banner.message = 'Secretary profile updated successfully.'
}

const resetProfile = () => {
  clearBanner()
  syncProfileForm()
  errors.name = ''
  errors.email = ''
}

syncProfileForm()

onMounted(() => {
  document.addEventListener('click', handleAccountMenuClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountMenuClickOutside)
})
</script>

<style scoped>
.secretary-main,
.secretary-main.dashboard-container {
  width: 100%;
  max-width: none !important;
  margin: 0;
}

.secretary-profile-grid,
.secretary-banner {
  width: 100%;
}
</style>
