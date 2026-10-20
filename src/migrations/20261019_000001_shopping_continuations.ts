import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS shopping_continuations (
    token_hash text PRIMARY KEY, owner_hash text NOT NULL, payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
  );
  CREATE INDEX IF NOT EXISTS shopping_continuations_owner ON shopping_continuations(owner_hash, created_at);
  CREATE INDEX IF NOT EXISTS shopping_continuations_expiry ON shopping_continuations(expires_at);`);
}
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS shopping_continuations;`);
}
