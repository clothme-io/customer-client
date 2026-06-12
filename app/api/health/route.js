import { hasDatabase } from "../../../server/db.mjs";
import { json } from "../_utils.mjs";

export function GET() {
  return json({
    ok: true,
    database: hasDatabase(),
    payload: Boolean(process.env.PAYLOAD_SECRET)
  });
}
