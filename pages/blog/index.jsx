import { BlogIndexPage } from "../../src/screens/BlogIndexPage";
import { mergePostsBySlug, posts as fallbackPosts } from "../../src/data/posts";
import { hasDatabase } from "../../server/db.mjs";
import { listPosts } from "../../server/posts.mjs";
import { serializePosts } from "../../src/lib/serverContent.mjs";

export async function getServerSideProps() {
  if (!hasDatabase()) {
    return { props: { initialPosts: serializePosts(fallbackPosts) } };
  }

  try {
    const initialPosts = await listPosts({ admin: false });
    return { props: { initialPosts: serializePosts(mergePostsBySlug(initialPosts, fallbackPosts)) } };
  } catch (error) {
    console.warn(`Could not load posts from database. Falling back to local posts. ${error.message}`);
    return { props: { initialPosts: serializePosts(fallbackPosts) } };
  }
}

export default function BlogPage({ initialPosts }) {
  return <BlogIndexPage initialPosts={initialPosts} />;
}
