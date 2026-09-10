import { getSession } from "../../../../lib/session";
import { SizeCaptureView } from "../../../../components/SizeCaptureView";
import { AccountSubHeader } from "../../../../components/AccountSubHeader";
import styles from "../../../../webclient.module.css";
import shopStyles from "../../../../shop.module.css";

export const metadata = {
  title: "Add sizes",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SizeCapturePage() {
  const session = await getSession();
  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Add sizes</h1>
        <p className={styles.muted}>Could not start a shopping session. Refresh to try again.</p>
      </section>
    );
  }
  return (
    <section>
      <AccountSubHeader title="Pose photos" backHref="/account/size/age-height" />
      <SizeCaptureView />
    </section>
  );
}
