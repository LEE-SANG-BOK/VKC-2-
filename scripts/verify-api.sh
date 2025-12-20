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

PROBE_KEY_GUEST="${PROBE_KEY_GUEST:-verify-guest-$(date +%s%N)}"
PROBE_KEY_AUTH="${PROBE_KEY_AUTH:-verify-auth-$(date +%s%N)}"

# Guest checks
call_endpoint "GET" "/api/users/me" "401" "Current user (guest)"
call_endpoint "GET" "/api/categories" "200" "Categories list"
call_endpoint "GET" "/api/posts?sort=popular" "200" "Posts feed (guest, popular)"
call_endpoint "GET" "/api/search/examples" "200" "Search examples (guest)"
call_endpoint "GET" "/api/probe/rate-limit?key=${PROBE_KEY_GUEST}" "200" "Rate limit probe (guest, 1/4)"
call_endpoint "GET" "/api/probe/rate-limit?key=${PROBE_KEY_GUEST}" "200" "Rate limit probe (guest, 2/4)"
call_endpoint "GET" "/api/probe/rate-limit?key=${PROBE_KEY_GUEST}" "200" "Rate limit probe (guest, 3/4)"
call_endpoint "GET" "/api/probe/rate-limit?key=${PROBE_KEY_GUEST}" "429" "Rate limit probe (guest, 4/4)"

# Authenticated checks (requires SESSION_COOKIE)
call_endpoint "GET" "/api/users/me" "200" "Current user (logged in)" true
call_endpoint "GET" "/api/users/me/subscriptions" "200" "My subscriptions (logged in)" true
call_endpoint "GET" "/api/posts?filter=following" "200" "Posts feed (logged in, following)" true
call_endpoint "GET" "/api/notifications/unread-count" "200" "Unread notifications count (logged in)" true
call_endpoint "GET" "/api/probe/rate-limit?key=${PROBE_KEY_AUTH}" "200" "Rate limit probe (logged in, 1/4)" true
call_endpoint "GET" "/api/probe/rate-limit?key=${PROBE_KEY_AUTH}" "200" "Rate limit probe (logged in, 2/4)" true
call_endpoint "GET" "/api/probe/rate-limit?key=${PROBE_KEY_AUTH}" "200" "Rate limit probe (logged in, 3/4)" true
call_endpoint "GET" "/api/probe/rate-limit?key=${PROBE_KEY_AUTH}" "429" "Rate limit probe (logged in, 4/4)" true

log "Done. Review warnings above for non-matching status codes."
