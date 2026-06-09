import { mkdir, readFile, writeFile } from "node:fs/promises";
import { posts as fallbackPosts } from "../src/data/posts.js";
import { hasDatabase } from "../server/db.mjs";
import { listPosts } from "../server/posts.mjs";

const siteUrl = process.env.VITE_SITE_URL || "https://clothme.app";
const outputDir = "dist";
const now = new Date().toISOString();
const siteDescription = "Join the ClothME waitlist to shop fashion products that match your size and your family's sizes.";
let contentPosts = fallbackPosts;

if (hasDatabase()) {
  try {
    contentPosts = await listPosts({ admin: false });
  } catch (error) {
    console.warn(`Could not load posts from database. Falling back to local posts. ${error.message}`);
  }
}

function absoluteUrl(path) {
  return new URL(path, siteUrl).toString();
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeJsonLd(schema) {
  return JSON.stringify(schema).replaceAll("<", "\\u003c");
}

function metaTags({ title, description, path, image, type = "website", jsonLd = [] }) {
  const canonical = absoluteUrl(path);
  const imageUrl = image ? absoluteUrl(image) : "";

  return `<title>${htmlEscape(title)}</title>
    <meta name="description" content="${htmlEscape(description)}">
    <link rel="canonical" href="${htmlEscape(canonical)}">
    <meta property="og:title" content="${htmlEscape(title)}">
    <meta property="og:description" content="${htmlEscape(description)}">
    <meta property="og:type" content="${htmlEscape(type)}">
    <meta property="og:url" content="${htmlEscape(canonical)}">
    ${imageUrl ? `<meta property="og:image" content="${htmlEscape(imageUrl)}">` : ""}
    <meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}">
    <meta name="twitter:title" content="${htmlEscape(title)}">
    <meta name="twitter:description" content="${htmlEscape(description)}">
    ${imageUrl ? `<meta name="twitter:image" content="${htmlEscape(imageUrl)}">` : ""}
    ${jsonLd.map((schema) => `<script type="application/ld+json">${safeJsonLd(schema)}</script>`).join("\n    ")}`;
}

function injectPage(template, options, rootHtml) {
  const headTags = metaTags(options);
  return template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[\s\S]*?>/, "")
    .replace("</head>", `    ${headTags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${rootHtml}</div>`);
}

function renderHeader() {
  return `<header class="site-header">
    <a class="brand" href="/" aria-label="ClothME home">
      <img class="brand-logo" src="/clothme-logo.png" alt="" aria-hidden="true">
      <span>ClothME</span>
    </a>
    <nav aria-label="Primary navigation">
      <a href="/#how">How it works</a>
      <a href="/blog">Blog</a>
    </nav>
  </header>`;
}

function renderBlogCards() {
  return contentPosts
    .map(
      (post) => `<article>
        <p>${htmlEscape(post.category)}</p>
        <h3>${htmlEscape(post.title)}</h3>
        <a href="/blog/${htmlEscape(post.slug)}">Read article</a>
      </article>`
    )
    .join("");
}

