/**
 * BabyLoveGrowth.ai Webhook — receives published articles and creates cms-posts drafts in Payload CMS.
 * Auth: Authorization: Bearer <token>  or  x-api-key: <token>  or  Basic auth (password = token)
 */

import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { transformToPayloadPost, normalizeSlug, validateNormalizedArticle } from "../../../../server/webhooks/transform.mjs";

const WEBHOOK_SECRET = process.env.BABYLOVEGROWTH_WEBHOOK_SECRET;

function verifyToken(request) {
  if (!WEBHOOK_SECRET) {
    console.warn("[webhooks/babylovegrowth] BABYLOVEGROWTH_WEBHOOK_SECRET not configured.");
    return false;
  }
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7) === WEBHOOK_SECRET;
  const apiKey = request.headers.get("x-api-key") || "";
  if (apiKey) return apiKey === WEBHOOK_SECRET;
  if (auth.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
      const password = decoded.split(":").slice(1).join(":");
      return password === WEBHOOK_SECRET;
    } catch {
      return false;
    }
  }
  return false;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeFaq(raw) {
  if (Array.isArray(raw.faq)) return raw.faq;
  if (typeof raw.faqJsonLd === "string" && raw.faqJsonLd.trim()) {
    try {
      const parsed = JSON.parse(raw.faqJsonLd);
      const entities = Array.isArray(parsed?.mainEntity) ? parsed.mainEntity : [];
      return entities.map((item) => ({
        question: item.name || "",
        answer: item.acceptedAnswer?.text || ""
      })).filter((item) => item.question && item.answer);
    } catch {
      return [];
    }
  }
  return [];
}

function articleCandidates(body) {
  if (Array.isArray(body?.articles)) return body.articles;
  if (Array.isArray(body?.data?.articles)) return body.data.articles;
  if (body?.article) return [body.article];
  if (body?.data?.article) return [body.data.article];
  if (body?.data && typeof body.data === "object" && !Array.isArray(body.data)) return [body.data];
  if (Array.isArray(body)) return body;
  return [body];
}

function normalizeBabyLoveGrowthArticle(raw, receivedAt) {
  return {
    provider: "babylovegrowth",
    externalId: firstString(raw.id, raw.articleId, raw.externalId),
    title: firstString(raw.title),
    slug: firstString(raw.slug),
    content: firstString(raw.content_html, raw.contentHtml, raw.html, raw.content, raw.body, raw.content_markdown, raw.contentMarkdown),
    featuredImageUrl: firstString(raw.heroImageUrl, raw.hero_image_url, raw.featured_image, raw.featuredImage, raw.image),
    metaTitle: firstString(raw.metaTitle, raw.meta_title, raw.title),
    metaDescription: firstString(raw.metaDescription, raw.meta_description, raw.seo_description),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    author: firstString(raw.author),
    faq: normalizeFaq(raw),
    publicUrl: firstString(raw.publicUrl, raw.public_url, raw.url),
    providerCreatedAt: firstString(raw.createdAt, raw.created_at),
    receivedAt
  };
}

async function recordWebhookEvent(payload, data) {
  try {
    await payload.create({ collection: "webhook-events", data, overrideAccess: true });
  } catch (error) {
    console.error(`[webhooks/babylovegrowth] Could not record webhook event: ${error.message}`);
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

  const articles = articleCandidates(body);
  if (articles.length === 0) {
    return NextResponse.json({ error: "No articles in payload" }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const results = [];
  const receivedAt = new Date().toISOString();

  for (const raw of articles) {
    const article = normalizeBabyLoveGrowthArticle(raw, receivedAt);
    const validation = validateNormalizedArticle(article);
    const slug = validation.slug || normalizeSlug(raw.slug, raw.title);

    if (!validation.valid) {
      await recordWebhookEvent(payload, {
        provider: "babylovegrowth",
        eventType: "article_received",
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
            provider: "babylovegrowth",
            eventType: "article_received",
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
          provider: "babylovegrowth",
          eventType: "article_received",
          externalId: article.externalId,
          slug,
          post: existing.docs[0].id,
          status: "updated",
          payload: raw,
          normalized: article
        });
        results.push({ slug, status: "updated", id: existing.docs[0].id });
        console.log(`[webhooks/babylovegrowth] Updated: ${slug}`);
      } else {
        const created = await payload.create({
          collection: "cms-posts",
          data: postData,
          overrideAccess: true,
        });
        await recordWebhookEvent(payload, {
          provider: "babylovegrowth",
          eventType: "article_received",
          externalId: article.externalId,
          slug,
          post: created.id,
          status: "created",
          payload: raw,
          normalized: article
        });
        results.push({ slug, status: "created", id: created.id });
        console.log(`[webhooks/babylovegrowth] Created: ${slug}`);
      }
    } catch (error) {
      console.error(`[webhooks/babylovegrowth] Error on ${slug}: ${error.message}`);
      await recordWebhookEvent(payload, {
        provider: "babylovegrowth",
        eventType: "article_received",
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
  return NextResponse.json({ success: accepted.length > 0, processed: results.length, results }, { status: responseStatus });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
