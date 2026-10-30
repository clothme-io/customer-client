import { getPayload } from "payload";
import config from "@payload-config";
import { careerPool } from "./careersDb.js";

export async function careerAdminIdentity(request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  const bootstrapAdmins = (process.env.RECRUITING_ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase());
  if (bootstrapAdmins.includes(email)) return { email, role: "admin" };
  const result = await careerPool().query("SELECT role FROM career_staff_roles WHERE email=$1", [email]);
  return result.rows[0] ? { email, role: result.rows[0].role } : null;
}

export async function careerAudit(actor, action, jobId = null, applicationId = null, detail = {}, client = careerPool()) {
  await client.query("INSERT INTO career_audit (actor, action, job_id, application_id, detail) VALUES ($1,$2,$3,$4,$5)", [actor, action, jobId, applicationId, JSON.stringify(detail)]);
}

export async function careerMutation(action) {
  const client = await careerPool().connect();
  try {
    await client.query("BEGIN");
    const value = await action(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { client.release(); }
}
