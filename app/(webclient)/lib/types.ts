export type ShopUser = {
  userId: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  isAccountOwner: boolean;
  updatedAt?: string;
};

export type ShopFitVariant = {
  locationId: string;
  fitType: string | null;
  sizeLabel: string;
  score: number;
};

export type ShopProductLocation = {
  locationId: string;
  name: string;
  address: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
  priceAmount?: number;
  currency?: string;
  currencySymbol?: string;
  tax?: number;
  discountAmount?: number;
};

export type ShopProductVisual = {
  id: string;
  imageUrl: string[];
  isPrimary: boolean;
  productColorId?: string;
};

export type ShopProduct = {
  productId: string;
  name: string;
  productDescription: string;
  images: ShopProductVisual[];
  quantity: number;
  currency: string;
  currencySymbol: string;
  amount: number;
  userFitPercentage: number;
  likeCount: number;
  isLikedByUser: boolean;
  isInWishbag?: boolean;
  wishbagItemId?: string | null;
  city?: string;
  country?: string;
  productLocations?: ShopProductLocation[];
  recommendationScore?: number;
  recommendationReason?: string;
  colors?: { id: string; name: string; hexValue?: string; hex?: string }[];
  sizeVariants?: {
    variantId: string;
    sizeLabel: string;
    colorId: string;
    locationId: string;
  }[];
};

export type ShopBrand = {
  id: string;
  logoUrl: string;
  name: string;
  city?: string;
  stateProvince?: string;
  country?: string;
};

export type ShopCard = {
  product: ShopProduct;
  brand: ShopBrand;
  fitVariants: ShopFitVariant[];
  defaultLocationId: string;
};

export type ShopResponseData = {
  accountId: string;
  shopData: ShopCard[];
  currentUser: ShopUser;
  hasMore?: boolean;
  page?: number;
  pageSize?: number;
};

export type DiscoverBrand = {
  id: string;
  logoUrl: string;
  name: string;
  description: string;
  city: string;
  country: string;
  currency: string;
  averageAmount: number;
  fitProductCount: number;
  isAccountFavorite: boolean;
  isProfilesFavorite?: { id: string; firstName: string; lastName: string }[];
};

export type ProductDetail = {
  id: string;
  name: string;
  description: string;
  images: string[];
  amount?: number;
  currencySymbol?: string;
  userFitPercentage?: number;
  likeCount?: number;
  isLikedByUser?: boolean;
  careInformation?: string;
  refundPolicy?: string;
  deliveryInformation?: string;
  brand?: { id?: string; name?: string; logoUrl?: string };
  locations?: { city?: string; stateProvince?: string; country?: string; address?: string }[];
  color?: { id: string; name: string; hex: string }[];
  sizes?: { id: string; size: string; quantity: number }[];
  variantLocations?: {
    id: string;
    city: string;
    stateProvince?: string;
    country: string;
    address?: string;
    isPrimary?: boolean;
    price?: { amount: number; currencySymbol: string };
    colors?: {
      id: string;
      name: string;
      hex?: string;
      images?: string[];
      sizes?: { variantId: string; sizeLabel: string; quantity: number }[];
    }[];
  }[];
};

export type CartItem = {
  cartItemId: string;
  userId: string;
  productId: string;
  variantId?: string | null;
  vendorId?: string | null;
  productName: string;
  productAmount: number;
  productQuantity: number;
  productImage: string;
  productBrandId?: string;
  brandId?: string;
  productBrandName: string;
  brandName?: string;
  productBrandLogo: string;
  productSizeLabel?: string;
  productColorName?: string | null;
  productLocationAddress?: string | null;
  currency: string;
};

export type VendorShippingSelection = {
  vendorId: string;
  rateId: string | null;
  provider: string;
  carrier: string | null;
  service: string | null;
  shippingAmount: number;
  currency: string;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
};

export type CartData = {
  accountId: string;
  cart: {
    cartId: string;
    totalAmount: number;
    totalTax: number;
    deliveryFee: number;
    total: number;
    totalItems: number;
    currency: string;
    currencySymbol: string;
    subTotal: number;
  };
  cartItems: CartItem[];
  vendorShipping?: VendorShippingSelection[];
};

export type DeliveryMethodOption = {
  id: string;
  carrier: string;
  service: string;
  price: number;
  currency: string;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
  isPrimary: boolean;
  provider: "manual" | "shippo" | "shipbob" | "uber_direct";
};

export type AccountPerson = {
  userId: string;
  firstName: string;
  lastName: string;
  profileAvatar: string;
  relationship: string;
  gender?: string;
  city?: string;
};

export type FavouriteBrandListItem = {
  id: string;
  brandId: string;
  brandName: string;
  brandDescription: string;
  brandLogoUrl: string;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  userMatchCount: number;
};

export type OrderListItem = {
  orderId: string;
  orderedDate: string;
  orderedProductName: string;
  orderedProductAvatar: string;
  orderState: boolean;
  orderStateText: string;
};

export type WishbagListItem = {
  wishbagItemId: string;
  productId: string;
  productImage: string;
  productName: string;
  productDescription: string;
  productAmount: number;
  productCity: string;
  productState: string;
  productCountry: string;
  currency: string;
  count: number;
};

export type AccountAddress = {
  addressId: string;
  apartmentNumber?: string;
  streetNumber: string;
  streetName: string;
  city: string;
  provinceState: string;
  postalZipcode: string;
  country: string;
  isDefault: boolean;
};

export type CheckoutSession = {
  clientSecret: string;
  ephemeralKey?: string;
  customerId?: string;
  orderId: string;
  publishableKey: string;
};

export type AccountProfile = {
  accountId: string;
  accountUserId?: string;
  firstName: string;
  lastName: string;
  profileAvatar: string;
  email: string;
  city: string;
  state: string;
  country: string;
  users: AccountPerson[];
  wishbags: {
    wishbagId: string;
    wishbagItems: {
      wishbagItemId: string;
      productId: string;
      productName: string;
      productAvatar: string;
    }[];
  };
  favoriteBrands: {
    favoriteBrandId: string;
    brandId?: string;
    brandName: string;
    brandLogo: string;
  }[];
};

export type SupportMessage = {
  id: string;
  senderType: "user" | "support";
  message: string;
  createdAt: string;
};
