package com.flexcms.author.service;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.replication.model.ReplicationEvent.ReplicationAction;
import com.flexcms.replication.service.ReplicationAgent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Scheduled publishing daemon that runs on the author tier.
 *
 * <p>Every minute this service scans for content nodes whose scheduled
 * publish or deactivation time has passed and triggers replication
 * automatically — no manual user action required.</p>
 *
 * <p>Active only when {@code flexcms.runmode=author} (default), so it
 * never runs on publish-tier instances.</p>
 */
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
public class ScheduledPublishingService {

    private static final Logger log = LoggerFactory.getLogger(ScheduledPublishingService.class);

    private static final String SCHEDULER_USER = "system:scheduler";

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private ReplicationAgent replicationAgent;

    /**
     * Schedule a node for future publishing.
     *
     * @param path      content path (ltree)
     * @param publishAt when to publish; null clears the schedule
     */
    @Transactional
    public void schedulePublish(String path, Instant publishAt) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));
        node.setScheduledPublishAt(publishAt);
        nodeRepository.save(node);
        if (publishAt != null) {
            log.info("Scheduled publish for '{}' at {}", path, publishAt);
        } else {
            log.info("Cleared scheduled publish for '{}'", path);
        }
    }

    /**
     * Schedule a node for future deactivation.
     *
     * @param path           content path (ltree)
     * @param deactivateAt   when to deactivate; null clears the schedule
     */
    @Transactional
    public void scheduleDeactivate(String path, Instant deactivateAt) {
        ContentNode node = nodeRepository.findByPath(path)
                .orElseThrow(() -> NotFoundException.forPath(path));
        node.setScheduledDeactivateAt(deactivateAt);
        nodeRepository.save(node);
        if (deactivateAt != null) {
            log.info("Scheduled deactivation for '{}' at {}", path, deactivateAt);
        } else {
            log.info("Cleared scheduled deactivation for '{}'", path);
        }
    }

    /**
     * Process nodes due for publishing. Runs every 60 seconds.
     */
    @Scheduled(fixedDelay = 60_000)
    public void processScheduledPublishes() {
        List<ContentNode> due = nodeRepository.findDueForPublish(Instant.now());
        if (due.isEmpty()) return;

        log.info("Scheduled publish: processing {} node(s)", due.size());
        int succeeded = 0;
        int failed = 0;

        for (ContentNode node : due) {
            try {
                replicationAgent.replicate(node.getPath(), ReplicationAction.ACTIVATE, SCHEDULER_USER);
                clearScheduledPublish(node);
                succeeded++;
            } catch (Exception e) {
                log.error("Scheduled publish failed for '{}': {}", node.getPath(), e.getMessage());
                failed++;
            }
        }

        log.info("Scheduled publish complete: {}/{} succeeded", succeeded, due.size());
        if (failed > 0) {
            log.warn("Scheduled publish: {} node(s) failed — will retry next cycle", failed);
        }
    }

    /**
     * Process nodes due for deactivation. Runs every 60 seconds.
     */
    @Scheduled(fixedDelay = 60_000)
    public void processScheduledDeactivations() {
        List<ContentNode> due = nodeRepository.findDueForDeactivation(Instant.now());
        if (due.isEmpty()) return;

        log.info("Scheduled deactivation: processing {} node(s)", due.size());
        int succeeded = 0;
        int failed = 0;

        for (ContentNode node : due) {
            try {
                replicationAgent.replicate(node.getPath(), ReplicationAction.DEACTIVATE, SCHEDULER_USER);
                clearScheduledDeactivate(node);
                succeeded++;
            } catch (Exception e) {
                log.error("Scheduled deactivation failed for '{}': {}", node.getPath(), e.getMessage());
                failed++;
            }
        }

        log.info("Scheduled deactivation complete: {}/{} succeeded", succeeded, due.size());
        if (failed > 0) {
            log.warn("Scheduled deactivation: {} node(s) failed — will retry next cycle", failed);
        }
    }

    @Transactional
    protected void clearScheduledPublish(ContentNode node) {
        node.setScheduledPublishAt(null);
        nodeRepository.save(node);
    }

    @Transactional
    protected void clearScheduledDeactivate(ContentNode node) {
        node.setScheduledDeactivateAt(null);
        nodeRepository.save(node);
    }
}
