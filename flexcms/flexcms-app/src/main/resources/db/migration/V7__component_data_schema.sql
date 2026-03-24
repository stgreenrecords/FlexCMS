-- =============================================================================
-- V7: Add data_schema column to component_definitions
-- This stores the JSON Schema (draft-07) contract for each component's output,
-- enabling frontend teams to develop renderers independently of the backend.
-- =============================================================================

ALTER TABLE component_definitions
    ADD COLUMN IF NOT EXISTS data_schema JSONB DEFAULT '{}';

COMMENT ON COLUMN component_definitions.data_schema IS
    'JSON Schema (draft-07) defining the shape of component output data — the formal backend/frontend contract';

