package com.flexcms.core.service;

import com.flexcms.core.model.TemplateDefinition;
import com.flexcms.core.repository.TemplateDefinitionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
public class TemplateRegistryService {

    @Autowired
    private TemplateDefinitionRepository templateDefinitionRepository;

    public List<TemplateContract> getActiveTemplates() {
        return templateDefinitionRepository.findByActiveTrue().stream()
                .map(this::toContract)
                .toList();
    }

    public Optional<TemplateContract> getTemplate(String name) {
        return templateDefinitionRepository.findByName(name)
                .filter(TemplateDefinition::isActive)
                .map(this::toContract);
    }

    private TemplateContract toContract(TemplateDefinition definition) {
        Map<String, Object> structure = definition.getStructure();

        List<TemplateComponentRef> embeddedComponents = extractComponentRefs(structure, "embeddedComponents");
        if (embeddedComponents.isEmpty()) {
            embeddedComponents = extractLegacyChildren(structure);
        }

        List<TemplateComponentRef> allowedComponents = extractComponentRefs(structure, "allowedComponents");
        List<String> embeddedComponentTypes = extractComponentTypes(structure, "embeddedComponentTypes", embeddedComponents);
        List<String> allowedComponentTypes = extractComponentTypes(structure, "allowedComponentTypes", allowedComponents);

        return new TemplateContract(
                definition.getName(),
                definition.getTitle(),
                definition.getDescription(),
                definition.getResourceType(),
                embeddedComponents,
                allowedComponents,
                embeddedComponentTypes,
                allowedComponentTypes
        );
    }

    private List<TemplateComponentRef> extractLegacyChildren(Map<String, Object> structure) {
        if (structure == null) {
            return List.of();
        }

        Object rawChildren = structure.get("children");
        if (!(rawChildren instanceof List<?> children)) {
            return List.of();
        }

        List<TemplateComponentRef> refs = new ArrayList<>();
        for (Object child : children) {
            if (!(child instanceof Map<?, ?> childMap)) {
                continue;
            }
            String resourceType = asString(childMap.get("resourceType"));
            if (resourceType == null || resourceType.isBlank()) {
                continue;
            }
            String title = asString(childMap.get("title"));
            if (title == null || title.isBlank()) {
                title = asString(childMap.get("name"));
            }
            refs.add(new TemplateComponentRef(title, resourceType));
        }
        return List.copyOf(refs);
    }

    private List<String> extractComponentTypes(Map<String, Object> structure,
                                               String key,
                                               List<TemplateComponentRef> fallbackRefs) {
        if (structure != null) {
            Object raw = structure.get(key);
            if (raw instanceof List<?> values) {
                return values.stream()
                        .map(this::asString)
                        .filter(Objects::nonNull)
                        .filter(value -> !value.isBlank())
                        .toList();
            }
        }

        return fallbackRefs.stream()
                .map(TemplateComponentRef::resourceType)
                .filter(Objects::nonNull)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private List<TemplateComponentRef> extractComponentRefs(Map<String, Object> structure, String key) {
        if (structure == null) {
            return List.of();
        }

        Object raw = structure.get(key);
        if (!(raw instanceof List<?> values)) {
            return List.of();
        }

        List<TemplateComponentRef> refs = new ArrayList<>();
        for (Object value : values) {
            if (value instanceof Map<?, ?> valueMap) {
                refs.add(new TemplateComponentRef(
                        asString(valueMap.get("title")),
                        asString(valueMap.get("resourceType"))
                ));
            } else {
                String resourceType = asString(value);
                if (resourceType != null && !resourceType.isBlank()) {
                    refs.add(new TemplateComponentRef(null, resourceType));
                }
            }
        }
        return List.copyOf(refs);
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    public record TemplateContract(
            String name,
            String title,
            String description,
            String resourceType,
            List<TemplateComponentRef> embeddedComponents,
            List<TemplateComponentRef> allowedComponents,
            List<String> embeddedComponentTypes,
            List<String> allowedComponentTypes
    ) {}

    public record TemplateComponentRef(String title, String resourceType) {}
}
