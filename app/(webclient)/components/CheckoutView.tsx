"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { AccountAddress, CartData, CheckoutSession } from "../lib/types";
import { shippingComplete, shippingTotal } from "../lib/cart-utils";
import { WEBCLIENT_MOCK } from "../lib/config";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

const stripeCache = new Map<string, Promise<Stripe | null>>();

function stripeFor(publishableKey: string) {
  const existing = stripeCache.get(publishableKey);
  if (existing) return existing;
  const promise = loadStripe(publishableKey);
  stripeCache.set(publishableKey, promise);
  return promise;
}

function formatAddress(address: AccountAddress) {
  const line = [address.apartmentNumber, address.streetNumber, address.streetName].filter(Boolean).join(" ");
  return `${line}, ${address.city}, ${address.provinceState} ${address.postalZipcode}`;
}

async function postAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/webclient/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || "Request failed");
  }
  return body;
}

function MockPayForm({ totalLabel }: { totalLabel: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    router.push("/checkout/thank-you");
  }

  return (
    <form onSubmit={onSubmit} className={styles.payBox}>
      <p className={styles.sectionLabel} style={{ marginTop: 0 }}>
        Payment
      </p>
      <label className={shell.field}>
        Card number
        <input defaultValue="4242 4242 4242 4242" readOnly aria-label="Card number" />
      </label>
      <div className={styles.payRow}>
        <label className={shell.field}>
          Expiry
          <input defaultValue="12 / 28" readOnly aria-label="Expiry" />
        </label>
        <label className={shell.field}>
          CVC
          <input defaultValue="123" readOnly aria-label="CVC" />
        </label>
      </div>
      <button className={shell.button} type="submit" disabled={busy} style={{ width: "100%", marginTop: 8 }}>
        {busy ? "Processing…" : `Pay ${totalLabel}`}
      </button>
    </form>
  );
}

