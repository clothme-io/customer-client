import * as migration_20260626_183444 from './20260626_183444';
import * as migration_20260702_000001_waitlist_entries from './20260702_000001_waitlist_entries';
import * as migration_20260702_000002_drop_legacy_tables from './20260702_000002_drop_legacy_tables';
import * as migration_20260703_000001_webhook_ingest_repair from './20260703_000001_webhook_ingest_repair';
import * as migration_20260704_000001_reset_cms_posts_preferences from './20260704_000001_reset_cms_posts_preferences';
import * as migration_20260706_000001_repair_cms_post_quotes from './20260706_000001_repair_cms_post_quotes';
import * as migration_20260707_000001_repair_cms_post_list_items from './20260707_000001_repair_cms_post_list_items';
import * as migration_20260708_000001_sync_locked_documents_rels from './20260708_000001_sync_locked_documents_rels';
import * as migration_20260708_000002_repair_stale_homepage_link_labels from './20260708_000002_repair_stale_homepage_link_labels';
import * as migration_20260723_000001_waitlist_state from './20260723_000001_waitlist_state';

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
  {
    up: migration_20260706_000001_repair_cms_post_quotes.up,
    down: migration_20260706_000001_repair_cms_post_quotes.down,
    name: '20260706_000001_repair_cms_post_quotes'
  },
  {
    up: migration_20260707_000001_repair_cms_post_list_items.up,
    down: migration_20260707_000001_repair_cms_post_list_items.down,
    name: '20260707_000001_repair_cms_post_list_items'
  },
  {
    up: migration_20260708_000001_sync_locked_documents_rels.up,
    down: migration_20260708_000001_sync_locked_documents_rels.down,
    name: '20260708_000001_sync_locked_documents_rels'
  },
  {
    up: migration_20260708_000002_repair_stale_homepage_link_labels.up,
    down: migration_20260708_000002_repair_stale_homepage_link_labels.down,
    name: '20260708_000002_repair_stale_homepage_link_labels'
  },
  {
    up: migration_20260723_000001_waitlist_state.up,
    down: migration_20260723_000001_waitlist_state.down,
    name: '20260723_000001_waitlist_state'
  },
];
