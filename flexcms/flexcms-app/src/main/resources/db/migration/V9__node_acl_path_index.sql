-- =============================================================================
-- V9: Add path index to node_acls for efficient ACL lookups
-- The findEffectiveAcls query filters by node_path prefix matching —
-- without this index every ACL check would do a full table scan.
-- =============================================================================

CREATE INDEX idx_acls_node_path ON node_acls(node_path);
