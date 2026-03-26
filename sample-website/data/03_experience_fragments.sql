-- =============================================================================
-- WKND Sample Website — 03: Experience Fragments
-- header, footer, sign-in, 3 contributor bylines
-- Run order: after 01_site_components.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- XF: site/header
-- ---------------------------------------------------------------------------
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, properties, status, site_id, locale, created_by, modified_by)
VALUES
(md5('xf-header-folder')::uuid,
 'experience-fragments.wknd.language-masters.en.site.header',
 'header', 'flexcms/xf-folder',
 'experience-fragments.wknd.language-masters.en.site',
 '{"title":"Header","description":"Global site header with logo, navigation, search and sign-in."}'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

(md5('xf-header-master')::uuid,
 'experience-fragments.wknd.language-masters.en.site.header.master',
 'master', 'flexcms/xf-page',
 'experience-fragments.wknd.language-masters.en.site.header',
 '{
   "title": "Header",
   "xfVariantType": "web",
   "xfMasterVariation": true,
   "components": [
     {
       "name": "root",
       "resourceType": "wknd/components/container",
       "data": {},
       "children": [
         {
           "name": "container",
           "resourceType": "wknd/components/container",
           "data": {},
           "children": [
             {
               "name": "image",
               "resourceType": "wknd/components/image",
               "data": {
                 "fileReference": "/content/dam/wknd/en/site/wknd-logo-dk.svg",
                 "alt": "WKND Logo",
                 "linkURL": "/"
               }
             },
             {
               "name": "navigation",
               "resourceType": "wknd/components/navigation",
               "data": {
                 "navigationRoot": "/wknd/language-masters/en",
                 "structureDepth": 1
               }
             },
             {
               "name": "search",
               "resourceType": "wknd/components/search",
               "data": {
                 "searchRoot": "/wknd/language-masters/en"
               }
             },
             {
               "name": "sign-in-buttons",
               "resourceType": "wknd/components/form/sign-in-buttons",
               "data": {
                 "signInLabel": "Sign In",
                 "signOutLabel": "Sign Out",
                 "greetingLabel": "Welcome"
               }
             }
           ]
         }
       ]
     }
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install')

ON CONFLICT (path) DO NOTHING;

INSERT INTO experience_fragment_metadata (id, xf_path, site_id, locale, title, description)
VALUES (md5('xf-meta-header')::uuid,
        'experience-fragments.wknd.language-masters.en.site.header',
        'wknd', 'en', 'Header', 'Global site header')
ON CONFLICT (xf_path) DO NOTHING;

-- ---------------------------------------------------------------------------
-- XF: site/footer
-- ---------------------------------------------------------------------------
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, properties, status, site_id, locale, created_by, modified_by)
VALUES
(md5('xf-footer-folder')::uuid,
 'experience-fragments.wknd.language-masters.en.site.footer',
 'footer', 'flexcms/xf-folder',
 'experience-fragments.wknd.language-masters.en.site',
 '{"title":"Footer","description":"Global site footer with navigation, social links and copyright."}'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

(md5('xf-footer-master')::uuid,
 'experience-fragments.wknd.language-masters.en.site.footer.master',
 'master', 'flexcms/xf-page',
 'experience-fragments.wknd.language-masters.en.site.footer',
 '{
   "title": "Footer",
   "xfVariantType": "web",
   "xfMasterVariation": true,
   "components": [
     {
       "name": "root",
       "resourceType": "wknd/components/container",
       "data": {},
       "children": [
         {
           "name": "container",
           "resourceType": "wknd/components/container",
           "data": {},
           "children": [
             {
               "name": "image",
               "resourceType": "wknd/components/image",
               "data": {
                 "fileReference": "/content/dam/wknd/en/site/wknd-logo-light.svg",
                 "alt": "WKND Logo",
                 "linkURL": "/"
               }
             },
             {
               "name": "navigation",
               "resourceType": "wknd/components/navigation",
               "data": {
                 "navigationRoot": "/wknd/language-masters/en",
                 "structureDepth": 1,
                 "accessibilityLabel": "Footer navigation"
               }
             },
             {
               "name": "follow-us",
               "resourceType": "wknd/components/title",
               "data": {"title": "Follow Us", "type": "h4"}
             },
             {
               "name": "social-facebook",
               "resourceType": "wknd/components/button",
               "data": {"title": "Facebook", "linkURL": "#facebook", "icon": "facebook"}
             },
             {
               "name": "social-twitter",
               "resourceType": "wknd/components/button",
               "data": {"title": "Twitter", "linkURL": "#twitter", "icon": "twitter"}
             },
             {
               "name": "social-instagram",
               "resourceType": "wknd/components/button",
               "data": {"title": "Instagram", "linkURL": "#instagram", "icon": "instagram"}
             },
             {
               "name": "separator",
               "resourceType": "wknd/components/separator",
               "data": {}
             },
             {
               "name": "copyright",
               "resourceType": "wknd/components/text",
               "data": {
                 "text": "<p>© 2024 WKND Adventures. A fictitious adventure and travel website built with FlexCMS.</p>",
                 "textIsRich": true
               }
             }
           ]
         }
       ]
     }
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install')

ON CONFLICT (path) DO NOTHING;

INSERT INTO experience_fragment_metadata (id, xf_path, site_id, locale, title, description)
VALUES (md5('xf-meta-footer')::uuid,
        'experience-fragments.wknd.language-masters.en.site.footer',
        'wknd', 'en', 'Footer', 'Global site footer')
ON CONFLICT (xf_path) DO NOTHING;

-- ---------------------------------------------------------------------------
-- XF: site/sign-in
-- ---------------------------------------------------------------------------
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, properties, status, site_id, locale, created_by, modified_by)
VALUES
(md5('xf-signin-folder')::uuid,
 'experience-fragments.wknd.language-masters.en.site.sign-in',
 'sign-in', 'flexcms/xf-folder',
 'experience-fragments.wknd.language-masters.en.site',
 '{"title":"Sign In","description":"Sign-in dialog experience fragment."}'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

(md5('xf-signin-master')::uuid,
 'experience-fragments.wknd.language-masters.en.site.sign-in.master',
 'master', 'flexcms/xf-page',
 'experience-fragments.wknd.language-masters.en.site.sign-in',
 '{
   "title": "Sign In",
   "xfVariantType": "web",
   "xfMasterVariation": true,
   "components": [
     {
       "name": "root",
       "resourceType": "wknd/components/container",
       "data": {},
       "children": [
         {
           "name": "title",
           "resourceType": "wknd/components/title",
           "data": {"title": "Sign In to WKND", "type": "h2"}
         },
         {
           "name": "text",
           "resourceType": "wknd/components/text",
           "data": {"text": "<p>Sign in to save your favourite adventures and access exclusive member content.</p>", "textIsRich": true}
         }
       ]
     }
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install')

ON CONFLICT (path) DO NOTHING;

INSERT INTO experience_fragment_metadata (id, xf_path, site_id, locale, title, description)
VALUES (md5('xf-meta-signin')::uuid,
        'experience-fragments.wknd.language-masters.en.site.sign-in',
        'wknd', 'en', 'Sign In', 'Sign-in dialog')
ON CONFLICT (xf_path) DO NOTHING;

-- ---------------------------------------------------------------------------
-- XF: contributors — jacob-wester (byline example)
-- ---------------------------------------------------------------------------
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, properties, status, site_id, locale, created_by, modified_by)
VALUES
(md5('xf-contrib-root')::uuid,
 'experience-fragments.wknd.language-masters.en.contributors',
 'contributors', 'flexcms/xf-folder',
 'experience-fragments.wknd.language-masters.en',
 '{"title":"Contributors","description":"Author byline experience fragments."}'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

(md5('xf-jacob-folder')::uuid,
 'experience-fragments.wknd.language-masters.en.contributors.jacob-wester',
 'jacob-wester', 'flexcms/xf-folder',
 'experience-fragments.wknd.language-masters.en.contributors',
 '{"title":"Jacob Wester","description":"Adventure sports contributor."}'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

(md5('xf-jacob-master')::uuid,
 'experience-fragments.wknd.language-masters.en.contributors.jacob-wester.master',
 'master', 'flexcms/xf-page',
 'experience-fragments.wknd.language-masters.en.contributors.jacob-wester',
 '{
   "title": "Jacob Wester",
   "xfVariantType": "web",
   "xfMasterVariation": true,
   "components": [
     {
       "name": "root",
       "resourceType": "wknd/components/container",
       "data": {},
       "children": [
         {
           "name": "image",
           "resourceType": "wknd/components/image",
           "data": {
             "fileReference": "/content/dam/wknd-shared/en/contributors/jacob-wester.jpg",
             "alt": "Jacob Wester"
           }
         },
         {
           "name": "title",
           "resourceType": "wknd/components/title",
           "data": {"title": "Jacob Wester", "type": "h3"}
         },
         {
           "name": "bio",
           "resourceType": "wknd/components/text",
           "data": {
             "text": "<p>Jacob Wester is a professional freeskier and adventure sports enthusiast from Sweden. He has competed in numerous freeride world tours and is passionate about sharing his experiences in the mountains.</p>",
             "textIsRich": true
           }
         }
       ]
     }
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

(md5('xf-jacob-byline')::uuid,
 'experience-fragments.wknd.language-masters.en.contributors.jacob-wester.byline',
 'byline', 'flexcms/xf-page',
 'experience-fragments.wknd.language-masters.en.contributors.jacob-wester',
 '{
   "title": "Jacob Wester Byline",
   "xfVariantType": "web",
   "components": [
     {
       "name": "root",
       "resourceType": "wknd/components/container",
       "data": {},
       "children": [
         {
           "name": "image",
           "resourceType": "wknd/components/image",
           "data": {
             "fileReference": "/content/dam/wknd-shared/en/contributors/jacob-wester.jpg",
             "alt": "Jacob Wester"
           }
         },
         {
           "name": "title",
           "resourceType": "wknd/components/title",
           "data": {"title": "Jacob Wester", "type": "h5"}
         },
         {
           "name": "subtitle",
           "resourceType": "wknd/components/text",
           "data": {"text": "<p>Professional Freeskier</p>", "textIsRich": true}
         }
       ]
     }
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install')

ON CONFLICT (path) DO NOTHING;

INSERT INTO experience_fragment_metadata (id, xf_path, site_id, locale, title, description)
VALUES (md5('xf-meta-jacob')::uuid,
        'experience-fragments.wknd.language-masters.en.contributors.jacob-wester',
        'wknd', 'en', 'Jacob Wester', 'Contributor byline — Jacob Wester')
ON CONFLICT (xf_path) DO NOTHING;
