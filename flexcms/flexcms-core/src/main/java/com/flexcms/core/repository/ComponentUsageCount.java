package com.flexcms.core.repository;

/**
 * How many content nodes exist for one component resource type.
 *
 * <p>The admin component list showed a "uses" column that was hardcoded to zero for every
 * component, so it told authors nothing about which components are actually in use. This
 * projection backs a real count.</p>
 *
 * @param resourceType the component's registered resource type
 * @param usageCount   number of content nodes of that type
 */
public record ComponentUsageCount(String resourceType, long usageCount) {
}
