package com.flexcms.plugin.spi;

import java.util.Map;

/**
 * Context passed to workflow step executions.
 */
public class WorkflowStepContext {

    private String contentPath;
    private String userId;
    private String comment;
    private Map<String, Object> metadata;

    public WorkflowStepContext() {}

    public WorkflowStepContext(String contentPath, String userId, String comment) {
        this.contentPath = contentPath;
        this.userId = userId;
        this.comment = comment;
    }

    public String getContentPath() { return contentPath; }
    public void setContentPath(String contentPath) { this.contentPath = contentPath; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
