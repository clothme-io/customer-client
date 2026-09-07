import { getSession } from "../../../../lib/session";
import { SizeManualView } from "../../../../components/SizeManualView";
import styles from "../../../../webclient.module.css";
import shopStyles from "../../../../shop.module.css";

export const metadata = {
  title: "Manual size",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SizeManualPage() {
  const session = await getSession();
  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Manual size</h1>
        <p className={styles.muted}>Could not start a shopping session. Refresh to try again.</p>
      </section>
    );
  }
  return <SizeManualView />;
}
