<template>
  <div class="headteacher-workspace headteacher-dashboard-page">
    <HeadTeacherSidebar v-model:is-open="isSidebarOpen" :display-name="displayName" />
    <main class="headteacher-main headteacher-page-container">
      <header class="headteacher-top-header">
        <div class="headteacher-header-content">
          <div class="headteacher-header-copy">
            <button type="button" class="headteacher-mobile-menu-toggle" :aria-expanded="isSidebarOpen" aria-controls="headteacher-sidebar-drawer" aria-label="Open sidebar" @click="isSidebarOpen = !isSidebarOpen">
              <i class="fas fa-bars" aria-hidden="true"></i>
            </button>
            <div>
              <h1>HeadTeacher Profile</h1>
              <p class="headteacher-header-subtitle">Review your account identity and department leadership details.</p>
            </div>
          </div>

          <div class="headteacher-header-tools">
            <HeadTeacherNotifications />
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
            </div>

            <div class="headteacher-modal-actions">
              <button type="button" class="headteacher-button headteacher-button-outline" @click="resetProfile">Reset</button>
              <button type="submit" class="headteacher-button headteacher-button-primary tw:inline:[color:#ffffff]!" >Save Profile</button>
            </div>
          </form>
        </article>
      </section>
      <DashboardFooter />
    </main>
  </div>
</template>

<script setup>
import DashboardFooter from '../../components/DashboardFooter.vue'
import HeadTeacherSidebar from '../../components/HeadTeacherSidebar.vue'
import HeadTeacherNotifications from '../../components/HeadTeacherNotifications.vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const banner = reactive({ type: 'success', message: '' })
const profileForm = reactive({
  name: '',
  email: '',
})
const errors = reactive({
  name: '',
  email: '',
})

const displayName = computed(() => String(authStore.user?.name || authStore.user?.displayName || 'HeadTeacher').trim())
const departmentLabel = computed(() => String(authStore.user?.department || 'Department').trim())

const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }

const syncProfileForm = () => {
  profileForm.name = String(authStore.user?.name || authStore.user?.displayName || '').trim()
  profileForm.email = String(authStore.user?.email || '').trim()
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
  if (!String(profileForm.name || '').trim()) errors.name = 'Display name is required.'
  const emailValue = String(profileForm.email || '').trim()
  if (!emailValue) {
    errors.email = 'Email address is required.'
  } else if (!/^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@gmail\.com$/i.test(emailValue)) {
    errors.email = 'Enter a valid Gmail address (e.g., user@gmail.com).'
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
  })
  banner.type = 'success'
  banner.message = 'HeadTeacher profile updated successfully.'
}

const resetProfile = () => {
  clearBanner()
  syncProfileForm()
  errors.name = ''
  errors.email = ''
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
@reference "../../styles/tailwind.css";

.headteacher-main,
.headteacher-main.headteacher-page-container {
  @apply tw:max-w-none!;
}

.headteacher-profile-grid,
.headteacher-stat-section,
.headteacher-banner {
  @apply tw:w-full;
}

</style>
