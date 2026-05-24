#!/usr/bin/env bash
# =============================================================================
# 02_apply_target_schema.sh
# Apply all Prisma migrations to a quarantined branch (after 01_quarantine_legacy).
#
# Usage:
#   export DIRECT_URL="postgresql://..."   # Neon branch connection string
#   ./02_apply_target_schema.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

if [[ -z "${DIRECT_URL:-}" && -z "${DATABASE_URL:-}" ]]; then
  echo "Error: set DIRECT_URL or DATABASE_URL to the target Neon branch." >&2
  exit 1
fi

cd "$SERVER_DIR"
echo "Applying Prisma migrations from $SERVER_DIR ..."
npx prisma migrate deploy --schema=src/prisma/schema.prisma
echo "Schema applied. _prisma_migrations is now aligned with development."
