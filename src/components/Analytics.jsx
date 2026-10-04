import { loadAnalyticsConfig } from "../lib/analytics/load-config.js";
import { useEffect } from "react";
import posthog from "posthog-js";
import { siteConfig } from "../data/site";

import { observePerformance } from "../lib/analytics/performance.js";
import { initializeLegacy } from "../lib/analytics/legacy.js";
import mixpanel from "mixpanel-browser";
import {
  analytics,
  analyticsEnabled,
  pageView,
  setAnalyticsConsent,
  syncAnalyticsIdentity,
} from "../lib/analytics/client.js";
import {
  eventUuid,
  routeName,
  scrubSdkProperties,
} from "../lib/analytics/core.js";
import { useState } from "react";

export function Analytics({ path }) {
  const [optedOut, setOptedOut] = useState(false);
  useEffect(() => {
    async function initialize() {
      try {
        setOptedOut(localStorage.getItem("cm_analytics_optout") === "1");
      } catch {}
      if (!analyticsEnabled()) return;
      const { gaId, gtmId, plausibleDomain } = siteConfig.analytics;
      let config;
      try {
        config = await loadAnalyticsConfig();
      } catch {
        return;
      }
      if (!analyticsEnabled()) return;
      const { posthogKey, posthogHost } = config;
      initializeLegacy({ gaId, gtmId, plausibleDomain });
      try {
        if (posthogKey && !posthog.__loaded) {
          posthog.init(posthogKey, {
            api_host: posthogHost,
            capture_pageview: false,
            capture_pageleave: false,
            autocapture: false,
            save_referrer: false,
            save_campaign_params: false,
            capture_dead_clicks: false,
            before_send: (event) => (analyticsEnabled() ? event : null),
            disable_session_recording: true,
            person_profiles: "identified_only",
            sanitize_properties: (properties) => ({
              ...scrubSdkProperties(properties),
              $pathname:
                properties.route || routeName(window.location.pathname),
            }),
            loaded: (client) =>
              analytics.add("posthog", {
                track: (name, props) => {
                  const capture = (uuid) => {
                    if (analyticsEnabled())
                      client.capture(
                        name === "page_view" ? "$pageview" : name,
                        props,
                        uuid ? { uuid } : undefined,
                      );
                  };
                  return props.eventId
                    ? eventUuid(props.eventId).then(capture)
                    : capture();
                },
                identify: (id) => client.identify(id),
                reset: () => client.reset(),
                optOut: () => client.opt_out_capturing(),
                optIn: () =>
                  client.opt_in_capturing({ captureEventName: false }),
              }),
          });
        }
      } catch {
        /* A blocked provider must not disable other analytics. */
      }
      const token = config.mixpanelToken;
      try {
        if (token && !window.__clothmeMixpanel) {
          window.__clothmeMixpanel = true;
          mixpanel.init(token, {
            api_host: config.mixpanelHost || "https://api-js.mixpanel.com",
            track_pageview: false,
            autocapture: false,
            record_sessions_percent: 0,
            track_marketing: false,
            store_google: false,
            stop_utm_persistence: true,
            save_referrer: false,
            hooks: {
              before_send_events: (event) =>
                analyticsEnabled()
                  ? {
                      ...event,
                      properties: scrubSdkProperties(event.properties),
                    }
                  : null,
            },
            property_blacklist: [
              "$current_url",
              "$referrer",
              "$initial_referrer",
              "$initial_referring_domain",
            ],
            loaded: (client) =>
              analytics.add("mixpanel", {
                track: (name, props) =>
                  client.track(name, {
                    ...props,
                    ...(props.eventId ? { $insert_id: props.eventId } : {}),
                  }),
                identify: (id) => client.identify(id),
                reset: () => client.reset(),
                optOut: () => client.opt_out_tracking(),
                optIn: () => client.opt_in_tracking({ track: () => {} }),
              }),
          });
        }
      } catch {
        window.__clothmeMixpanel = false;
      }
    }
    initialize();
    const applyLegacyConsent = () => {
      const allowed = analyticsEnabled();
      const { gaId } = siteConfig.analytics;
      if (gaId) window[`ga-disable-${gaId}`] = !allowed;
      window.gtag?.("consent", "update", {
        analytics_storage: allowed ? "granted" : "denied",
      });
      window.fbq?.("consent", allowed ? "grant" : "revoke");
    };
    applyLegacyConsent();
    const consentChange = () => {
      initialize();
      applyLegacyConsent();
      syncAnalyticsIdentity();
      if (analyticsEnabled())
        pageView(window.location.pathname + window.location.search);
    };
    const storageChange = (event) => {
      if (event.key === "cm_analytics_optout") {
        analytics.consent(analyticsEnabled());
        initialize();
        applyLegacyConsent();
      }
    };
    window.addEventListener("clothme:analytics-consent", consentChange);
    window.addEventListener("storage", storageChange);
    const routeChange = () => {
      initialize();
      applyLegacyConsent();
    };
    window.addEventListener("clothme:analytics-route", routeChange);
    // Only deliberately tagged controls are captured; never DOM text or field values.
    const click = (event) => {
      const target = event.target.closest?.("[data-analytics], a[href]");
      if (!target) return;
      const href = target.getAttribute("href") || "";
      const destination =
        href.startsWith("/") && !href.startsWith("//")
          ? routeName(href)
          : href === "#size-tool"
            ? "/#size-tool"
            : "external";
      analytics.track(
        target.dataset.analytics ||
          (href === "#size-tool"
            ? "size_tool_cta_clicked"
            : "navigation_clicked"),
        {
          target: destination || "internal",
          location: target.dataset.analyticsLocation || "page",
        },
      );
    };
    document.addEventListener("click", click);
    const stopPerformance = observePerformance();
    syncAnalyticsIdentity();
    return () => {
      window.removeEventListener("clothme:analytics-consent", consentChange);
      window.removeEventListener("storage", storageChange);
      window.removeEventListener("clothme:analytics-route", routeChange);
      document.removeEventListener("click", click);
      stopPerformance();
    };
  }, []);
  useEffect(() => {
    window.dispatchEvent(new Event("clothme:analytics-route"));
    pageView(path || window.location.pathname);
  }, [path]);
  if (path && routeName(path) === null) return null;
  // Accessible opt-out is available on both routers, including signed-out pages.
  return (
    <div style={{ textAlign: "center", fontSize: 12, padding: 8 }}>
      <button
        type="button"
        onClick={() => setAnalyticsConsent(optedOut)}
        style={{
          background: "none",
          border: 0,
          color: "inherit",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {optedOut ? "Enable usage analytics" : "Turn off usage analytics"}
      </button>
    </div>
  );
}
