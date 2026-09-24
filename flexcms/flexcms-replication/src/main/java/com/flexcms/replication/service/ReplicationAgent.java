package com.flexcms.replication.service;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.model.ReplicationLogEntry;
import com.flexcms.core.repository.AssetRenditionRepository;
import com.flexcms.core.repository.AssetRepository;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.ReplicationLogRepository;
import com.flexcms.replication.config.ReplicationQueueConfig;
import com.flexcms.core.util.AssetUrls;
import com.flexcms.replication.model.ReplicatedAsset;
import com.flexcms.replication.model.ReplicationEvent;
import io.micrometer.core.annotation.Timed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Author-side replication agent: publishes content to the replication queue.
 */
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
public class ReplicationAgent {

    private static final Logger log = LoggerFactory.getLogger(ReplicationAgent.class);

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private ReplicationLogRepository replicationLog;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AssetRenditionRepository renditionRepository;

    /**
     * Replicate a single content node to all publish instances.
     */
    @Timed(value = "flexcms.replication.replicate", description = "Time to send a replication event to the queue")
    @Transactional
    public UUID replicate(String path, ReplicationEvent.ReplicationAction action, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> new IllegalArgumentException("Node not found: " + path));

        if (action == ReplicationEvent.ReplicationAction.ACTIVATE) {
            node.setStatus(NodeStatus.PUBLISHED);
            nodeRepository.save(node);
        }

        ReplicationEvent event = ReplicationEvent.contentActivate(
                path, node.getId(), node.getVersion(),
                node.getSiteId(), node.getLocale(), userId);
        event.setAction(action);
        event.setNodeProperties(Map.copyOf(node.getProperties()));
        event.setResourceType(node.getResourceType());
        event.setParentPath(node.getParentPath());
        event.setOrderIndex(node.getOrderIndex());

        if (action == ReplicationEvent.ReplicationAction.ACTIVATE) {
            replicateReferencedAssets(List.of(node), userId);
        }

        rabbitTemplate.convertAndSend(
                ReplicationQueueConfig.EXCHANGE_NAME,
                ReplicationQueueConfig.CONTENT_ROUTING_KEY,
                event);

