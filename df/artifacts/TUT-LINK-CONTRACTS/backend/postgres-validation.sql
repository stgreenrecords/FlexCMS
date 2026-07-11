CREATE TABLE component_definitions (
    resource_type text PRIMARY KEY,
    data_schema jsonb NOT NULL
);

INSERT INTO component_definitions VALUES
('tut-usa/navigation-search-discovery/navigation', '{"type":"object","properties":{"logo":{"type":"string"},"primaryLinks":{"type":"array","items":{"type":"string"}},"utilityLinks":{"type":"array"},"accountEntry":{"type":"string"},"sticky":{"type":"boolean"}}}'),
('tut-usa/navigation-search-discovery/footer', '{"type":"object","properties":{"logo":{"type":"string"},"footerLinkGroups":{"type":"array","items":{"type":"string"}},"socialLinks":{"type":"array"},"legalLinks":{"type":"array"},"copyrightText":{"type":"string"}}}'),
('tut-usa/calls-to-action-promotions-campaigns/featured-content', '{"type":"object","properties":{"title":{"type":"string"},"items":{"type":"array","items":{"type":"string"}},"layout":{"type":"string"}}}');

\ir /tmp/v18.sql

DO $validation$
BEGIN
    IF (SELECT data_schema #>> '{properties,logo,type}' FROM component_definitions WHERE resource_type LIKE '%/navigation') <> 'string'
       OR (SELECT data_schema #>> '{properties,copyrightText,type}' FROM component_definitions WHERE resource_type LIKE '%/footer') <> 'string'
       OR (SELECT data_schema #>> '{properties,layout,type}' FROM component_definitions WHERE resource_type LIKE '%/featured-content') <> 'string' THEN
        RAISE EXCEPTION 'an unrelated schema property was removed';
    END IF;

    IF (SELECT data_schema #>> '{properties,primaryLinks,items,type}' FROM component_definitions WHERE resource_type LIKE '%/navigation') <> 'object'
       OR (SELECT data_schema #>> '{properties,footerLinkGroups,items,properties,links,items,type}' FROM component_definitions WHERE resource_type LIKE '%/footer') <> 'object'
       OR (SELECT data_schema #>> '{properties,items,items,type}' FROM component_definitions WHERE resource_type LIKE '%/featured-content') <> 'object' THEN
        RAISE EXCEPTION 'a canonical link object contract is missing';
    END IF;
END
$validation$;

SELECT 'POSTGRES_V18_VALIDATION=PASS' AS result;

