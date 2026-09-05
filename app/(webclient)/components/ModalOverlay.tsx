"use client";

import { useRouter } from "next/navigation";
import styles from "../shop.module.css";

export function ModalOverlay({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div
      className={styles.modalRoot}
      role="dialog"
      aria-modal="true"
      onClick={() => router.back()}
    >
      <div className={styles.modalPanel} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
