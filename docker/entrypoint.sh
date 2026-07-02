#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Syncing Payload CMS schema..."
  if ! npm run cms:sync; then
    echo "Payload schema sync failed. Starting app anyway."
  fi
fi

exec "$@"
