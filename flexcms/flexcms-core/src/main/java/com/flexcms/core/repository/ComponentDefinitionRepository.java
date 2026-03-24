package com.flexcms.core.repository;

import com.flexcms.core.model.ComponentDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ComponentDefinitionRepository extends JpaRepository<ComponentDefinition, UUID> {

    Optional<ComponentDefinition> findByResourceType(String resourceType);

    List<ComponentDefinition> findByActiveTrue();

    List<ComponentDefinition> findByGroupNameAndActiveTrue(String groupName);
}
