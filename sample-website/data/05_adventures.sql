-- =============================================================================
-- WKND Sample Website — 05: Adventures section + 8 adventure pages
-- Run order: after 04_home.sql
-- =============================================================================

-- Adventures section root
INSERT INTO content_nodes (id, path, name, resource_type, parent_path, properties, status, site_id, locale, created_by, modified_by)
VALUES
(md5('wknd-page-adventures')::uuid,
 'wknd.language-masters.en.adventures',
 'adventures', 'wknd/components/page',
 'wknd.language-masters.en',
 '{
   "title": "Adventures",
   "description": "Explore our collection of outdoor adventures — from surfing and skiing to cycling and rock climbing.",
   "template": "wknd/templates/landing-page",
   "components": [
     {
       "name": "root",
       "resourceType": "wknd/components/container",
       "data": {},
       "children": [
         {
           "name": "header-title",
           "resourceType": "wknd/components/title",
           "data": {"title": "Adventures", "type": "h1"}
         },
         {
           "name": "intro",
           "resourceType": "wknd/components/text",
           "data": {
             "text": "<p>Choose your next WKND adventure. From surf camps in Bali to ski touring the Alps, we have trips for every level and every season.</p>",
             "textIsRich": true
           }
         },
         {
           "name": "adventures-list",
           "resourceType": "wknd/components/image-list",
           "data": {
             "listFrom": "children",
             "parentPage": "/wknd/language-masters/en/adventures",
             "orderBy": "title",
             "sortOrder": "asc"
           }
         }
       ]
     }
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install')
ON CONFLICT (path) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Helper macro: each adventure page follows the same pattern
-- ---------------------------------------------------------------------------

INSERT INTO content_nodes (id, path, name, resource_type, parent_path, properties, status, site_id, locale, created_by, modified_by)
VALUES

-- 1. Bali Surf Camp
(md5('wknd-adv-bali')::uuid,
 'wknd.language-masters.en.adventures.bali-surf-camp',
 'bali-surf-camp', 'wknd/components/page',
 'wknd.language-masters.en.adventures',
 '{
   "title": "Bali Surf Camp",
   "description": "Surfing in Bali is on the bucket list of every surfer. Bali offers warm water, tropical vibes, awesome breaks and low cost expenses.",
   "template": "wknd/templates/adventure-page",
   "thumbnail": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/adobestock-175749320.jpg",
   "activity": "Surfing", "adventureType": "Overnight Trip",
   "tripLength": "6 Days", "groupSize": "5-6", "difficulty": "Beginner", "price": "$5,000 USD",
   "components": [
     {
       "name": "root",
       "resourceType": "wknd/components/container",
       "data": {"layout": "responsiveGrid"},
       "children": [
         {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":4}},
         {
           "name": "hero-carousel",
           "resourceType": "wknd/components/carousel",
           "data": {},
           "children": [
             {"name":"hero-image","resourceType":"wknd/components/image","data":{"fileReference":"/content/dam/wknd-shared/en/adventures/bali-surf-camp/adobestock-175749320.jpg"}}
           ]
         },
         {"name":"page-title","resourceType":"wknd/components/title","data":{"title":"Bali Surf Camp","type":"h1"}},
         {
           "name": "details",
           "resourceType": "wknd/components/contentfragment",
           "data": {
             "fragmentPath": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp",
             "elementNames": ["activity","adventureType","tripLength","groupSize","difficulty","price"],
             "displayMode": "multi"
           }
         },
         {
           "name": "tabs",
           "resourceType": "wknd/components/tabs",
           "data": {"accessibilityLabel": "adventure trip details"},
           "children": [
             {
               "name": "overview",
               "resourceType": "wknd/components/contentfragment",
               "data": {
                 "panelTitle": "Overview",
                 "text": "Surfing in Bali is on the bucket list of every surfer — whether you're a beginner or someone who's been surfing for decades, there will be a break to cater to your ability.",
                 "elementNames": ["description"]
               }
             },
             {
               "name": "itinerary",
               "resourceType": "wknd/components/contentfragment",
               "data": {
                 "panelTitle": "Itinerary",
                 "text": "Day 1: Arrive Denpasar. Day 2-3: Kuta Beach beginner breaks. Day 4: Keramas reef. Day 5: Nusa Dua. Day 6: Departure.",
                 "elementNames": ["itinerary"]
               }
             },
             {
               "name": "gear",
               "resourceType": "wknd/components/contentfragment",
               "data": {"panelTitle": "What to Bring", "text": "Surf shorts. Boards, beach chairs and towels provided.", "elementNames": ["gearList"]}
             }
           ]
         },
         {"name":"sharing-title","resourceType":"wknd/components/title","data":{"title":"Share this Adventure","type":"h5"}},
         {"name":"sharing","resourceType":"wknd/components/sharing","data":{}}
       ]
     }
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

-- 2. Climbing New Zealand
(md5('wknd-adv-climbing-nz')::uuid,
 'wknd.language-masters.en.adventures.climbing-new-zealand',
 'climbing-new-zealand', 'wknd/components/page',
 'wknd.language-masters.en.adventures',
 '{
   "title": "Climbing New Zealand",
   "description": "New Zealand offers world-class climbing from granite sea cliffs to alpine peaks. Join us for an unforgettable week in the Southern Alps.",
   "template": "wknd/templates/adventure-page",
   "thumbnail": "/content/dam/wknd-shared/en/adventures/climbing-new-zealand/adobestock-140634652.jpeg",
   "activity": "Rock Climbing", "adventureType": "Overnight Trip",
   "tripLength": "5 Days", "groupSize": "4-6", "difficulty": "Intermediate", "price": "$6,800 USD",
   "components": [
     {"name":"root","resourceType":"wknd/components/container","data":{},"children":[
       {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":4}},
       {"name":"hero-carousel","resourceType":"wknd/components/carousel","data":{},"children":[
         {"name":"hero","resourceType":"wknd/components/image","data":{"fileReference":"/content/dam/wknd-shared/en/adventures/climbing-new-zealand/adobestock-140634652.jpeg"}}
       ]},
       {"name":"page-title","resourceType":"wknd/components/title","data":{"title":"Climbing New Zealand","type":"h1"}},
       {"name":"tabs","resourceType":"wknd/components/tabs","data":{},"children":[
         {"name":"overview","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Overview","text":"New Zealand offers world-class climbing on granite cliffs and volcanic rock in scenery unrivalled anywhere on earth."}},
         {"name":"itinerary","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Itinerary","text":"Day 1: Arrive Christchurch. Days 2-3: Castle Hill boulders. Days 4-5: Wye Creek multi-pitch. Day 6: Depart."}},
         {"name":"gear","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"What to Bring","text":"Harness, helmet (rentals available). Approach shoes recommended. All technical gear provided."}}
       ]},
       {"name":"sharing","resourceType":"wknd/components/sharing","data":{}}
     ]}
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

-- 3. Downhill Skiing Wyoming
(md5('wknd-adv-skiing-wyoming')::uuid,
 'wknd.language-masters.en.adventures.downhill-skiing-wyoming',
 'downhill-skiing-wyoming', 'wknd/components/page',
 'wknd.language-masters.en.adventures',
 '{
   "title": "Downhill Skiing Wyoming",
   "description": "A skier's paradise far from crowds and close to nature with terrain so vast it appears uncharted.",
   "template": "wknd/templates/adventure-page",
   "thumbnail": "/content/dam/wknd-shared/en/adventures/downhill-skiing-wyoming/adobestock-185234795.jpeg",
   "activity": "Skiing", "adventureType": "Overnight Trip",
   "tripLength": "4 Days", "groupSize": "6-8", "difficulty": "Intermediate", "price": "$4,500 USD",
   "components": [
     {"name":"root","resourceType":"wknd/components/container","data":{},"children":[
       {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":4}},
       {"name":"hero-carousel","resourceType":"wknd/components/carousel","data":{},"children":[
         {"name":"hero","resourceType":"wknd/components/image","data":{"fileReference":"/content/dam/wknd-shared/en/adventures/downhill-skiing-wyoming/adobestock-185234795.jpeg"}}
       ]},
       {"name":"page-title","resourceType":"wknd/components/title","data":{"title":"Downhill Skiing Wyoming","type":"h1"}},
       {"name":"tabs","resourceType":"wknd/components/tabs","data":{},"children":[
         {"name":"overview","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Overview","text":"Jackson Hole Mountain Resort sits in the Teton Range and offers over 2500 acres of terrain, 4,139 vertical feet and guaranteed powder days."}},
         {"name":"itinerary","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Itinerary","text":"Day 1: Arrive Jackson. Day 2: Beginner/intermediate runs + ski school. Day 3: Off-piste with guide. Day 4: Free ski + depart."}},
         {"name":"gear","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"What to Bring","text":"Warm base layers, ski jacket and pants. Skis, boots and poles available for rental on site."}}
       ]},
       {"name":"sharing","resourceType":"wknd/components/sharing","data":{}}
     ]}
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

-- 4. Cycling Tuscany
(md5('wknd-adv-cycling-tuscany')::uuid,
 'wknd.language-masters.en.adventures.cycling-tuscany',
 'cycling-tuscany', 'wknd/components/page',
 'wknd.language-masters.en.adventures',
 '{
   "title": "Cycling Tuscany",
   "description": "Pedal through the rolling hills of Tuscany, past vineyards and medieval villages, finishing each day with local wine and food.",
   "template": "wknd/templates/adventure-page",
   "thumbnail": "/content/dam/wknd-shared/en/adventures/cycling-tuscany/cycling-tuscany-hero.jpeg",
   "activity": "Cycling", "adventureType": "Overnight Trip",
   "tripLength": "7 Days", "groupSize": "6-10", "difficulty": "Beginner", "price": "$3,800 USD",
   "components": [
     {"name":"root","resourceType":"wknd/components/container","data":{},"children":[
       {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":4}},
       {"name":"hero-carousel","resourceType":"wknd/components/carousel","data":{},"children":[
         {"name":"hero","resourceType":"wknd/components/image","data":{"fileReference":"/content/dam/wknd-shared/en/adventures/cycling-tuscany/cycling-tuscany-hero.jpeg"}}
       ]},
       {"name":"page-title","resourceType":"wknd/components/title","data":{"title":"Cycling Tuscany","type":"h1"}},
       {"name":"tabs","resourceType":"wknd/components/tabs","data":{},"children":[
         {"name":"overview","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Overview","text":"Wind through cypress-lined roads and medieval hill towns on this 7-day e-bike or traditional road-bike tour through the heart of Tuscany."}},
         {"name":"itinerary","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Itinerary","text":"Day 1: Florence arrival. Days 2-3: Chianti route. Day 4: Siena. Days 5-6: Val d''Orcia. Day 7: Depart from Pisa."}},
         {"name":"gear","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"What to Bring","text":"Padded cycling shorts, helmet (provided), gloves. Road or e-bike included. Panniers and support van available."}}
       ]},
       {"name":"sharing","resourceType":"wknd/components/sharing","data":{}}
     ]}
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

-- 5. Napa Wine Tasting
(md5('wknd-adv-napa')::uuid,
 'wknd.language-masters.en.adventures.napa-wine-tasting',
 'napa-wine-tasting', 'wknd/components/page',
 'wknd.language-masters.en.adventures',
 '{
   "title": "Napa Wine Tasting",
   "description": "An immersive wine experience through the cellars and vineyards of Napa Valley with expert sommeliers.",
   "template": "wknd/templates/adventure-page",
   "thumbnail": "/content/dam/wknd-shared/en/adventures/napa-wine-tasting/napa-wine-hero.jpeg",
   "activity": "Food & Drink", "adventureType": "Day Trip",
   "tripLength": "2 Days", "groupSize": "2-10", "difficulty": "Beginner", "price": "$1,500 USD",
   "components": [
     {"name":"root","resourceType":"wknd/components/container","data":{},"children":[
       {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":4}},
       {"name":"hero-carousel","resourceType":"wknd/components/carousel","data":{},"children":[
         {"name":"hero","resourceType":"wknd/components/image","data":{"fileReference":"/content/dam/wknd-shared/en/adventures/napa-wine-tasting/napa-wine-hero.jpeg"}}
       ]},
       {"name":"page-title","resourceType":"wknd/components/title","data":{"title":"Napa Wine Tasting","type":"h1"}},
       {"name":"tabs","resourceType":"wknd/components/tabs","data":{},"children":[
         {"name":"overview","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Overview","text":"Visit four world-renowned wineries guided by a certified sommelier. Includes private barrel tastings and a curated pairing dinner."}},
         {"name":"itinerary","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Itinerary","text":"Day 1: Morning — Opus One and Mondavi. Afternoon — Stag''s Leap, Caymus. Evening — pairing dinner. Day 2: Farmer''s market, free afternoon."}},
         {"name":"gear","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"What to Bring","text":"Smart casual attire. Transportation and tasting fees included. Accommodation at boutique Napa B&B."}}
       ]},
       {"name":"sharing","resourceType":"wknd/components/sharing","data":{}}
     ]}
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

-- 6. Riverside Camping Australia
(md5('wknd-adv-camping-aus')::uuid,
 'wknd.language-masters.en.adventures.riverside-camping-australia',
 'riverside-camping-australia', 'wknd/components/page',
 'wknd.language-masters.en.adventures',
 '{
   "title": "Riverside Camping Australia",
   "description": "Camp under the stars along the banks of the Murray River in the heartland of Victoria, Australia.",
   "template": "wknd/templates/adventure-page",
   "thumbnail": "/content/dam/wknd-shared/en/adventures/riverside-camping-australia/adobestock-216674449.jpeg",
   "activity": "Camping", "adventureType": "Overnight Trip",
   "tripLength": "3 Days", "groupSize": "6-10", "difficulty": "Beginner", "price": "$900 USD",
   "components": [
     {"name":"root","resourceType":"wknd/components/container","data":{},"children":[
       {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":4}},
       {"name":"hero-carousel","resourceType":"wknd/components/carousel","data":{},"children":[
         {"name":"hero","resourceType":"wknd/components/image","data":{"fileReference":"/content/dam/wknd-shared/en/adventures/riverside-camping-australia/adobestock-216674449.jpeg"}}
       ]},
       {"name":"page-title","resourceType":"wknd/components/title","data":{"title":"Riverside Camping Australia","type":"h1"}},
       {"name":"tabs","resourceType":"wknd/components/tabs","data":{},"children":[
         {"name":"overview","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Overview","text":"3 nights of true Australian bush camping along the banks of the Murray River. Swim, kayak, fish and stargaze."}},
         {"name":"itinerary","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Itinerary","text":"Day 1: Drive from Melbourne, set up camp. Day 2: Kayak tour, campfire cooking. Day 3: Morning swim, return."}},
         {"name":"gear","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"What to Bring","text":"Sleeping bag, warm layers. Tents, camp kitchen and kayaks provided."}}
       ]},
       {"name":"sharing","resourceType":"wknd/components/sharing","data":{}}
     ]}
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

-- 7. Surf Camp Costa Rica
(md5('wknd-adv-surf-cr')::uuid,
 'wknd.language-masters.en.adventures.surf-camp-costa-rica',
 'surf-camp-costa-rica', 'wknd/components/page',
 'wknd.language-masters.en.adventures',
 '{
   "title": "Surf Camp Costa Rica",
   "description": "Learn to surf on the warm Pacific swells of Nosara, Costa Rica — one of the world's most consistent beginner breaks.",
   "template": "wknd/templates/adventure-page",
   "thumbnail": "/content/dam/wknd-shared/en/adventures/surf-camp-in-costa-rica/adobestock-266405335.jpeg",
   "activity": "Surfing", "adventureType": "Overnight Trip",
   "tripLength": "5 Days", "groupSize": "4-8", "difficulty": "Beginner", "price": "$2,800 USD",
   "components": [
     {"name":"root","resourceType":"wknd/components/container","data":{},"children":[
       {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":4}},
       {"name":"hero-carousel","resourceType":"wknd/components/carousel","data":{},"children":[
         {"name":"hero","resourceType":"wknd/components/image","data":{"fileReference":"/content/dam/wknd-shared/en/adventures/surf-camp-in-costa-rica/adobestock-266405335.jpeg"}}
       ]},
       {"name":"page-title","resourceType":"wknd/components/title","data":{"title":"Surf Camp Costa Rica","type":"h1"}},
       {"name":"tabs","resourceType":"wknd/components/tabs","data":{},"children":[
         {"name":"overview","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Overview","text":"Nosara''s Playa Guiones is a 7-km stretch of uncrowded beach with consistent 2-4 ft swells — perfect for beginner and intermediate surfers year-round."}},
         {"name":"itinerary","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Itinerary","text":"Day 1: Arrive Nosara, orientation surf. Days 2-4: Daily 3-hour surf lessons, yoga and free afternoons. Day 5: Sunrise session, depart."}},
         {"name":"gear","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"What to Bring","text":"Rash guard, reef-safe sunscreen. Surfboards provided. Accommodation in surf lodge included."}}
       ]},
       {"name":"sharing","resourceType":"wknd/components/sharing","data":{}}
     ]}
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

-- 8. Yosemite Backpacking
(md5('wknd-adv-yosemite')::uuid,
 'wknd.language-masters.en.adventures.yosemite-backpacking',
 'yosemite-backpacking', 'wknd/components/page',
 'wknd.language-masters.en.adventures',
 '{
   "title": "Yosemite Backpacking",
   "description": "Multi-day backcountry backpacking through the high Sierra — granite domes, alpine meadows and crystal clear lakes.",
   "template": "wknd/templates/adventure-page",
   "thumbnail": "/content/dam/wknd-shared/en/adventures/yosemite-backpacking/yosemite-hero.jpeg",
   "activity": "Hiking", "adventureType": "Overnight Trip",
   "tripLength": "7 Days", "groupSize": "4-6", "difficulty": "Advanced", "price": "$3,200 USD",
   "components": [
     {"name":"root","resourceType":"wknd/components/container","data":{},"children":[
       {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":4}},
       {"name":"hero-carousel","resourceType":"wknd/components/carousel","data":{},"children":[
         {"name":"hero","resourceType":"wknd/components/image","data":{"fileReference":"/content/dam/wknd-shared/en/adventures/yosemite-backpacking/yosemite-hero.jpeg"}}
       ]},
       {"name":"page-title","resourceType":"wknd/components/title","data":{"title":"Yosemite Backpacking","type":"h1"}},
       {"name":"tabs","resourceType":"wknd/components/tabs","data":{},"children":[
         {"name":"overview","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Overview","text":"Navigate Yosemite''s High Sierra Loop — 50 miles of pristine backcountry above 8,000 feet, passing Half Dome, Clouds Rest and Cathedral Lakes."}},
         {"name":"itinerary","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"Itinerary","text":"Day 1: Happy Isles trailhead to Little Yosemite Valley. Days 2-3: Half Dome sub-dome and cables. Days 4-5: Tuolumne Meadows loop. Days 6-7: Return via Clouds Rest."}},
         {"name":"gear","resourceType":"wknd/components/contentfragment","data":{"panelTitle":"What to Bring","text":"60L+ pack, bear canister (required), microspikes in early season. Tents and water filters provided."}}
       ]},
       {"name":"sharing","resourceType":"wknd/components/sharing","data":{}}
     ]}
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install')

ON CONFLICT (path) DO NOTHING;
