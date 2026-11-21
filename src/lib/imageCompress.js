/**
 * Resize website sizing photos, preserving the backend's minimum resolution.
 * The 1600px long-edge target yields to the 720px minimum short edge.
 * Returns a new File; does not use localStorage/sessionStorage.
 */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const MIN_SHORT_EDGE = 720;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function sizingImageDimensions(width, height, maxEdge = MAX_EDGE) {
  if (![width, height, maxEdge].every((n) => Number.isFinite(n) && n > 0)) {
    throw new Error("Could not read the photo dimensions. Please choose another photo.");
  }
  const shortEdge = Math.min(width, height);
  if (shortEdge < MIN_SHORT_EDGE) {
    throw new Error("This photo is too small. Upload the original photo with both sides at least 720 pixels. Please avoid thumbnails or cropped screenshots.");
  }
  // Never upscale, crop or stretch. Preserve more original detail for narrow photos.
  const scale = Math.min(1, Math.max(maxEdge / Math.max(width, height), MIN_SHORT_EDGE / shortEdge));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function compressImageFile(file, { maxEdge = MAX_EDGE, quality = JPEG_QUALITY } = {}) {
  if (!file || !(file instanceof Blob)) {
    throw new Error("Invalid image file");
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  let canvas;
  try {
    const { width, height } = sizingImageDimensions(bitmap.width, bitmap.height, maxEdge);
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image");
    ctx.drawImage(bitmap, 0, 0, width, height);
  } finally {
    bitmap.close();
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Image compression failed"))),
      "image/jpeg",
      quality
    );
  });

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("This photo is too large to upload without losing detail. Please choose another original photo; the upload limit is 8 MB.");
  }

  const baseName = String(file.name || "photo").replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
