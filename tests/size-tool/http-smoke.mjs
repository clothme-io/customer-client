// Starts isolated local customer/size stubs. No real accounts or photos are sent.
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
const origin = "http://localhost:3112",
  upstream = "http://127.0.0.1:3113";
const calls = [];
const failures = [];
const stub = http.createServer(async (req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  try {
    const url = new URL(req.url, upstream);
    calls.push(`${req.method} ${url.pathname}`);
    if (url.pathname === "/v1/account/setup")
      return send(200, {
        accountId: "test-account",
        accountUserId: "test-person",
        accessToken: "test-access",
        refreshToken: "test-refresh",
      });
    assert.equal(req.headers.authorization, "Bearer test-access");
    assert.equal(req.headers["x-token"], "test-size-token");
    assert.equal(req.headers["x-account-id"], "test-account");
    assert.equal(req.headers["x-person-id"], "test-person");
    if (req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const request = new Request(new URL(req.url, upstream), {
        method: "POST",
        headers: req.headers,
        body: Buffer.concat(chunks),
      });
      const form = await request.formData();
      assert.equal(form.get("dob"), "1990-01-01");
      assert.equal(form.get("gender"), "male");
      assert.equal(form.get("city"), "Vancouver");
      if (
        url.pathname === "/validate-front" ||
        url.pathname === "/validate-side"
      ) {
        assert.ok(form.get("image").size > 0);
        return send(202, {
          status: 202,
          result: { task_id: url.pathname.slice(1) },
        });
      }
      assert.equal(url.pathname, "/generate/v1/size");
      assert.equal(form.get("frontTaskId"), "front-prediction");
      assert.equal(form.get("sideTaskId"), "side-prediction");
      assert.ok(form.get("frontImage").size > 0);
      assert.ok(form.get("sideImage").size > 0);
      return send(202, { status: 202, result: { task_id: "generation" } });
    }
    if (url.pathname.startsWith("/validate-"))
      return send(200, {
        status: 200,
        result: {
          prediction_id: url.pathname.includes("front")
            ? "front-prediction"
            : "side-prediction",
        },
      });
    assert.equal(url.pathname, "/generate/v1/size/generation");
    return send(200, {
      status: 200,
      result: {
        task_id: "generation",
        result: {
          measurements: { waist: { cm: 80 } },
          size_recommendations: {
            US_CAD: { tops: { regular: { size: "M" } } },
          },
        },
      },
    });
  } catch (error) {
    failures.push(error.message);
    send(500, { error: { message: error.message } });
  }
});
await new Promise((resolve) => stub.listen(3113, "127.0.0.1", resolve));
let logs = "";
const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "-H", "localhost", "-p", "3112"],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_WEBCLIENT_MOCK: "0",
      CUSTOMER_API_URL: upstream,
      SIZE_API_URL: upstream,
      SIZE_API_TOKEN: "test-size-token",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
app.stdout.on("data", (d) => {
  logs += d.toString();
});
app.stderr.on("data", (d) => {
  logs += d.toString();
});
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(origin + "/api/webclient/session")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "local app startup failed");
  let cookie = "";
  async function request(path, options = {}) {
    const r = await fetch(origin + path, {
      ...options,
      headers: { ...options.headers, cookie },
    });
    const set = r.headers.getSetCookie();
    if (set.length) cookie = set.map((s) => s.split(";")[0]).join("; ");
    const body = await r.json();
    assert.ok(r.ok, JSON.stringify(body));
    return body;
  }
  await request("/api/webclient/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "guest" }),
  });
  const profile = {
    height: "170",
    dob: "1990-01-01",
    gender: "male",
    genderDemography: "male",
    country: "Canada",
    provinceState: "BC",
    city: "Vancouver",
    weight: "",
  };
  function form() {
    const f = new FormData();
    for (const [k, v] of Object.entries(profile)) f.set(k, v);
    return f;
  }
  const predictions = {};
  for (const pose of ["front", "side"]) {
    const f = form();
    f.set("pose", pose);
    f.set(
      "image",
      new Blob(["synthetic-test"], { type: "image/jpeg" }),
      "photo.jpg",
    );
    const queued = await request("/api/size-tool/validate", {
      method: "POST",
      body: f,
    });
    const result = await request(
      `/api/size-tool/validate-result?pose=${pose}&taskId=${queued.taskId}`,
    );
    predictions[pose] = result.predictionId;
  }
  const f = form();
  for (const pose of ["front", "side"]) {
    f.set(`${pose}TaskId`, predictions[pose]);
    f.set(
      `${pose}Image`,
      new Blob(["synthetic-test"], { type: "image/jpeg" }),
      `${pose}.jpg`,
    );
  }
  const queued = await request("/api/size-tool/generate", {
    method: "POST",
    body: f,
  });
  const result = await request(
    `/api/size-tool/generate?taskId=${queued.taskId}`,
  );
  assert.equal(result.result.size, "M");
  assert.equal(result.result.confidence, null);
  assert.deepEqual(failures, []);
  assert.deepEqual(calls, [
    "POST /v1/account/setup",
    "POST /validate-front",
    "GET /validate-front-result/validate-front",
    "POST /validate-side",
    "GET /validate-side-result/validate-side",
    "POST /generate/v1/size",
    "GET /generate/v1/size/generation",
  ]);
  console.log(
    "PASS: homepage HTTP routes use mobile paths, session headers, multipart photos, result envelopes and GET polling",
  );
} finally {
  app.kill("SIGTERM");
  await new Promise((resolve) => app.once("exit", resolve));
  await new Promise((resolve) => stub.close(resolve));
}
