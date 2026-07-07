import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION repair_lexical_list_items(input jsonb)
    RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
    DECLARE
      item jsonb;
      repaired_children jsonb := '[]'::jsonb;
      inline_children jsonb := '[]'::jsonb;
      nested_children jsonb := '[]'::jsonb;
      repaired_node jsonb;
      child_type text;
    BEGIN
      IF input IS NULL THEN
        RETURN input;
      END IF;

      IF jsonb_typeof(input) = 'array' THEN
        FOR item IN SELECT value FROM jsonb_array_elements(input)
        LOOP
          repaired_children := repaired_children || jsonb_build_array(repair_lexical_list_items(item));
        END LOOP;
        RETURN repaired_children;
      END IF;

      IF jsonb_typeof(input) <> 'object' THEN
        RETURN input;
      END IF;

      IF input ? 'children' AND jsonb_typeof(input->'children') = 'array' THEN
        IF input->>'type' = 'listitem' THEN
          inline_children := '[]'::jsonb;
          nested_children := '[]'::jsonb;

          FOR item IN SELECT value FROM jsonb_array_elements(input->'children')
          LOOP
            child_type := item->>'type';

            IF child_type IN ('paragraph', 'heading', 'list', 'quote', 'code', 'horizontalrule') THEN
              nested_children := nested_children || jsonb_build_array(repair_lexical_list_items(item));
            ELSE
              inline_children := inline_children || jsonb_build_array(repair_lexical_list_items(item));
            END IF;
          END LOOP;

          repaired_children := '[]'::jsonb;

          IF jsonb_array_length(inline_children) > 0 THEN
            repaired_children := repaired_children || jsonb_build_array(jsonb_build_object(
              'type', 'paragraph',
              'children', inline_children,
              'direction', 'ltr',
              'format', '',
              'indent', 0,
              'version', 1
            ));
          END IF;

          repaired_children := repaired_children || nested_children;
          repaired_node := jsonb_set(input, '{children}', repaired_children, true);
          RETURN repaired_node;
        ELSE
          repaired_node := jsonb_set(input, '{children}', repair_lexical_list_items(input->'children'), true);
          RETURN repaired_node;
        END IF;
      END IF;

      RETURN input;
    END;
    $$;

    UPDATE "cms_posts"
    SET "content" = repair_lexical_list_items("content")
    WHERE "content" IS NOT NULL;

    UPDATE "_cms_posts_v"
    SET "version_content" = repair_lexical_list_items("version_content")
    WHERE "version_content" IS NOT NULL;

    DROP FUNCTION repair_lexical_list_items(jsonb);
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql``)
}
