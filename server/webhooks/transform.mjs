/**
 * Shared transformation logic for webhook payloads → Payload CMS cms-posts format.
 */

// ── Category auto-classification ─────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  "fit-guide": [
    "fit guide", "sizing", "size chart", "how to measure", "body measurements",
    "true to size", "fits like", "fit tips", "size guide", "fitting"
  ],
  "family-shopping": [
    "family shopping", "kids clothing", "children's fashion", "baby clothes",
    "family outfit", "matching outfits", "toddler", "maternity", "family style"
  ],
  "personal-style": [
    "personal style", "outfit ideas", "fashion tips", "how to style",
    "wardrobe", "capsule wardrobe", "color palette", "accessorize",
    "what to wear", "style guide", "fashion trend"
  ],
  "location-guide": [
    "shopping in", "best stores in", "boutiques in", "where to shop",
    "local fashion", "city guide", "neighborhood guide", "store guide"
  ]
};

export function classifyCategory(title, textContent) {
  const searchText = `${title} ${textContent}`.toLowerCase();
  let bestCategory = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        score += 1;
        if (title.toLowerCase().includes(keyword)) score += 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore >= 2 ? bestCategory : null;
}

// ── HTML utilities ────────────────────────────────────────────────────────────

export function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseHtmlToSections(html) {
  if (!html) return [];

  const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      heading: stripHtml(match[1]),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  if (headings.length === 0) {
    const body = html.trim();
    return body ? [{ heading: "", body }] : [];
  }

  const sections = [];
  const introHtml = html.slice(0, headings[0].startIndex).trim();
  if (introHtml) sections.push({ heading: "", body: introHtml });

  for (let i = 0; i < headings.length; i++) {
    const nextStart = i + 1 < headings.length ? headings[i + 1].startIndex : html.length;
    sections.push({
      heading: headings[i].heading,
      body: html.slice(headings[i].endIndex, nextStart).trim()
    });
  }

  return sections;
}

export function generateExcerpt(html, metaDescription) {
  if (metaDescription && metaDescription.trim()) {
    return metaDescription.trim().slice(0, 300);
  }
  const plainText = stripHtml(html || "");
  if (!plainText) return "";
  if (plainText.length <= 160) return plainText;
  const truncated = plainText.slice(0, 160);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

export function estimateReadingTime(html) {
  const plainText = stripHtml(html || "");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 225));
  return `${minutes} min read`;
}

export function normalizeSlug(slug, title) {
  if (slug) {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
  return (title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

// ── Lexical JSON builder ──────────────────────────────────────────────────────

function lexicalText(text) {
  return { type: "text", text, detail: 0, format: 0, mode: "normal", style: "", version: 1 };
}

function lexicalParagraph(text) {
  return {
    type: "paragraph",
    children: [lexicalText(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1
  };
}

function lexicalHeading(text, tag = "h2") {
  return {
    type: "heading",
    tag,
    children: [lexicalText(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1
  };
}

export function htmlToLexical(html) {
  const sections = parseHtmlToSections(html || "");
  const children = [];

  for (const section of sections) {
    if (section.heading) {
      children.push(lexicalHeading(section.heading));
    }

    const plainBody = stripHtml(section.body || "");
    const paragraphs = plainBody.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

    if (paragraphs.length === 0 && plainBody.trim()) {
      children.push(lexicalParagraph(plainBody.trim()));
    } else {
      for (const para of paragraphs) {
        children.push(lexicalParagraph(para));
      }
    }
  }

  if (children.length === 0) {
    children.push(lexicalParagraph(""));
  }

  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1
    }
  };
}

// ── Payload CMS transformation ────────────────────────────────────────────────

/**
 * Transforms a normalized article into a Payload CMS cms-posts create/update payload.
 * heroImage is intentionally omitted — added manually in CMS after review.
 */
export function transformToPayloadPost(article) {
  const plainContent = stripHtml(article.content || "");
  const category = classifyCategory(article.title || "", plainContent);

  return {
    title: article.title || "Untitled Article",
    slug: normalizeSlug(article.slug, article.title),
    excerpt: generateExcerpt(article.content, article.metaDescription),
    status: "draft",
    category: category || undefined,
    content: htmlToLexical(article.content),
    aiSummary: article.metaDescription || "",
    seo: {
      title: article.metaTitle || article.title || "",
      description: article.metaDescription || ""
    }
  };
}

// ── Payload response → blog post shape ────────────────────────────────────────

function extractText(node) {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.children)) return node.children.map(extractText).join("");
  return "";
}

function lexicalToSections(lexicalJson) {
  if (!lexicalJson?.root?.children) return [];

  const children = lexicalJson.root.children;
  const sections = [];
  let current = null;

  for (const node of children) {
    if (node.type === "heading") {
      if (current) sections.push(current);
      current = { heading: extractText(node), body: "" };
    } else if (node.type === "paragraph") {
      const text = extractText(node).trim();
      if (text) {
        if (!current) {
          current = { heading: "", body: text };
        } else {
          current.body = current.body ? `${current.body}\n\n${text}` : text;
        }
      }
    }
  }

  if (current) sections.push(current);
  return sections;
}

/**
 * Maps a Payload CMS cms-posts doc to the shape BlogIndexPage / BlogPostPage expect.
 */
export function mapPayloadPostToLegacy(doc, siteUrl = "") {
  const heroUrl = doc.heroImage?.url
    ? (doc.heroImage.url.startsWith("http") ? doc.heroImage.url : `${siteUrl}${doc.heroImage.url}`)
    : "";

  const keywords = Array.isArray(doc.seo?.keywords)
    ? doc.seo.keywords.map(k => (typeof k === "string" ? k : k.keyword)).filter(Boolean)
    : [];

  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt || "",
    status: doc.status,
    category: doc.category || "",
    image: heroUrl,
    imageAlt: doc.heroImage?.alt || doc.title || "",
    heroImageUrl: heroUrl,
    heroImageAlt: doc.heroImage?.alt || doc.title || "",
    publishedAt: doc.publishedAt || doc.createdAt,
    updatedAt: doc.updatedAt,
    author: "ClothME Team",
    readingTime: "",
    tags: keywords,
    aiSummary: doc.aiSummary || "",
    seoTitle: doc.seo?.title || doc.title || "",
    seoDescription: doc.seo?.description || doc.excerpt || "",
    sections: lexicalToSections(doc.content),
    faq: []
  };
}
