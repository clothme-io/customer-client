import type { CartData, CartItem, VendorShippingSelection } from "./types";

export function vendorGroups(items: CartItem[]) {
  return cartVendorSections(items)
    .filter((group) => group.vendorId)
    .map(({ vendorId, brandId, brandName }) => ({ vendorId, brandId, brandName }));
}

export function cartVendorSections(items: CartItem[]) {
  const groups: { vendorId: string; brandId: string; brandName: string; items: CartItem[] }[] = [];
  const indexByVendor = new Map<string, number>();

  for (const item of items) {
    const vendorId = item.vendorId || "";
    const existing = indexByVendor.get(vendorId);
    if (existing !== undefined) {
      groups[existing].items.push(item);
      continue;
    }
    indexByVendor.set(vendorId, groups.length);
    groups.push({
      vendorId,
      brandId: item.productBrandId || item.brandId || "",
      brandName: item.productBrandName || item.brandName || "Items",
      items: [item]
    });
  }

  return groups;
}

export function shippingSelections(cart: CartData | null | undefined): VendorShippingSelection[] {
  return cart?.vendorShipping ?? [];
}

export function shippingTotal(cart: CartData | null | undefined) {
  const rows = shippingSelections(cart);
  if (rows.length) {
    return rows.reduce((sum, row) => sum + (row.shippingAmount || 0), 0);
  }
  return cart?.cart?.deliveryFee ?? 0;
}

export function shippingComplete(cart: CartData | null | undefined) {
  const items = cart?.cartItems ?? [];
  const groups = vendorGroups(items);
  if (groups.length === 0) return true;
  const selected = new Set(shippingSelections(cart).map((row) => row.vendorId));
  return groups.every((group) => selected.has(group.vendorId));
}
