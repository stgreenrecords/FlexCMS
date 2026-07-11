-- Correct the canonical TUT-USA link contracts without replacing unrelated schema properties.

UPDATE component_definitions
SET data_schema = jsonb_set(
        data_schema,
        '{properties}',
        data_schema->'properties' || '{
          "primaryLinks": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["label", "url"],
              "properties": {
                "label": {"type": "string", "minLength": 1},
                "url": {"type": "string", "minLength": 1},
                "openInNewTab": {"type": "boolean"}
              }
            }
          },
          "utilityLinks": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["label", "url"],
              "properties": {
                "label": {"type": "string", "minLength": 1},
                "url": {"type": "string", "minLength": 1},
                "openInNewTab": {"type": "boolean"}
              }
            }
          },
          "accountEntry": {
            "type": "object",
            "required": ["label", "url"],
            "properties": {
              "label": {"type": "string", "minLength": 1},
              "url": {"type": "string", "minLength": 1},
              "openInNewTab": {"type": "boolean"}
            }
          }
        }'::jsonb,
        false
    )
WHERE resource_type = 'tut-usa/navigation-search-discovery/navigation';

UPDATE component_definitions
SET data_schema = jsonb_set(
        data_schema,
        '{properties}',
        data_schema->'properties' || '{
          "footerLinkGroups": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["title", "links"],
              "properties": {
                "title": {"type": "string", "minLength": 1},
                "links": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "required": ["label", "url"],
                    "properties": {
                      "label": {"type": "string", "minLength": 1},
                      "url": {"type": "string", "minLength": 1},
                      "openInNewTab": {"type": "boolean"}
                    }
                  }
                }
              }
            }
          },
          "socialLinks": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["label", "url"],
              "properties": {
                "label": {"type": "string", "minLength": 1},
                "url": {"type": "string", "minLength": 1},
                "openInNewTab": {"type": "boolean"}
              }
            }
          },
          "legalLinks": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["label", "url"],
              "properties": {
                "label": {"type": "string", "minLength": 1},
                "url": {"type": "string", "minLength": 1},
                "openInNewTab": {"type": "boolean"}
              }
            }
          }
        }'::jsonb,
        false
    )
WHERE resource_type = 'tut-usa/navigation-search-discovery/footer';

UPDATE component_definitions
SET data_schema = jsonb_set(
        data_schema,
        '{properties}',
        data_schema->'properties' || '{
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["label", "url"],
              "properties": {
                "label": {"type": "string", "minLength": 1},
                "url": {"type": "string", "minLength": 1},
                "openInNewTab": {"type": "boolean"}
              }
            }
          }
        }'::jsonb,
        false
    )
WHERE resource_type = 'tut-usa/calls-to-action-promotions-campaigns/featured-content';

