// Same global privacy policy on every city microsite.
import { PrivacyPolicyPage } from "../../../src/screens/PrivacyPolicyPage";
import { getCityBySlug } from "../../../src/lib/getCityData";

export async function getServerSideProps({ params }) {
  const city = await getCityBySlug(params?.slug || "");
  if (!city) return { notFound: true };
  return { props: {} };
}

export default function CityPrivacy() {
  return <PrivacyPolicyPage />;
}
