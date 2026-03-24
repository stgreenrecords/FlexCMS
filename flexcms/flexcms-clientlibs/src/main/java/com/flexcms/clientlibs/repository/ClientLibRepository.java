package com.flexcms.clientlibs.repository;

import com.flexcms.clientlibs.model.ClientLibrary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientLibRepository extends JpaRepository<ClientLibrary, UUID> {

    Optional<ClientLibrary> findByName(String name);

    List<ClientLibrary> findByCategory(String category);

    boolean existsByName(String name);
}

