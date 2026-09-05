import Link from "next/link";
import { getSession } from "../../lib/session";
import { fetchCart } from "../../lib/commerce";
import { CartView } from "../../components/CartView";
import styles from "../../webclient.module.css";
import shopStyles from "../../shop.module.css";

export const metadata = {
  title: "Cart",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Cart</h1>
        <p className={styles.muted}>Sign in to view items saved for your profiles.</p>
        <Link className={styles.button} href="/login">
          Log in
        </Link>
      </section>
    );
  }

  try {
    const cart = await fetchCart(session);
    return <CartView cart={cart} />;
  } catch (error) {
    return (
      <section className={styles.pagePad}>
        <h1 className={styles.pageTitle}>Cart</h1>
        <p className={styles.error}>{error instanceof Error ? error.message : "Could not load cart"}</p>
      </section>
    );
  }
}
