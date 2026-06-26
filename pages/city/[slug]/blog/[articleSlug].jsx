// City blog articles resolve to the same full-article page as the main blog.
// The article lives at /blog/[slug] on the main site; here we proxy it by slug.
import { useEffect } from "react";
import Head from "next/head";
import { BlogPostPage } from "../../../../src/screens/BlogPostPage";
import { getCityBySlug, serializeCity } from "../../../../src/lib/getCityData";
import { serializePost } from "../../../../src/lib/serverContent.mjs";
import { track } from "../../../../src/lib/track";

async function fetchCmsPost(articleSlug) {
  const base =
    process.env.PAYLOAD_INTERNAL_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  try {
    const res = await fetch(
      `${base}/api/payload/cms-posts?where[slug][equals]=${encodeURIComponent(articleSlug)}&where[status][equals]=published&depth=1&limit=1`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data.docs?.[0];
    if (!doc) return null;
    // Map Payload cms-post to the shape BlogPostPage expects
    return {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      excerpt: doc.excerpt,
      category: doc.category,
      status: doc.status,
      heroImageUrl: doc.heroImage?.url || "",
      heroImageAlt: doc.heroImage?.alt || "",
      publishedAt: doc.publishedAt,
      updatedAt: doc.updatedAt,
      author: "ClothME Team",
      readingTime: "",
      aiSummary: doc.aiSummary || "",
      seoTitle: doc.seo?.title || "",
      seoDescription: doc.seo?.description || "",
      tags: [],
      sections: [],
      faq: [],
    };
  } catch {
    return null;
  }
}

export async function getServerSideProps({ params }) {
  const citySlug = params?.slug || "";
  const articleSlug = params?.articleSlug || "";

  const [city, post] = await Promise.all([
    getCityBySlug(citySlug),
    fetchCmsPost(articleSlug),
  ]);

  if (!city) return { notFound: true };
  if (!post) return { notFound: true };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VITE_SITE_URL ||
    "https://clothme.app";
  const rootDomain = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const articleUrl = `https://${citySlug}.${rootDomain}/blog/${articleSlug}`;

  return {
    props: {
      slug: articleSlug,
      initialPost: serializePost(post),
      articleUrl,
      citySlug,
    },
  };
}

export default function CityArticlePage({ slug, initialPost, articleUrl, citySlug }) {
  useEffect(() => {
    if (initialPost) {
      track("blog_read", {
        city: citySlug,
        post_slug: slug,
        post_title: initialPost.title,
      });
    }
  }, [slug]);

  const articleSchema = initialPost
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: initialPost.title,
        description: initialPost.excerpt || initialPost.seoDescription || "",
        url: articleUrl,
        datePublished: initialPost.publishedAt,
        dateModified: initialPost.updatedAt || initialPost.publishedAt,
        author: { "@type": "Organization", name: "ClothME" },
        publisher: {
          "@type": "Organization",
          name: "ClothME",
          logo: { "@type": "ImageObject", url: "https://clothme.app/logo.png" },
        },
        ...(initialPost.heroImageUrl ? { image: initialPost.heroImageUrl } : {}),
      }
    : null;

  return (
    <>
      {articleSchema && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(articleSchema).replaceAll("<", "\\u003c"),
            }}
          />
        </Head>
      )}
      <BlogPostPage slug={slug} initialPost={initialPost} />
    </>
  );
}
