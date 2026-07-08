import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payload's document-locking query joins payload_locked_documents_rels against
 * every registered collection. webhook-events and waitlist-entries were added
 * after the baseline migration but their rel columns were never created, which
 * crashes the admin detail view with:
 *   column ... webhook_events_id does not exist
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "webhook_events_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "waitlist_entries_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_webhook_events_fk"
      FOREIGN KEY ("webhook_events_id") REFERENCES "public"."webhook_events"("id")
      ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_waitlist_entries_fk"
      FOREIGN KEY ("waitlist_entries_id") REFERENCES "public"."waitlist_entries"("id")
      ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_webhook_events_id_idx"
      ON "payload_locked_documents_rels" USING btree ("webhook_events_id");

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_waitlist_entries_id_idx"
      ON "payload_locked_documents_rels" USING btree ("waitlist_entries_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_waitlist_entries_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_webhook_events_id_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_waitlist_entries_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_webhook_events_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "waitlist_entries_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "webhook_events_id";
  `)
}
