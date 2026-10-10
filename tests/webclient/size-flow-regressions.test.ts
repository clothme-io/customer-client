import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { IDBFactory } from "fake-indexeddb";

const require = createRequire(import.meta.url);
// Compile the browser modules without changing production import resolution.
function loadModule(path: string, mocks: Record<string, unknown>, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = { exports: {} as any };
  vm.runInNewContext(outputText, {
    module, exports: module.exports, ...globals,
    require: (name: string) => name in mocks ? mocks[name] : require(name),
  });
  return module.exports;
}

function flowStore() {
  return loadModule("../../app/(webclient)/lib/size-flow.ts", {
    "./session-client": {}, "./size-profile": {},
  }, { indexedDB: new IDBFactory() });
}

test("sizeIdentity does not mint a guest before a session exists", async () => {
  let guestCalls = 0;
  const { sizeIdentity, LOCAL_SIZE_SCOPE } = loadModule("../../app/(webclient)/lib/size-flow.ts", {
    "./session-client": {
      sessionFetch: async () => ({ json: async () => ({ authenticated: false }) }),
      ensureClientGuest: async () => { guestCalls += 1; },
    },
    "./size-profile": { bindSizeProfileScope() {}, dataUrlToBlob() {} },
  }, {
    indexedDB: new IDBFactory(),
    sessionStorage: { getItem: () => null, setItem() {} },
  });
  assert.equal(await sizeIdentity(), LOCAL_SIZE_SCOPE);
  assert.equal(guestCalls, 0);
});

test("bindSizeIdentity mints a guest and rebinds the local size profile", async () => {
  let guestCalls = 0;
  let bound: string | undefined;
  let authenticated = false;
  const { bindSizeIdentity } = loadModule("../../app/(webclient)/lib/size-flow.ts", {
    "./session-client": {
      sessionFetch: async () => ({
        json: async () => authenticated
          ? { authenticated: true, accountId: "acc", personId: "per" }
          : { authenticated: false },
      }),
      ensureClientGuest: async () => { guestCalls += 1; authenticated = true; },
    },
    "./size-profile": {
      bindSizeProfileScope: (next: string) => { bound = next; },
      dataUrlToBlob() {},
    },
  }, {
    indexedDB: new IDBFactory(),
    sessionStorage: { getItem: () => "pending", setItem() {} },
  });
  assert.equal(await bindSizeIdentity(), "acc:per");
  assert.equal(guestCalls, 1);
  assert.equal(bound, "acc:per");
});

test("bindSizeProfileScope copies a pending profile onto the minted identity", () => {
  const store: Record<string, string> = {
    "cm_size_scope": "pending",
    "cm_size_profile:pending": JSON.stringify({ dob: "1990-01-01", height: "170" }),
  };
  const { bindSizeProfileScope, loadSizeProfile } = loadModule(
    "../../app/(webclient)/lib/size-profile.ts",
    {},
    { sessionStorage: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
    } },
  );
  bindSizeProfileScope("acc:per");
  assert.equal(store["cm_size_scope"], "acc:per");
  assert.equal(loadSizeProfile().dob, "1990-01-01");
  assert.equal(loadSizeProfile().height, "170");
});

test("size pages and result polls do not mint a guest on GET", () => {
  for (const file of [
    "../../app/(webclient)/(main)/account/size/policy/page.tsx",
    "../../app/(webclient)/(main)/account/size/age-height/page.tsx",
    "../../app/(webclient)/(main)/account/size/capture/page.tsx",
    "../../app/(webclient)/(main)/account/size/manual/page.tsx",
    "../../app/(webclient)/(main)/account/size/results/page.tsx",
    "../../app/api/webclient/fit-profile/route.ts",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /loadSizeSession|ensureWebGuest|mintGuest/);
  }
  const sizeRoute = readFileSync(new URL("../../app/api/webclient/size/route.ts", import.meta.url), "utf8");
  assert.match(sizeRoute, /requireSession\(\{ mintGuest: true \}\)/);
  assert.match(sizeRoute, /export async function GET[\s\S]*requireSession\(\)/);
});

