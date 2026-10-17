import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeAuthInterceptor, initializeAuthPresence } from './stores/auth'
import { registerServiceWorker } from './pwa'
import { bootstrapRoleThemes } from './composables/useRoleTheme'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './styles/tailwind.css'
import './styles/roles/workspace-polish.css'
import './styles/roles/administrative-dark.css'
import './styles/roles/headteacher-dark-details.css'
import './styles/roles/admin-dark-details.css'
import './utils/administrativeChartTheme.js'

const teacherColorScheme = window.matchMedia('(prefers-color-scheme: dark)')
const applyStoredTeacherTheme = () => {
  try {
    const preference = localStorage.getItem('edumatch_teacher_theme') || 'system'
    const normalizedPreference = ['light', 'dark', 'system'].includes(preference) ? preference : 'system'
    document.documentElement.dataset.teacherThemePreference = normalizedPreference
    document.documentElement.dataset.teacherTheme = normalizedPreference === 'system'
      ? (teacherColorScheme.matches ? 'dark' : 'light')
      : normalizedPreference
  } catch (_error) {
    document.documentElement.dataset.teacherThemePreference = 'system'
    document.documentElement.dataset.teacherTheme = teacherColorScheme.matches ? 'dark' : 'light'
  }
}
applyStoredTeacherTheme()
teacherColorScheme.addEventListener('change', () => {
  if (document.documentElement.dataset.teacherThemePreference === 'system') applyStoredTeacherTheme()
})

// Apply persisted appearance (light/system/dark) for the administrative roles.
bootstrapRoleThemes([
  { roleKey: 'admin', storageKey: 'edumatch_admin_theme' },
  { roleKey: 'secretary', storageKey: 'edumatch_secretary_theme' },
  { roleKey: 'headteacher', storageKey: 'edumatch_headteacher_theme' },
])

initializeAuthInterceptor()
initializeAuthPresence()
createApp(App).use(router).mount('#app')
registerServiceWorker()
