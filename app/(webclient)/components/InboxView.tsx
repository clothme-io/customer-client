"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WEBCLIENT_MOCK } from "../lib/config";
import { MOCK_MAILS } from "../lib/mock";
import type { SupportMessage } from "../lib/types";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function InboxView({
  messages,
  signedIn
}: {
  messages: SupportMessage[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"Mails" | "Support">("Mails");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setError("");
    try {
      const response = await fetch("/api/webclient/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendSupport", message: draft.trim() })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Could not send");
      setDraft("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    }
  }

  return (
    <section>
      <h1 className={shell.pageTitle} style={{ padding: "16px 16px 8px" }}>
        Inbox
      </h1>
      <div className={styles.tabs}>
        {(["Mails", "Support"] as const).map((name) => (
          <button
            key={name}
            type="button"
            className={`${styles.tab} ${tab === name ? styles.tabActive : ""}`}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "Mails" ? (
        WEBCLIENT_MOCK ? (
          <div>
            {MOCK_MAILS.map((mail) => (
              <article key={mail.id} className={styles.cartItem} style={{ gridTemplateColumns: "1fr" }}>
                <div>
                  <strong>{mail.title}</strong>
                  <p className={shell.muted} style={{ margin: "4px 0 0" }}>
                    {mail.preview}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            Mails from Novu will show here. Support chat is available in the Support tab.
          </p>
        )
      ) : (
        <>
          <div className={styles.chat}>
            {messages.length === 0 ? (
              <p className={shell.muted}>No support messages yet.</p>
            ) : (
              messages.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.bubble} ${item.senderType === "user" ? styles.bubbleMine : ""}`}
                >
                  {item.message}
                </div>
              ))
            )}
          </div>
          {signedIn ? (
            <form className={styles.composer} onSubmit={send}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Message support"
                aria-label="Message support"
              />
              <button className={shell.button} type="submit">
                Send
              </button>
            </form>
          ) : null}
          {error ? <p className={shell.error} style={{ padding: "0 16px 16px" }}>{error}</p> : null}
        </>
      )}
    </section>
  );
}
