import { createHash } from "node:crypto";
import { customerFetch } from "./api";
import { getSession, setSession } from "./session";
import { WEBCLIENT_MOCK } from "./config";

// Coalesce concurrent requests in this server process, including a short rotation grace window.
const rotations = new Map<
  string,
  {
    expires: number;
    result: Promise<{ accessToken: string; refreshToken: string }>;
  }
>();
export async function refreshSession() {
  const session = await getSession(true);
  if (!session?.refreshToken) return null;
  if (WEBCLIENT_MOCK) return session;
  const key = createHash("sha256").update(session.refreshToken).digest("hex");
  const now = Date.now();
  for (const [id, entry] of rotations)
    if (entry.expires < now) rotations.delete(id);
  let rotation = rotations.get(key);
  if (!rotation) {
    rotation = {
      expires: now + 15_000,
      result: customerFetch<{ accessToken: string; refreshToken: string }>(
        "/v1/auth/refresh",
        {
          method: "POST",
          body: { refreshToken: session.refreshToken },
        },
      ),
    };
    rotations.set(key, rotation);
  }
  const tokens = await rotation.result;
  if (!tokens.accessToken || !tokens.refreshToken)
    throw new Error("Session renewal did not return tokens");
  const renewed = { ...session, ...tokens };
  await setSession(renewed);
  return renewed;
}
