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
@reference "../styles/tailwind.css";

.pwa-install {
  @apply tw:fixed;
  @apply tw:[right:max(16px,_env(safe-area-inset-right))];
  @apply tw:[bottom:max(16px,_env(safe-area-inset-bottom))];
  @apply tw:[z-index:10000];
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto_auto];
  @apply tw:items-center;
  @apply tw:[gap:12px];
  @apply tw:[width:min(430px,_calc(100vw_-_32px))];
  @apply tw:[padding:12px];
  @apply tw:[color:#183027];
  @apply tw:[background:#fff];
  @apply tw:[border:1px_solid_rgba(23,_99,_60,_0.2)];
  @apply tw:[border-radius:14px];
  @apply tw:[box-shadow:0_12px_36px_rgba(16,_44,_31,_0.2)];
  @apply tw:[font-family:inherit];
}

.pwa-install img {
  @apply tw:[border-radius:10px];
}

.pwa-install__copy {
  @apply tw:grid;
  @apply tw:[gap:2px];
  @apply tw:[min-width:0];
}

.pwa-install__copy strong {
  @apply tw:[font-size:0.95rem];
}

.pwa-install__copy span {
  @apply tw:[color:#5c6d66];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.3];
}

.pwa-install__action {
  @apply tw:[padding:8px_13px];
  @apply tw:[color:#fff];
  @apply tw:[background:#17633c];
  @apply tw:[border:0];
  @apply tw:[border-radius:8px];
  @apply tw:[font:inherit];
  @apply tw:[font-size:0.85rem];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
}

.pwa-install__action:hover {
  @apply tw:[background:#0f5130];
}

.pwa-install__dismiss {
  @apply tw:[align-self:start];
  @apply tw:[padding:0_3px];
  @apply tw:[color:#65736e];
  @apply tw:[background:transparent];
  @apply tw:[border:0];
  @apply tw:[font-size:1.45rem];
  @apply tw:[line-height:1];
  @apply tw:cursor-pointer;
}

@media (max-width: 520px) {
  .pwa-install {
    @apply tw:[right:12px];
    @apply tw:[bottom:max(12px,_env(safe-area-inset-bottom))];
    @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto];
    @apply tw:[width:calc(100vw_-_24px)];
  }

  .pwa-install__action {
    @apply tw:[grid-column:2];
    @apply tw:[justify-self:start];
  }

  .pwa-install__dismiss {
    @apply tw:[grid-column:3];
    @apply tw:[grid-row:1];
  }
}

@media (prefers-reduced-motion: reduce) {
  .pwa-install * {
    @apply tw:scroll-auto;
  }
}

</style>
