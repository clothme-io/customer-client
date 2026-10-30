import { createHash, createHmac, randomUUID } from "node:crypto";
import { careerPool } from "./careersDb.js";

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const MIME = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function validateResume(filename, buffer) {
  const ext = String(filename || "").toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (!ext || !MIME[ext] || !buffer?.length || buffer.length > MAX_RESUME_BYTES) return null;
  if (ext === "pdf" && buffer.subarray(0, 5).toString() === "%PDF-") return MIME.pdf;
  if (ext === "doc" && buffer.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex"))) return MIME.doc;
  if (ext === "docx" && buffer.subarray(0, 4).equals(Buffer.from("504b0304", "hex")) && buffer.includes(Buffer.from("[Content_Types].xml")) && buffer.includes(Buffer.from("word/document.xml")) && buffer.includes(Buffer.from("504b0506", "hex"))) return MIME.docx;
  return null;
}

export function cleanText(value, limit, required = false) {
  const text = String(value || "").trim();
  if ((required && !text) || text.length > limit || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) return null;
  return text;
}

export function cleanUrl(value) {
  const text = cleanText(value, 500);
  if (text === null) return null;
  if (!text) return "";
  try { const url = new URL(text); return url.protocol === "https:" ? url.href : null; }
  catch { return null; }
}

function rateKey(value) {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("Rate limit secret is not configured");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function saveApplication({ jobSlug, requestId, fields, answers, resume, filename, mime, ip }) {
  const client = await careerPool().connect();
  try {
    await client.query("BEGIN");
    const job = await client.query("SELECT id, slug, title, status, content_approved, screening_questions FROM career_jobs WHERE slug=$1 FOR SHARE", [jobSlug]);
    const existing = await client.query("SELECT id, reference, email, job_id FROM career_applications WHERE request_id=$1", [requestId]);
    if (existing.rows[0]) {
      await client.query("COMMIT");
      return existing.rows[0].email === fields.email && existing.rows[0].job_id === job.rows[0]?.id
        ? { kind: "saved", ...existing.rows[0], title: job.rows[0].title }
        : { kind: "conflict" };
    }
    if (!job.rows[0] || job.rows[0].status !== "open" || !job.rows[0].content_approved) {
      await client.query("ROLLBACK"); return { kind: "closed" };
    }
    const questions = Array.isArray(job.rows[0].screening_questions) ? job.rows[0].screening_questions : [];
    for (const question of questions) {
      if (!/^[a-z0-9_-]{1,60}$/.test(question.id || "") || (question.required && !cleanText(answers[question.id], 3000, true))) {
        await client.query("ROLLBACK"); return { kind: "invalidQuestions" };
      }
    }
    const windowStart = new Date(Math.floor(Date.now() / 3600000) * 3600000);
    for (const key of [rateKey(`email:${fields.email}`), rateKey(`ip:${ip}`)]) {
      const hit = await client.query(`INSERT INTO career_rate_limits (key_hash, window_start, hits) VALUES ($1,$2,1)
        ON CONFLICT (key_hash, window_start) DO UPDATE SET hits=career_rate_limits.hits+1 RETURNING hits`, [key, windowStart]);
      if (hit.rows[0].hits > 4) { await client.query("ROLLBACK"); return { kind: "limited" }; }
    }
    const id = randomUUID();
    const reference = `CM-${new Date().getUTCFullYear()}-${id.slice(0, 8).toUpperCase()}`;
    await client.query(`INSERT INTO career_applications
      (id, request_id, reference, job_id, first_name, last_name, email, phone, location, linkedin_url, portfolio_url, github_url, motivation, cover_letter, additional_info, screening_answers, resume_filename, resume_mime, resume_bytes, resume_sha256)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [id, requestId, reference, job.rows[0].id, fields.firstName, fields.lastName, fields.email, fields.phone, fields.location, fields.linkedIn || null, fields.portfolio || null, fields.github || null, fields.motivation, fields.coverLetter || null, fields.additionalInfo || null, JSON.stringify(answers), filename, mime, resume, createHash("sha256").update(resume).digest("hex")]);
    await client.query("INSERT INTO career_audit (actor, action, job_id, application_id) VALUES ($1,'application.submitted',$2,$3)", [rateKey(`email:${fields.email}`), job.rows[0].id, id]);
    await client.query("COMMIT");
    return { kind: "saved", id, reference, email: fields.email, title: job.rows[0].title };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error.code === "23505") return { kind: "retry" };
    throw error;
  } finally { client.release(); }
}

