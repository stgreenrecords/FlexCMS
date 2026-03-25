package com.flexcms.pim.repository;

import com.flexcms.pim.model.ProductAssetRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductAssetRefRepository extends JpaRepository<ProductAssetRef, UUID> {

    List<ProductAssetRef> findByProductIdOrderByOrderIndex(UUID productId);

    Optional<ProductAssetRef> findByProductIdAndAssetPathAndRole(UUID productId, String assetPath, String role);

    void deleteByProductId(UUID productId);
}
