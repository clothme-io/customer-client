import { cookies } from "next/headers";
import {
  COOKIE_ACCESS,
  COOKIE_ACCOUNT,
  COOKIE_PERSON,
  COOKIE_REFRESH,
  WEBCLIENT_MOCK
} from "./config";
import { MOCK_SESSION } from "./mock";

export type WebClientSession = {
  accessToken: string;
  refreshToken: string;
  accountId: string;
  personId: string;
};

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production"
};

export async function getSession(): Promise<WebClientSession | null> {
  if (WEBCLIENT_MOCK) {
    return MOCK_SESSION;
  }

  const store = await cookies();
  const accessToken = store.get(COOKIE_ACCESS)?.value;
  const refreshToken = store.get(COOKIE_REFRESH)?.value || "";
  const accountId = store.get(COOKIE_ACCOUNT)?.value || "";
  const personId = store.get(COOKIE_PERSON)?.value || "";

  if (!accessToken) return null;

  return { accessToken, refreshToken, accountId, personId };
}

export async function setSession(session: WebClientSession) {
  const store = await cookies();
  store.set(COOKIE_ACCESS, session.accessToken, { ...cookieBase, maxAge: 60 * 30 });
  store.set(COOKIE_REFRESH, session.refreshToken, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
  store.set(COOKIE_ACCOUNT, session.accountId, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
  store.set(COOKIE_PERSON, session.personId, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
}

export async function setPersonId(personId: string) {
  const store = await cookies();
  store.set(COOKIE_PERSON, personId, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  const store = await cookies();
  for (const name of [COOKIE_ACCESS, COOKIE_REFRESH, COOKIE_ACCOUNT, COOKIE_PERSON]) {
    store.delete(name);
  }
}
