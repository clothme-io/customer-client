import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE career_jobs
    SET content_source = rtrim(split_part(content_source, E'\n## How to Apply\n', 1)) || E'\n',
        updated_at = now()
    WHERE status = 'open'
      AND content_approved = true
      AND position(E'\n## How to Apply\n' in content_source) > 0
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Published application instructions are intentionally not restored on rollback.
  void db;
}
