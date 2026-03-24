package com.flexcms.plugin.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Injects child content nodes from the current node's children list.
 *
 * <p>Equivalent to AEM Sling Model's {@code @ChildResource}.
 * Applied to fields of type {@code List<ContentNodeData>} or single {@code ContentNodeData}.</p>
 *
 * <h3>Usage:</h3>
 * <pre>{@code
 * @ChildResource
 * private List<ContentNodeData> children;  // all child nodes
 *
 * @ChildResource(name = "hero")
 * private ContentNodeData heroNode;        // specific child by name
 * }</pre>
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ChildResource {

    /**
     * Child node name to inject. If empty, injects all children (field must be a List).
     */
    String name() default "";
}