test("synthetic emails include guest.invalid and legacy uuid gmail", () => {
  const { isSyntheticEmail } = loadModule("../../app/(webclient)/lib/session.ts", {
    "next/headers": { cookies: async () => ({ get() {}, set() {}, delete() {} }) },
    "./config": {
      COOKIE_ACCESS: "cm_access", COOKIE_REFRESH: "cm_refresh", COOKIE_ACCOUNT: "cm_account",
      COOKIE_PERSON: "cm_person", COOKIE_AUTH_LEVEL: "cm_auth_level", COOKIE_EMAIL: "cm_email",
      WEBCLIENT_MOCK: false,
    },
    "./mock": { MOCK_SESSION: {} },
  }, { process });
  const accountId = "11111111-1111-1111-1111-111111111111";
  assert.equal(isSyntheticEmail(`${accountId}@guest.invalid`, accountId), true);
  assert.equal(isSyntheticEmail(`${accountId}@gmail.com`, accountId), true);
  assert.equal(isSyntheticEmail("maya@example.com", accountId), false);
});

test("guest setup matches mobile's nonempty pre-profile DOB contract", async () => {
  let sent: any;
  const { bootstrapGuestSession } = loadModule("../../app/(webclient)/lib/guest.ts", {
    "./api": { customerFetch: async (_path: string, options: any) => {
      sent = options.body;
      if (!sent.dob) throw new Error("dob should not be empty");
      return { accountId: "account", accountUserId: "person", accessToken: "access", refreshToken: "refresh" };
    } },
    "./config": { WEBCLIENT_MOCK: false },
    "./refresh-session": { refreshSession: async () => null },
    "./session": {},
  });
  const session = await bootstrapGuestSession();
  assert.equal(sent.dob, "dob");
  assert.match(sent.email, /@guest\.invalid$/);
  assert.doesNotMatch(sent.email, /gmail\.com/i);
  assert.equal(session.personId, "person");
  assert.equal(session.accessToken, "access");
  assert.equal(session.email, sent.email);
  assert.equal(session.authLevel, "guest");
});

test("switching profiles preserves other profiles' photos and measurement jobs", async () => {
  const { saveFlow, loadFlow } = flowStore();
  const expires = Date.now() + 60_000;
  await saveFlow({ key: "account:parent", expires, taskId: "parent-job" });
  await saveFlow({ key: "account:child", expires, photos: {
    front: new Blob(["front-photo"]), side: new Blob(["side-photo"]),
  } });
  assert.equal((await loadFlow("account:parent")).taskId, "parent-job");
  const child = await loadFlow("account:child");
  assert.ok(child, "Loading the parent must not delete the child's flow");
  assert.equal(await child.photos.front.text(), "front-photo");
  assert.equal(await child.photos.side.text(), "side-photo");
  assert.equal((await loadFlow("account:parent")).taskId, "parent-job");
});

test("a missing profile returns null without deleting valid flows; expired entries are removed", async () => {
  const { saveFlow, loadFlow } = flowStore();
  await saveFlow({ key: "expired", expires: Date.now() - 1, taskId: "old" });
  await saveFlow({ key: "valid", expires: Date.now() + 60_000, taskId: "current" });
  assert.equal(await loadFlow("missing"), null);
  assert.equal(await loadFlow("expired"), null);
  assert.equal((await loadFlow("valid")).taskId, "current");
});

function findElement(element: any, predicate: (node: any) => boolean): any {
  if (!element || typeof element !== "object") return;
  if (predicate(element)) return element;
  for (const child of [element.props?.children].flat()) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
}

for (const scenario of [
  { savedCountry: "", detectedCountry: "Nigeria", enteredCountry: "Nigeria" },
  { savedCountry: "Japan", detectedCountry: "Canada", enteredCountry: "Japan" },
  { savedCountry: "", detectedCountry: "", enteredCountry: "Brazil" },
]) {
  test(`country field accepts and saves ${scenario.enteredCountry}`, () => {
    let saved: any;
    let destination: string | undefined;
    const profile = { country: scenario.savedCountry };
    const { SizeAgeHeightView } = loadModule(
      "../../app/(webclient)/components/SizeAgeHeightView.tsx", {
        react: { useEffect() {}, useState: (initial: unknown) => [initial === null ? profile : initial, () => {}] },
        "next/navigation": { useRouter: () => ({ push: (path: string) => { destination = path; } }) },
        "../lib/size-flow": {},
        "../lib/commerce-events": { commerceEvent() {} },
        "../lib/size-profile": { saveSizeProfile: (value: unknown) => { saved = value; } },
        "./AccountSubHeader": { AccountSubHeader: () => null },
        "../shop.module.css": { default: {} },
        "../webclient.module.css": { default: {} },
      }, {
        FormData: class extends FormData {
          constructor(values: Record<string, string>) {
            super();
            for (const [key, value] of Object.entries(values)) this.set(key, value);
          }
        },
      },
    );
    const view = SizeAgeHeightView({ country: scenario.detectedCountry });
    const country = findElement(view, node => node.props?.name === "country");
    assert.equal(country.type, "input", "Country must allow values outside a fixed shortlist");
    assert.equal(country.props.required, true);
    assert.equal(country.props.autoComplete, "country-name");
    assert.equal(country.props.defaultValue, scenario.savedCountry || scenario.detectedCountry);
    const form = findElement(view, node => node.type === "form");
    form.props.onSubmit({ preventDefault() {}, currentTarget: {
      dob: "1990-01-01", height: "170", gender: "female",
      country: scenario.enteredCountry, city: "Test city", provinceState: "Test region",
    } });
    assert.equal(saved.country, scenario.enteredCountry);
    assert.equal(destination, "/account/size/capture");
  });
}

