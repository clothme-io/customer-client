import Link from "next/link";
import styles from "../webclient.module.css";
import shopStyles from "../shop.module.css";

export function AccountSignInGate({ title }: { title: string }) {
  return (
    <section className={shopStyles.signInGate}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <p className={styles.muted}>Sign in to manage profiles, favourite brands, orders, and Wishbag.</p>
      <Link className={styles.button} href="/login">
        Log in
      </Link>
    </section>
  );
}
