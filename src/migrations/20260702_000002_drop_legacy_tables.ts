import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "post_tags" CASCADE;
    DROP TABLE IF EXISTS "post_faqs" CASCADE;
    DROP TABLE IF EXISTS "post_sections" CASCADE;
    DROP TABLE IF EXISTS "posts" CASCADE;
    DROP TABLE IF EXISTS "waitlist_signups" CASCADE;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS "posts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "slug" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "excerpt" text NOT NULL DEFAULT '',
      "category" text NOT NULL DEFAULT '',
      "status" text NOT NULL DEFAULT 'draft',
      "hero_image_url" text NOT NULL DEFAULT '',
      "hero_image_alt" text NOT NULL DEFAULT '',
      "author" text NOT NULL DEFAULT 'ClothME Team',
      "published_at" timestamptz,
      "scheduled_for" timestamptz,
      "reading_time" text NOT NULL DEFAULT '',
      "ai_summary" text NOT NULL DEFAULT '',
      "seo_title" text NOT NULL DEFAULT '',
      "seo_description" text NOT NULL DEFAULT '',
      "preview_token" text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
      "created_by" text NOT NULL DEFAULT '',
      "updated_by" text NOT NULL DEFAULT '',
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "posts_status_check" CHECK ("status" in ('draft', 'scheduled', 'published', 'archived'))
    );

    CREATE TABLE IF NOT EXISTS "post_sections" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
      "sort_order" integer NOT NULL DEFAULT 0,
      "heading" text NOT NULL DEFAULT '',
      "body" text NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS "post_faqs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
      "sort_order" integer NOT NULL DEFAULT 0,
      "question" text NOT NULL DEFAULT '',
      "answer" text NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS "post_tags" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
      "tag" text NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS "waitlist_signups" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" text NOT NULL UNIQUE,
      "source" text NOT NULL DEFAULT '',
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts"("status");
    CREATE INDEX IF NOT EXISTS "posts_scheduled_for_idx" ON "posts"("scheduled_for");
    CREATE INDEX IF NOT EXISTS "posts_preview_token_idx" ON "posts"("preview_token");
    CREATE INDEX IF NOT EXISTS "post_sections_post_id_idx" ON "post_sections"("post_id");
    CREATE INDEX IF NOT EXISTS "post_faqs_post_id_idx" ON "post_faqs"("post_id");
    CREATE INDEX IF NOT EXISTS "post_tags_post_id_idx" ON "post_tags"("post_id");
  `)
}
