package com.flexcms.author.service;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.service.ContentNodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private ContentNodeService nodeService;

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
                // Go through the status transition rather than replicating directly.
                // A direct replicate() left the author node on its old status while
                // the page was live on publish, and — because findDueForPublish
                // selects on `status <> 'PUBLISHED'` — kept the node eligible for
                // re-selection. updateStatus() writes the status and audit entry and
                // publishes ContentStatusChangedEvent, which the replication listener
                // turns into the correct call (a *tree* replication for pages, so
                // child components travel with them).
                runAsScheduler(() -> {
                    nodeService.updateStatus(node.getPath(), NodeStatus.PUBLISHED, SCHEDULER_USER);
                    clearScheduledPublish(node.getPath());
                });
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
                // Same reasoning as scheduled publish: transition the node so the
                // author reflects the deactivation, and let the listener emit the
                // DEACTIVATE replication. Previously neither side changed — the
                // author still read PUBLISHED and publish kept serving the page.
                runAsScheduler(() -> {
                    nodeService.updateStatus(node.getPath(), NodeStatus.ARCHIVED, SCHEDULER_USER);
                    clearScheduledDeactivate(node.getPath());
                });
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
    protected void clearScheduledPublish(String path) {
        // Re-read rather than reusing the entity from findDueForPublish.
        //
        // That instance was loaded *before* updateStatus() ran, so it still carries
        // the pre-transition status. Saving it here would write DRAFT back over the
        // PUBLISHED the transition had just committed — a lost update that leaves the
        // page live on publish while the author shows it unpublished, i.e. exactly
        // the symptom this class was fixed to remove.
        nodeRepository.findByPath(path).ifPresent(fresh -> {
            fresh.setScheduledPublishAt(null);
            nodeRepository.save(fresh);
        });
    }

    @Transactional
    protected void clearScheduledDeactivate(String path) {
        // Same reasoning as clearScheduledPublish: re-read so the pre-transition
        // entity cannot overwrite the status the transition just wrote.
        nodeRepository.findByPath(path).ifPresent(fresh -> {
            fresh.setScheduledDeactivateAt(null);
            nodeRepository.save(fresh);
        });
    }

    /**
     * Runs one unit of scheduled work as the {@code system:scheduler} principal.
     *
     * <p>{@code ContentNodeService.updateStatus()} is guarded by
     * {@code @PreAuthorize("hasPermission(#path, 'PUBLISH')")}, and a
     * {@code @Scheduled} thread has no {@code SecurityContext} — every cycle failed
     * with "An Authentication object was not found in the SecurityContext", so the
     * schedule was never consumed and the job retried indefinitely.</p>
     *
     * <p>The job is given an explicit identity rather than having authorization
     * bypassed: ROLE_ADMIN is what {@code NodeAclService.isAllowed()} accepts for
     * unrestricted access, and the audit trail then records {@code system:scheduler}
     * as the actor. The previous context is always restored, so nothing leaks onto
     * the pooled scheduler thread between cycles.</p>
     */
    private void runAsScheduler(Runnable work) {
        SecurityContext previous = SecurityContextHolder.getContext();
        try {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(new UsernamePasswordAuthenticationToken(
                    SCHEDULER_USER, "n/a", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
            SecurityContextHolder.setContext(context);
            work.run();
        } finally {
            SecurityContextHolder.setContext(previous);
        }
    }
}
