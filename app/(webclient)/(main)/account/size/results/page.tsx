import { getSession } from "../../../../lib/session";
import { SizeResultsView } from "../../../../components/SizeResultsView";
import styles from "../../../../webclient.module.css";
import shopStyles from "../../../../shop.module.css";

export const metadata = {
  title: "Your sizes",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SizeResultsPage() {
  const session = await getSession();
  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Your sizes</h1>
        <p className={styles.muted}>Could not start a shopping session. Refresh to try again.</p>
      </section>
    );
  }
  return <SizeResultsView />;
}
