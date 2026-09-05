import { NextResponse } from "next/server";
import { customerFetch } from "../../../(webclient)/lib/api";
import { WEBCLIENT_MOCK } from "../../../(webclient)/lib/config";
import { clearSession, getSession, setPersonId, setSession } from "../../../(webclient)/lib/session";

type AuthResult = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    sub?: string;
    email?: string;
    name?: string;
    personId?: string;
    currentSelectedUser?: string;
  };
  account?: { id?: string };
  person?: { id?: string };
};

function resolveSession(data: AuthResult) {
  const accessToken = data.accessToken;
  const refreshToken = data.refreshToken || "";
  const accountId = data.account?.id || data.user?.sub || "";
  const personId =
    data.person?.id || data.user?.personId || data.user?.currentSelectedUser || accountId;

  if (!accessToken || !accountId) {
    throw new Error("Sign in did not return a session");
  }

  return { accessToken, refreshToken, accountId, personId };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    accountId: session.accountId,
    personId: session.personId
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body.personId && typeof body.personId === "string") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Not signed in" }, { status: 401 });
    }
    await setPersonId(body.personId);
    return NextResponse.json({ ok: true, personId: body.personId });
  }

  if (WEBCLIENT_MOCK) {
    return NextResponse.json({ ok: true, mock: true });
  }

  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }

  try {
    const data = await customerFetch<AuthResult>("/v1/auth/email/signin", {
      method: "POST",
      body: { email, password }
    });
    await setSession(resolveSession(data));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed";
    const status = typeof (error as { status?: number }).status === "number"
      ? (error as { status: number }).status
      : 401;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
