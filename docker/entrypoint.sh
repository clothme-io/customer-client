#!/bin/sh
set -e

# Migrations run only when explicitly requested (K8s migrate Job / one-shot).
# App pods must not migrate — blue/green would race and cannot roll back schema.
if [ "${RUN_MIGRATIONS}" = "true" ] || [ "${RUN_MIGRATIONS}" = "1" ]; then
  if [ -z "$DATABASE_URL" ]; then
    echo "RUN_MIGRATIONS is set but DATABASE_URL is missing."
    exit 1
  fi
  echo "Running Payload CMS migrations..."
  npm run cms:sync
fi

exec "$@"
