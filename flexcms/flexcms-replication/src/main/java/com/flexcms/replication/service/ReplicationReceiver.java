package com.flexcms.replication.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.replication.model.ReplicationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;

/**
 * Publish-side replication receiver: consumes events and updates the local content store.
 */
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
public class ReplicationReceiver {

    private static final Logger log = LoggerFactory.getLogger(ReplicationReceiver.class);

    @Autowired
    private ContentNodeRepository nodeRepository;

    @RabbitListener(queues = "#{publishQueue.name}")
    @Transactional
    public void handleReplication(ReplicationEvent event) {
        log.info("Received replication event: {} {} {}", event.getAction(), event.getType(), event.getPath());

        switch (event.getAction()) {
            case ACTIVATE -> activateContent(event);
            case DEACTIVATE -> deactivateContent(event);
            case DELETE -> deleteContent(event);
        }
    }

    private void activateContent(ReplicationEvent event) {
        if (event.getType() == ReplicationEvent.ReplicationType.TREE) {
            // Tree activation — process each affected path
            if (event.getAffectedPaths() != null) {
                log.info("Tree activation: {} paths from {}", event.getAffectedPaths().size(), event.getPath());
            }
            return;
        }

        // Single node activation — upsert into publish store
        var existing = nodeRepository.findByPath(event.getPath());
        ContentNode node;

        if (existing.isPresent()) {
            node = existing.get();
        } else {
            node = new ContentNode(event.getPath(),
                    extractName(event.getPath()),
                    event.getResourceType() != null ? event.getResourceType() : "flexcms/page");
            node.setParentPath(event.getParentPath());
            node.setSiteId(event.getSiteId());
            node.setLocale(event.getLocale());
        }

        if (event.getNodeProperties() != null) {
            node.setProperties(new HashMap<>(event.getNodeProperties()));
        }
        if (event.getResourceType() != null) {
            node.setResourceType(event.getResourceType());
        }
        if (event.getOrderIndex() != null) {
            node.setOrderIndex(event.getOrderIndex());
        }
        node.setVersion(event.getVersion() != null ? event.getVersion() : node.getVersion());
        node.setStatus(NodeStatus.PUBLISHED);

        nodeRepository.save(node);
        log.info("Activated content on publish: {}", event.getPath());
    }

    private void deactivateContent(ReplicationEvent event) {
        nodeRepository.findByPath(event.getPath()).ifPresent(node -> {
            node.setStatus(NodeStatus.DRAFT);
            nodeRepository.save(node);
            log.info("Deactivated content on publish: {}", event.getPath());
        });
    }

    private void deleteContent(ReplicationEvent event) {
        nodeRepository.deleteSubtree(event.getPath());
        log.info("Deleted content from publish: {}", event.getPath());
    }

    private String extractName(String path) {
        if (path == null) return "unknown";
        String[] parts = path.split("\\.");
        return parts[parts.length - 1];
    }
}

