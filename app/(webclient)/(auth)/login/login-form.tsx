"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../../webclient.module.css";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get("next") || "/shop";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/webclient/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signin", email, password })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.message || "Sign in failed");
        return;
      }
      router.replace(next.startsWith("/") ? next : "/shop");
      router.refresh();
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.authCard} onSubmit={onSubmit}>
      <h1>Log in</h1>
      <p className={styles.muted} style={{ textAlign: "center", marginBottom: 24 }}>
        Use your ClothME account to pick up orders and sizes on the web and in the app.
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <button className={styles.button} type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
