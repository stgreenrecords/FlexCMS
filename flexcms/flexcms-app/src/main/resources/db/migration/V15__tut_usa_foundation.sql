-- =============================================================================
-- V15: TUT USA Foundation — Clean Old TUT Data + New TUT USA Site Skeleton
-- =============================================================================
-- 1. Remove all old TUT component definitions (resource_type LIKE 'tut/%')
-- 2. Remove old TUT content nodes and XF metadata (tut-gb/de/fr/ca data from V14)
-- 3. Register the new TUT USA site
-- 4. Seed the L0 root + 9 L1 content nodes for TUT USA
-- 5. Create the global Experience Fragment hierarchy (navigation + footer, DRAFT)
-- =============================================================================

-- ─── 1. CLEAN OLD COMPONENT DEFINITIONS ─────────────────────────────────────
-- Remove the 18 old TUT sample-site component definitions (tut/hero-banner, etc.)
DELETE FROM component_definitions WHERE resource_type LIKE 'tut/%';

-- ─── 2. CLEAN OLD XF METADATA ────────────────────────────────────────────────
-- Remove XF metadata for all old tut-* sites
DELETE FROM experience_fragment_metadata
WHERE xf_path LIKE 'content.experience-fragments.tut-gb%'
   OR xf_path LIKE 'content.experience-fragments.tut-de%'
   OR xf_path LIKE 'content.experience-fragments.tut-fr%'
   OR xf_path LIKE 'content.experience-fragments.tut-ca%';

-- ─── 3. CLEAN OLD CONTENT NODES ──────────────────────────────────────────────
-- Delete all content nodes belonging to the old TUT European sites.
-- This covers:
--   content.tut-gb.*, content.tut-de.*, content.tut-fr.*, content.tut-ca.*
--   content.experience-fragments.tut-gb.*, etc.
-- content_node_versions cascade-deletes via FK ON DELETE CASCADE.
DELETE FROM content_nodes
WHERE path LIKE 'content.tut-gb%'
   OR path LIKE 'content.tut-de%'
   OR path LIKE 'content.tut-fr%'
   OR path LIKE 'content.tut-ca%'
   OR path LIKE 'content.experience-fragments.tut-gb%'
   OR path LIKE 'content.experience-fragments.tut-de%'
   OR path LIKE 'content.experience-fragments.tut-fr%'
   OR path LIKE 'content.experience-fragments.tut-ca%';

-- ─── 4. TUT USA SITE ─────────────────────────────────────────────────────────
INSERT INTO sites (site_id, title, description, content_root, dam_root, config_root,
                   default_locale, supported_locales, active)
VALUES (
    'tut-usa',
    'TUT United States',
    'TUT luxury automobiles — USA market',
    'content.tut-usa',
    'dam.tut-usa',
    'config.tut-usa',
    'en',
    'en',
    TRUE
)
ON CONFLICT (site_id) DO NOTHING;

-- Domain mappings for TUT USA
INSERT INTO domain_mappings (id, domain, site_id, locale, is_primary) VALUES
    (uuid_generate_v4(), 'www.tutmotors.com',    'tut-usa', 'en', TRUE),
    (uuid_generate_v4(), 'tut-usa.localhost',    'tut-usa', 'en', FALSE)
ON CONFLICT (domain) DO NOTHING;

