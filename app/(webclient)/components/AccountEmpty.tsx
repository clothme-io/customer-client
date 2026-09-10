import styles from "../shop.module.css";

export function AccountEmpty({ message, icon = "people" }: { message: string; icon?: "people" | "heart" | "receipt" | "gift" }) {
  return (
    <div className={styles.emptyWrap}>
      {icon === "people" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c.7-2.8 3-4.5 6-4.5S14.3 16.2 15 19" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M17 14.5c2.4 0 4.4 1.3 5 3.5" />
        </svg>
      ) : null}
      {icon === "heart" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10Z" />
        </svg>
      ) : null}
      {icon === "receipt" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M6 4h12v16l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V4Z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      ) : null}
      {icon === "gift" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <rect x="4" y="11" width="16" height="9" rx="1" />
          <path d="M4 11V8h16v3M12 8v12" />
          <path d="M12 8c-2.2-3-4.8-3-6-1.5S7.5 10 12 8Z" />
          <path d="M12 8c2.2-3 4.8-3 6-1.5S16.5 10 12 8Z" />
        </svg>
      ) : null}
      <p>{message}</p>
    </div>
  );
}
