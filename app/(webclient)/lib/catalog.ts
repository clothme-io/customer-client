import { customerFetch } from "./api";
import type { AccountPerson, DiscoverBrand, ProductDetail, ShopCard, ShopResponseData, ShopUser } from "./types";
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

function ageFromDob(dob?: string) {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function mergeShopProfiles(avatars: ShopUser[], people: AccountPerson[] = []): ShopUser[] {
  return avatars.map((avatar) => {
    const extra = people.find((person) => person.userId === avatar.userId);
    if (!extra) return avatar;
    return {
      ...avatar,
      relationship: avatar.relationship || extra.relationship,
      gender: avatar.gender || extra.gender,
      dob: avatar.dob || extra.dob,
      topSize: avatar.topSize || extra.topSize,
      bottomSize: avatar.bottomSize || extra.bottomSize
    };
  });
}

export function shopProfileLines(user: ShopUser) {
  const age = ageFromDob(user.dob);
  const isKid =
    (age != null && age < 13) || /kid|child|son|daughter/i.test(user.relationship || "");
  const gender = (user.gender || "").charAt(0).toUpperCase();
  const category = isKid && age != null ? `Kid • ${age} yrs` : isKid ? "Kid" : "Adult";
  const sizeValue = isKid ? user.topSize || user.bottomSize || "" : "";
  let size = "";
  if (isKid && sizeValue) {
    size = age != null ? `${sizeValue} (${age})` : sizeValue;
  } else if (user.topSize && user.bottomSize) {
    size = `${user.topSize}/${user.bottomSize}${gender ? ` • ${gender}` : ""}`;
  } else if (user.topSize || user.bottomSize) {
    size = `${user.topSize || user.bottomSize}${gender ? ` • ${gender}` : ""}`;
  } else if (gender) {
    size = gender;
  }
  return { category, size };
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
