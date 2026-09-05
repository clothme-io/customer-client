import type {
  AccountAddress,
  AccountProfile,
  CartData,
  DeliveryMethodOption,
  DiscoverBrand,
  ProductDetail,
  ShopCard,
  ShopResponseData,
  ShopUser,
  SupportMessage
} from "./types";

const img = (id: string, w = 800, h = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const MOCK_SESSION = {
  accessToken: "mock-access",
  refreshToken: "mock-refresh",
  accountId: "acc-mock",
  personId: "person-maya"
};

export const MOCK_AVATARS: ShopUser[] = [
  {
    userId: "person-maya",
    firstName: "Maya",
    lastName: "Chen",
    profileImage: img("photo-1534528741775-53994a69daeb", 240, 240),
    isAccountOwner: true
  },
  {
    userId: "person-leo",
    firstName: "Leo",
    lastName: "Chen",
    profileImage: img("photo-1507003211169-0a1dd7228f2d", 240, 240),
    isAccountOwner: false
  },
  {
    userId: "person-nina",
    firstName: "Nina",
    lastName: "Chen",
    profileImage: img("photo-1524504388940-b1c1722653e1", 240, 240),
    isAccountOwner: false
  }
];

function shopCard(input: {
  productId: string;
  name: string;
  amount: number;
  photo: string;
  brandId: string;
  brandName: string;
  brandLogo: string;
  fit: number;
  liked?: boolean;
  wish?: boolean;
  city?: string;
}): ShopCard {
  const locationId = `${input.brandId}-loc`;
  return {
    defaultLocationId: locationId,
    brand: {
      id: input.brandId,
      name: input.brandName,
      logoUrl: input.brandLogo,
      city: input.city || "Vancouver",
      country: "Canada"
    },
    fitVariants: [
      { locationId, fitType: "Regular", sizeLabel: "M", score: input.fit },
      { locationId, fitType: "Slim", sizeLabel: "S", score: Math.max(40, input.fit - 18) },
      { locationId, fitType: "Loose", sizeLabel: "L", score: Math.max(35, input.fit - 12) }
    ],
    product: {
      productId: input.productId,
      name: input.name,
      productDescription: "Sample product for layout preview.",
      images: [{ id: `${input.productId}-img`, imageUrl: [input.photo], isPrimary: true }],
      quantity: 6,
      currency: "CAD",
      currencySymbol: "$",
      amount: input.amount,
      userFitPercentage: input.fit,
      likeCount: 18,
      isLikedByUser: Boolean(input.liked),
      isInWishbag: Boolean(input.wish),
      wishbagItemId: input.wish ? `wish-${input.productId}` : null,
      city: input.city || "Vancouver",
      country: "Canada",
      productLocations: [
        {
          locationId,
          name: `${input.brandName} — Main`,
          address: "2100 Main St",
          city: input.city || "Vancouver",
          stateProvince: "BC",
          zipPostalCode: "V5T 3C6",
          country: "Canada",
          priceAmount: input.amount,
          currency: "CAD",
          currencySymbol: "$"
        }
      ],
      colors: [{ id: "color-ink", name: "Ink", hex: "#1f2937" }],
      sizeVariants: [
        { variantId: `${input.productId}-m`, sizeLabel: "M", colorId: "color-ink", locationId },
        { variantId: `${input.productId}-s`, sizeLabel: "S", colorId: "color-ink", locationId },
        { variantId: `${input.productId}-l`, sizeLabel: "L", colorId: "color-ink", locationId }
      ]
    }
  };
}

const BRAND_ATELIER = {
  id: "brand-atelier",
  name: "Atelier North",
  logoUrl: img("photo-1523381210434-271e8be1f52b", 160, 160)
};

const BRAND_RIVER = {
  id: "brand-river",
  name: "River & Oak",
  logoUrl: img("photo-1441986300917-64674bd600d8", 160, 160)
};

export const MOCK_SHOP_CARDS: ShopCard[] = [
  shopCard({
    productId: "product-coat",
    name: "Wool city coat",
    amount: 248,
    photo: img("photo-1539533018447-63fcce2678e3"),
    brandId: BRAND_ATELIER.id,
    brandName: BRAND_ATELIER.name,
    brandLogo: BRAND_ATELIER.logoUrl,
    fit: 92,
    liked: true
  }),
  shopCard({
    productId: "product-tee",
    name: "Soft box tee",
    amount: 48,
    photo: img("photo-1521572163474-6864f9cf17ab"),
    brandId: BRAND_RIVER.id,
    brandName: BRAND_RIVER.name,
    brandLogo: BRAND_RIVER.logoUrl,
    fit: 81,
    wish: true,
    city: "Toronto"
  }),
  shopCard({
    productId: "product-trouser",
    name: "Pleated trouser",
    amount: 128,
    photo: img("photo-1594938298603-c8148c4dae35"),
    brandId: BRAND_ATELIER.id,
    brandName: BRAND_ATELIER.name,
    brandLogo: BRAND_ATELIER.logoUrl,
    fit: 74
  })
];

export const MOCK_SHOP: ShopResponseData = {
  accountId: MOCK_SESSION.accountId,
  shopData: MOCK_SHOP_CARDS,
  currentUser: MOCK_AVATARS[0],
  hasMore: false,
  page: 1,
  pageSize: 20
};

export const MOCK_BRANDS: DiscoverBrand[] = [
  {
    id: BRAND_ATELIER.id,
    logoUrl: BRAND_ATELIER.logoUrl,
    name: BRAND_ATELIER.name,
    description: "Quiet tailoring for rain-city days.",
    city: "Vancouver",
    country: "Canada",
    currency: "$",
    averageAmount: 186,
    fitProductCount: 12,
    isAccountFavorite: true
  },
  {
    id: BRAND_RIVER.id,
    logoUrl: BRAND_RIVER.logoUrl,
    name: BRAND_RIVER.name,
    description: "Everyday knits and denim with a true Regular fit.",
    city: "Toronto",
    country: "Canada",
    currency: "$",
    averageAmount: 72,
    fitProductCount: 8,
    isAccountFavorite: false
  },
  {
    id: "brand-solace",
    logoUrl: img("photo-1490481651871-ab68de25d43d", 160, 160),
    name: "Solace Studio",
    description: "Dresses and sets cut for movement.",
    city: "Montreal",
    country: "Canada",
    currency: "$",
    averageAmount: 154,
    fitProductCount: 5,
    isAccountFavorite: false
  }
];

export const MOCK_CART: CartData = {
  accountId: MOCK_SESSION.accountId,
  cart: {
    cartId: "cart-mock",
    totalAmount: 296,
    totalTax: 35.52,
    deliveryFee: 12,
    total: 343.52,
    totalItems: 2,
    currency: "CAD",
    currencySymbol: "$",
    subTotal: 296
  },
  cartItems: [
    {
      cartItemId: "cart-item-coat",
      userId: MOCK_SESSION.personId,
      productId: "product-coat",
      variantId: "product-coat-m",
      vendorId: "vendor-atelier",
      productName: "Wool city coat",
      productAmount: 248,
      productQuantity: 1,
      productImage: img("photo-1539533018447-63fcce2678e3", 400, 500),
      productBrandId: BRAND_ATELIER.id,
      productBrandName: BRAND_ATELIER.name,
      productBrandLogo: BRAND_ATELIER.logoUrl,
      productSizeLabel: "M",
      productColorName: "Ink",
      productLocationAddress: "2100 Main St, Vancouver",
      currency: "CAD"
    },
    {
      cartItemId: "cart-item-tee",
      userId: MOCK_SESSION.personId,
      productId: "product-tee",
      variantId: "product-tee-m",
      vendorId: "vendor-river",
      productName: "Soft box tee",
      productAmount: 48,
      productQuantity: 1,
      productImage: img("photo-1521572163474-6864f9cf17ab", 400, 500),
      productBrandId: BRAND_RIVER.id,
      productBrandName: BRAND_RIVER.name,
      productBrandLogo: BRAND_RIVER.logoUrl,
      productSizeLabel: "M",
      productColorName: "Salt",
      productLocationAddress: "88 King St, Toronto",
      currency: "CAD"
    }
  ],
  vendorShipping: [
    {
      vendorId: "vendor-atelier",
      rateId: "ship-atelier-standard",
      provider: "shippo",
      carrier: "Canada Post",
      service: "Expedited",
      shippingAmount: 12,
      currency: "CAD",
      estimatedMinDays: 3,
      estimatedMaxDays: 5
    },
    {
      vendorId: "vendor-river",
      rateId: "ship-river-free",
      provider: "manual",
      carrier: "River & Oak",
      service: "Free pickup",
      shippingAmount: 0,
      currency: "CAD",
      estimatedMinDays: 1,
      estimatedMaxDays: 2
    }
  ]
};

export const MOCK_DELIVERY: Record<string, DeliveryMethodOption[]> = {
  "vendor-atelier": [
    {
      id: "ship-atelier-standard",
      carrier: "Canada Post",
      service: "Expedited",
      price: 12,
      currency: "CAD",
      estimatedMinDays: 3,
      estimatedMaxDays: 5,
      isPrimary: true,
      provider: "shippo"
    },
    {
      id: "ship-atelier-express",
      carrier: "Purolator",
      service: "Express",
      price: 24,
      currency: "CAD",
      estimatedMinDays: 1,
      estimatedMaxDays: 2,
      isPrimary: false,
      provider: "shippo"
    }
  ],
  "vendor-river": [
    {
      id: "ship-river-free",
      carrier: "River & Oak",
      service: "Free pickup",
      price: 0,
      currency: "CAD",
      estimatedMinDays: 1,
      estimatedMaxDays: 2,
      isPrimary: true,
      provider: "manual"
    },
    {
      id: "ship-river-courier",
      carrier: "Canada Post",
      service: "Regular",
      price: 9,
      currency: "CAD",
      estimatedMinDays: 4,
      estimatedMaxDays: 7,
      isPrimary: false,
      provider: "shippo"
    }
  ]
};

export const MOCK_ADDRESSES: AccountAddress[] = [
  {
    addressId: "addr-home",
    streetNumber: "412",
    streetName: "West 12th Avenue",
    apartmentNumber: "3B",
    city: "Vancouver",
    provinceState: "BC",
    postalZipcode: "V5Y 1V4",
    country: "Canada",
    isDefault: true
  },
  {
    addressId: "addr-work",
    streetNumber: "88",
    streetName: "Water Street",
    city: "Vancouver",
    provinceState: "BC",
    postalZipcode: "V6B 1A4",
    country: "Canada",
    isDefault: false
  }
];

export const MOCK_PROFILE: AccountProfile = {
  accountId: MOCK_SESSION.accountId,
  firstName: "Maya",
  lastName: "Chen",
  profileAvatar: MOCK_AVATARS[0].profileImage,
  email: "maya@example.com",
  city: "Vancouver",
  state: "BC",
  country: "Canada",
  users: MOCK_AVATARS.map((person) => ({
    userId: person.userId,
    firstName: person.firstName,
    lastName: person.lastName,
    profileAvatar: person.profileImage,
    relationship: person.isAccountOwner ? "self" : "family"
  })),
  wishbags: {
    wishbagId: "wishbag-1",
    wishbagItems: [
      {
        wishbagItemId: "wish-product-tee",
        productId: "product-tee",
        productName: "Soft box tee",
        productAvatar: img("photo-1521572163474-6864f9cf17ab", 400, 520)
      },
      {
        wishbagItemId: "wish-product-coat",
        productId: "product-coat",
        productName: "Wool city coat",
        productAvatar: img("photo-1539533018447-63fcce2678e3", 400, 520)
      },
      {
        wishbagItemId: "wish-product-trouser",
        productId: "product-trouser",
        productName: "Pleated trouser",
        productAvatar: img("photo-1594938298603-c8148c4dae35", 400, 520)
      }
    ]
  },
  favoriteBrands: [
    {
      favoriteBrandId: "fav-atelier",
      brandId: BRAND_ATELIER.id,
      brandName: BRAND_ATELIER.name,
      brandLogo: img("photo-1523381210434-271e8be1f52b", 240, 240)
    },
    {
      favoriteBrandId: "fav-river",
      brandId: BRAND_RIVER.id,
      brandName: BRAND_RIVER.name,
      brandLogo: img("photo-1441986300917-64674bd600d8", 240, 240)
    }
  ]
};

export const MOCK_MESSAGES: SupportMessage[] = [
  {
    id: "msg-1",
    senderType: "support",
    message: "Hi Maya — how can we help with your order?",
    createdAt: new Date().toISOString()
  },
  {
    id: "msg-2",
    senderType: "user",
    message: "Can I change the shipping on the coat?",
    createdAt: new Date().toISOString()
  },
  {
    id: "msg-3",
    senderType: "support",
    message: "Yes. Open Cart and pick another delivery option for Atelier North.",
    createdAt: new Date().toISOString()
  }
];

export const MOCK_MAILS = [
  { id: "mail-1", title: "Your coat is packed", preview: "Atelier North handed the parcel to Canada Post." },
  { id: "mail-2", title: "New matches for Leo", preview: "3 Regular-fit tees landed this week." }
];

function productFromCard(card: ShopCard): ProductDetail {
  const location = card.product.productLocations?.[0];
  return {
    id: card.product.productId,
    name: card.product.name,
    description: card.product.productDescription,
    images: card.product.images.flatMap((visual) => visual.imageUrl),
    amount: card.product.amount,
    currencySymbol: card.product.currencySymbol,
    userFitPercentage: card.product.userFitPercentage,
    likeCount: card.product.likeCount,
    isLikedByUser: card.product.isLikedByUser,
    careInformation: "Dry clean only. Cool iron.",
    refundPolicy: "Free returns within 14 days.",
    deliveryInformation: "Ships in 3–5 days from the brand’s shop.",
    brand: { id: card.brand.id, name: card.brand.name, logoUrl: card.brand.logoUrl },
    variantLocations: location
      ? [
          {
            id: location.locationId,
            city: location.city,
            stateProvince: location.stateProvince,
            country: location.country,
            address: location.address,
            isPrimary: true,
            price: { amount: card.product.amount, currencySymbol: "$" },
            colors: [
              {
                id: "color-ink",
                name: "Ink",
                hex: "#1f2937",
                images: card.product.images.flatMap((visual) => visual.imageUrl),
                sizes: [
                  { variantId: `${card.product.productId}-s`, sizeLabel: "S", quantity: 2 },
                  { variantId: `${card.product.productId}-m`, sizeLabel: "M", quantity: 4 },
                  { variantId: `${card.product.productId}-l`, sizeLabel: "L", quantity: 3 }
                ]
              }
            ]
          }
        ]
      : []
  };
}

export function mockProduct(id?: string): ProductDetail {
  const card = MOCK_SHOP_CARDS.find((item) => item.product.productId === id) || MOCK_SHOP_CARDS[0];
  return productFromCard(card);
}

export function mockBrand(id?: string) {
  const brand = MOCK_BRANDS.find((item) => item.id === id) || MOCK_BRANDS[0];
  const products = MOCK_SHOP_CARDS.filter((item) => item.brand.id === brand.id).map((item) => ({
    id: item.product.productId,
    name: item.product.name,
    amount: item.product.amount,
    images: item.product.images.flatMap((visual) => visual.imageUrl)
  }));
  return {
    id: brand.id,
    name: brand.name,
    description: brand.description,
    logoUrl: brand.logoUrl,
    city: brand.city,
    country: brand.country,
    products
  };
}

export function mockApiResponse(
  path: string,
  options: {
    method?: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  } = {}
) {
  const method = (options.method || "GET").toUpperCase();
  const query = options.query || {};
  const body = (options.body || {}) as Record<string, unknown>;

  if (path.includes("/catalog/shop-data")) return MOCK_SHOP;
  if (path.includes("/catalog/shop-avatars")) return MOCK_AVATARS;
  if (path.includes("/catalog/discover/brands")) return { brands: MOCK_BRANDS };
  if (path.includes("/catalog/product-details")) return { product: mockProduct(String(query.id || "")) };
  if (path.includes("/catalog/brand-details")) return { brand: mockBrand(String(query.brandId || "")) };
  if (path.includes("/customer/me")) return MOCK_PROFILE;
  if (path.includes("/customer/cart") && method === "GET") return MOCK_CART;
  if (path.includes("/addresses") && method === "GET") return { items: MOCK_ADDRESSES };
  if (path.includes("/addresses") && method === "POST") {
    return { addressId: `addr-${Date.now()}` };
  }
  if (path.includes("/delivery/brand-methods")) {
    const vendorId = String(query.vendorId || "");
    return MOCK_DELIVERY[vendorId] || MOCK_DELIVERY["vendor-atelier"];
  }
  if (path.includes("/support/messages")) return MOCK_MESSAGES;
  if (path.includes("/likes")) return { liked: true, likeCount: 19 };
  if (path.includes("/wishbag")) return { wishbagItemId: "wish-preview" };
  if (path.includes("/cart/items") || path.includes("/select-shipping") || path.includes("/support/send")) {
    return { ok: true, shipping: { id: "ship-preview" } };
  }
  if (path.includes("/customer/checkout")) {
    return {
      clientSecret: "pi_mock_secret_mock",
      ephemeralKey: "ek_mock",
      customerId: "cus_mock",
      orderId: "ord-mock",
      publishableKey: "pk_test_mock"
    };
  }
  if (path.includes("/confirm-payment")) {
    return { orderId: String(body.orderId || "ord-mock"), status: "paid" };
  }

  return { ok: true };
}
