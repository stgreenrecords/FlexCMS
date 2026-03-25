package com.flexcms.core.repository;

import com.flexcms.core.model.LiveCopyRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LiveCopyRelationshipRepository extends JpaRepository<LiveCopyRelationship, UUID> {

    /** Find all live copies of a source path (direct matches only). */
    List<LiveCopyRelationship> findBySourcePath(String sourcePath);

    /** Find all live copies whose source path starts with the given prefix (subtree rollout). */
    @Query("SELECT r FROM LiveCopyRelationship r WHERE r.sourcePath = :sourcePath OR r.sourcePath LIKE :sourcePrefix")
    List<LiveCopyRelationship> findBySourcePathOrPrefix(
            @Param("sourcePath") String sourcePath,
            @Param("sourcePrefix") String sourcePrefix);

    /** Find the live-copy relationship for a target path (if any). */
    Optional<LiveCopyRelationship> findByTargetPath(String targetPath);

    /** Delete the live-copy relationship for a target path. */
    void deleteByTargetPath(String targetPath);

    /**
     * Delete all live-copy relationships where the target path is the given path
     * or starts with it (used when detaching an entire subtree).
     */
    @Modifying
    @Query("DELETE FROM LiveCopyRelationship r WHERE r.targetPath = :path OR r.targetPath LIKE :pathPrefix")
    void deleteByTargetPathOrPrefix(@Param("path") String path, @Param("pathPrefix") String pathPrefix);

    /** Check whether a target path is a live copy. */
    boolean existsByTargetPath(String targetPath);
}
