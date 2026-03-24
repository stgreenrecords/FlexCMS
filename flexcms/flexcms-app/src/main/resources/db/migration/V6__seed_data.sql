-- =============================================================================
-- V6: Seed Data - Default Workflow and Core Components
-- =============================================================================

-- Standard publish workflow
INSERT INTO workflow_definitions (id, name, title, description, definition, active) VALUES (
    uuid_generate_v4(),
    'standard-publish',
    'Standard Publish Workflow',
    'Author -> Review -> Approve -> Publish',
    '{
        "steps": [
            {
                "id": "draft",
                "type": "start",
                "title": "Draft",
                "transitions": [
                    {"target": "review", "action": "submit", "label": "Submit for Review"}
                ]
            },
            {
                "id": "review",
                "type": "participant",
                "title": "In Review",
                "assignee": "role:content-reviewer",
                "transitions": [
                    {"target": "approved", "action": "approve", "label": "Approve"},
                    {"target": "draft", "action": "reject", "label": "Reject"}
                ]
            },
            {
                "id": "approved",
                "type": "participant",
                "title": "Approved",
                "assignee": "role:content-publisher",
                "transitions": [
                    {"target": "published", "action": "publish", "label": "Publish Now"},
                    {"target": "draft", "action": "reject", "label": "Send Back"}
                ]
            },
            {
                "id": "published",
                "type": "process",
                "title": "Published",
                "actions": ["replicate-activate"],
                "transitions": [
                    {"target": "draft", "action": "unpublish", "label": "Unpublish"}
                ]
            }
        ]
    }'::jsonb,
    TRUE
);

-- Core component definitions
INSERT INTO component_definitions (id, resource_type, name, title, group_name, is_container, active) VALUES
    (uuid_generate_v4(), 'flexcms/page', 'page', 'Page', 'Structure', FALSE, TRUE),
    (uuid_generate_v4(), 'flexcms/container', 'container', 'Layout Container', 'Structure', TRUE, TRUE),
    (uuid_generate_v4(), 'flexcms/rich-text', 'rich-text', 'Rich Text', 'Content', FALSE, TRUE),
    (uuid_generate_v4(), 'flexcms/image', 'image', 'Image', 'Content', FALSE, TRUE),
    (uuid_generate_v4(), 'flexcms/shared-header', 'shared-header', 'Header', 'Structure', FALSE, TRUE),
    (uuid_generate_v4(), 'flexcms/shared-footer', 'shared-footer', 'Footer', 'Structure', FALSE, TRUE),
    (uuid_generate_v4(), 'flexcms/site-root', 'site-root', 'Site Root', 'Structure', FALSE, TRUE);

-- Default template
INSERT INTO template_definitions (id, name, title, description, resource_type, structure, active) VALUES (
    uuid_generate_v4(),
    'default-page',
    'Default Page',
    'Standard content page with header, main content area, and footer',
    'flexcms/page',
    '{
        "children": [
            {"name": "header", "resourceType": "flexcms/shared-header", "locked": true},
            {"name": "main", "resourceType": "flexcms/container", "policy": "main-content"},
            {"name": "footer", "resourceType": "flexcms/shared-footer", "locked": true}
        ]
    }'::jsonb,
    TRUE
);

