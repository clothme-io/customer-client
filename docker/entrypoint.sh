#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npm run migrate
fi

# Run Payload CMS migrations (idempotent — safe on every deploy).
# Tracks applied migrations in the payload_migrations table.
# To create a new migration after schema changes: npm run cms:migrate:create
if [ -n "$DATABASE_URL" ] && [ "$PAYLOAD_SKIP_MIGRATIONS" != "true" ]; then
  echo "Running Payload CMS migrations..."
  if ! npm run cms:migrate; then
    echo "Payload CMS migrations failed. Starting app anyway so Railway stays online."
  fi
fi

exec "$@"
