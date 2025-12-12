#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
SESSION_COOKIE="${SESSION_COOKIE:-}"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TEMP_DIR}"' EXIT

log() {
  printf '\n[%s] %s\n' "$(date +'%H:%M:%S')" "$*"
}

call_endpoint() {
  local method="$1"
  local path="$2"
  local expect="$3"
  local description="$4"
  local require_auth="${5:-false}"

  local url="${BASE_URL}${path}"
  local output_file="${TEMP_DIR}/response.json"
  local cookie_header=()

  if [[ "${require_auth}" == "true" ]]; then
    if [[ -z "${SESSION_COOKIE}" ]]; then
      log "⚠️  Skip ${description} (SESSION_COOKIE not provided)"
      return 0
    fi
    cookie_header=(-H "Cookie: ${SESSION_COOKIE}")
  fi

  log "→ ${description}"
  log "   ${method} ${url}"

  local curl_cmd=(curl -sS -o "${output_file}" -w "%{http_code}" -X "${method}")

  if [[ ${#cookie_header[@]} -gt 0 ]]; then
    curl_cmd+=("${cookie_header[@]}")
  fi

  curl_cmd+=(-H "Accept: application/json" "${url}")

  local status
  status="$("${curl_cmd[@]}")" || {
      log "✖️  curl failed for ${description}"
      return 1
    }

  if [[ "${status}" == "${expect}" ]]; then
    log "✅  status ${status} as expected"
  else
    log "⚠️  status ${status}, expected ${expect}"
  fi

  if command -v jq >/dev/null 2>&1; then
    jq '.' "${output_file}" 2>/dev/null || cat "${output_file}"
  else
    cat "${output_file}"
    log "ℹ️  Install jq for prettier output (brew install jq)"
  fi
}

log "API smoke verification against ${BASE_URL}"
log "SESSION_COOKIE ${SESSION_COOKIE:+provided}${SESSION_COOKIE:+" (length ${#SESSION_COOKIE})"}"

# Guest checks
call_endpoint "GET" "/api/auth/profile" "401" "Auth profile (guest)"
call_endpoint "GET" "/api/categories" "200" "Categories list"
call_endpoint "GET" "/api/questions?sort=popular" "200" "Questions popular feed (guest)"
call_endpoint "GET" "/api/posts?view=all" "200" "Posts feed (guest)"

# Authenticated checks (requires SESSION_COOKIE)
call_endpoint "GET" "/api/auth/profile" "200" "Auth profile (logged in)" true
call_endpoint "GET" "/api/questions?sort=following" "200" "Questions following feed (logged in)" true
call_endpoint "GET" "/api/bookmarks" "200" "Bookmarks list (logged in)" true

log "Done. Review warnings above for non-matching status codes."
