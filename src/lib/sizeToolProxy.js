import { NextResponse } from "next/server";
import {
  POST as submitSize,
  GET as readSize,
} from "../../app/api/webclient/size/route";
import { mapGenerateResult } from "./sizeApiServer";
import { cookies } from "next/headers";

// Reuse the shopping app's session-aware adapter to the existing mobile APIs.
export async function submitSizeTool(request, generate = false) {
  try {
    const form = await request.formData();
    const pose = form.get("pose");
    if (!generate && pose !== "front" && pose !== "side") {
      return NextResponse.json(
        { message: "Choose a front or side photo." },
        { status: 400 },
      );
    }
    form.set(
      "action",
      generate
        ? "generate"
        : pose === "front"
          ? "validateFront"
          : "validateSide",
    );
    if (!generate) form.set("type", pose);
    const headers = new Headers(request.headers);
    headers.delete("content-type");
    headers.delete("content-length");
    const response = await submitSize(
      new Request(request.url, { method: "POST", headers, body: form }),
    );
    if (generate && response.ok) {
      const body = await response.clone().json();
      if (body.taskId) (await cookies()).set("cm_photo_preview_task", body.taskId, {
        httpOnly: true, sameSite: "lax", path: "/api/size-tool", maxAge: 3600,
      });
    }
    return response;
  } catch {
    return NextResponse.json(
      { message: "Could not read sizing photos. Please try again." },
      { status: 400 },
    );
  }
}

export async function readSizeTool(request, generate = false) {
  const url = new URL(request.url);
  url.searchParams.set(
    "action",
    generate ? "generateResult" : "validateResult",
  );
  url.searchParams.set("id", url.searchParams.get("taskId") || "");
  url.searchParams.set("type", url.searchParams.get("pose") || "front");
  const response = await readSize(
    new Request(url, { headers: request.headers }),
  );
  if (!generate || !response.ok) return response;
  const body = await response.json();
  if (body.state === "complete") {
    body.result = mapGenerateResult(body.result);
  }
  return NextResponse.json(body, {
    status: response.status,
    headers: { "Cache-Control": "no-store" },
  });
}
