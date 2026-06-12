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
  const posts = await getPublicPosts();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ClothME Blog</title>
    <link>${xmlEscape(absoluteUrl("/blog"))}</link>
    <description>Fashion sizing, family shopping, fit-first shopping, and ClothME product updates.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${posts
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

  res.setHeader("Content-Type", "application/rss+xml");
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Rss() {
  return null;
}
