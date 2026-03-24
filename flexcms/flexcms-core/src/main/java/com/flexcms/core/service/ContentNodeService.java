package com.flexcms.core.service;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.ContentNodeVersion;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.ContentNodeVersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    /**
     * Get a single content node by path.
     */
    public Optional<ContentNode> getByPath(String path) {
        return nodeRepository.findByPath(path);
    }

    /**
     * Get a content node with its full component tree (children loaded recursively).
     */
    @Transactional(readOnly = true)
    public Optional<ContentNode> getWithChildren(String path) {
        return nodeRepository.findByPath(path).map(this::loadChildrenRecursive);
    }

    /**
     * Create a new content node.
     */
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
        node.setProperties(properties != null ? properties : new HashMap<>());
        node.setSiteId(parent.getSiteId());
        node.setLocale(parent.getLocale());
        node.setCreatedBy(userId);
        node.setModifiedBy(userId);

        // Set order to last among siblings
        List<ContentNode> siblings = nodeRepository.findByParentPathOrderByOrderIndex(parentPath);
        node.setOrderIndex(siblings.isEmpty() ? 0 : siblings.getLast().getOrderIndex() + 1);

        return nodeRepository.save(node);
    }

    /**
     * Update node properties (partial merge).
     */
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

        // Merge properties
        Map<String, Object> merged = new HashMap<>(node.getProperties());
        merged.putAll(updates);
        node.setProperties(merged);
        node.setModifiedBy(userId);

        return nodeRepository.save(node);
    }

    /**
     * Move a node to a new parent.
     */
    @Transactional
    public ContentNode move(String sourcePath, String targetParentPath, String userId) {
        ContentNode node = nodeRepository.findByPath(sourcePath)
                .orElseThrow(() -> NotFoundException.forPath(sourcePath));

        ContentNode targetParent = nodeRepository.findByPath(targetParentPath)
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
        return subtree.get(0);
    }

    /**
     * Delete a node and all its descendants.
     */
    @Transactional
    public void delete(String path) {
        nodeRepository.deleteSubtree(path);
    }

    /**
     * Lock a node for editing.
     */
    @Transactional
    public ContentNode lock(String path, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));

        if (node.getLockedBy() != null && !node.getLockedBy().equals(userId)) {
            throw ConflictException.lockedBy(node.getLockedBy());
        }

        node.setLockedBy(userId);
        node.setLockedAt(Instant.now());
        return nodeRepository.save(node);
    }

    /**
     * Unlock a node.
     */
    @Transactional
    public ContentNode unlock(String path, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));

        if (node.getLockedBy() != null && !node.getLockedBy().equals(userId)) {
            throw ConflictException.lockedBy(node.getLockedBy());
        }

        node.setLockedBy(null);
        node.setLockedAt(null);
        return nodeRepository.save(node);
    }

    /**
     * Update node status.
     */
    @Transactional
    public ContentNode updateStatus(String path, NodeStatus status, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));

        node.setStatus(status);
        node.setModifiedBy(userId);
        return nodeRepository.save(node);
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

    // --- Private helpers ---

    private ContentNode loadChildrenRecursive(ContentNode node) {
        List<ContentNode> children = nodeRepository.findByParentPathOrderByOrderIndex(node.getPath());
        List<com.flexcms.plugin.spi.ContentNodeData> childData = new ArrayList<>();
        for (ContentNode child : children) {
            loadChildrenRecursive(child);
            childData.add(child);
        }
        node.setChildren(childData);
        return node;
    }

    private String sanitizeName(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9_-]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }
}
