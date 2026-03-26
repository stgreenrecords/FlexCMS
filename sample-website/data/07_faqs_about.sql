-- =============================================================================
-- WKND Sample Website — 07: FAQs + About Us pages
-- Run order: after 04_home.sql
-- =============================================================================

INSERT INTO content_nodes (id, path, name, resource_type, parent_path, properties, status, site_id, locale, created_by, modified_by)
VALUES

-- About Us
(md5('wknd-page-about')::uuid,
 'wknd.language-masters.en.about-us',
 'about-us', 'wknd/components/page',
 'wknd.language-masters.en',
 '{
   "title": "About WKND Adventures",
   "description": "Learn about the team behind WKND Adventures and our mission to connect people with the outdoors.",
   "template": "wknd/templates/content-page",
   "components": [
     {"name":"root","resourceType":"wknd/components/container","data":{},"children":[
       {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":3}},
       {"name":"title","resourceType":"wknd/components/title","data":{"title":"About WKND","type":"h1"}},
       {"name":"hero","resourceType":"wknd/components/image","data":{
         "fileReference":"/content/dam/wknd-shared/en/adventures/climbing-new-zealand/adobestock-140634652.jpeg",
         "alt":"WKND team in the mountains"
       }},
       {"name":"mission","resourceType":"wknd/components/text","data":{
         "text":"<h2>Our Mission</h2><p>WKND is a collective of outdoors, music, crafts, adventure sports and travel enthusiasts who want to share our experiences, connections and expertise with the world.</p><p>We believe that getting outside — whether for an afternoon hike or a two-week expedition — changes how you see yourself and the world around you.</p>",
         "textIsRich":true
       }},
       {"name":"separator","resourceType":"wknd/components/separator","data":{}},
       {"name":"team-title","resourceType":"wknd/components/title","data":{"title":"Our Contributors","type":"h2"}},
       {"name":"team-text","resourceType":"wknd/components/text","data":{
         "text":"<p>Our writers and photographers are professional athletes, travel writers and outdoor guides from around the world. They bring first-hand experience to every article and adventure page on WKND.</p>",
         "textIsRich":true
       }},
       {"name":"jacob","resourceType":"flexcms/experience-fragment","data":{"fragmentPath":"experience-fragments.wknd.language-masters.en.contributors.jacob-wester.master"}},
       {"name":"separator2","resourceType":"wknd/components/separator","data":{}},
       {"name":"contact","resourceType":"wknd/components/text","data":{
         "text":"<h2>Contact Us</h2><p>Have a question or want to pitch a story? Email us at <a href=\"mailto:hello@wknd.site\">hello@wknd.site</a> or follow us on Instagram at @wkndadventures.</p>",
         "textIsRich":true
       }}
     ]}
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install'),

-- FAQs
(md5('wknd-page-faqs')::uuid,
 'wknd.language-masters.en.faqs',
 'faqs', 'wknd/components/page',
 'wknd.language-masters.en',
 '{
   "title": "Frequently Asked Questions",
   "description": "Everything you need to know before booking a WKND Adventure trip.",
   "template": "wknd/templates/content-page",
   "components": [
     {"name":"root","resourceType":"wknd/components/container","data":{},"children":[
       {"name":"breadcrumb","resourceType":"wknd/components/breadcrumb","data":{"startLevel":3}},
       {"name":"title","resourceType":"wknd/components/title","data":{"title":"Frequently Asked Questions","type":"h1"}},
       {"name":"intro","resourceType":"wknd/components/text","data":{
         "text":"<p>Have a question about booking, trip logistics or what to pack? Check below for answers to our most common questions.</p>",
         "textIsRich":true
       }},
       {"name":"separator","resourceType":"wknd/components/separator","data":{}},
       {"name":"booking-faqs","resourceType":"wknd/components/text","data":{
         "text":"<h2>Booking</h2><h3>How do I book a trip?</h3><p>Browse our Adventures section and click \"View Trip\" on any adventure page. Fill in the booking form and one of our team will confirm your spot within 24 hours.</p><h3>What is the cancellation policy?</h3><p>Full refund up to 30 days before departure. 50% refund between 14-29 days. No refund within 14 days of departure. Travel insurance is strongly recommended.</p><h3>Are group discounts available?</h3><p>Yes — groups of 6 or more receive a 10% discount. Contact us directly to book group trips.</p>",
         "textIsRich":true
       }},
       {"name":"separator2","resourceType":"wknd/components/separator","data":{}},
       {"name":"gear-faqs","resourceType":"wknd/components/text","data":{
         "text":"<h2>Gear &amp; Equipment</h2><h3>Do I need to bring my own gear?</h3><p>Most trips include all technical equipment. Check the \"What to Bring\" tab on each adventure page for trip-specific details.</p><h3>What fitness level do I need?</h3><p>Each trip is rated Beginner, Intermediate or Advanced. Check the difficulty rating on the adventure page before booking.</p>",
         "textIsRich":true
       }},
       {"name":"separator3","resourceType":"wknd/components/separator","data":{}},
       {"name":"cta-title","resourceType":"wknd/components/title","data":{"title":"Still have questions?","type":"h3"}},
       {"name":"cta-button","resourceType":"wknd/components/button","data":{"title":"Contact Us","linkURL":"/wknd/language-masters/en/about-us"}}
     ]}
   ]
 }'::jsonb,
 'LIVE', 'wknd', 'en', 'wknd-install', 'wknd-install')

ON CONFLICT (path) DO NOTHING;
