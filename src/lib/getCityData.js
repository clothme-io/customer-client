// Server-side only — never import this in client components.
// Fetches city (location) documents from the Payload REST API.

function internalUrl(path) {
  const base =
    process.env.PAYLOAD_INTERNAL_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  return `${base}${path}`;
}

function encodeWhere(obj, prefix = "where") {
  return Object.entries(obj)
    .map(([k, v]) =>
      typeof v === "object" && v !== null
        ? encodeWhere(v, `${prefix}[${k}]`)
        : `${encodeURIComponent(`${prefix}[${k}]`)}=${encodeURIComponent(v)}`
    )
    .join("&");
}

/**
 * Returns the published location document for a slug, or null.
 * depth=2 populates boutique images and OG image relationships.
 */
export async function getCityBySlug(slug) {
  try {
    const where = encodeWhere({
      and: {
        0: { slug: { equals: slug } },
        1: { status: { equals: "published" } },
      },
    });
    const res = await fetch(
      internalUrl(`/api/payload/locations?${where}&depth=2&limit=1`),
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.docs?.[0] ?? null;
  } catch (err) {
    console.error(`getCityBySlug(${slug}):`, err.message);
    return null;
  }
}

/**
 * Returns published cms-posts for a city (by locationId) plus global posts
 * (no location set). Used for the blog preview and blog index pages.
 */
export async function getCityPosts(locationId, { limit = 10 } = {}) {
  try {
    // Fetch city-tagged posts
    const cityWhere = encodeWhere({
      and: {
        0: { _status: { equals: "published" } },
        1: { location: { equals: locationId } },
      },
    });
    // Fetch global posts (no location relationship)
    const globalWhere = encodeWhere({
      and: {
        0: { _status: { equals: "published" } },
        1: { location: { exists: false } },
      },
    });

    const [cityRes, globalRes] = await Promise.all([
      fetch(
        internalUrl(
          `/api/payload/cms-posts?${cityWhere}&depth=1&sort=-publishedAt&limit=${limit}`
        ),
        { cache: "no-store" }
      ),
      fetch(
        internalUrl(
          `/api/payload/cms-posts?${globalWhere}&depth=1&sort=-publishedAt&limit=${limit}`
        ),
        { cache: "no-store" }
      ),
    ]);

    const [cityData, globalData] = await Promise.all([
      cityRes.ok ? cityRes.json() : { docs: [] },
      globalRes.ok ? globalRes.json() : { docs: [] },
    ]);

    // City-tagged posts first, then global, deduplicated, up to limit
    const seen = new Set();
    const merged = [];
    for (const post of [
      ...(cityData.docs ?? []),
      ...(globalData.docs ?? []),
    ]) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        merged.push(post);
        if (merged.length >= limit) break;
      }
    }
    return merged;
  } catch (err) {
    console.error(`getCityPosts(${locationId}):`, err.message);
    return [];
  }
}

/** Returns all published city documents (shallow, depth=0). Used for sitemaps. */
export async function getAllPublishedCities() {
  try {
    const res = await fetch(
      internalUrl(
        "/api/payload/locations?where[status][equals]=published&depth=0&limit=200&sort=name"
      ),
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.docs ?? [];
  } catch (err) {
    console.error("getAllPublishedCities:", err.message);
    return [];
  }
}

/** Serialize a city document so it's safe to pass as Next.js page props. */
export function serializeCity(city) {
  if (!city) return null;
  return JSON.parse(JSON.stringify(city));
}

/** Serialize an array of posts for page props. */
export function serializePosts(posts) {
  return JSON.parse(JSON.stringify(posts ?? []));
}
