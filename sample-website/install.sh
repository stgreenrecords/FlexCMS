#!/usr/bin/env bash
# =============================================================================
# WKND Adventures — FlexCMS Sample Website Installer
# Usage: ./install.sh [--host localhost] [--port 5432] [--db flexcms] [--user postgres]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Defaults (override with env vars or flags)
DB_HOST="${FLEXCMS_DB_HOST:-localhost}"
DB_PORT="${FLEXCMS_DB_PORT:-5432}"
DB_NAME="${FLEXCMS_DB_NAME:-flexcms_author}"
DB_USER="${FLEXCMS_DB_USER:-flexcms}"
DB_PASSWORD="${FLEXCMS_DB_PASSWORD:-}"

# Parse CLI flags
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
echo " WKND Sample Website — Install"
echo " Target: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "======================================================"

# Idempotency check
EXISTING=$($PSQL -tAc "SELECT COUNT(*) FROM sites WHERE site_id = 'wknd'" 2>/dev/null || echo "0")
if [ "$EXISTING" -gt "0" ]; then
  echo "ℹ  WKND site already installed (site_id='wknd'). Running in update mode."
fi

DATA_DIR="$SCRIPT_DIR/data"
for SQL_FILE in \
  01_site_components.sql \
  02_templates.sql \
  03_experience_fragments.sql \
  04_home.sql \
  05_adventures.sql \
  06_magazine.sql \
  07_faqs_about.sql; do
  echo "  → Applying $SQL_FILE ..."
  $PSQL -f "$DATA_DIR/$SQL_FILE"
done

echo ""
echo "✅  WKND sample website installed successfully."
echo ""
echo "Start the WKND frontend:"
echo "  cd $SCRIPT_DIR/frontend"
echo "  npm install && npm run dev"
echo ""
echo "Open: http://localhost:3100"
