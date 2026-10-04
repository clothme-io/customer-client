import test from "node:test";
import assert from "node:assert/strict";
import { publicAnalyticsConfig } from "../../src/lib/analytics/runtime-config.js";
import { GET, dynamic } from "../../app/api/analytics-config/route.js";
test("runtime configuration exposes only public analytics identifiers", () => {
  const config = publicAnalyticsConfig({
    MIXPANEL_TOKEN: "public-project",
    POSTHOG_KEY: "public-ingestion",
    RESEND_API_KEY: "private",
    DATABASE_URL: "private",
    MIXPANEL_SERVICE_ACCOUNT_SECRET: "private",
  });
  assert.deepEqual(config, {
    mixpanelToken: "public-project",
    mixpanelHost: "https://api-js.mixpanel.com",
    posthogKey: "public-ingestion",
    posthogHost: "https://us.i.posthog.com",
  });
});
test("runtime names take precedence; unsafe host URLs never expose credentials", () => {
  const config = publicAnalyticsConfig({
    MIXPANEL_TOKEN: "runtime",
    NEXT_PUBLIC_MIXPANEL_TOKEN: "legacy",
    MIXPANEL_API_HOST: "https://user:password@example.com",
    POSTHOG_HOST: "http://insecure.example.com",
  });
  assert.equal(config.mixpanelToken, "runtime");
  assert.equal(config.mixpanelHost, "https://api-js.mixpanel.com");
  assert.equal(config.posthogHost, "https://us.i.posthog.com");
  assert.equal(
    publicAnalyticsConfig({ NEXT_PUBLIC_MIXPANEL_TOKEN: "legacy" })
      .mixpanelToken,
    "legacy",
  );
});
test("endpoint reads environment at request time and cannot be statically cached", async () => {
  const original = process.env.MIXPANEL_TOKEN;
  try {
    process.env.MIXPANEL_TOKEN = "first";
    const response = await GET();
    assert.equal(dynamic, "force-dynamic");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal((await response.json()).mixpanelToken, "first");
    process.env.MIXPANEL_TOKEN = "updated";
    assert.equal((await (await GET()).json()).mixpanelToken, "updated");
  } finally {
    if (original === undefined) delete process.env.MIXPANEL_TOKEN;
    else process.env.MIXPANEL_TOKEN = original;
  }
});
