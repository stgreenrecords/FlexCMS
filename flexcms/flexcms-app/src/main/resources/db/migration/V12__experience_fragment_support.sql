-- =============================================================================
-- V12: Experience Fragments — component registry + XF metadata table
-- =============================================================================

-- Register built-in Experience Fragment component types
INSERT INTO component_definitions (id, resource_type, name, title, description, group_name, icon, is_container, active)
VALUES
    (uuid_generate_v4(),
     'flexcms/xf-folder',
     'xf-folder',
     'Experience Fragment',
     'Root node of an Experience Fragment. Contains one or more named variations (master, mobile, email, etc.).',
     'Experience Fragments',
     'fragment',
     FALSE,
     TRUE),

    (uuid_generate_v4(),
     'flexcms/xf-page',
     'xf-page',
     'Experience Fragment Variation',
     'A single variation of an Experience Fragment. Children are the actual content components of this variation.',
     'Experience Fragments',
     'fragment-variation',
     TRUE,
     TRUE),

    (uuid_generate_v4(),
     'flexcms/experience-fragment',
     'experience-fragment',
     'Experience Fragment Reference',
     'Embeds an Experience Fragment variation inline in any page or other XF. '
     || 'Property fragmentPath must point to a flexcms/xf-page node.',
     'Content',
     'link',
     FALSE,
     TRUE);

-- ---------------------------------------------------------------------------
-- Separate metadata table — tracks XF roots for fast admin-UI listing without
-- scanning the full content_nodes tree. Kept in sync by ExperienceFragmentService.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experience_fragment_metadata (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    xf_path         VARCHAR(2048) NOT NULL UNIQUE,   -- path of flexcms/xf-folder node
    site_id         VARCHAR(64)  REFERENCES sites(site_id) ON DELETE CASCADE,
    locale          VARCHAR(10),
    title           VARCHAR(255),
    description     TEXT,
    tags            TEXT[],
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xf_meta_site_locale ON experience_fragment_metadata(site_id, locale);
CREATE INDEX idx_xf_meta_updated    ON experience_fragment_metadata(updated_at DESC);

