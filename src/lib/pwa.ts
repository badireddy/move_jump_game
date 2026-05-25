import { registerSW } from 'virtual:pwa-register'

// Register the service worker and poll for a new build every minute. Combined
// with the `autoUpdate` strategy, this reloads the page on its own when a new
// version is deployed — so updates appear without a manual hard-refresh, even
// for a long-open installed PWA.
export function setupAutoUpdate(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => {
        registration.update().catch(() => {
          /* offline or transient — try again next tick */
        })
      }, 60_000)
    },
  })
}
