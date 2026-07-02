import { NextResponse } from "next/server";
import { backendApiUrl, getBackendBaseUrl } from "../_utils.mjs";

export async function POST(request) {
  if (!getBackendBaseUrl()) {
    return NextResponse.json(
      { error: { message: "Creator applications are temporarily unavailable. Please try again later." } },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const res = await fetch(backendApiUrl("/creator-applications"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("[creator-applications] non-JSON upstream response:", res.status, text.slice(0, 200));
      return NextResponse.json(
        { error: { message: "Submission failed. Please try again." } },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[creator-applications] POST error:", error);
    return NextResponse.json(
      { error: { message: "Submission failed. Please try again." } },
      { status: 502 }
    );
  }
}
