import { BlogPostPage } from "../../src/screens/BlogPostPage";
import { getPublicPost, serializePost } from "../../src/lib/serverContent.mjs";

export async function getServerSideProps({ params }) {
  const slug = params?.slug || "";

  try {
    const post = await getPublicPost(slug);
    return { props: { slug, initialPost: serializePost(post) } };
  } catch (error) {
    console.warn(`Blog post "${slug}" could not load from Payload:`, error.message);
    return { props: { slug, initialPost: null } };
  }
}

export default function BlogArticlePage({ slug, initialPost }) {
  return <BlogPostPage slug={slug} initialPost={initialPost} />;
}
