# Database Schema & Data Model

## 1. PostgreSQL Schema

### 1.1 Extension Requirements

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";       -- Hierarchical path queries
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Trigram text search
```

### 1.2 Core Content Tables

```sql
-- =============================================================================
-- SITES
-- =============================================================================
CREATE TABLE sites (
    site_id         VARCHAR(64) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    content_root    VARCHAR(512) NOT NULL,       -- "/content/corporate"
    dam_root        VARCHAR(512) NOT NULL,       -- "/dam/corporate"
    config_root     VARCHAR(512) NOT NULL,       -- "/conf/corporate"
    default_locale  VARCHAR(10) DEFAULT 'en',
    supported_locales TEXT[] DEFAULT ARRAY['en'], -- {"en","fr","de"}
    allowed_templates TEXT[],
    settings        JSONB DEFAULT '{}',
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE domain_mappings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain          VARCHAR(255) NOT NULL UNIQUE,
    site_id         VARCHAR(64) NOT NULL REFERENCES sites(site_id),
    locale          VARCHAR(10),                 -- NULL = resolve from path
    path_prefix     VARCHAR(64),                 -- "/us", "/uk"
    is_primary      BOOLEAN DEFAULT FALSE,
    https_required  BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_domain_mappings_domain ON domain_mappings(domain);

-- =============================================================================
-- CONTENT NODES (core content tree)
-- =============================================================================
CREATE TABLE content_nodes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path            LTREE NOT NULL UNIQUE,       -- "content.corporate.en.homepage.jcr_content.hero"
    name            VARCHAR(255) NOT NULL,        -- "hero" (last segment)
    resource_type   VARCHAR(255) NOT NULL,        -- "myapp/hero-banner"
    parent_path     LTREE,
    order_index     INTEGER DEFAULT 0,
    properties      JSONB DEFAULT '{}',
    version         BIGINT DEFAULT 1,
    status          VARCHAR(20) DEFAULT 'DRAFT',  -- DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED
    locked_by       VARCHAR(255),                 -- User who has edit lock
    locked_at       TIMESTAMPTZ,
    site_id         VARCHAR(64) REFERENCES sites(site_id),
    locale          VARCHAR(10),
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    modified_by     VARCHAR(255),
    modified_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Path hierarchy queries (find all children, ancestors, siblings)
CREATE INDEX idx_content_nodes_path_gist ON content_nodes USING GIST (path);
CREATE INDEX idx_content_nodes_parent ON content_nodes(parent_path);
CREATE INDEX idx_content_nodes_site_locale ON content_nodes(site_id, locale);
CREATE INDEX idx_content_nodes_resource_type ON content_nodes(resource_type);
CREATE INDEX idx_content_nodes_status ON content_nodes(status);
CREATE INDEX idx_content_nodes_properties ON content_nodes USING GIN (properties);
CREATE INDEX idx_content_nodes_modified ON content_nodes(modified_at DESC);

-- =============================================================================
-- VERSION HISTORY
-- =============================================================================
CREATE TABLE content_node_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id         UUID NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
    version_number  BIGINT NOT NULL,
    properties      JSONB NOT NULL,
    resource_type   VARCHAR(255) NOT NULL,
    status          VARCHAR(20),
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    version_label   VARCHAR(255),                 -- "1.0", "published-2025-01-15"
    change_summary  TEXT,

    UNIQUE(node_id, version_number)
);

CREATE INDEX idx_versions_node_id ON content_node_versions(node_id);
CREATE INDEX idx_versions_created ON content_node_versions(created_at DESC);

-- =============================================================================
-- WORKFLOWS
-- =============================================================================
CREATE TABLE workflow_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(128) UNIQUE NOT NULL,
    title           VARCHAR(255),
    description     TEXT,
    definition      JSONB NOT NULL,               -- Full workflow JSON (steps, transitions)
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_instances (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name   VARCHAR(128) NOT NULL REFERENCES workflow_definitions(name),
    content_path    LTREE NOT NULL,
    content_node_id UUID REFERENCES content_nodes(id),
    current_step_id VARCHAR(64) NOT NULL,
    previous_step_id VARCHAR(64),
    status          VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
    started_by      VARCHAR(255),
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    last_action     VARCHAR(64),
    last_action_by  VARCHAR(255),
    last_action_at  TIMESTAMPTZ,
    last_comment    TEXT,
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_workflow_instances_path ON workflow_instances(content_path);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_workflow_instances_step ON workflow_instances(current_step_id);

-- =============================================================================
-- REPLICATION
-- =============================================================================
CREATE TABLE replication_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID NOT NULL,
    action          VARCHAR(20) NOT NULL,         -- ACTIVATE, DEACTIVATE, DELETE
    content_path    LTREE NOT NULL,
    node_id         UUID,
    version         BIGINT,
    site_id         VARCHAR(64),
    locale          VARCHAR(10),
    replication_type VARCHAR(20),                 -- CONTENT, ASSET, TREE
    status          VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED
    initiated_by    VARCHAR(255),
    initiated_at    TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0
);

