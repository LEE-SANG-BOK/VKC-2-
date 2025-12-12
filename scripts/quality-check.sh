#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Type check"
npm run -s type-check

echo "[2/4] Lint"
npm run -s lint

echo "[3/4] Build"
npm run -s build

echo "[4/4] Test"
npm run -s test

echo "All checks passed."

