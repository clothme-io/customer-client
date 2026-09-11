/**
 * Fire an analytics event to all configured providers.
 * Safe to call on the server (no-ops) and before scripts have loaded.
 *
 * GA4:      gtag('event', name, props)
 * Plausible: plausible(name, { props })
 * GTM:      dataLayer.push({ event: name, ...props })
 * Meta:     fbq('track' | 'trackCustom', …) via map below
 */

const META_STANDARD = {
  waitlist_submit: ["Lead"],
  size_tool_signup: ["Lead", "CompleteRegistration"]
};

const META_CUSTOM = {
  size_tool_started: "SizeToolStarted",
  size_tool_result: "SizeToolResult"
};

const POSTHOG_ALLOWED_HOSTS = (process.env.NEXT_PUBLIC_POSTHOG_ALLOWED_HOSTS || "clothme.io,www.clothme.io")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

function isAllowedAnalyticsHost() {
  if (typeof window === "undefined") return false;

  return POSTHOG_ALLOWED_HOSTS.includes(window.location.hostname.toLowerCase());
}

function fireMeta(eventName) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  const standards = META_STANDARD[eventName];
  if (standards) {
    for (const name of standards) {
      window.fbq("track", name);
    }
  }

  const custom = META_CUSTOM[eventName];
  if (custom) {
    window.fbq("trackCustom", custom);
  }
}

export function track(eventName, properties = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    app: "clothme_customer_web",
    environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development",
    ...properties,
  };

  if (payload.environment !== "production" || !isAllowedAnalyticsHost()) return;

  if (window.posthog && typeof window.posthog.capture === "function") {
    window.posthog.capture(eventName, payload);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }

  if (typeof window.plausible === "function") {
    window.plausible(eventName, { props: payload });
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...payload });
  }

  fireMeta(eventName);
}
