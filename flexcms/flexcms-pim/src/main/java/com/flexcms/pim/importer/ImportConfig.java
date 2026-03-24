package com.flexcms.pim.importer;

import java.util.Map;
import java.util.UUID;

/**
 * Configuration for an import job — specifies target catalog,
 * field mappings, and defaults.
 */
public class ImportConfig {
    private UUID catalogId;
    private UUID schemaId;
    private Map<String, String> fieldMappings;   // sourceField → schemaAttribute
    private Map<String, String> defaults;         // attribute → default value
    private Map<String, String> transforms;       // attribute → transform expression
    private String skuField = "sku";              // which source field is the SKU
    private String nameField = "name";
    private boolean updateExisting = true;
    private String userId;

    public UUID getCatalogId() { return catalogId; }
    public void setCatalogId(UUID catalogId) { this.catalogId = catalogId; }
    public UUID getSchemaId() { return schemaId; }
    public void setSchemaId(UUID schemaId) { this.schemaId = schemaId; }
    public Map<String, String> getFieldMappings() { return fieldMappings; }
    public void setFieldMappings(Map<String, String> fieldMappings) { this.fieldMappings = fieldMappings; }
    public Map<String, String> getDefaults() { return defaults; }
    public void setDefaults(Map<String, String> defaults) { this.defaults = defaults; }
    public Map<String, String> getTransforms() { return transforms; }
    public void setTransforms(Map<String, String> transforms) { this.transforms = transforms; }
    public String getSkuField() { return skuField; }
    public void setSkuField(String skuField) { this.skuField = skuField; }
    public String getNameField() { return nameField; }
    public void setNameField(String nameField) { this.nameField = nameField; }
    public boolean isUpdateExisting() { return updateExisting; }
    public void setUpdateExisting(boolean updateExisting) { this.updateExisting = updateExisting; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}

