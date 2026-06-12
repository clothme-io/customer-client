import { BlogPostPage } from "../../src/screens/BlogPostPage";
import { getPostBySlug as getFallbackPost } from "../../src/data/posts";
import { hasDatabase } from "../../server/db.mjs";
import { getPostBySlug } from "../../server/posts.mjs";
import { serializePost } from "../../src/lib/serverContent.mjs";

export async function getServerSideProps({ params }) {
  const slug = params?.slug || "";
  const fallbackPost = getFallbackPost(slug) || null;

  if (!hasDatabase()) {
    return { props: { slug, initialPost: serializePost(fallbackPost) } };
  }

  try {
    const initialPost = await getPostBySlug(slug);
    return { props: { slug, initialPost: serializePost(initialPost || fallbackPost) } };
  } catch (error) {
    console.warn(`Could not load post from database. Falling back to local post. ${error.message}`);
    return { props: { slug, initialPost: serializePost(fallbackPost) } };
  }
}

export default function BlogArticlePage({ slug, initialPost }) {
  return <BlogPostPage slug={slug} initialPost={initialPost} />;
}
