#!/usr/bin/env bash
# Serves the app locally and opens it full screen in Chromium.
# Restarts the browser if it ever closes or crashes.
set -u

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=8000
URL="http://localhost:${PORT}/index.html"
PROFILE="${HOME}/.config/through-the-lens-chromium"

if command -v chromium-browser >/dev/null 2>&1; then
  BROWSER=chromium-browser
elif command -v chromium >/dev/null 2>&1; then
  BROWSER=chromium
else
  echo "Chromium was not found. Install it with: sudo apt install chromium-browser" >&2
  exit 1
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$APP_DIR" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT

sleep 1

while true; do
  "$BROWSER" \
    --kiosk \
    --user-data-dir="$PROFILE" \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --check-for-update-interval=31536000 \
    --password-store=basic \
    --no-first-run \
    "$URL"
  sleep 2
done
