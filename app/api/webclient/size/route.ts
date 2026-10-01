import {
  signSizeTicket,
  verifySizeTicket,
  type SizeTicket,
} from "../../../(webclient)/lib/size-ticket";
import { saveFitProfile } from "../../../(webclient)/lib/save-fit-profile";
import {
  normalizeSizeReply,
  type SizeOperation,
} from "../../../(webclient)/lib/size-contract";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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

function sizeResponse(
  body: unknown,
  status: number,
  operation: SizeOperation,
  ticket?: Omit<SizeTicket, "taskId">,
) {
  const normalized = normalizeSizeReply(body, status, operation);
  const receipt =
    ticket && normalized.taskId
      ? signSizeTicket({ ...ticket, taskId: normalized.taskId })
      : undefined;
  return NextResponse.json(
    { ...normalized, receipt },
    { status: normalized.status, headers: { "Cache-Control": "no-store" } },
  );
}
function validImage(value: FormDataEntryValue | null): value is File {
  return (
    value instanceof Blob &&
    value.size > 0 &&
    value.size <= 8 * 1024 * 1024 &&
    ["image/jpeg", "image/png", "image/webp"].includes(value.type)
  );
}

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error || !session) return error;

  try {
    const form = await request.formData();
    const action = String(form.get("action") || "");
    const profile = Object.fromEntries(
      [
        "dob",
        "gender",
        "height",
        "weight",
        "country",
        "city",
        "provinceState",
      ].map((key) => [key, String(form.get(key) || "")]),
    );
    const ticket = {
      accountId: session.accountId,
      personId: session.personId,
      issuedAt: new Date().toISOString(),
      pose:
        action === "validateFront"
          ? ("front" as const)
          : action === "validateSide"
            ? ("side" as const)
            : undefined,
      kind:
        action === "generate" ? ("generate" as const) : ("validate" as const),
      profile,
    };
    // Validate configuration before accepting any expensive upstream work.
    signSizeTicket({ ...ticket, taskId: "configuration-check" });

    if (["validateFront", "validateSide", "generate"].includes(action)) {
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
      ) {
        return NextResponse.json(
          { message: "Check your date of birth, height, gender and country." },
          { status: 400 },
        );
      }
      const images =
        action === "generate"
          ? [form.get("frontImage"), form.get("sideImage")]
          : [form.get("image")];
      if (!images.every(validImage))
        return NextResponse.json(
          { message: "Upload JPEG, PNG or WebP photos up to 8 MB each." },
          { status: 400 },
        );
      if (
        action === "generate" &&
        ["frontTaskId", "sideTaskId"].some(
          (key) => !/^[a-zA-Z0-9_-]{1,200}$/.test(String(form.get(key) || "")),
        )
      ) {
        return NextResponse.json(
          { message: "Validate both photos before generating sizes." },
          { status: 400 },
        );
      }
    }
    if (action === "validateFront" || action === "validateSide") {
      const path =
        action === "validateFront" ? "/validate-front" : "/validate-side";
      if (sizeMockEnabled()) {
        return sizeResponse(
          mockSizeResponse(path, "POST"),
          202,
          "validate",
          ticket,
        );
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
        "city",
      ]) {
        outbound.append(key, String(form.get(key) || ""));
      }
      const response = await sizeApiFetch(path, session, {
        method: "POST",
        body: outbound,
      });
      const body = await response.json().catch(() => ({}));
      return sizeResponse(body, response.status, "validate", ticket);
    }

    if (action === "generate") {
      for (const pose of ["front", "side"]) {
        const validated = verifySizeTicket(
          String(form.get(`${pose}Receipt`) || ""),
          session,
          String(form.get(`${pose}TaskId`) || ""),
          "validated",
        );
        if (
          validated.pose !== pose ||
          JSON.stringify(validated.profile) !== JSON.stringify(profile)
        )
          return NextResponse.json(
            { message: "Your profile changed. Validate both photos again." },
            { status: 400 },
          );
      }
      if (sizeMockEnabled()) {
        return sizeResponse(
          mockSizeResponse("/generate/v1/size", "POST"),
          202,
          "generate",
          ticket,
        );
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
        "provinceState",
      ]) {
        outbound.append(key, String(form.get(key) || ""));
      }
      const frontImage = form.get("frontImage");
      const sideImage = form.get("sideImage");
      if (frontImage instanceof Blob)
        outbound.append("frontImage", frontImage, "front.jpg");
      if (sideImage instanceof Blob)
        outbound.append("sideImage", sideImage, "side.jpg");
      const response = await sizeApiFetch("/generate/v1/size", session, {
        method: "POST",
        body: outbound,
      });
      const body = await response.json().catch(() => ({}));
      return sizeResponse(body, response.status, "generate", ticket);
    }

    if (action === "manual") {
      const payload = {
        top: {
          size: String(form.get("topSize") || ""),
          chest: Number(form.get("chest") || 0),
          waist: Number(form.get("waist") || 0),
        },
        bottom: {
          size: String(form.get("bottomSize") || ""),
          hips: Number(form.get("hips") || 0),
          legLength: Number(form.get("legLength") || 0),
        },
      };
      if (sizeMockEnabled()) {
        (await cookies()).set("cm_mock_fit", session.personId, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        });
        return NextResponse.json({ ok: true });
      }
      if (
        [
          payload.top.chest,
          payload.top.waist,
          payload.bottom.hips,
          payload.bottom.legLength,
        ].some(
          (value) => !Number.isFinite(value) || value <= 0 || value > 400,
        ) ||
        !payload.top.size ||
        !payload.bottom.size
      ) {
        return NextResponse.json(
          { message: "Enter positive measurements and both size labels." },
          { status: 400 },
        );
      }
      const manualId = String(form.get("operationId") || "");
      if (!/^[a-f0-9-]{36}$/i.test(manualId))
        return NextResponse.json(
          { message: "Invalid manual measurement session" },
          { status: 400 },
        );
      const region = (
        {
          Canada: "US_CAD",
          "United States": "US_CAD",
          "United Kingdom": "UK",
          Australia: "AUS",
          France: "EU",
          Germany: "EU",
        } as Record<string, string>
      )[profile.country];
      if (!region)
        return NextResponse.json(
          { message: "Choose your country before adding sizes." },
          { status: 400 },
        );
      const range = (value: number) => ({ cm: [value, value] });
      const result = {
        measurements: {
          "chest/bust": { cm: payload.top.chest },
          waist: { cm: payload.top.waist },
          hips: { cm: payload.bottom.hips },
          inseam: { cm: payload.bottom.legLength },
        },
        size_recommendations: {
          [region]: {
            tops: {
              regular: {
                size: payload.top.size,
                chest: range(payload.top.chest),
                waist: range(payload.top.waist),
              },
            },
            bottoms: {
              regular: {
                size: payload.bottom.size,
                hip: range(payload.bottom.hips),
                inseam: range(payload.bottom.legLength),
                waist: range(payload.top.waist),
              },
            },
          },
        },
      };
      const saved = await saveFitProfile(
        session,
        { ...ticket, kind: "generate", taskId: manualId },
        result,
        "manual",
      );
      return NextResponse.json(saved);
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
    if (
      !/^[a-zA-Z0-9_-]{1,200}$/.test(id) ||
      !["front", "side"].includes(type)
    ) {
      return NextResponse.json(
        { message: "Invalid sizing task" },
        { status: 400 },
      );
    }
    const receipt = verifySizeTicket(
      request.headers.get("x-size-receipt") || "",
      session,
      id,
      action === "generateResult" ? "generate" : "validate",
    );
    if (action === "validateResult") {
      if (receipt.pose !== type)
        return NextResponse.json(
          { message: "Incorrect pose for this validation job." },
          { status: 400 },
        );
      const path =
        type === "side"
          ? `/validate-side-result/${id}`
          : `/validate-front-result/${id}`;
      if (sizeMockEnabled()) {
        const reply = normalizeSizeReply(
          mockSizeResponse(path, "GET"),
          200,
          "validateResult",
        );
        return NextResponse.json({
          ...reply,
          receipt: signSizeTicket({
            ...receipt,
            kind: "validated",
            taskId: reply.predictionId!,
          }),
        });
      }
      const response = await sizeApiFetch(path, session);
      const body = await response.json().catch(() => ({}));
      const reply = normalizeSizeReply(body, response.status, "validateResult");
      return NextResponse.json(
        {
          ...reply,
          receipt: reply.predictionId
            ? signSizeTicket({
                ...receipt,
                kind: "validated",
                taskId: reply.predictionId,
              })
            : undefined,
        },
        { status: reply.status },
      );
    }

    if (action === "generateResult") {
      const path = `/generate/v1/size/${id}`;
      if (sizeMockEnabled()) {
        return sizeResponse(
          mockSizeResponse(path, "GET"),
          200,
          "generateResult",
        );
      }
      const response = await sizeApiFetch(path, session);
      const body = await response.json().catch(() => ({}));
      return sizeResponse(body, response.status, "generateResult");
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (err) {
    return actionError(err);
  }
}
