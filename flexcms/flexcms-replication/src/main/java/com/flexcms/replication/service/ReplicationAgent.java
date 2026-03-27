package com.flexcms.replication.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.model.ReplicationLogEntry;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.ReplicationLogRepository;
import com.flexcms.replication.config.ReplicationQueueConfig;
import com.flexcms.replication.model.ReplicationEvent;
import io.micrometer.core.annotation.Timed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
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

        rabbitTemplate.convertAndSend(
                ReplicationQueueConfig.EXCHANGE_NAME,
                ReplicationQueueConfig.CONTENT_ROUTING_KEY,
                event);

        logReplication(event);
        log.info("Replicated content: {} ({}) by {}", path, action, userId);
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

        rabbitTemplate.convertAndSend(
                ReplicationQueueConfig.EXCHANGE_NAME,
                ReplicationQueueConfig.TREE_ROUTING_KEY,
                event);

        logReplication(event);
        log.info("Replicated tree: {} ({} nodes) by {}", rootPath, nodes.size(), userId);
        return event.getEventId();
    }

    /**
     * Replicate an asset to publish tier.
     */
    public UUID replicateAsset(String assetPath, List<String> renditionKeys, String userId) {
        ReplicationEvent event = ReplicationEvent.assetActivate(assetPath, renditionKeys, userId);

        rabbitTemplate.convertAndSend(
                ReplicationQueueConfig.EXCHANGE_NAME,
                ReplicationQueueConfig.ASSET_ROUTING_KEY,
                event);

        logReplication(event);
        log.info("Replicated asset: {} by {}", assetPath, userId);
        return event.getEventId();
    }

    private void logReplication(ReplicationEvent event) {
        ReplicationLogEntry entry = new ReplicationLogEntry();
        entry.setEventId(event.getEventId());
        entry.setAction(ReplicationLogEntry.ReplicationAction.valueOf(event.getAction().name()));
        entry.setContentPath(event.getPath());
        entry.setNodeId(event.getNodeId());
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

