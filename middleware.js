import { NextResponse } from "next/server";

const WEBCLIENT_PATHS = [
  "/shop",
  "/discover",
  "/cart",
  "/inbox",
  "/account",
  "/settings",
  "/product",
  "/brand",
  "/login",
  "/checkout"
];

function isWebClientPath(pathname) {
  return WEBCLIENT_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

const RESERVED_SUBDOMAINS = new Set([
  "www", "blog", "api", "admin", "app", "cdn", "mail", "ftp",
  "dev", "staging", "preview", "demo", "test",
  // Env / product hosts (not city microsites)
  "dv-app", "dv-vendor", "pr-app", "pr-vendor"
]);

export function middleware(request) {
  const url = request.nextUrl.clone();
  const hostname = (request.headers.get("host") || "").toLowerCase();

  // Root domain derived from env, strip protocol and port
  const rootDomain = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VITE_SITE_URL ||
    "clothme.app"
  )
    .replace(/^https?:\/\//, "")
    .split(":")[0]
    .split("/")[0];

  // Never rewrite Next.js internals, static files, Payload routes, or ACME challenges
  const { pathname } = url;
  if (pathname === "/admin/cms/collections/cms-posts" && url.searchParams.has("columns")) {
    url.searchParams.delete("columns");
    return NextResponse.redirect(url);
  }

  if (isWebClientPath(pathname)) {
    const response = NextResponse.next();
    if (!request.cookies.get("cm_geo")) {
      const geo = {
        country: request.headers.get("x-vercel-ip-country") || "",
        region: request.headers.get("x-vercel-ip-country-region") || "",
        city: decodeURIComponent(request.headers.get("x-vercel-ip-city") || "")
      };
      if (geo.country || geo.city) {
        response.cookies.set("cm_geo", JSON.stringify(geo), {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax"
        });
      }
    }

    const mockOn =
      process.env.NEXT_PUBLIC_WEBCLIENT_MOCK === "1" ||
      (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_WEBCLIENT_MOCK !== "0");
    const skipGuest =
      pathname === "/login" ||
      pathname.startsWith("/login/") ||
      pathname.startsWith("/api/");
    if (!mockOn && !skipGuest && !request.cookies.get("cm_access")) {
      const guestUrl = url.clone();
      guestUrl.pathname = "/api/webclient/guest";
      guestUrl.search = `next=${encodeURIComponent(`${pathname}${request.nextUrl.search}`)}`;
      return NextResponse.redirect(guestUrl);
    }
    return response;
  }

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/cms-media/") ||
    pathname.startsWith("/public/")
  ) {
    return NextResponse.next();
  }

  // If SITE_URL is itself a subdomain host (e.g. dv-app.clothme.io), never treat it as a city.
  if (hostname === rootDomain || hostname.split(":")[0] === rootDomain) {
    return NextResponse.next();
  }

  let citySlug = null;

  // Production: vancouver.clothme.app / vancouver.clothme.io
  // Prefer apex domain for city microsites, not the full SITE_URL host.
  const apexDomain = rootDomain.split(".").slice(-2).join(".");
  if (hostname !== apexDomain && hostname.endsWith(`.${apexDomain}`)) {
    const sub = hostname.slice(0, -(apexDomain.length + 1));
    if (sub && !RESERVED_SUBDOMAINS.has(sub) && !sub.includes(".")) {
      citySlug = sub;
    }
  }

  // Local dev: vancouver.localhost or vancouver.localhost:3000
  if (!citySlug && hostname.includes(".localhost")) {
    const sub = hostname.split(".localhost")[0];
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      citySlug = sub;
    }
  }

  // Dev escape hatch: ?__city=vancouver (no /etc/hosts needed)
  if (!citySlug && process.env.NODE_ENV === "development") {
    const devParam = url.searchParams.get("__city");
    if (devParam) citySlug = devParam;
  }

  if (!citySlug) return NextResponse.next();

  // Rewrite: /about → /city/vancouver/about  |  / → /city/vancouver
  const rest = pathname === "/" ? "" : pathname;
  url.pathname = `/city/${citySlug}${rest}`;

  const response = NextResponse.rewrite(url);
  // Pass slug to getServerSideProps via header
  response.headers.set("x-city-slug", citySlug);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
