import { NextResponse } from "next/server";
import { ensureWebGuest } from "./guest";
import { getSession } from "./session";
import type { WebClientSession } from "./session";

export async function requireSession(options?: {
  mintGuest?: boolean;
}): Promise<
  | { session: WebClientSession; error?: undefined }
  | { session?: undefined; error: NextResponse }
> {
  if (options?.mintGuest) {
    try {
      return { session: await ensureWebGuest() };
    } catch (error) {
      return {
        error: NextResponse.json(
          {
            message:
              error instanceof Error
                ? error.message
                : "Could not start a shopping session.",
          },
          { status: 400 },
        ),
      };
    }
  }

  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json(
        {
          code: "SESSION_EXPIRED",
          message:
            "Your session expired. Sign in to continue with your saved profile.",
        },
        { status: 401 },
      ),
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
