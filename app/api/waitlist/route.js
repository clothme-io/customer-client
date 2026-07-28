import { NextResponse } from "next/server";
import { usStatesAndProvinces } from "../../../src/data/landing";
import { backendApiUrl, getBackendBaseUrl } from "../_utils.mjs";

const ALLOWED_STATES = new Set(usStatesAndProvinces);
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
const UPSTREAM_TIMEOUT_MS = 20000;
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

async function sendConfirmationEmail(email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.EMAIL_FROM || "noreply@clothme.io";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "You're on the ClothME waitlist",
        html: `
          <p>Thanks for joining the ClothME waitlist.</p>
          <p>We'll email you when early access opens.</p>
          <p>— ClothME</p>
        `
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("[api/waitlist] confirmation email failed:", res.status, text.slice(0, 200));
    }
  } catch (emailError) {
    console.warn("[api/waitlist] confirmation email failed:", emailError.message);
  }
}

export async function POST(request) {
  try {
    if (!getBackendBaseUrl()) {
      return NextResponse.json(
        { error: "Waitlist is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

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

    const upstreamUrl = backendApiUrl("/early-access/waitlist");
    const res = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        ...(state ? { stateProvince: state } : {}),
        ...(source ? { source } : {})
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    let json = null;
    if (contentType.includes("application/json") && text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (!res.ok || (json && json.error)) {
      const message =
        json?.error?.message ||
        json?.message ||
        (res.status >= 500
          ? "Waitlist is temporarily unavailable. Please try again later."
          : "Could not join the waitlist. Please try again.");
      console.error("[api/waitlist] upstream error:", res.status, text.slice(0, 300));
      return NextResponse.json(
        { error: message, message },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }

    const created = Boolean(json?.result?.created ?? json?.created);
    if (created) {
      await sendConfirmationEmail(email);
    }

    return NextResponse.json({ ok: true, created }, { status: 201 });
  } catch (error) {
    console.error("[api/waitlist]", error.message);
    const message =
      error?.name === "TimeoutError"
        ? "The waitlist service timed out. Please try again."
        : error.message || "Request failed";
    return NextResponse.json({ error: message, message }, { status: 502 });
  }
}
