import { NextResponse } from "next/server";
import { getContinuation } from "../../../../(webclient)/lib/continuation-store";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const value = await getContinuation((await params).token);
    return NextResponse.json(
      value || {
        message:
          "This mobile link has expired. Open the product again to continue.",
      },
      {
        status: value ? 200 : 410,
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { message: "Could not load your selection. Please retry." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
