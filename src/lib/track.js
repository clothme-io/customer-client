import { analytics, analyticsEnabled } from "./analytics/client.js";
import { sanitize } from "./analytics/core.js";
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
  size_tool_signup: ["Lead", "CompleteRegistration"],
};

const META_CUSTOM = {
  size_tool_started: "SizeToolStarted",
  size_tool_result: "SizeToolResult",
};

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

  const payload = sanitize(properties);
  if (!analyticsEnabled()) return false;
  const accepted = analytics.track(eventName, payload);
  const safely = (fn) => {
    try {
      fn();
    } catch {}
  };
  safely(() => window.gtag?.("event", eventName, payload));
  safely(() => window.plausible?.(eventName, { props: payload }));
  safely(() => {
    if (Array.isArray(window.dataLayer))
      window.dataLayer.push({ event: eventName, ...payload });
  });
  safely(() => fireMeta(eventName));
  return accepted;
}
