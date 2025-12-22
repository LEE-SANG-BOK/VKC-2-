#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

echo "[guardrails] checking: no Server Actions (\"use server\")"
if rg -n --hidden --glob '!**/.next/**' --glob '!**/node_modules/**' "\"use server\"|^\\s*'use server'\\s*;?$|^\\s*\\\"use server\\\"\\s*;?$" src 1>/dev/null; then
  echo "[guardrails] FAIL: found \"use server\" usage (Server Actions are forbidden)."
  rg -n "\"use server\"|^\\s*'use server'\\s*;?$|^\\s*\\\"use server\\\"\\s*;?$" src || true
  exit 1
fi

echo "[guardrails] checking: i18n key parity (ko/en/vi)"
bash .codex/skills/vkc-repo-guardrails/scripts/lint-i18n-keys.sh

echo "[guardrails] PASS"

