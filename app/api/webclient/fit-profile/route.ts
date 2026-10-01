import { NextResponse } from "next/server";
import {
  requireSession,
  actionError,
} from "../../../(webclient)/lib/require-session";
import { fetchFitProfile } from "../../../(webclient)/lib/fit-profile";
export async function GET() {
  const { session, error } = await requireSession();
  if (!session) return error;
  try {
    return NextResponse.json(
      {
        ...(await fetchFitProfile(session)),
        accountId: session.accountId,
        personId: session.personId,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return actionError(err);
  }
}
