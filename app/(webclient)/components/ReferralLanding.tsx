"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureClientGuest, sessionFetch } from "../lib/session-client";
import styles from "../webclient.module.css";
export function ReferralLanding() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    setError("");
    try {
      await ensureClientGuest();
      const response = await sessionFetch("/api/webclient/attribution", {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message || "Could not open this creator link.");
      const productId = body.claims?.at(-1)?.productId;
      router.push(
        productId ? `/product/${encodeURIComponent(productId)}` : "/shop",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.pagePad}>
      <h1>Shop this creator’s selection</h1>
      <button className={styles.button} onClick={open} disabled={busy}>
        {busy ? "Opening…" : "Continue shopping"}
      </button>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
