<template>
  <div class="headteacher-workspace headteacher-dashboard-page">
    <main class="headteacher-main headteacher-page-container">
      <header class="headteacher-top-header">
        <div class="headteacher-header-content">
          <div class="headteacher-header-copy">
            <div>
              <h1>HeadTeacher Profile</h1>
              <p class="headteacher-header-subtitle">Review your account identity and department leadership details.</p>
            </div>
          </div>

          <div class="headteacher-header-tools">
            <button
              type="button"
              class="headteacher-header-settings-button headteacher-account-menu-trigger"
              aria-label="Home dashboard"
              title="Home Dashboard"
              @click="router.push('/headteacher/dashboard')"
            >
              <i class="fas fa-home"></i>
            </button>
            <div ref="accountMenuRef" class="headteacher-account-menu">
              <button
                type="button"
                class="headteacher-header-settings-button headteacher-account-menu-trigger"
                aria-label="Settings menu"
                title="Settings"
                @click="toggleAccountMenu"
              >
                <i class="fas fa-cog"></i>
              </button>
              <div v-if="isAccountMenuOpen" class="headteacher-account-menu-dropdown">
                <button type="button" class="headteacher-account-menu-item" @click="goToProfile">
                  <i class="fas fa-user"></i>
                  <span>Profile</span>
                </button>
                <button type="button" class="headteacher-account-menu-item" @click="goToSettings">
                  <i class="fas fa-cog"></i>
                  <span>Settings</span>
                </button>
                <button type="button" class="headteacher-account-menu-item danger" @click="handleLogout">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section v-if="banner.message" class="headteacher-banner" :class="banner.type">
        <i class="fas" :class="banner.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"></i>
        <span>{{ banner.message }}</span>
      </section>

      <section class="headteacher-profile-grid">
        <article class="headteacher-section-card headteacher-panel headteacher-content-card">
          <div class="headteacher-section-head">
            <div>
              <h2 class="headteacher-section-title">Profile Summary</h2>
              <p class="headteacher-section-subtitle">Core account details used throughout the HeadTeacher portal.</p>
            </div>
          </div>

          <div class="headteacher-detail-list">
            <div class="headteacher-detail-item">
              <span>Full Name</span>
              <strong>{{ displayName }}</strong>
            </div>
            <div class="headteacher-detail-item">
              <span>Email Address</span>
              <strong>{{ profileForm.email || 'Not provided' }}</strong>
            </div>
            <div class="headteacher-detail-item">
              <span>Department</span>
              <strong>{{ departmentLabel }}</strong>
            </div>
            <div class="headteacher-detail-item">
              <span>Contact Number</span>
              <strong>{{ profileForm.contactNumber || 'Not provided' }}</strong>
            </div>
          </div>
        </article>

        <article class="headteacher-section-card headteacher-panel headteacher-content-card">
          <div class="headteacher-section-head">
            <div>
              <h2 class="headteacher-section-title">Edit Basic Information</h2>
              <p class="headteacher-section-subtitle">Update local profile details displayed across your portal.</p>
            </div>
          </div>

          <form class="headteacher-form" @submit.prevent="saveProfile">
            <div class="headteacher-form-grid">
              <label class="headteacher-form-group">
                <span>Display Name</span>
                <input v-model.trim="profileForm.name" type="text" placeholder="Enter display name">
                <small v-if="errors.name" class="headteacher-form-feedback error">{{ errors.name }}</small>
              </label>
              <label class="headteacher-form-group">
                <span>Email Address</span>
                <input v-model.trim="profileForm.email" type="email" placeholder="Enter email address">
                <small v-if="errors.email" class="headteacher-form-feedback error">{{ errors.email }}</small>
              </label>
              <label class="headteacher-form-group headteacher-form-group-full">
                <span>Contact Number</span>
                <input v-model.trim="profileForm.contactNumber" type="tel" inputmode="tel" placeholder="+63 912 345 6789">
                <small v-if="errors.contactNumber" class="headteacher-form-feedback error">{{ errors.contactNumber }}</small>
              </label>
            </div>

            <div class="headteacher-modal-actions">
              <button type="button" class="headteacher-button headteacher-button-outline" @click="resetProfile">Reset</button>
              <button type="submit" class="headteacher-button headteacher-button-primary" style="color: #ffffff !important;">Save Profile</button>
            </div>
          </form>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { isValidPhilippinePhone, normalizePhilippinePhone } from '../../utils/phone.js'

const router = useRouter()
const authStore = useAuthStore()

const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const banner = reactive({ type: 'success', message: '' })
const profileForm = reactive({
  name: '',
  email: '',
  contactNumber: '',
})
const errors = reactive({
  name: '',
  email: '',
  contactNumber: '',
})

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'HeadTeacher').trim())
const departmentLabel = computed(() => String(authStore.user?.department || 'Department').trim())

const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }

const syncProfileForm = () => {
  profileForm.name = String(authStore.user?.name || authStore.user?.displayName || '').trim()
  profileForm.email = String(authStore.user?.email || '').trim()
  profileForm.contactNumber = normalizePhilippinePhone(authStore.user?.contactNumber)
}

const clearBanner = () => { banner.message = '' }

const goToProfile = () => {
  isAccountMenuOpen.value = false
  router.push('/headteacher/profile')
}

const goToSettings = () => {
  isAccountMenuOpen.value = false
  router.push('/headteacher/settings')
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

const validateProfile = () => {
  errors.name = ''
  errors.email = ''
  errors.contactNumber = ''
  if (!String(profileForm.name || '').trim()) errors.name = 'Display name is required.'
  const emailValue = String(profileForm.email || '').trim()
  if (!emailValue) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!isValidPhilippinePhone(profileForm.contactNumber)) {
    errors.contactNumber = 'Enter a valid Philippine number beginning with +63.'
  }
  return !errors.name && !errors.email && !errors.contactNumber
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
    contactNumber: normalizePhilippinePhone(profileForm.contactNumber),
  })
  banner.type = 'success'
  banner.message = 'HeadTeacher profile updated successfully.'
}

const resetProfile = () => {
  clearBanner()
  syncProfileForm()
  errors.name = ''
  errors.email = ''
  errors.contactNumber = ''
}

onMounted(() => {
  syncProfileForm()
  document.addEventListener('click', handleAccountMenuClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountMenuClickOutside)
})
</script>

<style scoped>
.headteacher-main,
.headteacher-main.headteacher-page-container {
  width: 100%;
  max-width: none !important;
  margin: 0;
}

.headteacher-profile-grid,
.headteacher-stat-section,
.headteacher-banner {
  width: 100%;
}
</style>
