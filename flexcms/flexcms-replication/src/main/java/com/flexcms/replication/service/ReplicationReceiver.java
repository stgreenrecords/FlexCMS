package com.flexcms.replication.service;

import com.flexcms.core.converter.JsonbConverter;
import com.flexcms.core.event.AssetPublicationChangedEvent;
import com.flexcms.core.event.ContentIndexEvent;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.AssetRenditionRepository;
import com.flexcms.core.repository.AssetRepository;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.replication.model.ReplicatedAsset;
import com.flexcms.replication.model.ReplicationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Publish-side replication receiver: consumes events and updates the local content store.
 */
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
public class ReplicationReceiver {

    private static final Logger log = LoggerFactory.getLogger(ReplicationReceiver.class);

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private AuthorNodeClient authorNodeClient;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AssetRenditionRepository renditionRepository;

    private final JsonbConverter jsonbConverter = new JsonbConverter();

    @RabbitListener(queues = "#{publishQueue.name}")
    @Transactional
    public void handleReplication(ReplicationEvent event) {
        log.info("Received replication event: {} {} {}", event.getAction(), event.getType(), event.getPath());

        // Before the content switch: an ASSET event used to fall into activateContent and
        // upsert a bogus content node at the asset's path.
        if (event.getType() == ReplicationEvent.ReplicationType.ASSET) {
            handleAsset(event);
            return;
        }

        switch (event.getAction()) {
            case ACTIVATE -> activateContent(event);
            case DEACTIVATE -> deactivateContent(event);
            case DELETE -> deleteContent(event);
        }
    }

    private void activateContent(ReplicationEvent event) {
        if (event.getType() == ReplicationEvent.ReplicationType.TREE) {
            activateTree(event);
            return;
        }
        ContentNode saved = activateSingleNode(event.getPath(), event.getResourceType(), event.getParentPath(),
                event.getSiteId(), event.getLocale(), event.getNodeProperties(),
                event.getOrderIndex(), event.getVersion());
        eventPublisher.publishEvent(ContentIndexEvent.index(this, saved));
    }

    /**
     * Tree activation: fetch each affected node from the author and upsert it.
     *
     * <p>Tree events carry only path lists — not node payloads — so each node
     * must be fetched individually via {@link AuthorNodeClient}. Nodes that
     * cannot be fetched (e.g. author temporarily unreachable) are skipped
     * and logged as warnings.</p>
     */
    private void activateTree(ReplicationEvent event) {
        List<String> paths = event.getAffectedPaths();
        if (paths == null || paths.isEmpty()) {
            log.warn("Tree activation event for '{}' has no affected paths — skipping", event.getPath());
            return;
        }

        log.info("Tree activation: fetching {} nodes from author, root={}", paths.size(), event.getPath());
        int succeeded = 0;
        int failed = 0;

        for (String path : paths) {
            try {
                Map<String, Object> nodeData = authorNodeClient.fetchNode(path)
                        .orElse(null);

                if (nodeData == null) {
                    log.warn("Could not fetch node '{}' from author — skipping", path);
                    failed++;
                    continue;
                }

                ContentNode saved = activateSingleNode(
                        path,
                        (String) nodeData.get("resourceType"),
                        (String) nodeData.get("parentPath"),
                        (String) nodeData.getOrDefault("siteId", event.getSiteId()),
                        (String) nodeData.getOrDefault("locale", event.getLocale()),
                        castProperties(nodeData.get("properties")),
                        nodeData.get("orderIndex") instanceof Number n ? n.intValue() : null,
                        nodeData.get("version") instanceof Number n ? n.longValue() : null
                );
                eventPublisher.publishEvent(ContentIndexEvent.index(this, saved));
                succeeded++;
            } catch (Exception e) {
                log.error("Error activating node '{}' during tree replication: {}", path, e.getMessage());
                failed++;
            }
        }

        log.info("Tree activation complete: {}/{} nodes activated (root={})", succeeded, paths.size(), event.getPath());
        if (failed > 0) {
            log.warn("Tree activation: {} nodes failed — partial tree on publish tier", failed);
        }
    }

    /**
     * Upsert a single content node into the publish store.
     *
     * @return the saved {@link ContentNode} (used by the caller to fire a search index event)
     */
    private ContentNode activateSingleNode(String path, String resourceType, String parentPath,
                                            String siteId, String locale,
                                            Map<String, Object> properties, Integer orderIndex, Long version) {
        var existing = nodeRepository.findByPath(path);
        ContentNode node;

        if (existing.isPresent()) {
            node = existing.get();
        } else {
            node = new ContentNode(path,
                    extractName(path),
                    resourceType != null ? resourceType : "flexcms/page");
            node.setParentPath(parentPath);
            node.setSiteId(siteId);
            node.setLocale(locale);
        }

        if (properties != null) {
            node.setProperties(new HashMap<>(properties));
        }
        if (resourceType != null) {
            node.setResourceType(resourceType);
        }
        if (orderIndex != null) {
            node.setOrderIndex(orderIndex);
        }
        node.setVersion(version != null ? version : node.getVersion());
        node.setStatus(NodeStatus.PUBLISHED);

        node = nodeRepository.save(node);
        log.debug("Activated content on publish: {}", path);
        return node;
    }

