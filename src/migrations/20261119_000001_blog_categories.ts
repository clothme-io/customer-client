import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_cms_posts_category" ADD VALUE IF NOT EXISTS 'shopping-guides';
    ALTER TYPE "public"."enum_cms_posts_category" ADD VALUE IF NOT EXISTS 'ai-fashion-technology';
    ALTER TYPE "public"."enum_cms_posts_category" ADD VALUE IF NOT EXISTS 'brands-fabrics';
    ALTER TYPE "public"."enum_cms_posts_category" ADD VALUE IF NOT EXISTS 'clothme-updates';
    ALTER TYPE "public"."enum__cms_posts_v_version_category" ADD VALUE IF NOT EXISTS 'shopping-guides';
    ALTER TYPE "public"."enum__cms_posts_v_version_category" ADD VALUE IF NOT EXISTS 'ai-fashion-technology';
    ALTER TYPE "public"."enum__cms_posts_v_version_category" ADD VALUE IF NOT EXISTS 'brands-fabrics';
    ALTER TYPE "public"."enum__cms_posts_v_version_category" ADD VALUE IF NOT EXISTS 'clothme-updates';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // PostgreSQL cannot remove enum labels without rebuilding both types and remapping existing posts.
  void db;
}
