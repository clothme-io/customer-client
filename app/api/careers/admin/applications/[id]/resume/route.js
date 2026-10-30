import { NextResponse } from "next/server";
import { careerPool } from "../../../../../../../src/lib/careersDb.js";
import { careerAdminIdentity, careerAudit } from "../../../../../../../src/lib/careerAdmin.js";

export const runtime = "nodejs";
export async function GET(request, { params }) {
  try {
    const identity = await careerAdminIdentity(request);
    if (!identity) return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    if (!/^[0-9a-f-]{36}$/i.test(params.id || "")) return NextResponse.json({ message: "Invalid application" }, { status: 400 });
    const result = await careerPool().query("SELECT job_id, resume_filename, resume_mime, resume_bytes FROM career_applications WHERE id=$1", [params.id]);
    if (!result.rows[0]) return NextResponse.json({ message: "Not found" }, { status: 404 });
    const row = result.rows[0];
    await careerAudit(identity.email, "resume.downloaded", row.job_id, params.id);
    const safeName = row.resume_filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
    return new Response(row.resume_bytes, { headers: { "Content-Type": row.resume_mime, "Content-Disposition": `attachment; filename="${safeName}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { console.error("[careers/resume]", error); return NextResponse.json({ message: "Resume unavailable" }, { status: 503 }); }
}
