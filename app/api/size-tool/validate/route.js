import { NextResponse } from "next/server";
import {
  sizeApiConfig,
  sizeApiHeaders,
  sizeApiQuery
} from "../../../../src/lib/sizeApiServer.js";

export const runtime = "nodejs";

/**
 * POST /api/size-tool/validate
 * multipart: pose=front|side, height (cm), image (file)
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
    const form = await request.formData();
    const pose = String(form.get("pose") || "").toLowerCase();
    const height = String(form.get("height") || "").trim();
    const image = form.get("image");

    if (pose !== "front" && pose !== "side") {
      return NextResponse.json({ error: { message: "pose must be front or side" } }, { status: 400 });
    }
    if (!height || Number.isNaN(Number(height))) {
      return NextResponse.json({ error: { message: "height (cm) is required" } }, { status: 400 });
    }
    if (!(image instanceof Blob) || image.size === 0) {
      return NextResponse.json({ error: { message: "image is required" } }, { status: 400 });
    }

    const upstream = new FormData();
    upstream.append("image", image, pose === "front" ? "front.jpg" : "side.jpg");
    upstream.append("height", height);
    upstream.append("gender", cfg.gender);
    upstream.append("type", pose);
    upstream.append("dob", cfg.dob);
    upstream.append("genderDemography", cfg.genderDemography);
    upstream.append("weight", cfg.weight);
    upstream.append("city", cfg.city);
    upstream.append("country", cfg.country);
    upstream.append("provinceState", cfg.provinceState);

    const path = pose === "front" ? "/sam3d/validate-front" : "/sam3d/validate-side";
    const url = `${cfg.baseUrl}${path}?${sizeApiQuery(cfg)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: sizeApiHeaders(cfg),
      body: upstream,
      signal: AbortSignal.timeout(60000)
    });

    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    if (!res.ok && res.status !== 202) {
      return NextResponse.json(
        {
          error: {
            message:
              json?.error?.message ||
              json?.error ||
              `Size validation failed (${res.status})`
          }
        },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    const taskId = json?.data?.task_id || json?.data?.taskId || json?.task_id;
    if (!taskId) {
      return NextResponse.json(
        { error: { message: "Size service did not return a task id" }, upstream: json },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, taskId, pose }, { status: 202 });
  } catch (error) {
    console.error("[size-tool/validate]", error);
    return NextResponse.json(
      { error: { message: error?.name === "TimeoutError" ? "Size service timed out" : "Could not reach size service" } },
      { status: 502 }
    );
  }
}
