package com.flexcms.multisite.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.LiveCopyRelationship;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.LiveCopyRelationshipRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Manages live copy (blueprint / inheritance) relationships between content subtrees.
 *
 * <h3>Concepts</h3>
 * <ul>
 *   <li><b>Blueprint (source)</b> — the original content that is copied.</li>
 *   <li><b>Live copy (target)</b> — a copy that remains synchronized with the blueprint.</li>
 *   <li><b>Rollout</b> — propagate blueprint changes to all live copies.</li>
 *   <li><b>Detach</b> — break the live copy relationship; the copy becomes independent.</li>
 * </ul>
 *
 * <h3>Rollout property merge rules</h3>
 * <p>All blueprint properties are copied to the live copy <em>except</em> properties listed
 * in {@link LiveCopyRelationship#getExcludedPropsList()}. This lets authors locally
 * override e.g. a page title while still inheriting the page layout.</p>
 */
@Service
public class LiveCopyService {

    private static final Logger log = LoggerFactory.getLogger(LiveCopyService.class);

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private LiveCopyRelationshipRepository liveCopyRepo;

    // -------------------------------------------------------------------------
    // Create live copy
    // -------------------------------------------------------------------------

    /**
     * Create a live copy of the subtree rooted at {@code sourcePath} and place
     * it under {@code targetParentPath}/{@code targetName}.
     *
     * <p>All source nodes are copied to new paths under the target parent.
     * A {@link LiveCopyRelationship} is recorded for the root and (when {@code deep=true})
     * every descendant.</p>
     *
     * @param sourcePath       path of the blueprint root
     * @param targetParentPath path of the new copy's parent
     * @param targetName       name of the new copy root node
     * @param deep             if {@code true}, synchronize the full subtree
     * @param excludedProps    comma-separated properties excluded from rollout
     * @param userId           actor creating the live copy
     * @return the created root copy node
     */
    @Transactional
    public ContentNode createLiveCopy(String sourcePath, String targetParentPath,
                                       String targetName, boolean deep,
                                       String excludedProps, String userId) {

        ContentNode sourceRoot = nodeRepository.findByPath(sourcePath)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + sourcePath));

        if (!nodeRepository.existsByPath(targetParentPath)) {
            throw new IllegalArgumentException("Target parent not found: " + targetParentPath);
        }

        String targetRootPath = targetParentPath + "." + sanitizeName(targetName);
        if (nodeRepository.existsByPath(targetRootPath)) {
            throw new IllegalStateException("Target path already exists: " + targetRootPath);
        }

        // Copy root node
        ContentNode rootCopy = copyNode(sourceRoot, targetRootPath, targetParentPath, userId);
        nodeRepository.save(rootCopy);
        recordRelationship(sourcePath, targetRootPath, deep, excludedProps, userId);

        // Copy descendants when deep=true
        if (deep) {
            List<ContentNode> descendants = nodeRepository.findDescendants(sourcePath);
            for (ContentNode desc : descendants) {
                String relPath = desc.getPath().substring(sourcePath.length()); // e.g. ".about.team"
                String newPath = targetRootPath + relPath;
                String newParent = newPath.contains(".")
                        ? newPath.substring(0, newPath.lastIndexOf('.'))
                        : targetParentPath;

                ContentNode copy = copyNode(desc, newPath, newParent, userId);
                nodeRepository.save(copy);
                recordRelationship(desc.getPath(), newPath, true, excludedProps, userId);
            }
        }

        log.info("Created live copy: source={}, target={}, deep={}, nodes={}",
                sourcePath, targetRootPath, deep,
                deep ? 1 + nodeRepository.findDescendants(sourcePath).size() : 1);
        return rootCopy;
    }

    // -------------------------------------------------------------------------
    // Rollout
    // -------------------------------------------------------------------------

    /**
     * Rollout changes from a blueprint path to all its live copies.
     *
     * <p>For each registered live-copy relationship whose source path equals or starts with
     * {@code sourcePath}, the blueprint's current properties are merged into the live copy,
     * respecting each relationship's {@code excludedProps} list.</p>
     *
     * @param sourcePath the blueprint root path to roll out from
     * @param userId     actor performing the rollout
     * @return a summary of how many nodes were updated
     */
    @Transactional
    public RolloutResult rollout(String sourcePath, String userId) {
        String sourcePrefix = sourcePath + ".";
        List<LiveCopyRelationship> relationships =
                liveCopyRepo.findBySourcePathOrPrefix(sourcePath, sourcePrefix + "%");

        int updated = 0;
        List<String> errors = new ArrayList<>();

        for (LiveCopyRelationship rel : relationships) {
            try {
                Optional<ContentNode> sourceOpt = nodeRepository.findByPath(rel.getSourcePath());
                Optional<ContentNode> targetOpt = nodeRepository.findByPath(rel.getTargetPath());

                if (sourceOpt.isEmpty()) {
                    errors.add("Source not found for live copy: " + rel.getSourcePath());
                    continue;
                }
                if (targetOpt.isEmpty()) {
                    errors.add("Target not found: " + rel.getTargetPath());
                    continue;
                }

                ContentNode source = sourceOpt.get();
                ContentNode target = targetOpt.get();
                List<String> excluded = rel.getExcludedPropsList();

                // Merge blueprint properties into live copy, respecting exclusions
                Map<String, Object> merged = new HashMap<>(target.getProperties());
                for (Map.Entry<String, Object> entry : source.getProperties().entrySet()) {
                    if (!excluded.contains(entry.getKey())) {
                        merged.put(entry.getKey(), entry.getValue());
                    }
                }
                target.setProperties(merged);
                target.setResourceType(source.getResourceType());
                target.setModifiedBy(userId);
                nodeRepository.save(target);
                updated++;
            } catch (Exception e) {
                errors.add("Rollout failed for " + rel.getTargetPath() + ": " + e.getMessage());
                log.warn("Rollout error for target={}", rel.getTargetPath(), e);
            }
        }

        log.info("Rollout complete: source={}, updated={}, errors={}", sourcePath, updated, errors.size());
        return new RolloutResult(sourcePath, updated, errors);
    }

    // -------------------------------------------------------------------------
    // Detach
    // -------------------------------------------------------------------------

    /**
     * Detach a live copy, breaking the synchronization relationship.
     * The content node itself is NOT deleted — it simply becomes independent.
     *
     * @param targetPath the live copy path to detach (can be a subtree root)
     * @param deep       if {@code true}, also detach all descendant relationships
     */
    @Transactional
    public void detach(String targetPath, boolean deep) {
        if (deep) {
            liveCopyRepo.deleteByTargetPathOrPrefix(targetPath, targetPath + ".%");
        } else {
            liveCopyRepo.deleteByTargetPath(targetPath);
        }
        log.info("Detached live copy: targetPath={}, deep={}", targetPath, deep);
    }

    // -------------------------------------------------------------------------
    // Query
    // -------------------------------------------------------------------------

    /**
     * Find all live copies of a blueprint path.
     *
     * @param sourcePath the blueprint path
     * @return list of live-copy relationships
     */
    @Transactional(readOnly = true)
    public List<LiveCopyRelationship> findLiveCopies(String sourcePath) {
        return liveCopyRepo.findBySourcePath(sourcePath);
    }

    /**
     * Get the live-copy relationship for a given target path, or empty if not a live copy.
     *
     * @param targetPath the target content path
     * @return the relationship, if present
     */
    @Transactional(readOnly = true)
    public Optional<LiveCopyRelationship> getRelationship(String targetPath) {
        return liveCopyRepo.findByTargetPath(targetPath);
    }

    /**
     * Check whether a given path is a live copy.
     *
     * @param targetPath the content path to check
     * @return {@code true} if the path is a live copy
     */
    @Transactional(readOnly = true)
    public boolean isLiveCopy(String targetPath) {
        return liveCopyRepo.existsByTargetPath(targetPath);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private ContentNode copyNode(ContentNode source, String newPath, String newParentPath, String userId) {
        ContentNode copy = new ContentNode();
        copy.setPath(newPath);
        copy.setName(newPath.contains(".") ? newPath.substring(newPath.lastIndexOf('.') + 1) : newPath);
        copy.setResourceType(source.getResourceType());
        copy.setParentPath(newParentPath);
        copy.setProperties(new HashMap<>(source.getProperties()));
        copy.setStatus(source.getStatus());
        copy.setSiteId(source.getSiteId());
        copy.setLocale(source.getLocale());
        copy.setOrderIndex(source.getOrderIndex());
        copy.setCreatedBy(userId);
        copy.setModifiedBy(userId);
        return copy;
    }

    private void recordRelationship(String sourcePath, String targetPath, boolean deep,
                                    String excludedProps, String userId) {
        LiveCopyRelationship rel = new LiveCopyRelationship(sourcePath, targetPath, deep, userId);
        rel.setExcludedProps(excludedProps);
        liveCopyRepo.save(rel);
    }

    private static String sanitizeName(String name) {
        return name.toLowerCase().replaceAll("[^a-z0-9_-]", "-");
    }

    /** Summary returned by {@link #rollout}. */
    public record RolloutResult(String sourcePath, int updatedNodes, List<String> errors) {
        public boolean hasErrors() { return !errors.isEmpty(); }
    }
}
