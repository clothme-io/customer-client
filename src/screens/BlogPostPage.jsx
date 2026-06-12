import { useEffect, useState } from "react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { SEO } from "../components/SEO";
import { getPostBySlug, posts } from "../data/posts";
import { siteConfig } from "../data/site";
import { apiFetch } from "../lib/api";

function NotFoundPage() {
  return (
    <>
      <SEO title="Article not found | ClothME" description="This ClothME article could not be found." path="/404" />
      <Header />
      <main className="article-shell">
        <article className="article-page">
          <p className="eyebrow">Not found</p>
          <h1>Article not found.</h1>
          <p className="article-lede">The article you are looking for does not exist.</p>
          <a className="text-link" href="/blog">Back to blog</a>
        </article>
      </main>
    </>
  );
}

export function BlogPostPage({ slug, previewToken = "", initialPost = null }) {
  const [remotePost, setRemotePost] = useState(initialPost);
  const [isLoading, setIsLoading] = useState(!initialPost);
  const fallbackPost = getPostBySlug(slug);
  const post = remotePost || fallbackPost;

  useEffect(() => {
    async function loadPost() {
      setIsLoading(true);
      try {
        const query = previewToken ? `?previewToken=${encodeURIComponent(previewToken)}` : "";
        const data = await apiFetch(`/api/posts/${slug}${query}`);
        setRemotePost(data.post);
      } catch (error) {
        console.warn("Using local blog post fallback.", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();
  }, [slug, previewToken]);

  if (!post && !isLoading) {
    return <NotFoundPage />;
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="article-shell">
          <p className="admin-message">Loading article...</p>
        </main>
      </>
    );
  }

  const postUrl = `${siteConfig.siteUrl}/blog/${post.slug}`;
  const relatedPosts = posts.filter((item) => item.slug !== post.slug).slice(0, 2);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: post.author
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name
    },
    mainEntityOfPage: postUrl,
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

  return (
    <>
      <SEO
        title={`${post.title} | ClothME Blog`}
        description={post.excerpt}
        path={previewToken ? `/preview/${post.slug}` : `/blog/${post.slug}`}
        image={post.image}
        type="article"
        jsonLd={[articleSchema, faqSchema]}
        robots={previewToken ? "noindex,nofollow" : "index,follow"}
      />
      <Header />
      <main className="article-shell">
        <article className="article-page">
          <p className="eyebrow">{post.category}</p>
          <h1>{post.title}</h1>
          <p className="article-lede">{post.excerpt}</p>
          <div className="article-meta">
            <span>{post.author}</span>
            <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span>{post.readingTime}</span>
          </div>
          <img className="article-image" src={post.image} alt={post.imageAlt} />
          <aside className="ai-summary" aria-label="AI search summary">
            <h2>Quick answer</h2>
            <p>{post.aiSummary}</p>
          </aside>
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <section>
            <h2>Frequently asked questions</h2>
            <div className="faq-list">
              {post.faq.map((item) => (
                <div key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
          <div className="tag-list" aria-label="Article tags">
            {post.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </article>

        <section className="related-posts" aria-labelledby="related-title">
          <h2 id="related-title">More from ClothME</h2>
          <div className="post-grid">
            {relatedPosts.map((item) => (
              <article key={item.slug}>
                <p>{item.category}</p>
                <h3>{item.title}</h3>
                <a href={`/blog/${item.slug}`}>Read article</a>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
