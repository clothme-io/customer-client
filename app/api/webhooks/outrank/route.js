/**
 * Outrank.so Webhook — receives published articles and creates cms-posts drafts in Payload CMS.
 * Auth: Authorization: Bearer <token>  or  x-access-token: <token>
 */

import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { transformToPayloadPost, normalizeSlug } from "../../../../server/webhooks/transform.mjs";

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

function normalizeOutrankArticle(article) {
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

  for (const raw of articles) {
    const slug = normalizeSlug(raw.slug, raw.title);
    try {
      const article = normalizeOutrankArticle(raw);
      const postData = transformToPayloadPost(article);

      const existing = await payload.find({
        collection: "cms-posts",
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      });

      if (existing.docs.length > 0) {
        await payload.update({
          collection: "cms-posts",
          id: existing.docs[0].id,
          data: postData,
        });
        results.push({ slug, status: "updated", id: existing.docs[0].id });
        console.log(`[webhooks/outrank] Updated: ${slug}`);
      } else {
        const created = await payload.create({
          collection: "cms-posts",
          data: postData,
        });
        results.push({ slug, status: "created", id: created.id });
        console.log(`[webhooks/outrank] Created: ${slug}`);
      }
    } catch (error) {
      console.error(`[webhooks/outrank] Error on ${slug}: ${error.message}`);
      results.push({ slug, status: "error", error: error.message });
    }
  }

  return NextResponse.json({ success: true, event_type, processed: results.length, results });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
