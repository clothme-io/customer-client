"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CartData, CartItem } from "../lib/types";
import { cartVendorSections, shippingComplete, shippingTotal } from "../lib/cart-utils";
import { VendorShippingSelector } from "./VendorShippingSelector";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

async function updateQty(cartItemId: string, quantity: number) {
  const response = await fetch("/api/webclient/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updateCartItem", cartItemId, quantity })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Could not update cart");
}

function money(symbol: string, amount: number) {
  return `${symbol}${Number(amount || 0).toFixed(2).replace(/\.00$/, "")}`;
}

function CartProduct({
  item,
  symbol,
  onQty
}: {
  item: CartItem;
  symbol: string;
  onQty: (cartItemId: string, next: number) => void;
}) {
  return (
    <article className={styles.cartItem}>
      {item.productImage ? <img src={item.productImage} alt="" /> : <div />}
      <div>
        <strong>{item.productName}</strong>
        <p className={shell.muted} style={{ margin: "4px 0" }}>
          {item.productBrandName || item.brandName}
          {item.productSizeLabel ? ` · ${item.productSizeLabel}` : ""}
          {item.productColorName ? ` · ${item.productColorName}` : ""}
        </p>
        <p className={shell.muted}>{item.productLocationAddress}</p>
        <p>
          {symbol}
          {item.productAmount}
        </p>
      </div>
      <div className={styles.qty}>
        <button type="button" onClick={() => onQty(item.cartItemId, item.productQuantity - 1)} aria-label="Decrease">
          −
        </button>
        <span>{item.productQuantity}</span>
        <button type="button" onClick={() => onQty(item.cartItemId, item.productQuantity + 1)} aria-label="Increase">
          +
        </button>
      </div>
    </article>
  );
}

export function CartView({ cart }: { cart: CartData }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const items = cart.cartItems || [];
  const summary = cart.cart;
  const symbol = summary?.currencySymbol || "$";
  const sections = cartVendorSections(items);
  const delivery = shippingTotal(cart);
  const canCheckout = shippingComplete(cart);

  async function changeQty(cartItemId: string, next: number) {
    setError("");
    try {
      await updateQty(cartItemId, next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update cart");
    }
  }

  if (!items.length) {
    return <p className={styles.empty}>Your cart is empty.</p>;
  }

  return (
    <div className={styles.cartPage} data-cart-page>
      <div className={styles.cartScroll}>
        <h1 className={shell.pageTitle} style={{ padding: "16px 16px 0" }}>
          Cart
        </h1>
        {sections.map((section) => {
        const shipping = cart.vendorShipping?.find((row) => row.vendorId === section.vendorId);
        const itemsTotal = section.items.reduce(
          (sum, item) => sum + item.productAmount * item.productQuantity,
          0
        );
        const shippingAmount = shipping?.shippingAmount ?? 0;
        const sectionTotal = itemsTotal + shippingAmount;

        return (
          <section key={section.vendorId || section.brandName} className={styles.cartSection}>
            {section.items.map((item) => (
              <CartProduct key={item.cartItemId} item={item} symbol={symbol} onQty={changeQty} />
            ))}

            {section.vendorId ? (
              <VendorShippingSelector
                vendorId={section.vendorId}
                brandId={section.brandId}
                brandName={section.brandName}
                selected={shipping}
              />
            ) : null}

            <div className={styles.sectionTotal}>
              <div className={styles.summaryRow}>
                <span>Items</span>
                <span>{money(symbol, itemsTotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>{shippingAmount === 0 ? "Free" : money(symbol, shippingAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <strong>{section.brandName} total</strong>
                <strong>{money(symbol, sectionTotal)}</strong>
              </div>
            </div>
          </section>
        );
      })}
      </div>

      <div className={styles.summary}>
        {error ? <p className={shell.error}>{error}</p> : null}
        {!canCheckout ? (
          <p className={shell.muted} style={{ marginBottom: 12 }}>
            Choose a shipping option for each brand before checkout.
          </p>
        ) : null}
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>
            {symbol}
            {summary.subTotal ?? summary.totalAmount}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span>Tax</span>
          <span>
            {symbol}
            {summary.totalTax}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span>Delivery</span>
          <span>
            {symbol}
            {delivery}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <strong>Total</strong>
          <strong>
            {symbol}
            {summary.total}
          </strong>
        </div>
        {canCheckout ? (
          <Link className={shell.button} href="/checkout" style={{ width: "100%", marginTop: 12 }}>
            Checkout
          </Link>
        ) : (
          <button type="button" className={shell.button} disabled style={{ width: "100%", marginTop: 12 }}>
            Checkout
          </button>
        )}
      </div>
    </div>
  );
}
