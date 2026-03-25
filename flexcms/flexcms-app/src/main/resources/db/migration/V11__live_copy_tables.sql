-- =============================================================================
-- V11: Live Copy Relationships
-- Tracks which content nodes are live copies of a source ("blueprint") path.
-- =============================================================================

CREATE TABLE live_copy_relationships (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_path     VARCHAR(2048) NOT NULL,
    target_path     VARCHAR(2048) NOT NULL UNIQUE, -- a node can only live-copy one source
    deep            BOOLEAN NOT NULL DEFAULT TRUE,  -- TRUE = entire subtree is in sync
    excluded_props  TEXT,                           -- comma-separated property keys excluded from rollout
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lcr_source_path ON live_copy_relationships(source_path);
CREATE INDEX idx_lcr_target_path ON live_copy_relationships(target_path);
