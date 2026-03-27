-- V2: Expand product_versions with full audit-snapshot columns required by the
-- ProductVersion entity (sku, name, status, updated_by, created_at).
--
-- V1 created the table with a minimal schema (changed_by, changed_at).
-- This migration adds the missing columns idempotently so it is safe to run on
-- both fresh databases and pre-existing ones where columns were added manually.
--
-- LOCAL DEV NOTE: If Flyway reports a checksum mismatch for this file, run:
--   DELETE FROM flyway_schema_history WHERE version = '2';
-- Then restart the application — this migration will re-run idempotently.

ALTER TABLE product_versions ADD COLUMN IF NOT EXISTS sku        VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE product_versions ADD COLUMN IF NOT EXISTS name       VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE product_versions ADD COLUMN IF NOT EXISTS status     VARCHAR(50)  NOT NULL DEFAULT 'DRAFT';
ALTER TABLE product_versions ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE product_versions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ  NOT NULL DEFAULT now();

-- Backfill created_at from changed_at for any pre-existing rows
UPDATE product_versions
SET created_at = changed_at
WHERE changed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_versions_product_id ON product_versions (product_id);
CREATE INDEX IF NOT EXISTS idx_product_versions_created_at ON product_versions (product_id, created_at DESC);
