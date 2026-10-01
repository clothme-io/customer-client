import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSizeReply,
  safeInternalPath,
  hasSavedSizes,
} from "../../app/(webclient)/lib/size-contract.ts";

test("real validation and generation envelopes yield task IDs", () => {
  for (const operation of ["validate", "generate"] as const) {
    const reply = normalizeSizeReply(
      { status: 202, result: { task_id: "task-1" } },
      202,
      operation,
    );
    assert.equal(reply.taskId, "task-1");
    assert.equal(reply.state, "processing");
  }
});
test("legacy mock shapes cannot hide a missing task ID", () => {
  assert.equal(
    normalizeSizeReply({ task_id: "wrong-shape" }, 200, "validate").status,
    502,
  );
});
test("validation requires an explicit prediction, never falls back to input ID", () => {
  assert.equal(
    normalizeSizeReply(
      { status: 200, result: { prediction_id: "prediction" } },
      200,
      "validateResult",
    ).predictionId,
    "prediction",
  );
  assert.equal(
    normalizeSizeReply(
      { status: 200, result: { task_id: "task" } },
      200,
      "validateResult",
    ).state,
    "failed",
  );
});
test("generation unwraps the inner result and rejects incomplete success", () => {
  const rich = {
    measurements: { waist: { cm: 70 } },
    size_recommendations: { US_CAD: {} },
  };
  assert.deepEqual(
    normalizeSizeReply(
      { status: 200, result: { result: rich } },
      200,
      "generateResult",
    ).result,
    rich,
  );
  assert.equal(
    normalizeSizeReply({ status: 200, result: {} }, 200, "generateResult")
      .status,
    502,
  );
});
test("HTTP failures and string API errors remain failures", () => {
  assert.equal(
    normalizeSizeReply({ status: 200 }, 401, "generateResult").status,
    401,
  );
  assert.equal(
    normalizeSizeReply(
      { status: 400, error: "Retake side photo" },
      200,
      "validateResult",
    ).message,
    "Retake side photo",
  );
  assert.equal(
    normalizeSizeReply({ status: 202 }, 202, "generateResult").state,
    "processing",
  );
});
test("return paths cannot escape the app", () => {
  for (const bad of [
    "//evil.test",
    "/\\evil.test",
    "https://evil.test",
    "javascript:alert(1)",
    "/\nevil.test",
  ])
    assert.equal(safeInternalPath(bad), "/shop");
  assert.equal(
    safeInternalPath("/product/123?utm_source=ad"),
    "/product/123?utm_source=ad",
  );
});
test("readiness requires a saved primary size, not mock ok or old measurements", () => {
  assert.equal(hasSavedSizes({ ok: true }), false);
  assert.equal(
    hasSavedSizes({ tops: [{ size_label: "M", is_primary: false }] }),
    false,
  );
  assert.equal(
    hasSavedSizes({ tops: [{ size_label: "", is_primary: true }] }),
    false,
  );
  assert.equal(
    hasSavedSizes({ tops: [{ size_label: "M", is_primary: true }] }),
    true,
  );
});
