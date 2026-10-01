// Run only against a local server explicitly reporting mock mode.
import assert from "node:assert/strict";
const origin = process.env.WEBCLIENT_TEST_ORIGIN || "http://localhost:3101";
assert.ok(
  new URL(origin).hostname === "localhost" ||
    new URL(origin).hostname === "127.0.0.1",
);
const html = await (await fetch(`${origin}/shop`)).text();
assert.ok(
  html.includes("Preview data"),
  "Refusing to submit test data to a live API configuration",
);
let cookie = "";
async function request(path, options = {}) {
  const response = await fetch(origin + path, {
    ...options,
    headers: { ...options.headers, ...(cookie ? { cookie } : {}) },
  });
  const set = response.headers.getSetCookie();
  if (set.length) cookie = set.map((value) => value.split(";")[0]).join("; ");
  return { response, body: await response.json() };
}
const post = (path, body) =>
  request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
assert.equal((await request("/api/webclient/fit-profile")).body.ready, false);
assert.equal(
  (
    await post("/api/webclient/action", {
      action: "addToCart",
      variantId: "test",
      quantity: 1,
    })
  ).body.code,
  "FIT_PROFILE_REQUIRED",
);
const profile = {
  dob: "1990-01-01",
  height: "170",
  gender: "female",
  country: "Canada",
  city: "Vancouver",
  provinceState: "BC",
  weight: "",
};
async function validate(pose) {
  const form = new FormData();
  for (const [key, value] of Object.entries(profile)) form.set(key, value);
  form.set("action", pose === "front" ? "validateFront" : "validateSide");
  form.set(
    "image",
    new Blob(["mock-image"], { type: "image/jpeg" }),
    "pose.jpg",
  );
  const queued = await request("/api/webclient/size", {
    method: "POST",
    body: form,
  });
  assert.equal(queued.response.status, 202);
  assert.ok(queued.body.receipt);
  const complete = await request(
    `/api/webclient/size?action=validateResult&type=${pose}&id=${queued.body.taskId}`,
    { headers: { "X-Size-Receipt": queued.body.receipt } },
  );
  assert.equal(complete.body.state, "complete");
  return complete.body;
}
const front = await validate("front"),
  side = await validate("side");
const form = new FormData();
for (const [key, value] of Object.entries(profile)) form.set(key, value);
form.set("action", "generate");
for (const [pose, validation] of [
  ["front", front],
  ["side", side],
]) {
  form.set(`${pose}TaskId`, validation.predictionId);
  form.set(`${pose}Receipt`, validation.receipt);
  form.set(
    `${pose}Image`,
    new Blob(["mock-image"], { type: "image/jpeg" }),
    `${pose}.jpg`,
  );
}
const generated = await request("/api/webclient/size", {
  method: "POST",
  body: form,
});
assert.equal(generated.response.status, 202);
const ticket = generated.body;
const rejected = await request(
  `/api/webclient/size?action=generateResult&id=${ticket.taskId}`,
  { headers: { "X-Size-Receipt": ticket.receipt + "tampered" } },
);
assert.ok(rejected.response.status >= 400);
const result = await request(
  `/api/webclient/size?action=generateResult&id=${ticket.taskId}`,
  { headers: { "X-Size-Receipt": ticket.receipt } },
);
assert.equal(result.body.state, "complete");
assert.ok(result.body.result.measurements.waist);
assert.equal(
  (await request("/api/webclient/fit-profile")).body.ready,
  false,
  "Generation alone must not mark a profile saved",
);
const saved = await post("/api/webclient/fit-profile/save", {
  taskId: ticket.taskId,
  receipt: ticket.receipt,
});
assert.equal(saved.body.ready, true);
assert.equal((await request("/api/webclient/fit-profile")).body.ready, true);
assert.equal(
  (
    await post("/api/webclient/action", {
      action: "addToCart",
      variantId: "test",
      quantity: 1,
    })
  ).response.status,
  200,
);
console.log(
  "PASS: purchase gate → signed validation → generation → save → purchase, with tampered receipts rejected",
);
