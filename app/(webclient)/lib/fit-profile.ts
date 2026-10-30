import { customerFetch } from "./api";
import type { WebClientSession } from "./session";
import { WEBCLIENT_MOCK } from "./config";
import { cookies } from "next/headers";

export async function fetchGeneratedSizeProfile(session: WebClientSession) {
  if (WEBCLIENT_MOCK) {
    const ready =
      (await cookies()).get("cm_mock_fit")?.value === session.personId;
    return { ready, source: "mock" as const };
  }
  const profile = await customerFetch<{ sizing?: { top?: Record<string, unknown>; bottom?: Record<string, unknown> } } | null>(`/v1/customer/persons/${session.personId}/sizing-profile`, {
    accessToken: session.accessToken,
    personId: session.personId,
  });
  return {
    ready: Boolean(profile?.sizing?.top && Object.keys(profile.sizing.top).length && profile.sizing.bottom && Object.keys(profile.sizing.bottom).length),
    source: "customer" as const,
  };
}
import { hasSavedSizes } from "./size-contract";

export async function fetchFitProfile(session: WebClientSession) {
  if (WEBCLIENT_MOCK) return fetchGeneratedSizeProfile(session);
  const sizes = await customerFetch<unknown>("/v1/size/full", {
    accessToken: session.accessToken,
    personId: session.personId,
  });
  if (hasSavedSizes(sizes)) return { ready: true, source: "customer" as const };
  try {
    return await fetchGeneratedSizeProfile(session);
  } catch {
    return { ready: false, source: "customer" as const };
  }
}
