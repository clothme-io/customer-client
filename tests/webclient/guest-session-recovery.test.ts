import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadRoute(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const module = { exports: {} as any };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require: (name: string) => mocks[name],
    URL,
  });
  return module.exports;
}

const nextResponse = {
  json: (body: unknown, options?: ResponseInit) => Response.json(body, options),
  redirect: (url: URL) => new Response(null, { status: 307, headers: { location: url.href } }),
};

for (const authLevel of ["guest", "registered"] as const) {
  test(`POST guest ${authLevel} session with rejected refresh`, async () => {
    let cleared = 0;
    let bootstrapped = 0;
    let saved = 0;
    const expired = {
      accessToken: "",
      refreshToken: "stale",
      accountId: "old-account",
      personId: "old-person",
      authLevel,
    };
    const route = loadRoute("../../app/api/webclient/session/route.ts", {
      "../../../(webclient)/lib/refresh-session": {
        refreshSession: async () => { throw new Error("refresh rejected"); },
      },
      "../../../(webclient)/lib/commerce": {},
      "next/server": { NextResponse: nextResponse },
      "../../../(webclient)/lib/api": {},
      "../../../(webclient)/lib/config": { WEBCLIENT_MOCK: false },
      "../../../(webclient)/lib/guest": {
        bootstrapGuestSession: async () => { bootstrapped++; return { accountId: "new-account" }; },
      },
      "../../../(webclient)/lib/session": {
        getSession: async () => expired,
        clearSession: async () => { cleared++; },
        setSession: async () => { saved++; },
      },
    });
    const response = await route.POST(new Request("https://clothme.io/api/webclient/session", {
      method: "POST",
      body: JSON.stringify({ action: "guest" }),
    }));
    assert.equal(response.status, authLevel === "guest" ? 200 : 401);
    assert.equal(cleared, authLevel === "guest" ? 1 : 0);
    assert.equal(bootstrapped, authLevel === "guest" ? 1 : 0);
    assert.equal(saved, authLevel === "guest" ? 1 : 0);
  });
}

test("GET guest entry starts a new anonymous session after rejected refresh", async () => {
  let saved = 0;
  const route = loadRoute("../../app/api/webclient/guest/route.ts", {
    "../../../(webclient)/lib/refresh-session": {
      refreshSession: async () => { throw new Error("refresh rejected"); },
    },
    "../../../(webclient)/lib/size-contract": { safeInternalPath: () => "/shop" },
    "next/server": { NextResponse: nextResponse },
    "../../../(webclient)/lib/config": { WEBCLIENT_MOCK: false },
    "../../../(webclient)/lib/guest": {
      bootstrapGuestSession: async () => ({ accountId: "new-account" }),
    },
    "../../../(webclient)/lib/session": {
      getSession: async (allowExpired?: boolean) => allowExpired
        ? { accessToken: "", refreshToken: "stale", authLevel: "guest" }
        : null,
      clearSession: async () => {},
      setSession: async () => { saved++; },
    },
  });
  const response = await route.GET({
    url: "https://clothme.io/api/webclient/guest?next=/shop",
    nextUrl: new URL("https://clothme.io/api/webclient/guest?next=/shop"),
  });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://clothme.io/shop");
  assert.equal(saved, 1);
});
