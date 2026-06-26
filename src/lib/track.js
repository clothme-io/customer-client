/**
 * Fire an analytics event to all configured providers.
 * Safe to call on the server (no-ops) and before scripts have loaded.
 *
 * GA4:      gtag('event', name, props)
 * Plausible: plausible(name, { props })
 * GTM:      dataLayer.push({ event: name, ...props })
 */
export function track(eventName, properties = {}) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, properties);
  }

  if (typeof window.plausible === "function") {
    window.plausible(eventName, { props: properties });
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...properties });
  }
}
