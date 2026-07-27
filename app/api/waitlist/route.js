import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { usStatesAndProvinces } from "../../../src/data/landing";

const ALLOWED_STATES = new Set(usStatesAndProvinces);
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
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

    // Honeypot — bots fill this; humans never see it.
    if (String(body.company || "").trim()) {
      return NextResponse.json({ ok: true, created: false }, { status: 201 });
    }

    const ip = clientIp(request);
    const email = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "").slice(0, 120);
    const rawState = String(body.state || "").trim().toUpperCase().slice(0, 8);
    const state = ALLOWED_STATES.has(rawState) ? rawState : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (isRateLimited(`ip:${ip}`) || isRateLimited(`email:${email}`)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const payload = await getPayload({ config });
    const existing = await payload.find({
      collection: "waitlist-entries",
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true
    });

    let created = false;

    if (existing.docs.length === 0) {
      await payload.create({
        collection: "waitlist-entries",
        data: {
          email,
          source,
          ...(state ? { state } : {})
        },
        overrideAccess: true
      });
      created = true;

      if (process.env.RESEND_API_KEY) {
        try {
          await payload.sendEmail({
            to: email,
            subject: "You're on the ClothME waitlist",
            html: `
              <p>Thanks for joining the ClothME waitlist.</p>
              <p>We'll email you when early access opens.</p>
              <p>— ClothME</p>
            `
          });
        } catch (emailError) {
          console.warn("[api/waitlist] confirmation email failed:", emailError.message);
        }
      }
    } else if (state) {
      await payload.update({
        collection: "waitlist-entries",
        id: existing.docs[0].id,
        data: { state },
        overrideAccess: true
      });
    }

    return NextResponse.json({ ok: true, created }, { status: 201 });
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
