-- =============================================================================
-- WKND Sample Website — 01: Site definition + WKND component definitions
-- Run order: first
-- Idempotent: uses ON CONFLICT DO NOTHING / DO UPDATE
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Site
-- ---------------------------------------------------------------------------
INSERT INTO sites (site_id, title, description, content_root, dam_root, config_root,
                   default_locale, supported_locales, allowed_templates, active)
VALUES (
    'wknd',
    'WKND Adventures',
    'WKND is a collective of outdoors, music, crafts, adventure sports, and travel enthusiasts.',
    'wknd.language-masters.en',
    'dam.wknd',
    'conf.wknd',
    'en',
    'en',
    'wknd/templates/landing-page,wknd/templates/adventure-page,wknd/templates/article-page,wknd/templates/content-page',
    TRUE
)
ON CONFLICT (site_id) DO UPDATE
    SET title       = EXCLUDED.title,
        description = EXCLUDED.description,
        active      = EXCLUDED.active;

-- ---------------------------------------------------------------------------
-- Content-node stubs for path ancestry (needed for FK and tree queries)
-- ---------------------------------------------------------------------------
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, properties, status, site_id, locale, created_by, modified_by)
VALUES
    (md5('wknd-root')::uuid,
     'wknd', 'wknd', 'wknd/components/site-root', NULL,
     '{"title":"WKND Adventures"}'::jsonb,
     'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

    (md5('wknd-language-masters')::uuid,
     'wknd.language-masters', 'language-masters', 'wknd/components/container', 'wknd',
     '{}'::jsonb,
     'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

    (md5('wknd-language-masters-en')::uuid,
     'wknd.language-masters.en', 'en', 'wknd/components/site-root', 'wknd.language-masters',
     '{"title":"WKND Adventures and Travel","locale":"en"}'::jsonb,
     'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

    -- XF ancestry
    (md5('xf-root')::uuid,
     'experience-fragments', 'experience-fragments', 'flexcms/xf-folder', NULL,
     '{}'::jsonb,
     'LIVE', NULL, NULL, 'wknd-install', 'wknd-install'),

    (md5('xf-wknd')::uuid,
     'experience-fragments.wknd', 'wknd', 'flexcms/xf-folder', 'experience-fragments',
     '{}'::jsonb,
     'LIVE', 'wknd', NULL, 'wknd-install', 'wknd-install'),

    (md5('xf-wknd-lm')::uuid,
     'experience-fragments.wknd.language-masters', 'language-masters', 'flexcms/xf-folder',
     'experience-fragments.wknd',
     '{}'::jsonb,
     'LIVE', 'wknd', NULL, 'wknd-install', 'wknd-install'),

    (md5('xf-wknd-lm-en')::uuid,
     'experience-fragments.wknd.language-masters.en', 'en', 'flexcms/xf-folder',
     'experience-fragments.wknd.language-masters',
     '{}'::jsonb,
     'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

    (md5('xf-wknd-lm-en-site')::uuid,
     'experience-fragments.wknd.language-masters.en.site', 'site', 'flexcms/xf-folder',
     'experience-fragments.wknd.language-masters.en',
     '{}'::jsonb,
     'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install')

ON CONFLICT (path) DO NOTHING;

-- ---------------------------------------------------------------------------
-- WKND component definitions
-- ---------------------------------------------------------------------------
INSERT INTO component_definitions (id, resource_type, name, title, description, group_name, icon, is_container, active)
VALUES
    (md5('wknd-comp-page')::uuid,         'wknd/components/page',              'page',              'WKND Page',              'WKND page wrapper',                       'WKND Structure',  'page',           FALSE, TRUE),
    (md5('wknd-comp-xfpage')::uuid,       'wknd/components/xfpage',            'xfpage',            'WKND XF Page',           'Experience fragment page variation',       'WKND Structure',  'fragment',       TRUE,  TRUE),
    (md5('wknd-comp-container')::uuid,    'wknd/components/container',         'container',         'WKND Container',         'Responsive layout container',             'WKND Structure',  'container',      TRUE,  TRUE),
    (md5('wknd-comp-title')::uuid,        'wknd/components/title',             'title',             'Title',                  'Heading h1–h5',                           'WKND Content',    'title',          FALSE, TRUE),
    (md5('wknd-comp-text')::uuid,         'wknd/components/text',              'text',              'Text',                   'Rich text block',                         'WKND Content',    'text',           FALSE, TRUE),
    (md5('wknd-comp-image')::uuid,        'wknd/components/image',             'image',             'Image',                  'Responsive image with optional link',     'WKND Content',    'image',          FALSE, TRUE),
    (md5('wknd-comp-teaser')::uuid,       'wknd/components/teaser',            'teaser',            'Teaser',                 'Teaser card with image, text and CTA',    'WKND Content',    'teaser',         FALSE, TRUE),
    (md5('wknd-comp-carousel')::uuid,     'wknd/components/carousel',          'carousel',          'Carousel',               'Auto-playing or manual slide carousel',   'WKND Content',    'carousel',       TRUE,  TRUE),
    (md5('wknd-comp-tabs')::uuid,         'wknd/components/tabs',              'tabs',              'Tabs',                   'Tabbed content panel',                    'WKND Content',    'tabs',           TRUE,  TRUE),
    (md5('wknd-comp-breadcrumb')::uuid,   'wknd/components/breadcrumb',        'breadcrumb',        'Breadcrumb',             'Page path breadcrumb',                    'WKND Navigation', 'breadcrumb',     FALSE, TRUE),
    (md5('wknd-comp-navigation')::uuid,   'wknd/components/navigation',        'navigation',        'Navigation',             'Primary site navigation',                 'WKND Navigation', 'navigation',     FALSE, TRUE),
    (md5('wknd-comp-langnav')::uuid,      'wknd/components/languagenavigation','languagenavigation','Language Navigation',    'Language/region switcher',                'WKND Navigation', 'globe',          FALSE, TRUE),
    (md5('wknd-comp-search')::uuid,       'wknd/components/search',            'search',            'Search',                 'Site search bar',                         'WKND Navigation', 'search',         FALSE, TRUE),
    (md5('wknd-comp-button')::uuid,       'wknd/components/button',            'button',            'Button',                 'CTA button with optional icon',           'WKND Content',    'button',         FALSE, TRUE),
    (md5('wknd-comp-separator')::uuid,    'wknd/components/separator',         'separator',         'Separator',              'Horizontal rule / visual divider',        'WKND Content',    'separator',      FALSE, TRUE),
    (md5('wknd-comp-sharing')::uuid,      'wknd/components/sharing',           'sharing',           'Social Sharing',         'Facebook, Pinterest social share buttons','WKND Content',    'share',          FALSE, TRUE),
    (md5('wknd-comp-imagelist')::uuid,    'wknd/components/image-list',        'image-list',        'Image List',             'Dynamic list of pages with thumbnails',   'WKND Content',    'list',           FALSE, TRUE),
    (md5('wknd-comp-cf')::uuid,           'wknd/components/contentfragment',   'contentfragment',   'Content Fragment',       'Embeds a structured content fragment',    'WKND Content',    'fragment-link',  FALSE, TRUE),
    (md5('wknd-comp-signinbtn')::uuid,    'wknd/components/form/sign-in-buttons','sign-in-buttons', 'Sign In Buttons',        'Sign-in / sign-out auth UI',              'WKND Form',       'lock',           FALSE, TRUE),
    (md5('wknd-comp-xfref')::uuid,        'flexcms/experience-fragment',       'experience-fragment','Experience Fragment Ref','Inline XF variation reference',          'WKND Structure',  'link',           FALSE, TRUE)
ON CONFLICT (resource_type) DO NOTHING;
