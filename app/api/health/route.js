import { json } from "../_utils.mjs";
import { getBackendHost, probeBackend } from "../../../src/lib/backendApi.js";

export async function GET() {
  const backend = await probeBackend();

  return json({
    ok: true,
    database: Boolean(process.env.DATABASE_URL),
    payload: Boolean(process.env.PAYLOAD_SECRET),
    backend: {
      configured: backend.configured,
      host: getBackendHost(),
      reachable: backend.reachable,
      status: backend.status,
      error: backend.error || null,
    },
  });
}
