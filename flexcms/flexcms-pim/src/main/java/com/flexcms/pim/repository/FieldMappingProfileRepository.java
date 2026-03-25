package com.flexcms.pim.repository;

import com.flexcms.pim.model.FieldMappingProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FieldMappingProfileRepository extends JpaRepository<FieldMappingProfile, UUID> {

    List<FieldMappingProfile> findByCatalogId(UUID catalogId);

    Optional<FieldMappingProfile> findByCatalogIdAndName(UUID catalogId, String name);
}
