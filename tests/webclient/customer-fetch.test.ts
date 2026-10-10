import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadApi(fetchImpl: typeof fetch) {
  const source = readFileSync(
    new URL("../../app/(webclient)/lib/api.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const module = { exports: {} as any };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    fetch: fetchImpl,
    AbortSignal,
    setTimeout,
    require: (name: string) => {
      if (name === "./config")
        return {
          CUSTOMER_API_URL: "https://api.test",
          PERSON_ID_HEADER: "X-Person-Id",
          WEBCLIENT_MOCK: false,
        };
      if (name === "./mock") return { mockApiResponse() {} };
      return require(name);
    },
  });
  return module.exports;
}

test("customerFetch retries a 429 and then returns the catalog payload", async () => {
  let calls = 0;
  const { customerFetch } = loadApi(async () => {
    calls += 1;
    if (calls < 3) {
      return {
        ok: false,
        status: 429,
        headers: { get: () => null },
        json: async () => ({
          status: 429,
          error: { message: "Too Many Requests" },
        }),
      } as any;
    }
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ result: { items: [{ id: "p1" }] } }),
    } as any;
  });
  const data = await customerFetch("/v1/catalog/products");
  assert.equal(calls, 3);
  assert.deepEqual(data, { items: [{ id: "p1" }] });
});

test("isTooManyRequests matches 429 envelope errors", () => {
  const { CustomerApiError, isTooManyRequests } = loadApi(async () => {
    throw new Error("unused");
  });
  assert.equal(isTooManyRequests(new CustomerApiError("Too Many Requests", 429)), true);
  assert.equal(isTooManyRequests(new CustomerApiError("Nope", 400)), false);
});
