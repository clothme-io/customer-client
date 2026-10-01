import { refreshSession } from "../../../(webclient)/lib/refresh-session";
import { safeInternalPath } from "../../../(webclient)/lib/size-contract";
import { NextRequest, NextResponse } from "next/server";
import { WEBCLIENT_MOCK } from "../../../(webclient)/lib/config";
import { bootstrapGuestSession } from "../../../(webclient)/lib/guest";
import { getSession, setSession } from "../../../(webclient)/lib/session";

export async function GET(request: NextRequest) {
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"));
  const existing = await getSession();
  if (existing) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (WEBCLIENT_MOCK) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  try {
    const previous = await getSession(true);
    if (previous?.refreshToken) {
      const renewed = await refreshSession();
      if (!renewed)
        throw new Error(
          "Please sign in again to recover your shopping session.",
        );
      return NextResponse.redirect(new URL(next, request.url));
    }
    const session = await bootstrapGuestSession();
    await setSession(session);
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not start a guest session";
    return NextResponse.json({ message }, { status: 500 });
  }
}
