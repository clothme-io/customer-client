"use client";
import { track } from "../../../src/lib/track";
export function commerceEvent(
  name: string,
  properties: Record<string, string | number> = {},
) {
  return track(name, properties);
}
export function purchaseEvent(orderId: string) {
  // Stable provider insert IDs deduplicate across tabs; do not mark dropped events delivered.
  return commerceEvent("purchase", { orderId, eventId: `purchase:${orderId}` });
}
