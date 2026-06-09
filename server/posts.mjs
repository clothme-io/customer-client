import { query, withTransaction } from "./db.mjs";

const publicPostWhere = `
  status = 'published'
  or (status = 'scheduled' and scheduled_for is not null and scheduled_for <= now())
`;

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function mapPostRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    status: row.status,
    image: row.hero_image_url,
    imageAlt: row.hero_image_alt,
    heroImageUrl: row.hero_image_url,
    heroImageAlt: row.hero_image_alt,
    publishedAt: row.published_at,
    scheduledFor: row.scheduled_for,
    updatedAt: row.updated_at,
    author: row.author,
    readingTime: row.reading_time,
    tags: row.tags || [],
    aiSummary: row.ai_summary,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    previewToken: row.preview_token,
    sections: row.sections || [],
    faq: row.faq || []
  };
}

const postSelect = `
  select
    p.*,
    coalesce(
      json_agg(distinct jsonb_build_object('heading', ps.heading, 'body', ps.body, 'sortOrder', ps.sort_order))
      filter (where ps.id is not null),
      '[]'
    ) as sections,
    coalesce(
      json_agg(distinct jsonb_build_object('question', pf.question, 'answer', pf.answer, 'sortOrder', pf.sort_order))
      filter (where pf.id is not null),
      '[]'
    ) as faq,
    coalesce(
      array_agg(distinct pt.tag) filter (where pt.tag is not null and pt.tag <> ''),
      '{}'
    ) as tags
  from posts p
  left join post_sections ps on ps.post_id = p.id
  left join post_faqs pf on pf.post_id = p.id
  left join post_tags pt on pt.post_id = p.id
`;

function normalizePost(row) {
  const post = mapPostRow(row);
  post.sections = post.sections.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  post.faq = post.faq.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  return post;
}

export async function listPosts({ admin = false } = {}) {
  const where = admin ? "p.status <> 'archived'" : `(${publicPostWhere})`;
  const result = await query(
    `${postSelect}
     where ${where}
     group by p.id
     order by coalesce(p.published_at, p.scheduled_for, p.created_at) desc`
  );
  return result.rows.map(normalizePost);
}

export async function getPostBySlug(slug, { admin = false, previewToken = "" } = {}) {
  const conditions = ["p.slug = $1"];
  const params = [slug];

  if (previewToken) {
    params.push(previewToken);
    conditions.push(`p.preview_token = $${params.length}`);
  } else if (!admin) {
    conditions.push(`(${publicPostWhere})`);
  }

  const result = await query(
    `${postSelect}
     where ${conditions.join(" and ")}
     group by p.id
     limit 1`,
    params
  );

  return result.rows[0] ? normalizePost(result.rows[0]) : null;
}

export async function getPostById(id) {
  const result = await query(
    `${postSelect}
     where p.id = $1 and p.status <> 'archived'
     group by p.id
     limit 1`,
    [id]
  );
  return result.rows[0] ? normalizePost(result.rows[0]) : null;
}

export async function savePost(payload, actor = "") {
  const sections = toArray(payload.sections);
  const faq = toArray(payload.faq);
  const tags = toArray(payload.tags).filter(Boolean);

  return withTransaction(async (client) => {
    const values = [
      payload.slug,
      payload.title,
      payload.excerpt || "",
      payload.category || "",
      payload.status || "draft",
      payload.heroImageUrl || payload.image || "",
      payload.heroImageAlt || payload.imageAlt || "",
      payload.author || "ClothME Team",
      payload.publishedAt || null,
      payload.scheduledFor || null,
      payload.readingTime || "",
      payload.aiSummary || "",
      payload.seoTitle || "",
      payload.seoDescription || "",
      actor,
      actor
    ];

    let postId = payload.id;

    if (postId) {
      await client.query(
        `update posts set
          slug = $1,
          title = $2,
          excerpt = $3,
          category = $4,
          status = $5,
          hero_image_url = $6,
          hero_image_alt = $7,
          author = $8,
          published_at = $9,
          scheduled_for = $10,
          reading_time = $11,
          ai_summary = $12,
          seo_title = $13,
          seo_description = $14,
          updated_by = $16,
          updated_at = now()
        where id = $15`,
        [...values.slice(0, 14), postId, actor]
      );
    } else {
      const result = await client.query(
        `insert into posts (
          slug, title, excerpt, category, status, hero_image_url, hero_image_alt, author,
          published_at, scheduled_for, reading_time, ai_summary, seo_title, seo_description,
          created_by, updated_by
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16
        ) returning id`,
        values
      );
      postId = result.rows[0].id;
    }

    await client.query("delete from post_sections where post_id = $1", [postId]);
    await client.query("delete from post_faqs where post_id = $1", [postId]);
    await client.query("delete from post_tags where post_id = $1", [postId]);

    for (const [index, section] of sections.entries()) {
      await client.query(
        "insert into post_sections (post_id, sort_order, heading, body) values ($1, $2, $3, $4)",
        [postId, index, section.heading || "", section.body || ""]
      );
    }

    for (const [index, item] of faq.entries()) {
      await client.query(
        "insert into post_faqs (post_id, sort_order, question, answer) values ($1, $2, $3, $4)",
        [postId, index, item.question || "", item.answer || ""]
      );
    }

    for (const tag of tags) {
      await client.query("insert into post_tags (post_id, tag) values ($1, $2)", [postId, tag]);
    }

    return getPostById(postId);
  });
}

export async function archivePost(id, actor = "") {
  await query("update posts set status = 'archived', updated_by = $2, updated_at = now() where id = $1", [id, actor]);
}
