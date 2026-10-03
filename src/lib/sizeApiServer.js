/** Map the normalized mobile generation result into a compact Size Tool result. */
export function mapGenerateResult(payload) {
  const data = payload || {};
  const sizeRecs = data.size_recommendations || {};
  const region =
    sizeRecs.US_CAD ||
    sizeRecs.US ||
    sizeRecs.CAD ||
    Object.values(sizeRecs).find((v) => v && typeof v === "object") ||
    {};

  const topsByFit = region.tops || {};
  const fitOrder = ["regular", "fitted", "relaxed", "oversized"];
  let sizeLabel = null;
  for (const fit of fitOrder) {
    const entry = topsByFit[fit];
    if (entry?.display_size || entry?.size || entry?.label) {
      sizeLabel = entry.display_size || entry.size || entry.label;
      break;
    }
  }
  if (!sizeLabel) {
    const first = Object.values(topsByFit).find(
      (v) => v && typeof v === "object",
    );
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
    summary: "Estimated clothing size from your measurements",
    brands: brandChips,
  };
}
