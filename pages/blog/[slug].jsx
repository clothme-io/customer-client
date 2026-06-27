import { BlogPostPage } from "../../src/screens/BlogPostPage";
import { getPostBySlug as getFallbackPost } from "../../src/data/posts";
import { getPublicPost, serializePost } from "../../src/lib/serverContent.mjs";

export async function getServerSideProps({ params }) {
  const slug = params?.slug || "";
  const fallbackPost = getFallbackPost(slug) || null;

  try {
    const post = await getPublicPost(slug);
    return { props: { slug, initialPost: serializePost(post || fallbackPost) } };
  } catch (error) {
    console.warn(`Blog post "${slug}" falling back to local post:`, error.message);
    return { props: { slug, initialPost: serializePost(fallbackPost) } };
  }
}

export default function BlogArticlePage({ slug, initialPost }) {
  return <BlogPostPage slug={slug} initialPost={initialPost} />;
}
