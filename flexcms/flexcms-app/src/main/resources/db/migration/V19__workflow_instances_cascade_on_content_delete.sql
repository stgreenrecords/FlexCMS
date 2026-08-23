-- =============================================================================
-- V19: let content deletion cascade to its workflow history
--
-- Problem (REB-20 blocker R20-2): workflow_instances.content_node_id referenced
-- content_nodes(id) with no ON DELETE rule, so deleting any node that had ever
-- carried a workflow failed at the database:
--
--   ERROR: update or delete on table "content_nodes" violates foreign key
--          constraint "workflow_instances_content_node_id_fkey"
--
-- The author API surfaced that as an opaque HTTP 500, and the node stayed put.
-- Cancelling the workflow did not help: CANCELLED and COMPLETED instances keep
-- the reference, so any page that ever went through review became permanently
-- undeletable.
--
-- Fix: ON DELETE CASCADE. A workflow instance describes the review of one content
-- node; once that node is gone the instance describes nothing. Keeping orphaned
-- rows would also leave WorkflowEngine.getActiveWorkflow(path) able to return an
-- "active" workflow for content that no longer exists.
--
-- The alternative, ON DELETE SET NULL, was rejected: content_node_id is NOT NULL,
-- and relaxing that to preserve history would trade a hard failure for rows the
-- engine cannot use. Audit history of the deletion itself is retained separately
-- by AuditService.
-- =============================================================================

ALTER TABLE workflow_instances
    DROP CONSTRAINT IF EXISTS workflow_instances_content_node_id_fkey;

ALTER TABLE workflow_instances
    ADD CONSTRAINT workflow_instances_content_node_id_fkey
        FOREIGN KEY (content_node_id)
        REFERENCES content_nodes (id)
        ON DELETE CASCADE;
