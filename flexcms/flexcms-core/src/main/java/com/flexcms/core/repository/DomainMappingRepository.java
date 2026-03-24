package com.flexcms.core.repository;

import com.flexcms.core.model.DomainMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DomainMappingRepository extends JpaRepository<DomainMapping, UUID> {

    Optional<DomainMapping> findByDomain(String domain);

    List<DomainMapping> findBySiteId(String siteId);
}
