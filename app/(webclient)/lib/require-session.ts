import { NextResponse } from "next/server";
import { getSession } from "./session";
import type { WebClientSession } from "./session";

export async function requireSession(): Promise<
  { session: WebClientSession; error?: undefined } | { session?: undefined; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ message: "Not signed in" }, { status: 401 })
    };
  }
  return { session };
}

export function actionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  const status =
    typeof (error as { status?: number }).status === "number"
      ? (error as { status: number }).status
      : 400;
  return NextResponse.json({ message }, { status });
}
