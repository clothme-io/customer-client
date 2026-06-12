import { query } from "../../../server/db.mjs";
import { dbRequired, errorResponse, json } from "../_utils.mjs";

export async function POST(request) {
  const unavailable = dbRequired();
  if (unavailable) return unavailable;

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "").slice(0, 120);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Valid email is required" }, { status: 400 });
    }

    await query(
      `insert into waitlist_signups (email, source)
       values ($1, $2)
       on conflict (email) do nothing`,
      [email, source]
    );

    return json({ ok: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
