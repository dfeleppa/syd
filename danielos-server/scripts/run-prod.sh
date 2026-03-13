#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Missing .env (copy from .env.example and set API_TOKEN)" >&2
  exit 1
fi

# Export all .env vars
set -a
source ./.env
set +a

exec /opt/homebrew/bin/node dist/server.js
