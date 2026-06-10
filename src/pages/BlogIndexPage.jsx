import { useEffect, useState } from "react";
import { BlogCard } from "../components/BlogCard";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { SEO } from "../components/SEO";
import { posts } from "../data/posts";
import { siteConfig } from "../data/site";
import { apiFetch } from "../lib/api";

export function BlogIndexPage() {
  const [blogPosts, setBlogPosts] = useState(posts);
  const title = `ClothME Blog | Fit-first fashion and family shopping`;
  const description = "Read ClothME articles about fashion sizing, family shopping, personal style, and shopping products that match your size.";
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "ClothME Blog",
    url: `${siteConfig.siteUrl}/blog`,
    description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name
    },
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteConfig.siteUrl}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      description: post.excerpt
    }))
  };

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await apiFetch("/api/posts");
        if (data.posts?.length) setBlogPosts(data.posts);
      } catch (error) {
        console.warn("Using local blog posts fallback.", error);
      }
    }

    loadPosts();
  }, []);

  return (
    <>
      <SEO title={title} description={description} path="/blog" type="blog" jsonLd={[blogSchema]} />
      <Header />
      <main>
        <section className="blog blog-page" aria-labelledby="blog-title">
          <div className="section-heading">
            <p className="eyebrow">ClothME blog</p>
            <h1 id="blog-title">Helpful reads before launch.</h1>
            <p className="hero-text">SEO-rich articles about fashion fit, family shopping, size profiles, brand preferences, and shopping by location.</p>
          </div>
          <div className="post-grid">
            {blogPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
