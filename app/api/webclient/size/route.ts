import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  normalizeSizeReply,
  type SizeOperation,
} from "../../../(webclient)/lib/size-contract";
import {
  actionError,
  requireSession,
} from "../../../(webclient)/lib/require-session";
import {
  mockSizeResponse,
  sizeApiFetch,
  sizeMockEnabled,
} from "../../../(webclient)/lib/size-api";

export const runtime = "nodejs";
function sizeResponse(body: unknown, status: number, operation: SizeOperation) {
  const reply = normalizeSizeReply(body, status, operation);
  return NextResponse.json(reply, {
    status: reply.status,
    headers: { "Cache-Control": "no-store" },
  });
}
function validImage(value: FormDataEntryValue | null): value is File {
  return (
    value instanceof Blob &&
    value.size > 0 &&
    value.size <= 8 * 1024 * 1024 &&
    ["image/jpeg", "image/png", "image/webp"].includes(value.type)
  );
}
const validTask = (id: string) => /^[a-zA-Z0-9_-]{1,200}$/.test(id);

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (!session) return error;
  try {
    const form = await request.formData();
    const action = String(form.get("action") || "");
    if (action === "manual") {
      // Same size-api request body as mobile's addManualSize API.
      const payload = {
        top: {
          size: String(form.get("topSize") || ""),
          chest: Number(form.get("chest")),
          waist: Number(form.get("waist")),
        },
        bottom: {
          size: String(form.get("bottomSize") || ""),
          hips: Number(form.get("hips")),
          legLength: Number(form.get("legLength")),
        },
      };
      if (
        !payload.top.size ||
        !payload.bottom.size ||
        [
          payload.top.chest,
          payload.top.waist,
          payload.bottom.hips,
          payload.bottom.legLength,
        ].some((n) => !Number.isFinite(n) || n <= 0 || n > 400)
      ) {
        return NextResponse.json(
          { message: "Enter positive measurements and both size labels." },
          { status: 400 },
        );
      }
      if (sizeMockEnabled()) {
        (await cookies()).set("cm_mock_fit", session.personId, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        });
        return NextResponse.json({ ok: true });
      }
      const response = await sizeApiFetch("/manual/add", session, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok || Number(body.status) >= 400 || body.error)
        return NextResponse.json(
          {
            message:
              typeof body.error === "string"
                ? body.error
                : body.error?.message || "Could not save manual sizes.",
          },
          { status: response.ok ? 400 : response.status },
        );
      return NextResponse.json(body);
    }
    if (!["validateFront", "validateSide", "generate"].includes(action))
      return NextResponse.json({ message: "Unknown action" }, { status: 400 });
    const height = Number(form.get("height"));
    const dob = String(form.get("dob") || "");
    if (
      !Number.isFinite(height) ||
      height < 80 ||
      height > 250 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
      !Number.isFinite(Date.parse(dob)) ||
      Date.parse(dob) > Date.now() ||
      !["female", "male"].includes(String(form.get("gender"))) ||
      !String(form.get("country") || "").trim()
    )
      return NextResponse.json(
        { message: "Check your date of birth, height, gender and country." },
        { status: 400 },
      );
    const generate = action === "generate";
    const images = generate ? ["frontImage", "sideImage"] : ["image"];
    if (!images.every((key) => validImage(form.get(key))))
      return NextResponse.json(
        { message: "Upload JPEG, PNG or WebP photos up to 8 MB each." },
        { status: 400 },
      );
    if (
      generate &&
      ["frontTaskId", "sideTaskId"].some(
        (key) => !validTask(String(form.get(key) || "")),
      )
    )
      return NextResponse.json(
        { message: "Validate both photos before generating sizes." },
        { status: 400 },
      );
    const path = generate
      ? "/generate/v1/size"
      : action === "validateFront"
        ? "/validate-front"
        : "/validate-side";
    const operation = generate ? "generate" : "validate";
    if (sizeMockEnabled())
      return sizeResponse(mockSizeResponse(path, "POST"), 202, operation);
    const outbound = new FormData();
    for (const key of [
      "dob",
      "gender",
      "genderDemography",
      "height",
      "weight",
      "provinceState",
      "country",
      "city",
      ...(generate ? ["frontTaskId", "sideTaskId"] : ["type"]),
    ])
      outbound.set(key, String(form.get(key) || ""));
    for (const key of images)
      outbound.set(key, form.get(key) as File, `${key}.jpg`);
    const response = await sizeApiFetch(path, session, {
      method: "POST",
      body: outbound,
    });
    return sizeResponse(await response.json(), response.status, operation);
  } catch (err) {
    return actionError(err);
  }
}

export async function GET(request: Request) {
  const { session, error } = await requireSession();
  if (!session) return error;
  try {
    const query = new URL(request.url).searchParams;
    const action = query.get("action");
    const id = query.get("id") || "";
    const type = query.get("type") || "front";
    if (
      !validTask(id) ||
      !["front", "side"].includes(type) ||
      !["validateResult", "generateResult"].includes(action || "")
    )
      return NextResponse.json(
        { message: "Invalid sizing task" },
        { status: 400 },
      );
    const operation = action as "validateResult" | "generateResult";
    const path =
      operation === "generateResult"
        ? `/generate/v1/size/${id}`
        : `/validate-${type}-result/${id}`;
    if (sizeMockEnabled()) {
      if (operation === "generateResult")
        (await cookies()).set("cm_mock_fit", session.personId, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        });
      return sizeResponse(mockSizeResponse(path, "GET"), 200, operation);
    }
    const response = await sizeApiFetch(path, session);
    return sizeResponse(await response.json(), response.status, operation);
  } catch (err) {
    return actionError(err);
  }
}
