"use client";
import { useState } from "react";
import { readPurchaseIntent } from "../lib/purchase-intent";
import { sessionFetch } from "../lib/session-client";
import styles from "../webclient.module.css";
export function MobileHandoff() {
  const [link, setLink] = useState<{ url: string; qr: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function prepare() {
    setBusy(true);
    setError("");
    try {
      const response = await sessionFetch("/api/webclient/continuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(readPurchaseIntent()),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message || "Could not prepare your mobile link.");
      setLink(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {!link ? (
        <button className={styles.button} disabled={busy} onClick={prepare}>
          {busy ? "Preparing…" : "Continue in the mobile app"}
        </button>
      ) : (
        <>
          <p>
            Open this link on your phone, or scan the code. We’ll keep your
            product selection while you complete sizing.
          </p>
          <img
            src={link.qr}
            alt="Scan to continue sizing in ClothME"
            width={240}
            height={240}
          />
          <p>
            <a className={styles.button} href={link.url} rel="noreferrer">
              Open ClothME
            </a>
          </p>
          <p>
            If you need the app, you’ll be taken to your app store. To use your
            saved sizes later on the web, sign in with the same account on both
            devices.
          </p>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
