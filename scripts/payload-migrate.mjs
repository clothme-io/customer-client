/**
 * Idempotent Payload CMS schema sync — runs on every deploy, never prompts.
 *
 * - Tables already exist (previous deploy): marks migrations as applied and exits.
 * - Fresh database (first deploy to prod): runs `payload migrate` to create tables.
 */
import pg from "pg";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

async function tableExists(client, name) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     )`,
    [name]
  );
  return res.rows[0].exists;
}

async function getMigrationFiles() {
  const dir = path.join(__dirname, "../src/migrations");
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => f.endsWith(".ts") && f !== "index.ts")
      .map((f) => f.replace(".ts", ""))
      .sort();
  } catch {
    return [];
  }
}

async function main() {
  const client = await pool.connect();
  try {
    const tablesExist =
      (await tableExists(client, "cms_posts")) ||
      (await tableExists(client, "media")) ||
      (await tableExists(client, "locations"));

    if (tablesExist) {
      // Tables are already in the DB — just make sure migrations are recorded
      // so `payload migrate` never tries to re-create them.
      await client.query(`
        CREATE TABLE IF NOT EXISTS payload_migrations (
          id serial PRIMARY KEY,
          name varchar NOT NULL,
          batch integer,
          created_at timestamp with time zone DEFAULT now() NOT NULL,
          updated_at timestamp with time zone DEFAULT now() NOT NULL
        )
      `);

      const files = await getMigrationFiles();
      for (const name of files) {
        await client.query(
          `INSERT INTO payload_migrations (name, batch)
           SELECT $1, 1 WHERE NOT EXISTS (
             SELECT 1 FROM payload_migrations WHERE name = $1
           )`,
          [name]
        );
      }
      console.log("Payload schema already exists — migrations recorded, nothing to run.");
    } else {
      // Fresh database — run migrations to create all tables.
      console.log("Fresh database — running Payload migrations...");
      const result = spawnSync("sh", ["-c", "echo 'y' | npx payload migrate"], {
        stdio: "inherit",
        env: process.env,
      });
      if (result.status !== 0) {
        throw new Error(`payload migrate failed with exit code ${result.status}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Payload schema sync failed:", err.message);
  process.exit(1);
});
