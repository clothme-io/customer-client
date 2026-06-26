import { TermsOfPolicy } from "../../../src/components/TermsOfPolicy";
import { getCityBySlug } from "../../../src/lib/getCityData";

export async function getServerSideProps({ params }) {
  const city = await getCityBySlug(params?.slug || "");
  if (!city) return { notFound: true };
  return { props: {} };
}

export default function CityTerms() {
  return <TermsOfPolicy />;
}
