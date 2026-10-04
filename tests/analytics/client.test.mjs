import test from "node:test";
import assert from "node:assert/strict";
process.env.NEXT_PUBLIC_APP_ENV = "production";
const storage = () => {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
    clear: () => values.clear(),
  };
};
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
globalThis.window = new EventTarget();
window.location = { hostname: "clothme.io", pathname: "/shop", search: "" };
Object.defineProperty(globalThis, "navigator", {
  value: { doNotTrack: "0", globalPrivacyControl: false },
  configurable: true,
});
const {
  analytics,
  analyticsEnabled,
  pageView,
  setAnalyticsConsent,
  syncAnalyticsIdentity,
  resetAnalyticsIdentity,
} = await import("../../src/lib/analytics/client.js");
const { requestObservation } =
  await import("../../src/lib/analytics/requests.js");
const events = [];
const identities = [];
analytics.add("test", {
  track: (name, props) => events.push({ name, props }),
  identify: (id) => identities.push(id),
  reset: () => identities.push("reset"),
});
function reset() {
  localStorage.clear();
  sessionStorage.clear();
  events.length = 0;
  identities.length = 0;
  window.location.pathname = "/shop";
  window.location.search = "";
  navigator.doNotTrack = "0";
  navigator.globalPrivacyControl = false;
}
test("host, internal routes, consent and browser privacy signals gate capture", () => {
  reset();
  assert.equal(analyticsEnabled(), true);
  window.location.pathname = "/admin/creators";
  assert.equal(analyticsEnabled(), false);
  window.location.pathname = "/shop";
  navigator.globalPrivacyControl = true;
  assert.equal(analyticsEnabled(), false);
  navigator.globalPrivacyControl = false;
  setAnalyticsConsent(false);
  assert.equal(analyticsEnabled(), false);
  setAnalyticsConsent(true);
  assert.equal(analyticsEnabled(), true);
});
test("route remount and hash do not duplicate views, back navigation does; campaign persists without query secrets", () => {
  reset();
  window.location.search = "?utm_source=ad&token=secret";
  pageView("/shop");
  pageView("/shop");
  pageView("/shop#section");
  window.location.pathname = "/cart";
  window.location.search = "";
  pageView("/cart");
  window.location.pathname = "/shop";
  pageView("/shop");
  assert.equal(events.filter((e) => e.name === "page_view").length, 3);
  assert.equal(events.at(-1).props.utm_source, "ad");
  assert.ok(!JSON.stringify(events).includes("secret"));
});
test("request observations emit confirmed outcomes without request values", () => {
  reset();
  const done = requestObservation("/api/webclient/action", {
    method: "POST",
    body: JSON.stringify({
      action: "sendSupport",
      message: "very private text",
      email: "private@email.test",
    }),
  });
  done({ ok: true, status: 200 });
  assert.deepEqual(
    events.map((e) => e.name),
    ["request_started", "request_succeeded", "support_message_sent"],
  );
  assert.ok(!JSON.stringify(events).includes("private"));
  const fail = requestObservation("/api/webclient/action", {
    method: "POST",
    body: JSON.stringify({ action: "selectShipping" }),
  });
  fail({ ok: false, status: 500 });
  assert.equal(events.at(-1).name, "request_failed");
  assert.equal(events.filter((e) => e.name === "shipping_selected").length, 0);
});
test("a late identity response cannot identify a user after logout", async () => {
  reset();
  let resolve;
  globalThis.fetch = () =>
    new Promise((r) => {
      resolve = r;
    });
  const pending = syncAnalyticsIdentity();
  resetAnalyticsIdentity();
  resolve({
    ok: true,
    json: async () => ({ isRegistered: true, accountId: "old-account" }),
  });
  await pending;
  assert.ok(!identities.includes("old-account"));
});
