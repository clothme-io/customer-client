import { HomePage } from "../src/screens/HomePage";
import { getPublicPosts, serializePosts } from "../src/lib/serverContent.mjs";

export async function getServerSideProps() {
  const posts = await getPublicPosts();
  return { props: { posts: serializePosts(posts) } };
}

export default function IndexPage({ posts }) {
  return <HomePage version="white" posts={posts} />;
}
