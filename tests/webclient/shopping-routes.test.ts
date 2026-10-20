import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { readReferrals, REFERRAL_COOKIE } from "../../src/lib/referral.js";
const require = createRequire(import.meta.url);
function load(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const module = { exports: {} as any };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    process,
    URL,
    require: (name: string) => (name in mocks ? mocks[name] : require(name)),
  });
  return module.exports;
}
test("attribution acknowledges only successful claims, retries failures and scopes acknowledgements to the profile", async () => {
  const values = new Map<string, string>([
    [
      REFERRAL_COOKIE,
      JSON.stringify([
        { type: "product", code: "a".repeat(43), receivedAt: Date.now() },
        {
          type: "creator-campaign",
          code: "b".repeat(43),
          receivedAt: Date.now(),
        },
      ]),
    ],
  ]);
  let fail = true;
  let calls = 0;
  const { claimWebReferrals } = load(
    "../../app/(webclient)/lib/attribution.ts",
    {
      "next/headers": {
        cookies: async () => ({
          get: (key: string) =>
            values.has(key) ? { value: values.get(key) } : undefined,
          has: (key: string) => values.has(key),
          set: (key: string, value: string) => values.set(key, value),
        }),
      },
      "../../../src/lib/referral.js": { readReferrals, REFERRAL_COOKIE },
      "./api": {
        customerFetch: async () => {
          calls++;
          if (fail) throw new Error("upstream offline");
          return { productId: "coat" };
        },
      },
    },
  );
  const session = {
    accountId: "account",
    personId: "one",
    accessToken: "token",
  };
  await assert.rejects(() => claimWebReferrals(session));
  assert.equal(values.size, 1);
  fail = false;
  assert.equal((await claimWebReferrals(session))[0].productId, "coat");
  await claimWebReferrals(session);
  assert.equal(
    calls,
    2,
    "campaign installs are not claimed on the web; successful claims are not repeated",
  );
  await claimWebReferrals({ ...session, personId: "two" });
  assert.equal(calls, 3);
});
test("anonymous feed requests page two without creating a guest and does not cache personalized data", async () => {
  let pageRequested = 0;
  const { GET } = load("../../app/api/webclient/feed/route.ts", {
    "next/server": {
      NextResponse: { json: (body: any, init: any) => ({ body, ...init }) },
    },
    "../../../(webclient)/lib/session": { getSession: async () => null },
    "../../../(webclient)/lib/fit-profile": {
      fetchFitProfile: () => {
        throw new Error("anonymous sizing check");
      },
    },
    "../../../(webclient)/lib/catalog": {
      fetchPublicShopCards: async (page: number) => {
        pageRequested = page;
        return [{ product: { productId: "second-page" } }];
      },
    },
    "../../../(webclient)/lib/require-session": {
      actionError: (e: any) => {
        throw e;
      },
    },
  });
  const response = await GET(
    new Request("https://clothme.io/api/webclient/feed?page=2"),
  );
  assert.equal(pageRequested, 2);
  assert.equal(response.body.items[0].product.productId, "second-page");
  assert.equal(response.body.hasMore, false);
  assert.equal(response.headers["Cache-Control"], "no-store");
  assert.equal(
    (await GET(new Request("https://clothme.io/api/webclient/feed?page=-1")))
      .status,
    400,
  );
});

test("disabled mobile rollout cannot create continuation records", async () => {
  const previous = process.env.WEBCLIENT_MOBILE_HANDOFF_ENABLED;
  process.env.WEBCLIENT_MOBILE_HANDOFF_ENABLED = "false";
  let writes = 0;
  try {
    const { POST } = load("../../app/api/webclient/continuation/route.ts", {
      "next/server": { NextResponse: { json: (body: unknown, options: any) => ({ body, status: options?.status ?? 200 }) } },
      "next/headers": { cookies: async () => ({ get: () => undefined }) },
      "../../../(webclient)/lib/require-session": { requireSession: async () => ({ session: { accountId: "a", personId: "p" } }) },
      "../../../(webclient)/lib/continuation-contract": { continuationInput: () => ({}), mobileLink: () => "https://example.com" },
      "../../../(webclient)/lib/continuation-store": { saveContinuation: async () => { writes++; return "token"; } },
      "../../../../src/lib/referral.js": { readReferrals: () => [], REFERRAL_COOKIE },
      qrcode: {},
    });
    const origin = process.env.WEBCLIENT_PUBLIC_URL || "https://clothme.io";
    const response = await POST({ url: `${origin}/api/webclient/continuation`, headers: new Headers({ origin: new URL(origin).origin }) });
    assert.equal(response.status, 503);
    assert.match(response.body.message, /generate your size here/);
    assert.equal(writes, 0);
  } finally {
    if (previous === undefined) delete process.env.WEBCLIENT_MOBILE_HANDOFF_ENABLED;
    else process.env.WEBCLIENT_MOBILE_HANDOFF_ENABLED = previous;
  }
});
