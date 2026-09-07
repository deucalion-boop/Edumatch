<template>
  <aside v-if="installEvent" class="pwa-install" role="status" aria-label="Install EduMatch">
    <img src="/icons/icon-192.png" alt="" width="44" height="44" />
    <div class="pwa-install__copy">
      <strong>Install EduMatch</strong>
      <span>Add it to your device for quicker access.</span>
    </div>
    <button class="pwa-install__action" type="button" @click="install">Install</button>
    <button class="pwa-install__dismiss" type="button" aria-label="Dismiss install suggestion" @click="dismiss">
      &times;
    </button>
  </aside>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const installEvent = ref(null)

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

const onInstallAvailable = (event) => {
  event.preventDefault()
  if (!isStandalone() && sessionStorage.getItem('edumatch_install_dismissed') !== 'true') {
    installEvent.value = event
  }
}

const onInstalled = () => {
  installEvent.value = null
  sessionStorage.removeItem('edumatch_install_dismissed')
}

const install = async () => {
  if (!installEvent.value) return

  const promptEvent = installEvent.value
  installEvent.value = null
  await promptEvent.prompt()
  await promptEvent.userChoice
}

const dismiss = () => {
  installEvent.value = null
  sessionStorage.setItem('edumatch_install_dismissed', 'true')
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onInstallAvailable)
  window.addEventListener('appinstalled', onInstalled)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onInstallAvailable)
  window.removeEventListener('appinstalled', onInstalled)
})
</script>

<style scoped>
.pwa-install {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 10000;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  width: min(430px, calc(100vw - 32px));
  padding: 12px;
  color: #183027;
  background: #fff;
  border: 1px solid rgba(23, 99, 60, 0.2);
  border-radius: 14px;
  box-shadow: 0 12px 36px rgba(16, 44, 31, 0.2);
  font-family: inherit;
}

.pwa-install img {
  border-radius: 10px;
}

.pwa-install__copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.pwa-install__copy strong {
  font-size: 0.95rem;
}

.pwa-install__copy span {
  color: #5c6d66;
  font-size: 0.8rem;
  line-height: 1.3;
}

.pwa-install__action {
  padding: 8px 13px;
  color: #fff;
  background: #17633c;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.pwa-install__action:hover {
  background: #0f5130;
}

.pwa-install__dismiss {
  align-self: start;
  padding: 0 3px;
  color: #65736e;
  background: transparent;
  border: 0;
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 520px) {
  .pwa-install {
    right: 12px;
    bottom: max(12px, env(safe-area-inset-bottom));
    grid-template-columns: auto minmax(0, 1fr) auto;
    width: calc(100vw - 24px);
  }

  .pwa-install__action {
    grid-column: 2;
    justify-self: start;
  }

  .pwa-install__dismiss {
    grid-column: 3;
    grid-row: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pwa-install * {
    scroll-behavior: auto;
  }
}
</style>
