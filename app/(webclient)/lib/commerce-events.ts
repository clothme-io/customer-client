"use client";
import { track } from "../../../src/lib/track";
const ALLOWED = new Set([
  "productId",
  "brandId",
  "orderId",
  "currency",
  "value",
  "count",
  "stage",
  "eventId",
  "utm_source",
  "utm_medium",
  "utm_campaign",
]);
export function commerceEvent(
  name: string,
  properties: Record<string, string | number> = {},
) {
  const safe = Object.fromEntries(
    Object.entries(properties).filter(([key]) => ALLOWED.has(key)),
  );
  track(name, safe);
}
export function purchaseEvent(orderId: string) {
  const key = `cm_purchase_tracked:${orderId}`;
  if (sessionStorage.getItem(key)) return;
  commerceEvent("purchase", { orderId, eventId: `purchase:${orderId}` });
  sessionStorage.setItem(key, "1");
}
