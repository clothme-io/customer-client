"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ShopCard, ShopFitVariant, ShopProductLocation } from "../lib/types";
import { BookmarkIcon, HeartIcon } from "./Icons";
import styles from "../shop.module.css";

function firstImage(card: ShopCard) {
  const urls = card.product.images?.flatMap((visual) => visual.imageUrl || []) ?? [];
  return urls.filter(Boolean);
}

async function runAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/webclient/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || "Action failed");
  }
  return body;
}

export function ShopItemCard({ item }: { item: ShopCard }) {
  const router = useRouter();
  const [fitKey, setFitKey] = useState("");
  const locations = item.product.productLocations ?? [];
  const defaultLocationId = item.defaultLocationId || locations[0]?.locationId || "";
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [locationOpen, setLocationOpen] = useState(false);
  const [liked, setLiked] = useState(item.product.isLikedByUser);
  const [likeCount, setLikeCount] = useState(item.product.likeCount || 0);
  const [inWishbag, setInWishbag] = useState(Boolean(item.product.isInWishbag));
  const [wishbagItemId, setWishbagItemId] = useState(item.product.wishbagItemId || "");
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");

  const activeLocation = locations.find((loc) => loc.locationId === locationId) || locations[0];
  const pills = (item.fitVariants || []).filter(
    (variant) => variant.locationId === (activeLocation?.locationId || "")
  );
  const selectedFit: ShopFitVariant | undefined =
    pills.find((pill) => `${pill.fitType}-${pill.sizeLabel}` === fitKey) || pills[0];

  const images = useMemo(() => firstImage(item), [item]);
  const price = activeLocation?.priceAmount ?? item.product.amount;
  const symbol = activeLocation?.currencySymbol ?? item.product.currencySymbol ?? "$";
  const qty = item.product.quantity;
  const fitScore = Math.round(selectedFit?.score ?? item.product.userFitPercentage ?? 0);

  const variantId = item.product.sizeVariants?.find(
    (variant) =>
      variant.sizeLabel === (selectedFit?.sizeLabel || "") &&
      variant.locationId === (activeLocation?.locationId || "")
  )?.variantId;

  async function onLike() {
    setPending("like");
    setMessage("");
    try {
      const result = await runAction({ action: "like", productId: item.product.productId });
      setLiked(Boolean(result.liked));
      setLikeCount(Number(result.likeCount ?? likeCount));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not like");
    } finally {
      setPending("");
    }
  }

  async function onWishbag() {
    setPending("wishbag");
    setMessage("");
    try {
      if (inWishbag && wishbagItemId) {
        await runAction({ action: "removeWishbag", wishbagItemId });
        setInWishbag(false);
      } else {
        const result = await runAction({
          action: "addToWishbag",
          productId: item.product.productId,
          variantId
        });
        setInWishbag(true);
        if (result?.wishbagItemId) setWishbagItemId(result.wishbagItemId);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update Wishbag");
    } finally {
      setPending("");
    }
  }

  async function onAddToCart() {
    if (!variantId) {
      setMessage("Select a product option");
      return;
    }
    setPending("cart");
    setMessage("");
    try {
      await runAction({ action: "addToCart", variantId, quantity: 1 });
      setMessage("Added to cart");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add to cart");
    } finally {
      setPending("");
    }
  }

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <Link href={`/brand/${item.brand.id}`} className={styles.brandMeta}>
          {item.brand.logoUrl ? (
            <img src={item.brand.logoUrl} alt="" className={styles.brandLogo} />
          ) : (
            <div className={styles.brandLogo} />
          )}
          <div>
            <p className={styles.brandName}>{item.brand.name}</p>
            <p className={styles.brandLoc}>
              {[activeLocation?.city || item.brand.city, activeLocation?.stateProvince || item.brand.stateProvince]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </Link>
        <button type="button" className={styles.iconBtn} onClick={onWishbag} disabled={pending === "wishbag"} aria-label="Wishbag">
          <BookmarkIcon filled={inWishbag} />
        </button>
      </header>

      <h2 className={styles.productName}>{item.product.name}</h2>
      {item.product.productDescription ? (
        <p className={styles.productDesc}>{item.product.productDescription}</p>
      ) : null}

      {locations.length > 0 ? (
        <div className={styles.locationRow}>
          <span>{activeLocation?.address || ""}</span>
          <button type="button" className={styles.locationCount} onClick={() => setLocationOpen(true)}>
            {locations.length} {locations.length === 1 ? "Location" : "Locations"}
          </button>
        </div>
      ) : null}

      {pills.length > 0 ? (
        <div className={styles.pills}>
          {pills.map((pill) => {
            const key = `${pill.fitType}-${pill.sizeLabel}`;
            const active = selectedFit && `${selectedFit.fitType}-${selectedFit.sizeLabel}` === key;
            const label = `${pill.fitType ? pill.fitType.charAt(0).toUpperCase() + pill.fitType.slice(1) : ""} ${pill.sizeLabel}`.trim();
            return (
              <button
                key={key}
                type="button"
                className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                onClick={() => setFitKey(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={styles.media}>
        <Link href={`/product/${item.product.productId}`} className={styles.carousel}>
          {(images.length ? images : [""]).map((src, index) =>
            src ? (
              <img key={`${src}-${index}`} src={src} alt={item.product.name} className={styles.slide} />
            ) : (
              <div key={index} className={styles.slide} />
            )
          )}
        </Link>
        <div className={styles.badges}>
          <div className={styles.badgeCircle}>
            <strong>{fitScore}%</strong>
            <span>Fit</span>
          </div>
          <div className={styles.badgeCircle}>
            <strong>
              {symbol}
              {price}
            </strong>
          </div>
          <div className={styles.badgeCircle}>
            {qty > 0 ? (
              <>
                <strong>{qty}</strong>
                <span>Left</span>
              </>
            ) : (
              <span>Out of Stock</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.like} onClick={onLike} disabled={pending === "like"} aria-label="Like">
          <HeartIcon filled={liked} />
          {likeCount}
        </button>
        <button type="button" className={styles.cartBtn} onClick={onAddToCart} disabled={pending === "cart" || qty < 1}>
          {pending === "cart" ? "Adding…" : "Add to cart"}
        </button>
      </div>
      {message ? <p className={styles.cardMessage}>{message}</p> : null}

      {locationOpen ? (
        <LocationPicker
          locations={locations}
          selectedId={activeLocation?.locationId || ""}
          onSelect={(id) => {
            setLocationId(id);
            setLocationOpen(false);
          }}
          onClose={() => setLocationOpen(false)}
        />
      ) : null}
    </article>
  );
}

function LocationPicker({
  locations,
  selectedId,
  onSelect,
  onClose
}: {
  locations: ShopProductLocation[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.sheetRoot} onClick={onClose} role="presentation">
      <div className={styles.sheet} onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Select Location">
        <p className={styles.sheetTitle}>Select Location</p>
        {locations.map((location) => (
          <button
            key={location.locationId}
            type="button"
            className={`${styles.sheetRow} ${location.locationId === selectedId ? styles.sheetRowActive : ""}`}
            onClick={() => onSelect(location.locationId)}
          >
            <strong>{location.name || location.city}</strong>
            <span>{location.address || [location.city, location.stateProvince, location.country].filter(Boolean).join(", ")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
