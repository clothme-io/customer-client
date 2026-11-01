import { NextResponse } from "next/server";
import { CustomerApiError } from "../../../(webclient)/lib/api";
import { WEBCLIENT_MOCK } from "../../../(webclient)/lib/config";
import { sizeApiFetch } from "../../../(webclient)/lib/size-api";
import { getSession } from "../../../(webclient)/lib/session";
import { validateManualAnswers } from "../../../../src/lib/manualSizeProfile";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const status = error instanceof CustomerApiError ? error.status :
    error instanceof Error && /^(Manual sizing|Enter |Choose )/.test(error.message) ? 400 : 503;
  if (status >= 500) console.error("Manual sizing request failed", error);
  return NextResponse.json(
    { message: status >= 500 ? "We couldn't reach the sizing service. Please try again shortly." : error instanceof Error ? error.message : "Check your answers and try again." },
    { status },
  );
}

function mockProfile(answers: ReturnType<typeof validateManualAnswers>) {
  const chest = Math.round((answers.height_cm * 0.5 + answers.mass_kg * 0.15) * 100) / 100;
  const waist = Math.round(chest * 0.82 * 100) / 100;
  const hips = Math.round(chest * 1.04 * 100) / 100;
  const shoulder = Math.round(answers.height_cm * 0.24 * 100) / 100;
  const sleeve = Math.round(answers.height_cm * 0.34 * 100) / 100;
  const inseam = Math.round(answers.height_cm * 0.45 * 100) / 100;
  const thigh = Math.round(hips * 0.56 * 100) / 100;
  const neck = Math.round(chest * 0.39 * 100) / 100;
  const item = (cm: number) => ({ cm, inches: Math.round(cm / 2.54 * 100) / 100 });
  const body = (cm: number) => ({ cm, in: Math.round(cm / 2.54 * 100) / 100, confidence: null });
  return {
    source: "questionnaire" as const,
    sizing: {
      top: {
        shoulder_width: item(shoulder), chest_circumference: item(chest),
        chest_half_circumference: item(chest / 2), sleeve_length: item(sleeve),
        neck_circumference: item(neck), waist_circumference: item(waist),
      },
      bottom: {
        waist_circumference: item(waist), hip_circumference: item(hips),
        thigh_circumference: item(thigh), inseam: item(inseam),
      },
    },
    measurements: {
      "chest/bust": body(chest), waist: body(waist), hips: body(hips),
      shoulder_to_shoulder: body(shoulder), neck: body(neck),
      sleeve: body(sleeve), inseam: body(inseam), thigh: body(thigh),
    },
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Your sizing session expired. Please try again." }, { status: 401 });
  try {
    const answers = validateManualAnswers(await request.json());
    let result;
    if (WEBCLIENT_MOCK) {
      result = mockProfile(answers);
    } else {
      const response = await sizeApiFetch("/manual/generate", session, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
        signal: AbortSignal.timeout(90_000),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error || Number(body.status) >= 400) {
        const status = response.ok ? 502 : response.status;
        const upstreamError = typeof body.error === "string" ? body.error : body.error?.message;
        console.error("Manual sizing service rejected request", { status, upstreamError });
        const message = status === 401 || status === 403
          ? "Your sizing session expired. Please try again."
          : status === 429
            ? "Too many sizing requests. Please wait a moment and try again."
            : status >= 400 && status < 500
              ? upstreamError || "Check your answers and try again."
              : "We couldn't complete your sizing right now. Please try again shortly.";
        return NextResponse.json({ message }, { status });
      }
      result = body.result;
      if (!result?.sizing?.top || !result?.sizing?.bottom || !result?.measurements)
        throw new Error("Manual sizing returned an incomplete profile.");
    }
    return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
