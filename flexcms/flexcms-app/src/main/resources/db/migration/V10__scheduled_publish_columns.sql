-- Scheduled publishing: allow content authors to schedule nodes for future
-- publish or deactivation without manual intervention.

ALTER TABLE content_nodes
    ADD COLUMN IF NOT EXISTS scheduled_publish_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS scheduled_deactivate_at TIMESTAMPTZ;

-- Index for the scheduler daemon to efficiently find due nodes
CREATE INDEX IF NOT EXISTS idx_content_nodes_scheduled_publish
    ON content_nodes (scheduled_publish_at)
    WHERE scheduled_publish_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_nodes_scheduled_deactivate
    ON content_nodes (scheduled_deactivate_at)
    WHERE scheduled_deactivate_at IS NOT NULL;
