/**
 * Outrank.so Webhook Endpoint
 *
 * Receives POST requests from Outrank when articles are published or updated.
 * Payload envelope:
 *   { event_type: "publish_articles" | "update_article", timestamp, data: { articles: [...] } }
 *
 * Each article includes HTML + Markdown content, title, slug, featured image, meta, tags.
 * Security: Access token verified via Authorization header or x-access-token header.
 */

import { NextResponse } from "next/server";
import { hasDatabase } from "../../../../server/db.mjs";
import { savePost, getPostBySlug } from "../../../../server/posts.mjs";
import { downloadAndUploadImage } from "../../../../server/webhooks/images.mjs";
import { transformToPostPayload, normalizeSlug } from "../../../../server/webhooks/transform.mjs";

const WEBHOOK_SECRET = process.env.OUTRANK_WEBHOOK_SECRET;

function verifyToken(request) {
  if (!WEBHOOK_SECRET) {
    console.warn("[webhooks/outrank] OUTRANK_WEBHOOK_SECRET not configured. Rejecting request.");
    return false;
  }

  // Check Authorization header (Bearer token) or x-access-token header
  const authHeader = request.headers.get("authorization") || "";
  const accessTokenHeader = request.headers.get("x-access-token") || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7) === WEBHOOK_SECRET;
  }

  if (accessTokenHeader) {
    return accessTokenHeader === WEBHOOK_SECRET;
  }

  return false;
}

function normalizeOutrankArticle(article) {
  // Outrank provides both HTML and Markdown — we use HTML for our sections parser
  return {
    title: article.title || "",
    slug: article.slug || "",
    content: article.html || article.content || article.body || "",
    featuredImageUrl: article.featured_image || article.featuredImage || article.image || "",
    metaTitle: article.meta_title || article.metaTitle || article.seo_title || "",
    metaDescription: article.meta_description || article.metaDescription || article.seo_description || "",
    tags: Array.isArray(article.tags) ? article.tags : (article.keywords || []),
    author: article.author || "",
    faq: Array.isArray(article.faq) ? article.faq : []
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

  const { event_type, data } = payload;

  if (!event_type || !data) {
    return NextResponse.json(
      { error: "Bad request", message: "Missing event_type or data in payload." },
      { status: 400 }
    );
  }

  // Support both publish_articles (array) and update_article (single or array)
  const articles = Array.isArray(data.articles)
    ? data.articles
    : data.article
      ? [data.article]
      : [];

  if (articles.length === 0) {
    return NextResponse.json(
      { error: "Bad request", message: "No articles found in payload." },
      { status: 400 }
    );
  }

  const results = [];

  for (const rawArticle of articles) {
    try {
      const article = normalizeOutrankArticle(rawArticle);
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

      const savedPost = await savePost(postPayload, "webhook:outrank");

      results.push({
        slug,
        status: existingPost ? "updated" : "created",
        id: savedPost?.id || null
      });

      console.log(`[webhooks/outrank] ${existingPost ? "Updated" : "Created"} post: ${slug}`);
    } catch (error) {
      console.error(`[webhooks/outrank] Error processing article: ${error.message}`);
      results.push({
        slug: rawArticle.slug || "unknown",
        status: "error",
        error: error.message
      });
    }
  }

  return NextResponse.json({
    success: true,
    event_type,
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
