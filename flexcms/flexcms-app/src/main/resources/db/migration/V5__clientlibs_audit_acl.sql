-- =============================================================================
-- V5: Client Libraries, Audit, Access Control
-- =============================================================================

-- CLIENT LIBRARIES
CREATE TABLE client_libraries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL UNIQUE,
    category        VARCHAR(64),
    version         VARCHAR(64),
    dependencies    TEXT[],
    embeds          TEXT[],
    css_files       TEXT[],
    js_files        TEXT[],
    compiled_css_key VARCHAR(1024),
    compiled_js_key VARCHAR(1024),
    css_hash        VARCHAR(16),
    js_hash         VARCHAR(16),
    last_compiled   TIMESTAMPTZ,
    minified        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT TRAIL
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type     VARCHAR(64) NOT NULL,
    entity_id       UUID,
    entity_path     VARCHAR(2048),
    action          VARCHAR(32) NOT NULL,
    user_id         VARCHAR(255) NOT NULL,
    changes         JSONB,
    timestamp       TIMESTAMPTZ DEFAULT NOW(),
    ip_address      VARCHAR(45),
    user_agent      TEXT
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);

-- ACCESS CONTROL (per-node ACLs)
CREATE TABLE node_acls (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_path       VARCHAR(2048) NOT NULL,
    principal       VARCHAR(255) NOT NULL,
    permissions     TEXT[] NOT NULL,
    allow           BOOLEAN DEFAULT TRUE,
    inherit         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_acls_principal ON node_acls(principal);

