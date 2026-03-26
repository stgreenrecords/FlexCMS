-- =============================================================================
-- WKND Sample Website — 02: Page templates
-- Run order: after 01_site_components.sql
-- =============================================================================

INSERT INTO template_definitions (id, name, title, description, resource_type, structure, active)
VALUES
-- Landing page (home, magazine section root)
(md5('wknd-tpl-landing')::uuid,
 'wknd/templates/landing-page',
 'WKND Landing Page',
 'Full-width landing page: header XF, free content area, footer XF.',
 'wknd/components/page',
 '{
   "children": [
     {"name":"header","resourceType":"flexcms/experience-fragment",
      "locked":true,"properties":{"fragmentPath":"experience-fragments.wknd.language-masters.en.site.header.master"}},
     {"name":"root","resourceType":"wknd/components/container","policy":"main-content"},
     {"name":"footer","resourceType":"flexcms/experience-fragment",
      "locked":true,"properties":{"fragmentPath":"experience-fragments.wknd.language-masters.en.site.footer.master"}}
   ]
 }'::jsonb,
 TRUE),

-- Adventure page (individual trip pages)
(md5('wknd-tpl-adventure')::uuid,
 'wknd/templates/adventure-page',
 'WKND Adventure Page',
 'Adventure detail: header XF, hero carousel, breadcrumb, content tabs, footer XF.',
 'wknd/components/page',
 '{
   "children": [
     {"name":"header","resourceType":"flexcms/experience-fragment",
      "locked":true,"properties":{"fragmentPath":"experience-fragments.wknd.language-masters.en.site.header.master"}},
     {"name":"root","resourceType":"wknd/components/container","policy":"adventure-content"},
     {"name":"footer","resourceType":"flexcms/experience-fragment",
      "locked":true,"properties":{"fragmentPath":"experience-fragments.wknd.language-masters.en.site.footer.master"}}
   ]
 }'::jsonb,
 TRUE),

-- Article page (magazine articles)
(md5('wknd-tpl-article')::uuid,
 'wknd/templates/article-page',
 'WKND Article Page',
 'Magazine article: header XF, hero image, breadcrumb, rich text body, footer XF.',
 'wknd/components/page',
 '{
   "children": [
     {"name":"header","resourceType":"flexcms/experience-fragment",
      "locked":true,"properties":{"fragmentPath":"experience-fragments.wknd.language-masters.en.site.header.master"}},
     {"name":"root","resourceType":"wknd/components/container","policy":"article-content"},
     {"name":"footer","resourceType":"flexcms/experience-fragment",
      "locked":true,"properties":{"fragmentPath":"experience-fragments.wknd.language-masters.en.site.footer.master"}}
   ]
 }'::jsonb,
 TRUE),

-- Content page (about-us, faqs)
(md5('wknd-tpl-content')::uuid,
 'wknd/templates/content-page',
 'WKND Content Page',
 'General content: header XF, main container, footer XF.',
 'wknd/components/page',
 '{
   "children": [
     {"name":"header","resourceType":"flexcms/experience-fragment",
      "locked":true,"properties":{"fragmentPath":"experience-fragments.wknd.language-masters.en.site.header.master"}},
     {"name":"root","resourceType":"wknd/components/container","policy":"main-content"},
     {"name":"footer","resourceType":"flexcms/experience-fragment",
      "locked":true,"properties":{"fragmentPath":"experience-fragments.wknd.language-masters.en.site.footer.master"}}
   ]
 }'::jsonb,
 TRUE)

ON CONFLICT (name) DO NOTHING;
