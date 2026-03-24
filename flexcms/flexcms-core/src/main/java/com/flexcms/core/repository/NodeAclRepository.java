package com.flexcms.core.repository;

import com.flexcms.core.model.NodeAcl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NodeAclRepository extends JpaRepository<NodeAcl, UUID> {

    /** All ACL entries directly on a node path. */
    List<NodeAcl> findByNodePath(String nodePath);

    /** All entries for a specific principal (across all nodes). */
    List<NodeAcl> findByPrincipal(String principal);

    /** Entries directly on a path AND inheritable entries on ancestor paths. */
    @Query(value = """
            SELECT * FROM node_acls
            WHERE (node_path = :nodePath)
               OR (:nodePath LIKE node_path || '.%' AND inherit = TRUE)
            ORDER BY length(node_path) DESC
            """, nativeQuery = true)
    List<NodeAcl> findEffectiveAcls(@Param("nodePath") String nodePath);

    /** Delete all entries for a node + principal combination. */
    void deleteByNodePathAndPrincipal(String nodePath, String principal);

    /** Delete all entries for a node (used when node is deleted). */
    void deleteByNodePath(String nodePath);
}
