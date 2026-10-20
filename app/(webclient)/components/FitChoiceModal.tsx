"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MobileHandoff } from "./MobileHandoff";
import styles from "../webclient.module.css";
export function FitChoiceModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      previous?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby="fit-choice-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        border: 0,
        borderRadius: 20,
        padding: 24,
        maxWidth: 440,
        width: "calc(100% - 32px)",
        maxHeight: "85dvh",
        overflowY: "auto",
        background: "var(--wc-bg, white)",
        color: "var(--wc-text, #171717)",
      }}
    >
      <h2 id="fit-choice-title">Find your size before adding to cart</h2>
      <p>
        Use two photos to generate your size here, or continue on your phone
        where taking photos may be easier.
      </p>
      <p>
        <Link
          className={styles.button}
          href="/account/size/policy"
          onClick={onClose}
        >
          Generate my size here
        </Link>
      </p>
      <MobileHandoff />
      <p>
        <button
          className={`${styles.button} ${styles.ghostButton}`}
          onClick={onClose}
        >
          Keep browsing
        </button>
      </p>
    </dialog>,
    document.body,
  );
}
