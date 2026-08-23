package com.flexcms.core.service;

import com.flexcms.core.event.ContentDeletedEvent;
import com.flexcms.core.event.ContentStatusChangedEvent;
import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.exception.ValidationException;
import com.flexcms.core.model.BulkOperationResult;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.ContentNodeVersion;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.ContentNodeVersionRepository;
import com.flexcms.core.util.RichTextSanitizer;
import io.micrometer.core.annotation.Timed;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.*;

@Service
public class ContentNodeService {

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private ContentNodeVersionRepository versionRepository;

    @Autowired
    private RichTextSanitizer richTextSanitizer;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    /** Lazy to avoid circular dependency via Spring context. */
    @Autowired
    @Lazy
    private AuditService auditService;

    /**
     * Get a single content node by path.
     */
    @PreAuthorize("hasPermission(#path, 'READ')")
    public Optional<ContentNode> getByPath(String path) {
        return nodeRepository.findByPath(path);
    }

    /**
     * Get a content node with its full component tree (children loaded recursively).
     */
    @PreAuthorize("hasPermission(#path, 'READ')")
    @Transactional(readOnly = true)
    public Optional<ContentNode> getWithChildren(String path) {
        return nodeRepository.findByPath(path).map(this::loadChildrenRecursive);
    }

    /**
     * Create a new content node.
     */
    @Timed(value = "flexcms.content.node.create", description = "Time to create a content node")
    @PreAuthorize("hasPermission(#parentPath, 'WRITE')")
    @Transactional
    public ContentNode create(String parentPath, String name, String resourceType,
                               Map<String, Object> properties, String userId) {
        String path = parentPath + "." + sanitizeName(name);

        if (nodeRepository.existsByPath(path)) {
            throw ConflictException.alreadyExists(path);
        }

        ContentNode parent = nodeRepository.findByPath(parentPath)
                .orElseThrow(() -> NotFoundException.forPath(parentPath));

        ContentNode node = new ContentNode(path, name, resourceType);
        node.setParentPath(parentPath);
        node.setProperties(sanitizeProperties(properties != null ? properties : new HashMap<>()));
        node.setSiteId(parent.getSiteId());
        node.setLocale(parent.getLocale());
        node.setCreatedBy(userId);
        node.setModifiedBy(userId);

        // Set order to last among siblings
        List<ContentNode> siblings = nodeRepository.findByParentPathOrderByOrderIndex(parentPath);
        node.setOrderIndex(siblings.isEmpty() ? 0 : siblings.getLast().getOrderIndex() + 1);

        ContentNode saved = nodeRepository.save(node);
        auditService.log(AuditService.ENTITY_CONTENT, saved.getId(), saved.getPath(),
                AuditService.ACTION_CREATE, userId);
        return saved;
    }

