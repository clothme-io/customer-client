/**
 * BabyLoveGrowth.ai Webhook Endpoint
 *
 * Receives POST requests from BabyLoveGrowth when articles are published.
 * Payload (flat structure):
 *   { title, slug, content, featured_image, meta_title, meta_description, ... }
 *
 * Security: Bearer token, API key header, or Basic auth.
 */

import { NextResponse } from "next/server";
import { hasDatabase } from "../../../../server/db.mjs";
import { savePost, getPostBySlug } from "../../../../server/posts.mjs";
import { downloadAndUploadImage } from "../../../../server/webhooks/images.mjs";
import { transformToPostPayload, normalizeSlug } from "../../../../server/webhooks/transform.mjs";

const WEBHOOK_SECRET = process.env.BABYLOVEGROWTH_WEBHOOK_SECRET;

function verifyToken(request) {
  if (!WEBHOOK_SECRET) {
    console.warn("[webhooks/babylovegrowth] BABYLOVEGROWTH_WEBHOOK_SECRET not configured. Rejecting request.");
    return false;
  }

  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7) === WEBHOOK_SECRET;
  }

  // Check x-api-key header
  const apiKeyHeader = request.headers.get("x-api-key") || "";
  if (apiKeyHeader) {
    return apiKeyHeader === WEBHOOK_SECRET;
  }

  // Check Basic auth (username is ignored, password is the secret)
  if (authHeader.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
      const password = decoded.split(":").slice(1).join(":");
      return password === WEBHOOK_SECRET;
    } catch {
      return false;
    }
  }

  return false;
}

function normalizeBabyLoveGrowthArticle(payload) {
  return {
    title: payload.title || "",
    slug: payload.slug || "",
    content: payload.content || payload.html || payload.body || "",
    featuredImageUrl: payload.featured_image || payload.featuredImage || payload.image || "",
    metaTitle: payload.meta_title || payload.metaTitle || "",
    metaDescription: payload.meta_description || payload.metaDescription || "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    author: payload.author || "",
    faq: Array.isArray(payload.faq) ? payload.faq : []
  };
}

export async function POST(request) {
  // Verify authentication
  if (!verifyToken(request)) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing access token." },
      { status: 401 }
    );
  }

  // Check database availability
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "Service unavailable", message: "Database not configured." },
      { status: 503 }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Bad request", message: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  // BabyLoveGrowth sends articles either as a single object or within an array
  const articles = Array.isArray(payload.articles)
    ? payload.articles
    : Array.isArray(payload)
      ? payload
      : [payload];

  const results = [];

  for (const rawArticle of articles) {
    try {
      const article = normalizeBabyLoveGrowthArticle(rawArticle);
      const slug = normalizeSlug(article.slug, article.title);

      // Check if post already exists (idempotency)
      const existingPost = await getPostBySlug(slug, { admin: true });

      // Download and upload featured image to Bunny CDN
      const heroImageUrl = await downloadAndUploadImage(article.featuredImageUrl);

      // Transform to our post format
      const postPayload = transformToPostPayload(article, heroImageUrl);

      // If post exists, preserve its ID for update
      if (existingPost) {
        postPayload.id = existingPost.id;
      }

      const savedPost = await savePost(postPayload, "webhook:babylovegrowth");

      results.push({
        slug,
        status: existingPost ? "updated" : "created",
        id: savedPost?.id || null
      });

      console.log(`[webhooks/babylovegrowth] ${existingPost ? "Updated" : "Created"} post: ${slug}`);
    } catch (error) {
      console.error(`[webhooks/babylovegrowth] Error processing article: ${error.message}`);
      results.push({
        slug: rawArticle.slug || "unknown",
        status: "error",
        error: error.message
      });
    }
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    results
  });
}

// Reject non-POST requests
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed", message: "This endpoint only accepts POST requests." },
    { status: 405 }
  );
}
