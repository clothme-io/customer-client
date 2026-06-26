/**
 * Download external images and upload them to Bunny CDN.
 */

import crypto from "node:crypto";
import path from "node:path";

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION;
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_CDN_BASE_URL = process.env.BUNNY_CDN_BASE_URL;

function getBunnyStorageHost() {
  if (!BUNNY_STORAGE_REGION || BUNNY_STORAGE_REGION === "de") {
    return "storage.bunnycdn.com";
  }
  return `${BUNNY_STORAGE_REGION}.storage.bunnycdn.com`;
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"].includes(ext)) {
      return ext;
    }
  } catch {
    // ignore
  }
  return ".jpg";
}

function getExtensionFromContentType(contentType) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/svg+xml": ".svg"
  };
  return map[contentType] || null;
}

/**
 * Downloads an image from `imageUrl`, uploads it to Bunny CDN under
 * `blog-images/`, and returns the public CDN URL.
 *
 * Returns `null` if the image cannot be downloaded or uploaded, or if
 * Bunny CDN is not configured.
 */
export async function downloadAndUploadImage(imageUrl) {
  if (!imageUrl) return null;
  if (!BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_API_KEY || !BUNNY_CDN_BASE_URL) {
    console.warn("[webhooks/images] Bunny CDN not configured. Storing external URL directly.");
    return imageUrl;
  }

  try {
    // Download the image
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "ClothME-Webhook/1.0" },
      signal: AbortSignal.timeout(30_000)
    });

    if (!response.ok) {
      console.error(`[webhooks/images] Failed to download image: ${response.status} ${imageUrl}`);
      return imageUrl;
    }

    const contentType = response.headers.get("content-type") || "";
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Generate a unique filename
    const hash = crypto.createHash("sha256").update(imageBuffer).digest("hex").slice(0, 16);
    const ext = getExtensionFromContentType(contentType) || getExtensionFromUrl(imageUrl);
    const filename = `${hash}${ext}`;
    const storagePath = `blog-images/${filename}`;

    // Upload to Bunny CDN
    const storageHost = getBunnyStorageHost();
    const uploadUrl = `https://${storageHost}/${BUNNY_STORAGE_ZONE}/${storagePath}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_STORAGE_API_KEY,
        "Content-Type": "application/octet-stream"
      },
      body: imageBuffer,
      signal: AbortSignal.timeout(30_000)
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => "");
      console.error(`[webhooks/images] Bunny upload failed: ${uploadResponse.status} ${errorText}`);
      return imageUrl;
    }

    // Return the public CDN URL
    const cdnUrl = `${BUNNY_CDN_BASE_URL.replace(/\/$/, "")}/${storagePath}`;
    console.log(`[webhooks/images] Uploaded: ${cdnUrl}`);
    return cdnUrl;
  } catch (error) {
    console.error(`[webhooks/images] Error processing image: ${error.message}`);
    return imageUrl;
  }
}
