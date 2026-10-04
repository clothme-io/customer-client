import {
  analytics,
  syncAnalyticsIdentity,
  resetAnalyticsIdentity,
} from "./client.js";
const actions = new Set([
  "signin",
  "signup",
  "guest",
  "attachEmail",
  "like",
  "removeWishbag",
  "addToWishbag",
  "updateCartItem",
  "selectShipping",
  "addAddress",
  "initCheckout",
  "confirmPayment",
  "sendSupport",
  "addToCart",
]);
// Inspect only the action discriminator, never serialize request or response bodies.
export function requestObservation(input, init) {
  const raw = String(input);
  if (!raw.startsWith("/api/webclient/")) return () => {};
  let action = "read";
  try {
    if (typeof init?.body === "string") {
      const body = JSON.parse(init.body);
      action = actions.has(body.action)
        ? body.action
        : body.personId
          ? "selectProfile"
          : "mutation";
    } else if (init?.body instanceof FormData) {
      const candidate = init.body.get("action");
      action = ["generate", "manual", "validateFront", "validateSide"].includes(
        candidate,
      )
        ? candidate
        : "size_upload";
    }
    if (init?.method === "DELETE" && raw === "/api/webclient/session")
      action = "logout";
  } catch {
    action = "mutation";
  }
  const started = Date.now();
  if (action !== "read") analytics.track("request_started", { action });
  return (response) => {
    if (action !== "read" || !response?.ok)
      analytics.track(response?.ok ? "request_succeeded" : "request_failed", {
        action,
        status: response?.status || 0,
        duration_ms: Date.now() - started,
      });
    if (!response?.ok) return;
    const events = {
      signin: "login_succeeded",
      signup: "signup_succeeded",
      logout: "logout",
      selectProfile: "profile_selected",
      like: "favorite_updated",
      addToWishbag: "wishlist_added",
      removeWishbag: "wishlist_removed",
      updateCartItem: "cart_quantity_updated",
      selectShipping: "shipping_selected",
      addAddress: "address_saved",
      sendSupport: "support_message_sent",
    };
    if (events[action]) analytics.track(events[action]);
    if (action === "logout") {
      resetAnalyticsIdentity();
    } else if (["signin", "signup"].includes(action)) syncAnalyticsIdentity();
  };
}
