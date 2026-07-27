import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
/** @type {Map<string, number[]>} */
const rateBuckets = new Map();

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key) {
  const now = Date.now();
  const recent = (rateBuckets.get(key) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateBuckets.set(key, recent);
    return true;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  return false;
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (String(body.company || "").trim()) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const ip = clientIp(request);
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase();
    const message = String(body.message || "").trim().slice(0, 4000);
    const source = String(body.source || "").slice(0, 120);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (message.length < 5) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (isRateLimited(`contact:${ip}`) || isRateLimited(`contact:${email}`)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: "Contact form is temporarily unavailable. Email talk2us@clothme.io instead.",
          message: "Contact form is temporarily unavailable. Email talk2us@clothme.io instead."
        },
        { status: 503 }
      );
    }

    const payload = await getPayload({ config });
    const to = process.env.CONTACT_TO || "talk2us@clothme.io";

    await payload.sendEmail({
      to,
      replyTo: email,
      subject: `ClothME contact${source ? ` (${source})` : ""} — ${name}`,
      html: `
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Source:</strong> ${escapeHtml(source || "unknown")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[api/contact]", error.message);
    return NextResponse.json(
      {
        error: error.message || "Request failed",
        message: error.message || "Request failed"
      },
      { status: 500 }
    );
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
