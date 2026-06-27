import { BlogIndexPage } from "../../src/screens/BlogIndexPage";
import { posts as fallbackPosts } from "../../src/data/posts";
import { getPublicPosts, serializePosts } from "../../src/lib/serverContent.mjs";

export async function getServerSideProps() {
  try {
    const posts = await getPublicPosts();
    return { props: { initialPosts: serializePosts(posts) } };
  } catch (error) {
    console.warn("Blog index falling back to local posts:", error.message);
    return { props: { initialPosts: serializePosts(fallbackPosts) } };
  }
}

export default function BlogPage({ initialPosts }) {
  return <BlogIndexPage initialPosts={initialPosts} />;
}
