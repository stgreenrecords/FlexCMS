-- =============================================================================
-- V4: Workflow, Replication, Component/Template Registry
-- =============================================================================

-- WORKFLOW DEFINITIONS
CREATE TABLE workflow_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(128) UNIQUE NOT NULL,
    title           VARCHAR(255),
    description     TEXT,
    definition      JSONB NOT NULL,
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- WORKFLOW INSTANCES
CREATE TABLE workflow_instances (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name   VARCHAR(128) NOT NULL REFERENCES workflow_definitions(name),
    content_path    VARCHAR(2048) NOT NULL,
    content_node_id UUID REFERENCES content_nodes(id),
    current_step_id VARCHAR(64) NOT NULL,
    previous_step_id VARCHAR(64),
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    started_by      VARCHAR(255),
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    last_action     VARCHAR(64),
    last_action_by  VARCHAR(255),
    last_action_at  TIMESTAMPTZ,
    last_comment    TEXT,
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_workflow_instances_path ON workflow_instances(content_path);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_workflow_instances_step ON workflow_instances(current_step_id);

-- REPLICATION LOG
CREATE TABLE replication_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID NOT NULL,
    action          VARCHAR(20) NOT NULL,
    content_path    VARCHAR(2048) NOT NULL,
    node_id         UUID,
    version         BIGINT,
    site_id         VARCHAR(64),
    locale          VARCHAR(10),
    replication_type VARCHAR(20),
    status          VARCHAR(20) DEFAULT 'PENDING',
    initiated_by    VARCHAR(255),
    initiated_at    TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0
);

CREATE INDEX idx_replication_log_status ON replication_log(status);
CREATE INDEX idx_replication_log_initiated ON replication_log(initiated_at DESC);

-- COMPONENT REGISTRY
CREATE TABLE component_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type   VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(128) NOT NULL,
    title           VARCHAR(255),
    description     TEXT,
    group_name      VARCHAR(64),
    icon            VARCHAR(64),
    is_container    BOOLEAN DEFAULT FALSE,
    dialog          JSONB,
    policies        JSONB DEFAULT '{}',
    client_lib      VARCHAR(255),
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- TEMPLATE REGISTRY
CREATE TABLE template_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(128) NOT NULL UNIQUE,
    title           VARCHAR(255),
    description     TEXT,
    thumbnail       VARCHAR(512),
    resource_type   VARCHAR(255) DEFAULT 'flexcms/page',
    structure       JSONB NOT NULL,
    initial_content JSONB,
    page_properties JSONB,
    allowed_sites   TEXT[],
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

