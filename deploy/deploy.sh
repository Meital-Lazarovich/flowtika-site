#!/usr/bin/env bash
# Upload the site to the Flowtika server (the same Hostinger VPS as the bot).
#
# The bot's Caddy (Docker, /opt/flowtika on the server) already serves /opt/flowtika/site on port 80,
# so the site is live at http://76.13.131.217 as soon as this finishes. No web-server setup needed.
#
# Run on the Mac from this folder:  bash deploy/deploy.sh
# It uploads what is committed on the branch you're on (normally main), not unsaved edits.
set -euo pipefail

HOST="${FLOWTIKA_HOST:-flowtika-vps}"   # ssh alias for root@76.13.131.217 in ~/.ssh/config
REMOTE_DIR="/opt/flowtika/site"
cd "$(dirname "$0")/.."

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Uploading $BRANCH ($(git rev-parse --short HEAD)) -> $HOST:$REMOTE_DIR"

# Unpacked next to the live folder first, then copied in. The folder itself is kept, because Caddy's
# container has it mounted and a replaced folder would not be seen until Caddy restarts.
git archive --format=tar HEAD index.html styles.css script.js logo.svg images \
  | ssh "$HOST" "set -e
      rm -rf $REMOTE_DIR.new && mkdir -p $REMOTE_DIR.new $REMOTE_DIR
      tar -xf - -C $REMOTE_DIR.new
      test -s $REMOTE_DIR.new/index.html
      find $REMOTE_DIR -mindepth 1 -delete
      cp -a $REMOTE_DIR.new/. $REMOTE_DIR/
      rm -rf $REMOTE_DIR.new"

echo "Done: http://76.13.131.217"
