package com.flexcms.core.repository;

import com.flexcms.core.model.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteRepository extends JpaRepository<Site, String> {

    List<Site> findByActiveTrue();

    @Query("SELECT s.siteId FROM Site s WHERE s.active = true")
    List<String> findAllActiveSiteIds();
}
