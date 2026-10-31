import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { customerFetch, CustomerApiError } from "../../../(webclient)/lib/api";
import { WEBCLIENT_MOCK } from "../../../(webclient)/lib/config";
import { sizeApiFetch } from "../../../(webclient)/lib/size-api";
import { getSession } from "../../../(webclient)/lib/session";
import {
  applyManualMeasurementEdits,
  validateManualAnswers,
} from "../../../../src/lib/manualSizeProfile";

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
  const item = (cm: number) => ({ cm, inches: Math.round(cm / 2.54 * 100) / 100 });
  const body = (cm: number) => ({ cm, in: Math.round(cm / 2.54 * 100) / 100, confidence: null });
  return {
    source: "questionnaire" as const,
    sizing: {
      top: { chest_circumference: item(chest), chest_half_circumference: item(chest / 2), waist_circumference: item(waist) },
      bottom: { waist_circumference: item(waist), hip_circumference: item(hips) },
    },
    measurements: { "chest/bust": body(chest), waist: body(waist), hips: body(hips) },
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
      (await cookies()).set("cm_mock_fit", session.personId, { httpOnly: true, sameSite: "lax", path: "/" });
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
      await customerFetch(`/v1/customer/persons/${session.personId}/sizing-profile`, {
        method: "PUT", accessToken: session.accessToken, personId: session.personId,
        body: { sizing: result.sizing, measurements: result.measurements },
      });
    }
    return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Your sizing session expired. Please sign in." }, { status: 401 });
  try {
    const { edits } = await request.json();
    if (WEBCLIENT_MOCK) return NextResponse.json({ ok: true });
    const profile = await customerFetch<{ sizing: object; measurements: object }>(
      `/v1/customer/persons/${session.personId}/sizing-profile`,
      { accessToken: session.accessToken, personId: session.personId },
    );
    if (!profile?.sizing || !profile?.measurements)
      return NextResponse.json({ message: "Saved measurements were not found." }, { status: 409 });
    const updated = applyManualMeasurementEdits(profile, edits);
    await customerFetch(`/v1/customer/persons/${session.personId}/sizing-profile`, {
      method: "PUT", accessToken: session.accessToken, personId: session.personId,
      body: { sizing: updated.sizing, measurements: updated.measurements },
    });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
