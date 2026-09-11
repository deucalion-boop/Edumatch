export const registerServiceWorker = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      })

      // Do not wait for the browser's periodic check when a user keeps EduMatch open.
      registration.update().catch(() => {})
    } catch (error) {
      console.warn('EduMatch could not enable offline support.', error)
    }
  }

  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}
