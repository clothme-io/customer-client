import pg from "pg";
import { json } from "../_utils.mjs";
import { getBackendHost, probeBackend } from "../../../src/lib/backendApi.js";
import { resolveDatabaseUrl } from "../../../src/lib/databaseUrl.js";

const { Pool } = pg;

async function probeDatabase() {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    return { ok: false, error: "DATABASE_URL is not set" };
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 3_000,
    max: 1,
  });

  try {
    await pool.query("SELECT 1");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "database probe failed" };
  } finally {
    await pool.end().catch(() => {});
  }
}

export async function GET() {
  const [database, backend] = await Promise.all([probeDatabase(), probeBackend()]);
  const payloadConfigured = Boolean(
    process.env.PAYLOAD_SECRET &&
      process.env.PAYLOAD_SECRET !== "development-payload-secret-change-me"
  );
  const ok = database.ok && payloadConfigured;

  return json(
    {
      ok,
      status: ok ? 200 : 503,
      database: {
        ok: database.ok,
        error: database.error || null,
      },
      payload: {
        configured: payloadConfigured,
      },
      backend: {
        configured: backend.configured,
        host: getBackendHost(),
        reachable: backend.reachable,
        status: backend.status,
        error: backend.error || null,
      },
    },
    { status: ok ? 200 : 503 }
  );
}
