-- =============================================================================
-- V14: TUT Luxury Cars — Sample Site Seed Data
-- Auto-populates the CMS with a fully working demo site on fresh startup.
-- Includes: sites, domain mappings, TUT component definitions,
--           experience fragments (header + footer), and the full page tree
--           for tut-gb/en (17 pages with component trees).
-- =============================================================================

-- ─── 1. SITES ────────────────────────────────────────────────────────────────
INSERT INTO sites (site_id, title, description, content_root, dam_root, config_root, default_locale, supported_locales, active)
VALUES
    ('tut-gb', 'TUT United Kingdom', 'TUT luxury automobiles — GB market',
     'content.tut-gb', 'dam.tut-gb', 'config.tut-gb', 'en', 'en', TRUE),
    ('tut-de', 'TUT Deutschland', 'TUT luxury automobiles — DE market',
     'content.tut-de', 'dam.tut-de', 'config.tut-de', 'de', 'de', TRUE),
    ('tut-fr', 'TUT France', 'TUT luxury automobiles — FR market',
     'content.tut-fr', 'dam.tut-fr', 'config.tut-fr', 'fr', 'fr', TRUE),
    ('tut-ca', 'TUT Canada', 'TUT luxury automobiles — CA market',
     'content.tut-ca', 'dam.tut-ca', 'config.tut-ca', 'en', 'en,fr', TRUE)
ON CONFLICT (site_id) DO NOTHING;

-- ─── 2. DOMAIN MAPPINGS ─────────────────────────────────────────────────────
INSERT INTO domain_mappings (id, domain, site_id, locale, is_primary) VALUES
    (uuid_generate_v4(), 'www.tut.co.uk',       'tut-gb', 'en', TRUE),
    (uuid_generate_v4(), 'tut-gb.localhost',     'tut-gb', 'en', FALSE),
    (uuid_generate_v4(), 'www.tut.de',           'tut-de', 'de', TRUE),
    (uuid_generate_v4(), 'tut-de.localhost',     'tut-de', 'de', FALSE),
    (uuid_generate_v4(), 'www.tut.fr',           'tut-fr', 'fr', TRUE),
    (uuid_generate_v4(), 'tut-fr.localhost',     'tut-fr', 'fr', FALSE),
    (uuid_generate_v4(), 'www.tut.ca',           'tut-ca', 'en', TRUE),
    (uuid_generate_v4(), 'tut-ca.localhost',     'tut-ca', 'en', FALSE)
ON CONFLICT (domain) DO NOTHING;

-- ─── 3. TUT COMPONENT DEFINITIONS ───────────────────────────────────────────
INSERT INTO component_definitions (id, resource_type, name, title, group_name, is_container, active, data_schema, dialog) VALUES
    (uuid_generate_v4(), 'tut/hero-banner', 'hero-banner', 'Hero Banner', 'Marketing', FALSE, TRUE,
     '{"title":"string","subtitle":"string","backgroundImage":"string","ctaLabel":"string","ctaLink":"string","theme":"enum:light|dark|gradient","height":"enum:medium|full","overlayOpacity":"number"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/text-image', 'text-image', 'Text + Image', 'Content', FALSE, TRUE,
     '{"title":"string","text":"string","image":"string","imageAlt":"string","imagePosition":"enum:left|right","theme":"enum:light|dark"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/card-grid', 'card-grid', 'Card Grid', 'Content', TRUE, TRUE,
     '{"columns":"number","title":"string"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/card', 'card', 'Card', 'Content', FALSE, TRUE,
     '{"image":"string","title":"string","description":"string","ctaLabel":"string","ctaLink":"string"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/product-teaser', 'product-teaser', 'Product Teaser', 'Commerce', FALSE, TRUE,
     '{"productSku":"string","displayMode":"enum:hero|compact|card","showPrice":"boolean","ctaLabel":"string","ctaLink":"string"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/product-specs', 'product-specs', 'Product Specifications', 'Commerce', FALSE, TRUE,
     '{"productSku":"string","highlightedSpecs":"string[]"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/gallery', 'gallery', 'Image Gallery', 'Media', FALSE, TRUE,
     '{"images":"string[]","layout":"enum:carousel|grid","columns":"number"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/cta-banner', 'cta-banner', 'CTA Banner', 'Marketing', FALSE, TRUE,
     '{"title":"string","text":"string","ctaLabel":"string","ctaLink":"string","theme":"enum:primary|dark|accent"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/accordion', 'accordion', 'Accordion / FAQ', 'Content', TRUE, TRUE,
     '{}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/accordion-item', 'accordion-item', 'Accordion Item', 'Content', FALSE, TRUE,
     '{"title":"string","body":"string"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/video-embed', 'video-embed', 'Video Embed', 'Media', FALSE, TRUE,
     '{"videoUrl":"string","damVideo":"string","posterImage":"string","autoplay":"boolean","title":"string"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/navigation', 'navigation', 'Navigation Menu', 'Navigation', FALSE, TRUE,
     '{"rootPath":"string","depth":"number","brandLogo":"string","brandName":"string","showLanguageSelector":"boolean"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/breadcrumb', 'breadcrumb', 'Breadcrumb', 'Navigation', FALSE, TRUE,
     '{}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/footer-links', 'footer-links', 'Footer Links', 'Navigation', FALSE, TRUE,
     '{"columns":"array","copyrightText":"string","socialLinks":"array"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/language-selector', 'language-selector', 'Language Selector', 'Navigation', FALSE, TRUE,
     '{}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/stat-counter', 'stat-counter', 'Stat Counter', 'Marketing', FALSE, TRUE,
     '{"value":"string","unit":"string","label":"string"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/testimonial', 'testimonial', 'Testimonial', 'Content', FALSE, TRUE,
     '{"quote":"string","author":"string","source":"string","image":"string"}'::jsonb, '{}'::jsonb),
    (uuid_generate_v4(), 'tut/model-comparison', 'model-comparison', 'Model Comparison', 'Commerce', FALSE, TRUE,
     '{"productSkus":"string[]","compareAttributes":"string[]"}'::jsonb, '{}'::jsonb)
