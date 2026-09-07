import { cookies } from "next/headers";
import {
  COOKIE_ACCESS,
  COOKIE_ACCOUNT,
  COOKIE_AUTH_LEVEL,
  COOKIE_EMAIL,
  COOKIE_PERSON,
  COOKIE_REFRESH,
  WEBCLIENT_MOCK
} from "./config";
import { MOCK_SESSION } from "./mock";

export type AuthLevel = "guest" | "registered";

export type WebClientSession = {
  accessToken: string;
  refreshToken: string;
  accountId: string;
  personId: string;
  authLevel: AuthLevel;
  email: string;
};

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production"
};

export function isSyntheticEmail(email: string, accountId: string) {
  if (!email) return true;
  return email.toLowerCase() === `${accountId}@gmail.com`.toLowerCase();
}

export function hasRealEmail(session: WebClientSession | null | undefined) {
  if (!session?.email) return false;
  return !isSyntheticEmail(session.email, session.accountId);
}

export function isRegistered(session: WebClientSession | null | undefined) {
  return session?.authLevel === "registered";
}

export async function getSession(): Promise<WebClientSession | null> {
  if (WEBCLIENT_MOCK) {
    const store = await cookies();
    const personId = store.get(COOKIE_PERSON)?.value || MOCK_SESSION.personId;
    return { ...MOCK_SESSION, personId };
  }

  const store = await cookies();
  const accessToken = store.get(COOKIE_ACCESS)?.value;
  const refreshToken = store.get(COOKIE_REFRESH)?.value || "";
  const accountId = store.get(COOKIE_ACCOUNT)?.value || "";
  const personId = store.get(COOKIE_PERSON)?.value || "";
  const authLevel = (store.get(COOKIE_AUTH_LEVEL)?.value as AuthLevel) || "guest";
  const email = store.get(COOKIE_EMAIL)?.value || "";

  if (!accessToken) return null;

  return { accessToken, refreshToken, accountId, personId, authLevel, email };
}

export async function setSession(session: WebClientSession) {
  const store = await cookies();
  store.set(COOKIE_ACCESS, session.accessToken, { ...cookieBase, maxAge: 60 * 30 });
  store.set(COOKIE_REFRESH, session.refreshToken, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
  store.set(COOKIE_ACCOUNT, session.accountId, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
  store.set(COOKIE_PERSON, session.personId, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
  store.set(COOKIE_AUTH_LEVEL, session.authLevel || "guest", { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
  store.set(COOKIE_EMAIL, session.email || "", { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
}

export async function setPersonId(personId: string) {
  const store = await cookies();
  store.set(COOKIE_PERSON, personId, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  const store = await cookies();
  for (const name of [
    COOKIE_ACCESS,
    COOKIE_REFRESH,
    COOKIE_ACCOUNT,
    COOKIE_PERSON,
    COOKIE_AUTH_LEVEL,
    COOKIE_EMAIL
  ]) {
    store.delete(name);
  }
}
