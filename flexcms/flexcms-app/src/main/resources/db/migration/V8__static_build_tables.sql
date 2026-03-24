-- =============================================================================
-- V8: Static Site Compilation — build jobs, page output tracking, dependency graph
-- Supports incremental warm-up compilation where only changed pages are rebuilt.
-- =============================================================================

-- Build jobs — tracks each compilation run
CREATE TABLE static_build_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id         VARCHAR(64) NOT NULL REFERENCES sites(site_id),
    locale          VARCHAR(10) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    trigger_event   VARCHAR(20) NOT NULL,
    trigger_path    VARCHAR(2048),
    pages_total     INTEGER DEFAULT 0,
    pages_completed INTEGER DEFAULT 0,
    pages_failed    INTEGER DEFAULT 0,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_build_jobs_site ON static_build_jobs(site_id, locale, status);
CREATE INDEX idx_build_jobs_created ON static_build_jobs(created_at DESC);

COMMENT ON TABLE static_build_jobs IS 'Tracks static site compilation jobs triggered by content publish events';

-- Per-page build output — the persisted manifest
CREATE TABLE static_build_pages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id         VARCHAR(64) NOT NULL,
    locale          VARCHAR(10) NOT NULL,
    page_path       VARCHAR(2048) NOT NULL,
    content_version BIGINT NOT NULL,
    output_hash     VARCHAR(64) NOT NULL,
    s3_key          VARCHAR(2048) NOT NULL,
    file_size       BIGINT,
    built_at        TIMESTAMPTZ NOT NULL,
    build_job_id    UUID REFERENCES static_build_jobs(id),
    UNIQUE(site_id, locale, page_path)
);

CREATE INDEX idx_build_pages_site ON static_build_pages(site_id, locale);

COMMENT ON TABLE static_build_pages IS 'Tracks the compiled output for each page — used for incremental builds and cache invalidation';

-- Dependency graph: page → component/asset/navigation/config
CREATE TABLE static_build_dependencies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id         VARCHAR(64) NOT NULL,
    locale          VARCHAR(10) NOT NULL,
    page_path       VARCHAR(2048) NOT NULL,
    depends_on_type VARCHAR(20) NOT NULL,
    depends_on_key  VARCHAR(2048) NOT NULL,
    UNIQUE(site_id, locale, page_path, depends_on_type, depends_on_key)
);

CREATE INDEX idx_build_deps_key ON static_build_dependencies(depends_on_type, depends_on_key);
CREATE INDEX idx_build_deps_page ON static_build_dependencies(site_id, locale, page_path);

COMMENT ON TABLE static_build_dependencies IS 'Dependency graph for incremental compilation — maps pages to the components/assets they depend on';

