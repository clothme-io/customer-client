import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
});

const retryableDatabaseCodes = new Set(["08000", "08001", "08003", "08004", "08006", "08007", "57P03"]);
const maxAttempts = Number.parseInt(process.env.MIGRATION_MAX_ATTEMPTS || "20", 10);
const retryDelayMs = Number.parseInt(process.env.MIGRATION_RETRY_DELAY_MS || "3000", 10);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function queryWithRetry(sql, label) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await pool.query(sql);
    } catch (error) {
      const canRetry = retryableDatabaseCodes.has(error.code) && attempt < maxAttempts;

      if (!canRetry) {
        throw error;
      }

      console.warn(
        `Database is not ready while applying ${label}. Retrying in ${retryDelayMs}ms (${attempt}/${maxAttempts}).`
      );
      await sleep(retryDelayMs);
    }
  }
}

const migrationsDir = path.join(rootDir, "db", "migrations");
const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

try {
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await queryWithRetry(sql, file);
    console.log(`Applied ${file}`);
  }
} finally {
  await pool.end();
}
