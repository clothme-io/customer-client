import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { careerPool } from "../../../../src/lib/careersDb.js";
import { careerAdminIdentity, careerAudit, careerMutation } from "../../../../src/lib/careerAdmin.js";
import { careerDepartments } from "../../../../src/data/careers.js";

export const runtime = "nodejs";
const respond = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const applicationStatuses = new Set(["new", "under_review", "interview", "offer", "hired", "rejected", "withdrawn"]);
const jobStatuses = new Set(["draft", "open", "closed"]);
const allowedDepartments = new Set(careerDepartments.map((department) => department.name));
const columns = {
  title: "title", slug: "slug", department: "department", location: "location", employmentType: "employment_type",
  workArrangement: "work_arrangement", relocationEligible: "relocation_eligible", summary: "summary", aboutRole: "about_role", contentSource: "content_source", contentSourceComplete: "content_source_complete",
  responsibilities: "responsibilities", requirements: "requirements", preferred: "preferred", technologyStack: "technology_stack",
  successOutcomes: "success_outcomes", benefitCodes: "benefit_codes", screeningQuestions: "screening_questions",
  status: "status", contentApproved: "content_approved",
};
const arrays = new Set(["responsibilities", "requirements", "preferred", "technologyStack", "successOutcomes", "benefitCodes", "screeningQuestions"]);

function validateJob(data) {
  if (!data || typeof data !== "object") return null;
  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (!columns[key]) continue;
    if (arrays.has(key)) {
      if (!Array.isArray(value) || value.length > 120 || JSON.stringify(value).length > 30000) return null;
      clean[key] = value;
    } else if (key === "relocationEligible" || key === "contentApproved" || key === "contentSourceComplete") {
      if (typeof value !== "boolean") return null;
      clean[key] = value;
    } else {
      if (typeof value !== "string" || value.length > (key === "contentSource" ? 50000 : key === "aboutRole" ? 10000 : key === "summary" ? 800 : 180)) return null;
      clean[key] = value.trim();
    }
  }
  if (clean.slug && !/^[a-z0-9-]{3,120}$/.test(clean.slug)) return null;
  if (clean.department && !allowedDepartments.has(clean.department)) return null;
  if (clean.status && !jobStatuses.has(clean.status)) return null;
  if (clean.screeningQuestions && clean.screeningQuestions.some((question) => !/^[a-z0-9_-]{1,60}$/.test(question?.id || "") || typeof question?.label !== "string" || question.label.length > 300 || typeof question?.required !== "boolean")) return null;
  for (const key of ["responsibilities", "requirements", "preferred", "technologyStack", "successOutcomes", "benefitCodes"]) {
    if (clean[key] && clean[key].some((item) => typeof item !== "string" || item.length > 1000)) return null;
  }
  return clean;
}

