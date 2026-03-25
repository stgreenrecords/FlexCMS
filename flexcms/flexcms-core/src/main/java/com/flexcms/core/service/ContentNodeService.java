package com.flexcms.core.service;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.BulkOperationResult;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.ContentNodeVersion;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.ContentNodeVersionRepository;
import com.flexcms.core.util.RichTextSanitizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        // Save version before update
        versionRepository.save(ContentNodeVersion.fromNode(node));

        // Merge and sanitize properties
        Map<String, Object> merged = new HashMap<>(node.getProperties());
        merged.putAll(updates);
        node.setProperties(sanitizeProperties(merged));
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
            String updatedParent = n.getParentPath() != null
                    ? n.getParentPath().replace(sourcePath, newPath)
                    : targetParentPath;
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
        nodeRepository.deleteSubtree(path);
        auditService.log(AuditService.ENTITY_CONTENT, null, path,
                AuditService.ACTION_DELETE, userId);
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
    @PreAuthorize("hasPermission(#path, 'PUBLISH')")
    @Transactional
    public ContentNode updateStatus(String path, NodeStatus status, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));

        node.setStatus(status);
        node.setModifiedBy(userId);
        ContentNode saved = nodeRepository.save(node);
        String action = (status == NodeStatus.PUBLISHED) ? AuditService.ACTION_PUBLISH : AuditService.ACTION_UNPUBLISH;
        auditService.log(AuditService.ENTITY_CONTENT, saved.getId(), saved.getPath(), action, userId);
        return saved;
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
        versionRepository.save(ContentNodeVersion.fromNode(node));

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
    @Transactional
    public BulkOperationResult bulkUpdateStatus(List<String> paths, NodeStatus status, String userId) {
        BulkOperationResult result = new BulkOperationResult();
        for (String path : paths) {
            try {
                updateStatus(path, status, userId);
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
    @Transactional
    public BulkOperationResult bulkDelete(List<String> paths, String userId) {
        BulkOperationResult result = new BulkOperationResult();
        for (String path : paths) {
            try {
                delete(path, userId);
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
    @Transactional
    public BulkOperationResult bulkMove(List<String> paths, String targetParentPath, String userId) {
        BulkOperationResult result = new BulkOperationResult();
        for (String path : paths) {
            try {
                move(path, targetParentPath, userId);
                result.incrementSucceeded();
            } catch (Exception e) {
                result.addError(path, e.getMessage());
            }
        }
        return result;
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
