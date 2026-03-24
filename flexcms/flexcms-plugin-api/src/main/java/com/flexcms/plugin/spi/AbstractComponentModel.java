package com.flexcms.plugin.spi;

import com.flexcms.plugin.annotation.ChildResource;
import com.flexcms.plugin.annotation.Self;
import com.flexcms.plugin.annotation.ValueMapValue;
import com.flexcms.plugin.model.RenderContext;

import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Base class for field-injection-style component models (ComponentModel pattern).
 *
 * <p>Extend this class and declare component properties as annotated fields.
 * The framework will inject values from the content node's JSONB properties,
 * child nodes, and the render context.</p>
 *
 * <h3>Example — Hero Banner Model:</h3>
 * <pre>{@code
 * @FlexCmsComponent(resourceType = "myapp/hero-banner", title = "Hero Banner", group = "Marketing")
 * public class HeroBannerModel extends AbstractComponentModel {
 *
 *     @ValueMapValue
 *     private String title;
 *
 *     @ValueMapValue
 *     private String subtitle;
 *
 *     @ValueMapValue(name = "theme")
 *     private String theme = "light";       // default value if property absent
 *
 *     @ValueMapValue(name = "height")
 *     private String height = "medium";
 *
 *     @ValueMapValue(name = "backgroundImage")
 *     private String backgroundImagePath;
 *
 *     @ValueMapValue
 *     private String ctaLabel;
 *
 *     @ValueMapValue
 *     private String ctaLink;
 *
 *     // Spring-injected services (standard @Autowired still works)
 *     @Autowired
 *     private DamService damService;
 *
 *     @Override
 *     protected void postInject() {
 *         // Custom logic after all fields are injected.
 *         // Use this for derived values, external API calls, etc.
 *     }
 *
 *     // Getter methods auto-exported as JSON / template model
 *     public String getImageUrl() {
 *         return damService.getRenditionUrl(backgroundImagePath, "hero-desktop");
 *     }
 * }
 * }</pre>
 *
 * <p>The framework lifecycle is:</p>
 * <ol>
 *   <li>Spring creates the bean (singleton, @Autowired services injected)</li>
 *   <li>Per-request: {@code init(node, context)} injects @ValueMapValue, @ChildResource, @Self fields</li>
 *   <li>{@code postInject()} called for custom derived logic</li>
 *   <li>{@code adapt()} collects all @ValueMapValue getter values into a Map for rendering</li>
 * </ol>
 */
public abstract class AbstractComponentModel implements ComponentModel {

    // Per-request injected context — available to subclasses
    private ContentNodeData currentNode;
    private RenderContext currentContext;

    /**
     * Returns the current content node. Available after {@code init()}.
     */
    protected ContentNodeData getResource() {
        return currentNode;
    }

    /**
     * Returns the current render context. Available after {@code init()}.
     */
    protected RenderContext getContext() {
        return currentContext;
    }

    /**
     * Override for custom initialization after all fields are injected.
     * Called once per adapt() invocation. Use for derived values, external API calls, etc.
     */
    protected void postInject() {
        // Default no-op. Override in subclasses.
    }

    /**
     * Field-injection-based adapt. Injects @ValueMapValue, @ChildResource, @Self fields
     * from the content node, then calls postInject(), then exports all annotated
     * fields (plus getters) as a view model map.
     *
     * <p>Subclasses should NOT override this unless they need fully custom logic.
     * Use {@link #postInject()} for custom derived values instead.</p>
     */
    @Override
    public Map<String, Object> adapt(ContentNodeData node, RenderContext context) {
        this.currentNode = node;
        this.currentContext = context;

        injectFields(node, context);
        postInject();
        return exportModel();
    }

