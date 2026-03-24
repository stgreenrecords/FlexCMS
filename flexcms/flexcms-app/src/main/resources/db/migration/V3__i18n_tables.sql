-- =============================================================================
-- V3: i18n Tables
-- =============================================================================

CREATE TABLE i18n_dictionaries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id         VARCHAR(64),
    locale          VARCHAR(10) NOT NULL,
    key             VARCHAR(512) NOT NULL,
    value           TEXT NOT NULL,
    context         VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, locale, key)
);

CREATE INDEX idx_i18n_lookup ON i18n_dictionaries(key, locale);
CREATE INDEX idx_i18n_site_locale ON i18n_dictionaries(site_id, locale);

CREATE TABLE language_copies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_path     VARCHAR(2048) NOT NULL,
    target_path     VARCHAR(2048) NOT NULL,
    source_locale   VARCHAR(10) NOT NULL,
    target_locale   VARCHAR(10) NOT NULL,
    sync_status     VARCHAR(20) DEFAULT 'IN_SYNC',
    last_synced_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE live_copies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_path     VARCHAR(2048) NOT NULL,
    target_path     VARCHAR(2048) NOT NULL,
    auto_sync       BOOLEAN DEFAULT TRUE,
    allow_overrides BOOLEAN DEFAULT TRUE,
    overridden_properties TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