function renderHome({ themeClass = "" } = {}) {
  const content = `${renderHeader()}
  <main id="top">
    <section class="hero">
      <div class="hero-content">
        <p class="eyebrow">Coming soon</p>
        <h1>Shop clothes that fit you and your family.</h1>
        <p class="hero-text">ClothME helps you generate fashion sizes from two photos, save sizes for family members, and find products that match each person's fit, style, color, fabric, and brand preferences.</p>
        <form class="waitlist-form" id="waitlist">
          <label class="sr-only" for="email">Email address</label>
          <input id="email" name="email" type="email" placeholder="Enter your email" autocomplete="email" required>
          <button type="submit">Get Your Invite</button>
        </form>
        <p class="privacy-note">Early access invites will be sent by email. No spam.</p>
      </div>
      <div class="hero-visual" aria-label="ClothME shopping preview">
        <figure>
          <img src="/family-shopping.jpg" alt="Mother and children smiling while using a smartphone">
          <figcaption>Shop for family</figcaption>
        </figure>
        <figure>
          <img src="/personal-shopping.jpg" alt="Woman smiling while shopping on her smartphone">
          <figcaption>Shop for yourself</figcaption>
        </figure>
      </div>
    </section>
    <section class="how" id="how" aria-labelledby="how-title">
      <div class="section-heading">
        <p class="eyebrow">How ClothME works</p>
        <h2 id="how-title">A simpler way to shop for the right size.</h2>
      </div>
      <div class="steps">
        <article><span>01</span><h3>Create your size</h3><p>Use two photos to generate a fashion size profile.</p></article>
        <article><span>02</span><h3>Add family members</h3><p>Save sizes for your kids, spouse, partner, or anyone you shop for.</p></article>
        <article><span>03</span><h3>Shop matched products</h3><p>See only fashion products that match size from brands you love in your location.</p></article>
      </div>
    </section>
    <section class="family-note">
      <h2>Built for unique personal and family shopping experience.</h2>
      <p>ClothME is for the moments when you are buying for yourself, your child, your spouse, or someone you love and you want the right size before checkout.</p>
    </section>
    <section class="blog-band" id="blog" aria-labelledby="blog-title">
      <div class="blog">
        <div class="section-heading">
          <p class="eyebrow">ClothME blog</p>
          <h2 id="blog-title">Helpful reads before launch.</h2>
        </div>
        <div class="post-grid">${renderBlogCards()}</div>
      </div>
    </section>
  </main>`;

  return themeClass ? `<div class="${themeClass}">${content}</div>` : content;
}

function renderBlogIndex() {
  return `${renderHeader()}
  <main>
    <section class="blog blog-page" aria-labelledby="blog-title">
      <div class="section-heading">
        <p class="eyebrow">ClothME blog</p>
        <h1 id="blog-title">Helpful reads before launch.</h1>
        <p class="hero-text">SEO-rich articles about fashion fit, family shopping, size profiles, brand preferences, and shopping by location.</p>
      </div>
      <div class="post-grid">${renderBlogCards()}</div>
    </section>
  </main>`;
}

function renderArticle(post) {
  const sections = post.sections
    .map((section) => `<section><h2>${htmlEscape(section.heading)}</h2><p>${htmlEscape(section.body)}</p></section>`)
    .join("");
  const faq = post.faq
    .map((item) => `<div><h3>${htmlEscape(item.question)}</h3><p>${htmlEscape(item.answer)}</p></div>`)
    .join("");
  const tags = post.tags.map((tag) => `<span>${htmlEscape(tag)}</span>`).join("");

  return `${renderHeader()}
  <main class="article-shell">
    <article class="article-page">
      <p class="eyebrow">${htmlEscape(post.category)}</p>
      <h1>${htmlEscape(post.title)}</h1>
      <p class="article-lede">${htmlEscape(post.excerpt)}</p>
      <div class="article-meta">
        <span>${htmlEscape(post.author)}</span>
        <span>${htmlEscape(new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}</span>
        <span>${htmlEscape(post.readingTime)}</span>
      </div>
      <img class="article-image" src="${htmlEscape(post.image)}" alt="${htmlEscape(post.imageAlt)}">
      <aside class="ai-summary" aria-label="AI search summary">
        <h2>Quick answer</h2>
        <p>${htmlEscape(post.aiSummary)}</p>
      </aside>
      ${sections}
      <section>
        <h2>Frequently asked questions</h2>
        <div class="faq-list">${faq}</div>
      </section>
      <div class="tag-list" aria-label="Article tags">${tags}</div>
    </article>
  </main>`;
}

