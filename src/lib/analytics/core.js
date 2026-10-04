// Deliberately exclude form values, measurements, emails, raw URLs and error text.
const KEYS = new Set(
  "productId brandId orderId currency value count stage eventId utm_source utm_medium utm_campaign utm_content utm_term source location cta_type city pose status duration_ms route target action auth_type release".split(
    " ",
  ),
);
export function sanitize(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(
        ([key, value]) =>
          KEYS.has(key) &&
          (typeof value === "string" ||
            (typeof value === "number" && Number.isFinite(value))),
      )
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 160) : value,
      ]),
  );
}
export function routeName(path = "/") {
  const parts = path.split(/[?#]/)[0].split("/").filter(Boolean);
  if (["admin", "preview"].includes(parts[0])) return null;
  // Only known public slugs/route names are emitted; dynamic IDs never enter URLs.
  const known = new Set(
    "shop discover product brand account orders size policy manual results age-height capture users new wishbag favorites cart checkout complete thank-you inbox settings login blog black privacy-policy terms-of-service creators apply success about contact careers city privacy terms".split(
      " ",
    ),
  );
  return "/" + parts.map((part) => (known.has(part) ? part : ":id")).join("/");
}
export function createDispatcher({
  enabled,
  context = () => ({}),
  limit = 100,
}) {
  const providers = new Map();
  const backlog = [];
  let identity = null;
  const seen = new Set();
  const safe = (fn) => {
    try {
      Promise.resolve(fn()).catch(() => {});
    } catch {
      /* Analytics must never break app actions. */
    }
  };
  function dispatch(provider, event) {
    safe(() => provider.track(event.name, event.properties));
  }
  return {
    track(name, properties = {}) {
      if (!enabled() || !/^[a-z][a-z0-9_]{0,79}$/.test(name)) return false;
      const dedupKey = properties.eventId
        ? `${name}:${properties.eventId}`
        : null;
      if (dedupKey && seen.has(dedupKey)) return true;
      if (dedupKey) {
        seen.add(dedupKey);
        if (seen.size > 1000) seen.delete(seen.values().next().value);
      }
      const event = {
        name,
        properties: { ...sanitize(properties), ...context() },
      };
      backlog.push(event);
      if (backlog.length > limit) backlog.shift();
      for (const provider of providers.values()) dispatch(provider, event);
      return true;
    },
    add(name, provider) {
      if (providers.has(name)) return;
      providers.set(name, provider);
      if (!enabled()) {
        safe(() => provider.optOut?.());
        return;
      }
      if (identity) safe(() => provider.identify?.(identity));
      for (const event of backlog) dispatch(provider, event);
    },
    identify(id) {
      if (!enabled() || !id || identity === id) return;
      if (identity) this.reset();
      identity = id;
      for (const provider of providers.values())
        safe(() => provider.identify?.(id));
    },
    reset() {
      identity = null;
      backlog.length = 0;
      seen.clear();
      for (const provider of providers.values()) safe(() => provider.reset?.());
    },
    consent(allowed) {
      backlog.length = 0;
      for (const provider of providers.values())
        safe(() => (allowed ? provider.optIn?.() : provider.optOut?.()));
      if (!allowed) this.reset();
    },
  };
}

// Same business ID yields the same valid UUID in every tab and on repeat visits.
export async function eventUuid(id) {
  if (!id) return undefined;
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id)),
  ).slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function scrubSdkProperties(properties) {
  const cleaned = { ...properties };
  for (const key of Object.keys(cleaned)) {
    if (
      /(url|referrer|pathname|search_keyword|\$initial_utm_|gclid|fbclid)/i.test(
        key,
      )
    )
      delete cleaned[key];
  }
  for (const key of ["$set", "$set_once"]) {
    if (cleaned[key]) cleaned[key] = scrubSdkProperties(cleaned[key]);
  }
  // Only the explicit route and sanitized campaign from our own tracker are retained.
  return cleaned;
}
