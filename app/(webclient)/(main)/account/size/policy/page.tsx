import { getSession } from "../../../../lib/session";
import { SizePolicyView } from "../../../../components/SizePolicyView";
import styles from "../../../../webclient.module.css";
import shopStyles from "../../../../shop.module.css";

export const metadata = {
  title: "Size policy",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SizePolicyPage() {
  const session = await getSession();
  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Sizes</h1>
        <p className={styles.muted}>Could not start a shopping session. Refresh to try again.</p>
      </section>
    );
  }
  return <SizePolicyView />;
}
