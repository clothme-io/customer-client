"use client";
import { sessionFetch as fetch } from "../../lib/session-client";

import { clearSizeFlows } from "../../lib/size-flow";
import { clearPurchaseIntent } from "../../lib/purchase-intent";
import { useRouter } from "next/navigation";
import styles from "../../webclient.module.css";

const THEMES = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "pink", label: "Pink" },
  { key: "blue", label: "Blue" },
];

export function SettingsForm({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();

  function setTheme(theme: string) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  async function logout() {
    await fetch("/api/webclient/session", { method: "DELETE" });
    await clearSizeFlows().catch(() => {});
    clearPurchaseIntent();
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith("cm_size_")) sessionStorage.removeItem(key);
    router.replace("/login");
    router.refresh();
  }

  return (
    <section className={styles.pagePad}>
      <h1 className={styles.pageTitle}>Settings</h1>

      <h2 style={{ fontSize: 16, color: "var(--wc-muted)" }}>Appearance</h2>
      <div style={{ display: "grid", gap: 8, margin: "12px 0 24px" }}>
        {THEMES.map((theme) => (
          <button
            key={theme.key}
            type="button"
            className={`${styles.button} ${styles.ghostButton}`}
            onClick={() => setTheme(theme.key)}
          >
            {theme.label}
          </button>
        ))}
      </div>

      <p className={styles.muted}>
        Notification, privacy, payment methods, and shipping addresses will sync
        with the same person settings API as mobile.
      </p>

      {signedIn ? (
        <p style={{ marginTop: 32 }}>
          <button
            type="button"
            className={`${styles.button} ${styles.ghostButton}`}
            onClick={logout}
          >
            Log out
          </button>
        </p>
      ) : null}
    </section>
  );
}
