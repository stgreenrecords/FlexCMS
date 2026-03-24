package com.flexcms.search.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

import java.time.Instant;
import java.util.Map;

@Document(indexName = "flexcms-content")
@Setting(settingPath = "/elasticsearch/settings.json")
public class ContentNodeDocument {

    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String path;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String title;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String fullText;

    @Field(type = FieldType.Keyword)
    private String resourceType;

    @Field(type = FieldType.Keyword)
    private String siteId;

    @Field(type = FieldType.Keyword)
    private String locale;

    @Field(type = FieldType.Keyword)
    private String template;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Object)
    private Map<String, Object> properties;

    @Field(type = FieldType.Date)
    private Instant modifiedAt;

    @Field(type = FieldType.Keyword)
    private String modifiedBy;

    public ContentNodeDocument() {}

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFullText() { return fullText; }
    public void setFullText(String fullText) { this.fullText = fullText; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = template; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Map<String, Object> getProperties() { return properties; }
    public void setProperties(Map<String, Object> properties) { this.properties = properties; }

    public Instant getModifiedAt() { return modifiedAt; }
    public void setModifiedAt(Instant modifiedAt) { this.modifiedAt = modifiedAt; }

    public String getModifiedBy() { return modifiedBy; }
    public void setModifiedBy(String modifiedBy) { this.modifiedBy = modifiedBy; }
}