CREATE INDEX idx_replication_log_status ON replication_log(status);
CREATE INDEX idx_replication_log_path ON replication_log(content_path);
CREATE INDEX idx_replication_log_initiated ON replication_log(initiated_at DESC);
```

### 1.3 DAM Tables

```sql
-- =============================================================================
-- DIGITAL ASSET MANAGEMENT
-- =============================================================================
CREATE TABLE assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path            VARCHAR(1024) NOT NULL UNIQUE, -- "/dam/corporate/images/hero.jpg"
    name            VARCHAR(255) NOT NULL,
    title           VARCHAR(512),
    description     TEXT,
    mime_type       VARCHAR(128) NOT NULL,
    file_size       BIGINT,
    original_filename VARCHAR(512),
    storage_key     VARCHAR(1024) NOT NULL,        -- S3 object key
    storage_bucket  VARCHAR(255),
    width           INTEGER,
    height          INTEGER,
    color_space     VARCHAR(32),
    aspect_ratio    DOUBLE PRECISION,
    duration        DOUBLE PRECISION,              -- Video duration in seconds
    video_codec     VARCHAR(32),
    audio_codec     VARCHAR(32),
    frame_rate      INTEGER,
    metadata        JSONB DEFAULT '{}',            -- EXIF, IPTC, XMP, custom
    tags            TEXT[] DEFAULT ARRAY[]::TEXT[],
    site_id         VARCHAR(64) REFERENCES sites(site_id),
    folder_path     VARCHAR(1024),
    status          VARCHAR(20) DEFAULT 'PROCESSING', -- PROCESSING, ACTIVE, ARCHIVED, DELETED
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    modified_by     VARCHAR(255),
    modified_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_path ON assets(path);
CREATE INDEX idx_assets_site ON assets(site_id);
CREATE INDEX idx_assets_folder ON assets(folder_path);
CREATE INDEX idx_assets_mime ON assets(mime_type);
CREATE INDEX idx_assets_tags ON assets USING GIN (tags);
CREATE INDEX idx_assets_metadata ON assets USING GIN (metadata);
CREATE INDEX idx_assets_status ON assets(status);

CREATE TABLE asset_renditions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    rendition_key   VARCHAR(64) NOT NULL,          -- "thumbnail", "web-large"
    storage_key     VARCHAR(1024) NOT NULL,
    mime_type       VARCHAR(128),
    file_size       BIGINT,
    width           INTEGER,
    height          INTEGER,
    format          VARCHAR(16),                   -- "webp", "avif", "jpeg"
    generated_at    TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(asset_id, rendition_key)
);

CREATE INDEX idx_renditions_asset ON asset_renditions(asset_id);

