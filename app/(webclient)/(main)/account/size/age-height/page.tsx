import { getGeoHint } from "../../../../lib/geo";
import { getSession } from "../../../../lib/session";
import { SizeAgeHeightView } from "../../../../components/SizeAgeHeightView";
import styles from "../../../../webclient.module.css";
import shopStyles from "../../../../shop.module.css";

export const metadata = {
  title: "Age & height",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SizeAgeHeightPage() {
  const session = await getSession();
  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Age & height</h1>
        <p className={styles.muted}>Could not start a shopping session. Refresh to try again.</p>
      </section>
    );
  }
  const geo = await getGeoHint();
  return (
    <SizeAgeHeightView city={geo.city} country={geo.country} provinceState={geo.region} />
  );
}
