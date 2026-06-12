#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npm run migrate
fi

if [ -n "$DATABASE_URL" ] && [ "$PAYLOAD_DB_PUSH" != "false" ]; then
  echo "Preparing Payload CMS schema..."
  npm run cms:push
fi

exec "$@"
