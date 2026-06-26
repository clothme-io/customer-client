import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_locations_status" AS ENUM('draft', 'published', 'unpublished');
  CREATE TYPE "public"."enum_locations_hero_primary_cta" AS ENUM('app-store', 'waitlist');
  CREATE TYPE "public"."enum_cms_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_cms_posts_category" AS ENUM('fit-guide', 'family-shopping', 'personal-style', 'location-guide');
  CREATE TYPE "public"."enum__cms_posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cms_posts_v_version_category" AS ENUM('fit-guide', 'family-shopping', 'personal-style', 'location-guide');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TABLE "cms_users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "cms_users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "locations_pain_points_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "locations_benefits_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "locations_local_shopping_boutiques" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"neighborhood" varchar,
  	"description" varchar NOT NULL,
  	"website_url" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "locations_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"region" varchar,
  	"country" varchar DEFAULT 'Canada',
  	"status" "enum_locations_status" DEFAULT 'draft' NOT NULL,
  	"ai_generation_boutiques_context" varchar,
  	"ai_generation_article_topics" varchar,
  	"ai_generation_last_generated_at" timestamp(3) with time zone,
  	"hero_headline" varchar,
  	"hero_subheadline" varchar,
  	"hero_primary_cta" "enum_locations_hero_primary_cta" DEFAULT 'app-store',
  	"pain_points_headline" varchar DEFAULT 'Sound familiar?',
  	"benefits_headline" varchar,
  	"local_shopping_headline" varchar,
  	"local_shopping_intro" varchar,
  	"faq_headline" varchar DEFAULT 'Frequently Asked Questions',
  	"about_page_headline" varchar,
  	"about_page_body" jsonb,
  	"contact_page_headline" varchar DEFAULT 'Get in touch',
  	"contact_page_subheadline" varchar,
  	"seo_home_meta_title" varchar,
  	"seo_home_meta_description" varchar,
  	"seo_home_og_image_id" integer,
  	"seo_about_meta_title" varchar,
  	"seo_about_meta_description" varchar,
  	"seo_blog_meta_title" varchar,
  	"seo_blog_meta_description" varchar,
  	"seo_contact_meta_title" varchar,
  	"seo_contact_meta_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms_posts_seo_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar
  );
  
  CREATE TABLE "cms_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"status" "enum_cms_posts_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"location_id" integer,
  	"category" "enum_cms_posts_category",
  	"hero_image_id" integer,
  	"content" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_canonical_url" varchar,
  	"seo_og_image_id" integer,
  	"ai_summary" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_cms_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_cms_posts_v_version_seo_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cms_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_status" "enum__cms_posts_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_location_id" integer,
  	"version_category" "enum__cms_posts_v_version_category",
  	"version_hero_image_id" integer,
  	"version_content" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_canonical_url" varchar,
  	"version_seo_og_image_id" integer,
  	"version_ai_summary" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__cms_posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cms_users_id" integer,
  	"media_id" integer,
  	"locations_id" integer,
  	"cms_posts_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cms_users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "cms_users_sessions" ADD CONSTRAINT "cms_users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cms_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_pain_points_items" ADD CONSTRAINT "locations_pain_points_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_benefits_items" ADD CONSTRAINT "locations_benefits_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_local_shopping_boutiques" ADD CONSTRAINT "locations_local_shopping_boutiques_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_local_shopping_boutiques" ADD CONSTRAINT "locations_local_shopping_boutiques_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_faq_items" ADD CONSTRAINT "locations_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations" ADD CONSTRAINT "locations_seo_home_og_image_id_media_id_fk" FOREIGN KEY ("seo_home_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms_posts_seo_keywords" ADD CONSTRAINT "cms_posts_seo_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cms_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms_posts" ADD CONSTRAINT "cms_posts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms_posts" ADD CONSTRAINT "cms_posts_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms_posts" ADD CONSTRAINT "cms_posts_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cms_posts_v_version_seo_keywords" ADD CONSTRAINT "_cms_posts_v_version_seo_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cms_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cms_posts_v" ADD CONSTRAINT "_cms_posts_v_parent_id_cms_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cms_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cms_posts_v" ADD CONSTRAINT "_cms_posts_v_version_location_id_locations_id_fk" FOREIGN KEY ("version_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cms_posts_v" ADD CONSTRAINT "_cms_posts_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cms_posts_v" ADD CONSTRAINT "_cms_posts_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_users_fk" FOREIGN KEY ("cms_users_id") REFERENCES "public"."cms_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_posts_fk" FOREIGN KEY ("cms_posts_id") REFERENCES "public"."cms_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_cms_users_fk" FOREIGN KEY ("cms_users_id") REFERENCES "public"."cms_users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cms_users_sessions_order_idx" ON "cms_users_sessions" USING btree ("_order");
  CREATE INDEX "cms_users_sessions_parent_id_idx" ON "cms_users_sessions" USING btree ("_parent_id");
  CREATE INDEX "cms_users_updated_at_idx" ON "cms_users" USING btree ("updated_at");
  CREATE INDEX "cms_users_created_at_idx" ON "cms_users" USING btree ("created_at");
  CREATE UNIQUE INDEX "cms_users_email_idx" ON "cms_users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "locations_pain_points_items_order_idx" ON "locations_pain_points_items" USING btree ("_order");
  CREATE INDEX "locations_pain_points_items_parent_id_idx" ON "locations_pain_points_items" USING btree ("_parent_id");
  CREATE INDEX "locations_benefits_items_order_idx" ON "locations_benefits_items" USING btree ("_order");
  CREATE INDEX "locations_benefits_items_parent_id_idx" ON "locations_benefits_items" USING btree ("_parent_id");
  CREATE INDEX "locations_local_shopping_boutiques_order_idx" ON "locations_local_shopping_boutiques" USING btree ("_order");
  CREATE INDEX "locations_local_shopping_boutiques_parent_id_idx" ON "locations_local_shopping_boutiques" USING btree ("_parent_id");
  CREATE INDEX "locations_local_shopping_boutiques_image_idx" ON "locations_local_shopping_boutiques" USING btree ("image_id");
  CREATE INDEX "locations_faq_items_order_idx" ON "locations_faq_items" USING btree ("_order");
  CREATE INDEX "locations_faq_items_parent_id_idx" ON "locations_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");
  CREATE INDEX "locations_seo_home_seo_home_og_image_idx" ON "locations" USING btree ("seo_home_og_image_id");
  CREATE INDEX "locations_updated_at_idx" ON "locations" USING btree ("updated_at");
  CREATE INDEX "locations_created_at_idx" ON "locations" USING btree ("created_at");
  CREATE INDEX "cms_posts_seo_keywords_order_idx" ON "cms_posts_seo_keywords" USING btree ("_order");
  CREATE INDEX "cms_posts_seo_keywords_parent_id_idx" ON "cms_posts_seo_keywords" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "cms_posts_slug_idx" ON "cms_posts" USING btree ("slug");
  CREATE INDEX "cms_posts_location_idx" ON "cms_posts" USING btree ("location_id");
  CREATE INDEX "cms_posts_hero_image_idx" ON "cms_posts" USING btree ("hero_image_id");
  CREATE INDEX "cms_posts_seo_seo_og_image_idx" ON "cms_posts" USING btree ("seo_og_image_id");
  CREATE INDEX "cms_posts_updated_at_idx" ON "cms_posts" USING btree ("updated_at");
  CREATE INDEX "cms_posts_created_at_idx" ON "cms_posts" USING btree ("created_at");
  CREATE INDEX "cms_posts__status_idx" ON "cms_posts" USING btree ("_status");
  CREATE INDEX "_cms_posts_v_version_seo_keywords_order_idx" ON "_cms_posts_v_version_seo_keywords" USING btree ("_order");
  CREATE INDEX "_cms_posts_v_version_seo_keywords_parent_id_idx" ON "_cms_posts_v_version_seo_keywords" USING btree ("_parent_id");
  CREATE INDEX "_cms_posts_v_parent_idx" ON "_cms_posts_v" USING btree ("parent_id");
  CREATE INDEX "_cms_posts_v_version_version_slug_idx" ON "_cms_posts_v" USING btree ("version_slug");
  CREATE INDEX "_cms_posts_v_version_version_location_idx" ON "_cms_posts_v" USING btree ("version_location_id");
  CREATE INDEX "_cms_posts_v_version_version_hero_image_idx" ON "_cms_posts_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_cms_posts_v_version_seo_version_seo_og_image_idx" ON "_cms_posts_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_cms_posts_v_version_version_updated_at_idx" ON "_cms_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_cms_posts_v_version_version_created_at_idx" ON "_cms_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_cms_posts_v_version_version__status_idx" ON "_cms_posts_v" USING btree ("version__status");
  CREATE INDEX "_cms_posts_v_created_at_idx" ON "_cms_posts_v" USING btree ("created_at");
  CREATE INDEX "_cms_posts_v_updated_at_idx" ON "_cms_posts_v" USING btree ("updated_at");
  CREATE INDEX "_cms_posts_v_latest_idx" ON "_cms_posts_v" USING btree ("latest");
  CREATE INDEX "_cms_posts_v_autosave_idx" ON "_cms_posts_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_cms_users_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("locations_id");
  CREATE INDEX "payload_locked_documents_rels_cms_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_posts_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_cms_users_id_idx" ON "payload_preferences_rels" USING btree ("cms_users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms_users_sessions" CASCADE;
  DROP TABLE "cms_users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "locations_pain_points_items" CASCADE;
  DROP TABLE "locations_benefits_items" CASCADE;
  DROP TABLE "locations_local_shopping_boutiques" CASCADE;
  DROP TABLE "locations_faq_items" CASCADE;
  DROP TABLE "locations" CASCADE;
  DROP TABLE "cms_posts_seo_keywords" CASCADE;
  DROP TABLE "cms_posts" CASCADE;
  DROP TABLE "_cms_posts_v_version_seo_keywords" CASCADE;
  DROP TABLE "_cms_posts_v" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_locations_status";
  DROP TYPE "public"."enum_locations_hero_primary_cta";
  DROP TYPE "public"."enum_cms_posts_status";
  DROP TYPE "public"."enum_cms_posts_category";
  DROP TYPE "public"."enum__cms_posts_v_version_status";
  DROP TYPE "public"."enum__cms_posts_v_version_category";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
