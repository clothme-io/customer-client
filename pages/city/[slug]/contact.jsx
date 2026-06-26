import { CityContactPage } from "../../../src/screens/city/CityContactPage";
import { getCityBySlug, serializeCity } from "../../../src/lib/getCityData";

export async function getServerSideProps({ params }) {
  const city = await getCityBySlug(params?.slug || "");
  if (!city) return { notFound: true };
  return { props: { city: serializeCity(city) } };
}

export default function CityContact({ city }) {
  return <CityContactPage city={city} />;
}
