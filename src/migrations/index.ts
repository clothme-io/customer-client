import * as migration_20260626_183444 from './20260626_183444';
import * as migration_20260702_000001_waitlist_entries from './20260702_000001_waitlist_entries';
import * as migration_20260702_000002_drop_legacy_tables from './20260702_000002_drop_legacy_tables';
import * as migration_20260703_000001_webhook_ingest_repair from './20260703_000001_webhook_ingest_repair';
import * as migration_20260704_000001_reset_cms_posts_preferences from './20260704_000001_reset_cms_posts_preferences';

export const migrations = [
  {
    up: migration_20260626_183444.up,
    down: migration_20260626_183444.down,
    name: '20260626_183444'
  },
  {
    up: migration_20260702_000001_waitlist_entries.up,
    down: migration_20260702_000001_waitlist_entries.down,
    name: '20260702_000001_waitlist_entries'
  },
  {
    up: migration_20260702_000002_drop_legacy_tables.up,
    down: migration_20260702_000002_drop_legacy_tables.down,
    name: '20260702_000002_drop_legacy_tables'
  },
  {
    up: migration_20260703_000001_webhook_ingest_repair.up,
    down: migration_20260703_000001_webhook_ingest_repair.down,
    name: '20260703_000001_webhook_ingest_repair'
  },
  {
    up: migration_20260704_000001_reset_cms_posts_preferences.up,
    down: migration_20260704_000001_reset_cms_posts_preferences.down,
    name: '20260704_000001_reset_cms_posts_preferences'
  },
];
