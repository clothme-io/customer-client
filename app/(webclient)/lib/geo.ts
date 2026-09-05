import { cookies, headers } from "next/headers";
import { COOKIE_GEO } from "./config";

export type GeoHint = {
  country: string;
  region: string;
  city: string;
};

export async function getGeoHint(): Promise<GeoHint> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const saved = cookieStore.get(COOKIE_GEO)?.value;

  if (saved) {
    try {
      const parsed = JSON.parse(saved) as GeoHint;
      if (parsed.country || parsed.city) return parsed;
    } catch {
      // fall through to request headers
    }
  }

  return {
    country:
      headerStore.get("x-vercel-ip-country") ||
      headerStore.get("cf-ipcountry") ||
      "",
    region: headerStore.get("x-vercel-ip-country-region") || "",
    city: headerStore.get("x-vercel-ip-city") || ""
  };
}

export function pickClosestLocation<
  T extends {
    locationId?: string;
    id?: string;
    city?: string;
    stateProvince?: string;
    country?: string;
  }
>(locations: T[], geo: GeoHint): T | undefined {
  if (!locations.length) return undefined;

  const city = geo.city.toLowerCase();
  const region = geo.region.toLowerCase();
  const country = geo.country.toLowerCase();

  return (
    locations.find((item) => city && item.city?.toLowerCase() === city) ||
    locations.find((item) => region && item.stateProvince?.toLowerCase() === region) ||
    locations.find((item) => country && item.country?.toLowerCase() === country) ||
    locations[0]
  );
}
