/**
 * Server-side size-api helpers for the Size Tool proxy routes.
 * Guest placeholders for fields the UI does not collect (Phase 0).
 */

export function sizeApiConfig() {
  const baseUrl = (process.env.SIZE_API_URL || process.env.NEXT_PUBLIC_SIZE_API_URL || "")
    .replace(/\/+$/, "");
  return {
    baseUrl,
    token: process.env.SIZE_API_TOKEN || "token-canada-2026-auth",
    accountId: process.env.SIZE_API_ACCOUNT_ID || "web-size-tool",
    userId: process.env.SIZE_API_USER_ID || "web-size-tool-guest",
    gender: process.env.SIZE_API_GENDER || "female",
    city: process.env.SIZE_API_CITY || "Coquitlam",
    country: process.env.SIZE_API_COUNTRY || "Canada",
    provinceState: process.env.SIZE_API_PROVINCE || "British Columbia",
    weight: process.env.SIZE_API_WEIGHT || "70",
    dob: process.env.SIZE_API_DOB || "2000-01-01",
    genderDemography: process.env.SIZE_API_GENDER_DEMOGRAPHY || "25-45"
  };
}

export function sizeApiQuery(cfg) {
  const q = new URLSearchParams({
    accountId: cfg.accountId,
    userId: cfg.userId
  });
  return q.toString();
}

export function sizeApiHeaders(cfg) {
  return {
    "X-token": cfg.token,
    Accept: "application/json"
  };
}

/** Map rich v2 generate payload into a compact Size Tool result. */
export function mapGenerateResult(payload) {
  const data = payload?.data || payload || {};
  const sizeRecs = data.size_recommendations || {};
  const region =
    sizeRecs.US_CAD ||
    sizeRecs.US ||
    sizeRecs.CAD ||
    Object.values(sizeRecs).find((v) => v && typeof v === "object") ||
    {};

  const topsByFit = region.tops || {};
  const fitOrder = ["fitted", "regular", "relaxed", "oversized"];
  let sizeLabel = null;
  for (const fit of fitOrder) {
    const entry = topsByFit[fit];
    if (entry?.display_size || entry?.size || entry?.label) {
      sizeLabel = entry.display_size || entry.size || entry.label;
      break;
    }
  }
  if (!sizeLabel) {
    const first = Object.values(topsByFit).find((v) => v && typeof v === "object");
    sizeLabel = first?.display_size || first?.size || first?.label || null;
  }
  if (!sizeLabel) sizeLabel = "—";

  const quality = data.quality || {};
  const confidence =
    typeof quality.overall_score === "number"
      ? Math.round(quality.overall_score)
      : null;

  const brandsRaw = data.brand_size_recommendations || {};
  const brandChips = [];
  const collect = (bucket) => {
    if (!bucket || typeof bucket !== "object") return;
    for (const [brand, rec] of Object.entries(bucket)) {
      if (!rec || typeof rec !== "object") continue;
      const label =
        rec.display_size ||
        rec.size ||
        rec.label ||
        rec.recommended_size ||
        null;
      if (!label) continue;
      if (brandChips.some((b) => b.brand === brand)) continue;
      brandChips.push({ brand, size: String(label) });
      if (brandChips.length >= 4) return;
    }
  };

  // Common shapes: { tops: { Brand: {...} }, bottoms: {...} } or flat { Brand: {...} }
  if (brandsRaw.tops || brandsRaw.bottoms) {
    collect(brandsRaw.tops);
    collect(brandsRaw.bottoms);
  } else {
    collect(brandsRaw);
  }

  return {
    size: String(sizeLabel),
    confidence,
    summary: "Recommended across most brands",
    brands: brandChips
  };
}
