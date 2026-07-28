#!/usr/bin/env node
/**
 * One-time: copy Payload CMS waitlist_entries → clothme_core.growth.request_access.
 *
 * Requires:
 *   CMS_DATABASE_URL  — clothme_web_cms (source)
 *   CORE_DATABASE_URL — clothme_core (destination), with V20 source column applied
 *
 * Usage:
 *   CMS_DATABASE_URL=... CORE_DATABASE_URL=... node scripts/migrate-waitlist-to-core.mjs
 *
 * Idempotent: skips emails that already exist in growth.request_access.
 */
import pg from "pg";

const cmsUrl = process.env.CMS_DATABASE_URL || process.env.DATABASE_URL;
const coreUrl = process.env.CORE_DATABASE_URL;

if (!cmsUrl || !coreUrl) {
  console.error("Set CMS_DATABASE_URL (or DATABASE_URL) and CORE_DATABASE_URL");
  process.exit(1);
}

const cms = new pg.Client({ connectionString: cmsUrl, ssl: cmsUrl.includes("localhost") ? false : { rejectUnauthorized: false } });
const core = new pg.Client({ connectionString: coreUrl, ssl: coreUrl.includes("localhost") ? false : { rejectUnauthorized: false } });

await cms.connect();
await core.connect();

try {
  const { rows } = await cms.query(`
    SELECT email, state, source, created_at, updated_at
    FROM waitlist_entries
    ORDER BY id ASC
  `);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = String(row.email || "").trim().toLowerCase();
    if (!email) continue;

    const existing = await core.query(
      `SELECT id FROM growth.request_access WHERE email = $1`,
      [email]
    );
    if (existing.rows.length > 0) {
      skipped += 1;
      continue;
    }

    await core.query(
      `INSERT INTO growth.request_access
         (email, state_province, source, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'pending', COALESCE($4, now()), COALESCE($5, now()))`,
      [
        email,
        row.state || null,
        row.source || null,
        row.created_at || null,
        row.updated_at || null
      ]
    );
    inserted += 1;
  }

  console.log(`Done. inserted=${inserted} skipped_existing=${skipped} source_rows=${rows.length}`);
} finally {
  await cms.end();
  await core.end();
}
