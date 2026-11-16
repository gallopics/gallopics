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
 * TEMPORARY: no Consent Mode defaults, so Google tags run with cookies until
 * the cookie banner ships. In the EU, analytics cookies normally need consent
 * first; the banner adds a "denied" default before GTM loads.
 */
export function initAnalytics() {
  if (!gtmId) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // Google tags only accept the arguments object, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }

  // Standard GTM snippet
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" })
  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
  document.head.appendChild(script)
}
