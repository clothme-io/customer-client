import { Pool } from "pg";
import { resolveDatabaseUrl } from "./databaseUrl.js";
import { withoutHowToApply } from "./careersContent.js";

let pool;
export function careerPool() {
  if (!pool) {
    const connectionString = resolveDatabaseUrl();
    if (!connectionString) throw new Error("Careers database is not configured");
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === "false"
        ? false
        : process.env.DATABASE_CA_CERT
          ? { ca: process.env.DATABASE_CA_CERT }
          : true,
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

const publicListFields = `id, slug, title, department, status, location, employment_type AS "employmentType",
  work_arrangement AS "workArrangement", summary, opened_at AS "openedAt", updated_at AS "updatedAt"`;

const publicFields = `id, slug, title, department, status, location, employment_type AS "employmentType",
  work_arrangement AS "workArrangement", relocation_eligible AS "relocationEligible",
  summary, about_role AS "aboutRole", content_source AS "contentSource", responsibilities, requirements, preferred,
  technology_stack AS "technologyStack", success_outcomes AS "successOutcomes",
  benefit_codes AS "benefitCodes", screening_questions AS "screeningQuestions",
  opened_at AS "openedAt", updated_at AS "updatedAt"`;

export async function getOpenJobs() {
  const result = await careerPool().query(
    `SELECT ${publicListFields} FROM career_jobs WHERE status='open' AND content_approved=true ORDER BY opened_at DESC NULLS LAST, title ASC`,
  );
  return result.rows;
}

export async function getOpenJob(slug) {
  const result = await careerPool().query(
    `SELECT ${publicFields} FROM career_jobs WHERE slug=$1 AND status='open' AND content_approved=true LIMIT 1`,
    [slug],
  );
  const job = result.rows[0];
  return job ? { ...job, contentSource: withoutHowToApply(job.contentSource) } : null;
}

export function jsonJob(job) {
  return JSON.parse(JSON.stringify(job));
}
