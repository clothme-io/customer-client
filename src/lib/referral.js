export const REFERRAL_COOKIE = "cm_referrals";
export const REFERRAL_TTL = 24 * 60 * 60 * 1000;
export function readReferrals(value, now = Date.now()) {
  try {
    const entries = JSON.parse(value || "[]");
    return Array.isArray(entries)
      ? entries
          .filter(
            (x) =>
              ["product", "creator-link", "creator-campaign"].includes(
                x?.type,
              ) &&
              /^[A-Za-z0-9_-]{43}$/.test(x?.code) &&
              Number.isFinite(x?.receivedAt) &&
              x.receivedAt <= now &&
              now - x.receivedAt < REFERRAL_TTL,
          )
          .slice(-12)
      : [];
  } catch {
    return [];
  }
}
export function captureReferral(url, previous, now = Date.now()) {
  const entries = readReferrals(previous, now);
  const match =
    /^\/(creator-link|creator-campaign)\/([A-Za-z0-9_-]{43})\/?$/.exec(
      url.pathname,
    );
  const code =
    match?.[2] ||
    (/^\/product\/[^/]+\/?$/.test(url.pathname)
      ? url.searchParams.get("c")
      : null);
  if (!code || !/^[A-Za-z0-9_-]{43}$/.test(code)) return null;
  const type = match?.[1] || "product";
  // Do not renew expiry or reorder on refresh/prefetch.
  if (entries.some((x) => x.code === code && x.type === type)) return null;
  return JSON.stringify(
    [...entries, { type, code, receivedAt: now }].slice(-12),
  );
}
