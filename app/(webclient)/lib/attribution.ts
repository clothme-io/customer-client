import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { customerFetch } from "./api";
import type { WebClientSession } from "./session";
import { readReferrals, REFERRAL_COOKIE } from "../../../src/lib/referral.js";

export async function claimWebReferrals(session: WebClientSession) {
  const jar = await cookies();
  const referrals = readReferrals(jar.get(REFERRAL_COOKIE)?.value);
  const results: { productId?: string }[] = [];
  for (const referral of referrals) {
    // Campaign codes record app installs, never claim those just for browsing.
    if (referral.type === "creator-campaign") continue;
    const key =
      "cm_claim_" +
      createHash("sha256")
        .update(
          `${session.accountId}:${session.personId}:${referral.type}:${referral.code}`,
        )
        .digest("hex")
        .slice(0, 24);
    if (jar.has(key)) {
      try {
        results.push(JSON.parse(jar.get(key)!.value));
      } catch {}
      continue;
    }
    const result = await customerFetch<{ productId?: string }>(
      "/v1/customer/creator-attribution",
      {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: { type: referral.type, code: referral.code },
      },
    );
    results.push(result);
    jar.set(key, JSON.stringify({ productId: result?.productId }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 86400,
    });
  }
  return results;
}
