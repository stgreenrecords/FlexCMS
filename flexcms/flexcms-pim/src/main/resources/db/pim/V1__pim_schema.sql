-- =============================================================================
-- PIM V1: Core schema — product schemas, catalogs, products, variants, assets
-- Database: flexcms_pim (separate from CMS)
-- =============================================================================

-- PRODUCT SCHEMAS (type definitions)
CREATE TABLE product_schemas (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    version           VARCHAR(64) NOT NULL,
    description       TEXT,
    schema_def        JSONB NOT NULL,
    attribute_groups  JSONB DEFAULT '[]',
    parent_id         UUID REFERENCES product_schemas(id),
    active            BOOLEAN DEFAULT TRUE,
    created_by        VARCHAR(255),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, version)
);

-- CATALOGS
CREATE TABLE catalogs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    year            INTEGER NOT NULL,
    season          VARCHAR(64),
    description     TEXT,
    schema_id       UUID NOT NULL REFERENCES product_schemas(id),
    status          VARCHAR(20) DEFAULT 'DRAFT',
    settings        JSONB DEFAULT '{}',
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_catalogs_year ON catalogs(year, status);

-- PRODUCTS
CREATE TABLE products (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku               VARCHAR(255) NOT NULL UNIQUE,
    name              VARCHAR(512) NOT NULL,
    catalog_id        UUID NOT NULL REFERENCES catalogs(id),
    schema_id         UUID NOT NULL REFERENCES product_schemas(id),
    attributes        JSONB NOT NULL DEFAULT '{}',
    status            VARCHAR(20) DEFAULT 'DRAFT',
    source_product_id UUID REFERENCES products(id),
    overridden_fields TEXT[] DEFAULT '{}',
    version           BIGINT DEFAULT 1,
    created_by        VARCHAR(255),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_by        VARCHAR(255),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_catalog ON products(catalog_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- PRODUCT VARIANTS
CREATE TABLE product_variants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_sku     VARCHAR(255) NOT NULL UNIQUE,
    attributes      JSONB NOT NULL DEFAULT '{}',
    pricing         JSONB DEFAULT '{}',
    inventory       JSONB DEFAULT '{}',
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(variant_sku);

-- PRODUCT ↔ DAM ASSET REFERENCES (loose coupling — string path, not FK)
CREATE TABLE product_asset_refs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    asset_path      VARCHAR(2048) NOT NULL,
    role            VARCHAR(64) NOT NULL DEFAULT 'gallery',
    order_index     INTEGER DEFAULT 0,
    UNIQUE(product_id, asset_path, role)
);
CREATE INDEX idx_product_assets_product ON product_asset_refs(product_id);

-- PRODUCT VERSION HISTORY
CREATE TABLE product_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version_number  BIGINT NOT NULL,
    attributes      JSONB NOT NULL,
    changed_by      VARCHAR(255),
    changed_at      TIMESTAMPTZ DEFAULT NOW(),
    change_summary  TEXT,
    UNIQUE(product_id, version_number)
);

-- IMPORT JOBS
CREATE TABLE import_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type     VARCHAR(20) NOT NULL,
    file_name       VARCHAR(512),
    mapping_profile JSONB,
    schema_id       UUID REFERENCES product_schemas(id),
    catalog_id      UUID REFERENCES catalogs(id),
    status          VARCHAR(20) DEFAULT 'PENDING',
    total_records   INTEGER DEFAULT 0,
    success_count   INTEGER DEFAULT 0,
    error_count     INTEGER DEFAULT 0,
    error_log       JSONB DEFAULT '[]',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- FIELD MAPPING PROFILES (reusable import configurations)
CREATE TABLE field_mapping_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    source_type     VARCHAR(20) NOT NULL,
    schema_id       UUID REFERENCES product_schemas(id),
    mappings        JSONB NOT NULL,
    defaults        JSONB DEFAULT '{}',
    transforms      JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

