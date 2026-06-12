import { siteConfig } from "../src/data/site";
import { getPublicPosts } from "../src/lib/serverContent.mjs";

function absoluteUrl(path) {
  return new URL(path, siteConfig.siteUrl).toString();
}

export async function getServerSideProps({ res }) {
  const posts = await getPublicPosts();
  const body = `# ClothME

ClothME is a fashion shopping platform in development. It helps users generate fashion sizes from two photos, save size profiles for family members, and discover fashion products that match size, preferred brands, style, color, fabric, and location.

## Core Pages
- Home and waitlist: ${absoluteUrl("/")}
- Blog index: ${absoluteUrl("/blog")}
- Privacy policy: ${absoluteUrl("/privacy-policy")}
- Sitemap: ${absoluteUrl("/sitemap.xml")}
- RSS feed: ${absoluteUrl("/rss.xml")}

## Articles
${posts.map((post) => `- ${post.title}: ${absoluteUrl(`/blog/${post.slug}`)}\n  Summary: ${post.aiSummary}`).join("\n")}
`;

  res.setHeader("Content-Type", "text/plain");
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Llms() {
  return null;
}
