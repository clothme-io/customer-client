"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShopItemCard } from "./ShopItemCard";
import type { ShopCard } from "../lib/types";
import { sessionFetch } from "../lib/session-client";
import styles from "../webclient.module.css";
export function ShopFeed({ initialItems }: { initialItems: ShopCard[] }) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialItems.length >= 20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const loading = useRef(false);
  const load = useCallback(async () => {
    if (loading.current || !hasMore) return;
    loading.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await sessionFetch(
        `/api/webclient/feed?page=${page + 1}`,
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message || "Could not load more products.");
      setItems((previous) => {
        const seen = new Set(previous.map((x) => x.product.productId));
        return [
          ...previous,
          ...body.items.filter((x: ShopCard) => !seen.has(x.product.productId)),
        ];
      });
      setPage(page + 1);
      setHasMore(body.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      loading.current = false;
      setBusy(false);
    }
  }, [page, hasMore]);
  useEffect(() => {
    if (error || !hasMore || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void load();
      },
      { rootMargin: "300px" },
    );
    if (sentinel.current) observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [load, error, hasMore]);
  return (
    <>
      {items.map((item) => (
        <ShopItemCard key={item.product.productId} item={item} />
      ))}
      <div ref={sentinel} className={styles.pagePad} aria-live="polite">
        {error && <p role="alert">{error}</p>}
        {hasMore && (
          <button className={styles.button} onClick={load} disabled={busy}>
            {busy ? "Loading…" : error ? "Try again" : "Load more"}
          </button>
        )}
        {!hasMore && items.length > 0 && <p>You’re all caught up.</p>}
      </div>
    </>
  );
}
