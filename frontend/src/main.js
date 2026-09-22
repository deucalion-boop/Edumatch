import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeAuthInterceptor, initializeAuthPresence } from './stores/auth'
import { registerServiceWorker } from './pwa'
import '@fortawesome/fontawesome-free/css/all.min.css'

try {
  const teacherTheme = localStorage.getItem('edumatch_teacher_theme') || 'system'
  document.documentElement.dataset.teacherTheme = ['light', 'dark', 'system'].includes(teacherTheme) ? teacherTheme : 'system'
} catch (_error) {
  document.documentElement.dataset.teacherTheme = 'system'
}

initializeAuthInterceptor()
initializeAuthPresence()
createApp(App).use(router).mount('#app')
registerServiceWorker()
