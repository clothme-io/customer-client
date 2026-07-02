import { BlogCard } from "../../components/BlogCard";

export function LandingBlogPreview({ posts }) {
  if (!posts.length) return null;

  return (
    <section className="blog-band" id="blog" aria-labelledby="blog-title">
      <div className="blog">
        <div className="section-heading">
          <p className="eyebrow">ClothME blog</p>
          <h2 id="blog-title">Helpful reads before launch.</h2>
        </div>
        <div className="post-grid">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
