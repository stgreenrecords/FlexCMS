package com.flexcms.search.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Rebuilds the Elasticsearch content index from the publish-tier database.
 *
 * <p>This service is useful for:</p>
 * <ul>
 *   <li>Initial index population after a fresh deployment</li>
 *   <li>Recovery after an Elasticsearch cluster reset or data loss</li>
 *   <li>Correcting drift between the DB and the search index</li>
 * </ul>
 *
 * <p>All operations are idempotent — existing documents are overwritten with the
 * current DB state. The rebuild is performed in bulk batches for performance.</p>
 */
@Service
public class IndexRebuildService {

    private static final Logger log = LoggerFactory.getLogger(IndexRebuildService.class);
    private static final int BATCH_SIZE = 500;

    @Autowired
    private SearchIndexService searchIndexService;

    @Autowired
    private ContentNodeRepository contentNodeRepository;

    /**
     * Rebuild the index for all published content nodes in a specific site.
     *
     * @param siteId the site identifier to reindex
     * @return the number of documents indexed
     */
    public int rebuildSite(String siteId) {
        log.info("Starting index rebuild for site: {}", siteId);

        List<ContentNode> nodes = contentNodeRepository.findBySiteIdAndStatus(siteId, NodeStatus.PUBLISHED);
        int total = nodes.size();

        for (int i = 0; i < total; i += BATCH_SIZE) {
            List<ContentNode> batch = nodes.subList(i, Math.min(i + BATCH_SIZE, total));
            searchIndexService.indexAll(batch);
            log.info("Index rebuild progress for site {}: {}/{}", siteId, Math.min(i + BATCH_SIZE, total), total);
        }

        log.info("Index rebuild complete for site {}: {} documents indexed", siteId, total);
        return total;
    }

    /**
     * Rebuild the index for all published content across all sites.
     *
     * @return the total number of documents indexed
     */
    public int rebuildAll() {
        log.info("Starting full index rebuild across all sites");

        List<ContentNode> nodes = contentNodeRepository.findByStatus(NodeStatus.PUBLISHED);
        int total = nodes.size();

        for (int i = 0; i < total; i += BATCH_SIZE) {
            List<ContentNode> batch = nodes.subList(i, Math.min(i + BATCH_SIZE, total));
            searchIndexService.indexAll(batch);
            log.info("Full index rebuild progress: {}/{}", Math.min(i + BATCH_SIZE, total), total);
        }

        log.info("Full index rebuild complete: {} documents indexed", total);
        return total;
    }

    /**
     * Drop and recreate the index for a single site — removes stale documents
     * before re-populating.
     *
     * @param siteId the site to purge and reindex
     * @return the number of documents indexed after purge
     */
    public int purgeAndRebuildSite(String siteId) {
        log.info("Purging and rebuilding index for site: {}", siteId);
        searchIndexService.removeBySite(siteId);
        return rebuildSite(siteId);
    }
}
