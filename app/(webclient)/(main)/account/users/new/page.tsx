import { AccountSignInGate } from "../../../../components/AccountSignInGate";
import { AccountSubHeader } from "../../../../components/AccountSubHeader";
import { getSession } from "../../../../lib/session";
import shopStyles from "../../../../shop.module.css";
import styles from "../../../../webclient.module.css";

export const metadata = {
  title: "Add User",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function AddUserPage() {
  const session = await getSession();
  if (!session) return <AccountSignInGate title="Add User" />;

  return (
    <section>
      <AccountSubHeader title="Add User" backHref="/account/users" />
      <div className={shopStyles.emptyWrap}>
        <p className={styles.muted}>
          Adding a household profile from the web is coming soon. Use the ClothME app to create a new user.
        </p>
      </div>
    </section>
  );
}
