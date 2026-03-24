package com.flexcms.multisite.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.DomainMapping;
import com.flexcms.core.model.Site;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.DomainMappingRepository;
import com.flexcms.core.repository.SiteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Manages multi-site lifecycle: create sites, manage domains, configure templates.
 */
@Service
public class SiteManagementService {

    private static final Logger log = LoggerFactory.getLogger(SiteManagementService.class);

    @Autowired
    private SiteRepository siteRepository;

    @Autowired
    private DomainMappingRepository domainMappingRepo;

    @Autowired
    private ContentNodeRepository nodeRepository;

    /**
     * Create a new site with its root content tree structure.
     */
    @Transactional
    public Site createSite(String siteId, String title, String defaultLocale,
                            List<String> supportedLocales, String userId) {
        if (siteRepository.existsById(siteId)) {
            throw new IllegalArgumentException("Site already exists: " + siteId);
        }

        Site site = new Site();
        site.setSiteId(siteId);
        site.setTitle(title);
        site.setContentRoot("/content/" + siteId);
        site.setDamRoot("/dam/" + siteId);
        site.setConfigRoot("/conf/" + siteId);
        site.setDefaultLocale(defaultLocale);
        site.setSupportedLocales(supportedLocales);
        site.setActive(true);
        site = siteRepository.save(site);

        // Create root content nodes for each supported locale
        for (String locale : supportedLocales) {
            createRootNodes(siteId, locale, userId);
        }

        log.info("Created site: {} with locales {}", siteId, supportedLocales);
        return site;
    }

    /**
     * Add a domain mapping to a site.
     */
    @Transactional
    public DomainMapping addDomain(String siteId, String domain, boolean primary) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("Site not found: " + siteId));

        DomainMapping mapping = new DomainMapping(domain, siteId);
        mapping.setPrimary(primary);
        return domainMappingRepo.save(mapping);
    }

    /**
     * List all sites.
     */
    public List<Site> listSites() {
        return siteRepository.findAll();
    }

    /**
     * Get site with page count and status.
     */
    public Map<String, Object> getSiteSummary(String siteId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("Site not found: " + siteId));

        Map<String, Object> summary = new HashMap<>();
        summary.put("site", site);
        summary.put("pageCount", nodeRepository.countPagesBySite(siteId));
        summary.put("domains", domainMappingRepo.findBySiteId(siteId));
        return summary;
    }

    private void createRootNodes(String siteId, String locale, String userId) {
        // Content root: content.{siteId}.{locale}
        String contentPath = "content." + siteId + "." + locale;
        if (!nodeRepository.existsByPath(contentPath)) {
            ContentNode root = new ContentNode(contentPath, locale, "flexcms/page");
            root.setParentPath("content." + siteId);
            root.setSiteId(siteId);
            root.setLocale(locale);
            root.setCreatedBy(userId);
            root.setModifiedBy(userId);
            root.setProperties(Map.of("jcr:title", locale.toUpperCase() + " Root"));
            nodeRepository.save(root);
        }

        // Site root: content.{siteId}
        String siteRoot = "content." + siteId;
        if (!nodeRepository.existsByPath(siteRoot)) {
            ContentNode siteNode = new ContentNode(siteRoot, siteId, "flexcms/site-root");
            siteNode.setParentPath("content");
            siteNode.setSiteId(siteId);
            siteNode.setCreatedBy(userId);
            siteNode.setModifiedBy(userId);
            nodeRepository.save(siteNode);
        }
    }
}

