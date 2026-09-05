"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DeliveryMethodOption, VendorShippingSelection } from "../lib/types";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function VendorShippingSelector({
  vendorId,
  brandId,
  brandName,
  selected
}: {
  vendorId: string;
  brandId: string;
  brandName: string;
  selected?: VendorShippingSelection;
}) {
  const router = useRouter();
  const [options, setOptions] = useState<DeliveryMethodOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/webclient/delivery-methods?vendorId=${encodeURIComponent(vendorId)}&brandId=${encodeURIComponent(brandId)}`)
      .then((response) => response.json())
      .then((body) => {
        if (!cancelled) {
          const methods = Array.isArray(body.methods) ? body.methods : [];
          setOptions(methods.filter((option: DeliveryMethodOption) => option.provider !== "uber_direct"));
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vendorId, brandId]);

  async function select(option: DeliveryMethodOption) {
    setError("");
    const response = await fetch("/api/webclient/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "selectShipping",
        vendorId,
        rateId: option.id,
        provider: option.provider,
        carrier: option.carrier,
        service: option.service,
        shippingAmount: option.price,
        currency: option.currency,
        estimatedMinDays: option.estimatedMinDays,
        estimatedMaxDays: option.estimatedMaxDays
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.message || "Could not select shipping");
      return;
    }
    router.refresh();
  }

  return (
    <div className={styles.shipBox}>
      <p className={styles.sectionLabel} style={{ margin: "0 0 8px" }}>
        Shipping from {brandName}
      </p>
      {loading ? (
        <p className={shell.muted}>Loading delivery options…</p>
      ) : options.length === 0 ? (
        <p className={shell.muted}>No delivery options available</p>
      ) : (
        options.map((option) => {
          const isSelected =
            selected?.rateId === option.id ||
            (option.provider === "uber_direct" && selected?.provider === "uber_direct");
          const days =
            option.estimatedMinDays != null && option.estimatedMaxDays != null
              ? `${option.estimatedMinDays}–${option.estimatedMaxDays} days`
              : "";
          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.shipRow} ${isSelected ? styles.shipRowActive : ""}`}
              onClick={() => select(option)}
            >
              <span>
                {option.carrier} {option.service}
                {days ? <small> · {days}</small> : null}
              </span>
              <strong>{option.price === 0 ? "Free" : `$${option.price.toFixed(2)}`}</strong>
            </button>
          );
        })
      )}
      {error ? <p className={shell.error}>{error}</p> : null}
    </div>
  );
}