        logReplication(event);
        log.info("Replicated content: {} ({}) by {}", path, action, userId);
        return event.getEventId();
    }

    /**
     * Replicate a deletion, so the publish environment drops the content too.
     *
     * <p>Deliberately does <em>not</em> load the node: this is called after the
     * subtree has already been removed on the author side, so a lookup would always
     * fail. {@link #replicate} cannot be reused for the same reason — it resolves the
     * node first and throws {@code Node not found} for exactly this case.</p>
     *
     * <p>{@code ReplicationReceiver.deleteContent()} only needs the path, which it
     * passes to {@code deleteSubtree}, so identity and site/locale are sufficient
     * payload.</p>
     *
     * @param path      ltree path of the deleted subtree root
     * @param nodeId    id the node had before deletion, for traceability
     * @param siteId    site the content belonged to, may be null
     * @param locale    locale the content belonged to, may be null
     * @param userId    who performed the deletion
     * @return the replication event id
     */
    @Transactional
    public UUID replicateDelete(String path, UUID nodeId, String siteId, String locale, String userId) {
        ReplicationEvent event = ReplicationEvent.contentActivate(
                path, nodeId, null, siteId, locale, userId);
        event.setAction(ReplicationEvent.ReplicationAction.DELETE);

        rabbitTemplate.convertAndSend(
                ReplicationQueueConfig.EXCHANGE_NAME,
                ReplicationQueueConfig.CONTENT_ROUTING_KEY,
                event);

        logReplication(event);
        log.info("Replicated deletion: {} by {}", path, userId);
        return event.getEventId();
    }

    /**
     * Tree activation: replicate a page and all its descendants.
     */
    @Transactional
    public UUID replicateTree(String rootPath, String userId) {
        List<ContentNode> nodes = nodeRepository.findDescendants(rootPath);
        ContentNode root = nodeRepository.findByPath(rootPath)
                .orElseThrow(() -> new IllegalArgumentException("Root not found: " + rootPath));
        nodes.add(0, root);

        // Mark all as published
        for (ContentNode node : nodes) {
            node.setStatus(NodeStatus.PUBLISHED);
        }
        nodeRepository.saveAll(nodes);

        List<String> affectedPaths = nodes.stream()
                .map(ContentNode::getPath)
                .collect(Collectors.toList());

        ReplicationEvent event = ReplicationEvent.treeActivate(
                rootPath, affectedPaths, root.getSiteId(), userId);

        replicateReferencedAssets(nodes, userId);

        rabbitTemplate.convertAndSend(
                ReplicationQueueConfig.EXCHANGE_NAME,
                ReplicationQueueConfig.TREE_ROUTING_KEY,
                event);

        logReplication(event);
        log.info("Replicated tree: {} ({} nodes) by {}", rootPath, nodes.size(), userId);
        return event.getEventId();
    }

    /**
     * Publish or withdraw one DAM asset.
     *
     * <p>{@code ACTIVATE} sends the asset row and its renditions; the publish tier writes
     * them under the same id, which is what makes {@code /dam/renditions/{id}} resolve
     * there. {@code DEACTIVATE} removes the publish row, after which the URL is a 404 on
     * publish while the asset stays untouched on author.</p>
     *
     * @throws IllegalArgumentException when no asset has that id
     * @throws IllegalStateException    when activating an asset that is not {@code ACTIVE}
     */
    @Transactional
    public UUID replicateAsset(UUID assetId, ReplicationEvent.ReplicationAction action, String userId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + assetId));

        ReplicationEvent event;
        if (action == ReplicationEvent.ReplicationAction.ACTIVATE) {
            if (asset.getStatus() != AssetStatus.ACTIVE) {
                throw new IllegalStateException("Asset " + assetId + " is " + asset.getStatus()
                        + " and cannot be published");
            }
            event = ReplicationEvent.assetActivate(
                    ReplicatedAsset.from(asset, renditionRepository.findByAssetId(assetId)), userId);
        } else {
            event = ReplicationEvent.assetRemove(assetId, asset.getPath(), asset.getSiteId(), action, userId);
        }

        sendAsset(event);
        log.info("Replicated asset: {} ({}) by {}", asset.getPath(), action, userId);
        return event.getEventId();
    }

    /**
     * Replicate an asset deletion. Like {@link #replicateDelete} this does not load the
     * asset — it is called after the author row is gone.
     */
    @Transactional
    public UUID replicateAssetDelete(UUID assetId, String assetPath, String siteId, String userId) {
        ReplicationEvent event = ReplicationEvent.assetRemove(assetId, assetPath, siteId,
                ReplicationEvent.ReplicationAction.DELETE, userId);
        sendAsset(event);
        log.info("Replicated asset deletion: {} by {}", assetPath, userId);
        return event.getEventId();
    }

    /**
     * Activate every active asset the given nodes reference.
     *
     * <p>Called for each content activation, so publishing a page publishes its images:
     * without it the page went live pointing at assets the publish tier had never heard
     * of ({@code R-REB-21-003}). References are found in both URL forms by
     * {@link AssetUrls#extractAssetIds}. Assets are sent before the content that
     * references them; both routing keys feed the same publish queue, so the asset rows
     * exist by the time the page does.</p>
     *
     * <p>One asset failing to send is logged and skipped: the page itself is still worth
     * publishing, and re-publishing retries the asset.</p>
     *
     * @return number of assets replicated
     */
    @Transactional
    public int replicateReferencedAssets(Collection<ContentNode> nodes, String userId) {
        Set<UUID> assetIds = new LinkedHashSet<>();
        for (ContentNode node : nodes) {
            assetIds.addAll(AssetUrls.extractAssetIds(node.getProperties()));
        }
        if (assetIds.isEmpty()) {
            return 0;
        }

        int replicated = 0;
        for (Asset asset : assetRepository.findAllById(assetIds)) {
            if (asset.getStatus() != AssetStatus.ACTIVE) {
                log.warn("Content references asset {} ({}) in status {} — not replicated",
                        asset.getId(), asset.getPath(), asset.getStatus());
                continue;
            }
            try {
                ReplicationEvent event = ReplicationEvent.assetActivate(
                        ReplicatedAsset.from(asset, renditionRepository.findByAssetId(asset.getId())), userId);
                sendAsset(event);
                replicated++;
            } catch (AmqpException e) {
                log.error("Could not replicate referenced asset {} ({}): {}",
                        asset.getId(), asset.getPath(), e.getMessage(), e);
            }
        }
        if (replicated < assetIds.size()) {
            log.warn("Content references {} asset(s); {} replicated — the rest are missing or inactive on author",
                    assetIds.size(), replicated);
        }
        log.debug("Replicated {} referenced asset(s) by {}", replicated, userId);
        return replicated;
    }

    private void sendAsset(ReplicationEvent event) {
        rabbitTemplate.convertAndSend(
                ReplicationQueueConfig.EXCHANGE_NAME,
                ReplicationQueueConfig.ASSET_ROUTING_KEY,
                event);
        logReplication(event);
    }

    private void logReplication(ReplicationEvent event) {
        ReplicationLogEntry entry = new ReplicationLogEntry();
        entry.setEventId(event.getEventId());
        entry.setAction(ReplicationLogEntry.ReplicationAction.valueOf(event.getAction().name()));
        entry.setContentPath(event.getPath());
        entry.setNodeId(event.getNodeId() != null ? event.getNodeId() : event.getAssetId());
        entry.setVersion(event.getVersion());
        entry.setSiteId(event.getSiteId());
        entry.setLocale(event.getLocale());
        entry.setReplicationType(ReplicationLogEntry.ReplicationType.valueOf(event.getType().name()));
        entry.setStatus(ReplicationLogEntry.ReplicationStatus.PENDING);
        entry.setInitiatedBy(event.getInitiatedBy());
        entry.setInitiatedAt(Instant.now());
        replicationLog.save(entry);
    }
}

