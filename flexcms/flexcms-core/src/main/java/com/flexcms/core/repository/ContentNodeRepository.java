package com.flexcms.core.repository;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContentNodeRepository extends JpaRepository<ContentNode, UUID> {

    Optional<ContentNode> findByPath(String path);

    /**
     * Find direct children of a node (1 level deep).
     */
    List<ContentNode> findByParentPathOrderByOrderIndex(String parentPath);

    /**
     * Find all descendants using ltree path prefix matching.
     * Uses native query for ltree <@ operator.
     */
    @Query(value = "SELECT * FROM content_nodes WHERE path::text LIKE :pathPrefix || '.%' ORDER BY path",
           nativeQuery = true)
    List<ContentNode> findDescendants(@Param("pathPrefix") String pathPrefix);

    /**
     * Find all ancestors of a node (for breadcrumbs).
     */
    @Query(value = """
            SELECT * FROM content_nodes
            WHERE :childPath LIKE path || '.%'
               OR :childPath = path
            ORDER BY length(path)
            """, nativeQuery = true)
    List<ContentNode> findAncestors(@Param("childPath") String childPath);

    /**
     * Find all pages (top-level content nodes) for a site/locale.
     */
    @Query("SELECT n FROM ContentNode n WHERE n.siteId = :siteId AND n.locale = :locale " +
           "AND n.resourceType = 'flexcms/page' ORDER BY n.orderIndex")
    List<ContentNode> findPages(@Param("siteId") String siteId, @Param("locale") String locale);

    /**
     * Find pages by template.
     */
    @Query(value = """
            SELECT * FROM content_nodes
            WHERE site_id = :siteId AND locale = :locale
              AND resource_type = 'flexcms/page'
              AND properties->>'template' = :template
            ORDER BY modified_at DESC
            """, nativeQuery = true)
    List<ContentNode> findPagesByTemplate(@Param("siteId") String siteId,
                                          @Param("locale") String locale,
                                          @Param("template") String template);

    /**
     * Find nodes by resource type.
     */
    List<ContentNode> findByResourceType(String resourceType);

    /**
     * Find nodes by site and status.
     */
    Page<ContentNode> findBySiteIdAndStatus(String siteId, NodeStatus status, Pageable pageable);

    /**
     * Find all nodes for a site with a given status (no pagination — used for bulk index rebuild).
     */
    List<ContentNode> findBySiteIdAndStatus(String siteId, NodeStatus status);

    /**
     * Find all nodes with a given status across all sites (used for full index rebuild).
     */
    List<ContentNode> findByStatus(NodeStatus status);

    /**
     * Count pages per site.
     */
    @Query("SELECT COUNT(n) FROM ContentNode n WHERE n.siteId = :siteId AND n.resourceType = 'flexcms/page'")
    long countPagesBySite(@Param("siteId") String siteId);

    /**
     * Check if path exists.
     */
    boolean existsByPath(String path);

    /**
     * Delete node and all descendants.
     */
    @Query(value = "DELETE FROM content_nodes WHERE path::text LIKE :pathPrefix || '%'",
           nativeQuery = true)
    void deleteSubtree(@Param("pathPrefix") String pathPrefix);

    /**
     * Find nodes whose scheduled publish time has passed and are not yet published.
     */
    @Query("SELECT n FROM ContentNode n WHERE n.scheduledPublishAt IS NOT NULL " +
           "AND n.scheduledPublishAt <= :now AND n.status <> 'PUBLISHED'")
    List<ContentNode> findDueForPublish(@Param("now") Instant now);

    /**
     * Find published nodes whose scheduled deactivation time has passed.
     */
    @Query("SELECT n FROM ContentNode n WHERE n.scheduledDeactivateAt IS NOT NULL " +
           "AND n.scheduledDeactivateAt <= :now AND n.status = 'PUBLISHED'")
    List<ContentNode> findDueForDeactivation(@Param("now") Instant now);

    /**
     * Full-text search across content properties.
     */
    @Query(value = """
            SELECT * FROM content_nodes
            WHERE site_id = :siteId AND locale = :locale
              AND (properties::text ILIKE '%' || :query || '%'
                   OR name ILIKE '%' || :query || '%')
            ORDER BY modified_at DESC
            """, nativeQuery = true)
    Page<ContentNode> searchContent(@Param("siteId") String siteId,
                                     @Param("locale") String locale,
                                     @Param("query") String query,
                                     Pageable pageable);
}
