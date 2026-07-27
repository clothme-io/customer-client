import { usStatesAndProvinces } from "../data/landing";
import { apiFetch } from "./api";
import { track } from "./track";

export const WAITLIST_STATE_CODES = new Set(usStatesAndProvinces);

export function normalizeWaitlistState(value) {
  const state = String(value || "").trim().toUpperCase();
  if (!state) return "";
  return WAITLIST_STATE_CODES.has(state) ? state : "";
}

/**
 * Submit a waitlist signup. Returns API payload on success; throws on failure.
 * Skips the network call (and returns ok) when the honeypot field is filled.
 */
export async function submitWaitlist({ email, state, source, honeypot }) {
  if (String(honeypot || "").trim()) {
    return { ok: true, created: false, spam: true };
  }

  const normalizedState = normalizeWaitlistState(state);
  const payload = await apiFetch("/api/waitlist", {
    method: "POST",
    body: JSON.stringify({
      email: String(email || "").trim(),
      state: normalizedState || undefined,
      source: String(source || "").slice(0, 120)
    })
  });

  track("waitlist_submit", {
    source: String(source || ""),
    state: normalizedState || undefined,
    created: Boolean(payload.created)
  });

  return payload;
}
