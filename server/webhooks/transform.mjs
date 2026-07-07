/**
 * Shared transformation logic for webhook payloads → Payload CMS cms-posts format.
 */
import { lexicalToHtml } from "../../src/lib/lexicalToHtml.mjs";

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

import { parse as parseHtml } from "node-html-parser";

// Text format bitmasks (Lexical spec)
const FMT_BOLD          = 1;
const FMT_ITALIC        = 2;
const FMT_STRIKETHROUGH = 4;
const FMT_UNDERLINE     = 8;
const FMT_CODE          = 16;
const FMT_SUBSCRIPT     = 32;
const FMT_SUPERSCRIPT   = 64;

function makeText(text, format = 0) {
  return { type: "text", text, detail: 0, format, mode: "normal", style: "", version: 1 };
}

function makeNode(type, extra, children) {
  return { type, children, direction: "ltr", format: "", indent: 0, version: 1, ...extra };
}

/** Converts an HTML element's children to an array of Lexical inline nodes. */
function inlineChildren(el, inheritedFormat = 0) {
  const nodes = [];
  for (const child of el.childNodes) {
    if (child.nodeType === 3 /* TEXT_NODE */) {
      const text = child.rawText;
      if (text) nodes.push(makeText(text, inheritedFormat));
    } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
      const tag = child.tagName?.toLowerCase();
      let fmt = inheritedFormat;
      if (tag === "strong" || tag === "b") fmt |= FMT_BOLD;
      else if (tag === "em" || tag === "i") fmt |= FMT_ITALIC;
      else if (tag === "u")                 fmt |= FMT_UNDERLINE;
      else if (tag === "s" || tag === "del" || tag === "strike") fmt |= FMT_STRIKETHROUGH;
      else if (tag === "code")              fmt |= FMT_CODE;
      else if (tag === "sub")               fmt |= FMT_SUBSCRIPT;
      else if (tag === "sup")               fmt |= FMT_SUPERSCRIPT;
      else if (tag === "a") {
        const href = child.getAttribute("href") || "";
        const newTab = child.getAttribute("target") === "_blank";
        const linkChildren = inlineChildren(child, inheritedFormat);
        if (linkChildren.length > 0) {
          nodes.push({
            type: "link",
            fields: { url: href, newTab, rel: null, title: null, linkType: "custom" },
            children: linkChildren,
            direction: "ltr",
            format: "",
            indent: 0,
            version: 2,
          });
        }
        continue;
      } else if (tag === "br") {
        nodes.push({ type: "linebreak", version: 1 });
        continue;
      }
      nodes.push(...inlineChildren(child, fmt));
    }
  }
  return nodes;
}

