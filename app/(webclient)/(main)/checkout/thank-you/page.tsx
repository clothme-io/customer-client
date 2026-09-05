import Link from "next/link";
import styles from "../../../webclient.module.css";

export const metadata = {
  title: "Thank you",
  robots: { index: false, follow: false }
};

export default function ThankYouPage() {
  return (
    <section className={styles.pagePad}>
      <h1 className={styles.pageTitle}>Thank you</h1>
      <p className={styles.muted}>Your order is confirmed. We’ll email you when it ships.</p>
      <Link className={styles.button} href="/shop" style={{ marginTop: 20 }}>
        Continue shopping
      </Link>
    </section>
  );
}
