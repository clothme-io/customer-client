import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "cms_posts"
    SET "content" = replace(
      replace(
        "content"::text,
        'ClothME | White background preview',
        'ClothME | Find Clothes That Fit Every Time'
      ),
      'ClothME | Shop Fashion with Your Size',
      'ClothME | Find Clothes That Fit Every Time'
    )::jsonb
    WHERE "content"::text LIKE '%ClothME | White background preview%'
       OR "content"::text LIKE '%ClothME | Shop Fashion with Your Size%';

    UPDATE "_cms_posts_v"
    SET "version_content" = replace(
      replace(
        "version_content"::text,
        'ClothME | White background preview',
        'ClothME | Find Clothes That Fit Every Time'
      ),
      'ClothME | Shop Fashion with Your Size',
      'ClothME | Find Clothes That Fit Every Time'
    )::jsonb
    WHERE "version_content"::text LIKE '%ClothME | White background preview%'
       OR "version_content"::text LIKE '%ClothME | Shop Fashion with Your Size%';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "cms_posts"
    SET "content" = replace(
      "content"::text,
      'ClothME | Find Clothes That Fit Every Time',
      'ClothME | White background preview'
    )::jsonb
    WHERE "content"::text LIKE '%ClothME | Find Clothes That Fit Every Time%';

    UPDATE "_cms_posts_v"
    SET "version_content" = replace(
      "version_content"::text,
      'ClothME | Find Clothes That Fit Every Time',
      'ClothME | White background preview'
    )::jsonb
    WHERE "version_content"::text LIKE '%ClothME | Find Clothes That Fit Every Time%';
  `)
}
