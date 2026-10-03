import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_download_requests (
      request_id uuid PRIMARY KEY,
      email_hash text NOT NULL,
      ip_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS app_download_requests_email_idx ON app_download_requests(email_hash, created_at);
    CREATE INDEX IF NOT EXISTS app_download_requests_ip_idx ON app_download_requests(ip_hash, created_at);
    CREATE INDEX IF NOT EXISTS app_download_requests_time_idx ON app_download_requests(created_at);
  `);
}
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS app_download_requests;`);
}