    /**
     * Inject annotated fields from node properties and context.
     */
    private void injectFields(ContentNodeData node, RenderContext context) {
        Class<?> clazz = this.getClass();

        for (Field field : getAllFields(clazz)) {
            field.setAccessible(true);

            try {
                // @ValueMapValue — inject from node's JSONB properties
                if (field.isAnnotationPresent(ValueMapValue.class)) {
                    injectValueMapValue(field, node);
                }

                // @ChildResource — inject child nodes
                if (field.isAnnotationPresent(ChildResource.class)) {
                    injectChildResource(field, node);
                }

                // @Self — inject node or context
                if (field.isAnnotationPresent(Self.class)) {
                    injectSelf(field, node, context);
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException("Failed to inject field: " + field.getName()
                        + " in " + clazz.getSimpleName(), e);
            }
        }
    }

    private void injectValueMapValue(Field field, ContentNodeData node) throws IllegalAccessException {
        ValueMapValue annotation = field.getAnnotation(ValueMapValue.class);
        String propertyName = annotation.name().isEmpty() ? field.getName() : annotation.name();

        Object rawValue = node.getProperties().get(propertyName);
        if (rawValue == null) {
            // Keep the field's default value (set in field declaration)
            return;
        }

        Object converted = convertValue(rawValue, field.getType());
        if (converted != null) {
            field.set(this, converted);
        }
    }

    private void injectChildResource(Field field, ContentNodeData node) throws IllegalAccessException {
        ChildResource annotation = field.getAnnotation(ChildResource.class);
        List<ContentNodeData> children = node.getChildren();

        if (children == null) return;

        if (!annotation.name().isEmpty()) {
            // Inject specific child by name
            children.stream()
                    .filter(c -> annotation.name().equals(c.getName()))
                    .findFirst()
                    .ifPresent(child -> {
                        try {
                            field.set(this, child);
                        } catch (IllegalAccessException e) {
                            throw new RuntimeException(e);
                        }
                    });
        } else {
            // Inject all children
            field.set(this, children);
        }
    }

    private void injectSelf(Field field, ContentNodeData node, RenderContext context) throws IllegalAccessException {
        if (ContentNodeData.class.isAssignableFrom(field.getType())) {
            field.set(this, node);
        } else if (RenderContext.class.isAssignableFrom(field.getType())) {
            field.set(this, context);
        }
    }

    /**
     * Export all @ValueMapValue fields as a map for rendering / JSON serialization.
     * Fields with null values are omitted.
     */
    private Map<String, Object> exportModel() {
        Map<String, Object> model = new LinkedHashMap<>();

        for (Field field : getAllFields(this.getClass())) {
            if (!field.isAnnotationPresent(ValueMapValue.class)) continue;
            field.setAccessible(true);

            try {
                ValueMapValue annotation = field.getAnnotation(ValueMapValue.class);
                String exportName = annotation.name().isEmpty() ? field.getName() : annotation.name();
                Object value = field.get(this);
                if (value != null) {
                    model.put(exportName, value);
                }
            } catch (IllegalAccessException e) {
                // Skip inaccessible fields
            }
        }

        // Also export public getters that are NOT simple field getters
        // (i.e., computed/derived properties like getImageUrl())
        exportDerivedGetters(model);

        return model;
    }

    /**
     * Exports values from public getter methods that don't directly correspond
     * to an @ValueMapValue field — these are computed/derived properties.
     *
     * <p>Convention: a method named {@code getImageUrl()} exports as {@code "imageUrl"}.
     * Methods from Object, AbstractComponentModel, and standard getters for
     * @ValueMapValue fields are excluded.</p>
     */
    private void exportDerivedGetters(Map<String, Object> model) {
        Set<String> valueMapFieldNames = new HashSet<>();
        for (Field f : getAllFields(this.getClass())) {
            if (f.isAnnotationPresent(ValueMapValue.class)) {
                ValueMapValue ann = f.getAnnotation(ValueMapValue.class);
                valueMapFieldNames.add(ann.name().isEmpty() ? f.getName() : ann.name());
            }
        }

        for (var method : this.getClass().getMethods()) {
            String methodName = method.getName();

            // Only include get* methods with no parameters and non-void return
            if (!methodName.startsWith("get") || methodName.length() <= 3) continue;
            if (method.getParameterCount() != 0) continue;
            if (method.getReturnType() == void.class) continue;

            // Exclude methods from Object and AbstractComponentModel
            if (method.getDeclaringClass() == Object.class) continue;
            if (method.getDeclaringClass() == AbstractComponentModel.class) continue;

            // Derive property name: getImageUrl -> imageUrl
            String propertyName = Character.toLowerCase(methodName.charAt(3)) + methodName.substring(4);

            // Skip if already exported via @ValueMapValue field
            if (valueMapFieldNames.contains(propertyName)) continue;
            // Skip if already in model (set by field injection)
            if (model.containsKey(propertyName)) continue;

            try {
                Object value = method.invoke(this);
                if (value != null) {
                    model.put(propertyName, value);
                }
            } catch (Exception e) {
                // Skip methods that throw exceptions
            }
        }
    }

    /**
     * Convert a raw JSONB value to the target field type.
     */
    @SuppressWarnings("unchecked")
    private Object convertValue(Object raw, Class<?> targetType) {
        if (raw == null) return null;
        if (targetType.isInstance(raw)) return raw;

        // String conversions
        if (targetType == String.class) return String.valueOf(raw);

        // Numeric conversions (JSONB numbers come as Integer/Double)
        if (targetType == int.class || targetType == Integer.class) {
            return raw instanceof Number n ? n.intValue() : Integer.parseInt(raw.toString());
        }
        if (targetType == long.class || targetType == Long.class) {
            return raw instanceof Number n ? n.longValue() : Long.parseLong(raw.toString());
        }
        if (targetType == double.class || targetType == Double.class) {
            return raw instanceof Number n ? n.doubleValue() : Double.parseDouble(raw.toString());
        }
        if (targetType == float.class || targetType == Float.class) {
            return raw instanceof Number n ? n.floatValue() : Float.parseFloat(raw.toString());
        }
        if (targetType == boolean.class || targetType == Boolean.class) {
            return raw instanceof Boolean b ? b : Boolean.parseBoolean(raw.toString());
        }

        // List / Map — pass through (JSONB arrays/objects deserialize to these)
        if (List.class.isAssignableFrom(targetType) && raw instanceof List) return raw;
        if (Map.class.isAssignableFrom(targetType) && raw instanceof Map) return raw;

        return raw; // best-effort
    }

    /**
     * Collect all declared fields from the class hierarchy
     * (excludes AbstractComponentModel's own fields).
     */
    private List<Field> getAllFields(Class<?> clazz) {
        List<Field> fields = new ArrayList<>();
        Class<?> current = clazz;
        while (current != null && current != AbstractComponentModel.class && current != Object.class) {
            fields.addAll(Arrays.asList(current.getDeclaredFields()));
            current = current.getSuperclass();
        }
        return fields;
    }
}

