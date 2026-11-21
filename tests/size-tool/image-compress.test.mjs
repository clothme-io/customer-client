import test from "node:test";
import assert from "node:assert/strict";
import { compressImageFile, sizingImageDimensions } from "../../src/lib/imageCompress.js";

test("ordinary photos keep the previous compression dimensions", () => {
  for (const [width, height] of [[3024, 4032], [4032, 3024], [1600, 1600], [900, 1600], [720, 720]]) {
    const scale = Math.min(1, 1600 / Math.max(width, height));
    assert.deepEqual(sizingImageDimensions(width, height), {
      width: Math.round(width * scale), height: Math.round(height * scale),
    });
  }
});

test("narrow photos preserve 720 pixels on the short edge in either orientation", () => {
  assert.deepEqual(sizingImageDimensions(1080, 2560), { width: 720, height: 1707 });
  assert.deepEqual(sizingImageDimensions(2560, 1080), { width: 1707, height: 720 });
  assert.deepEqual(sizingImageDimensions(720, 2400), { width: 720, height: 2400 });
});

test("undersized originals are rejected instead of enlarged", () => {
  for (const [width, height] of [[719, 1600], [1600, 719], [300, 600]]) {
    assert.throws(() => sizingImageDimensions(width, height), /original photo.*720 pixels/);
  }
});

test("resizing never upscales and keeps proportions within pixel rounding", () => {
  for (const width of [720, 721, 1080, 3024, 8000]) {
    for (const height of [720, 721, 1600, 2560, 6000]) {
      const result = sizingImageDimensions(width, height);
      assert.ok(Math.min(result.width, result.height) >= 720);
      assert.ok(result.width <= width && result.height <= height);
      assert.ok(Math.abs(result.width * height - result.height * width) <= (width + height) / 2);
    }
  }
});

function browserStub(t, width, height, output = new Blob(["jpeg"], { type: "image/jpeg" })) {
  let closed = false;
  const draws = [];
  const bitmap = { width, height, close() { closed = true; } };
  t.mock.method(globalThis, "createImageBitmap", async (_file, options) => {
    assert.deepEqual(options, { imageOrientation: "from-image" });
    return bitmap;
  });
  t.mock.method(globalThis.document, "createElement", (tag) => {
    assert.equal(tag, "canvas");
    return {
      getContext: () => ({ drawImage: (...args) => draws.push(args) }),
      toBlob(callback, type, quality) {
        assert.equal(type, "image/jpeg");
        assert.equal(quality, 0.82);
        callback(output);
      },
    };
  });
  return { draws, closed: () => closed };
}

// Browser primitives are stubbed only at the decode/canvas boundary.
globalThis.createImageBitmap = async () => {};
globalThis.document = { createElement() {} };

test("compression draws the entire oriented image and preserves JPEG quality", async (t) => {
  const browser = browserStub(t, 2560, 1080);
  const file = await compressImageFile(new File(["source"], "side.png"));
  assert.equal(file.name, "side.jpg");
  assert.equal(file.type, "image/jpeg");
  assert.deepEqual(browser.draws[0].slice(1), [0, 0, 1707, 720]);
  assert.equal(browser.closed(), true);
});

test("rejected small photos release the bitmap without drawing", async (t) => {
  const browser = browserStub(t, 719, 1600);
  await assert.rejects(compressImageFile(new File(["source"], "front.jpg")), /720 pixels/);
  assert.equal(browser.closed(), true);
  assert.equal(browser.draws.length, 0);
});

test("oversized output is rejected rather than reducing detail further", async (t) => {
  browserStub(t, 720, 6000, new Blob([new Uint8Array(8 * 1024 * 1024 + 1)]));
  await assert.rejects(compressImageFile(new File(["source"], "front.jpg")), /8 MB/);
});
