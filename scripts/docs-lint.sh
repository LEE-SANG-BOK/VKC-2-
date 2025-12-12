#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

echo "[docs-lint] scanning markdown files under docs/ ..."

EXIT=0

# 1) Trailing spaces (ignore deliberate Markdown line breaks: exactly two spaces at EOL)
if rg -n "\s+$" docs --glob "*.md" | rg -v "  $" > .tmp-docs-trailing.txt 2>/dev/null; then
  if [ -s .tmp-docs-trailing.txt ]; then
    echo "[warn] trailing spaces found:" >&2
    cat .tmp-docs-trailing.txt >&2
  fi
fi

# 2) Tab characters
if rg -n "\t" docs --glob "*.md" > .tmp-docs-tabs.txt 2>/dev/null; then
  if [ -s .tmp-docs-tabs.txt ]; then
    echo "[warn] tab characters found:" >&2
    cat .tmp-docs-tabs.txt >&2
  fi
fi

# 3) Very long lines (> 200 chars)
rg -n ".{201,}" docs --glob "*.md" > .tmp-docs-longlines.txt 2>/dev/null || true
if [ -s .tmp-docs-longlines.txt ]; then
  echo "[warn] long lines (>200 chars) found:" >&2
  cat .tmp-docs-longlines.txt | head -50 >&2
fi

rm -f .tmp-docs-*.txt || true

echo "[docs-lint] done"
exit $EXIT
