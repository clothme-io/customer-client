import { siteConfig } from "../src/data/site";
import { getPublicPosts } from "../src/lib/serverContent.mjs";

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

export async function getServerSideProps({ res }) {
  const now = new Date().toISOString();
  const posts = await getPublicPosts();
  const urls = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/blog", priority: "0.8", changefreq: "weekly" },
    { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
    ...posts.map((post) => ({
      loc: `/blog/${post.slug}`,
      priority: "0.7",
      changefreq: "monthly",
      lastmod: post.updatedAt
    }))
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
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

  res.setHeader("Content-Type", "application/xml");
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