CREATE TABLE asset_references (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    content_node_path LTREE NOT NULL,
    property_name   VARCHAR(128) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asset_refs_asset ON asset_references(asset_id);
CREATE INDEX idx_asset_refs_node ON asset_references(content_node_path);

CREATE TABLE dam_folders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path            VARCHAR(1024) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    parent_path     VARCHAR(1024),
    site_id         VARCHAR(64) REFERENCES sites(site_id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.4 i18n Tables

```sql
-- =============================================================================
-- INTERNATIONALIZATION
-- =============================================================================
CREATE TABLE i18n_dictionaries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id         VARCHAR(64),                   -- NULL = global
    locale          VARCHAR(10) NOT NULL,
    key             VARCHAR(512) NOT NULL,
    value           TEXT NOT NULL,
    context         VARCHAR(255),                  -- "component.hero", "page.common"
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(site_id, locale, key)
);

CREATE INDEX idx_i18n_lookup ON i18n_dictionaries(key, locale);
CREATE INDEX idx_i18n_site_locale ON i18n_dictionaries(site_id, locale);

CREATE TABLE language_copies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_path     LTREE NOT NULL,
    target_path     LTREE NOT NULL,
    source_locale   VARCHAR(10) NOT NULL,
    target_locale   VARCHAR(10) NOT NULL,
    sync_status     VARCHAR(20) DEFAULT 'IN_SYNC', -- IN_SYNC, OUTDATED, TRANSLATING
    last_synced_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Live copies (cross-site content sharing)
CREATE TABLE live_copies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_path     LTREE NOT NULL,
    target_path     LTREE NOT NULL,
    auto_sync       BOOLEAN DEFAULT TRUE,
    allow_overrides BOOLEAN DEFAULT TRUE,
    overridden_properties TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 ClientLib Tables

```sql
-- =============================================================================
-- CLIENT LIBRARIES
-- =============================================================================
CREATE TABLE client_libraries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL UNIQUE,  -- "myapp.hero-banner"
    category        VARCHAR(64),                   -- "components", "vendor", "page"
    version         VARCHAR(64),
    dependencies    TEXT[] DEFAULT ARRAY[]::TEXT[],
    embeds          TEXT[] DEFAULT ARRAY[]::TEXT[],
    css_files       TEXT[] DEFAULT ARRAY[]::TEXT[],
    js_files        TEXT[] DEFAULT ARRAY[]::TEXT[],
    compiled_css_key VARCHAR(1024),
    compiled_js_key VARCHAR(1024),
    css_hash        VARCHAR(16),
    js_hash         VARCHAR(16),
    last_compiled   TIMESTAMPTZ,
    minified        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.6 Component & Template Registry Tables

```sql
-- =============================================================================
-- COMPONENT REGISTRY
-- =============================================================================
CREATE TABLE component_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type   VARCHAR(255) NOT NULL UNIQUE,  -- "myapp/hero-banner"
    name            VARCHAR(128) NOT NULL,
    title           VARCHAR(255),
    description     TEXT,
    group_name      VARCHAR(64),                   -- "Marketing", "Layout", "Commerce"
    icon            VARCHAR(64),
    is_container    BOOLEAN DEFAULT FALSE,
    dialog          JSONB,                         -- Dialog definition JSON
    policies        JSONB DEFAULT '{}',
    client_lib      VARCHAR(255),                  -- Associated clientlib name
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(128) NOT NULL UNIQUE,
    title           VARCHAR(255),
    description     TEXT,
    thumbnail       VARCHAR(512),
    resource_type   VARCHAR(255) DEFAULT 'flexcms/page',
    structure       JSONB NOT NULL,                -- Template structure JSON
    initial_content JSONB,
    page_properties JSONB,                         -- Page dialog definition
    allowed_sites   TEXT[],
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.7 Audit & Access Control

```sql
-- =============================================================================
-- AUDIT TRAIL
-- =============================================================================
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type     VARCHAR(64) NOT NULL,          -- "content_node", "asset", "site"
    entity_id       UUID,
    entity_path     LTREE,
    action          VARCHAR(32) NOT NULL,          -- CREATE, UPDATE, DELETE, PUBLISH, etc.
    user_id         VARCHAR(255) NOT NULL,
    changes         JSONB,                         -- Diff of what changed
    timestamp       TIMESTAMPTZ DEFAULT NOW(),
    ip_address      VARCHAR(45),
    user_agent      TEXT
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_path ON audit_log USING GIST (entity_path);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);

-- Partition audit log by month for performance
-- CREATE TABLE audit_log_2025_01 PARTITION OF audit_log
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- =============================================================================
-- ACCESS CONTROL (per-node ACLs)
-- =============================================================================
CREATE TABLE node_acls (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_path       LTREE NOT NULL,
    principal       VARCHAR(255) NOT NULL,         -- "user:john", "role:content-author"
    permissions     TEXT[] NOT NULL,               -- {"read","write","delete","publish"}
    allow           BOOLEAN DEFAULT TRUE,          -- TRUE = allow, FALSE = deny
    inherit         BOOLEAN DEFAULT TRUE,          -- Inherit to descendants?
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_acls_path ON node_acls USING GIST (node_path);
CREATE INDEX idx_acls_principal ON node_acls(principal);
```

---

## 2. Key PostgreSQL Queries

### 2.1 Content Tree Queries Using ltree

```sql
-- Get all children of a node (1 level deep)
SELECT * FROM content_nodes
WHERE parent_path = 'content.corporate.en.homepage.jcr_content'
ORDER BY order_index;

-- Get all descendants (full subtree)
SELECT * FROM content_nodes
WHERE path <@ 'content.corporate.en.homepage'
ORDER BY path;

-- Get ancestors (breadcrumb)
SELECT * FROM content_nodes
WHERE path @> 'content.corporate.en.products.product_a'
ORDER BY nlevel(path);

-- Get siblings
SELECT * FROM content_nodes
WHERE parent_path = (
    SELECT parent_path FROM content_nodes
    WHERE path = 'content.corporate.en.about'
)
ORDER BY order_index;

-- Find all pages of a specific template
SELECT cn.* FROM content_nodes cn
WHERE cn.resource_type = 'flexcms/page'
  AND cn.properties->>'template' = 'marketing-landing-page'
  AND cn.site_id = 'corporate';

-- Full-text search in content properties
SELECT * FROM content_nodes
WHERE properties::text ILIKE '%search term%'
  AND site_id = 'corporate'
  AND locale = 'en';

-- Find nodes by JSON property
SELECT * FROM content_nodes
WHERE properties @> '{"theme": "dark"}'
  AND resource_type = 'myapp/hero-banner';
```

---

## 3. Database Migration Strategy

Using Flyway for schema migrations:

```
db/migration/
├── V1__initial_schema.sql
├── V2__add_dam_tables.sql
├── V3__add_i18n_tables.sql
├── V4__add_clientlib_tables.sql
├── V5__add_audit_and_acl.sql
├── V6__add_workflow_tables.sql
└── V7__add_replication_tables.sql
```

```java
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy migrationStrategy() {
        return flyway -> {
            flyway.repair(); // Fix checksum mismatches
            flyway.migrate();
        };
    }
}
```
