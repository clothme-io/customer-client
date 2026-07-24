import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "").slice(0, 120);
    const state = String(body.state || "").trim().toUpperCase().slice(0, 8);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const payload = await getPayload({ config });
    const existing = await payload.find({
      collection: "waitlist-entries",
      where: { email: { equals: email } },
      limit: 1,
      depth: 0
    });

    if (existing.docs.length === 0) {
      await payload.create({
        collection: "waitlist-entries",
        data: {
          email,
          source,
          ...(state ? { state } : {})
        }
      });
    } else if (state) {
      await payload.update({
        collection: "waitlist-entries",
        id: existing.docs[0].id,
        data: { state }
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[api/waitlist]", error.message);
    return NextResponse.json(
      {
        error: error.message || "Request failed",
        message: error.message || "Request failed"
      },
      { status: 500 }
    );
  }
}
