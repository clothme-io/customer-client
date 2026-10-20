export type Continuation = {
  productId: string;
  colorId?: string;
  locationId?: string;
  quantity: number;
  referrals: { type: string; code: string; receivedAt: number }[];
};
export function continuationInput(input: any): Omit<Continuation, "referrals"> {
  const id = (value: unknown) =>
    typeof value === "string" && /^[a-zA-Z0-9_-]{1,200}$/.test(value);
  if (!id(input?.productId))
    throw new Error("Choose a product before continuing on mobile.");
  return {
    productId: input.productId,
    ...(id(input.colorId) ? { colorId: input.colorId } : {}),
    ...(id(input.locationId) ? { locationId: input.locationId } : {}),
    quantity: Number.isInteger(input.quantity)
      ? Math.max(1, Math.min(20, input.quantity))
      : 1,
  };
}
export function mobileLink(
  destination: string,
  fallback: string,
  channel: string,
) {
  if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(channel))
    throw new Error(
      "Continuing in the app is temporarily unavailable. You can generate your size here.",
    );
  const url = new URL(`https://abr.ge/@clothme/${channel}`);
  url.searchParams.set("deeplink_url", destination);
  url.searchParams.set("fallback_ios", "itunes-appstore");
  url.searchParams.set("fallback_android", "google-play");
  url.searchParams.set("fallback_desktop", fallback);
  return url.href;
}
