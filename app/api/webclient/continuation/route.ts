import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  continuationInput,
  mobileLink,
} from "../../../(webclient)/lib/continuation-contract";
import { saveContinuation } from "../../../(webclient)/lib/continuation-store";
import { requireSession } from "../../../(webclient)/lib/require-session";
import {
  readReferrals,
  REFERRAL_COOKIE,
} from "../../../../src/lib/referral.js";
import QRCode from "qrcode";
export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.WEBCLIENT_PUBLIC_URL || request.url).origin
  )
    return NextResponse.json(
      { message: "Invalid request origin" },
      { status: 403 },
    );
  const { session, error } = await requireSession();
  if (!session) return error;
  try {
    if (process.env.WEBCLIENT_MOBILE_HANDOFF_ENABLED !== "true")
      throw new Error(
        "Continuing in the app is temporarily unavailable. You can generate your size here.",
      );
    const channel = process.env.AIRBRIDGE_WEB_CHANNEL || "";
    const origin = process.env.WEBCLIENT_PUBLIC_URL;
    if (!origin || new URL(origin).protocol !== "https:")
      throw new Error(
        "Continuing in the app is temporarily unavailable. You can generate your size here.",
      );
    // Validate configuration before persisting any continuation.
    mobileLink("clothme://continue/check", origin, channel);
    const payload = continuationInput(await request.json());
    const referrals = readReferrals(
      (await cookies()).get(REFERRAL_COOKIE)?.value,
    );
    const token = await saveContinuation(
      `${session.accountId}:${session.personId}`,
      { ...payload, referrals },
    );
    const fallback = new URL(`/continue/${token}`, origin).href;
    const url = mobileLink(`clothme://continue/${token}`, fallback, channel);
    return NextResponse.json(
      { url, qr: await QRCode.toDataURL(url, { width: 280, margin: 2 }) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const detail = e instanceof Error ? e.message : "";
    const message =
      /^(Choose a product|Continuing in the app|Please wait a few minutes)/.test(
        detail,
      )
        ? detail
        : "Could not prepare your mobile link. Please retry, or generate your size here.";
    return NextResponse.json(
      { message },
      { status: detail.startsWith("Please wait") ? 429 : 503 },
    );
  }
}
