import { NextResponse } from "next/server";
import { fetchGeneratedSizeProfile } from "../../../(webclient)/lib/fit-profile";
import { getSession } from "../../../(webclient)/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Your sizing session expired." }, { status: 401 });
  try {
    const profile = await fetchGeneratedSizeProfile(session);
    return NextResponse.json({ ready: profile.ready }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Could not check your saved size." }, { status: 503 });
  }
}
