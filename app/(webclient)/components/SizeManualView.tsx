"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountSubHeader } from "./AccountSubHeader";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function SizeManualView() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.append("action", "manual");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/webclient/size", { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Failed to add manual size, please try again later.");
      router.push("/shop");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add manual size, please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <AccountSubHeader title="Manual size" backHref="/account/size/policy" />
      <form className={styles.sizeCopy} onSubmit={onSubmit}>
        <p className={shell.muted}>
          If you know the measurements, enter them and we will use them to generate your size.
        </p>
        <h2>Top measurements</h2>
        <label className={shell.field}>
          Top size
          <input name="topSize" placeholder="Add top size" required />
        </label>
        <label className={shell.field}>
          Chest (cm)
          <input name="chest" type="number" min={1} step={0.1} placeholder="Add chest size" required />
        </label>
        <label className={shell.field}>
          Waist (cm)
          <input name="waist" type="number" min={1} step={0.1} placeholder="Add waist size" required />
        </label>
        <h2>Pant measurements</h2>
        <label className={shell.field}>
          Pant size
          <input name="bottomSize" placeholder="Add pant size" required />
        </label>
        <label className={shell.field}>
          Hip (cm)
          <input name="hips" type="number" min={1} step={0.1} placeholder="Add hip size" required />
        </label>
        <label className={shell.field}>
          Leg length (cm)
          <input name="legLength" type="number" min={1} step={0.1} placeholder="Add leg length size" required />
        </label>
        {error ? <p className={shell.error}>{error}</p> : null}
        <button className={shell.button} type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Saving…" : "Generate sizes"}
        </button>
      </form>
    </section>
  );
}
