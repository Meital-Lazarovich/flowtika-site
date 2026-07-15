#!/usr/bin/env bash
# Upload the Flowtika static site to your Hostinger VPS.
#
# 1. Put your VPS IP in VPS_IP below.
# 2. Run from the project folder:  bash deploy/deploy.sh
#
# Re-run this any time you change a file (e.g. after adding the Web3Forms key).
set -euo pipefail

VPS_IP="76.13.131.217"
REMOTE_DIR="/var/www/flowtika"
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ "$VPS_IP" = "PASTE_YOUR_VPS_IP_HERE" ]; then
  echo "Edit deploy/deploy.sh and set VPS_IP to your server's IP first." >&2
  exit 1
fi

echo "Uploading site -> root@${VPS_IP}:${REMOTE_DIR}"
scp "$SRC_DIR/index.html" "$SRC_DIR/styles.css" "$SRC_DIR/script.js" "$SRC_DIR/logo.svg" \
    "root@${VPS_IP}:${REMOTE_DIR}/"
echo "Done. Once DNS points at the VPS, visit https://flowtika.com"