test("separate tabs atomically claim one generation job and reuse its result", async () => {
  const indexedDB = new IDBFactory();
  let posts = 0;
  const sessionFetch = async (url: string) => {
    if (url.endsWith("/session")) return { json: async () => ({ authenticated: true, accountId: "a", personId: "p" }) };
    posts++;
    await new Promise(resolve => setTimeout(resolve, 30));
    return { ok: true, json: async () => ({ taskId: "single-job" }) };
  };
  const tab = () => loadModule("../../app/(webclient)/lib/size-flow.ts", {
    "./session-client": { sessionFetch, ensureClientGuest: async () => {} }, "./size-profile": {},
  }, { indexedDB, FormData });
  const first = tab(), second = tab();
  await first.saveFlow({ key: "a:p", expires: Date.now() + 60_000, photos: {
    front: new Blob(["front"]), side: new Blob(["side"]),
    frontTask: "front", sideTask: "side", profile: { gender: "female" },
  } });
  const outcomes = await Promise.allSettled([first.startGeneration("a:p"), second.startGeneration("a:p")]);
  assert.equal(posts, 1, "Independent module maps must not permit duplicate requests");
  assert.ok(outcomes.some(result => result.status === "fulfilled"));
  assert.equal((await second.startGeneration("a:p")).taskId, "single-job");
  assert.equal(posts, 1, "Reloading the accepted job must not resubmit it");
});

test("an ambiguous network failure leaves a persistent claim for another tab", async () => {
  const indexedDB = new IDBFactory();
  let posts = 0;
  const tab = () => loadModule("../../app/(webclient)/lib/size-flow.ts", {
    "./session-client": { sessionFetch: async (url: string) => {
      if (url.endsWith("/session")) return { json: async () => ({ authenticated: true, accountId: "a", personId: "p" }) };
      posts++;
      throw new Error("Connection lost");
    }, ensureClientGuest: async () => {} }, "./size-profile": {},
  }, { indexedDB, FormData });
  const first = tab();
  await first.saveFlow({ key: "a:p", expires: Date.now() + 60_000, photos: {
    front: new Blob(["front"]), side: new Blob(["side"]),
    frontTask: "front", sideTask: "side", profile: { gender: "female" },
  } });
  await assert.rejects(first.startGeneration("a:p"), /Connection lost/);
  await assert.rejects(tab().startGeneration("a:p"), /previous submission/);
  assert.equal(posts, 1);
});

for (const scenario of [
  { accountId: "a", personId: "p", authenticated: true, restore: true },
  { accountId: "a", personId: "other", authenticated: true, restore: false },
  { accountId: "other", personId: "p", authenticated: true, restore: false },
  { accountId: "a", personId: "p", authenticated: false, restore: false },
]) {
  test(`purchase restoration requires matching authenticated identity: ${JSON.stringify(scenario)}`, async () => {
    const { readPurchaseIntentForProfile } = loadModule("../../app/(webclient)/lib/purchase-intent.ts", {
      "./commerce-events": {}, "./size-contract": { safeInternalPath: (path: string) => path },
      "./session-client": {
        sessionFetch: async () => ({ ok: true, json: async () => scenario }),
        ensureClientGuest: async () => {},
      },
    }, { sessionStorage: { getItem: () => JSON.stringify({
      accountId: "a", personId: "p", productId: "product", createdAt: Date.now(), returnTo: "/product/product",
    }) } });
    assert.equal(!!(await readPurchaseIntentForProfile("product")), scenario.restore);
    assert.equal(await readPurchaseIntentForProfile("different-product"), null);
  });
}
