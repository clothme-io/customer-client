import { fetchAddresses, fetchCart } from "../../lib/commerce";
import { getSession, hasRealEmail, isRegistered } from "../../lib/session";
import type { AccountAddress } from "../../lib/types";
import { CheckoutView } from "../../components/CheckoutView";
import styles from "../../webclient.module.css";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className={styles.pagePad}>
        <h1 className={styles.pageTitle}>Checkout</h1>
        <p className={styles.muted}>Could not start a shopping session. Refresh to try again.</p>
      </section>
    );
  }

  try {
    const cart = await fetchCart(session);
    let addresses: AccountAddress[] = [];
    try {
      addresses = await fetchAddresses(session);
    } catch {
      addresses = [];
    }
    return (
      <CheckoutView
        cart={cart}
        addresses={addresses}
        contactEmail={hasRealEmail(session) ? session.email : ""}
        isRegistered={isRegistered(session)}
      />
    );
  } catch (error) {
    return (
      <section className={styles.pagePad}>
        <h1 className={styles.pageTitle}>Checkout</h1>
        <p className={styles.error}>{error instanceof Error ? error.message : "Could not load checkout"}</p>
      </section>
    );
  }
}
