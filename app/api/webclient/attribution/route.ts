import { NextResponse } from "next/server";
import { claimWebReferrals } from "../../../(webclient)/lib/attribution";
import {
  requireSession,
  actionError,
} from "../../../(webclient)/lib/require-session";
export async function POST() {
  const { session, error } = await requireSession();
  if (!session) return error;
  try {
    return NextResponse.json({ claims: await claimWebReferrals(session) });
  } catch (error) {
    return actionError(error);
  }
}
