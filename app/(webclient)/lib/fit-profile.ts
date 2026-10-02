import { hasSavedSizes } from "./size-contract";
import { customerFetch } from "./api";
import type { WebClientSession } from "./session";
import { WEBCLIENT_MOCK } from "./config";
import { cookies } from "next/headers";

export async function fetchFitProfile(session: WebClientSession) {
  if (WEBCLIENT_MOCK) {
    const ready =
      (await cookies()).get("cm_mock_fit")?.value === session.personId;
    return { ready, source: "mock" as const };
  }
  // The mobile account screen reads the same existing endpoint.
  const sizes = await customerFetch<unknown>("/v1/size/full", {
    accessToken: session.accessToken,
    personId: session.personId,
  });
  return { ready: hasSavedSizes(sizes), source: "customer" as const };
}
