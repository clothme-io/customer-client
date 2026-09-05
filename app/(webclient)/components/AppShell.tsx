import { Sidebar } from "./Sidebar";
import { WEBCLIENT_MOCK } from "../lib/config";
import styles from "../webclient.module.css";

export function AppShell({
  children,
  modal,
  signedIn,
  cartCount = 0,
  inboxCount = 0,
  showRail = false,
  rail
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
  signedIn: boolean;
  cartCount?: number;
  inboxCount?: number;
  showRail?: boolean;
  rail?: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <Sidebar signedIn={signedIn} cartCount={cartCount} inboxCount={inboxCount} />
      <div className={styles.main}>
        <div className={styles.feedColumn}>
          {WEBCLIENT_MOCK ? (
            <p className={styles.mockBanner} role="status">
              Preview data — live checkout and APIs are off. Set NEXT_PUBLIC_WEBCLIENT_MOCK=0 to restore.
            </p>
          ) : null}
          {children}
        </div>
        {showRail && rail ? <aside className={styles.rail}>{rail}</aside> : null}
      </div>
      {modal}
    </div>
  );
}