const urls = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/color-scheme-blue", priority: "0.2", changefreq: "monthly" },
  { loc: "/version/white", priority: "0.2", changefreq: "monthly" },
  { loc: "/blog", priority: "0.8", changefreq: "weekly" },
  ...contentPosts.map((post) => ({
    loc: `/blog/${post.slug}`,
    priority: "0.7",
    changefreq: "monthly",
    lastmod: post.updatedAt
  }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${xmlEscape(absoluteUrl(url.loc))}</loc>
    <lastmod>${xmlEscape(url.lastmod || now)}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl("/sitemap.xml")}
`;

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ClothME Blog</title>
    <link>${xmlEscape(absoluteUrl("/blog"))}</link>
    <description>Fashion sizing, family shopping, fit-first shopping, and ClothME product updates.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${contentPosts
  .map(
    (post) => `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(absoluteUrl(`/blog/${post.slug}`))}</link>
      <guid>${xmlEscape(absoluteUrl(`/blog/${post.slug}`))}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${xmlEscape(post.excerpt)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`;

const llms = `# ClothME

ClothME is a fashion shopping platform in development. It helps users generate fashion sizes from two photos, save size profiles for family members, and discover fashion products that match size, preferred brands, style, color, fabric, and location.

## Core Pages
- Home and waitlist: ${absoluteUrl("/")}
- Blog index: ${absoluteUrl("/blog")}
- Sitemap: ${absoluteUrl("/sitemap.xml")}
- RSS feed: ${absoluteUrl("/rss.xml")}

## Articles
${contentPosts.map((post) => `- ${post.title}: ${absoluteUrl(`/blog/${post.slug}`)}\n  Summary: ${post.aiSummary}`).join("\n")}
`;

await mkdir(outputDir, { recursive: true });
await writeFile(`${outputDir}/sitemap.xml`, sitemap);
await writeFile(`${outputDir}/robots.txt`, robots);
await writeFile(`${outputDir}/rss.xml`, rss);
await writeFile(`${outputDir}/llms.txt`, llms);

const template = await readFile(`${outputDir}/index.html`, "utf8");

const homeSchema = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ClothME",
    url: siteUrl,
    description: siteDescription
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ClothME",
    url: siteUrl,
    description: siteDescription
  }
];

await writeFile(
  `${outputDir}/index.html`,
  injectPage(
    template,
    {
      title: "ClothME | Join the waitlist",
      description: siteDescription,
      path: "/",
      jsonLd: homeSchema
    },
    renderHome()
  )
);

await mkdir(`${outputDir}/color-scheme-blue`, { recursive: true });
await writeFile(
  `${outputDir}/color-scheme-blue/index.html`,
  injectPage(
    template,
    {
      title: "ClothME | Blue color scheme preview",
      description: siteDescription,
      path: "/color-scheme-blue",
      jsonLd: homeSchema
    },
    renderHome({ themeClass: "theme-blue-swap" })
  )
);

await mkdir(`${outputDir}/version/white`, { recursive: true });
await writeFile(
  `${outputDir}/version/white/index.html`,
  injectPage(
    template,
    {
      title: "ClothME | White background preview",
      description: siteDescription,
      path: "/version/white",
      jsonLd: homeSchema
    },
    renderHome({ themeClass: "theme-white-landing" })
  )
);

const blogDescription = "Read ClothME articles about fashion sizing, family shopping, personal style, and shopping products that match your size.";
const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "ClothME Blog",
  url: absoluteUrl("/blog"),
  description: blogDescription,
  publisher: {
    "@type": "Organization",
    name: "ClothME"
  },
  blogPost: contentPosts.map((post) => ({
    "@type": "BlogPosting",
    headline: post.title,
    url: absoluteUrl(`/blog/${post.slug}`),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    description: post.excerpt
  }))
};

await mkdir(`${outputDir}/blog`, { recursive: true });
await writeFile(
  `${outputDir}/blog/index.html`,
  injectPage(
    template,
    {
      title: "ClothME Blog | Fit-first fashion and family shopping",
      description: blogDescription,
      path: "/blog",
      type: "blog",
      jsonLd: [blogSchema]
    },
    renderBlogIndex()
  )
);

for (const post of contentPosts) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: absoluteUrl(post.image),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: post.author
    },
    publisher: {
      "@type": "Organization",
      name: "ClothME"
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    keywords: post.tags.join(", "),
    articleSection: post.category
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  const postDir = `${outputDir}/blog/${post.slug}`;
  await mkdir(postDir, { recursive: true });
  await writeFile(
    `${postDir}/index.html`,
    injectPage(
      template,
      {
        title: `${post.title} | ClothME Blog`,
        description: post.excerpt,
        path: `/blog/${post.slug}`,
        image: post.image,
        type: "article",
        jsonLd: [articleSchema, faqSchema]
      },
      renderArticle(post)
    )
  );
}

console.log("Generated static SEO pages, sitemap.xml, robots.txt, rss.xml, and llms.txt");
