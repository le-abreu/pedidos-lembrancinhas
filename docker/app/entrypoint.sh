#!/bin/sh
set -eu

PRISMA_BIN="./node_modules/.bin/prisma"

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running prisma migrate deploy..."
  "$PRISMA_BIN" migrate deploy
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Running prisma seed..."
  "$PRISMA_BIN" db seed
fi

exec "$@"
