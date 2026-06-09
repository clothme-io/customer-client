import pg from "pg";

const { Pool } = pg;

let pool;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
    });
  }

  return pool;
}

export async function query(sql, params = []) {
  const db = getPool();
  return db.query(sql, params);
}

export async function withTransaction(callback) {
  const db = getPool();
  const client = await db.connect();

  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export function dbUnavailableResponse(res) {
  return res.status(503).json({
    error: "Database not configured",
    message: "Set DATABASE_URL to connect Railway Postgres."
  });
}
