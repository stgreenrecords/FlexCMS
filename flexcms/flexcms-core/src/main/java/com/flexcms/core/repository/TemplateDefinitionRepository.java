package com.flexcms.core.repository;

import com.flexcms.core.model.TemplateDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TemplateDefinitionRepository extends JpaRepository<TemplateDefinition, UUID> {

    Optional<TemplateDefinition> findByName(String name);

    List<TemplateDefinition> findByActiveTrue();
}
