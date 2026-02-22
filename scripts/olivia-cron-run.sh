#!/usr/bin/env bash
set -euo pipefail
LOCK=/tmp/olivia-cron.lock
WORKDIR=/home/danny/.openclaw/workspace
ARTIFACTS="$WORKDIR/artifacts"
OUT="$ARTIFACTS/combined.log"
mkdir -p "$ARTIFACTS/olivia"

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "olivia-cron-run: another run in progress; exiting"
  exit 0
fi

cd "$WORKDIR"
# 1) trigger a small log-generation (safe prompt)
node ./scripts/olivia-generate.js --prompt "Summarize in one short sentence the recent UI and build work Olivia performed locally." --title "Cron: summary" --tokens 60 >/dev/null 2>&1 || true

# 2) collect key logs into combined.log (snapshot)
{
  echo "\n--- $(date -Iseconds) : dev-server.log ---\n"
  [ -f "$ARTIFACTS/dev-server.log" ] && tail -n 400 "$ARTIFACTS/dev-server.log" || true
  echo "\n--- $(date -Iseconds) : worker.log ---\n"
  [ -f "$ARTIFACTS/olivia/worker.log" ] && tail -n 400 "$ARTIFACTS/olivia/worker.log" || true
  echo "\n--- $(date -Iseconds) : worker.out ---\n"
  [ -f "$ARTIFACTS/olivia/worker.out" ] && tail -n 400 "$ARTIFACTS/olivia/worker.out" || true
  echo "\n--- $(date -Iseconds) : sidebar-scripts-preflight.log ---\n"
  [ -f "$ARTIFACTS/olivia/sidebar-scripts-preflight.log" ] && tail -n 400 "$ARTIFACTS/olivia/sidebar-scripts-preflight.log" || true
} >> "$OUT"

# release lock
flock -u 9
exit 0
