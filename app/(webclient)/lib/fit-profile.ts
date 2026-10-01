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
  const status = await customerFetch<{
    ready: boolean;
    state: string;
    operationId?: string;
    matchCount?: number;
  }>(
    `/v1/customer/persons/${encodeURIComponent(session.personId)}/fit-profile`,
    {
      accessToken: session.accessToken,
      personId: session.personId,
    },
  );
  if (typeof status.ready !== "boolean")
    throw new Error("Fit profile service returned an invalid response.");
  return { ...status, source: "customer" as const };
}
