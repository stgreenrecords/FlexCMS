package com.flexcms.pim.repository;

import com.flexcms.pim.model.ProductVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductVersionRepository extends JpaRepository<ProductVersion, UUID> {

    /** All versions for a product, newest first. */
    List<ProductVersion> findByProductIdOrderByVersionNumberDesc(UUID productId);

    /** A specific version of a product. */
    Optional<ProductVersion> findByProductIdAndVersionNumber(UUID productId, Long versionNumber);
}
