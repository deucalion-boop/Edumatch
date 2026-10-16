<template>
  <div ref="menu" class="headteacher-account-menu">
    <button type="button" class="headteacher-header-settings-button headteacher-account-menu-trigger" aria-label="Settings menu" title="Settings" aria-haspopup="true" :aria-expanded="open" @click="open = !open"><i class="fas fa-cog" aria-hidden="true"></i></button>
    <div v-if="open" class="headteacher-account-menu-dropdown">
      <button type="button" class="headteacher-account-menu-item" @click="navigate('/headteacher/profile')"><i class="fas fa-user" aria-hidden="true"></i><span>Profile</span></button>
      <button type="button" class="headteacher-account-menu-item" @click="navigate('/headteacher/settings')"><i class="fas fa-cog" aria-hidden="true"></i><span>Settings</span></button>
      <button type="button" class="headteacher-account-menu-item danger" @click="logout"><i class="fas fa-sign-out-alt" aria-hidden="true"></i><span>Logout</span></button>
    </div>
  </div>
</template>
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
const router = useRouter(), auth = useAuthStore()
const menu = ref(null), open = ref(false)
const navigate = path => { open.value = false; router.push(path) }
const logout = () => { auth.logout(); navigate('/auth/login') }
const outside = event => { if (!menu.value?.contains(event.target)) open.value = false }
const escape = event => {
  if (event.key === 'Escape' && open.value) {
    open.value = false
    menu.value?.querySelector('button')?.focus()
  }
}
onMounted(() => { document.addEventListener('click', outside); document.addEventListener('keydown', escape) })
onBeforeUnmount(() => { document.removeEventListener('click', outside); document.removeEventListener('keydown', escape) })
</script>
