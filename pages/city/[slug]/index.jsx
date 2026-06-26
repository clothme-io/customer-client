import { CityHomePage } from "../../../src/screens/city/CityHomePage";
import { getCityBySlug, getCityPosts, serializeCity, serializePosts } from "../../../src/lib/getCityData";

export async function getServerSideProps({ params }) {
  const slug = params?.slug || "";
  const city = await getCityBySlug(slug);

  if (!city) return { notFound: true };

  const posts = await getCityPosts(city.id, { limit: 6 });

  return {
    props: {
      city: serializeCity(city),
      posts: serializePosts(posts),
    },
  };
}

export default function CityIndexPage({ city, posts }) {
  return <CityHomePage city={city} posts={posts} />;
}
