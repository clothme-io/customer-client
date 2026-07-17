import { json } from "../_utils.mjs";

/** Process liveness — does not touch the database. */
export async function GET() {
  return json({ ok: true, live: true });
}
