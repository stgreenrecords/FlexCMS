package com.flexcms.core.service;

import com.flexcms.core.model.ComponentDefinition;
import com.flexcms.core.repository.ComponentDefinitionRepository;
import com.flexcms.plugin.annotation.FlexCmsComponent;
import com.flexcms.plugin.spi.ComponentModel;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Discovers and registers all component models annotated with @FlexCmsComponent.
 * Provides lookup for component models by resourceType.
 */
@Service
public class ComponentRegistry {

    private static final Logger log = LoggerFactory.getLogger(ComponentRegistry.class);

    private final Map<String, ComponentModel> modelRegistry = new ConcurrentHashMap<>();
    private final Map<String, ComponentDefinition> definitionCache = new ConcurrentHashMap<>();

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private ComponentDefinitionRepository componentDefRepo;

    @Autowired
    private ObjectMapper objectMapper;

    @PostConstruct
    public void init() {
        // Discover all beans annotated with @FlexCmsComponent
        Map<String, Object> beans = applicationContext.getBeansWithAnnotation(FlexCmsComponent.class);

        for (Map.Entry<String, Object> entry : beans.entrySet()) {
            Object bean = entry.getValue();
            if (bean instanceof ComponentModel model) {
                FlexCmsComponent annotation = bean.getClass().getAnnotation(FlexCmsComponent.class);
                String resourceType = annotation.resourceType();

                modelRegistry.put(resourceType, model);

                // Auto-register component definition in DB if not exists
                registerDefinition(annotation);

                log.info("Registered component model: {} -> {}", resourceType, bean.getClass().getSimpleName());
            }
        }

        // Load all definitions into cache
        componentDefRepo.findByActiveTrue().forEach(def ->
            definitionCache.put(def.getResourceType(), def)
        );

        log.info("Component registry initialized with {} models and {} definitions",
                modelRegistry.size(), definitionCache.size());
    }

    /**
     * Get the component model for a resource type.
     */
    public Optional<ComponentModel> getModel(String resourceType) {
        return Optional.ofNullable(modelRegistry.get(resourceType));
    }

    /**
     * Get the component definition for a resource type.
     */
    public Optional<ComponentDefinition> getDefinition(String resourceType) {
        return Optional.ofNullable(definitionCache.get(resourceType));
    }

    /**
     * Get all registered component definitions.
     */
    public List<ComponentDefinition> getAllDefinitions() {
        return List.copyOf(definitionCache.values());
    }

    /**
     * Get component definitions by group.
     */
    public List<ComponentDefinition> getDefinitionsByGroup(String group) {
        return definitionCache.values().stream()
                .filter(d -> group.equals(d.getGroupName()))
                .toList();
    }

    private void registerDefinition(FlexCmsComponent annotation) {
        String resourceType = annotation.resourceType();
        if (componentDefRepo.findByResourceType(resourceType).isPresent()) {
            return; // Already registered
        }

        ComponentDefinition def = new ComponentDefinition();
        def.setResourceType(resourceType);
        def.setName(resourceType.contains("/") ? resourceType.substring(resourceType.lastIndexOf('/') + 1) : resourceType);
        def.setTitle(annotation.title().isEmpty() ? def.getName() : annotation.title());
        def.setGroupName(annotation.group());
        def.setActive(true);

        // Load dialog from classpath if specified
        if (!annotation.dialog().isEmpty()) {
            try {
                ClassPathResource resource = new ClassPathResource(annotation.dialog());
                Map<String, Object> dialog = objectMapper.readValue(
                        resource.getInputStream(),
                        new TypeReference<>() {}
                );
                def.setDialog(dialog);
            } catch (IOException e) {
                log.warn("Failed to load dialog for component {}: {}", resourceType, e.getMessage());
            }
        }

        componentDefRepo.save(def);
    }
}
