export function BlogCard({ post }) {
  return (
    <article>
      <p>{post.category}</p>
      <h3>{post.title}</h3>
      <a href={`/blog/${post.slug}`}>Read article</a>
    </article>
  );
}
