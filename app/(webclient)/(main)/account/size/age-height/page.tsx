import { getSession } from "../../../../lib/session";
import { fetchAccountProfile } from "../../../../lib/commerce";
import { getGeoHint } from "../../../../lib/geo";
import { SizeAgeHeightView } from "../../../../components/SizeAgeHeightView";

export const metadata = {
  title: "Age & height",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SizeAgeHeightPage() {
  const geo = await getGeoHint();
  const session = await getSession();
  const profile = session
    ? await fetchAccountProfile(session).catch(() => null)
    : null;
  const person = profile?.users?.find(
    (user) => user.userId === session?.personId,
  );
  const name =
    person?.firstName ||
    (profile?.accountUserId === session?.personId ? profile?.firstName : "") ||
    "";
  const firstName =
    session?.authLevel === "guest" && name === "Guest" ? "" : name;
  return (
    <SizeAgeHeightView
      firstName={firstName}
      city={geo.city}
      country={geo.country}
      provinceState={geo.region}
    />
  );
}
