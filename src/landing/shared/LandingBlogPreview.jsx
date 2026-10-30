import { useEffect, useState } from "react";
import { BlogCard } from "../../components/BlogCard";
import { apiFetch } from "../../lib/api";

const HOME_GUIDE_LIMIT = 6;
const EMPTY_FALLBACK = [];

function GuideCardSkeleton() {
  return (
    <article className="post-card post-card--skeleton" aria-hidden="true">
      <div className="skeleton-line skeleton-line--badge" />
      <div className="skeleton-line skeleton-line--title" />
      <div className="skeleton-line skeleton-line--title skeleton-line--short" />
      <div className="skeleton-line skeleton-line--body" />
      <div className="skeleton-line skeleton-line--body skeleton-line--short" />
      <div className="skeleton-line skeleton-line--link" />
    </article>
  );
}

export function LandingBlogPreview({ limit = HOME_GUIDE_LIMIT, fallbackPosts = EMPTY_FALLBACK, showAllLink = false, allGuidesHref = "/blog" }) {
  const [posts, setPosts] = useState(fallbackPosts);
  const [loading, setLoading] = useState(fallbackPosts.length === 0);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const data = await apiFetch("/api/posts");
        if (cancelled) return;
        const next = Array.isArray(data.posts) ? data.posts.slice(0, limit) : [];
        for (const fallback of fallbackPosts) {
          if (next.length >= limit) break;
          if (!next.some((post) => post.slug === fallback.slug)) next.push(fallback);
        }
        if (next.length) setPosts(next);
      } catch (error) {
        console.warn("Home guides could not load posts:", error);
        if (!cancelled && !fallbackPosts.length) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, [limit, fallbackPosts]);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="blog-band blog-band--guides" id="guides" aria-labelledby="guides-title">
      <div className="blog">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">Guides</p>
          <h2 id="guides-title">Fit tips and shopping help for every body</h2>
          <p className="section-heading__support">
            Step-by-step guides on sizing, family shopping, and finding clothes that actually fit.
          </p>
        </div>
        <div
          className="post-grid"
          aria-busy={loading}
          aria-live="polite"
        >
          {loading && posts.length === 0
            ? Array.from({ length: limit }, (_, index) => (
                <GuideCardSkeleton key={`guide-skeleton-${index}`} />
              ))
            : posts.map((post) => <BlogCard key={post.slug} post={post} />)}
        </div>
        {showAllLink && <a className="guides-all-link" href={allGuidesHref}>Explore all guides →</a>}
      </div>
    </section>
  );
}
