import { customerFetch } from "./api";
import type { WebClientSession } from "./session";
import type {
  AccountAddress,
  AccountPerson,
  AccountProfile,
  CartData,
  DeliveryMethodOption,
  FavouriteBrandListItem,
  OrderListItem,
  SupportMessage,
  WishbagListItem
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

function itemsFrom<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record[key])) return record[key] as T[];
  const nested = record.data;
  if (nested && typeof nested === "object" && Array.isArray((nested as Record<string, unknown>)[key])) {
    return (nested as Record<string, unknown>)[key] as T[];
  }
  return [];
}

export function personDisplayName(person: Pick<AccountPerson, "firstName" | "lastName">) {
  const last = person.lastName && person.lastName !== "lastName" ? person.lastName : "";
  return `${person.firstName || ""} ${last}`.trim() || "Profile";
}

export function householdMembers(profile: AccountProfile) {
  const ownerId =
    profile.accountUserId ||
    profile.users.find((user) => user.relationship?.toLowerCase() === "self")?.userId;
  return (profile.users ?? []).filter((user) => user.userId !== ownerId);
}

export async function fetchFavouriteBrands(session: WebClientSession) {
  const data = await customerFetch<{ favouriteBrands?: FavouriteBrandListItem[] } | FavouriteBrandListItem[]>(
    "/v1/customer/favourites/brands",
    {
      accessToken: session.accessToken,
      personId: session.personId,
      query: { page: 1, limit: 20 }
    }
  );
  return itemsFrom<FavouriteBrandListItem>(data, "favouriteBrands");
}

export async function fetchOrders(session: WebClientSession) {
  const data = await customerFetch<{ orders?: OrderListItem[] } | OrderListItem[]>("/v1/customer/orders", {
    accessToken: session.accessToken,
    personId: session.personId
  });
  return itemsFrom<OrderListItem>(data, "orders");
}

export async function fetchWishbag(session: WebClientSession) {
  const data = await customerFetch<{ wishbagItems?: WishbagListItem[] } | WishbagListItem[]>(
    "/v1/customer/wishbag",
    {
      accessToken: session.accessToken,
      personId: session.personId
    }
  );
  return itemsFrom<WishbagListItem>(data, "wishbagItems");
}
