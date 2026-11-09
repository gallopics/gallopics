declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const gtmId = import.meta.env.VITE_GTM_ID?.trim()

/**
 * Google Tag Manager, only when VITE_GTM_ID is set (empty on the test server
 * and locally). GA4 and any other tags are configured inside GTM, not here;
 * route changes are picked up by GA4's history-based page views.
 *
 * Consent Mode defaults to "denied": until a consent banner grants it, Google
 * tags set no cookies. If a consent banner (CMP) template is added in GTM and
 * sets its own defaults (and wait_for_update), this default can be removed.
 */
export function initAnalytics() {
  if (!gtmId) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // Google tags only accept the arguments object, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  // Must run before GTM loads
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  })

  // Standard GTM snippet
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" })
  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
  document.head.appendChild(script)
}
