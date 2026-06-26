import { CityAboutPage } from "../../../src/screens/city/CityAboutPage";
import { getCityBySlug, serializeCity } from "../../../src/lib/getCityData";

export async function getServerSideProps({ params }) {
  const city = await getCityBySlug(params?.slug || "");
  if (!city) return { notFound: true };
  return { props: { city: serializeCity(city) } };
}

export default function CityAbout({ city }) {
  return <CityAboutPage city={city} />;
}
