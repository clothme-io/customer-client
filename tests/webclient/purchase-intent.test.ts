import test from "node:test";
import assert from "node:assert/strict";
// Stock is authoritative: ensure tests exercise selection separately from JSX.
import { selectVariant } from "../../app/(webclient)/lib/variant-selection.ts";
test("selection requires a real in-stock location/color/size combination", () => {
  const locations = [
    {
      id: "a",
      colors: [
        {
          id: "red",
          sizes: [{ variantId: "v1", sizeLabel: "M", quantity: 1 }],
        },
      ],
    },
    {
      id: "b",
      colors: [
        {
          id: "blue",
          sizes: [{ variantId: "v2", sizeLabel: "S", quantity: 0 }],
        },
      ],
    },
  ];
  assert.equal(selectVariant(locations, "a", "red", "M")?.variantId, "v1");
  assert.equal(selectVariant(locations, "b", "red", "M"), null);
  assert.equal(selectVariant(locations, "b", "blue", "S"), null);
});