/** Converts an HTML element to an array of block-level Lexical nodes. */
function blockNodes(el) {
  const nodes = [];
  for (const child of el.childNodes) {
    if (child.nodeType === 3 /* TEXT_NODE */) {
      const text = child.rawText.trim();
      if (text) {
        nodes.push(makeNode("paragraph", {}, [makeText(text)]));
      }
      continue;
    }
    if (child.nodeType !== 1) continue;
    const tag = child.tagName?.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      const inline = inlineChildren(child);
      if (inline.length > 0) {
        nodes.push(makeNode("heading", { tag }, inline));
      }
    } else if (tag === "p") {
      const inline = inlineChildren(child);
      if (inline.length > 0) {
        nodes.push(makeNode("paragraph", {}, inline));
      }
    } else if (tag === "ul" || tag === "ol") {
      const listType = tag === "ol" ? "number" : "bullet";
      const items = [];
      let value = 1;
      for (const li of child.querySelectorAll("li")) {
        const inline = inlineChildren(li);
        if (inline.length > 0) {
          items.push({ type: "listitem", children: inline, direction: "ltr", format: "", indent: 0, version: 1, value, checked: null });
          value++;
        }
      }
      if (items.length > 0) {
        nodes.push({ type: "list", listType, children: items, direction: "ltr", format: "", indent: 0, version: 1, start: 1, tag });
      }
    } else if (tag === "blockquote") {
      const quoteChildren = [];
      for (const block of blockNodes(child)) {
        if (Array.isArray(block.children)) {
          if (quoteChildren.length > 0) {
            quoteChildren.push({ type: "linebreak", version: 1 });
          }
          quoteChildren.push(...block.children);
        }
      }
      if (quoteChildren.length > 0) {
        nodes.push(makeNode("quote", {}, quoteChildren));
      }
    } else if (tag === "pre") {
      const codeEl = child.querySelector("code");
      const text = (codeEl || child).innerText || "";
      const lang = codeEl?.getAttribute("class")?.replace(/language-/, "") || "";
      nodes.push({ type: "code", language: lang, children: [makeText(text)], direction: "ltr", format: "", indent: 0, version: 1 });
    } else if (tag === "hr") {
      nodes.push({ type: "horizontalrule", version: 1 });
    } else if (tag === "div" || tag === "section" || tag === "article" || tag === "main") {
      nodes.push(...blockNodes(child));
    } else {
      // Treat unknown elements as paragraphs if they contain text
      const inline = inlineChildren(child);
      if (inline.length > 0) {
        nodes.push(makeNode("paragraph", {}, inline));
      }
    }
  }
  return nodes;
}

export function htmlToLexical(html) {
  if (!html?.trim()) {
    return { root: { children: [makeNode("paragraph", {}, [makeText("")])], direction: "ltr", format: "", indent: 0, type: "root", version: 1 } };
  }

  const root = parseHtml(html, { lowerCaseTagName: true, comment: false });
  const children = blockNodes(root);

  if (children.length === 0) {
    children.push(makeNode("paragraph", {}, [makeText("")]));
  }

  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

// ── Payload CMS transformation ────────────────────────────────────────────────

export function validateNormalizedArticle(article) {
  const errors = [];
  const title = article.title?.trim();
  const content = article.content?.trim();
  const slug = normalizeSlug(article.slug, title);

  if (!title) errors.push("Missing title");
  if (!slug) errors.push("Missing slug and title could not generate one");
  if (!content || !stripHtml(content)) errors.push("Missing article content");

  return { valid: errors.length === 0, errors, slug };
}

function keywordRows(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean)
    .map((keyword) => ({ keyword }));
}

/**
 * Transforms a normalized article into a Payload CMS cms-posts create/update payload.
 * Webhook posts stay uncategorized drafts until a human reviews and publishes them.
 */
export function transformToPayloadPost(article) {
  const receivedAt = article.receivedAt || new Date().toISOString();

  return {
    title: article.title.trim(),
    slug: normalizeSlug(article.slug, article.title),
    excerpt: generateExcerpt(article.content, article.metaDescription),
    status: "draft",
    _status: "draft",
    content: htmlToLexical(article.content),
    externalHeroImageUrl: article.featuredImageUrl || "",
    aiSummary: article.metaDescription || "",
    source: {
      provider: article.provider || "",
      externalId: article.externalId || "",
      publicUrl: article.publicUrl || "",
      providerCreatedAt: article.providerCreatedAt || undefined,
      receivedAt
    },
    seo: {
      title: article.metaTitle || article.title || "",
      description: article.metaDescription || "",
      keywords: keywordRows(article.tags),
      canonicalUrl: article.publicUrl || ""
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
    : (doc.externalHeroImageUrl || "");

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
    readingTime: estimateReadingTime(lexicalToHtml(doc.content)),
    tags: keywords,
    aiSummary: doc.aiSummary || "",
    seoTitle: doc.seo?.title || doc.title || "",
    seoDescription: doc.seo?.description || doc.excerpt || "",
    renderedHtml: lexicalToHtml(doc.content),
    sections: lexicalToSections(doc.content),
    faq: []
  };
}
