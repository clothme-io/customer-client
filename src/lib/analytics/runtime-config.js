// This is an explicit public allowlist, never a serialization of process.env.
// Project ingestion tokens are public browser identifiers. Administrative keys stay server-only.
export function publicAnalyticsConfig(env) {
  function host(value, fallback) {
    try {
      const url = new URL(value || fallback);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        return fallback;
      return url.href.replace(/\/$/, "");
    } catch {
      return fallback;
    }
  }
  return {
    posthogKey: env.POSTHOG_KEY || env.NEXT_PUBLIC_POSTHOG_KEY || "",
    posthogHost: host(
      env.POSTHOG_HOST || env.NEXT_PUBLIC_POSTHOG_HOST,
      "https://us.i.posthog.com",
    ),
    mixpanelToken: env.MIXPANEL_TOKEN || env.NEXT_PUBLIC_MIXPANEL_TOKEN || "",
    mixpanelHost: host(
      env.MIXPANEL_API_HOST || env.NEXT_PUBLIC_MIXPANEL_API_HOST,
      "https://api-js.mixpanel.com",
    ),
  };
}
