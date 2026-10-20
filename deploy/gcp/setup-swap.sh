#!/usr/bin/env bash
# setup-swap.sh — 2 GB swap na e2-micro (Spring + MySQL).
# Uruchom raz na VM jako root: sudo bash deploy/gcp/setup-swap.sh
set -euo pipefail

SWAPFILE="${SWAPFILE:-/swapfile}"
SIZE_MB="${SIZE_MB:-2048}"

if swapon --show | grep -q .; then
  echo "Swap already enabled:"
  swapon --show
  exit 0
fi

if [[ -f "$SWAPFILE" ]]; then
  echo "Found $SWAPFILE — enabling"
  chmod 600 "$SWAPFILE"
  swapon "$SWAPFILE"
  exit 0
fi

echo "Creating ${SIZE_MB}M swap at $SWAPFILE"
dd if=/dev/zero of="$SWAPFILE" bs=1M count="$SIZE_MB" status=progress
chmod 600 "$SWAPFILE"
mkswap "$SWAPFILE"
swapon "$SWAPFILE"

if ! grep -q "$SWAPFILE" /etc/fstab; then
  echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
fi

echo "Done."
free -h
