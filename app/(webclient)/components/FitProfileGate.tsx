"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readPurchaseIntent } from "../lib/purchase-intent";
import styles from "../webclient.module.css";
export function FitProfileGate() {
  const [returnTo, setReturnTo] = useState("");
  useEffect(() => {
    setReturnTo(readPurchaseIntent()?.returnTo || "");
  }, []);
  if (!returnTo) return null;
  return (
    <aside className={styles.pagePad} role="status">
      <h2>Create your fit profile before you buy</h2>
      <p>
        We’ll use two photos to recommend your size, then take you back to your
        selection.
      </p>
      <Link href={returnTo}>Back to your selection</Link>
    </aside>
  );
}
