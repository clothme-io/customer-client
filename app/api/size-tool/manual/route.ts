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
  return NextResponse.json(
    { message: error instanceof Error ? error.message : "Manual sizing is unavailable. Please try again." },
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
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error || Number(body.status) >= 400)
        return NextResponse.json({ message: body.error?.message || "Manual sizing is temporarily unavailable." }, { status: response.ok ? 502 : response.status });
      result = body.result;
      if (!result?.sizing?.top || !result?.sizing?.bottom || !result?.measurements)
        throw new Error("Manual sizing returned an incomplete profile.");
    }
    return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
