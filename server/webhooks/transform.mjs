/**
 * Shared transformation logic for webhook payloads.
 * Parses HTML content into sections, auto-classifies category, and generates excerpts.
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

/**
 * Attempts to classify an article into one of the predefined categories
 * based on title and content keywords. Returns null if no confident match.
 */
export function classifyCategory(title, textContent) {
  const searchText = `${title} ${textContent}`.toLowerCase();

  let bestCategory = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        score += 1;
        // Extra weight for title matches
        if (title.toLowerCase().includes(keyword)) {
          score += 2;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Require at least 2 points to classify (avoids false positives)
  return bestScore >= 2 ? bestCategory : null;
}

// ── HTML parsing into sections ───────────────────────────────────────────────

/**
 * Strips HTML tags and returns plain text.
 */
function stripHtml(html) {
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

/**
 * Parses HTML content into an array of { heading, body } sections.
 * Splits on <h2> and <h3> tags. Content before the first heading
 * becomes the first section with an empty heading.
 */
export function parseHtmlToSections(html) {
  if (!html) return [];

  // Split by h2/h3 headings
  const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  const sections = [];
  let lastIndex = 0;
  let match;

  // Collect all heading positions
  const headings = [];
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      heading: stripHtml(match[1]),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  if (headings.length === 0) {
    // No headings found — treat entire content as a single section
    const body = html.trim();
    if (body) {
      sections.push({ heading: "", body });
    }
    return sections;
  }

  // Content before the first heading (intro)
  const introHtml = html.slice(0, headings[0].startIndex).trim();
  if (introHtml) {
    sections.push({ heading: "", body: introHtml });
  }

  // Each heading + content until next heading
  for (let i = 0; i < headings.length; i++) {
    const currentHeading = headings[i];
    const nextStart = i + 1 < headings.length ? headings[i + 1].startIndex : html.length;
    const body = html.slice(currentHeading.endIndex, nextStart).trim();

    sections.push({
      heading: currentHeading.heading,
      body: body || ""
    });
  }

  return sections;
}

// ── Excerpt generation ───────────────────────────────────────────────────────

/**
 * Generates an excerpt from HTML content or meta description.
 * Prefers metaDescription if available. Otherwise extracts first ~160 chars
 * of plain text from the content.
 */
export function generateExcerpt(html, metaDescription) {
  if (metaDescription && metaDescription.trim()) {
    return metaDescription.trim().slice(0, 300);
  }

  const plainText = stripHtml(html || "");
  if (!plainText) return "";

  // Take first ~160 characters, breaking at a word boundary
  if (plainText.length <= 160) return plainText;

  const truncated = plainText.slice(0, 160);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

// ── Reading time estimation ──────────────────────────────────────────────────

/**
 * Estimates reading time in "X min read" format.
 */
export function estimateReadingTime(html) {
  const plainText = stripHtml(html || "");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 225));
  return `${minutes} min read`;
}

// ── Slug normalization ───────────────────────────────────────────────────────

/**
 * Ensures a slug is URL-safe. If not provided, generates one from the title.
 */
export function normalizeSlug(slug, title) {
  if (slug) {
    // Clean up the provided slug
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Generate from title
  return (title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

// ── Full transformation pipeline ─────────────────────────────────────────────

/**
 * Transforms a normalized article payload into the format expected by savePost().
 *
 * @param {object} article - Normalized article with fields:
 *   title, slug, content (HTML), featuredImageUrl, metaTitle, metaDescription, tags
 * @param {string} heroImageUrl - CDN URL after image upload (or original URL)
 * @returns {object} - Post payload ready for savePost()
 */
export function transformToPostPayload(article, heroImageUrl) {
  const sections = parseHtmlToSections(article.content || "");
  const plainContent = stripHtml(article.content || "");
  const category = classifyCategory(article.title || "", plainContent);

  return {
    slug: normalizeSlug(article.slug, article.title),
    title: article.title || "Untitled Article",
    excerpt: generateExcerpt(article.content, article.metaDescription),
    category: category || "",
    status: "draft",
    heroImageUrl: heroImageUrl || "",
    heroImageAlt: article.title || "",
    author: article.author || "ClothME Team",
    publishedAt: null,
    scheduledFor: null,
    readingTime: estimateReadingTime(article.content),
    aiSummary: article.metaDescription || "",
    seoTitle: article.metaTitle || article.title || "",
    seoDescription: article.metaDescription || "",
    sections,
    faq: article.faq || [],
    tags: article.tags || []
  };
}
