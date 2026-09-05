"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../webclient.module.css";

export function CheckoutComplete() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    const status = params?.get("redirect_status");
    const paymentIntentId = params?.get("payment_intent");
    const orderId = params?.get("orderId") || sessionStorage.getItem("cm_checkout_order");

    if (status && status !== "succeeded") {
      setMessage("Payment was not completed. Returning to checkout…");
      router.replace("/checkout");
      return;
    }

    if (!orderId || !paymentIntentId) {
      router.replace("/checkout");
      return;
    }

    fetch("/api/webclient/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "confirmPayment",
        orderId,
        paymentIntentId
      })
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || "Could not confirm payment");
        }
        sessionStorage.removeItem("cm_checkout_order");
        router.replace("/checkout/thank-you");
      })
      .catch((error: Error) => {
        setMessage(error.message);
      });
  }, [params, router]);

  return (
    <section className={styles.pagePad}>
      <h1 className={styles.pageTitle}>Checkout</h1>
      <p className={styles.muted}>{message}</p>
    </section>
  );
}
