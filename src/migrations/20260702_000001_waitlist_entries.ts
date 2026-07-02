import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "waitlist_entries" (
      "id" serial PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL,
      "source" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_entries_email_idx" ON "waitlist_entries" USING btree ("email");
    CREATE INDEX IF NOT EXISTS "waitlist_entries_updated_at_idx" ON "waitlist_entries" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "waitlist_entries_created_at_idx" ON "waitlist_entries" USING btree ("created_at");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "waitlist_entries" CASCADE;
  `)
}
