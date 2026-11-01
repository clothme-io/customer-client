import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { customerFetch, CustomerApiError } from "../../../(webclient)/lib/api";
import { WEBCLIENT_MOCK } from "../../../(webclient)/lib/config";
import { sizeApiFetch } from "../../../(webclient)/lib/size-api";
import { normalizeSizeReply } from "../../../(webclient)/lib/size-contract";
import { getSession } from "../../../(webclient)/lib/session";

export const runtime = "nodejs";

function validMeasurements(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.length < 100 &&
    entries.some(([, measurement]) => measurement && typeof measurement === "object" && Number.isFinite(Number((measurement as { cm?: unknown }).cm)) && Number((measurement as { cm?: unknown }).cm) > 0) &&
    entries.every(([, measurement]) => {
      if (!measurement || typeof measurement !== "object" || Array.isArray(measurement)) return false;
      const raw = (measurement as { cm?: unknown }).cm;
      if (raw == null) return true;
      const cm = Number(raw);
      return Number.isFinite(cm) && cm > 0 && cm <= 400;
    });
}

function validProfile(value: any): value is { sizing: { top: object; bottom: object }; measurements: object } {
  return value?.sizing?.top && value?.sizing?.bottom &&
    validMeasurements(value.sizing.top) && validMeasurements(value.sizing.bottom) &&
    validMeasurements(value.measurements);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Your sizing session expired. Please try again." }, { status: 401 });
  try {
    const input = await request.json();
    let profile: unknown;
    if (input.method === "manual") {
      if (JSON.stringify(input).length > 50_000)
        return NextResponse.json({ message: "Measurement data is too large." }, { status: 413 });
      profile = input.result;
    } else if (input.method === "photo" && /^[a-zA-Z0-9_-]{1,200}$/.test(input.taskId || "")) {
      if ((await cookies()).get("cm_photo_preview_task")?.value !== input.taskId)
        return NextResponse.json({ message: "This photo result belongs to a different sizing session." }, { status: 409 });
      if (!WEBCLIENT_MOCK) {
        const response = await sizeApiFetch(`/generate/v1/size/${input.taskId}`, session);
        const reply = normalizeSizeReply(await response.json(), response.status, "generateResult");
        if (reply.state !== "complete")
          return NextResponse.json({ message: "Your photo sizing result is not ready to save." }, { status: 409 });
        profile = reply.result;
      }
    } else {
      return NextResponse.json({ message: "Choose a completed sizing result to save." }, { status: 400 });
    }
    if (!WEBCLIENT_MOCK && !validProfile(profile))
      return NextResponse.json({ message: "Sizing completed without the measurements needed to save your fit profile." }, { status: 422 });
    if (WEBCLIENT_MOCK) {
      (await cookies()).set("cm_mock_fit", session.personId, { httpOnly: true, sameSite: "lax", path: "/" });
    } else {
      const { sizing, measurements } = profile as { sizing: object; measurements: object };
      await customerFetch(`/v1/customer/persons/${session.personId}/sizing-profile`, {
        method: "PUT", accessToken: session.accessToken, personId: session.personId,
        body: { sizing, measurements },
      });
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      message: error instanceof Error ? error.message : "Could not save your size. Please try again.",
    }, { status: error instanceof CustomerApiError ? error.status : 503 });
  }
}
