/**
 * Shared utilities for transforming incoming webhook article payloads
 * into the format expected by savePost().
 */

// ── Category auto-classification ─────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  "fit-guide": [
    "fit guide", "sizing", "size chart", "how to measure", "body measurements",
    "fit tips", "true to size", "size guide", "fitting", "measurements"
  ],
  "family-shopping": [
    "family shopping", "kids clothing", "children", "baby clothes", "toddler",
    "maternity", "family fashion", "kids style", "school clothes", "family outfits"
  ],
  "personal-style": [
    "personal style", "outfit", "wardrobe", "fashion tips", "style guide",
    "capsule wardrobe", "what to wear", "styling", "fashion trends", "lookbook"
  ],
  "location-guide": [
    "location guide", "shopping in", "best stores", "boutiques in", "where to shop",
    "local shops", "city guide", "neighborhood", "shopping district"
  ]
};

/**
 * Attempt to auto-classify article category based on title and content.
 * Returns the category value or empty string if no confident match.
 */
export function classifyCategory(title, textContent) {
  const searchText = `${title} ${textContent}`.toLowerCase();

  let bestCategory = "";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        score++;
        // Extra weight if keyword appears in title
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

  // Require at least 2 keyword matches to classify
  return bestScore >= 2 ? bestCategory : "";
}

// ── HTML to sections parser ──────────────────────────────────────────────────

/**
 * Strip HTML tags and return plain text.
 */
function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
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
 * Parse HTML content into an array of { heading, body } sections.
 * Splits on <h2> and <h3> headings. Content before the first heading
 * becomes a section with an empty heading.
 */
export function parseHtmlToSections(html) {
  if (!html || typeof html !== "string") {
    return [];
  }

  // Split on h2 and h3 tags while capturing the heading text
  const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  const sections = [];
  let lastIndex = 0;
  let match;

  const matches = [];
  while ((match = headingRegex.exec(html)) !== null) {
    matches.push({
      heading: stripHtml(match[1]).trim(),
      index: match.index,
      endIndex: match.index + match[0].length
    });
  }

  if (matches.length === 0) {
    // No headings found — treat entire content as a single section
    const body = html.trim();
    if (body) {
      sections.push({ heading: "", body });
    }
    return sections;
  }

  // Content before the first heading
  const preamble = html.slice(0, matches[0].index).trim();
  if (preamble) {
    sections.push({ heading: "", body: preamble });
  }

  // Each heading + content until the next heading
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextStart = i < matches.length - 1 ? matches[i + 1].index : html.length;
    const body = html.slice(current.endIndex, nextStart).trim();

    sections.push({
      heading: current.heading,
      body: body || ""
    });
  }

  return sections;
}

// ── Excerpt generation ───────────────────────────────────────────────────────

/**
 * Generate an excerpt from HTML content. Takes the first ~160 characters
 * of plain text content.
 */
export function generateExcerpt(html, maxLength = 160) {
  const text = stripHtml(html);
  if (text.length <= maxLength) {
    return text;
  }
  // Cut at a word boundary
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

// ── Slug utilities ───────────────────────────────────────────────────────────

/**
 * Generate a URL-safe slug from a title string.
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

// ── Reading time estimate ────────────────────────────────────────────────────

/**
 * Estimate reading time based on word count (avg 200 wpm).
 */
export function estimateReadingTime(html) {
  const text = stripHtml(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

// ── FAQ extraction ───────────────────────────────────────────────────────────

/**
 * Attempt to extract FAQ items from HTML content.
 * Looks for a pattern of questions (text ending with ?) followed by answers.
 */
export function extractFaq(html) {
  if (!html) return [];

  const faq = [];

  // Look for structured FAQ patterns: <h3>Question?</h3> followed by content
  const faqRegex = /<h[23][^>]*>([\s\S]*?\?)\s*<\/h[23]>\s*([\s\S]*?)(?=<h[23]|$)/gi;
  let match;

  while ((match = faqRegex.exec(html)) !== null) {
    const question = stripHtml(match[1]).trim();
    const answer = stripHtml(match[2]).trim();

    if (question && answer && question.length < 200 && answer.length > 10) {
      faq.push({ question, answer });
    }
  }

  return faq;
}

// ── Main transform function ──────────────────────────────────────────────────

/**
 * Transform a normalized article payload into the format expected by savePost().
 *
 * @param {object} article - Normalized article data
 * @param {string} article.title
 * @param {string} article.slug
 * @param {string} article.content - HTML content
 * @param {string} [article.excerpt]
 * @param {string} [article.heroImageUrl]
 * @param {string} [article.heroImageAlt]
 * @param {string} [article.seoTitle]
 * @param {string} [article.seoDescription]
 * @param {string[]} [article.tags]
 * @param {string} [article.author]
 * @returns {object} - Payload compatible with savePost()
 */
export function transformArticleToPost(article) {
  const content = article.content || "";
  const title = (article.title || "").trim();
  const slug = article.slug || generateSlug(title);

  const sections = parseHtmlToSections(content);
  const faq = extractFaq(content);
  const textContent = stripHtml(content);
  const category = classifyCategory(title, textContent);
  const excerpt = article.excerpt || article.seoDescription || generateExcerpt(content);

  return {
    slug,
    title,
    excerpt,
    category,
    status: "draft",
    heroImageUrl: article.heroImageUrl || "",
    heroImageAlt: article.heroImageAlt || title,
    author: article.author || "AI Content",
    publishedAt: null,
    scheduledFor: null,
    readingTime: estimateReadingTime(content),
    aiSummary: article.seoDescription || "",
    seoTitle: article.seoTitle || title,
    seoDescription: article.seoDescription || excerpt,
    sections,
    faq,
    tags: article.tags || []
  };
}
