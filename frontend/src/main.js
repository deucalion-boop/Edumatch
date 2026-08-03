import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeAuthInterceptor, initializeAuthPresence } from './stores/auth'
import '@fortawesome/fontawesome-free/css/all.min.css'

initializeAuthInterceptor()
initializeAuthPresence()
createApp(App).use(router).mount('#app')
