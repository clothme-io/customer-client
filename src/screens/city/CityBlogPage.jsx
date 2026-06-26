import { SEO } from "../../components/SEO";
import { CityHeader } from "../../components/city/CityHeader";
import { CityFooter } from "../../components/city/CityFooter";
import { BlogCard } from "../../components/BlogCard";
import { siteConfig } from "../../data/site";

export function CityBlogPage({ city, posts = [] }) {
  const seoData = city.seo?.blog ?? {};
  const metaTitle = seoData.metaTitle || `ClothME Blog — ${city.name}`;
  const metaDesc = seoData.metaDescription || `Fashion fit guides, family shopping tips, and local style from ClothME in ${city.name}.`;

  const rootDomain = (siteConfig.siteUrl || "https://clothme.app").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const cityUrl = `https://${city.slug}.${rootDomain}/blog`;
  const hreflangAlts = [
    { hreflang: "en-CA", href: cityUrl },
    { hreflang: "x-default", href: cityUrl },
  ];

  return (
    <>
      <SEO title={metaTitle} description={metaDesc} path="/blog" alternates={hreflangAlts} />
      <CityHeader cityName={city.name} />
      <main>
        <div className="city-page-shell">
          <p className="eyebrow">ClothME blog</p>
          <h1>Helpful reads before launch.</h1>

          {posts.length === 0 ? (
            <p>No articles yet — check back soon.</p>
          ) : (
            <div className="post-grid" style={{ marginTop: "32px" }}>
              {posts.map((post) => (
                <BlogCard key={post.id || post.slug} post={mapCmsPost(post)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <CityFooter cityName={city.name} region={city.region} />
    </>
  );
}

function mapCmsPost(post) {
  return {
    slug: post.slug,
    title: post.title,
    category: post.category,
    excerpt: post.excerpt,
    image: post.heroImage?.url || post.heroImage || "",
    imageAlt: post.heroImage?.alt || "",
    publishedAt: post.publishedAt,
  };
}
