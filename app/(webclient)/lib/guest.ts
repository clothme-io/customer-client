import { randomUUID } from "node:crypto";
import { customerFetch } from "./api";
import type { AuthLevel, WebClientSession } from "./session";

type SetupResult = {
  accountId?: string;
  accountUserId?: string;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  cartId?: string;
  wishbagId?: string;
};

function unwrapSetup(data: SetupResult | { result?: SetupResult; data?: SetupResult }) {
  if (data && typeof data === "object" && ("result" in data || "data" in data)) {
    const envelope = data as { result?: SetupResult; data?: SetupResult };
    return envelope.result || envelope.data || (data as SetupResult);
  }
  return data as SetupResult;
}

export async function bootstrapGuestSession(): Promise<WebClientSession> {
  const accountId = randomUUID();
  const wishbagId = randomUUID();
  const cartId = randomUUID();
  const deviceId = randomUUID();
  const email = `${accountId}@gmail.com`;
  const password = `${accountId}password`;

  const raw = await customerFetch<SetupResult>(
    `/v1/account/setup?accountId=${encodeURIComponent(accountId)}&wishbagId=${encodeURIComponent(wishbagId)}&cartId=${encodeURIComponent(cartId)}&pushToken=web`,
    {
      method: "POST",
      accessToken: "accessToken",
      body: {
        firstName: "Guest",
        lastName: "Shopper",
        gender: "unspecified",
        relationship: "self",
        dob: "",
        weight: 0,
        height: 0,
        email,
        password,
        publicKey: "pk_web_clothme_guest",
        deviceId,
        deviceModel: "web",
        deviceOs: "web",
        deviceType: "browser"
      }
    }
  );

  const result = unwrapSetup(raw);
  const resolvedAccountId = result.accountId || accountId;
  const accessToken = result.accessToken;
  const refreshToken = result.refreshToken || result.token || "";
  const personId = result.accountUserId || resolvedAccountId;

  if (!accessToken) {
    throw new Error("Guest setup did not return a session");
  }

  return {
    accessToken,
    refreshToken,
    accountId: resolvedAccountId,
    personId,
    authLevel: "guest" as AuthLevel,
    email
  };
}
