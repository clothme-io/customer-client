import { createDispatcher, routeName } from "./core.js";
const environment =
  process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development";
const hosts = (
  process.env.NEXT_PUBLIC_POSTHOG_ALLOWED_HOSTS || "clothme.io,www.clothme.io"
)
  .split(",")
  .map((h) => h.trim());
export function analyticsEnabled() {
  if (
    typeof window === "undefined" ||
    environment !== "production" ||
    !hosts.includes(window.location.hostname) ||
    routeName(window.location.pathname) === null
  )
    return false;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === "1")
    return false;
  try {
    return localStorage.getItem("cm_analytics_optout") !== "1";
  } catch {
    return false;
  }
}
let campaign = {};
let lastPage;
export const analytics = createDispatcher({
  enabled: analyticsEnabled,
  context: () => ({
    ...campaign,
    app: "clothme_customer_web",
    environment,
    release: process.env.NEXT_PUBLIC_RELEASE || "local",
    route: routeName(window.location.pathname),
  }),
});
export function setAnalyticsConsent(allowed) {
  try {
    localStorage.setItem("cm_analytics_optout", allowed ? "0" : "1");
  } catch {
    return;
  }
  analytics.consent(allowed && analyticsEnabled());
  if (allowed) lastPage = undefined;
  window.dispatchEvent(new Event("clothme:analytics-consent"));
}
let identityRevision = 0;
export function resetAnalyticsIdentity() {
  identityRevision++;
  analytics.reset();
  try {
    localStorage.removeItem("cm_analytics_account");
  } catch {}
}
export async function syncAnalyticsIdentity() {
  const revision = ++identityRevision;
  if (!analyticsEnabled()) return;
  try {
    const response = await fetch("/api/webclient/session");
    if (!response.ok) return;
    const session = await response.json();
    if (revision !== identityRevision || !analyticsEnabled()) return;
    if (session.isRegistered && session.accountId) {
      const previous = localStorage.getItem("cm_analytics_account");
      if (previous && previous !== session.accountId) analytics.reset();
      analytics.identify(session.accountId);
      localStorage.setItem("cm_analytics_account", session.accountId);
    } else if (localStorage.getItem("cm_analytics_account")) {
      analytics.reset();
      localStorage.removeItem("cm_analytics_account");
    }
  } catch {
    /* Keep navigation working when the session service is unavailable. */
  }
}
export function pageView(path) {
  path = path.split("#")[0];
  const route = routeName(path);
  if (!analyticsEnabled() || route === null || lastPage === path) return;
  lastPage = path;
  try {
    const query = new URLSearchParams(window.location.search);
    const next = {};
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]) {
      const value = query.get(key);
      if (value && /^[\w .:/-]{1,120}$/.test(value)) next[key] = value;
    }
    if (Object.keys(next).length)
      sessionStorage.setItem("cm_campaign", JSON.stringify(next));
    const stored = JSON.parse(sessionStorage.getItem("cm_campaign") || "{}");
    campaign = Object.fromEntries(
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
        .filter(
          (k) =>
            typeof stored[k] === "string" &&
            /^[\w .:/-]{1,120}$/.test(stored[k]),
        )
        .map((k) => [k, stored[k]]),
    );
  } catch {
    campaign = {};
  }
  analytics.track("page_view", { route });
  const [section, id] = path.split(/[?#]/)[0].split("/").filter(Boolean);
  if (section === "product") analytics.track("view_item", { productId: id });
  if (section === "brand") analytics.track("view_storefront", { brandId: id });
}
