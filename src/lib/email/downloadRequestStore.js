import pg from 'pg';
import { createHmac } from 'node:crypto';
import { resolveDatabaseUrl } from '../databaseUrl.js';
let pool;
export async function claimDownloadRequest({ requestId, email, ip }) {
  pool ||= new pg.Pool({ connectionString: resolveDatabaseUrl(), max: 3,
    connectionTimeoutMillis: 5000, statement_timeout: 5000,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } });
  const hash = value => createHmac('sha256', process.env.RESEND_API_KEY).update(value).digest('hex');
  const emailHash = hash(email), ipHash = hash(ip);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize claims across all web replicas, including concurrent retries.
    for (const key of [`email:${emailHash}`, `ip:${ipHash}`, `request:${requestId}`].sort())
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
    await client.query("DELETE FROM app_download_requests WHERE created_at < now() - interval '25 hours'");
    const existing = await client.query('SELECT email_hash, created_at > now() - interval \'23 hours\' AS retryable FROM app_download_requests WHERE request_id=$1', [requestId]);
    if (existing.rows.length) {
      if (existing.rows[0].email_hash !== emailHash || !existing.rows[0].retryable) throw new Error('REQUEST_CONFLICT');
    } else {
      const counts = await client.query(`SELECT
        count(*) FILTER (WHERE ip_hash=$2) AS ip_count,
        count(*) FILTER (WHERE email_hash=$1) AS email_count,
        count(*) FILTER (WHERE email_hash=$1 AND created_at > now()-interval '60 seconds') AS recent
        FROM app_download_requests WHERE created_at > now()-interval '10 minutes' AND (email_hash=$1 OR ip_hash=$2)`, [emailHash, ipHash]);
      const c = counts.rows[0];
      if (+c.ip_count >= 8 || +c.email_count >= 3 || +c.recent > 0) throw new Error('RATE_LIMITED');
      await client.query('INSERT INTO app_download_requests(request_id,email_hash,ip_hash) VALUES ($1,$2,$3)', [requestId,emailHash,ipHash]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function closeDownloadRequestStore() {
  if (pool) { await pool.end(); pool = undefined; }
}
