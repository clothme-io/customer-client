const stripTrailingSlash = (url?: string) => url?.replace(/\/$/, "") || "";

export const CUSTOMER_API_URL =
  stripTrailingSlash(process.env.CUSTOMER_API_URL) ||
  stripTrailingSlash(process.env.NEXT_PUBLIC_CUSTOMER_API_URL) ||
  "https://dv-customer.api-clothme.com";

export const PERSON_ID_HEADER = "X-Person-Id";

export const COOKIE_ACCESS = "cm_access";
export const COOKIE_REFRESH = "cm_refresh";
export const COOKIE_PERSON = "cm_person";
export const COOKIE_ACCOUNT = "cm_account";
export const COOKIE_GEO = "cm_geo";

export const SITE_NAME = "ClothME";

/** Preview sample data instead of the customer API. On in `next dev`; set NEXT_PUBLIC_WEBCLIENT_MOCK=0 to hit live APIs. */
export const WEBCLIENT_MOCK =
  process.env.NEXT_PUBLIC_WEBCLIENT_MOCK === "1" ||
  (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_WEBCLIENT_MOCK !== "0");
