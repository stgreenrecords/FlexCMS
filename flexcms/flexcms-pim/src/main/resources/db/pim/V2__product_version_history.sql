-- Product version history: immutable snapshots of product attributes at each save.
-- Enables audit trail, rollback, and change tracking.

CREATE TABLE product_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID         NOT NULL,
    version_number  BIGINT       NOT NULL,
    sku             VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    attributes      JSONB        NOT NULL DEFAULT '{}',
    status          VARCHAR(50)  NOT NULL,
    updated_by      VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    change_summary  TEXT,

    CONSTRAINT uq_product_versions UNIQUE (product_id, version_number)
);

CREATE INDEX idx_product_versions_product_id ON product_versions (product_id);
CREATE INDEX idx_product_versions_created_at ON product_versions (product_id, created_at DESC);
