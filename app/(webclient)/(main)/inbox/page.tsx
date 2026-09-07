import { getSession } from "../../lib/session";
import { fetchSupportMessages } from "../../lib/commerce";
import type { SupportMessage } from "../../lib/types";
import { InboxView } from "../../components/InboxView";
import styles from "../../webclient.module.css";
import shopStyles from "../../shop.module.css";

export const metadata = {
  title: "Inbox",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Inbox</h1>
        <p className={styles.muted}>Could not start a session. Refresh to try again.</p>
      </section>
    );
  }

  let messages: SupportMessage[] = [];
  try {
    const result = await fetchSupportMessages(session);
    messages = Array.isArray(result) ? result : [];
  } catch {
    messages = [];
  }

  return <InboxView messages={Array.isArray(messages) ? messages : []} signedIn />;
}
