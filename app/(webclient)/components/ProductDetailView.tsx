"use client";

import { commerceEvent, purchaseEvent } from "../lib/commerce-events";

import { sessionFetch as fetch } from "../lib/session-client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ensureFitProfile,
  readPurchaseIntent,
  clearPurchaseIntent,
} from "../lib/purchase-intent";
import { selectVariant } from "../lib/variant-selection";
import type { ProductDetail } from "../lib/types";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const locations = product.variantLocations ?? [];
  const [locationId, setLocationId] = useState(locations[0]?.id || "");
  const activeLocation =
    locations.find((item) => item.id === locationId) || locations[0];
  const colors = activeLocation?.colors ?? product.color ?? [];
  const [colorId, setColorId] = useState(colors[0]?.id || "");
  const activeColor = colors.find((item) => item.id === colorId) || colors[0];
  const sizes =
    activeColor && "sizes" in activeColor ? (activeColor.sizes ?? []) : [];
  const [sizeLabel, setSizeLabel] = useState(
    sizes[0]?.sizeLabel || product.sizes?.[0]?.size || "",
  );
  const [message, setMessage] = useState("");

  const images = useMemo(() => {
    if (activeColor && "images" in activeColor && activeColor.images?.length)
      return activeColor.images;
    return product.images || [];
  }, [activeColor, product.images]);

  const price = activeLocation?.price?.amount ?? product.amount;
  const symbol =
    activeLocation?.price?.currencySymbol ?? product.currencySymbol ?? "$";
  const selectedSize = selectVariant(
    locations,
    activeLocation?.id || "",
    activeColor?.id || "",
    sizeLabel,
  );
  const variantId = selectedSize?.variantId;
  const recommendedFit = product.userFitSizes?.find(
    (fit) =>
      fit.locationId === activeLocation?.id &&
      (!fit.colorId || fit.colorId === activeColor?.id),
  );
  const locationLabel = [
    activeLocation?.city,
    activeLocation?.stateProvince,
    activeLocation?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const [pending, setPending] = useState(false);
  useEffect(() => {
    const intent = readPurchaseIntent();
    if (intent?.productId === product.id) {
      if (locations.some((loc) => loc.id === intent.locationId))
        setLocationId(intent.locationId!);
      if (intent.colorId) setColorId(intent.colorId);
      setMessage(
        "Your selection is saved. Review your size before adding it to your cart.",
      );
    }
  }, [product.id]);

  useEffect(() => {
    if (
      recommendedFit &&
      sizes.some(
        (size) =>
          size.sizeLabel === recommendedFit.sizeLabel && size.quantity > 0,
      )
    )
      setSizeLabel(recommendedFit.sizeLabel);
    else if (
      !sizes.some((size) => size.sizeLabel === sizeLabel && size.quantity > 0)
    )
      setSizeLabel("");
  }, [activeLocation?.id, activeColor?.id, recommendedFit?.sizeLabel]);

  async function addToCart() {
    if (pending) return;
    setPending(true);
    try {
      if (
        !(await ensureFitProfile({
          productId: product.id,
          brandId: product.brand?.id,
          colorId: activeColor?.id,
          locationId: activeLocation?.id,
          returnTo: `/product/${encodeURIComponent(product.id)}`,
        }))
      ) {
        router.push("/account/size/policy");
        return;
      }
      if (!variantId || !selectedSize || selectedSize.quantity < 1) {
        setMessage("Select a size");
        return;
      }
      const response = await fetch("/api/webclient/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addToCart", variantId, quantity: 1 }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.message || "Could not add to cart");
        return;
      }
      setMessage("Added to cart");
      commerceEvent("add_to_cart", { productId: product.id });
      clearPurchaseIntent();
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add to cart");
    } finally {
      setPending(false);
    }
  }

  return (
    <article>
      {images[0] ? (
        <img src={images[0]} alt={product.name} className={styles.detailHero} />
      ) : (
        <div className={styles.detailHero} />
      )}
      <div className={styles.detailBody}>
        <div className={styles.detailHead}>
          <h1>{product.name}</h1>
          <strong>
            {symbol}
            {price ?? ""}
          </strong>
        </div>
        <p className={shell.muted}>{locationLabel}</p>
        {product.brand?.name ? <p>{product.brand.name}</p> : null}
        {product.description ? (
          <p className={shell.muted}>{product.description}</p>
        ) : null}

        {locations.length > 1 ? (
          <p>
            <button
              type="button"
              className={styles.locationCount}
              onClick={() => {
                const index = locations.findIndex(
                  (item) => item.id === activeLocation?.id,
                );
                const next = locations[(index + 1) % locations.length];
                if (next) {
                  setLocationId(next.id);
                  setColorId(next.colors?.[0]?.id || "");
                  setSizeLabel(next.colors?.[0]?.sizes?.[0]?.sizeLabel || "");
                }
              }}
            >
              {locations.length} Locations
            </button>
          </p>
        ) : null}

        {colors.length > 0 ? (
          <div className={styles.pills} style={{ paddingLeft: 0 }}>
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                className={`${styles.swatch} ${color.id === colorId ? styles.swatchActive : ""}`}
                style={{ background: color.hex || "#ccc" }}
                aria-label={color.name}
                onClick={() => {
                  setColorId(color.id);
                  const first =
                    "sizes" in color ? color.sizes?.[0]?.sizeLabel : "";
                  if (first) setSizeLabel(first);
                }}
              />
            ))}
          </div>
        ) : null}

        {sizes.length > 0 || (product.sizes && product.sizes.length > 0) ? (
          <div className={styles.pills} style={{ paddingLeft: 0 }}>
            {(sizes.length
              ? sizes.map((size) => size.sizeLabel)
              : product.sizes!.map((size) => size.size)
            ).map((label) => (
              <button
                key={label}
                type="button"
                className={`${styles.sizeChip} ${label === sizeLabel ? styles.pillActive : ""}`}
                onClick={() => setSizeLabel(label)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {recommendedFit ? (
          <p>
            Your recommended size here:{" "}
            <strong>{recommendedFit.sizeLabel}</strong> (
            {recommendedFit.fitType || "regular"} fit). Review before adding to
            cart.
          </p>
        ) : (
          <p className={shell.muted}>
            No fit recommendation is available for this selection yet.
          </p>
        )}
        {recommendedFit?.sizeLabel === sizeLabel ? (
          <p>
            Fit Score <strong>{Math.round(recommendedFit.score)}%</strong>
          </p>
        ) : null}

        {product.careInformation ? (
          <p className={shell.muted}>
            <strong>Care. </strong>
            {product.careInformation}
          </p>
        ) : null}
        {product.deliveryInformation ? (
          <p className={shell.muted}>
            <strong>Delivery. </strong>
            {product.deliveryInformation}
          </p>
        ) : null}
        {product.refundPolicy ? (
          <p className={shell.muted}>
            <strong>Returns. </strong>
            {product.refundPolicy}
          </p>
        ) : null}

        {message ? <p className={shell.muted}>{message}</p> : null}
      </div>
      <div className={styles.stickyBar}>
        <span>
          {symbol}
          {price ?? ""}
        </span>
        <button
          type="button"
          className={shell.button}
          onClick={addToCart}
          disabled={pending}
        >
          {pending ? "Checking…" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
