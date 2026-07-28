/**
 * Build a safe Postgres URL. Kubernetes env expansion of
 * postgresql://$(DB_USER):$(DB_PASS)@host/... breaks when the password
 * contains reserved characters (e.g. `/`, `@`, `:`).
 *
 * Prefer DB_USER + DB_PASS (+ optional host/port/name) and encode them.
 * Fall back to DATABASE_URL when credentials are not split out.
 */
export function resolveDatabaseUrl({
  databaseUrl = process.env.DATABASE_URL,
  user = process.env.DB_USER,
  password = process.env.DB_PASS,
  host = process.env.DB_HOST || "clothme-web-cms-rw.database.svc.cluster.local",
  port = process.env.DB_PORT || "5432",
  database = process.env.DB_NAME || "clothme_web_cms"
} = {}) {
  if (user && password) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
  return databaseUrl || "";
}
