#!/usr/bin/env bash
# =============================================================================
# run_cutover.sh — Execute full cutover sequence on a Neon branch.
#
# Usage:
#   export DIRECT_URL="postgresql://..."   # target branch (rehearsal or production)
#   ./run_cutover.sh
#
# Steps: 01 quarantine → 02 prisma migrate deploy → 03 ETL → 04 validate
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

if [[ -z "${DIRECT_URL:-}" && -z "${DATABASE_URL:-}" ]]; then
  echo "Error: set DIRECT_URL or DATABASE_URL to the target Neon branch." >&2
  exit 1
fi

CONN="${DIRECT_URL:-$DATABASE_URL}"
PSQL="psql \"$CONN\" -v ON_ERROR_STOP=1"

run_sql() {
  local file="$1"
  echo ""
  echo ">>> Running $(basename "$file") ..."
  eval "$PSQL -f \"$file\""
}

echo "Cutover target: ${CONN%%@*}@***"

run_sql "$SCRIPT_DIR/01_quarantine_legacy.sql"

echo ""
echo ">>> Running 02_apply_target_schema.sh ..."
export DIRECT_URL="$CONN"
export DATABASE_URL="$CONN"
bash "$SCRIPT_DIR/02_apply_target_schema.sh"

run_sql "$SCRIPT_DIR/03_etl_legacy_to_new.sql"
run_sql "$SCRIPT_DIR/04_validate.sql"

echo ""
echo "Cutover complete. Review validation output above (validation_result should be PASS)."
