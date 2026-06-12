import { hasDatabase } from "../../../server/db.mjs";
import { json } from "../_utils.mjs";

export function GET() {
  return json({
    ok: true,
    database: hasDatabase(),
    bunny: Boolean(process.env.BUNNY_STORAGE_ZONE && process.env.BUNNY_CDN_BASE_URL),
    clerk: Boolean(process.env.CLERK_SECRET_KEY)
  });
}
