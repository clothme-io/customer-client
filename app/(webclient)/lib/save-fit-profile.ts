import { customerFetch } from "./api";
import { operationId, type SizeTicket } from "./size-ticket";
import type { WebClientSession } from "./session";
export async function saveFitProfile(
  session: WebClientSession,
  ticket: SizeTicket,
  result: Record<string, any>,
  source: "scan" | "manual" = "scan",
) {
  return customerFetch<{
    ready: boolean;
    state: string;
    matchCount: number;
    operationId: string;
  }>(
    `/v1/customer/persons/${encodeURIComponent(session.personId)}/fit-profile`,
    {
      method: "POST",
      accessToken: session.accessToken,
      personId: session.personId,
      body: {
        operationId: operationId(ticket),
        startedAt: ticket.issuedAt,
        source,
        profile: ticket.profile,
        result,
      },
    },
  );
}
