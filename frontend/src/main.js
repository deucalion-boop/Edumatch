import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeAuthInterceptor, initializeAuthPresence } from './stores/auth'

initializeAuthInterceptor()
initializeAuthPresence()
createApp(App).use(router).mount('#app')
