#!/usr/bin/env bash
# =============================================================================
# WKND Adventures — FlexCMS Sample Website Uninstaller
# Removes ALL WKND data from the FlexCMS database. Irreversible.
# Usage: ./uninstall.sh [--host localhost] [--port 5432] [--db flexcms] [--user postgres]
# =============================================================================
set -euo pipefail

DB_HOST="${FLEXCMS_DB_HOST:-localhost}"
DB_PORT="${FLEXCMS_DB_PORT:-5432}"
DB_NAME="${FLEXCMS_DB_NAME:-flexcms_author}"
DB_USER="${FLEXCMS_DB_USER:-flexcms}"
DB_PASSWORD="${FLEXCMS_DB_PASSWORD:-}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --host)     DB_HOST="$2";     shift 2 ;;
    --port)     DB_PORT="$2";     shift 2 ;;
    --db)       DB_NAME="$2";     shift 2 ;;
    --user)     DB_USER="$2";     shift 2 ;;
    --password) DB_PASSWORD="$2"; shift 2 ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

export PGPASSWORD="$DB_PASSWORD"
PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

echo "======================================================"
echo " WKND Sample Website — Uninstall"
echo " Target: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "======================================================"
echo ""
echo "⚠️  This will permanently delete all WKND data from the database."
read -r -p "Type 'YES' to confirm: " CONFIRM
if [ "$CONFIRM" != "YES" ]; then
  echo "Aborted."
  exit 0
fi

$PSQL <<'SQL'
-- Remove experience fragment metadata for WKND
DELETE FROM experience_fragment_metadata WHERE site_id = 'wknd';

-- Remove all content_nodes for WKND paths
DELETE FROM content_nodes
WHERE path LIKE 'wknd%'
   OR path LIKE 'experience-fragments.wknd%';

-- Remove WKND component definitions
DELETE FROM component_definitions
WHERE resource_type LIKE 'wknd/components/%';

-- Remove WKND template definitions
DELETE FROM template_definitions
WHERE name LIKE 'wknd/templates/%';

-- Remove WKND site
DELETE FROM sites WHERE site_id = 'wknd';

-- Clean up XF root stubs (only if no other data depends on them)
DELETE FROM content_nodes WHERE path = 'experience-fragments' AND NOT EXISTS (
    SELECT 1 FROM content_nodes c2 WHERE c2.parent_path = 'experience-fragments'
);
SQL

echo ""
echo "✅  WKND sample website uninstalled successfully."
