-- Named, reusable field mapping profiles for product imports.
-- A profile stores the mapping between source field names and schema attributes,
-- along with optional default values and transforms.

CREATE TABLE field_mapping_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    source_type     VARCHAR(50)     NOT NULL,   -- CSV, EXCEL, JSON, API
    catalog_id      UUID            NOT NULL,
    sku_field       VARCHAR(255)    NOT NULL DEFAULT 'sku',
    name_field      VARCHAR(255)    NOT NULL DEFAULT 'name',
    field_mappings  JSONB           NOT NULL DEFAULT '{}',  -- {sourceField: schemaAttr}
    defaults        JSONB           NOT NULL DEFAULT '{}',  -- {schemaAttr: defaultValue}
    transforms      JSONB           NOT NULL DEFAULT '{}',  -- {schemaAttr: transform}
    update_existing BOOLEAN         NOT NULL DEFAULT TRUE,
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT uq_field_mapping_profile_name UNIQUE (catalog_id, name)
);

CREATE INDEX idx_field_mapping_profiles_catalog ON field_mapping_profiles (catalog_id);