    private void deactivateContent(ReplicationEvent event) {
        // Deactivate the whole subtree, not just the page node.
        //
        // Activation replicates a page together with its components via
        // replicateTree, but deactivation used to flip only the page itself to
        // DRAFT and leave every child component ACTIVE/PUBLISHED underneath it.
        // The subtree therefore survived a deactivation in a half-published state.
        List<ContentNode> descendants = nodeRepository.findDescendants(event.getPath());
        for (ContentNode descendant : descendants) {
            descendant.setStatus(NodeStatus.DRAFT);
        }
        if (!descendants.isEmpty()) {
            nodeRepository.saveAll(descendants);
            log.debug("Deactivated {} descendant node(s) under {}", descendants.size(), event.getPath());
        }

        nodeRepository.findByPath(event.getPath()).ifPresent(node -> {
            node.setStatus(NodeStatus.DRAFT);
            nodeRepository.save(node);
            log.info("Deactivated content on publish: {}", event.getPath());
        });
        eventPublisher.publishEvent(ContentIndexEvent.remove(this, event.getPath()));
    }

    private void deleteContent(ReplicationEvent event) {
        nodeRepository.deleteSubtree(event.getPath());
        log.info("Deleted content from publish: {}", event.getPath());
        eventPublisher.publishEvent(ContentIndexEvent.remove(this, event.getPath()));
    }

    /**
     * Mirror an asset onto this tier, or withdraw it.
     *
     * <p>The publish row is what makes {@code /dam/renditions/{id}} resolve here (the
     * binary is in the shared bucket either way), so activation writes the author's row
     * under the author's id and withdrawal deletes it; renditions follow by replacement
     * and by cascade respectively.</p>
     */
    private void handleAsset(ReplicationEvent event) {
        UUID assetId = event.getAssetId();
        if (assetId == null) {
            // Events from before asset replication carried only a path and rendition keys.
            log.warn("Asset replication event {} for '{}' has no asset id — skipping",
                    event.getEventId(), event.getPath());
            return;
        }

        if (event.getAction() == ReplicationEvent.ReplicationAction.ACTIVATE) {
            ReplicatedAsset asset = event.getAsset();
            if (asset == null) {
                log.warn("Asset activation event {} for {} has no payload — skipping", event.getEventId(), assetId);
                return;
            }
            activateAsset(asset);
            eventPublisher.publishEvent(new AssetPublicationChangedEvent(this, assetId, asset.path(), true));
            log.info("Activated asset on publish: {} ({})", asset.path(), assetId);
        } else {
            renditionRepository.deleteReplicatedByAssetId(assetId);
            int removed = assetRepository.deleteReplicated(assetId);
            eventPublisher.publishEvent(new AssetPublicationChangedEvent(this, assetId, event.getPath(), false));
            log.info("Removed asset from publish: {} ({}), {} row(s)", event.getPath(), assetId, removed);
        }
    }

    private void activateAsset(ReplicatedAsset a) {
        // path is unique: a predecessor deleted and re-uploaded at the same path on author
        // has a different id and would block the insert.
        renditionRepository.deleteReplicatedByAssetPathAndIdNot(a.path(), a.id());
        assetRepository.deleteByPathAndIdNot(a.path(), a.id());
        assetRepository.upsertReplicated(a.id(), a.path(), a.name(), a.title(), a.description(),
                a.mimeType(), a.fileSize(), a.originalFilename(), a.storageKey(), a.storageBucket(),
                a.width(), a.height(), a.colorSpace(), a.aspectRatio(), a.duration(),
                a.videoCodec(), a.audioCodec(), a.frameRate(),
                jsonbConverter.convertToDatabaseColumn(a.metadata()),
                a.siteId(), a.folderPath(), a.createdBy(), a.createdAt(), a.modifiedBy(), a.modifiedAt());

        renditionRepository.deleteReplicatedByAssetId(a.id());
        if (a.renditions() != null) {
            for (ReplicatedAsset.ReplicatedRendition r : a.renditions()) {
                renditionRepository.insertReplicated(r.id() != null ? r.id() : UUID.randomUUID(), a.id(),
                        r.renditionKey(), r.storageKey(), r.mimeType(), r.fileSize(),
                        r.width(), r.height(), r.format(), r.generatedAt());
            }
        }
    }

    private String extractName(String path) {
        if (path == null) return "unknown";
        String[] parts = path.split("\\.");
        return parts[parts.length - 1];
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castProperties(Object value) {
        if (value instanceof Map<?, ?> m) {
            return (Map<String, Object>) m;
        }
        return null;
    }
}
