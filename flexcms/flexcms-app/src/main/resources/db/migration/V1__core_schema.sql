-- =============================================================================
-- V1: Core Schema - Extensions, Sites, Content Nodes, Versions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- SITES
CREATE TABLE sites (
    site_id         VARCHAR(64) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    content_root    VARCHAR(512) NOT NULL,
    dam_root        VARCHAR(512) NOT NULL,
    config_root     VARCHAR(512) NOT NULL,
    default_locale  VARCHAR(10) DEFAULT 'en',
    supported_locales TEXT DEFAULT 'en',
    allowed_templates TEXT,
    settings        JSONB DEFAULT '{}',
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- DOMAIN MAPPINGS
CREATE TABLE domain_mappings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain          VARCHAR(255) NOT NULL UNIQUE,
    site_id         VARCHAR(64) NOT NULL REFERENCES sites(site_id),
    locale          VARCHAR(10),
    path_prefix     VARCHAR(64),
    is_primary      BOOLEAN DEFAULT FALSE,
    https_required  BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_domain_mappings_domain ON domain_mappings(domain);

-- CONTENT NODES
CREATE TABLE content_nodes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path            VARCHAR(2048) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    resource_type   VARCHAR(255) NOT NULL,
    parent_path     VARCHAR(2048),
    order_index     INTEGER DEFAULT 0,
    properties      JSONB DEFAULT '{}',
    version         BIGINT DEFAULT 1,
    status          VARCHAR(20) DEFAULT 'DRAFT',
    locked_by       VARCHAR(255),
    locked_at       TIMESTAMPTZ,
    site_id         VARCHAR(64) REFERENCES sites(site_id),
    locale          VARCHAR(10),
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    modified_by     VARCHAR(255),
    modified_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_nodes_parent ON content_nodes(parent_path);
CREATE INDEX idx_content_nodes_site_locale ON content_nodes(site_id, locale);
CREATE INDEX idx_content_nodes_resource_type ON content_nodes(resource_type);
CREATE INDEX idx_content_nodes_status ON content_nodes(status);
CREATE INDEX idx_content_nodes_properties ON content_nodes USING GIN (properties);
CREATE INDEX idx_content_nodes_modified ON content_nodes(modified_at DESC);
CREATE INDEX idx_content_nodes_path_prefix ON content_nodes(path varchar_pattern_ops);

-- VERSION HISTORY
CREATE TABLE content_node_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id         UUID NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
    version_number  BIGINT NOT NULL,
    properties      JSONB NOT NULL,
    resource_type   VARCHAR(255) NOT NULL,
    status          VARCHAR(20),
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    version_label   VARCHAR(255),
    change_summary  TEXT,
    UNIQUE(node_id, version_number)
);

CREATE INDEX idx_versions_node_id ON content_node_versions(node_id);
CREATE INDEX idx_versions_created ON content_node_versions(created_at DESC);

