import { NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set([
  "www", "blog", "api", "admin", "app", "cdn", "mail", "ftp",
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

  // Never rewrite Next.js internals, static files, or Payload routes
  const { pathname } = url;
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/cms-media/") ||
    pathname.startsWith("/public/")
  ) {
    return NextResponse.next();
  }

  let citySlug = null;

  // Production: vancouver.clothme.app
  if (hostname !== rootDomain && hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.slice(0, -(rootDomain.length + 1));
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
