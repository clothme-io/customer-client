import Link from "next/link";
import styles from "../webclient.module.css";
import shopStyles from "../shop.module.css";

export function AccountSignInGate({
  title,
  allowSizes = false
}: {
  title: string;
  allowSizes?: boolean;
}) {
  return (
    <section className={shopStyles.signInGate}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <p className={styles.muted}>
        Save an account to keep orders, Wishbag, and sizes on the web and in the ClothME app.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {allowSizes ? (
          <Link className={styles.button} href="/account/size/policy">
            Add your sizes
          </Link>
        ) : null}
        <Link className={`${styles.button} ${allowSizes ? styles.ghostButton : ""}`} href="/login">
          Log in
        </Link>
      </div>
    </section>
  );
}
