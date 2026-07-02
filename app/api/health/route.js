import { json } from "../_utils.mjs";

export function GET() {
  return json({
    ok: true,
    database: Boolean(process.env.DATABASE_URL),
    payload: Boolean(process.env.PAYLOAD_SECRET)
  });
}
