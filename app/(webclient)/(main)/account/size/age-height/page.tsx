import { getGeoHint } from "../../../../lib/geo";
import { SizeAgeHeightView } from "../../../../components/SizeAgeHeightView";

export const metadata = {
  title: "Age & height",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SizeAgeHeightPage() {
  const geo = await getGeoHint();
  return (
    <SizeAgeHeightView city={geo.city} country={geo.country} provinceState={geo.region} />
  );
}
