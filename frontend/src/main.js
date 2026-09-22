import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeAuthInterceptor, initializeAuthPresence } from './stores/auth'
import { registerServiceWorker } from './pwa'
import '@fortawesome/fontawesome-free/css/all.min.css'

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

initializeAuthInterceptor()
initializeAuthPresence()
createApp(App).use(router).mount('#app')
registerServiceWorker()
