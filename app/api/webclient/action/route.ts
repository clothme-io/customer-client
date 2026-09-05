import { NextResponse } from "next/server";
import { customerFetch } from "../../../(webclient)/lib/api";
import { actionError, requireSession } from "../../../(webclient)/lib/require-session";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error || !session) return error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  try {
    if (action === "like") {
      const productId = String(body.productId || "");
      const result = await customerFetch(`/v1/customer/likes/products/${productId}`, {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: {}
      });
      return NextResponse.json(result);
    }

    if (action === "addToCart") {
      const variantId = String(body.variantId || "");
      const quantity = Number(body.quantity || 1);
      if (!variantId) {
        return NextResponse.json({ message: "Select a product option" }, { status: 400 });
      }
      const result = await customerFetch("/v1/customer/cart/items", {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: { variantId, quantity }
      });
      return NextResponse.json(result);
    }

    if (action === "updateCartItem") {
      const cartItemId = String(body.cartItemId || "");
      const quantity = Number(body.quantity);
      if (!cartItemId || !Number.isFinite(quantity)) {
        return NextResponse.json({ message: "Missing cart item" }, { status: 400 });
      }
      const path = `/v1/customer/cart/items/${cartItemId}`;
      const result =
        quantity <= 0
          ? await customerFetch(path, {
              method: "DELETE",
              accessToken: session.accessToken,
              personId: session.personId
            })
          : await customerFetch(path, {
              method: "PATCH",
              accessToken: session.accessToken,
              personId: session.personId,
              body: { quantity }
            });
      return NextResponse.json(result ?? { ok: true });
    }

    if (action === "addToWishbag") {
      const result = await customerFetch("/v1/customer/wishbag/items", {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: {
          productId: body.productId,
          ...(body.variantId ? { variantId: body.variantId } : {}),
          quantity: 1
        }
      });
      return NextResponse.json(result);
    }

    if (action === "removeWishbag") {
      const wishbagItemId = String(body.wishbagItemId || "");
      const result = await customerFetch(
        `/v1/customer/wishbag/items/${wishbagItemId}/decrease`,
        {
          method: "PATCH",
          accessToken: session.accessToken,
          personId: session.personId,
          body: { quantity: 1 }
        }
      );
      return NextResponse.json(result);
    }

    if (action === "sendSupport") {
      const result = await customerFetch("/v1/inbox/support/send", {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: { message: String(body.message || "") }
      });
      return NextResponse.json(result);
    }

    if (action === "addAddress") {
      const result = await customerFetch(`/v1/customer/persons/${session.personId}/addresses`, {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: {
          apartmentNumber: String(body.apartmentNumber || ""),
          streetNumber: String(body.streetNumber || ""),
          streetName: String(body.streetName || ""),
          city: String(body.city || ""),
          country: String(body.country || ""),
          provinceState: String(body.provinceState || ""),
          postalZipcode: String(body.postalZipcode || ""),
          latitude: String(body.latitude || "0"),
          longitude: String(body.longitude || "0"),
          isPrimary: Boolean(body.isPrimary)
        }
      });
      return NextResponse.json(result);
    }

    if (action === "selectShipping") {
      const result = await customerFetch("/v1/customer/cart/select-shipping", {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: {
          vendorId: body.vendorId,
          shippingCents: Math.round(Number(body.shippingAmount || 0) * 100),
          currency: body.currency,
          carrier: body.carrier,
          serviceLevel: body.service,
          estimatedDaysMin: body.estimatedMinDays,
          estimatedDaysMax: body.estimatedMaxDays,
          provider: body.provider,
          rateId: body.rateId
        }
      });
      return NextResponse.json(result);
    }

    if (action === "initCheckout") {
      const result = await customerFetch("/v1/customer/checkout", {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: {
          useCredits: Boolean(body.useCredits),
          shippingAddressId: body.shippingAddressId,
          billingAddressId: body.billingAddressId || body.shippingAddressId
        }
      });
      return NextResponse.json(result);
    }

    if (action === "confirmPayment") {
      const orderId = String(body.orderId || "");
      const result = await customerFetch(`/v1/customer/orders/${orderId}/confirm-payment`, {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: { providerPaymentId: body.paymentIntentId }
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (err) {
    return actionError(err);
  }
}
