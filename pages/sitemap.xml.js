import { siteConfig } from "../src/data/site";
import { getPublicPosts } from "../src/lib/serverContent.mjs";
import { getAllPublishedCities } from "../src/lib/getCityData";

function absoluteUrl(path) {
  return new URL(path, siteConfig.siteUrl).toString();
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function internalUrl(path) {
  const base =
    process.env.PAYLOAD_INTERNAL_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  return `${base}${path}`;
}

async function getPublishedCmsPosts() {
  try {
    const res = await fetch(
      internalUrl(
        "/api/payload/cms-posts?where[_status][equals]=published&depth=1&limit=500&sort=-publishedAt"
      ),
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.docs ?? [];
  } catch {
    return [];
  }
}

function getRootDomain() {
  return (siteConfig.siteUrl || "https://clothme.app")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

export async function getServerSideProps({ res }) {
  const now = new Date().toISOString();

  const [mainPosts, cities, cmsPosts] = await Promise.all([
    getPublicPosts(),
    getAllPublishedCities(),
    getPublishedCmsPosts(),
  ]);

  // ── Main site URLs ─────────────────────────────────────────────────────────
  const mainUrls = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/blog", priority: "0.8", changefreq: "weekly" },
    { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
    ...mainPosts.map((post) => ({
      loc: `/blog/${post.slug}`,
      priority: "0.7",
      changefreq: "monthly",
      lastmod: post.updatedAt,
    })),
  ];

  const mainEntries = mainUrls.map(
    (url) => `  <url>
    <loc>${xmlEscape(absoluteUrl(url.loc))}</loc>
    <lastmod>${xmlEscape(url.lastmod || now)}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  );

  // ── City microsite URLs ────────────────────────────────────────────────────
  const rootDomain = getRootDomain();

  // Bucket cms-posts by city slug
  const postsByCitySlug = {};
  const globalCmsPosts = [];
  for (const post of cmsPosts) {
    const citySlug =
      typeof post.location === "object" && post.location !== null
        ? post.location.slug
        : null;
    if (citySlug) {
      (postsByCitySlug[citySlug] = postsByCitySlug[citySlug] || []).push(post);
    } else {
      globalCmsPosts.push(post);
    }
  }

  const cityEntries = [];
  for (const city of cities) {
    const base = `https://${city.slug}.${rootDomain}`;
    const cityLastmod = city.updatedAt ? city.updatedAt.split("T")[0] : now.split("T")[0];

    for (const [path, priority, changefreq] of [
      ["/", "0.8", "weekly"],
      ["/about", "0.5", "monthly"],
      ["/blog", "0.6", "weekly"],
      ["/contact", "0.4", "monthly"],
    ]) {
      cityEntries.push(`  <url>
    <loc>${xmlEscape(`${base}${path}`)}</loc>
    <lastmod>${cityLastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`);
    }

    for (const post of [...(postsByCitySlug[city.slug] ?? []), ...globalCmsPosts]) {
      const postLastmod = (post.updatedAt || post.publishedAt || now).split("T")[0];
      cityEntries.push(`  <url>
    <loc>${xmlEscape(`${base}/blog/${post.slug}`)}</loc>
    <lastmod>${postLastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${postsByCitySlug[city.slug]?.includes(post) ? "0.7" : "0.6"}</priority>
  </url>`);
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...mainEntries, ...cityEntries].join("\n")}
</urlset>
`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
