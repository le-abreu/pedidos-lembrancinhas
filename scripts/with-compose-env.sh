#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f "docker/compose/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "docker/compose/.env"
    set +a
  elif [[ -f ".env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source ".env"
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL nao definida. Configure .env ou docker/compose/.env." >&2
  exit 1
fi

exec "$@"
