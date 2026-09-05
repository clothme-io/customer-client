import { customerFetch } from "./api";
import type { DiscoverBrand, ProductDetail, ShopCard, ShopResponseData, ShopUser } from "./types";
import type { WebClientSession } from "./session";

export async function fetchShopData(session: WebClientSession, page = 1) {
  return customerFetch<ShopResponseData>("/v1/catalog/shop-data", {
    accessToken: session.accessToken,
    personId: session.personId,
    query: { page, pageSize: 20 }
  });
}

export async function fetchShopAvatars(session: WebClientSession) {
  return customerFetch<ShopUser[]>("/v1/catalog/shop-avatars", {
    accessToken: session.accessToken,
    personId: session.personId
  });
}

export async function fetchDiscoverBrands(session: WebClientSession) {
  const data = await customerFetch<{ accountId: string; brands: DiscoverBrand[] }>(
    "/v1/catalog/discover/brands",
    {
      accessToken: session.accessToken,
      personId: session.personId
    }
  );
  return data?.brands ?? [];
}

export async function fetchProductDetail(
  productId: string,
  session?: WebClientSession | null
): Promise<ProductDetail | null> {
  const data = await customerFetch<{ product: ProductDetail }>("/v1/catalog/product-details", {
    accessToken: session?.accessToken,
    personId: session?.personId,
    query: {
      id: productId,
      includeVisuals: true,
      includeLocations: true,
      includeReviews: true
    }
  });
  return data?.product ?? null;
}

export function shopCards(data: ShopResponseData | null): ShopCard[] {
  return data?.shopData ?? [];
}
