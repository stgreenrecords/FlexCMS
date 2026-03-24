package com.flexcms.plugin.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.stereotype.Component;

/**
 * Marks a class as a FlexCMS component model.
 * The component is auto-registered in the component registry at startup.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Component
public @interface FlexCmsComponent {

    /**
     * Component resource type, e.g., "myapp/hero-banner".
     */
    String resourceType();

    /**
     * Display title for authoring UI.
     */
    String title() default "";

    /**
     * Component group for categorization in authoring UI.
     */
    String group() default "General";

    /**
     * Path to dialog definition JSON (classpath resource).
     */
    String dialog() default "";
}
