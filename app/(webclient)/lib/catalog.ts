import { unstable_cache } from "next/cache";
import { customerFetch, isTooManyRequests } from "./api";
import type {
  BrandPayload,
  AccountPerson,
  DiscoverBrand,
  ProductDetail,
  ShopCard,
  ShopResponseData,
  ShopUser,
} from "./types";
import type { WebClientSession } from "./session";

export async function fetchShopData(session: WebClientSession, page = 1) {
  return customerFetch<ShopResponseData>("/v1/catalog/shop-data", {
    accessToken: session.accessToken,
    personId: session.personId,
    query: { page, pageSize: 20 },
  });
}

export async function fetchShopAvatars(session: WebClientSession) {
  return customerFetch<ShopUser[]>("/v1/catalog/shop-avatars", {
    accessToken: session.accessToken,
    personId: session.personId,
  });
}

type PublicProduct = {
  id: string;
  brandId: string;
  brandName: string;
  title: string;
  likeCount?: number;
  primaryImageUrl?: string | null;
  minPriceCents?: number | null;
  currency?: string | null;
};

type PublicBrand = {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
};

function currencySymbol(code?: string | null) {
  if (code === "EUR") return "€";
  if (code === "GBP") return "£";
  return "$";
}

export function publicProductToShopCard(item: PublicProduct): ShopCard {
  const amount = Number(item.minPriceCents || 0) / 100;
  const image = item.primaryImageUrl || "";
  return {
    product: {
      productId: item.id,
      name: item.title,
      productDescription: "",
      images: image
        ? [{ id: "primary", imageUrl: [image], isPrimary: true }]
        : [],
      quantity: -1,
      currency: item.currency || "USD",
      currencySymbol: currencySymbol(item.currency),
      amount,
      userFitPercentage: Number.NaN,
      likeCount: item.likeCount || 0,
      isLikedByUser: false,
    },
    brand: {
      id: item.brandId,
      logoUrl: "",
      name: item.brandName,
    },
    fitVariants: [],
    defaultLocationId: "",
  };
}

function toDiscoverBrand(brand: PublicBrand): DiscoverBrand {
  return {
    id: brand.id,
    logoUrl: brand.logoUrl || "",
    name: brand.name,
    description: brand.description || "",
    city: "",
    country: "",
    currency: "",
    averageAmount: 0,
    fitProductCount: 0,
    isAccountFavorite: false,
  };
}

const stalePublicShop = new Map<number, ShopCard[]>();
const stalePublicBrands = new Map<number, DiscoverBrand[]>();

const loadPublicShopCards = unstable_cache(
  async (page: number) => {
    const data = await customerFetch<{ items?: PublicProduct[] }>(
      "/v1/catalog/products",
      { query: { page, pageSize: 20, sort: "newest" } },
    );
    return (data?.items ?? []).map(publicProductToShopCard);
  },
  ["public-shop-cards"],
  { revalidate: 300 },
);

const loadPublicBrands = unstable_cache(
  async (page: number) => {
    const data = await customerFetch<{ items?: PublicBrand[] }>(
      "/v1/catalog/brands",
      { query: { page, pageSize: 20 } },
    );
    return (data?.items ?? []).map(toDiscoverBrand);
  },
  ["public-brands"],
  { revalidate: 300 },
);

async function publicCatalog<T>(
  load: () => Promise<T[]>,
  stale: Map<number, T[]>,
  page: number,
) {
  try {
    const items = await load();
    if (items.length) stale.set(page, items);
    return items;
  } catch (err) {
    const cached = stale.get(page);
    if (cached?.length) return cached;
    if (isTooManyRequests(err)) return [];
    throw err;
  }
}

export async function fetchPublicShopCards(page = 1) {
  return publicCatalog(() => loadPublicShopCards(page), stalePublicShop, page);
}

export async function fetchPublicBrands(page = 1) {
  return publicCatalog(() => loadPublicBrands(page), stalePublicBrands, page);
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

export function mergeShopProfiles(
  avatars: ShopUser[],
  people: AccountPerson[] = [],
): ShopUser[] {
  return avatars.map((avatar) => {
    const extra = people.find((person) => person.userId === avatar.userId);
    if (!extra) return avatar;
    return {
      ...avatar,
      relationship: avatar.relationship || extra.relationship,
      gender: avatar.gender || extra.gender,
      dob: avatar.dob || extra.dob,
      topSize: avatar.topSize || extra.topSize,
      bottomSize: avatar.bottomSize || extra.bottomSize,
    };
  });
}

export function shopProfileLines(user: ShopUser) {
  const age = ageFromDob(user.dob);
  const isKid =
    (age != null && age < 13) ||
    /kid|child|son|daughter/i.test(user.relationship || "");
  const gender = (user.gender || "").charAt(0).toUpperCase();
  const category =
    isKid && age != null ? `Kid • ${age} yrs` : isKid ? "Kid" : "Adult";
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
  const data = await customerFetch<{
    accountId: string;
    brands: DiscoverBrand[];
  }>("/v1/catalog/discover/brands", {
    accessToken: session.accessToken,
    personId: session.personId,
  });
  return data?.brands ?? [];
}

export async function fetchProductDetail(
  productId: string,
  session?: WebClientSession | null,
): Promise<ProductDetail | null> {
  const data = await customerFetch<{ product: ProductDetail }>(
    "/v1/catalog/product-details",
    {
      accessToken: session?.accessToken,
      personId: session?.personId,
      query: {
        id: productId,
        includeVisuals: true,
        includeLocations: true,
        includeReviews: true,
      },
    },
  );
  return data?.product ?? null;
}

export function shopCards(data: ShopResponseData | null): ShopCard[] {
  return data?.shopData ?? [];
}

export async function fetchBrandDetail(
  id: string,
  session?: WebClientSession | null,
) {
  return customerFetch<BrandPayload>("/v1/catalog/brand-details", {
    accessToken: session?.accessToken,
    personId: session?.personId,
    query: {
      brandId: id,
      accountId: session?.accountId,
      userId: session?.personId,
    },
  });
}
