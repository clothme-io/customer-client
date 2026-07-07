import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION repair_lexical_quote_nodes(input jsonb)
    RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
    DECLARE
      item jsonb;
      repaired_children jsonb := '[]'::jsonb;
      flattened_children jsonb := '[]'::jsonb;
      child_index integer := 0;
      repaired_node jsonb;
    BEGIN
      IF input IS NULL THEN
        RETURN input;
      END IF;

      IF jsonb_typeof(input) = 'array' THEN
        FOR item IN SELECT value FROM jsonb_array_elements(input)
        LOOP
          repaired_children := repaired_children || jsonb_build_array(repair_lexical_quote_nodes(item));
        END LOOP;
        RETURN repaired_children;
      END IF;

      IF jsonb_typeof(input) <> 'object' THEN
        RETURN input;
      END IF;

      IF input ? 'children' AND jsonb_typeof(input->'children') = 'array' THEN
        IF input->>'type' = 'quote' THEN
          FOR item IN SELECT value FROM jsonb_array_elements(input->'children')
          LOOP
            IF item->>'type' = 'paragraph' AND jsonb_typeof(item->'children') = 'array' THEN
              IF child_index > 0 THEN
                flattened_children := flattened_children || jsonb_build_array(jsonb_build_object('type', 'linebreak', 'version', 1));
              END IF;
              flattened_children := flattened_children || repair_lexical_quote_nodes(item->'children');
            ELSE
              IF child_index > 0 THEN
                flattened_children := flattened_children || jsonb_build_array(jsonb_build_object('type', 'linebreak', 'version', 1));
              END IF;
              flattened_children := flattened_children || jsonb_build_array(repair_lexical_quote_nodes(item));
            END IF;
            child_index := child_index + 1;
          END LOOP;

          repaired_node := jsonb_set(input, '{children}', flattened_children, true);
          RETURN repaired_node;
        ELSE
          repaired_node := jsonb_set(input, '{children}', repair_lexical_quote_nodes(input->'children'), true);
          RETURN repaired_node;
        END IF;
      END IF;

      RETURN input;
    END;
    $$;

    UPDATE "cms_posts"
    SET "content" = repair_lexical_quote_nodes("content")
    WHERE "content" IS NOT NULL;

    UPDATE "_cms_posts_v"
    SET "version_content" = repair_lexical_quote_nodes("version_content")
    WHERE "version_content" IS NOT NULL;

    DROP FUNCTION repair_lexical_quote_nodes(jsonb);
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql``)
}
