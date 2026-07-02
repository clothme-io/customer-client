import { BlogIndexPage } from "../../src/screens/BlogIndexPage";
import { getPublicPosts, serializePosts } from "../../src/lib/serverContent.mjs";

export async function getServerSideProps() {
  try {
    const posts = await getPublicPosts();
    return { props: { initialPosts: serializePosts(posts) } };
  } catch (error) {
    console.warn("Blog index could not load Payload posts:", error.message);
    return { props: { initialPosts: [] } };
  }
}

export default function BlogPage({ initialPosts }) {
  return <BlogIndexPage initialPosts={initialPosts} />;
}
