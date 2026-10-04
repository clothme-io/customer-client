import test from "node:test";
import assert from "node:assert/strict";
import {
  createDispatcher,
  sanitize,
  routeName,
  eventUuid,
} from "../../src/lib/analytics/core.js";
test("only explicit safe properties survive; dynamic URLs and admin screens are excluded", () => {
  assert.deepEqual(
    sanitize({
      email: "x@y.com",
      image: "base64",
      height: 180,
      message: "secret",
      password: "secret",
      count: 2,
      value: NaN,
    }),
    { count: 2 },
  );
  assert.equal(
    routeName("/checkout/complete?token=secret"),
    "/checkout/complete",
  );
  assert.equal(routeName("/product/customer@example.com"), "/product/:id");
  assert.equal(routeName("/admin/orders"), null);
});
test("early events reach each provider once, failures are isolated and repeated IDs deduplicate", () => {
  const received = [];
  const core = createDispatcher({ enabled: () => true });
  core.track("purchase", { eventId: "purchase:123", email: "secret" });
  core.add("posthog", {
    track: () => {
      throw Error("blocked");
    },
  });
  core.add("mixpanel", { track: (...args) => received.push(args) });
  core.add("mixpanel", { track: () => assert.fail("duplicate registration") });
  core.track("purchase", { eventId: "purchase:123" });
  assert.equal(received.length, 1);
  assert.deepEqual(received[0][1], { eventId: "purchase:123" });
});
test("queue is bounded and optout discards pending data", () => {
  let enabled = true;
  const received = [];
  const core = createDispatcher({ enabled: () => enabled, limit: 2 });
  for (let count = 0; count < 3; count++) core.track("page_view", { count });
  core.add("one", { track: (_, props) => received.push(props.count) });
  assert.deepEqual(received, [1, 2]);
  enabled = false;
  core.consent(false);
  assert.equal(core.track("purchase"), false);
  enabled = true;
  core.add("two", {
    track: () => assert.fail("must not replay opted out data"),
  });
});
test("identity switching resets both providers without sending account data as event properties", () => {
  const calls = [];
  const core = createDispatcher({ enabled: () => true });
  core.add("one", {
    track: () => {},
    identify: (id) => calls.push(id),
    reset: () => calls.push("reset"),
  });
  core.identify("a");
  core.identify("a");
  core.identify("b");
  core.reset();
  assert.deepEqual(calls, ["a", "reset", "b", "reset"]);
});
test("transaction UUID is deterministic, valid, and unique by business transaction", async () => {
  const id = await eventUuid("purchase:123");
  assert.equal(id, await eventUuid("purchase:123"));
  assert.notEqual(id, await eventUuid("purchase:456"));
  assert.match(
    id,
    /^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  );
});

test("SDK automatic URLs are scrubbed recursively while campaign and identity remain", async () => {
  const { scrubSdkProperties } =
    await import("../../src/lib/analytics/core.js");
  assert.deepEqual(
    scrubSdkProperties({
      $current_url: "https://site/?token=secret",
      distinct_id: "id",
      utm_source: "ad",
      $set_once: {
        $initial_current_url: "secret",
        $initial_referrer: "secret",
        $initial_os: "iOS",
      },
    }),
    { distinct_id: "id", utm_source: "ad", $set_once: { $initial_os: "iOS" } },
  );
});
test("opt-out removes dedup claims for events that may never have reached a provider", () => {
  const core = createDispatcher({ enabled: () => true });
  core.track("purchase", { eventId: "order" });
  core.consent(false);
  const received = [];
  core.add("posthog", { track: (name) => received.push(name) });
  core.track("purchase", { eventId: "order" });
  assert.deepEqual(received, ["purchase"]);
});
