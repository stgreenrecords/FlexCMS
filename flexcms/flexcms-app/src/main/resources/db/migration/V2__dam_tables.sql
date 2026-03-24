-- =============================================================================
-- V2: DAM Tables
-- =============================================================================

CREATE TABLE assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path            VARCHAR(1024) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    title           VARCHAR(512),
    description     TEXT,
    mime_type       VARCHAR(128) NOT NULL,
    file_size       BIGINT,
    original_filename VARCHAR(512),
    storage_key     VARCHAR(1024) NOT NULL,
    storage_bucket  VARCHAR(255),
    width           INTEGER,
    height          INTEGER,
    color_space     VARCHAR(32),
    aspect_ratio    DOUBLE PRECISION,
    duration        DOUBLE PRECISION,
    video_codec     VARCHAR(32),
    audio_codec     VARCHAR(32),
    frame_rate      INTEGER,
    metadata        JSONB DEFAULT '{}',
    site_id         VARCHAR(64) REFERENCES sites(site_id),
    folder_path     VARCHAR(1024),
    status          VARCHAR(20) DEFAULT 'PROCESSING',
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    modified_by     VARCHAR(255),
    modified_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_path ON assets(path);
CREATE INDEX idx_assets_site ON assets(site_id);
CREATE INDEX idx_assets_folder ON assets(folder_path);
CREATE INDEX idx_assets_mime ON assets(mime_type);
CREATE INDEX idx_assets_metadata ON assets USING GIN (metadata);
CREATE INDEX idx_assets_status ON assets(status);

CREATE TABLE asset_renditions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    rendition_key   VARCHAR(64) NOT NULL,
    storage_key     VARCHAR(1024) NOT NULL,
    mime_type       VARCHAR(128),
    file_size       BIGINT,
    width           INTEGER,
    height          INTEGER,
    format          VARCHAR(16),
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asset_id, rendition_key)
);

CREATE INDEX idx_renditions_asset ON asset_renditions(asset_id);

CREATE TABLE asset_references (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    content_node_path VARCHAR(2048) NOT NULL,
    property_name   VARCHAR(128) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asset_refs_asset ON asset_references(asset_id);

CREATE TABLE dam_folders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path            VARCHAR(1024) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    parent_path     VARCHAR(1024),
    site_id         VARCHAR(64) REFERENCES sites(site_id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