ON CONFLICT (resource_type) DO NOTHING;

-- ─── 4. ROOT CONTENT NODES ──────────────────────────────────────────────────
-- The top-level 'content' node is the tree root
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by)
VALUES (uuid_generate_v4(), 'content', 'content', 'flexcms/container', NULL, 0, '{}'::jsonb, 1, 'PUBLISHED', NULL, NULL, 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- Experience fragments root
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by)
VALUES (uuid_generate_v4(), 'content.experience-fragments', 'experience-fragments', 'flexcms/container', 'content', 0, '{}'::jsonb, 1, 'PUBLISHED', NULL, NULL, 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- Site roots
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb', 'tut-gb', 'flexcms/site-root', 'content', 0, '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', NULL, 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-de', 'tut-de', 'flexcms/site-root', 'content', 1, '{}'::jsonb, 1, 'PUBLISHED', 'tut-de', NULL, 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-fr', 'tut-fr', 'flexcms/site-root', 'content', 2, '{}'::jsonb, 1, 'PUBLISHED', 'tut-fr', NULL, 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-ca', 'tut-ca', 'flexcms/site-root', 'content', 3, '{}'::jsonb, 1, 'PUBLISHED', 'tut-ca', NULL, 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- Locale containers for each site
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en', 'en', 'flexcms/container', 'content.tut-gb', 0, '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-de.de', 'de', 'flexcms/container', 'content.tut-de', 0, '{}'::jsonb, 1, 'PUBLISHED', 'tut-de', 'de', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-fr.fr', 'fr', 'flexcms/container', 'content.tut-fr', 0, '{}'::jsonb, 1, 'PUBLISHED', 'tut-fr', 'fr', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-ca.en', 'en', 'flexcms/container', 'content.tut-ca', 0, '{}'::jsonb, 1, 'PUBLISHED', 'tut-ca', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-ca.fr', 'fr', 'flexcms/container', 'content.tut-ca', 1, '{}'::jsonb, 1, 'PUBLISHED', 'tut-ca', 'fr', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- ─── 5. EXPERIENCE FRAGMENTS — tut-gb / en ──────────────────────────────────
-- XF site containers
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb', 'tut-gb', 'flexcms/container', 'content.experience-fragments', 0, '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', NULL, 'system', 'system'),
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en', 'en', 'flexcms/container', 'content.experience-fragments.tut-gb', 0, '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- Header XF
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en.header', 'header', 'flexcms/xf-folder', 'content.experience-fragments.tut-gb.en', 0,
     '{"jcr:title":"Header","fragmentType":"header"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en.header.master', 'master', 'flexcms/xf-page', 'content.experience-fragments.tut-gb.en.header', 0,
     '{"jcr:title":"Master","variantType":"master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en.header.master.navigation', 'navigation', 'tut/navigation', 'content.experience-fragments.tut-gb.en.header.master', 0,
     '{"rootPath":"content.tut-gb.en","depth":2,"brandLogo":"/dam/tut/shared/brand/tut-logo.png","brandName":"TUT","showLanguageSelector":false}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en.header.master.language-selector', 'language-selector', 'tut/language-selector', 'content.experience-fragments.tut-gb.en.header.master', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- Footer XF
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en.footer', 'footer', 'flexcms/xf-folder', 'content.experience-fragments.tut-gb.en', 1,
     '{"jcr:title":"Footer","fragmentType":"footer"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en.footer.master', 'master', 'flexcms/xf-page', 'content.experience-fragments.tut-gb.en.footer', 0,
     '{"jcr:title":"Master","variantType":"master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en.footer.master.footer-links', 'footer-links', 'tut/footer-links', 'content.experience-fragments.tut-gb.en.footer.master', 0,
     '{"columns":[{"heading":"Models","links":[{"label":"Sovereign","url":"/models/sovereign"},{"label":"Vanguard","url":"/models/vanguard"},{"label":"Eclipse","url":"/models/eclipse"},{"label":"Apex","url":"/models/apex"}]},{"heading":"Discover","links":[{"label":"Innovation","url":"/innovation"},{"label":"Safety","url":"/safety"},{"label":"About TUT","url":"/about"}]},{"heading":"Support","links":[{"label":"Contact","url":"/contact"},{"label":"Privacy Policy","url":"/legal/privacy"},{"label":"Terms & Conditions","url":"/legal/terms"}]}],"copyrightText":"© 2026 TUT Motors Ltd. All rights reserved.","socialLinks":[{"platform":"instagram","url":"https://instagram.com/tutmotors"},{"platform":"youtube","url":"https://youtube.com/tutmotors"},{"platform":"linkedin","url":"https://linkedin.com/company/tutmotors"}]}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- XF metadata
INSERT INTO experience_fragment_metadata (id, xf_path, site_id, locale, title, created_by) VALUES
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en.header', 'tut-gb', 'en', 'Header', 'system'),
    (uuid_generate_v4(), 'content.experience-fragments.tut-gb.en.footer', 'tut-gb', 'en', 'Footer', 'system')
ON CONFLICT (xf_path) DO NOTHING;

-- ─── 6. PAGE TREE — tut-gb / en ─────────────────────────────────────────────
-- Helper abbreviations used in comments:
--   BP = base parent path for tut-gb/en = content.tut-gb.en

-- ═══════════════════════════════════════════════════════════════════════════════
-- HOME PAGE
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    -- Page node
    (uuid_generate_v4(), 'content.tut-gb.en.home', 'home', 'flexcms/page', 'content.tut-gb.en', 0,
     '{"jcr:title":"Home","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Header XF ref
    (uuid_generate_v4(), 'content.tut-gb.en.home.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.home', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Breadcrumb
    (uuid_generate_v4(), 'content.tut-gb.en.home.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.home', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Main container
    (uuid_generate_v4(), 'content.tut-gb.en.home.main', 'main', 'flexcms/container', 'content.tut-gb.en.home', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Footer XF ref
    (uuid_generate_v4(), 'content.tut-gb.en.home.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.home', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),

    -- === Home components ===
    -- Hero
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.home.main', 0,
     '{"title":"The New TUT Sovereign","subtitle":"Luxury redefined for 2026","backgroundImage":"/dam/tut/shared/banners/hero-home.png","ctaLabel":"Explore Models","ctaLink":"/tut-gb/en/models","theme":"dark","height":"full","overlayOpacity":0.4}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Model highlights card grid
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.model-highlights', 'model-highlights', 'tut/card-grid', 'content.tut-gb.en.home.main', 1,
     '{"columns":4,"title":"Our Models"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Cards inside model-highlights
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.model-highlights.card-sovereign', 'card-sovereign', 'tut/card', 'content.tut-gb.en.home.main.model-highlights', 0,
     '{"image":"/dam/tut/shared/models/tut-sovereign.png","title":"Sovereign","description":"The art of arrival","ctaLabel":"Discover","ctaLink":"/tut-gb/en/models/sovereign"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.model-highlights.card-vanguard', 'card-vanguard', 'tut/card', 'content.tut-gb.en.home.main.model-highlights', 1,
     '{"image":"/dam/tut/shared/models/tut-vanguard.png","title":"Vanguard","description":"Command every horizon","ctaLabel":"Discover","ctaLink":"/tut-gb/en/models/vanguard"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.model-highlights.card-eclipse', 'card-eclipse', 'tut/card', 'content.tut-gb.en.home.main.model-highlights', 2,
     '{"image":"/dam/tut/shared/models/tut-eclipse.png","title":"Eclipse","description":"Silent thunder","ctaLabel":"Discover","ctaLink":"/tut-gb/en/models/eclipse"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.model-highlights.card-apex', 'card-apex', 'tut/card', 'content.tut-gb.en.home.main.model-highlights', 3,
     '{"image":"/dam/tut/shared/models/tut-apex.png","title":"Apex","description":"Where passion meets precision","ctaLabel":"Discover","ctaLink":"/tut-gb/en/models/apex"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Innovation section
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.innovation-section', 'innovation-section', 'tut/text-image', 'content.tut-gb.en.home.main', 2,
     '{"title":"Innovation Without Compromise","text":"<p>At TUT, we push the boundaries of engineering to deliver extraordinary performance without sacrificing refinement. Every innovation serves a purpose.</p>","image":"/dam/tut/shared/features/innovation-engine.png","imagePosition":"right","theme":"light"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Stats container
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.stats', 'stats', 'flexcms/container', 'content.tut-gb.en.home.main', 3,
     '{"layout":"three-equal"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.stats.stat-1', 'stat-1', 'tut/stat-counter', 'content.tut-gb.en.home.main.stats', 0,
     '{"value":"600+","unit":"HP","label":"Maximum Power"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.stats.stat-2', 'stat-2', 'tut/stat-counter', 'content.tut-gb.en.home.main.stats', 1,
     '{"value":"2.9s","unit":"","label":"0-100 km/h"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.stats.stat-3', 'stat-3', 'tut/stat-counter', 'content.tut-gb.en.home.main.stats', 2,
     '{"value":"75+","unit":"years","label":"Heritage"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Safety preview
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.safety-preview', 'safety-preview', 'tut/text-image', 'content.tut-gb.en.home.main', 4,
     '{"title":"Your Safety, Perfected","text":"<p>Every TUT is engineered with our proprietary SafeShield™ architecture, a multi-layered safety system that anticipates and prevents incidents before they occur.</p>","image":"/dam/tut/shared/features/safety-shield.png","imagePosition":"left","theme":"light"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Testimonial
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.testimonial', 'testimonial', 'tut/testimonial', 'content.tut-gb.en.home.main', 5,
     '{"quote":"The TUT Sovereign is the closest thing to perfection on four wheels.","author":"James Henderson","source":"Luxury Motoring Magazine"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- CTA
    (uuid_generate_v4(), 'content.tut-gb.en.home.main.cta-test-drive', 'cta-test-drive', 'tut/cta-banner', 'content.tut-gb.en.home.main', 6,
     '{"title":"Experience TUT","text":"Book your personal test drive today","ctaLabel":"Book Test Drive","ctaLink":"/tut-gb/en/contact","theme":"primary"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- MODELS HUB PAGE
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en.models', 'models', 'flexcms/page', 'content.tut-gb.en', 1,
     '{"jcr:title":"Models","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.models', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.models', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.main', 'main', 'flexcms/container', 'content.tut-gb.en.models', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.models', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Hero
    (uuid_generate_v4(), 'content.tut-gb.en.models.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.models.main', 0,
     '{"title":"The TUT Lineup","subtitle":"Four masterpieces. One vision.","backgroundImage":"/dam/tut/shared/banners/hero-models.png","theme":"dark","height":"full"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Product teasers
    (uuid_generate_v4(), 'content.tut-gb.en.models.main.sovereign-teaser', 'sovereign-teaser', 'tut/product-teaser', 'content.tut-gb.en.models.main', 1,
     '{"productSku":"TUT-SOVEREIGN-2026","displayMode":"hero","ctaLabel":"Discover","ctaLink":"/tut-gb/en/models/sovereign"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.main.vanguard-teaser', 'vanguard-teaser', 'tut/product-teaser', 'content.tut-gb.en.models.main', 2,
     '{"productSku":"TUT-VANGUARD-2026","displayMode":"hero","ctaLabel":"Discover","ctaLink":"/tut-gb/en/models/vanguard"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.main.eclipse-teaser', 'eclipse-teaser', 'tut/product-teaser', 'content.tut-gb.en.models.main', 3,
     '{"productSku":"TUT-ECLIPSE-2026","displayMode":"hero","ctaLabel":"Discover","ctaLink":"/tut-gb/en/models/eclipse"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.main.apex-teaser', 'apex-teaser', 'tut/product-teaser', 'content.tut-gb.en.models.main', 4,
     '{"productSku":"TUT-APEX-2026","displayMode":"hero","ctaLabel":"Discover","ctaLink":"/tut-gb/en/models/apex"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Model comparison
    (uuid_generate_v4(), 'content.tut-gb.en.models.main.comparison', 'comparison', 'tut/model-comparison', 'content.tut-gb.en.models.main', 5,
     '{"productSkus":["TUT-SOVEREIGN-2026","TUT-VANGUARD-2026","TUT-ECLIPSE-2026"],"compareAttributes":["horsepower","acceleration0to100","topSpeed","engineType","basePrice_GBP"]}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- MODEL DETAIL PAGES (sovereign, vanguard, eclipse, apex)
-- ═══════════════════════════════════════════════════════════════════════════════

-- --- Sovereign ---
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign', 'sovereign', 'flexcms/page', 'content.tut-gb.en.models', 0,
     '{"jcr:title":"TUT Sovereign","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.models.sovereign', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.models.sovereign', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main', 'main', 'flexcms/container', 'content.tut-gb.en.models.sovereign', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.models.sovereign', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.models.sovereign.main', 0,
     '{"title":"TUT Sovereign","subtitle":"The art of arrival","backgroundImage":"/dam/tut/shared/models/tut-sovereign.png","theme":"dark","height":"full"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main.intro', 'intro', 'tut/text-image', 'content.tut-gb.en.models.sovereign.main', 1,
     '{"title":"A masterpiece of engineering","text":"<p>The Sovereign represents the pinnacle of luxury motoring. Hand-crafted in our Oxfordshire atelier, every detail is meticulously engineered.</p>","image":"/dam/tut/shared/models/tut-sovereign-2.png","imagePosition":"right","theme":"light"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main.gallery', 'gallery', 'tut/gallery', 'content.tut-gb.en.models.sovereign.main', 2,
     '{"images":["/dam/tut/shared/models/tut-sovereign.png","/dam/tut/shared/models/tut-sovereign-2.png","/dam/tut/shared/models/tut-sovereign-3.png"],"layout":"carousel"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main.specs', 'specs', 'tut/product-specs', 'content.tut-gb.en.models.sovereign.main', 3,
     '{"productSku":"TUT-SOVEREIGN-2026","highlightedSpecs":["horsepower","torque","acceleration0to100","topSpeed"]}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main.features', 'features', 'tut/card-grid', 'content.tut-gb.en.models.sovereign.main', 4,
     '{"columns":3,"title":"Key Features"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main.features.card-1', 'card-1', 'tut/card', 'content.tut-gb.en.models.sovereign.main.features', 0,
     '{"image":"/dam/tut/shared/features/interior-cockpit.png","title":"Interior Craftsmanship","description":"Hand-finished materials chosen for both beauty and longevity."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main.features.card-2', 'card-2', 'tut/card', 'content.tut-gb.en.models.sovereign.main.features', 1,
     '{"image":"/dam/tut/shared/features/innovation-ai.png","title":"Infotainment","description":"State-of-the-art connectivity and entertainment at your fingertips."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main.features.card-3', 'card-3', 'tut/card', 'content.tut-gb.en.models.sovereign.main.features', 2,
     '{"image":"/dam/tut/shared/features/safety-night.png","title":"Night Vision","description":"Advanced night vision system detects hazards up to 300m ahead."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.sovereign.main.cta', 'cta', 'tut/cta-banner', 'content.tut-gb.en.models.sovereign.main', 5,
     '{"title":"Configure Your Sovereign","ctaLabel":"Contact Us","ctaLink":"/tut-gb/en/contact","theme":"primary"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- --- Vanguard ---
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard', 'vanguard', 'flexcms/page', 'content.tut-gb.en.models', 1,
     '{"jcr:title":"TUT Vanguard","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.models.vanguard', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.models.vanguard', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main', 'main', 'flexcms/container', 'content.tut-gb.en.models.vanguard', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.models.vanguard', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.models.vanguard.main', 0,
     '{"title":"TUT Vanguard","subtitle":"Command every horizon","backgroundImage":"/dam/tut/shared/models/tut-vanguard.png","theme":"dark","height":"full"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main.intro', 'intro', 'tut/text-image', 'content.tut-gb.en.models.vanguard.main', 1,
     '{"title":"A masterpiece of engineering","text":"<p>The Vanguard blends commanding presence with athletic agility. Powered by our twin-turbo V8, it conquers any terrain.</p>","image":"/dam/tut/shared/models/tut-vanguard-2.png","imagePosition":"right","theme":"light"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main.gallery', 'gallery', 'tut/gallery', 'content.tut-gb.en.models.vanguard.main', 2,
     '{"images":["/dam/tut/shared/models/tut-vanguard.png","/dam/tut/shared/models/tut-vanguard-2.png","/dam/tut/shared/models/tut-vanguard-3.png"],"layout":"carousel"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main.specs', 'specs', 'tut/product-specs', 'content.tut-gb.en.models.vanguard.main', 3,
     '{"productSku":"TUT-VANGUARD-2026","highlightedSpecs":["horsepower","torque","acceleration0to100","topSpeed"]}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main.features', 'features', 'tut/card-grid', 'content.tut-gb.en.models.vanguard.main', 4,
     '{"columns":3,"title":"Key Features"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main.features.card-1', 'card-1', 'tut/card', 'content.tut-gb.en.models.vanguard.main.features', 0,
     '{"image":"/dam/tut/shared/features/interior-cockpit.png","title":"Interior Craftsmanship","description":"Hand-finished materials chosen for both beauty and longevity."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main.features.card-2', 'card-2', 'tut/card', 'content.tut-gb.en.models.vanguard.main.features', 1,
     '{"image":"/dam/tut/shared/features/innovation-ai.png","title":"Infotainment","description":"State-of-the-art connectivity and entertainment at your fingertips."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main.features.card-3', 'card-3', 'tut/card', 'content.tut-gb.en.models.vanguard.main.features', 2,
     '{"image":"/dam/tut/shared/features/safety-night.png","title":"Night Vision","description":"Advanced night vision system detects hazards up to 300m ahead."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.vanguard.main.cta', 'cta', 'tut/cta-banner', 'content.tut-gb.en.models.vanguard.main', 5,
     '{"title":"Configure Your Vanguard","ctaLabel":"Contact Us","ctaLink":"/tut-gb/en/contact","theme":"primary"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- --- Eclipse ---
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse', 'eclipse', 'flexcms/page', 'content.tut-gb.en.models', 2,
     '{"jcr:title":"TUT Eclipse","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.models.eclipse', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.models.eclipse', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main', 'main', 'flexcms/container', 'content.tut-gb.en.models.eclipse', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.models.eclipse', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.models.eclipse.main', 0,
     '{"title":"TUT Eclipse","subtitle":"Silent thunder","backgroundImage":"/dam/tut/shared/models/tut-eclipse.png","theme":"dark","height":"full"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main.intro', 'intro', 'tut/text-image', 'content.tut-gb.en.models.eclipse.main', 1,
     '{"title":"A masterpiece of engineering","text":"<p>Our first fully electric grand tourer. The Eclipse delivers breathtaking acceleration with zero emissions.</p>","image":"/dam/tut/shared/models/tut-eclipse-2.png","imagePosition":"right","theme":"light"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main.gallery', 'gallery', 'tut/gallery', 'content.tut-gb.en.models.eclipse.main', 2,
     '{"images":["/dam/tut/shared/models/tut-eclipse.png","/dam/tut/shared/models/tut-eclipse-2.png","/dam/tut/shared/models/tut-eclipse-3.png"],"layout":"carousel"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main.specs', 'specs', 'tut/product-specs', 'content.tut-gb.en.models.eclipse.main', 3,
     '{"productSku":"TUT-ECLIPSE-2026","highlightedSpecs":["horsepower","torque","acceleration0to100","topSpeed"]}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main.features', 'features', 'tut/card-grid', 'content.tut-gb.en.models.eclipse.main', 4,
     '{"columns":3,"title":"Key Features"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main.features.card-1', 'card-1', 'tut/card', 'content.tut-gb.en.models.eclipse.main.features', 0,
     '{"image":"/dam/tut/shared/features/interior-cockpit.png","title":"Interior Craftsmanship","description":"Hand-finished materials chosen for both beauty and longevity."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main.features.card-2', 'card-2', 'tut/card', 'content.tut-gb.en.models.eclipse.main.features', 1,
     '{"image":"/dam/tut/shared/features/innovation-ai.png","title":"Infotainment","description":"State-of-the-art connectivity and entertainment at your fingertips."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main.features.card-3', 'card-3', 'tut/card', 'content.tut-gb.en.models.eclipse.main.features', 2,
     '{"image":"/dam/tut/shared/features/safety-night.png","title":"Night Vision","description":"Advanced night vision system detects hazards up to 300m ahead."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.eclipse.main.cta', 'cta', 'tut/cta-banner', 'content.tut-gb.en.models.eclipse.main', 5,
     '{"title":"Configure Your Eclipse","ctaLabel":"Contact Us","ctaLink":"/tut-gb/en/contact","theme":"primary"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- --- Apex ---
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex', 'apex', 'flexcms/page', 'content.tut-gb.en.models', 3,
     '{"jcr:title":"TUT Apex","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.models.apex', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.models.apex', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main', 'main', 'flexcms/container', 'content.tut-gb.en.models.apex', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.models.apex', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.models.apex.main', 0,
     '{"title":"TUT Apex","subtitle":"Where passion meets precision","backgroundImage":"/dam/tut/shared/models/tut-apex.png","theme":"dark","height":"full"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main.intro', 'intro', 'tut/text-image', 'content.tut-gb.en.models.apex.main', 1,
     '{"title":"A masterpiece of engineering","text":"<p>The Apex is a driver''s car in the purest sense. Lightweight carbon construction meets plug-in hybrid technology.</p>","image":"/dam/tut/shared/models/tut-apex-2.png","imagePosition":"right","theme":"light"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main.gallery', 'gallery', 'tut/gallery', 'content.tut-gb.en.models.apex.main', 2,
     '{"images":["/dam/tut/shared/models/tut-apex.png","/dam/tut/shared/models/tut-apex-2.png","/dam/tut/shared/models/tut-apex-3.png"],"layout":"carousel"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main.specs', 'specs', 'tut/product-specs', 'content.tut-gb.en.models.apex.main', 3,
     '{"productSku":"TUT-APEX-2026","highlightedSpecs":["horsepower","torque","acceleration0to100","topSpeed"]}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main.features', 'features', 'tut/card-grid', 'content.tut-gb.en.models.apex.main', 4,
     '{"columns":3,"title":"Key Features"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main.features.card-1', 'card-1', 'tut/card', 'content.tut-gb.en.models.apex.main.features', 0,
     '{"image":"/dam/tut/shared/features/interior-cockpit.png","title":"Interior Craftsmanship","description":"Hand-finished materials chosen for both beauty and longevity."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main.features.card-2', 'card-2', 'tut/card', 'content.tut-gb.en.models.apex.main.features', 1,
     '{"image":"/dam/tut/shared/features/innovation-ai.png","title":"Infotainment","description":"State-of-the-art connectivity and entertainment at your fingertips."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main.features.card-3', 'card-3', 'tut/card', 'content.tut-gb.en.models.apex.main.features', 2,
     '{"image":"/dam/tut/shared/features/safety-night.png","title":"Night Vision","description":"Advanced night vision system detects hazards up to 300m ahead."}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.models.apex.main.cta', 'cta', 'tut/cta-banner', 'content.tut-gb.en.models.apex.main', 5,
     '{"title":"Configure Your Apex","ctaLabel":"Contact Us","ctaLink":"/tut-gb/en/contact","theme":"primary"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- INNOVATION HUB + SUB-PAGES
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en.innovation', 'innovation', 'flexcms/page', 'content.tut-gb.en', 2,
     '{"jcr:title":"Innovation","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.innovation', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.innovation', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.main', 'main', 'flexcms/container', 'content.tut-gb.en.innovation', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.innovation', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Hero
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.innovation.main', 0,
     '{"title":"Innovation at TUT","backgroundImage":"/dam/tut/shared/banners/hero-innovation.png","theme":"dark","height":"full"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Intro
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.main.intro', 'intro', 'flexcms/rich-text', 'content.tut-gb.en.innovation.main', 1,
     '{"content":"<p>At TUT, innovation is not a department — it''s a philosophy. Every system, every component, every material is chosen with one question in mind: how can we make this better?</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Pillars card grid
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.main.pillars', 'pillars', 'tut/card-grid', 'content.tut-gb.en.innovation.main', 2,
     '{"columns":3,"title":"Our Pillars"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.main.pillars.card-performance', 'card-performance', 'tut/card', 'content.tut-gb.en.innovation.main.pillars', 0,
     '{"image":"/dam/tut/shared/features/innovation-engine.png","title":"Performance","description":"Engineering excellence at every rpm.","ctaLink":"/tut-gb/en/innovation/performance"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.main.pillars.card-electrification', 'card-electrification', 'tut/card', 'content.tut-gb.en.innovation.main.pillars', 1,
     '{"image":"/dam/tut/shared/features/innovation-aero.png","title":"Electrification","description":"The future of luxury motoring is electric.","ctaLink":"/tut-gb/en/innovation/electrification"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.main.pillars.card-craftsmanship', 'card-craftsmanship', 'tut/card', 'content.tut-gb.en.innovation.main.pillars', 2,
     '{"image":"/dam/tut/shared/lifestyle/craftsmanship.png","title":"Craftsmanship","description":"A century of perfectionism.","ctaLink":"/tut-gb/en/innovation/craftsmanship"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- Innovation sub-pages: performance, electrification, craftsmanship
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    -- Performance
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.performance', 'performance', 'flexcms/page', 'content.tut-gb.en.innovation', 0,
     '{"jcr:title":"Performance","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.performance.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.innovation.performance', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.performance.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.innovation.performance', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.performance.main', 'main', 'flexcms/container', 'content.tut-gb.en.innovation.performance', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.performance.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.innovation.performance', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.performance.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.innovation.performance.main', 0,
     '{"title":"Performance","backgroundImage":"/dam/tut/shared/features/innovation-engine.png","theme":"dark","height":"medium"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.performance.main.intro', 'intro', 'tut/text-image', 'content.tut-gb.en.innovation.performance.main', 1,
     '{"title":"Performance","text":"<p>Our commitment to performance drives everything we do at TUT.</p>","image":"/dam/tut/shared/features/innovation-engine.png","imagePosition":"right"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.performance.main.details', 'details', 'flexcms/rich-text', 'content.tut-gb.en.innovation.performance.main', 2,
     '{"content":"<p>Explore how TUT leads the industry in performance.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.performance.main.cta', 'cta', 'tut/cta-banner', 'content.tut-gb.en.innovation.performance.main', 3,
     '{"title":"Explore Models","ctaLabel":"Explore Models","ctaLink":"/tut-gb/en/models","theme":"primary"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),

    -- Electrification
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.electrification', 'electrification', 'flexcms/page', 'content.tut-gb.en.innovation', 1,
     '{"jcr:title":"Electrification","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.electrification.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.innovation.electrification', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.electrification.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.innovation.electrification', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.electrification.main', 'main', 'flexcms/container', 'content.tut-gb.en.innovation.electrification', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.electrification.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.innovation.electrification', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.electrification.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.innovation.electrification.main', 0,
     '{"title":"Electrification","backgroundImage":"/dam/tut/shared/features/innovation-aero.png","theme":"dark","height":"medium"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.electrification.main.intro', 'intro', 'tut/text-image', 'content.tut-gb.en.innovation.electrification.main', 1,
     '{"title":"Electrification","text":"<p>Our commitment to electrification drives everything we do at TUT.</p>","image":"/dam/tut/shared/features/innovation-aero.png","imagePosition":"right"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.electrification.main.details', 'details', 'flexcms/rich-text', 'content.tut-gb.en.innovation.electrification.main', 2,
     '{"content":"<p>Explore how TUT leads the industry in electrification.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.electrification.main.cta', 'cta', 'tut/cta-banner', 'content.tut-gb.en.innovation.electrification.main', 3,
     '{"title":"Explore Models","ctaLabel":"Explore Models","ctaLink":"/tut-gb/en/models","theme":"primary"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),

    -- Craftsmanship
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.craftsmanship', 'craftsmanship', 'flexcms/page', 'content.tut-gb.en.innovation', 2,
     '{"jcr:title":"Craftsmanship","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.craftsmanship.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.innovation.craftsmanship', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.craftsmanship.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.innovation.craftsmanship', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.craftsmanship.main', 'main', 'flexcms/container', 'content.tut-gb.en.innovation.craftsmanship', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.craftsmanship.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.innovation.craftsmanship', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.craftsmanship.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.innovation.craftsmanship.main', 0,
     '{"title":"Craftsmanship","backgroundImage":"/dam/tut/shared/lifestyle/craftsmanship.png","theme":"dark","height":"medium"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.craftsmanship.main.intro', 'intro', 'tut/text-image', 'content.tut-gb.en.innovation.craftsmanship.main', 1,
     '{"title":"Craftsmanship","text":"<p>Our commitment to craftsmanship drives everything we do at TUT.</p>","image":"/dam/tut/shared/lifestyle/craftsmanship.png","imagePosition":"right"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.craftsmanship.main.details', 'details', 'flexcms/rich-text', 'content.tut-gb.en.innovation.craftsmanship.main', 2,
     '{"content":"<p>Explore how TUT leads the industry in craftsmanship.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.innovation.craftsmanship.main.cta', 'cta', 'tut/cta-banner', 'content.tut-gb.en.innovation.craftsmanship.main', 3,
     '{"title":"Explore Models","ctaLabel":"Explore Models","ctaLink":"/tut-gb/en/models","theme":"primary"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SAFETY HUB + SUB-PAGES
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en.safety', 'safety', 'flexcms/page', 'content.tut-gb.en', 3,
     '{"jcr:title":"Safety","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.safety', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.safety', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.main', 'main', 'flexcms/container', 'content.tut-gb.en.safety', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.safety', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Hero
    (uuid_generate_v4(), 'content.tut-gb.en.safety.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.safety.main', 0,
     '{"title":"Safety at TUT","backgroundImage":"/dam/tut/shared/banners/hero-safety.png","theme":"dark","height":"full"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Safety intro
    (uuid_generate_v4(), 'content.tut-gb.en.safety.main.safety-intro', 'safety-intro', 'tut/text-image', 'content.tut-gb.en.safety.main', 1,
     '{"title":"Your Safety, Perfected","text":"<p>SafeShield™ is our proprietary multi-layered active and passive safety system, engineered to exceed every global safety standard.</p>","image":"/dam/tut/shared/features/safety-shield.png","imagePosition":"right"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Features cards
    (uuid_generate_v4(), 'content.tut-gb.en.safety.main.features', 'features', 'tut/card-grid', 'content.tut-gb.en.safety.main', 2,
     '{"columns":2}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.main.features.card-driver-assist', 'card-driver-assist', 'tut/card', 'content.tut-gb.en.safety.main.features', 0,
     '{"image":"/dam/tut/shared/features/safety-assist.png","title":"Driver Assistance","ctaLink":"/tut-gb/en/safety/driver-assist"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.main.features.card-structural', 'card-structural', 'tut/card', 'content.tut-gb.en.safety.main.features', 1,
     '{"image":"/dam/tut/shared/features/safety-shield.png","title":"Structural Safety","ctaLink":"/tut-gb/en/safety/structural"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- Safety sub-pages
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    -- Driver Assist
    (uuid_generate_v4(), 'content.tut-gb.en.safety.driver-assist', 'driver-assist', 'flexcms/page', 'content.tut-gb.en.safety', 0,
     '{"jcr:title":"Driver Assistance","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.driver-assist.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.safety.driver-assist', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.driver-assist.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.safety.driver-assist', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.driver-assist.main', 'main', 'flexcms/container', 'content.tut-gb.en.safety.driver-assist', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.driver-assist.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.safety.driver-assist', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.driver-assist.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.safety.driver-assist.main', 0,
     '{"title":"Driver Assistance","backgroundImage":"/dam/tut/shared/features/safety-assist.png","theme":"dark","height":"medium"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.driver-assist.main.content', 'content', 'flexcms/rich-text', 'content.tut-gb.en.safety.driver-assist.main', 1,
     '{"content":"<p>TUT''s driver assistance systems set the benchmark for the industry.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),

    -- Structural
    (uuid_generate_v4(), 'content.tut-gb.en.safety.structural', 'structural', 'flexcms/page', 'content.tut-gb.en.safety', 1,
     '{"jcr:title":"Structural Safety","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.structural.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.safety.structural', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.structural.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.safety.structural', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.structural.main', 'main', 'flexcms/container', 'content.tut-gb.en.safety.structural', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.structural.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.safety.structural', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.structural.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.safety.structural.main', 0,
     '{"title":"Structural Safety","backgroundImage":"/dam/tut/shared/features/safety-shield.png","theme":"dark","height":"medium"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.safety.structural.main.content', 'content', 'flexcms/rich-text', 'content.tut-gb.en.safety.structural.main', 1,
     '{"content":"<p>TUT''s structural safety systems set the benchmark for the industry.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ABOUT HUB + SUB-PAGES
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en.about', 'about', 'flexcms/page', 'content.tut-gb.en', 4,
     '{"jcr:title":"About Us","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.about', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.about', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.main', 'main', 'flexcms/container', 'content.tut-gb.en.about', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.about', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Hero
    (uuid_generate_v4(), 'content.tut-gb.en.about.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.about.main', 0,
     '{"title":"About TUT","backgroundImage":"/dam/tut/shared/banners/hero-about.png","theme":"dark","height":"full"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Story
    (uuid_generate_v4(), 'content.tut-gb.en.about.main.story', 'story', 'tut/text-image', 'content.tut-gb.en.about.main', 1,
     '{"title":"Our Story","text":"<p>Founded in 1949, TUT has been at the forefront of luxury automotive design for over 75 years. Our heritage is one of uncompromising quality and relentless innovation.</p>","image":"/dam/tut/shared/lifestyle/heritage-1.png","imagePosition":"right"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Values cards
    (uuid_generate_v4(), 'content.tut-gb.en.about.main.values', 'values', 'tut/card-grid', 'content.tut-gb.en.about.main', 2,
     '{"columns":3}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.main.values.card-heritage', 'card-heritage', 'tut/card', 'content.tut-gb.en.about.main.values', 0,
     '{"image":"/dam/tut/shared/lifestyle/heritage-2.png","title":"Heritage","ctaLink":"/tut-gb/en/about/heritage"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.main.values.card-sustainability', 'card-sustainability', 'tut/card', 'content.tut-gb.en.about.main.values', 1,
     '{"image":"/dam/tut/shared/features/sustainability.png","title":"Sustainability","ctaLink":"/tut-gb/en/about/sustainability"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.main.values.card-craftsmanship', 'card-craftsmanship', 'tut/card', 'content.tut-gb.en.about.main.values', 2,
     '{"image":"/dam/tut/shared/lifestyle/craftsmanship.png","title":"Craftsmanship"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

-- About sub-pages
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    -- Heritage
    (uuid_generate_v4(), 'content.tut-gb.en.about.heritage', 'heritage', 'flexcms/page', 'content.tut-gb.en.about', 0,
     '{"jcr:title":"Heritage","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.heritage.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.about.heritage', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.heritage.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.about.heritage', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.heritage.main', 'main', 'flexcms/container', 'content.tut-gb.en.about.heritage', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.heritage.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.about.heritage', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.heritage.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.about.heritage.main', 0,
     '{"title":"Heritage","backgroundImage":"/dam/tut/shared/banners/hero-heritage.png","theme":"dark","height":"medium"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.heritage.main.content', 'content', 'flexcms/rich-text', 'content.tut-gb.en.about.heritage.main', 1,
     '{"content":"<p>TUT''s heritage story spans decades of passionate craftsmanship.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),

    -- Sustainability
    (uuid_generate_v4(), 'content.tut-gb.en.about.sustainability', 'sustainability', 'flexcms/page', 'content.tut-gb.en.about', 1,
     '{"jcr:title":"Sustainability","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.sustainability.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.about.sustainability', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.sustainability.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.about.sustainability', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.sustainability.main', 'main', 'flexcms/container', 'content.tut-gb.en.about.sustainability', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.sustainability.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.about.sustainability', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.sustainability.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.about.sustainability.main', 0,
     '{"title":"Sustainability","backgroundImage":"/dam/tut/shared/features/sustainability.png","theme":"dark","height":"medium"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.about.sustainability.main.content', 'content', 'flexcms/rich-text', 'content.tut-gb.en.about.sustainability.main', 1,
     '{"content":"<p>TUT''s sustainability story spans decades of passionate craftsmanship.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CONTACT PAGE
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    (uuid_generate_v4(), 'content.tut-gb.en.contact', 'contact', 'flexcms/page', 'content.tut-gb.en', 5,
     '{"jcr:title":"Contact","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.contact.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.contact', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.contact.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.contact', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.contact.main', 'main', 'flexcms/container', 'content.tut-gb.en.contact', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.contact.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.contact', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Hero
    (uuid_generate_v4(), 'content.tut-gb.en.contact.main.hero', 'hero', 'tut/hero-banner', 'content.tut-gb.en.contact.main', 0,
     '{"title":"Contact TUT","backgroundImage":"/dam/tut/shared/banners/cta-test-drive.png","theme":"dark","height":"medium"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- Intro
    (uuid_generate_v4(), 'content.tut-gb.en.contact.main.intro', 'intro', 'flexcms/rich-text', 'content.tut-gb.en.contact.main', 1,
     '{"content":"<p>Visit a showroom near you to experience TUT in person. Our specialists are ready to guide you through every detail of your perfect luxury automobile.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    -- FAQ accordion
    (uuid_generate_v4(), 'content.tut-gb.en.contact.main.faq', 'faq', 'tut/accordion', 'content.tut-gb.en.contact.main', 2,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.contact.main.faq.item-1', 'item-1', 'tut/accordion-item', 'content.tut-gb.en.contact.main.faq', 0,
     '{"title":"How do I book a test drive?","body":"<p>Contact your nearest TUT dealer or use our online booking form to schedule a test drive at your convenience.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.contact.main.faq.item-2', 'item-2', 'tut/accordion-item', 'content.tut-gb.en.contact.main.faq', 1,
     '{"title":"Where is my nearest dealer?","body":"<p>Use our dealer locator tool to find your nearest TUT showroom. We have over 200 locations worldwide.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.contact.main.faq.item-3', 'item-3', 'tut/accordion-item', 'content.tut-gb.en.contact.main.faq', 2,
     '{"title":"Do you offer financing?","body":"<p>Yes, TUT Financial Services offers bespoke financing solutions to suit your requirements. Our specialists will guide you through the options.</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- LEGAL PAGES (privacy, terms)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by) VALUES
    -- Legal container
    (uuid_generate_v4(), 'content.tut-gb.en.legal', 'legal', 'flexcms/container', 'content.tut-gb.en', 6,
     '{"jcr:title":"Legal"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),

    -- Privacy Policy
    (uuid_generate_v4(), 'content.tut-gb.en.legal.privacy', 'privacy', 'flexcms/page', 'content.tut-gb.en.legal', 0,
     '{"jcr:title":"Privacy Policy","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.privacy.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.legal.privacy', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.privacy.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.legal.privacy', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.privacy.main', 'main', 'flexcms/container', 'content.tut-gb.en.legal.privacy', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.privacy.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.legal.privacy', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.privacy.main.content', 'content', 'flexcms/rich-text', 'content.tut-gb.en.legal.privacy.main', 0,
     '{"content":"<h1>Privacy Policy</h1><p>TUT Motors Ltd is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal data in accordance with applicable data protection legislation.</p><p>Last updated: 2026-01-01</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),

    -- Terms & Conditions
    (uuid_generate_v4(), 'content.tut-gb.en.legal.terms', 'terms', 'flexcms/page', 'content.tut-gb.en.legal', 1,
     '{"jcr:title":"Terms & Conditions","siteId":"tut-gb"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.terms.header', 'header', 'flexcms/experience-fragment', 'content.tut-gb.en.legal.terms', 0,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.header.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.terms.breadcrumb', 'breadcrumb', 'tut/breadcrumb', 'content.tut-gb.en.legal.terms', 1,
     '{}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.terms.main', 'main', 'flexcms/container', 'content.tut-gb.en.legal.terms', 2,
     '{"layout":"single-column"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.terms.footer', 'footer', 'flexcms/experience-fragment', 'content.tut-gb.en.legal.terms', 3,
     '{"fragmentPath":"content.experience-fragments.tut-gb.en.footer.master"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system'),
    (uuid_generate_v4(), 'content.tut-gb.en.legal.terms.main.content', 'content', 'flexcms/rich-text', 'content.tut-gb.en.legal.terms.main', 0,
     '{"content":"<h1>Terms & Conditions</h1><p>These terms govern your use of TUT Motors Ltd websites and services. By accessing our services, you agree to these terms.</p><p>Last updated: 2026-01-01</p>"}'::jsonb, 1, 'PUBLISHED', 'tut-gb', 'en', 'system', 'system')
ON CONFLICT (path) DO NOTHING;

