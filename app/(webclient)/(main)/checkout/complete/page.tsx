import { Suspense } from "react";
import { CheckoutComplete } from "../../../components/CheckoutComplete";
import styles from "../../../webclient.module.css";

export const metadata = {
  title: "Confirming payment",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <section className={styles.pagePad}>
          <h1 className={styles.pageTitle}>Checkout</h1>
          <p className={styles.muted}>Confirming your payment…</p>
        </section>
      }
    >
      <CheckoutComplete />
    </Suspense>
  );
}
