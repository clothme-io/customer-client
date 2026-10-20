import pg from "pg";
import { randomBytes, createHash } from "node:crypto";
import { resolveDatabaseUrl } from "../../../src/lib/databaseUrl.js";
import type { Continuation } from "./continuation-contract";
let pool: pg.Pool;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function db() {
  return (pool ||= new pg.Pool({
    connectionString: resolveDatabaseUrl(),
    max: 3,
    connectionTimeoutMillis: 5000,
    statement_timeout: 5000,
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
  }));
}
export async function saveContinuation(owner: string, payload: Continuation) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      hash(owner),
    ]);
    await client.query(
      "DELETE FROM shopping_continuations WHERE expires_at < now()",
    );
    const count = await client.query(
      "SELECT count(*) FROM shopping_continuations WHERE owner_hash=$1 AND created_at > now()-interval '10 minutes'",
      [hash(owner)],
    );
    if (Number(count.rows[0].count) >= 10)
      throw new Error(
        "Please wait a few minutes before creating another mobile link.",
      );
    const token = randomBytes(32).toString("base64url");
    await client.query(
      "INSERT INTO shopping_continuations(token_hash,owner_hash,payload,expires_at) VALUES ($1,$2,$3,now()+interval '24 hours')",
      [hash(token), hash(owner), JSON.stringify(payload)],
    );
    await client.query("COMMIT");
    return token;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export async function getContinuation(
  token: string,
): Promise<Continuation | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const result = await db().query(
    "SELECT payload FROM shopping_continuations WHERE token_hash=$1 AND expires_at > now()",
    [hash(token)],
  );
  return result.rows[0]?.payload || null;
}
