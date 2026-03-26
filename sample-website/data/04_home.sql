-- =============================================================================
-- WKND Sample Website — 04: Home page
-- Run order: after 01, 02, 03
-- =============================================================================

INSERT INTO content_nodes (id, path, name, resource_type, parent_path, properties, status, site_id, locale, created_by, modified_by)
VALUES
(md5('wknd-page-home')::uuid,
 'wknd.language-masters.en',
 'en',
 'wknd/components/page',
 'wknd.language-masters',
 '{
   "title": "WKND Adventures and Travel",
   "pageTitle": "Home",
   "description": "WKND is a collective of outdoors, music, crafts, adventure sports, and travel enthusiasts that want to share our experiences, connections, and expertise with the world.",
   "template": "wknd/templates/landing-page",
   "tags": ["wknd-shared:customer-journey/attract"],
   "components": [
     {
       "name": "root",
       "resourceType": "wknd/components/container",
       "data": {},
       "children": [
         {
           "name": "container",
           "resourceType": "wknd/components/container",
           "data": {"layout": "responsiveGrid"},
           "children": [
             {
               "name": "carousel",
               "resourceType": "wknd/components/carousel",
               "data": {"autoplay": false, "delay": 5000},
               "children": [
                 {
                   "name": "item-adventures",
                   "resourceType": "wknd/components/teaser",
                   "data": {
                     "title": "WKND Adventures",
                     "description": "<p>With WKND Adventures, you don''t just see the world — you experience its cultures, flavors and wonders.</p>",
                     "fileReference": "/content/dam/wknd-shared/en/adventures/riverside-camping-australia/adobestock-216674449.jpeg",
                     "actionsEnabled": true,
                     "actions": [{"text": "View Trips", "link": "/wknd/language-masters/en/adventures"}]
                   }
                 },
                 {
                   "name": "item-san-diego",
                   "resourceType": "wknd/components/teaser",
                   "data": {
                     "title": "San Diego Surf Spots",
                     "description": "<p>The best surf spots in Southern California, from Blacks Beach to Ocean Beach.</p>",
                     "fileReference": "/content/dam/wknd-shared/en/magazine/san-diego-surf-spots/beach-walking.jpg",
                     "actionsEnabled": true,
                     "actions": [{"text": "Full Article", "link": "/wknd/language-masters/en/magazine/san-diego-surf"}]
                   }
                 },
                 {
                   "name": "item-skiing",
                   "resourceType": "wknd/components/teaser",
                   "data": {
                     "title": "Downhill Skiing Wyoming",
                     "description": "<p>A skiers paradise far from crowds and close to nature with terrain so vast it appears uncharted.</p>",
                     "fileReference": "/content/dam/wknd-shared/en/adventures/downhill-skiing-wyoming/adobestock-185234795.jpeg",
                     "actionsEnabled": true,
                     "actions": [{"text": "View Trip", "link": "/wknd/language-masters/en/adventures/downhill-skiing-wyoming"}]
                   }
                 }
               ]
             },
             {
               "name": "featured-articles-section",
               "resourceType": "wknd/components/container",
               "data": {"layout": "responsiveGrid"},
               "children": [
                 {
                   "name": "featured-teaser",
                   "resourceType": "wknd/components/teaser",
                   "data": {
                     "title": "Camping in Western Australia",
                     "pretitle": "Featured Article",
                     "description": "<p>A remote paradise in the south-west of Western Australia, where golden beaches meet ancient forests.</p>",
                     "fileReference": "/content/dam/wknd-shared/en/magazine/western-australia/adobestock-156407519.jpeg",
                     "actionsEnabled": true,
                     "actions": [{"text": "Full Article", "link": "/wknd/language-masters/en/magazine/western-australia"}]
                   }
                 },
                 {
                   "name": "recent-articles-title",
                   "resourceType": "wknd/components/title",
                   "data": {"title": "Recent Articles", "type": "h2"}
                 },
                 {
                   "name": "articles-list",
                   "resourceType": "wknd/components/image-list",
                   "data": {
                     "listFrom": "static",
                     "pages": [
                       "/wknd/language-masters/en/magazine/guide-la-skateparks",
                       "/wknd/language-masters/en/magazine/ski-touring",
                       "/wknd/language-masters/en/magazine/arctic-surfing",
                       "/wknd/language-masters/en/magazine/san-diego-surf"
                     ]
                   }
                 },
                 {
                   "name": "all-articles-button",
                   "resourceType": "wknd/components/button",
                   "data": {"title": "All Articles", "linkURL": "/wknd/language-masters/en/magazine"}
                 },
                 {
                   "name": "separator",
                   "resourceType": "wknd/components/separator",
                   "data": {}
                 }
               ]
             },
             {
               "name": "world-teaser",
               "resourceType": "wknd/components/teaser",
               "data": {
                 "title": "Experience the world with us",
                 "description": "<p>With WKND Adventures, you don''t just see the world — you experience its cultures, flavors and wonders.</p>",
                 "fileReference": "/content/dam/wknd-shared/en/adventures/climbing-new-zealand/adobestock-140634652.jpeg",
                 "actionsEnabled": true,
                 "actions": [{"text": "See Trip", "link": "/wknd/language-masters/en/adventures/climbing-new-zealand"}]
               }
             },
             {
               "name": "adventures-section",
               "resourceType": "wknd/components/container",
               "data": {"layout": "responsiveGrid"},
               "children": [
                 {
                   "name": "where-title",
                   "resourceType": "wknd/components/title",
                   "data": {"title": "Where do you want to go?", "type": "h3"}
                 },
                 {
                   "name": "adventures-list",
                   "resourceType": "wknd/components/image-list",
                   "data": {
                     "listFrom": "children",
                     "parentPage": "/wknd/language-masters/en/adventures",
                     "maxItems": 4,
                     "orderBy": "title"
                   }
                 },
                 {
                   "name": "all-trips-button",
                   "resourceType": "wknd/components/button",
                   "data": {"title": "All Trips", "linkURL": "/wknd/language-masters/en/adventures"}
                 },
                 {
                   "name": "separator2",
                   "resourceType": "wknd/components/separator",
                   "data": {}
                 }
               ]
             }
           ]
         }
       ]
     }
   ]
 }'::jsonb,
 'PUBLISHED', 'wknd', 'en', 'wknd-install', 'wknd-install')
ON CONFLICT (path) DO UPDATE
    SET properties = EXCLUDED.properties,
        modified_by = EXCLUDED.modified_by;
