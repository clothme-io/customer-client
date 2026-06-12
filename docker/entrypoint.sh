#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npm run migrate
fi

if [ -n "$DATABASE_URL" ] && [ "$PAYLOAD_DB_PUSH" != "false" ]; then
  echo "Preparing Payload CMS schema..."
  if ! npm run cms:push; then
    echo "Payload CMS schema preparation failed. Starting app anyway so Railway stays online."
  fi
fi

exec "$@"
