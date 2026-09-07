import { NextResponse } from "next/server";
import { actionError, requireSession } from "../../../(webclient)/lib/require-session";
import { mockSizeResponse, sizeApiFetch, sizeMockEnabled } from "../../../(webclient)/lib/size-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error || !session) return error;

  try {
    const form = await request.formData();
    const action = String(form.get("action") || "");

    if (action === "validateFront" || action === "validateSide") {
      const path = action === "validateFront" ? "/validate-front" : "/validate-side";
      if (sizeMockEnabled()) {
        return NextResponse.json(mockSizeResponse(path, "POST"));
      }
      const outbound = new FormData();
      const image = form.get("image");
      if (image instanceof Blob) {
        outbound.append("image", image, "size_image.jpg");
      }
      for (const key of [
        "dob",
        "gender",
        "genderDemography",
        "height",
        "type",
        "weight",
        "provinceState",
        "country",
        "city"
      ]) {
        outbound.append(key, String(form.get(key) || ""));
      }
      const response = await sizeApiFetch(path, session, { method: "POST", body: outbound });
      const body = await response.json().catch(() => ({}));
      return NextResponse.json(body, { status: response.status });
    }

    if (action === "generate") {
      if (sizeMockEnabled()) {
        return NextResponse.json(mockSizeResponse("/generate/v1/size", "POST"));
      }
      const outbound = new FormData();
      for (const key of [
        "frontTaskId",
        "sideTaskId",
        "height",
        "gender",
        "dob",
        "weight",
        "genderDemography",
        "city",
        "country",
        "provinceState"
      ]) {
        outbound.append(key, String(form.get(key) || ""));
      }
      const frontImage = form.get("frontImage");
      const sideImage = form.get("sideImage");
      if (frontImage instanceof Blob) outbound.append("frontImage", frontImage, "front.jpg");
      if (sideImage instanceof Blob) outbound.append("sideImage", sideImage, "side.jpg");
      const response = await sizeApiFetch("/generate/v1/size", session, { method: "POST", body: outbound });
      const body = await response.json().catch(() => ({}));
      return NextResponse.json(body, { status: response.status });
    }

    if (action === "manual") {
      const payload = {
        top: {
          size: String(form.get("topSize") || ""),
          chest: Number(form.get("chest") || 0),
          waist: Number(form.get("waist") || 0)
        },
        bottom: {
          size: String(form.get("bottomSize") || ""),
          hips: Number(form.get("hips") || 0),
          legLength: Number(form.get("legLength") || 0)
        }
      };
      if (sizeMockEnabled()) return NextResponse.json({ ok: true, ...payload });
      const response = await sizeApiFetch("/manual/add", session, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({ ok: true }));
      return NextResponse.json(body, { status: response.status });
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (err) {
    return actionError(err);
  }
}

export async function GET(request: Request) {
  const { session, error } = await requireSession();
  if (error || !session) return error;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "";
  const id = searchParams.get("id") || "";
  const type = searchParams.get("type") || "front";

  try {
    if (action === "validateResult") {
      const path = type === "side" ? `/validate-side-result/${id}` : `/validate-front-result/${id}`;
      if (sizeMockEnabled()) return NextResponse.json(mockSizeResponse(path, "GET"));
      const response = await sizeApiFetch(path, session);
      const body = await response.json().catch(() => ({}));
      return NextResponse.json(body, { status: response.status < 500 ? 200 : response.status });
    }

    if (action === "generateResult") {
      const path = `/generate/v1/size/${id}`;
      if (sizeMockEnabled()) return NextResponse.json(mockSizeResponse(path, "GET"));
      const response = await sizeApiFetch(path, session);
      const body = await response.json().catch(() => ({}));
      return NextResponse.json({ ...body, taskId: id }, { status: response.status < 500 ? 200 : response.status });
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (err) {
    return actionError(err);
  }
}
