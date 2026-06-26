import { CityBlogPage } from "../../../../src/screens/city/CityBlogPage";
import { getCityBySlug, getCityPosts, serializeCity, serializePosts } from "../../../../src/lib/getCityData";

export async function getServerSideProps({ params }) {
  const city = await getCityBySlug(params?.slug || "");
  if (!city) return { notFound: true };
  const posts = await getCityPosts(city.id, { limit: 20 });
  return {
    props: {
      city: serializeCity(city),
      posts: serializePosts(posts),
    },
  };
}

export default function CityBlog({ city, posts }) {
  return <CityBlogPage city={city} posts={posts} />;
}
