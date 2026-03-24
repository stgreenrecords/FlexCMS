package com.flexcms.plugin.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Injects a property value from the content node's JSONB properties map.
 *
 * <p>Applied to fields in a {@link FlexCmsComponent} class that extends
 * {@link com.flexcms.plugin.spi.AbstractComponentModel}.</p>
 *
 * <h3>Usage:</h3>
 * <pre>{@code
 * @ValueMapValue
 * private String title;                    // injects properties.get("title")
 *
 * @ValueMapValue(name = "jcr:title")
 * private String pageTitle;                // injects properties.get("jcr:title")
 *
 * @ValueMapValue(name = "maxItems")
 * private int maxItems = 8;                // uses field default if property absent
 *
 * @ValueMapValue(optional = true)
 * private String subtitle;                 // null if absent (no error)
 * }</pre>
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValueMapValue {

    /**
     * Property name in the node's JSONB map.
     * Defaults to the field name if not specified.
     */
    String name() default "";

    /**
     * If false (default) and the property is missing, the field retains
     * its Java default value (null for objects, 0 for primitives, etc.).
     * If true, explicitly marks this injection as optional for documentation clarity.
     */
    boolean optional() default false;
}