-- ─── 5. TUT USA CONTENT TREE — L0 ROOT ───────────────────────────────────────
-- Ensure the global content root exists (system node — idempotent)
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES (uuid_generate_v4(), 'content', 'content', 'flexcms/container', NULL, 0,
        '{}'::jsonb, 1, 'PUBLISHED', NULL, NULL, 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- Ensure the experience-fragments root node exists (system node — idempotent)
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES (uuid_generate_v4(), 'content.experience-fragments', 'experience-fragments',
        'flexcms/container', 'content', 0, '{}'::jsonb, 1, 'PUBLISHED', NULL, NULL, 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- L0: TUT USA website root
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES (
    uuid_generate_v4(),
    'content.tut-usa',
    'tut-usa',
    'flexcms/site-root',
    'content',
    10,
    '{"jcr:title":"TUT USA Website Root","siteId":"tut-usa"}'::jsonb,
    1,
    'DRAFT',
    'tut-usa',
    'en',
    'system',
    'system'
)
ON CONFLICT (path) DO NOTHING;

-- ─── 6. TUT USA CONTENT TREE — L1 PRIMARY SECTIONS ──────────────────────────
-- 9 L1 section landing pages placed directly under the site root.
-- Status is DRAFT — to be published when content is authored.
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES
    -- Home — Premium entry page
    (uuid_generate_v4(),
     'content.tut-usa.home', 'home', 'flexcms/page', 'content.tut-usa', 0,
     '{"jcr:title":"Home","siteId":"tut-usa","template":"global-home-page"}'::jsonb,
     1, 'DRAFT', 'tut-usa', 'en', 'system', 'system'),

    -- Vehicles — Vehicle portfolio section
    (uuid_generate_v4(),
     'content.tut-usa.vehicles', 'vehicles', 'flexcms/page', 'content.tut-usa', 1,
     '{"jcr:title":"Vehicles","siteId":"tut-usa","template":"model-overview-page"}'::jsonb,
     1, 'DRAFT', 'tut-usa', 'en', 'system', 'system'),

    -- Innovation — Technology and engineering editorial
    (uuid_generate_v4(),
     'content.tut-usa.innovation', 'innovation', 'flexcms/page', 'content.tut-usa', 2,
     '{"jcr:title":"Innovation","siteId":"tut-usa","template":"innovation-hub-page"}'::jsonb,
     1, 'DRAFT', 'tut-usa', 'en', 'system', 'system'),

    -- News & Updates — Publishing hub
    (uuid_generate_v4(),
     'content.tut-usa.news-and-updates', 'news-and-updates', 'flexcms/page', 'content.tut-usa', 3,
     '{"jcr:title":"News & Updates","siteId":"tut-usa","template":"news-updates-landing-page"}'::jsonb,
     1, 'DRAFT', 'tut-usa', 'en', 'system', 'system'),

    -- Owners — Ownership support hub
    (uuid_generate_v4(),
     'content.tut-usa.owners', 'owners', 'flexcms/page', 'content.tut-usa', 4,
     '{"jcr:title":"Owners","siteId":"tut-usa","template":"owners-hub-landing-page"}'::jsonb,
     1, 'DRAFT', 'tut-usa', 'en', 'system', 'system'),

    -- Offers & Finance — Retail and finance landing
    (uuid_generate_v4(),
     'content.tut-usa.offers-and-finance', 'offers-and-finance', 'flexcms/page', 'content.tut-usa', 5,
     '{"jcr:title":"Offers & Finance","siteId":"tut-usa","template":"offers-financing-leasing-page"}'::jsonb,
     1, 'DRAFT', 'tut-usa', 'en', 'system', 'system'),

    -- Accessories — Accessories and lifestyle collections
    (uuid_generate_v4(),
     'content.tut-usa.accessories', 'accessories', 'flexcms/page', 'content.tut-usa', 6,
     '{"jcr:title":"Accessories","siteId":"tut-usa","template":"accessories-lifestyle-collection-page"}'::jsonb,
     1, 'DRAFT', 'tut-usa', 'en', 'system', 'system'),

    -- Learn — Educational content hub
    (uuid_generate_v4(),
     'content.tut-usa.learn', 'learn', 'flexcms/page', 'content.tut-usa', 7,
     '{"jcr:title":"Learn","siteId":"tut-usa","template":"learning-education-hub-page"}'::jsonb,
     1, 'DRAFT', 'tut-usa', 'en', 'system', 'system'),

    -- Contact & Concierge — Premium support entry
    (uuid_generate_v4(),
     'content.tut-usa.contact-and-concierge', 'contact-and-concierge', 'flexcms/page', 'content.tut-usa', 8,
     '{"jcr:title":"Contact & Concierge","siteId":"tut-usa","template":"contact-concierge-support-page"}'::jsonb,
     1, 'DRAFT', 'tut-usa', 'en', 'system', 'system')

ON CONFLICT (path) DO NOTHING;

-- ─── 7. TUT USA EXPERIENCE FRAGMENTS ─────────────────────────────────────────
-- XF site container under experience-fragments root
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES (
    uuid_generate_v4(),
    'content.experience-fragments.tut-usa',
    'tut-usa',
    'flexcms/container',
    'content.experience-fragments',
    10,
    '{"jcr:title":"TUT USA Experience Fragments"}'::jsonb,
    1,
    'PUBLISHED',
    'tut-usa',
    NULL,
    'system',
    'system'
)
ON CONFLICT (path) DO NOTHING;

-- Global XF folder — groups all site-wide reusable fragments
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES (
    uuid_generate_v4(),
    'content.experience-fragments.tut-usa.global',
    'global',
    'flexcms/container',
    'content.experience-fragments.tut-usa',
    0,
    '{"jcr:title":"Global Fragments","description":"Site-wide reusable header, footer, and campaign blocks"}'::jsonb,
    1,
    'PUBLISHED',
    'tut-usa',
    'en',
    'system',
    'system'
)
ON CONFLICT (path) DO NOTHING;

-- Navigation XF folder (type: header) — the global site navigation, locked on all pages
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES (
    uuid_generate_v4(),
    'content.experience-fragments.tut-usa.global.navigation',
    'navigation',
    'flexcms/xf-folder',
    'content.experience-fragments.tut-usa.global',
    0,
    '{"jcr:title":"Global Navigation","fragmentType":"header","lockedOnPages":true}'::jsonb,
    1,
    'DRAFT',
    'tut-usa',
    'en',
    'system',
    'system'
)
ON CONFLICT (path) DO NOTHING;

-- Navigation XF master variation (xf-page) — the authoring container for nav components
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES (
    uuid_generate_v4(),
    'content.experience-fragments.tut-usa.global.navigation.master',
    'master',
    'flexcms/xf-page',
    'content.experience-fragments.tut-usa.global.navigation',
    0,
    '{"jcr:title":"Master","variantType":"master"}'::jsonb,
    1,
    'DRAFT',
    'tut-usa',
    'en',
    'system',
    'system'
)
ON CONFLICT (path) DO NOTHING;

-- Footer XF folder (type: footer) — the global site footer, locked on all pages
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES (
    uuid_generate_v4(),
    'content.experience-fragments.tut-usa.global.footer',
    'footer',
    'flexcms/xf-folder',
    'content.experience-fragments.tut-usa.global',
    1,
    '{"jcr:title":"Global Footer","fragmentType":"footer","lockedOnPages":true}'::jsonb,
    1,
    'DRAFT',
    'tut-usa',
    'en',
    'system',
    'system'
)
ON CONFLICT (path) DO NOTHING;

-- Footer XF master variation (xf-page) — the authoring container for footer components
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index,
                            properties, version, status, site_id, locale, created_by, modified_by)
VALUES (
    uuid_generate_v4(),
    'content.experience-fragments.tut-usa.global.footer.master',
    'master',
    'flexcms/xf-page',
    'content.experience-fragments.tut-usa.global.footer',
    0,
    '{"jcr:title":"Master","variantType":"master"}'::jsonb,
    1,
    'DRAFT',
    'tut-usa',
    'en',
    'system',
    'system'
)
ON CONFLICT (path) DO NOTHING;

-- ─── 8. XF METADATA REGISTRY ─────────────────────────────────────────────────
-- Register navigation and footer in the XF metadata table for fast admin-UI listing.
INSERT INTO experience_fragment_metadata (id, xf_path, site_id, locale, title, description, created_by)
VALUES
    (uuid_generate_v4(),
     'content.experience-fragments.tut-usa.global.navigation',
     'tut-usa', 'en',
     'Global Navigation',
     'Primary site header and navigation menu — locked on all TUT USA pages.',
     'system'),
    (uuid_generate_v4(),
     'content.experience-fragments.tut-usa.global.footer',
     'tut-usa', 'en',
     'Global Footer',
     'Primary site footer with links, legal, and social icons — locked on all TUT USA pages.',
     'system')
ON CONFLICT (xf_path) DO NOTHING;

