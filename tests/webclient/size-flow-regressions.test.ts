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
