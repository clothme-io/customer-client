const CATEGORY_LABELS = {
  "fit-guide": "Fit Guide",
  "family-shopping": "Family Shopping",
  "personal-style": "Personal Style",
  "location-guide": "Location Guide"
};

export function categoryLabel(category) {
  if (!category) return "";
  return CATEGORY_LABELS[category] || category.replace(/-/g, " ");
}

export function BlogCard({ post }) {
  const label = categoryLabel(post.category);
  const excerpt = (post.excerpt || post.aiSummary || post.seoDescription || "").trim();

  return (
    <article className="post-card">
      {label ? <p className="post-card__category">{label}</p> : null}
      <h3 className="post-card__title">{post.title}</h3>
      {excerpt ? <p className="post-card__excerpt">{excerpt}</p> : null}
      <a className="post-card__link" href={`/blog/${post.slug}`}>
        Read the guide →
      </a>
    </article>
  );
}
