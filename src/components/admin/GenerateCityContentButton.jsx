"use client";

import { useDocumentInfo } from "@payloadcms/ui";
import { useState } from "react";

const styles = {
  wrapper: {
    borderTop: "1px solid var(--theme-border-color, #e5e7eb)",
    paddingTop: "24px",
    marginTop: "8px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--theme-text, #374151)",
    marginBottom: "8px",
    display: "block",
  },
  description: {
    fontSize: "13px",
    color: "var(--theme-text, #6b7280)",
    marginBottom: "16px",
    lineHeight: 1.5,
  },
  button: (disabled) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: disabled ? "#9ca3af" : "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background-color 0.15s",
  }),
  message: (status) => ({
    marginTop: "12px",
    padding: "10px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    lineHeight: 1.5,
    backgroundColor:
      status === "error"
        ? "#fef2f2"
        : status === "success"
          ? "#f0fdf4"
          : "#f9fafb",
    color:
      status === "error"
        ? "#dc2626"
        : status === "success"
          ? "#16a34a"
          : "#4b5563",
    border: `1px solid ${
      status === "error"
        ? "#fecaca"
        : status === "success"
          ? "#bbf7d0"
          : "#e5e7eb"
    }`,
  }),
};

export function GenerateCityContentButton() {
  const { id } = useDocumentInfo();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const isNew = !id;
  const isLoading = status === "loading";

  async function handleGenerate() {
    if (isNew) {
      setStatus("error");
      setMessage(
        "Save the city first (name + slug at minimum), then generate content."
      );
      return;
    }

    setStatus("loading");
    setMessage("Calling Claude AI — this takes about 15–30 seconds…");

    try {
      const res = await fetch(`/api/admin/locations/${id}/generate`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      setStatus("success");
      setMessage(
        `Content generated for ${data.city}. Reload the page to see all populated fields.`
      );
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Generation failed. Check the server logs.");
    }
  }

  function handleReload() {
    window.location.reload();
  }

  return (
    <div style={styles.wrapper}>
      <span style={styles.label}>AI Content Generation</span>
      <p style={styles.description}>
        Fill in the <strong>Local Boutiques Context</strong> field above, then
        click Generate. The AI will write all section copy — hero, pain points,
        benefits, local shopping, FAQ, about page, and SEO meta — for this
        city. You can edit any field afterwards.
      </p>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          style={styles.button(isLoading)}
        >
          {isLoading ? "⏳ Generating…" : "✦ Generate City Content"}
        </button>

        {status === "success" && (
          <button
            type="button"
            onClick={handleReload}
            style={{
              ...styles.button(false),
              backgroundColor: "#16a34a",
            }}
          >
            ↺ Reload Page
          </button>
        )}
      </div>

      {message && (
        <div style={styles.message(status)}>
          {message}
        </div>
      )}
    </div>
  );
}
