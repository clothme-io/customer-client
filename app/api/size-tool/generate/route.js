import { NextResponse } from "next/server";
import {
  mapGenerateResult,
  sizeApiConfig,
  sizeApiHeaders,
  sizeApiQuery
} from "../../../../src/lib/sizeApiServer.js";

export const runtime = "nodejs";

/**
 * POST /api/size-tool/generate
 * JSON: { frontPredictionId, sidePredictionId, height }
 *
 * Proxies to size-api POST /sam3d/generate/v2/{front}/{side}.
 * Path params must be SAM3D *prediction* task ids from validate-result
 * (data.prediction_id), matching customer-client-mobile.
 */
export async function POST(request) {
  const cfg = sizeApiConfig();
  if (!cfg.baseUrl) {
    return NextResponse.json(
      { error: { message: "Size service is not configured (SIZE_API_URL)." } },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const frontPredictionId = String(
      body.frontPredictionId || body.frontTaskId || ""
    ).trim();
    const sidePredictionId = String(
      body.sidePredictionId || body.sideTaskId || ""
    ).trim();
    const height = String(body.height || "").trim();

    if (!frontPredictionId || !sidePredictionId || !height) {
      return NextResponse.json(
        {
          error: {
            message: "frontPredictionId, sidePredictionId, and height are required"
          }
        },
        { status: 400 }
      );
    }

    const url = `${cfg.baseUrl}/sam3d/generate/v2/${encodeURIComponent(frontPredictionId)}/${encodeURIComponent(sidePredictionId)}?${sizeApiQuery(cfg)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...sizeApiHeaders(cfg),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        height,
        gender: cfg.gender,
        weight: cfg.weight,
        genderDemography: cfg.genderDemography,
        dob: cfg.dob,
        city: cfg.city,
        country: cfg.country,
        provinceState: cfg.provinceState,
        provider: "sam3d"
      }),
      signal: AbortSignal.timeout(120000)
    });

    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    if (res.status === 202) {
      return NextResponse.json(
        {
          ok: true,
          ready: false,
          message: json?.message || json?.data?.message || "Prediction still processing"
        },
        { status: 202 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: {
            message:
              json?.error?.message ||
              (typeof json?.error === "string" ? json.error : null) ||
              `Size generation failed (${res.status})`
          }
        },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    const result = mapGenerateResult(json);
    return NextResponse.json({ ok: true, ready: true, result });
  } catch (error) {
    console.error("[size-tool/generate]", error);
    return NextResponse.json(
      {
        error: {
          message:
            error?.name === "TimeoutError"
              ? "Size generation timed out"
              : "Could not reach size service"
        }
      },
      { status: 502 }
    );
  }
}
