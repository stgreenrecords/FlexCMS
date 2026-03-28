#!/usr/bin/env bash
# =============================================================================
# FlexCMS — Initialize RDS databases and extensions
# Run ONCE after the first CloudFormation deployment.
# Requires: psql, AWS CLI, network access to RDS (via SSM tunnel or VPN)
#
# NOTE: The ECS init containers (db-init) in main.yml now handle database
# creation automatically on task start. This script is kept as a fallback
# and for manual extensions setup.
# =============================================================================
set -euo pipefail

ENV="${1:?Usage: $0 <qa|prod> <rds-endpoint> [db-password]}"
RDS_ENDPOINT="${2:?Usage: $0 <qa|prod> <rds-endpoint> [db-password]}"
DB_PASSWORD="${3:-${FLEXCMS_DB_PASSWORD:-}}"

if [[ -z "$DB_PASSWORD" ]]; then
  read -rsp "Enter RDS master password: " DB_PASSWORD
  echo
fi

export PGPASSWORD="$DB_PASSWORD"

echo "=== Initializing RDS databases for flexcms-${ENV} ==="
echo "  Endpoint: ${RDS_ENDPOINT}"

# Create databases (connect to 'postgres' — the default DB created by RDS)
echo ">>> Creating flexcms_author database..."
psql -h "$RDS_ENDPOINT" -U flexcms -d postgres -c "CREATE DATABASE flexcms_author;" 2>/dev/null || echo "  (already exists)"

echo ">>> Creating flexcms_publish database..."
psql -h "$RDS_ENDPOINT" -U flexcms -d postgres -c "CREATE DATABASE flexcms_publish;" 2>/dev/null || echo "  (already exists)"

echo ">>> Creating flexcms_pim database..."
psql -h "$RDS_ENDPOINT" -U flexcms -d postgres -c "CREATE DATABASE flexcms_pim;" 2>/dev/null || echo "  (already exists)"

# Enable extensions on each database
for DB in flexcms_author flexcms_publish; do
  echo ">>> Enabling extensions on ${DB}..."
  psql -h "$RDS_ENDPOINT" -U flexcms -d "$DB" -c "
    CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
    CREATE EXTENSION IF NOT EXISTS \"ltree\";
    CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";
  "
done

echo ">>> Enabling extensions on flexcms_pim..."
psql -h "$RDS_ENDPOINT" -U flexcms -d flexcms_pim -c "
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
  CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";
"

echo "=== RDS initialization complete ==="
