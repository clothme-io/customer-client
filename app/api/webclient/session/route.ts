import { refreshSession } from "../../../(webclient)/lib/refresh-session";
import { fetchAccountProfile } from "../../../(webclient)/lib/commerce";
import { NextResponse } from "next/server";
import { customerFetch } from "../../../(webclient)/lib/api";
import { WEBCLIENT_MOCK } from "../../../(webclient)/lib/config";
import { bootstrapGuestSession } from "../../../(webclient)/lib/guest";
import {
  clearSession,
  getSession,
  hasRealEmail,
  isRegistered,
  setPersonId,
  setSession,
  type AuthLevel,
} from "../../../(webclient)/lib/session";

type AuthResult = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    sub?: string;
    email?: string;
    name?: string;
    personId?: string;
    currentSelectedUser?: string;
    authLevel?: AuthLevel;
  };
  account?: { id?: string };
  person?: { id?: string };
  authLevel?: AuthLevel;
};

async function resolveSession(
  data: AuthResult,
  fallback: {
    accountId?: string;
    personId?: string;
    authLevel?: AuthLevel;
    email?: string;
  } = {},
) {
  const accessToken = data.accessToken;
  const refreshToken = data.refreshToken || "";
  const accountId =
    data.account?.id || data.user?.sub || fallback.accountId || "";
  let personId =
    data.person?.id ||
    data.user?.personId ||
    data.user?.currentSelectedUser ||
    (accountId === fallback.accountId ? fallback.personId : "") ||
    "";
  const email = data.user?.email || fallback.email || "";
  const authLevel: AuthLevel =
    data.authLevel ||
    data.user?.authLevel ||
    fallback.authLevel ||
    "registered";

  if (!accessToken || !accountId) {
    throw new Error("Sign in did not return a session");
  }

  if (!personId) {
    const profile = await customerFetch<{ accountUserId?: string }>(
      "/v1/customer/me",
      { accessToken },
    );
    personId = profile.accountUserId || "";
  }
  if (!personId) throw new Error("Sign in did not return an account profile");
  return { accessToken, refreshToken, accountId, personId, authLevel, email };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    if (await getSession(true))
      return NextResponse.json({ code: "SESSION_EXPIRED" }, { status: 401 });
    return NextResponse.json(
      { authenticated: false, isRegistered: false, hasRealEmail: false },
      { status: 200 },
    );
  }

  return NextResponse.json({
    authenticated: true,
    isRegistered: isRegistered(session),
    hasRealEmail: hasRealEmail(session),
    authLevel: session.authLevel,
    email: hasRealEmail(session) ? session.email : "",
    accountId: session.accountId,
    personId: session.personId,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  if (action === "refresh") {
    try {
      const session = await refreshSession();
      return NextResponse.json(
        { ok: Boolean(session) },
        { status: session ? 200 : 401 },
      );
    } catch {
      return NextResponse.json(
        {
          code: "SESSION_EXPIRED",
          message: "Please sign in again to recover your account.",
        },
        { status: 401 },
      );
    }
  }

  if (body.personId && typeof body.personId === "string" && !action) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }
    const profile = await fetchAccountProfile(session);
    if (!profile.users?.some((person) => person.userId === body.personId)) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 403 },
      );
    }
    await setPersonId(body.personId);
    return NextResponse.json({ ok: true, personId: body.personId });
  }

  if (action === "guest") {
    const existing = await getSession(true);
    if (existing?.refreshToken && !existing.accessToken) {
      try {
        await refreshSession();
        return NextResponse.json({ ok: true });
      } catch {
        return NextResponse.json(
          { message: "Sign in to recover your shopping session." },
          { status: 401 },
        );
      }
    }
    if (existing) {
      return NextResponse.json({ ok: true, authLevel: existing.authLevel });
    }
    if (WEBCLIENT_MOCK) {
      return NextResponse.json({ ok: true, mock: true, authLevel: "guest" });
    }
    try {
      const session = await bootstrapGuestSession();
      await setSession(session);
      return NextResponse.json({ ok: true, authLevel: "guest" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Guest setup failed";
      return NextResponse.json({ message }, { status: 400 });
    }
  }

  if (action === "attachEmail") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }
    const email = String(body.email || "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "A valid email is required" },
        { status: 400 },
      );
    }
    await setSession({ ...session, email });
    return NextResponse.json({ ok: true, email });
  }

  if (WEBCLIENT_MOCK) {
    return NextResponse.json({ ok: true, mock: true });
  }

  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 },
    );
  }

  const current = await getSession();
  const isSignup = action === "signup";
  const path = isSignup ? "/v1/auth/email/signup" : "/v1/auth/email/signin";
  const payload: Record<string, unknown> = { email, password };

  if (isSignup && current?.authLevel === "guest") {
    payload.linkExistingGuest = true;
    payload.accountId = current.accountId;
  }

  try {
    const data = await customerFetch<AuthResult>(path, {
      method: "POST",
      accessToken:
        current?.authLevel === "guest" ? current.accessToken : undefined,
      body: payload,
    });
    await setSession(
      await resolveSession(data, {
        accountId: current?.accountId,
        personId: current?.personId,
        authLevel: "registered",
        email,
      }),
    );
    return NextResponse.json({ ok: true, authLevel: "registered" });
  } catch (error) {
    const status =
      typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 401;
    const message =
      status === 429
        ? "Sign in is temporarily unavailable. Please try again in a moment."
        : error instanceof Error
          ? error.message
          : isSignup
            ? "Sign up failed"
            : "Sign in failed";
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
