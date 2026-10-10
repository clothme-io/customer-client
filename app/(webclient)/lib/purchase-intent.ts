"use client";
import { commerceEvent } from "./commerce-events";
import { safeInternalPath } from "./size-contract";
import { ensureClientGuest, sessionFetch } from "./session-client";
export type PurchaseIntent = {
  id: string;
  accountId: string;
  personId: string;
  createdAt: number;
  productId?: string;
  brandId?: string;
  colorId?: string;
  locationId?: string;
  quantity: number;
  returnTo: string;
};
const KEY = "cm_purchase_intent_v1";
export function readPurchaseIntent(): PurchaseIntent | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (
      !value ||
      typeof value.createdAt !== "number" ||
      Date.now() - value.createdAt > 24 * 60 * 60_000
    )
      return null;
    return { ...value, returnTo: safeInternalPath(value.returnTo) };
  } catch {
    return null;
  }
}
export async function readPurchaseIntentForProfile(productId: string): Promise<PurchaseIntent | null> {
  try {
    const response = await sessionFetch("/api/webclient/session");
    if (!response.ok) return null;
    const session = await response.json();
    const intent = readPurchaseIntent();
    if (!session.authenticated || !session.accountId || !session.personId ||
        intent?.productId !== productId ||
        intent.accountId !== session.accountId || intent.personId !== session.personId)
      return null;
    return intent;
  } catch {
    return null;
  }
}
export function clearPurchaseIntent() {
  sessionStorage.removeItem(KEY);
}
export async function ensureFitProfile(
  input: Partial<PurchaseIntent>,
): Promise<boolean> {
  await ensureClientGuest();
  const response = await sessionFetch("/api/webclient/fit-profile");
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      body.message || "Could not check your fit profile. Please retry.",
    );
  if (body.ready) return true;
  const intent: PurchaseIntent = {
    ...input,
    id: crypto.randomUUID(),
    accountId: body.accountId,
    personId: body.personId,
    createdAt: Date.now(),
    quantity: Math.max(1, Math.min(20, input.quantity || 1)),
    returnTo: safeInternalPath(input.returnTo || window.location.pathname),
  };
  sessionStorage.setItem(KEY, JSON.stringify(intent));
  commerceEvent("fit_profile_required", { productId: intent.productId || "" });
  return false;
}
