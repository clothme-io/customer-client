import test from "node:test";
import assert from "node:assert/strict";
import { getBodyPreviewWidths } from "../../src/lib/manualBodyPreview.js";

test("body shape changes the silhouette proportions", () => {
  const pear = getBodyPreviewWidths("pear", "female", "");
  const inverted = getBodyPreviewWidths("inverted_triangle", "female", "");
  const hourglass = getBodyPreviewWidths("hourglass", "female", "");
  assert.ok(pear.hips > pear.shoulders);
  assert.ok(inverted.shoulders > inverted.hips);
  assert.ok(hourglass.waist < hourglass.chest && hourglass.waist < hourglass.hips);
});

test("cup choice changes only a female chest preview", () => {
  assert.ok(getBodyPreviewWidths("rectangle", "female", "F").chest > getBodyPreviewWidths("rectangle", "female", "A").chest);
  assert.deepEqual(getBodyPreviewWidths("rectangle", "male", "F"), getBodyPreviewWidths("rectangle", "male", "A"));
});
