package com.flexcms.plugin.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Injects contextual objects into component model fields.
 *
 * <p>Equivalent to AEM Sling Model's {@code @Self} / {@code @ScriptVariable}.
 * Supports injection of:</p>
 * <ul>
 *   <li>{@link com.flexcms.plugin.spi.ContentNodeData} — the current content node</li>
 *   <li>{@link com.flexcms.plugin.model.RenderContext} — the rendering context</li>
 * </ul>
 *
 * <h3>Usage:</h3>
 * <pre>{@code
 * @Self
 * private ContentNodeData resource;
 *
 * @Self
 * private RenderContext context;
 * }</pre>
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Self {
}

