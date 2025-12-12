#!/usr/bin/env bash

# Runs feed-run-as.sql and verify-rls.sql with interactive prompts.
# Automatically derives the Supabase DB host from NEXT_PUBLIC_SUPABASE_URL if possible.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

read_env_value() {
  local key=$1
  if [[ ! -f "$ENV_FILE" ]]; then
    return
  fi
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" || true)"
  if [[ -n "$line" ]]; then
    echo "${line#${key}=}" | tr -d '"'
  fi
}

derive_project_ref() {
  local url=${1:-}
  if [[ "$url" =~ ^https://([a-z0-9]+)\.supabase\.co/?$ ]]; then
    echo "${BASH_REMATCH[1]}"
  fi
}

prompt_var() {
  local var_name=$1
  local prompt_message=$2
  local silent=${3:-0}

  if [[ -n "${!var_name:-}" ]]; then
    return
  fi

  local value
  if [[ "$silent" -eq 1 ]]; then
    read -rsp "$prompt_message" value
    echo
  else
    read -rp "$prompt_message" value
  fi
  export "$var_name"="$value"
}

assemble_db_url() {
  if [[ -n "${SUPABASE_DB_URL:-}" && $SUPABASE_DB_URL != *"[YOUR_DB_PASSWORD]"* ]]; then
    return
  fi

  local env_value
  env_value="$(read_env_value "SUPABASE_DB_URL")"
  if [[ -n "$env_value" && $env_value != *"[YOUR_DB_PASSWORD]"* ]]; then
    SUPABASE_DB_URL="$env_value"
    export SUPABASE_DB_URL
    return
  fi

  env_value="$(read_env_value "DATABASE_URL")"
  if [[ -n "$env_value" && $env_value != *"[YOUR_DB_PASSWORD]"* ]]; then
    SUPABASE_DB_URL="$env_value"
    export SUPABASE_DB_URL
    return
  fi

  local project_url
  project_url="$(read_env_value "NEXT_PUBLIC_SUPABASE_URL")"
  local project_ref
  project_ref="$(derive_project_ref "$project_url")"

  prompt_var SUPABASE_DB_PASSWORD "Supabase DB password: " 1

  if [[ -z "$project_ref" ]]; then
    prompt_var SUPABASE_DB_HOST "Supabase DB host (db.<project-ref>.supabase.co): "
  else
    SUPABASE_DB_HOST="db.${project_ref}.supabase.co"
  fi

  prompt_var SUPABASE_DB_HOST "Supabase DB host (db.<project-ref>.supabase.co): "

  SUPABASE_DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:5432/postgres?sslmode=require"
  export SUPABASE_DB_URL
}

run_psql_script() {
  local script_path=$1
  shift
  local extra_options=()
  if (( "$#" )); then
    extra_options=("$@")
  fi

  if [[ ! -f "$script_path" ]]; then
    echo "Script not found: $script_path" >&2
    exit 1
  fi

  if (( ${#extra_options[@]} )); then
    psql "${extra_options[@]}" -f "$script_path" "$SUPABASE_DB_URL"
  else
    psql -f "$script_path" "$SUPABASE_DB_URL"
  fi
}

main() {
  assemble_db_url

  if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
    echo "Supabase Database URL is required." >&2
    exit 1
  fi

  prompt_var ACCOUNT_A_JWT "Account A JWT (optional): "
  prompt_var ACCOUNT_A_ID "Account A UUID (optional): "
  prompt_var ACCOUNT_B_JWT "Account B JWT (optional): "
  prompt_var ACCOUNT_B_ID "Account B UUID (optional): "
  prompt_var SAMPLE_QUESTION_ID "Sample question UUID (optional): "
  prompt_var SAMPLE_POST_ID "Sample post UUID (optional): "

  declare -a psql_vars=()
  [[ -n "${ACCOUNT_A_JWT:-}" ]] && psql_vars+=(-v "account_a_jwt=${ACCOUNT_A_JWT}")
  [[ -n "${ACCOUNT_A_ID:-}" ]] && psql_vars+=(-v "account_a_id=${ACCOUNT_A_ID}")
  [[ -n "${ACCOUNT_B_JWT:-}" ]] && psql_vars+=(-v "account_b_jwt=${ACCOUNT_B_JWT}")
  [[ -n "${ACCOUNT_B_ID:-}" ]] && psql_vars+=(-v "account_b_id=${ACCOUNT_B_ID}")
  [[ -n "${SAMPLE_QUESTION_ID:-}" ]] && psql_vars+=(-v "sample_question_id=${SAMPLE_QUESTION_ID}")
  [[ -n "${SAMPLE_POST_ID:-}" ]] && psql_vars+=(-v "sample_post_id=${SAMPLE_POST_ID}")

  echo "Running scripts/feed-run-as.sql..."
  if (( ${#psql_vars[@]} )); then
    run_psql_script "$ROOT_DIR/scripts/feed-run-as.sql" "${psql_vars[@]}"
  else
    run_psql_script "$ROOT_DIR/scripts/feed-run-as.sql"
  fi

  echo
  echo "Running scripts/verify-rls.sql..."
  if (( ${#psql_vars[@]} )); then
    run_psql_script "$ROOT_DIR/scripts/verify-rls.sql" "${psql_vars[@]}"
  else
    run_psql_script "$ROOT_DIR/scripts/verify-rls.sql"
  fi

  echo
  echo "Done. Review the output and document results in docs/qa Result Logs and claudedocs/PROGRESS.md."
}

main "$@"
