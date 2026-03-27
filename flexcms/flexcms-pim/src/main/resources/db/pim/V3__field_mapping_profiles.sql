-- V3: Evolve field_mapping_profiles to the canonical FieldMappingProfile entity schema.
-- V1 created this table with a minimal schema (schema_id, mappings).
-- This migration adds the columns the entity requires without dropping the table.

ALTER TABLE field_mapping_profiles ADD COLUMN IF NOT EXISTS description     TEXT;
ALTER TABLE field_mapping_profiles ADD COLUMN IF NOT EXISTS catalog_id      UUID;
ALTER TABLE field_mapping_profiles ADD COLUMN IF NOT EXISTS sku_field       VARCHAR(255) NOT NULL DEFAULT 'sku';
ALTER TABLE field_mapping_profiles ADD COLUMN IF NOT EXISTS name_field      VARCHAR(255) NOT NULL DEFAULT 'name';
ALTER TABLE field_mapping_profiles ADD COLUMN IF NOT EXISTS field_mappings  JSONB        NOT NULL DEFAULT '{}';
ALTER TABLE field_mapping_profiles ADD COLUMN IF NOT EXISTS update_existing BOOLEAN      NOT NULL DEFAULT TRUE;
ALTER TABLE field_mapping_profiles ADD COLUMN IF NOT EXISTS created_by      VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_field_mapping_profile_name  ON field_mapping_profiles (catalog_id, name);
CREATE INDEX        IF NOT EXISTS idx_field_mapping_profiles_catalog ON field_mapping_profiles (catalog_id);
