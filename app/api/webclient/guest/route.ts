import { NextRequest, NextResponse } from "next/server";
import { WEBCLIENT_MOCK } from "../../../(webclient)/lib/config";
import { bootstrapGuestSession } from "../../../(webclient)/lib/guest";
import { getSession, setSession } from "../../../(webclient)/lib/session";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/shop";
  return value;
}

export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const existing = await getSession();
  if (existing) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (WEBCLIENT_MOCK) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  try {
    const session = await bootstrapGuestSession();
    await setSession(session);
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start a guest session";
    return NextResponse.json({ message }, { status: 500 });
  }
}
