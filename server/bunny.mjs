import path from "node:path";

function bunnyRegionHost() {
  const region = process.env.BUNNY_STORAGE_REGION || "";
  return region ? `${region}.storage.bunnycdn.com` : "storage.bunnycdn.com";
}

export function hasBunnyConfig() {
  return Boolean(process.env.BUNNY_STORAGE_ZONE && process.env.BUNNY_STORAGE_API_KEY && process.env.BUNNY_CDN_BASE_URL);
}

export async function uploadToBunny(file) {
  if (!hasBunnyConfig()) {
    throw new Error("Bunny.net is not configured.");
  }

  const extension = path.extname(file.originalname || "") || ".jpg";
  const safeBase = path
    .basename(file.originalname || "blog-image", extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const fileName = `${Date.now()}-${safeBase || "blog-image"}${extension}`;
  const remotePath = `blog/${fileName}`;
  const storageUrl = `https://${bunnyRegionHost()}/${process.env.BUNNY_STORAGE_ZONE}/${remotePath}`;

  const response = await fetch(storageUrl, {
    method: "PUT",
    headers: {
      AccessKey: process.env.BUNNY_STORAGE_API_KEY,
      "Content-Type": file.mimetype || "application/octet-stream"
    },
    body: file.buffer
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Bunny upload failed: ${response.status} ${message}`);
  }

  return `${process.env.BUNNY_CDN_BASE_URL.replace(/\/$/, "")}/${remotePath}`;
}
