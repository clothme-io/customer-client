/**
 * Idempotent Payload CMS schema sync — runs on every deploy, never prompts.
 *
 * - Tables already exist (previous deploy): marks only the baseline migration as applied,
 *   then lets Payload run any newer pending migrations.
 * - Fresh database (first deploy to prod): runs all Payload migrations.
 *
 * Retries DB connections while Postgres wakes (Railway pre-deploy).
 */
import pg from "pg";
import { spawnSync } from "node:child_process";

const { Pool } = pg;
const BASELINE_MIGRATIONS = ["20260626_183444"];

const retryableDatabaseCodes = new Set([
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "08007",
  "57P03",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
]);
const maxAttempts = Number.parseInt(process.env.MIGRATION_MAX_ATTEMPTS || "20", 10);
const retryDelayMs = Number.parseInt(process.env.MIGRATION_RETRY_DELAY_MS || "3000", 10);
const payloadMigrateMaxAttempts = Number.parseInt(process.env.PAYLOAD_MIGRATE_MAX_ATTEMPTS || "5", 10);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableError(error) {
  return retryableDatabaseCodes.has(error?.code);
}

async function withRetry(label, fn, attempts = maxAttempts) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const canRetry = isRetryableError(error) && attempt < attempts;
      if (!canRetry) {
        throw error;
      }
      console.warn(
        `Database is not ready while ${label}. Retrying in ${retryDelayMs}ms (${attempt}/${attempts}).`
      );
      await sleep(retryDelayMs);
    }
  }
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
}

async function tableExists(client, name) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1::text
     )`,
    [name]
  );
  return res.rows[0].exists;
}

async function runBaselineSetupOnce(pool) {
  const client = await pool.connect();
  try {
    const tablesExist =
      (await tableExists(client, "cms_posts")) ||
      (await tableExists(client, "media")) ||
      (await tableExists(client, "locations"));

    if (tablesExist) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS payload_migrations (
          id serial PRIMARY KEY,
          name varchar NOT NULL,
          batch integer,
          created_at timestamp with time zone DEFAULT now() NOT NULL,
          updated_at timestamp with time zone DEFAULT now() NOT NULL
        )
      `);

      for (const name of BASELINE_MIGRATIONS) {
        await client.query(
          `INSERT INTO payload_migrations (name, batch)
           SELECT $1::varchar, 1 WHERE NOT EXISTS (
             SELECT 1 FROM payload_migrations WHERE name = $1::varchar
           )`,
          [name]
        );
      }
      console.log("Payload schema already exists — baseline migration recorded.");
    } else {
      console.log("Fresh database — running all Payload migrations...");
    }
  } finally {
    client.release();
  }
}

async function runBaselineSetup(pool) {
  await withRetry("running baseline setup", () => runBaselineSetupOnce(pool));
}

async function runPayloadMigrate() {
  for (let attempt = 1; attempt <= payloadMigrateMaxAttempts; attempt += 1) {
    const result = spawnSync("sh", ["-c", "echo 'y' | npx payload migrate"], {
      stdio: "inherit",
      env: process.env,
    });

    if (result.status === 0) {
      return;
    }

    if (attempt < payloadMigrateMaxAttempts) {
      console.warn(
        `payload migrate failed with exit code ${result.status}. Retrying in ${retryDelayMs}ms (${attempt}/${payloadMigrateMaxAttempts}).`
      );
      await sleep(retryDelayMs);
      continue;
    }

    throw new Error(`payload migrate failed with exit code ${result.status}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run cms:sync");
  }

  const pool = createPool();
  try {
    await runBaselineSetup(pool);
  } finally {
    await pool.end();
  }

  await runPayloadMigrate();
}

main().catch((err) => {
  console.error("Payload schema sync failed:", err.message);
  process.exit(1);
});
