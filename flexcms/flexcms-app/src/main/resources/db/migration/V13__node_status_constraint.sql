-- V13: Add CHECK constraint on content_nodes.status to enforce valid enum values.
-- Prevents SQL seed files or external inserts from storing values that don't
-- exist in NodeStatus (e.g. 'LIVE' instead of 'PUBLISHED').
ALTER TABLE content_nodes
    ADD CONSTRAINT chk_content_nodes_status
        CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'));
