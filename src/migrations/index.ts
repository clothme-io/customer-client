import * as migration_20260626_183444 from './20260626_183444';
import * as migration_20260702_000001_waitlist_entries from './20260702_000001_waitlist_entries';
import * as migration_20260702_000002_drop_legacy_tables from './20260702_000002_drop_legacy_tables';

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
];
