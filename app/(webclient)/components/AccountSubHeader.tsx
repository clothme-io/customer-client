import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronBackIcon } from "./Icons";
import styles from "../shop.module.css";

export function AccountSubHeader({
  title,
  backHref = "/account",
  action
}: {
  title: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.subHeader}>
      <Link href={backHref} className={styles.subBack} aria-label="Back">
        <ChevronBackIcon />
      </Link>
      <h1 className={styles.subTitle}>{title}</h1>
      <div className={styles.subAction}>{action}</div>
    </header>
  );
}
