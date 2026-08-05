import { useEffect, useState } from "react";
import { BlogCard } from "../../components/BlogCard";
import { apiFetch } from "../../lib/api";

const HOME_GUIDE_LIMIT = 6;
const SKELETON_COUNT = 6;

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

export function LandingBlogPreview() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const data = await apiFetch("/api/posts");
        if (cancelled) return;
        const next = Array.isArray(data.posts) ? data.posts.slice(0, HOME_GUIDE_LIMIT) : [];
        setPosts(next);
      } catch (error) {
        console.warn("Home guides could not load posts:", error);
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, []);

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
          {loading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <GuideCardSkeleton key={`guide-skeleton-${index}`} />
              ))
            : posts.map((post) => <BlogCard key={post.slug} post={post} />)}
        </div>
      </div>
    </section>
  );
}
