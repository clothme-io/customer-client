#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npm run migrate
fi

if [ -n "$DATABASE_URL" ]; then
  echo "Syncing Payload CMS schema..."
  if ! npm run cms:sync; then
    echo "Payload schema sync failed. Starting app anyway."
  fi
fi

exec "$@"
