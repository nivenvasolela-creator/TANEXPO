#!/usr/bin/env bash
# Runs every verification suite, each against a fresh production-mode server with an empty
# database (rate limiters are in-memory, so suites must not share a server).
# Usage: npm test            (expects `npm run build` to have been run)
set -u
cd "$(dirname "$0")/.."

PORT="${TEST_PORT:-3099}"
ADMIN_EMAIL="admin@tanexpo.tz"
ADMIN_PASSWORD="AdminStrongPassword123!"
WORK="$(mktemp -d)"
FAILED=0

if [ ! -f dist/server.cjs ]; then
  echo "dist/server.cjs not found. Run: npm run build"
  exit 1
fi

run_suite() {
  local name="$1"; shift
  local dir="$WORK/$name"
  mkdir -p "$dir"
  NODE_ENV=production PORT="$PORT" COMMISSION_RATE=0.15 PG_DATA_DIR="$dir/pg" \
    ADMIN_SEED_EMAIL="$ADMIN_EMAIL" ADMIN_SEED_PASSWORD="$ADMIN_PASSWORD" \
    node dist/server.cjs > "$dir/server.log" 2>&1 &
  local pid=$!
  local up=0
  for _ in $(seq 1 60); do
    if curl -sf "http://127.0.0.1:$PORT/api/health" > /dev/null 2>&1; then up=1; break; fi
    sleep 0.5
  done
  if [ "$up" != "1" ]; then
    echo "FAIL [$name] server did not start"; tail -20 "$dir/server.log"
    kill "$pid" 2>/dev/null; FAILED=1; return
  fi
  if BASE_URL="http://127.0.0.1:$PORT/api" PG_DATA_DIR="$dir/pg" \
       ADMIN_SEED_EMAIL="$ADMIN_EMAIL" ADMIN_SEED_PASSWORD="$ADMIN_PASSWORD" \
       "$@" > "$dir/out.log" 2>&1; then
    echo "ok    $name: $(tail -1 "$dir/out.log")"
  else
    echo "FAIL  $name"; tail -25 "$dir/out.log"; FAILED=1
  fi
  kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
}

run_suite security bash scripts/security-test.sh
run_suite integrity node scripts/integrity-test.mjs
run_suite whatsapp node scripts/whatsapp-test.mjs
run_suite media node scripts/media-test.mjs

rm -rf "$WORK"
if [ "$FAILED" = "0" ]; then echo "ALL SUITES PASSED"; else echo "SOME SUITES FAILED"; fi
exit "$FAILED"