export async function GET(request) {
  try {
    const identity = await careerAdminIdentity(request);
    if (!identity) return respond({ message: "Unauthorized" }, 403);
    const url = new URL(request.url);
    const resource = url.searchParams.get("resource") || "jobs";
    if (resource === "jobs") {
      const result = await careerPool().query("SELECT id, slug, title, department, location, employment_type AS \"employmentType\", work_arrangement AS \"workArrangement\", relocation_eligible AS \"relocationEligible\", summary, about_role AS \"aboutRole\", content_source AS \"contentSource\", content_source_complete AS \"contentSourceComplete\", responsibilities, requirements, preferred, technology_stack AS \"technologyStack\", success_outcomes AS \"successOutcomes\", benefit_codes AS \"benefitCodes\", screening_questions AS \"screeningQuestions\", status, content_approved AS \"contentApproved\", opened_at AS \"openedAt\", updated_at AS \"updatedAt\" FROM career_jobs ORDER BY updated_at DESC");
      return respond({ role: identity.role, jobs: result.rows });
    }
    if (resource === "applications") {
      const status = url.searchParams.get("status") || "";
      const jobId = url.searchParams.get("jobId") || "";
      const search = (url.searchParams.get("search") || "").trim().slice(0, 100);
      const result = await careerPool().query(`SELECT a.id, a.reference, a.job_id AS "jobId", j.title AS "jobTitle", a.first_name AS "firstName", a.last_name AS "lastName", a.email, a.phone, a.location, a.linkedin_url AS "linkedIn", a.portfolio_url AS "portfolio", a.github_url AS "github", a.motivation, a.cover_letter AS "coverLetter", a.additional_info AS "additionalInfo", a.screening_answers AS "screeningAnswers", a.resume_filename AS "resumeFilename", a.status, a.submitted_at AS "submittedAt", a.recruiting_notified_at AS "recruitingNotifiedAt", a.applicant_notified_at AS "applicantNotifiedAt"
        FROM career_applications a JOIN career_jobs j ON j.id=a.job_id WHERE ($1='' OR a.status=$1) AND ($2='' OR a.job_id::text=$2) AND ($3='' OR a.email ILIKE '%'||$3||'%' OR a.first_name ILIKE '%'||$3||'%' OR a.last_name ILIKE '%'||$3||'%' OR a.reference ILIKE '%'||$3||'%') ORDER BY a.submitted_at DESC LIMIT 100`, [status, jobId, search]);
      return respond({ role: identity.role, applications: result.rows });
    }
    if (resource === "staff" && identity.role === "admin") {
      const result = await careerPool().query("SELECT email, role, updated_at AS \"updatedAt\" FROM career_staff_roles ORDER BY email");
      return respond({ role: identity.role, staff: result.rows });
    }
    return respond({ message: "Unknown resource" }, 404);
  } catch (error) { console.error("[careers/admin/get]", error); return respond({ message: "Admin data unavailable" }, 503); }
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== new URL(request.url).host) return respond({ message: "Invalid request origin" }, 403); }
    catch { return respond({ message: "Invalid request origin" }, 403); }
  }
  try {
    const identity = await careerAdminIdentity(request);
    if (!identity) return respond({ message: "Unauthorized" }, 403);
    const body = await request.json();
    if (body.action === "createJob") {
      if (identity.role !== "admin") return respond({ message: "Only recruiting admins can manage jobs." }, 403);
      const data = validateJob(body.job);
      if (!data?.slug || !data?.title || !data?.department) return respond({ message: "Title, slug, and department are required." }, 400);
      const id = randomUUID();
      const result = await careerMutation(async (client) => {
        const created = await client.query("INSERT INTO career_jobs (id, slug, title, department, location) VALUES ($1,$2,$3,$4,$5) RETURNING id", [id, data.slug, data.title, data.department, data.location || "Austin, TX, USA"]);
        await careerAudit(identity.email, "job.created", id, null, {}, client);
        return created;
      });
      return respond({ id: result.rows[0].id }, 201);
    }
    if (body.action === "saveJob") {
      if (identity.role !== "admin") return respond({ message: "Only recruiting admins can manage jobs." }, 403);
      if (!/^[0-9a-f-]{36}$/i.test(body.id || "")) return respond({ message: "Invalid job" }, 400);
      const data = validateJob(body.job);
      if (!data || !Object.keys(data).length) return respond({ message: "No valid changes" }, 400);
      const pairs = Object.entries(data);
      const sets = pairs.map(([key], index) => `${columns[key]}=$${index + 2}`).join(", ");
      const values = pairs.map(([key, value]) => arrays.has(key) ? JSON.stringify(value) : value);
      const result = await careerMutation(async (client) => {
        const updated = await client.query(`UPDATE career_jobs SET ${sets}, opened_at=CASE WHEN $${pairs.length + 2}='open' AND status<>'open' THEN now() ELSE opened_at END, updated_at=now() WHERE id=$1 RETURNING id, status`, [body.id, ...values, data.status || ""]);
        if (updated.rowCount) await careerAudit(identity.email, "job.updated", body.id, null, { fields: pairs.map(([key]) => key), status: updated.rows[0].status }, client);
        return updated;
      });
      if (!result.rowCount) return respond({ message: "Job not found" }, 404);
      return respond({ ok: true });
    }
    if (body.action === "applicationStatus") {
      if (!/^[0-9a-f-]{36}$/i.test(body.id || "") || !applicationStatuses.has(body.status)) return respond({ message: "Invalid status" }, 400);
      const result = await careerMutation(async (client) => {
        const updated = await client.query("UPDATE career_applications SET status=$2, updated_at=now() WHERE id=$1 RETURNING job_id", [body.id, body.status]);
        if (updated.rowCount) await careerAudit(identity.email, "application.status_updated", updated.rows[0].job_id, body.id, { status: body.status }, client);
        return updated;
      });
      if (!result.rowCount) return respond({ message: "Application not found" }, 404);
      return respond({ ok: true });
    }
    if (body.action === "staffRole" && identity.role === "admin") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "recruiter", "remove"].includes(body.role)) return respond({ message: "Invalid staff role" }, 400);
      await careerMutation(async (client) => {
        if (body.role === "remove") await client.query("DELETE FROM career_staff_roles WHERE email=$1", [email]);
        else await client.query("INSERT INTO career_staff_roles (email, role) VALUES ($1,$2) ON CONFLICT (email) DO UPDATE SET role=$2, updated_at=now()", [email, body.role]);
        await careerAudit(identity.email, "staff.role_updated", null, null, { email, role: body.role }, client);
      });
      return respond({ ok: true });
    }
    return respond({ message: "Unknown action" }, 400);
  } catch (error) {
    if (error.code === "23505" || error.code === "23514" || error.code === "22P02") return respond({ message: "Check the job details. Open roles require approved, complete content." }, 400);
    console.error("[careers/admin/post]", error);
    return respond({ message: "Could not save changes" }, 503);
  }
}