function PayForm({
  orderId,
  clientSecret,
  totalLabel
}: {
  orderId: string;
  clientSecret: string;
  totalLabel: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/complete?orderId=${encodeURIComponent(orderId)}`
        },
        redirect: "if_required"
      });
      if (result.error) {
        throw new Error(result.error.message || "Payment failed");
      }
      const paymentIntentId =
        result.paymentIntent?.id || clientSecret.split("_secret_")[0];
      await postAction({
        action: "confirmPayment",
        orderId,
        paymentIntentId
      });
      sessionStorage.removeItem("cm_checkout_order");
      router.push("/checkout/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.payBox}>
      <PaymentElement />
      {error ? <p className={shell.error}>{error}</p> : null}
      <button className={shell.button} type="submit" disabled={busy || !stripe} style={{ width: "100%", marginTop: 16 }}>
        {busy ? "Processing…" : `Pay ${totalLabel}`}
      </button>
    </form>
  );
}

function SignInInline({
  email,
  onEmail,
  onDone,
  onError
}: {
  email: string;
  onEmail: (value: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    onError("");
    try {
      const response = await fetch("/api/webclient/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signin", email, password })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Sign in failed");
      onDone();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.addressForm}>
      <label className={shell.field}>
        Email
        <input type="email" value={email} onChange={(event) => onEmail(event.target.value)} required />
      </label>
      <label className={shell.field}>
        Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      <button className={shell.button} type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function CheckoutView({
  cart,
  addresses,
  contactEmail = "",
  isRegistered = false
}: {
  cart: CartData;
  addresses: AccountAddress[];
  contactEmail?: string;
  isRegistered?: boolean;
}) {
  const router = useRouter();
  const items = cart.cartItems || [];
  const symbol = cart.cart?.currencySymbol || "$";
  const total = cart.cart?.total ?? 0;
  const delivery = shippingTotal(cart);
  const readyToShip = shippingComplete(cart);
  const defaultAddress = addresses.find((row) => row.isDefault) || addresses[0];
  const [addressId, setAddressId] = useState(defaultAddress?.addressId || "");
  const [email, setEmail] = useState(contactEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [session, setSession] = useState<CheckoutSession | null>(
    WEBCLIENT_MOCK
      ? {
          clientSecret: "pi_mock_secret_mock",
          orderId: "ord-mock",
          publishableKey: "pk_test_mock"
        }
      : null
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [savedAddresses, setSavedAddresses] = useState(addresses);

  const stripePromise = useMemo(
    () => (session?.publishableKey ? stripeFor(session.publishableKey) : null),
    [session?.publishableKey]
  );

  async function startPayment() {
    if (!addressId) {
      setError("Add a shipping address to continue.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Add an email so we can send your receipt and track the order.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!isRegistered && password.trim()) {
        const auth = await fetch("/api/webclient/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "signup", email: trimmedEmail, password: password.trim() })
        });
        const authBody = await auth.json().catch(() => ({}));
        if (!auth.ok) throw new Error(authBody.message || "Could not create account");
      } else if (!isRegistered) {
        const attached = await fetch("/api/webclient/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "attachEmail", email: trimmedEmail })
        });
        const attachedBody = await attached.json().catch(() => ({}));
        if (!attached.ok) throw new Error(attachedBody.message || "Could not save email");
      }

      const result = await postAction({
        action: "initCheckout",
        useCredits: false,
        shippingAddressId: addressId,
        billingAddressId: addressId,
        email: trimmedEmail
      });
      const next: CheckoutSession = {
        clientSecret: result.clientSecret,
        ephemeralKey: result.ephemeralKey,
        customerId: result.customerId,
        orderId: result.orderId,
        publishableKey: result.publishableKey
      };
      if (!next.clientSecret || !next.orderId || !next.publishableKey) {
        throw new Error("Checkout did not return a payment session");
      }
      sessionStorage.setItem("cm_checkout_order", next.orderId);
      setSession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await postAction({
        action: "addAddress",
        apartmentNumber: form.get("apartmentNumber") || "",
        streetNumber: form.get("streetNumber") || "",
        streetName: form.get("streetName") || "",
        city: form.get("city") || "",
        provinceState: form.get("provinceState") || "",
        postalZipcode: form.get("postalZipcode") || "",
        country: form.get("country") || "",
        isPrimary: savedAddresses.length === 0
      });
      const created = (result.addressId ? result : result.result || result) as AccountAddress;
      const nextAddress: AccountAddress = {
        addressId: created.addressId,
        apartmentNumber: String(form.get("apartmentNumber") || ""),
        streetNumber: String(form.get("streetNumber") || ""),
        streetName: String(form.get("streetName") || ""),
        city: String(form.get("city") || ""),
        provinceState: String(form.get("provinceState") || ""),
        postalZipcode: String(form.get("postalZipcode") || ""),
        country: String(form.get("country") || ""),
        isDefault: savedAddresses.length === 0
      };
      setSavedAddresses((current) => [...current, nextAddress]);
      setAddressId(nextAddress.addressId);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <section className={shell.pagePad}>
        <h1 className={shell.pageTitle}>Checkout</h1>
        <p className={shell.muted}>Your cart is empty.</p>
        <Link className={shell.button} href="/shop" style={{ marginTop: 16 }}>
          Continue shopping
        </Link>
      </section>
    );
  }

  if (!readyToShip) {
    return (
      <section className={shell.pagePad}>
        <h1 className={shell.pageTitle}>Checkout</h1>
        <p className={shell.muted}>Choose a shipping option for each brand in your cart first.</p>
        <Link className={shell.button} href="/cart" style={{ marginTop: 16 }}>
          Back to cart
        </Link>
      </section>
    );
  }

  const totalLabel = `${symbol}${total}`;

  return (
    <section className={shell.pagePad}>
      <h1 className={shell.pageTitle}>Checkout</h1>
      <p className={shell.muted}>
        {items.length} items · Delivery {symbol}
        {delivery} · Total {totalLabel}
      </p>

      <h2 className={styles.sectionLabel}>Shipping address</h2>
      {savedAddresses.map((address) => (
        <button
          key={address.addressId}
          type="button"
          className={`${styles.addressRow} ${address.addressId === addressId ? styles.addressRowActive : ""}`}
          onClick={() => {
            setAddressId(address.addressId);
            setSession(null);
          }}
        >
          <strong>{formatAddress(address)}</strong>
          <span>{address.country}</span>
        </button>
      ))}
      <button type="button" className={`${shell.button} ${shell.ghostButton}`} onClick={() => setShowForm((open) => !open)}>
        {showForm ? "Cancel" : "Add address"}
      </button>

      {showForm ? (
        <form className={styles.addressForm} onSubmit={saveAddress}>
          <label className={shell.field}>
            Street number
            <input name="streetNumber" required />
          </label>
          <label className={shell.field}>
            Street name
            <input name="streetName" required />
          </label>
          <label className={shell.field}>
            Apt / suite
            <input name="apartmentNumber" />
          </label>
          <label className={shell.field}>
            City
            <input name="city" required />
          </label>
          <label className={shell.field}>
            State / province
            <input name="provinceState" required />
          </label>
          <label className={shell.field}>
            Postal code
            <input name="postalZipcode" required />
          </label>
          <label className={shell.field}>
            Country
            <input name="country" required defaultValue="Canada" />
          </label>
          <button className={shell.button} type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save address"}
          </button>
        </form>
      ) : null}

      {error ? <p className={shell.error}>{error}</p> : null}

      <h2 className={styles.sectionLabel}>Order contact</h2>
      <p className={shell.muted} style={{ margin: "0 0 12px" }}>
        We need an email to send your receipt and let you track this order.
      </p>
      <label className={shell.field}>
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          readOnly={isRegistered}
          required
        />
      </label>
      {!isRegistered ? (
        <>
          <button
            type="button"
            className={`${shell.button} ${shell.ghostButton}`}
            onClick={() => setShowPassword((open) => !open)}
          >
            {showPassword ? "Skip account for now" : "Create an account (optional)"}
          </button>
          {showPassword ? (
            <>
              <p className={shell.muted} style={{ margin: "8px 0 12px" }}>
                Add a password to open this order and your sizes in the ClothME app.
              </p>
              <label className={shell.field}>
                Password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                />
              </label>
            </>
          ) : null}
          <p className={shell.muted} style={{ margin: "8px 0 16px" }}>
            Already have an account?{" "}
            <button type="button" className={styles.locationCount} onClick={() => setShowSignIn((open) => !open)}>
              Sign in
            </button>
          </p>
          {showSignIn ? (
            <SignInInline
              email={email}
              onEmail={setEmail}
              onDone={() => {
                router.refresh();
              }}
              onError={setError}
            />
          ) : null}
        </>
      ) : null}

      {!session ? (
        <button
          type="button"
          className={shell.button}
          style={{ width: "100%", marginTop: 20 }}
          disabled={busy || !addressId || !email.trim()}
          onClick={startPayment}
        >
          {busy ? "Starting checkout…" : "Continue to payment"}
        </button>
      ) : WEBCLIENT_MOCK ? (
        <MockPayForm totalLabel={totalLabel} />
      ) : stripePromise && session.clientSecret ? (
        <Elements
          key={session.clientSecret}
          stripe={stripePromise}
          options={{
            clientSecret: session.clientSecret,
            appearance: { theme: "stripe", variables: { colorPrimary: "#0a7ea4" } }
          }}
        >
          <PayForm orderId={session.orderId} clientSecret={session.clientSecret} totalLabel={totalLabel} />
        </Elements>
      ) : null}
    </section>
  );
}
