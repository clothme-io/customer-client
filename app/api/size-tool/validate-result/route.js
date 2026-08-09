import { NextResponse } from "next/server";
import { sizeApiConfig, sizeApiHeaders } from "../../../../src/lib/sizeApiServer.js";

export const runtime = "nodejs";

/**
 * GET /api/size-tool/validate-result?pose=front|side&taskId=...
 */
export async function GET(request) {
  const cfg = sizeApiConfig();
  if (!cfg.baseUrl) {
    return NextResponse.json(
      { error: { message: "Size service is not configured (SIZE_API_URL)." } },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const pose = String(searchParams.get("pose") || "").toLowerCase();
  const taskId = String(searchParams.get("taskId") || "").trim();

  if ((pose !== "front" && pose !== "side") || !taskId) {
    return NextResponse.json(
      { error: { message: "pose and taskId are required" } },
      { status: 400 }
    );
  }

  try {
    const path =
      pose === "front"
        ? `/sam3d/validate-front-result/${encodeURIComponent(taskId)}`
        : `/sam3d/validate-side-result/${encodeURIComponent(taskId)}`;
    const res = await fetch(`${cfg.baseUrl}${path}`, {
      method: "GET",
      headers: sizeApiHeaders(cfg),
      signal: AbortSignal.timeout(30000)
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
          message: json?.message || "Processing",
          percentage: json?.percentage_done ?? null
        },
        { status: 202 }
      );
    }

    if (!res.ok) {
      const msg =
        json?.error?.message ||
        (typeof json?.error === "string" ? json.error : null) ||
        `Validation result failed (${res.status})`;
      return NextResponse.json({ error: { message: msg } }, { status: res.status >= 400 ? res.status : 502 });
    }

    const status = json?.data?.status;
    if (status && status !== "completed") {
      return NextResponse.json(
        { ok: true, ready: false, message: status },
        { status: 202 }
      );
    }

    if (json?.error && !json?.data) {
      return NextResponse.json(
        { error: { message: json.error?.message || "Validation did not pass. Try clearer front and side photos." } },
        { status: 422 }
      );
    }

    // SAM3D generate/v2 requires prediction Celery ids (store sam3d_photo_b64), not validate task ids.
    const predictionId = json?.data?.prediction_id || null;
    if (!predictionId) {
      return NextResponse.json(
        {
          error: {
            message:
              "Validation passed but no prediction id was returned. The size service may still be preparing measurements — try again."
          }
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      ready: true,
      taskId: json?.data?.task_id || taskId,
      predictionId
    });
  } catch (error) {
    console.error("[size-tool/validate-result]", error);
    return NextResponse.json(
      { error: { message: "Could not reach size service" } },
      { status: 502 }
    );
  }
}
