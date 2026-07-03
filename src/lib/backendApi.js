/** Base backend URL without trailing slash (BACKEND_API_URL preferred, falls back to NEXT_PUBLIC_API_URL). */
export function getBackendBaseUrl() {
  return (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
}

/** Hostname only — safe to expose in health checks. */
export function getBackendHost() {
  const base = getBackendBaseUrl();
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
}

/** Build a backend API URL with the /v1 prefix. Path should start with / (e.g. /creator-applications). */
export function backendApiUrl(path) {
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("Backend API URL is not configured (set BACKEND_API_URL or NEXT_PUBLIC_API_URL)");
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/v1")) {
    return `${base}${normalizedPath}`;
  }
  return `${base}/v1${normalizedPath}`;
}

const BACKEND_PROBE_TIMEOUT_MS = 8000;

/** Lightweight reachability check for ops/debug (does not submit data). */
export async function probeBackend() {
  const base = getBackendBaseUrl();
  if (!base) {
    return { configured: false, reachable: false, status: null, error: "not_configured" };
  }

  const url = backendApiUrl("/creator-applications");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(BACKEND_PROBE_TIMEOUT_MS),
    });
    const contentType = res.headers.get("content-type") || "";
    return {
      configured: true,
      reachable: true,
      status: res.status,
      acceptsJson: contentType.includes("application/json"),
      host: getBackendHost(),
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      status: null,
      error: error?.name === "TimeoutError" ? "timeout" : "connection_failed",
      host: getBackendHost(),
    };
  }
}
