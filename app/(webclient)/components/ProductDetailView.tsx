"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductDetail } from "../lib/types";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const locations = product.variantLocations ?? [];
  const [locationId, setLocationId] = useState(locations[0]?.id || "");
  const activeLocation = locations.find((item) => item.id === locationId) || locations[0];
  const colors = activeLocation?.colors ?? product.color ?? [];
  const [colorId, setColorId] = useState(colors[0]?.id || "");
  const activeColor = colors.find((item) => item.id === colorId) || colors[0];
  const sizes = activeColor && "sizes" in activeColor ? activeColor.sizes ?? [] : [];
  const [sizeLabel, setSizeLabel] = useState(sizes[0]?.sizeLabel || product.sizes?.[0]?.size || "");
  const [message, setMessage] = useState("");

  const images = useMemo(() => {
    if (activeColor && "images" in activeColor && activeColor.images?.length) return activeColor.images;
    return product.images || [];
  }, [activeColor, product.images]);

  const price = activeLocation?.price?.amount ?? product.amount;
  const symbol = activeLocation?.price?.currencySymbol ?? product.currencySymbol ?? "$";
  const variantId = sizes.find((size) => size.sizeLabel === sizeLabel)?.variantId;
  const locationLabel = [activeLocation?.city, activeLocation?.stateProvince, activeLocation?.country]
    .filter(Boolean)
    .join(", ");

  async function addToCart() {
    if (!variantId) {
      setMessage("Select a size");
      return;
    }
    const response = await fetch("/api/webclient/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addToCart", variantId, quantity: 1 })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.message || "Could not add to cart");
      return;
    }
    setMessage("Added to cart");
    router.refresh();
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
        {product.description ? <p className={shell.muted}>{product.description}</p> : null}

        {locations.length > 1 ? (
          <p>
            <button
              type="button"
              className={styles.locationCount}
              onClick={() => {
                const index = locations.findIndex((item) => item.id === activeLocation?.id);
                const next = locations[(index + 1) % locations.length];
                if (next) {
                  setLocationId(next.id);
                  setColorId(next.colors?.[0]?.id || "");
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
                  const first = "sizes" in color ? color.sizes?.[0]?.sizeLabel : "";
                  if (first) setSizeLabel(first);
                }}
              />
            ))}
          </div>
        ) : null}

        {sizes.length > 0 || (product.sizes && product.sizes.length > 0) ? (
          <div className={styles.pills} style={{ paddingLeft: 0 }}>
            {(sizes.length ? sizes.map((size) => size.sizeLabel) : product.sizes!.map((size) => size.size)).map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  className={`${styles.sizeChip} ${label === sizeLabel ? styles.pillActive : ""}`}
                  onClick={() => setSizeLabel(label)}
                >
                  {label}
                </button>
              )
            )}
          </div>
        ) : null}

        {typeof product.userFitPercentage === "number" ? (
          <p>
            Fit Score <strong>{Math.round(product.userFitPercentage)}%</strong>
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
        <button type="button" className={shell.button} onClick={addToCart}>
          Add to cart
        </button>
      </div>
    </article>
  );
}
