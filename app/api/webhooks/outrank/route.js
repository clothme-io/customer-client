/**
 * Outrank.so Webhook — receives published articles and creates cms-posts drafts in Payload CMS.
 * Auth: Authorization: Bearer <token>  or  x-access-token: <token>
 */

import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { transformToPayloadPost, normalizeSlug, validateNormalizedArticle } from "../../../../server/webhooks/transform.mjs";

const WEBHOOK_SECRET = process.env.OUTRANK_WEBHOOK_SECRET;

function verifyToken(request) {
  if (!WEBHOOK_SECRET) {
    console.warn("[webhooks/outrank] OUTRANK_WEBHOOK_SECRET not configured.");
    return false;
  }
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7) === WEBHOOK_SECRET;
  const token = request.headers.get("x-access-token") || "";
  return token === WEBHOOK_SECRET;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeOutrankArticle(article, receivedAt) {
  return {
    provider: "outrank",
    externalId: firstString(article.id, article.article_id, article.externalId),
    title: firstString(article.title),
    slug: firstString(article.slug),
    content: firstString(article.content_html, article.contentHtml, article.html, article.content, article.body, article.content_markdown, article.contentMarkdown),
    featuredImageUrl: firstString(article.image_url, article.heroImageUrl, article.featured_image, article.featuredImage, article.image),
    metaTitle: firstString(article.meta_title, article.metaTitle, article.seo_title, article.title),
    metaDescription: firstString(article.meta_description, article.metaDescription, article.seo_description),
    tags: Array.isArray(article.tags) ? article.tags : (article.keywords || []),
    author: firstString(article.author),
    faq: Array.isArray(article.faq) ? article.faq : [],
    publicUrl: firstString(article.public_url, article.publicUrl, article.url),
    providerCreatedAt: firstString(article.created_at, article.createdAt),
    receivedAt
  };
}

async function recordWebhookEvent(payload, data) {
  try {
    await payload.create({ collection: "webhook-events", data, overrideAccess: true });
  } catch (error) {
    console.error(`[webhooks/outrank] Could not record webhook event: ${error.message}`);
  }
}

export async function POST(request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_type, data } = body;
  if (!event_type || !data) {
    return NextResponse.json({ error: "Missing event_type or data" }, { status: 400 });
  }

  const articles = Array.isArray(data.articles)
    ? data.articles
    : data.article ? [data.article] : [];

  if (articles.length === 0) {
    return NextResponse.json({ error: "No articles in payload" }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const results = [];
  const receivedAt = new Date().toISOString();

  for (const raw of articles) {
    const article = normalizeOutrankArticle(raw, receivedAt);
    const validation = validateNormalizedArticle(article);
    const slug = validation.slug || normalizeSlug(raw.slug, raw.title);

    if (!validation.valid) {
      await recordWebhookEvent(payload, {
        provider: "outrank",
        eventType: event_type,
        externalId: article.externalId,
        slug,
        status: "rejected",
        message: validation.errors.join("; "),
        payload: raw,
        normalized: article
      });
      results.push({ slug, status: "rejected", errors: validation.errors });
      continue;
    }

    try {
      const postData = transformToPayloadPost(article);

      const existing = await payload.find({
        collection: "cms-posts",
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });

      if (existing.docs.length > 0) {
        if (existing.docs[0]._status === "published") {
          await recordWebhookEvent(payload, {
            provider: "outrank",
            eventType: event_type,
            externalId: article.externalId,
            slug,
            post: existing.docs[0].id,
            status: "skipped",
            message: "Existing post is already published; webhook did not overwrite reviewed content.",
            payload: raw,
            normalized: article
          });
          results.push({ slug, status: "skipped_published", id: existing.docs[0].id });
          continue;
        }

        await payload.update({
          collection: "cms-posts",
          id: existing.docs[0].id,
          data: postData,
          overrideAccess: true,
        });
        await recordWebhookEvent(payload, {
          provider: "outrank",
          eventType: event_type,
          externalId: article.externalId,
          slug,
          post: existing.docs[0].id,
          status: "updated",
          payload: raw,
          normalized: article
        });
        results.push({ slug, status: "updated", id: existing.docs[0].id });
        console.log(`[webhooks/outrank] Updated: ${slug}`);
      } else {
        const created = await payload.create({
          collection: "cms-posts",
          data: postData,
          overrideAccess: true,
        });
        await recordWebhookEvent(payload, {
          provider: "outrank",
          eventType: event_type,
          externalId: article.externalId,
          slug,
          post: created.id,
          status: "created",
          payload: raw,
          normalized: article
        });
        results.push({ slug, status: "created", id: created.id });
        console.log(`[webhooks/outrank] Created: ${slug}`);
      }
    } catch (error) {
      console.error(`[webhooks/outrank] Error on ${slug}: ${error.message}`);
      await recordWebhookEvent(payload, {
        provider: "outrank",
        eventType: event_type,
        externalId: article.externalId,
        slug,
        status: "error",
        message: error.message,
        payload: raw,
        normalized: article
      });
      results.push({ slug, status: "error", error: error.message });
    }
  }

  const accepted = results.filter((result) => ["created", "updated", "skipped_published"].includes(result.status));
  const responseStatus = accepted.length > 0 ? 200 : 422;
  return NextResponse.json({ success: accepted.length > 0, event_type, processed: results.length, results }, { status: responseStatus });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
