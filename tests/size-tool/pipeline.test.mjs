import test from "node:test";
import assert from "node:assert/strict";
import { createSizeToolRunner } from "../../src/lib/sizeToolPipeline.js";
import { mapGenerateResult } from "../../src/lib/sizeApiServer.js";
const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });
const input = () => ({
  frontFile: new Blob(["front"]),
  sideFile: new Blob(["side"]),
  heightCm: 170,
  profile: {
    dob: "1990-01-01",
    gender: "male",
    country: "Canada",
    city: "Vancouver",
    provinceState: "BC",
  },
  progress: {},
});
function harness({
  failPoll = false,
  failValidate = false,
  failedSubmit = false,
} = {}) {
  const calls = [];
  let pollFailed = false;
  const fetcher = async (url, options = {}) => {
    calls.push({ url, ...options });
    if (url === "/api/webclient/session")
      return reply(
        options.method
          ? { ok: true }
          : { authenticated: true, accountId: "a", personId: "p" },
      );
    if (url === "/api/size-tool/validate")
      return failValidate
        ? reply({ message: "Invalid photo" }, 422)
        : reply({ state: "processing", taskId: options.body.get("pose") }, 202);
    if (url.startsWith("/api/size-tool/validate-result"))
      return reply({
        state: "complete",
        predictionId: url.includes("front")
          ? "front-prediction"
          : "side-prediction",
      });
    if (url === "/api/size-tool/generate") {
      if (failedSubmit) throw new Error("network lost");
      return reply({ state: "processing", taskId: "generation-1" }, 202);
    }
    if (failPoll && !pollFailed) {
      pollFailed = true;
      throw new Error("poll network lost");
    }
    return reply({
      state: "complete",
      result: { size: "M", confidence: null },
    });
  };
  return {
    calls,
    run: createSizeToolRunner({
      fetcher,
      compress: async (file) => file,
      pause: async () => {},
    }),
  };
}
test("homepage sends actual profile, prediction IDs and both images in one generation POST", async () => {
  const h = harness();
  assert.equal((await h.run(input())).size, "M");
  const writes = h.calls.filter((c) => c.url === "/api/size-tool/generate");
  assert.equal(writes.length, 1);
  const body = writes[0].body;
  assert.ok(body instanceof FormData);
  assert.equal(body.get("frontTaskId"), "front-prediction");
  assert.equal(body.get("sideTaskId"), "side-prediction");
  assert.equal(body.get("gender"), "male");
  assert.equal(body.get("dob"), "1990-01-01");
  assert.equal(body.get("height"), "170");
  assert.ok(body.get("frontImage") instanceof Blob);
  assert.ok(body.get("sideImage") instanceof Blob);
  assert.ok(
    h.calls.some(
      (c) =>
        c.url === "/api/size-tool/generate?taskId=generation-1" && !c.method,
    ),
  );
});
test("retry after polling failure reuses generation job instead of posting photos again", async () => {
  const h = harness({ failPoll: true }),
    params = input();
  await assert.rejects(h.run(params), /poll network lost/);
  await h.run(params);
  assert.equal(
    h.calls.filter((c) => c.url === "/api/size-tool/generate").length,
    1,
  );
});
test("validation rejection stops generation and preserves caller-owned photos", async () => {
  const h = harness({ failValidate: true }),
    params = input();
  await assert.rejects(h.run(params), /Invalid photo/);
  assert.ok(params.frontFile instanceof Blob);
  assert.equal(
    h.calls.filter((c) => c.url === "/api/size-tool/generate").length,
    0,
  );
});
test("ambiguous generation submission is not automatically duplicated", async () => {
  const h = harness({ failedSubmit: true }),
    params = input();
  await assert.rejects(h.run(params), /network lost/);
  await assert.rejects(h.run(params), /previous submission/);
  assert.equal(
    h.calls.filter((c) => c.url === "/api/size-tool/generate").length,
    1,
  );
});
test("result mapping uses regular fit and never invents confidence", () => {
  const result = mapGenerateResult({
    size_recommendations: {
      US_CAD: { tops: { fitted: { size: "S" }, regular: { size: "M" } } },
    },
  });
  assert.equal(result.size, "M");
  assert.equal(result.confidence, null);
});
