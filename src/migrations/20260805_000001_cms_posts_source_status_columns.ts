import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * - Backfill empty source.provider to self-publish
 * - Convert source_provider columns to select enums
 * - Reset Blog Posts list preferences so Source + Status columns appear
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "cms_posts"
    SET "source_provider" = 'self-publish'
    WHERE "source_provider" IS NULL OR "source_provider" = '';

    UPDATE "_cms_posts_v"
    SET "version_source_provider" = 'self-publish'
    WHERE "version_source_provider" IS NULL OR "version_source_provider" = '';

    DO $$ BEGIN
      CREATE TYPE "public"."enum_cms_posts_source_provider" AS ENUM('outrank', 'babylovegrowth', 'self-publish');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__cms_posts_v_version_source_provider" AS ENUM('outrank', 'babylovegrowth', 'self-publish');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "cms_posts"
      ALTER COLUMN "source_provider" DROP DEFAULT;

    ALTER TABLE "cms_posts"
      ALTER COLUMN "source_provider" TYPE "public"."enum_cms_posts_source_provider"
      USING (
        CASE
          WHEN "source_provider"::text = 'outrank' THEN 'outrank'::"public"."enum_cms_posts_source_provider"
          WHEN "source_provider"::text = 'babylovegrowth' THEN 'babylovegrowth'::"public"."enum_cms_posts_source_provider"
          ELSE 'self-publish'::"public"."enum_cms_posts_source_provider"
        END
      );

    ALTER TABLE "cms_posts"
      ALTER COLUMN "source_provider" SET DEFAULT 'self-publish'::"public"."enum_cms_posts_source_provider";

    ALTER TABLE "_cms_posts_v"
      ALTER COLUMN "version_source_provider" DROP DEFAULT;

    ALTER TABLE "_cms_posts_v"
      ALTER COLUMN "version_source_provider" TYPE "public"."enum__cms_posts_v_version_source_provider"
      USING (
        CASE
          WHEN "version_source_provider"::text = 'outrank' THEN 'outrank'::"public"."enum__cms_posts_v_version_source_provider"
          WHEN "version_source_provider"::text = 'babylovegrowth' THEN 'babylovegrowth'::"public"."enum__cms_posts_v_version_source_provider"
          ELSE 'self-publish'::"public"."enum__cms_posts_v_version_source_provider"
        END
      );

    ALTER TABLE "_cms_posts_v"
      ALTER COLUMN "version_source_provider" SET DEFAULT 'self-publish'::"public"."enum__cms_posts_v_version_source_provider";

    DELETE FROM "payload_preferences"
    WHERE "key" = 'collection-cms-posts';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "cms_posts"
      ALTER COLUMN "source_provider" DROP DEFAULT;

    ALTER TABLE "cms_posts"
      ALTER COLUMN "source_provider" TYPE varchar
      USING ("source_provider"::text);

    ALTER TABLE "_cms_posts_v"
      ALTER COLUMN "version_source_provider" DROP DEFAULT;

    ALTER TABLE "_cms_posts_v"
      ALTER COLUMN "version_source_provider" TYPE varchar
      USING ("version_source_provider"::text);

    DROP TYPE IF EXISTS "public"."enum_cms_posts_source_provider";
    DROP TYPE IF EXISTS "public"."enum__cms_posts_v_version_source_provider";
  `)
}
