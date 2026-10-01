import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  requireSession,
  actionError,
} from "../../../../(webclient)/lib/require-session";
import {
  verifySizeTicket,
  operationId,
} from "../../../../(webclient)/lib/size-ticket";
import {
  sizeApiFetch,
  sizeMockEnabled,
} from "../../../../(webclient)/lib/size-api";
import { normalizeSizeReply } from "../../../../(webclient)/lib/size-contract";
import { saveFitProfile } from "../../../../(webclient)/lib/save-fit-profile";
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (!session) return error;
  try {
    const body = await request.json();
    const ticket = verifySizeTicket(
      body.receipt || "",
      session,
      body.taskId,
      "generate",
    );
    if (sizeMockEnabled()) {
      (await cookies()).set("cm_mock_fit", session.personId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return NextResponse.json({
        ready: true,
        state: "complete",
        operationId: operationId(ticket),
        matchCount: 3,
      });
    }
    // Never accept measurement results from the browser. Fetch them using the signed job receipt.
    const response = await sizeApiFetch(
      `/generate/v1/size/${encodeURIComponent(ticket.taskId)}`,
      session,
    );
    const result = normalizeSizeReply(
      await response.json(),
      response.status,
      "generateResult",
    );
    if (result.state !== "complete" || !result.result)
      return NextResponse.json(result, { status: result.status });
    return NextResponse.json(
      await saveFitProfile(session, ticket, result.result),
    );
  } catch (err) {
    return actionError(err);
  }
}
