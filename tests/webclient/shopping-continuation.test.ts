import test from "node:test";
import assert from "node:assert/strict";
import {
  captureReferral,
  readReferrals,
  REFERRAL_TTL,
} from "../../src/lib/referral.js";
import {
  continuationInput,
  mobileLink,
} from "../../app/(webclient)/lib/continuation-contract.ts";
const code = "a".repeat(43);
test("product referral survives navigation and refresh without renewing attribution", () => {
  const url = new URL(`https://clothme.io/product/item?c=${code}`);
  const captured = captureReferral(url, undefined, 1000);
  assert.equal(readReferrals(captured, 1100)[0].code, code);
  assert.equal(captureReferral(url, captured, 1200), null);
  assert.equal(
    captureReferral(new URL("https://clothme.io/shop"), captured, 1200),
    null,
  );
  assert.equal(readReferrals(captured, 1000 + REFERRAL_TTL).length, 0);
});
test("invalid, future and oversized referral inputs cannot become claims", () => {
  assert.equal(
    captureReferral(new URL("https://clothme.io/product/x?c=invalid"), null),
    null,
  );
  assert.deepEqual(readReferrals("{}"), []);
  assert.deepEqual(
    readReferrals(
      JSON.stringify([{ type: "product", code, receivedAt: 2000 }]),
      1000,
    ),
    [],
  );
  assert.equal(
    readReferrals(
      JSON.stringify(
        Array.from({ length: 50 }, () => ({
          type: "product",
          code,
          receivedAt: 1000,
        })),
      ),
      1100,
    ).length,
    12,
  );
});
test("campaign and product attribution remain distinct", () => {
  const value = captureReferral(
    new URL(`https://clothme.io/creator-campaign/${code}`),
    undefined,
    1000,
  );
  assert.equal(readReferrals(value, 1100)[0].type, "creator-campaign");
});
test("continuations allow only selection fields, never credentials or a return URL", () => {
  assert.deepEqual(
    continuationInput({
      productId: "item",
      colorId: "red",
      locationId: "store",
      quantity: 999,
      accessToken: "secret",
      returnTo: "https://evil.test",
    }),
    { productId: "item", colorId: "red", locationId: "store", quantity: 20 },
  );
  assert.throws(() => continuationInput({ productId: "../account" }));
  assert.throws(() => continuationInput(null));
});
test("Airbridge preserves opaque destination through store fallback", () => {
  const destination = `clothme://continue/${code}`;
  const fallback = `https://clothme.io/continue/${code}`;
  const link = new URL(mobileLink(destination, fallback, "web-shop"));
  assert.equal(link.searchParams.get("deeplink_url"), destination);
  assert.equal(link.searchParams.get("fallback_ios"), "itunes-appstore");
  assert.equal(link.searchParams.get("fallback_android"), "google-play");
  assert.equal(link.searchParams.get("fallback_desktop"), fallback);
  assert.throws(() => mobileLink(destination, fallback, ""));
  assert.throws(() => mobileLink(destination, fallback, "../../evil"));
});
