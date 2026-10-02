#!/usr/bin/env bash
# Renders the app in headless Chrome and prints the resulting DOM; console errors go to stderr.
# Usage (from repo root): bash apps/goalvault/tests/smoke.sh '?demo=1#/categories'
set -euo pipefail
PORT="${PORT:-8765}"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
LOG="$(mktemp)"
trap 'kill $SERVER; rm -f "$LOG"' EXIT
sleep 1
google-chrome --headless=new --disable-gpu --no-sandbox --enable-logging=stderr --v=0 \
  --virtual-time-budget=10000 --dump-dom "http://127.0.0.1:$PORT/apps/goalvault/${1-?demo=1}" 2>"$LOG"
grep -E 'CONSOLE.*(Uncaught|TypeError|ReferenceError|SyntaxError)' "$LOG" >&2 || true
