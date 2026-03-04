#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/.codex/skills"
DST_DIR="${HOME}/.codex/skills"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Skills source directory not found: $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$DST_DIR"
cp -R "$SRC_DIR"/. "$DST_DIR"/

echo "Codex skills synced to: $DST_DIR"
