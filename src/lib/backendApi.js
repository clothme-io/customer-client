/** Base backend URL without trailing slash (BACKEND_API_URL preferred, falls back to NEXT_PUBLIC_API_URL). */
export function getBackendBaseUrl() {
  return (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
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
