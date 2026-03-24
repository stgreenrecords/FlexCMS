package com.flexcms.plugin.spi;

import java.util.List;
import java.util.Map;

/**
 * Read-only view of a content node, passed to ComponentModel implementations.
 */
public interface ContentNodeData {

    String getPath();

    String getName();

    String getResourceType();

    String getSiteId();

    String getLocale();

    Long getVersion();

    Map<String, Object> getProperties();

    <T> T getProperty(String name, Class<T> type);

    <T> T getProperty(String name, T defaultValue);

    List<ContentNodeData> getChildren();
}
