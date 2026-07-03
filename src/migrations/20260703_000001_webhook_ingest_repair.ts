import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_webhook_events_provider" AS ENUM('babylovegrowth', 'outrank');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_webhook_events_status" AS ENUM('created', 'updated', 'rejected', 'skipped', 'error');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "cms_posts" ADD COLUMN IF NOT EXISTS "external_hero_image_url" varchar;
    ALTER TABLE "cms_posts" ADD COLUMN IF NOT EXISTS "source_provider" varchar;
    ALTER TABLE "cms_posts" ADD COLUMN IF NOT EXISTS "source_external_id" varchar;
    ALTER TABLE "cms_posts" ADD COLUMN IF NOT EXISTS "source_public_url" varchar;
    ALTER TABLE "cms_posts" ADD COLUMN IF NOT EXISTS "source_provider_created_at" timestamp(3) with time zone;
    ALTER TABLE "cms_posts" ADD COLUMN IF NOT EXISTS "source_received_at" timestamp(3) with time zone;

    ALTER TABLE "_cms_posts_v" ADD COLUMN IF NOT EXISTS "version_external_hero_image_url" varchar;
    ALTER TABLE "_cms_posts_v" ADD COLUMN IF NOT EXISTS "version_source_provider" varchar;
    ALTER TABLE "_cms_posts_v" ADD COLUMN IF NOT EXISTS "version_source_external_id" varchar;
    ALTER TABLE "_cms_posts_v" ADD COLUMN IF NOT EXISTS "version_source_public_url" varchar;
    ALTER TABLE "_cms_posts_v" ADD COLUMN IF NOT EXISTS "version_source_provider_created_at" timestamp(3) with time zone;
    ALTER TABLE "_cms_posts_v" ADD COLUMN IF NOT EXISTS "version_source_received_at" timestamp(3) with time zone;

    CREATE TABLE IF NOT EXISTS "webhook_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "provider" "enum_webhook_events_provider" NOT NULL,
      "event_type" varchar,
      "external_id" varchar,
      "slug" varchar,
      "post_id" integer,
      "status" "enum_webhook_events_status" NOT NULL,
      "message" varchar,
      "payload" jsonb,
      "normalized" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_post_id_cms_posts_id_fk"
      FOREIGN KEY ("post_id") REFERENCES "public"."cms_posts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "webhook_events_post_idx" ON "webhook_events" USING btree ("post_id");
    CREATE INDEX IF NOT EXISTS "webhook_events_updated_at_idx" ON "webhook_events" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "webhook_events_created_at_idx" ON "webhook_events" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "webhook_events_provider_status_idx" ON "webhook_events" USING btree ("provider", "status");

    DELETE FROM "cms_posts"
    WHERE "title" IS NULL
      AND "slug" IS NULL
      AND COALESCE("excerpt", '') = ''
      AND "content" IS NULL;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "webhook_events" CASCADE;

    ALTER TABLE "_cms_posts_v" DROP COLUMN IF EXISTS "version_source_received_at";
    ALTER TABLE "_cms_posts_v" DROP COLUMN IF EXISTS "version_source_provider_created_at";
    ALTER TABLE "_cms_posts_v" DROP COLUMN IF EXISTS "version_source_public_url";
    ALTER TABLE "_cms_posts_v" DROP COLUMN IF EXISTS "version_source_external_id";
    ALTER TABLE "_cms_posts_v" DROP COLUMN IF EXISTS "version_source_provider";
    ALTER TABLE "_cms_posts_v" DROP COLUMN IF EXISTS "version_external_hero_image_url";

    ALTER TABLE "cms_posts" DROP COLUMN IF EXISTS "source_received_at";
    ALTER TABLE "cms_posts" DROP COLUMN IF EXISTS "source_provider_created_at";
    ALTER TABLE "cms_posts" DROP COLUMN IF EXISTS "source_public_url";
    ALTER TABLE "cms_posts" DROP COLUMN IF EXISTS "source_external_id";
    ALTER TABLE "cms_posts" DROP COLUMN IF EXISTS "source_provider";
    ALTER TABLE "cms_posts" DROP COLUMN IF EXISTS "external_hero_image_url";

    DROP TYPE IF EXISTS "public"."enum_webhook_events_status";
    DROP TYPE IF EXISTS "public"."enum_webhook_events_provider";
  `)
}
