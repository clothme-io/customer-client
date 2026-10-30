import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { careerPool } from "../../../../../src/lib/careersDb.js";
import { cleanText, cleanUrl, MAX_RESUME_BYTES, saveApplication, validateResume } from "../../../../../src/lib/careerApplication.js";

export const runtime = "nodejs";
const reply = (message, status) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
const recruitingInbox = process.env.RECRUITING_TO || "careers.admin@clothme.io";

async function deliver(reference, email, title) {
  const client = await careerPool().connect();
  const lock = await client.query("SELECT pg_try_advisory_lock(hashtext($1)) AS acquired", [reference]);
  if (!lock.rows[0]?.acquired) { client.release(); return false; }
  try {
    const payload = await getPayload({ config });
    const row = await client.query("SELECT recruiting_notified_at, applicant_notified_at FROM career_applications WHERE reference=$1", [reference]);
    if (!row.rows[0]) return false;
    if (!row.rows[0].recruiting_notified_at) {
      await payload.sendEmail({
        to: recruitingInbox,
        subject: `New ClothME application ${reference}: ${title}`,
        text: `New application for ${title}.\nReference: ${reference}\nReview it in the private recruiting dashboard.`,
      });
      await client.query("UPDATE career_applications SET recruiting_notified_at=now() WHERE reference=$1", [reference]);
    }
    if (!row.rows[0].applicant_notified_at) {
      await payload.sendEmail({
        to: email,
        subject: `ClothME application received — ${reference}`,
        text: `Thank you for applying to ClothME for ${title}.\nWe received your application. Reference: ${reference}.\nOur team will review it and contact you if your experience aligns with the role.`,
      });
      await client.query("UPDATE career_applications SET applicant_notified_at=now() WHERE reference=$1", [reference]);
    }
    return true;
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext($1))", [reference]).catch(() => {});
    client.release();
  }
}

export async function POST(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== new URL(request.url).host) return reply("Invalid request origin.", 403); }
    catch { return reply("Invalid request origin.", 403); }
  }
  if (Number(request.headers.get("content-length") || 0) > MAX_RESUME_BYTES + 1024 * 1024) return reply("Resume exceeds the 10 MB limit.", 413);
  if (!process.env.RESEND_API_KEY) return reply("Applications are temporarily unavailable. Please try again later.", 503);
  try {
    const form = await request.formData();
    if (form.get("company")) return reply("Application could not be submitted.", 400);
    const requestId = String(form.get("requestId") || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return reply("Reload the form and try again.", 400);
    const fields = {
      firstName: cleanText(form.get("firstName"), 100, true), lastName: cleanText(form.get("lastName"), 100, true),
      email: cleanText(form.get("email"), 254, true)?.toLowerCase(), phone: cleanText(form.get("phone"), 60, true),
      location: cleanText(form.get("location"), 160, true), motivation: cleanText(form.get("motivation"), 4000, true),
      linkedIn: cleanUrl(form.get("linkedIn")), portfolio: cleanUrl(form.get("portfolio")), github: cleanUrl(form.get("github")),
      coverLetter: cleanText(form.get("coverLetter"), 8000), additionalInfo: cleanText(form.get("additionalInfo"), 4000),
    };
    if (Object.values(fields).some((value) => value === null) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email || "") || fields.motivation.length < 20 || form.get("consent") !== "yes") return reply("Check the required fields and privacy consent.", 400);
    const file = form.get("resume");
    if (!(file instanceof File) || file.size > MAX_RESUME_BYTES || !file.size) return reply("Choose a resume up to 10 MB.", 400);
    const resume = Buffer.from(await file.arrayBuffer());
    const mime = validateResume(file.name, resume);
    if (!mime) return reply("Resume must be a valid PDF, DOC, or DOCX file.", 400);
    const answers = {};
    for (const [key, value] of form.entries()) if (key.startsWith("question_")) {
      const id = key.slice(9); const answer = cleanText(value, 3000);
      if (!/^[a-z0-9_-]{1,60}$/.test(id) || answer === null) return reply("Check the role-specific answers.", 400);
      answers[id] = answer;
    }
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const saved = await saveApplication({ jobSlug: params.slug, requestId, fields, answers, resume, filename: file.name.slice(0, 180), mime, ip });
    if (saved.kind === "closed") return reply("This role is no longer accepting applications.", 410);
    if (saved.kind === "limited") return reply("Too many applications. Please try again later.", 429);
    if (saved.kind === "invalidQuestions") return reply("Please answer the required role questions.", 400);
    if (saved.kind === "conflict") return reply("Reload the form and try again.", 409);
    if (saved.kind === "retry") return reply("Your application is processing. Please try again in a moment.", 503);
    const delivered = await deliver(saved.reference, saved.email, saved.title);
    if (!delivered) return reply("Your application is processing. Please try again in a moment.", 503);
    return NextResponse.json({ ok: true, reference: saved.reference }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[careers/apply]", error);
    return reply("We couldn't complete your application. Please retry with the same form.", 503);
  }
}