    /**
     * Update node properties (partial merge).
     */
    @PreAuthorize("hasPermission(#path, 'WRITE')")
    @Transactional
    public ContentNode updateProperties(String path, Map<String, Object> updates, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));

        // Check lock
        if (node.getLockedBy() != null && !node.getLockedBy().equals(userId)) {
            throw ConflictException.lockedBy(node.getLockedBy());
        }

        // Merge and sanitize properties
        Map<String, Object> merged = new HashMap<>(node.getProperties());
        merged.putAll(updates);
        Map<String, Object> sanitized = sanitizeProperties(merged);

        // No-op updates should not create duplicate snapshots.
        if (Objects.equals(node.getProperties(), sanitized)) {
            return node;
        }

        // Save version before applying actual changes.
        saveVersionSnapshotIfMissing(node);

        node.setProperties(sanitized);
        node.setModifiedBy(userId);

        ContentNode saved = nodeRepository.save(node);
        auditService.log(AuditService.ENTITY_CONTENT, saved.getId(), saved.getPath(),
                AuditService.ACTION_UPDATE, userId);
        return saved;
    }

    /**
     * Move a node to a new parent.
     */
    @PreAuthorize("hasPermission(#sourcePath, 'WRITE') and hasPermission(#targetParentPath, 'WRITE')")
    @Transactional
    public ContentNode move(String sourcePath, String targetParentPath, String userId) {
        ContentNode node = nodeRepository.findByPath(sourcePath)
                .orElseThrow(() -> NotFoundException.forPath(sourcePath));

        // Validate target parent exists
        nodeRepository.findByPath(targetParentPath)
                .orElseThrow(() -> NotFoundException.forPath(targetParentPath));

        String newPath = targetParentPath + "." + node.getName();

        // Update the node and all descendants
        List<ContentNode> subtree = nodeRepository.findDescendants(sourcePath);
        subtree.add(0, node);

        for (ContentNode n : subtree) {
            String updatedPath = n.getPath().replace(sourcePath, newPath);

            // The moved node's own parentPath is the target; only its descendants
            // can have it rewritten by substitution.
            //
            // This used to be `n.getParentPath().replace(sourcePath, newPath)` for
            // every node, which is a no-op for the subtree's root: that node's
            // parentPath is its *old* parent and does not contain sourcePath, so the
            // root kept pointing at the folder it was moved out of. Its path was
            // correct but every children-based view disagreed — the new parent's
            // /children listing did not include it, the old parent's still did, and
            // the admin content tree showed the page in the folder it had left.
            // Descendants were always fine because their parentPath starts with
            // sourcePath. bulkMove() delegates here, so both paths were affected.
            String updatedParent = n.getPath().equals(sourcePath)
                    ? targetParentPath
                    : (n.getParentPath() != null
                            ? n.getParentPath().replace(sourcePath, newPath)
                            : targetParentPath);

            n.setPath(updatedPath);
            n.setParentPath(updatedParent);
            n.setModifiedBy(userId);
        }

        nodeRepository.saveAll(subtree);
        ContentNode root = subtree.get(0);
        auditService.log(AuditService.ENTITY_CONTENT, root.getId(), newPath,
                AuditService.ACTION_MOVE, userId,
                Map.of("from", sourcePath, "to", newPath), null, null);
        return root;
    }

    /**
     * Delete a node and all its descendants.
     */
    @PreAuthorize("hasPermission(#path, 'DELETE')")
    @Transactional
    public void delete(String path, String userId) {
        // Look the node up first. deleteSubtree() is a bulk SQL DELETE that affects
        // zero rows for a path that does not exist and raises nothing, so without
        // this a caller could not tell "deleted 3 pages" from "all 3 paths were
        // wrong" — bulkDelete() counted fictional paths as succeeded and audited
        // them. Bulk publish and bulk move already reject a missing path; delete was
        // the outlier.
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));

        // Captured before deletion: the listener cannot look any of this up afterwards.
        UUID nodeId = node.getId();
        String resourceType = node.getResourceType();
        String siteId = node.getSiteId();
        String locale = node.getLocale();

        nodeRepository.deleteSubtree(path);
        auditService.log(AuditService.ENTITY_CONTENT, nodeId, path,
                AuditService.ACTION_DELETE, userId);

        // Announce the deletion so the publish environment can drop it too.
        // ReplicationReceiver has always handled ReplicationAction.DELETE, but no
        // producer ever emitted one: deleting a published page left it served
        // indefinitely. Consumers bind AFTER_COMMIT, so a rolled-back delete is
        // never replicated.
        eventPublisher.publishEvent(
                new ContentDeletedEvent(this, path, nodeId, resourceType, siteId, locale, userId));
    }

    /**
     * Lock a node for editing.
     */
    @PreAuthorize("hasPermission(#path, 'WRITE')")
    @Transactional
    public ContentNode lock(String path, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));

        if (node.getLockedBy() != null && !node.getLockedBy().equals(userId)) {
            throw ConflictException.lockedBy(node.getLockedBy());
        }

        node.setLockedBy(userId);
        node.setLockedAt(Instant.now());
        ContentNode saved = nodeRepository.save(node);
        auditService.log(AuditService.ENTITY_CONTENT, saved.getId(), saved.getPath(),
                AuditService.ACTION_LOCK, userId);
        return saved;
    }

    /**
     * Unlock a node.
     */
    @PreAuthorize("hasPermission(#path, 'WRITE')")
    @Transactional
    public ContentNode unlock(String path, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));

        if (node.getLockedBy() != null && !node.getLockedBy().equals(userId)) {
            throw ConflictException.lockedBy(node.getLockedBy());
        }

        node.setLockedBy(null);
        node.setLockedAt(null);
        ContentNode saved = nodeRepository.save(node);
        auditService.log(AuditService.ENTITY_CONTENT, saved.getId(), saved.getPath(),
                AuditService.ACTION_UNLOCK, userId);
        return saved;
    }

    /**
     * Update node status.
     */
    @Timed(value = "flexcms.content.node.status", description = "Time to update a content node status")
    @PreAuthorize("hasPermission(#path, 'PUBLISH')")
    @Transactional
    public ContentNode updateStatus(String path, NodeStatus status, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));

        NodeStatus previousStatus = node.getStatus();
        node.setStatus(status);
        node.setModifiedBy(userId);
        ContentNode saved = nodeRepository.save(node);
        String action = (status == NodeStatus.PUBLISHED) ? AuditService.ACTION_PUBLISH : AuditService.ACTION_UNPUBLISH;
        auditService.log(AuditService.ENTITY_CONTENT, saved.getId(), saved.getPath(), action, userId);

        // Every publish path funnels through this method — the single-node status
        // endpoint, bulkUpdateStatus, and scheduled publishing — so emitting here
        // guarantees each transition is announced exactly once. Consumers such as
        // replication bind after commit, so a rolled-back transition never reaches
        // the publish environment.
        eventPublisher.publishEvent(
                new ContentStatusChangedEvent(this, saved, previousStatus, status, userId));

        return saved;
    }

    /**
     * Rewrite the {@code orderIndex} of a parent's children to match {@code orderedPaths}.
     *
     * <p>Until this existed nothing could change an established order:
     * {@link #createNode} appends with {@code orderIndex = last + 1} and delivery
     * sorts by that column, but no service method or endpoint ever updated it. The
     * page editor's reorder controls therefore had nowhere to persist to — half of
     * REB-19 blocker B-3.</p>
     *
     * <p>Membership is validated strictly: {@code orderedPaths} must name exactly the
     * parent's current children, no more and no fewer. A caller that omits one would
     * otherwise get a partial order that looks like it worked, which is harder to
     * spot than an outright rejection.</p>
     *
     * @param parentPath   ltree path of the parent whose children are being ordered
     * @param orderedPaths child paths in their desired order
     * @param userId       who performed the reorder
     * @return the reordered children
     * @throws NotFoundException  if the parent does not exist
     * @throws ValidationException if the paths do not match the parent's children
     */
    @PreAuthorize("hasPermission(#parentPath, 'WRITE')")
    @Transactional
    public List<ContentNode> reorderChildren(String parentPath, List<String> orderedPaths, String userId) {
        nodeRepository.findByPath(parentPath)
                .orElseThrow(() -> NotFoundException.forPath(parentPath));

        List<ContentNode> children = nodeRepository.findByParentPathOrderByOrderIndex(parentPath);
        Map<String, ContentNode> byPath = new HashMap<>();
        for (ContentNode child : children) {
            byPath.put(child.getPath(), child);
        }

        List<String> requested = orderedPaths == null ? List.of() : orderedPaths;
        Set<String> requestedSet = new LinkedHashSet<>(requested);

        if (requestedSet.size() != requested.size()) {
            throw new ValidationException("Reorder contains duplicate paths", List.of(
                    ValidationException.FieldError.of("orderedPaths", "The same child appears more than once")));
        }
        if (!requestedSet.equals(byPath.keySet())) {
            Set<String> unknown = new LinkedHashSet<>(requestedSet);
            unknown.removeAll(byPath.keySet());
            Set<String> missing = new LinkedHashSet<>(byPath.keySet());
            missing.removeAll(requestedSet);
            throw new ValidationException("Reorder must list exactly the parent's children", List.of(
                    ValidationException.FieldError.of("orderedPaths",
                            "unknown=" + unknown + " missing=" + missing)));
        }

        int index = 0;
        List<ContentNode> reordered = new ArrayList<>(requested.size());
        for (String path : requested) {
            ContentNode child = byPath.get(path);
            child.setOrderIndex(index++);
            child.setModifiedBy(userId);
            reordered.add(child);
        }

        nodeRepository.saveAll(reordered);
        auditService.log(AuditService.ENTITY_CONTENT, null, parentPath,
                AuditService.ACTION_UPDATE, userId);
        return reordered;
    }

    /**
     * Get version history for a node.
     */
    public Page<ContentNodeVersion> getVersionHistory(UUID nodeId, Pageable pageable) {
        return versionRepository.findByNodeIdOrderByVersionNumberDesc(nodeId, pageable);
    }

    /**
     * Restore a node to a specific version.
     */
    @Transactional
    public ContentNode restoreVersion(UUID nodeId, Long versionNumber, String userId) {
        ContentNodeVersion version = versionRepository.findByNodeIdAndVersionNumber(nodeId, versionNumber)
                .orElseThrow(() -> new NotFoundException("Version " + versionNumber + " not found for node " + nodeId));

        ContentNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> NotFoundException.forId("ContentNode", nodeId));

        // Save current state as a version
        saveVersionSnapshotIfMissing(node);

        // Restore
        node.setProperties(new HashMap<>(version.getProperties()));
        node.setResourceType(version.getResourceType());
        node.setModifiedBy(userId);

        return nodeRepository.save(node);
    }

    /**
     * Get direct children of a node (shallow — one level only).
     */
    @PreAuthorize("hasPermission(#parentPath, 'READ')")
    @Transactional(readOnly = true)
    public List<ContentNode> getChildren(String parentPath) {
        return nodeRepository.findByParentPathOrderByOrderIndex(parentPath);
    }

    /**
     * List all content nodes for a site, paginated.
     * Pass {@code null} or empty string for siteId to return nodes across all sites.
     * Pass {@code null} for locale to return nodes for all locales.
     */
    @Transactional(readOnly = true)
    public Page<ContentNode> listBySite(String siteId, String locale, Pageable pageable) {
        if (siteId == null || siteId.isBlank()) {
            return nodeRepository.findAllWithOptionalLocale(locale, pageable);
        }
        return nodeRepository.findBySiteIdAndOptionalLocale(siteId, locale, pageable);
    }

    /**
     * Search content across a site.
     */
    public Page<ContentNode> search(String siteId, String locale, String query, Pageable pageable) {
        return nodeRepository.searchContent(siteId, locale, query, pageable);
    }

    // ── Bulk operations ────────────────────────────────────────────────────────

    /**
     * Bulk status update (e.g. publish or archive multiple nodes at once).
     * Each path is processed independently — one failure does not abort others.
     */
    public BulkOperationResult bulkUpdateStatus(List<String> paths, NodeStatus status, String userId) {
        BulkOperationResult result = new BulkOperationResult();
        for (String path : paths) {
            try {
                runInNewTransaction(() -> updateStatus(path, status, userId));
                result.incrementSucceeded();
            } catch (Exception e) {
                result.addError(path, e.getMessage());
            }
        }
        return result;
    }

    /**
     * Bulk delete — deletes each path and its descendants.
     * Each path is processed independently.
     */
    public BulkOperationResult bulkDelete(List<String> paths, String userId) {
        BulkOperationResult result = new BulkOperationResult();
        for (String path : paths) {
            try {
                runInNewTransaction(() -> delete(path, userId));
                result.incrementSucceeded();
            } catch (Exception e) {
                result.addError(path, e.getMessage());
            }
        }
        return result;
    }

    /**
     * Bulk move — moves each path to the same target parent.
     * Each path is processed independently.
     */
    public BulkOperationResult bulkMove(List<String> paths, String targetParentPath, String userId) {
        BulkOperationResult result = new BulkOperationResult();
        for (String path : paths) {
            try {
                runInNewTransaction(() -> move(path, targetParentPath, userId));
                result.incrementSucceeded();
            } catch (Exception e) {
                result.addError(path, e.getMessage());
            }
        }
        return result;
    }

    private void runInNewTransaction(Runnable action) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        tx.executeWithoutResult(status -> action.run());
    }

    // --- Private helpers ---

    /**
     * Load the full component tree for {@code root} using a single bulk query.
     *
     * <p>Previously this used a recursive pattern that issued one
     * {@code findByParentPathOrderByOrderIndex} query per node (N+1). Now we
     * load all descendants in one query, group them by parent path in memory,
     * and wire up the tree without further DB round-trips.</p>
     */
    private ContentNode loadChildrenRecursive(ContentNode root) {
        // Single query: all descendants of root (any depth)
        List<ContentNode> allDescendants = nodeRepository.findDescendants(root.getPath());

        // Group descendants by parent path for O(1) lookup
        Map<String, List<ContentNode>> byParent = new LinkedHashMap<>();
        for (ContentNode node : allDescendants) {
            byParent.computeIfAbsent(node.getParentPath(), k -> new ArrayList<>()).add(node);
        }

        // Sort each group by orderIndex (findDescendants orders by path, not orderIndex)
        byParent.values().forEach(list -> list.sort(Comparator.comparingInt(ContentNode::getOrderIndex)));

        // Wire up children recursively in memory (no more DB calls)
        wireChildren(root, byParent);
        return root;
    }

    private void wireChildren(ContentNode node, Map<String, List<ContentNode>> byParent) {
        List<ContentNode> children = byParent.getOrDefault(node.getPath(), List.of());
        List<com.flexcms.plugin.spi.ContentNodeData> childData = new ArrayList<>(children.size());
        for (ContentNode child : children) {
            wireChildren(child, byParent);
            childData.add(child);
        }
        node.setChildren(childData);
    }

    private void saveVersionSnapshotIfMissing(ContentNode node) {
        if (node.getId() == null || node.getVersion() == null) {
            versionRepository.save(ContentNodeVersion.fromNode(node));
            return;
        }

        Optional<ContentNodeVersion> existing = versionRepository
                .findByNodeIdAndVersionNumber(node.getId(), node.getVersion());
        boolean alreadyExists = existing != null && existing.isPresent();
        if (!alreadyExists) {
            versionRepository.save(ContentNodeVersion.fromNode(node));
        }
    }

    /**
     * Sanitizes all String-type property values that contain HTML markup,
     * preventing XSS when rich-text content is stored.
     */
    private Map<String, Object> sanitizeProperties(Map<String, Object> properties) {
        Map<String, Object> result = new HashMap<>(properties.size());
        for (Map.Entry<String, Object> entry : properties.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof String s) {
                result.put(entry.getKey(), richTextSanitizer.sanitizeIfHtml(s));
            } else {
                result.put(entry.getKey(), value);
            }
        }
        return result;
    }

    private String sanitizeName(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9_-]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }
}
