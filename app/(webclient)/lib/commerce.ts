import { customerFetch } from "./api";
import type { WebClientSession } from "./session";
import type {
  AccountAddress,
  AccountProfile,
  CartData,
  DeliveryMethodOption,
  SupportMessage
} from "./types";

export async function fetchCart(session: WebClientSession) {
  return customerFetch<CartData>("/v1/customer/cart", {
    accessToken: session.accessToken,
    personId: session.personId
  });
}

export function cartCount(cart: CartData | null | undefined) {
  const items = cart?.cartItems ?? [];
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.cartItemId)) return false;
      seen.add(item.cartItemId);
      return true;
    })
    .reduce((sum, item) => sum + (item.productQuantity || 0), 0);
}

export async function fetchAccountProfile(session: WebClientSession) {
  return customerFetch<AccountProfile>("/v1/customer/me", {
    accessToken: session.accessToken,
    personId: session.personId
  });
}

export async function fetchAddresses(session: WebClientSession) {
  const data = await customerFetch<{ items?: AccountAddress[] } | AccountAddress[]>(
    `/v1/customer/persons/${session.personId}/addresses`,
    {
      accessToken: session.accessToken,
      personId: session.personId
    }
  );
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export async function fetchDeliveryMethods(vendorId: string, brandId: string) {
  const data = await customerFetch<DeliveryMethodOption[] | { items?: DeliveryMethodOption[] }>(
    "/delivery/brand-methods",
    {
      query: { vendorId, brandId }
    }
  );
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export async function fetchSupportMessages(session: WebClientSession) {
  return customerFetch<SupportMessage[]>("/v1/inbox/support/messages", {
    accessToken: session.accessToken,
    personId: session.personId
  });
}
