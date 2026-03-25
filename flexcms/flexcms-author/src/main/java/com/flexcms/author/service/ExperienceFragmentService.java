package com.flexcms.author.service;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.service.ContentNodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Manages Experience Fragments (XF) — reusable authored content chunks with
 * multiple named variations (master, mobile, email, etc.).
 *
 * <p><b>Content model:</b>
 * <pre>
 *   experience-fragments.{site}.{locale}.{category}.{xf-name}         ← flexcms/xf-folder
 *   experience-fragments.{site}.{locale}.{category}.{xf-name}.master   ← flexcms/xf-page
 *   experience-fragments.{site}.{locale}.{category}.{xf-name}.mobile   ← flexcms/xf-page
 * </pre>
 *
 * <p>Pages reference an XF variation via a component with
 * {@code resourceType = "flexcms/experience-fragment"} and property
 * {@code fragmentPath} pointing at a {@code flexcms/xf-page} node.
 * The delivery layer resolves this reference and embeds the variation's
 * component tree inline.
 *
 * <p>AEM equivalent: {@code /content/experience-fragments} + XF template.
 */
@Service
public class ExperienceFragmentService {

    private static final Logger log = LoggerFactory.getLogger(ExperienceFragmentService.class);

    /** Prefix for all XF paths in the content_nodes table. */
    public static final String XF_ROOT = "experience-fragments";

    /** Maximum inline resolution depth — guards against circular XF references. */
    public static final int MAX_RESOLUTION_DEPTH = 5;

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private ContentNodeService nodeService;   // read operations only

    @Autowired
    private JdbcTemplate jdbc;

    // =========================================================================
    // Create
    // =========================================================================

    /**
     * Creates a new Experience Fragment root node ({@code flexcms/xf-folder}).
     * Intermediate ancestor nodes are created automatically when they do not exist.
     *
     * @param siteId     owning site (used for ACL / listing)
     * @param locale     content locale (e.g. "en")
     * @param category   grouping segment (e.g. "site", "adventures") — may be empty
     * @param name       machine name of the XF (e.g. "header")
     * @param title      human-readable title
     * @param description optional description
     * @param userId     author creating the XF
     * @return the created XF folder {@link ContentNode}
     */
    @Transactional
    public ContentNode createExperienceFragment(String siteId, String locale,
                                                String category, String name,
                                                String title, String description,
                                                String userId) {
        String xfPath = buildXfPath(siteId, locale, category, name);

        if (nodeRepository.existsByPath(xfPath)) {
            throw new ConflictException("Experience Fragment already exists at: " + xfPath);
        }

        // Ensure every ancestor exists (XF_ROOT → site → locale → category)
        ensureAncestors(xfPath, siteId, locale, userId);

        String parentPath = xfPath.substring(0, xfPath.lastIndexOf('.'));
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("jcr:title",       title);
        props.put("jcr:description", description);
        props.put("xfType",          "experience-fragment");

        ContentNode xfFolder = saveNode(xfPath, slugify(name), "flexcms/xf-folder",
                parentPath, siteId, locale, props, userId);

        persistMetadata(xfPath, siteId, locale, title, description, userId);
        log.info("Created Experience Fragment '{}' at path {}", title, xfPath);
        return xfFolder;
    }

    /**
     * Adds a named variation (e.g. "master", "mobile", "email") to an existing XF folder.
     *
     * @param xfPath        path of the {@code flexcms/xf-folder} node
     * @param variationType variation name (conventionally lowercase: master, mobile, email)
     * @param title         variation title
     * @param userId        author
     * @return the created variation {@link ContentNode}
     */
    @Transactional
    public ContentNode addVariation(String xfPath, String variationType, String title, String userId) {
        ContentNode xfFolder = nodeRepository.findByPath(xfPath)
                .orElseThrow(() -> new NotFoundException("Experience Fragment not found: " + xfPath));

        if (!"flexcms/xf-folder".equals(xfFolder.getResourceType())) {
            throw new IllegalArgumentException("Node at " + xfPath + " is not an Experience Fragment folder");
        }

        String slug     = slugify(variationType);
        String varPath  = xfPath + "." + slug;

        if (nodeRepository.existsByPath(varPath)) {
            throw new ConflictException("Variation '" + variationType + "' already exists on XF: " + xfPath);
        }

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("jcr:title",         title != null ? title : capitalize(variationType) + " Variation");
        props.put("variationType",     variationType);
        props.put("xfMasterVariation", "master".equalsIgnoreCase(variationType));

        ContentNode variation = saveNode(varPath, slug, "flexcms/xf-page",
                xfPath, xfFolder.getSiteId(), xfFolder.getLocale(), props, userId);

        jdbc.update("UPDATE experience_fragment_metadata SET updated_at = ? WHERE xf_path = ?",
                Instant.now(), xfPath);

        log.info("Added variation '{}' to Experience Fragment {}", variationType, xfPath);
        return variation;
    }

    // =========================================================================
    // Read
    // =========================================================================

    /**
     * Lists all Experience Fragment roots for a site/locale pair.
     * Queries the lightweight {@code experience_fragment_metadata} table.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listExperienceFragments(String siteId, String locale) {
        return jdbc.queryForList(
            "SELECT xf_path, title, description, created_at, updated_at " +
            "FROM experience_fragment_metadata " +
            "WHERE site_id = ? AND locale = ? " +
            "ORDER BY updated_at DESC",
            siteId, locale);
    }

    /** Returns the XF folder node (metadata only, no children). */
    @Transactional(readOnly = true)
    public Optional<ContentNode> getExperienceFragment(String xfPath) {
        return nodeRepository.findByPath(xfPath)
                .filter(n -> "flexcms/xf-folder".equals(n.getResourceType()));
    }

    /**
     * Lists all variation nodes ({@code flexcms/xf-page}) of an XF folder.
     */
    @Transactional(readOnly = true)
    public List<ContentNode> listVariations(String xfPath) {
        return nodeService.getChildren(xfPath).stream()
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()))
                .toList();
    }

    /**
     * Returns a specific variation of an XF, with its component children loaded.
     */
    @Transactional(readOnly = true)
    public Optional<ContentNode> getVariation(String xfPath, String variationType) {
        String variationPath = xfPath + "." + slugify(variationType);
        return nodeRepository.findByPath(variationPath)
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()));
    }

    /**
     * Returns the default variation of an XF: prefers "master", falls back to
     * the first available variation.
     */
    @Transactional(readOnly = true)
    public Optional<ContentNode> getDefaultVariation(String xfPath) {
        Optional<ContentNode> master = getVariation(xfPath, "master");
        if (master.isPresent()) return master;
        List<ContentNode> all = listVariations(xfPath);
        return all.isEmpty() ? Optional.empty() : Optional.of(all.get(0));
    }

    /**
     * Resolves an XF reference by its full variation path (the value of
     * {@code fragmentPath} stored on a {@code flexcms/experience-fragment} component).
     *
     * <p>Called by {@link com.flexcms.core.service.ContentDeliveryService} during page
     * rendering to embed XF content inline. Returns the variation with its full
     * component tree.
     *
     * @param fragmentPath full path of the variation node (flexcms/xf-page)
     * @return variation node with children, or empty if not found / wrong type
     */
    @Transactional(readOnly = true)
    public Optional<ContentNode> resolveReference(String fragmentPath) {
        return nodeService.getWithChildren(fragmentPath)
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()));
    }

    // =========================================================================
    // Delete
    // =========================================================================

    /**
     * Deletes an entire Experience Fragment and all its variations.
     */
    @Transactional
    public void deleteExperienceFragment(String xfPath, String userId) {
        nodeRepository.findByPath(xfPath)
                .filter(n -> "flexcms/xf-folder".equals(n.getResourceType()))
                .orElseThrow(() -> new NotFoundException("Experience Fragment not found: " + xfPath));

        nodeRepository.deleteSubtree(xfPath);
        jdbc.update("DELETE FROM experience_fragment_metadata WHERE xf_path = ?", xfPath);

        log.info("Deleted Experience Fragment at {}", xfPath);
    }

    /**
     * Deletes a single variation of an XF.
     */
    @Transactional
    public void deleteVariation(String xfPath, String variationType, String userId) {
        String variationPath = xfPath + "." + slugify(variationType);
        nodeRepository.findByPath(variationPath)
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()))
                .orElseThrow(() -> new NotFoundException(
                        "Variation '" + variationType + "' not found on XF: " + xfPath));

        nodeRepository.deleteSubtree(variationPath);
        jdbc.update("UPDATE experience_fragment_metadata SET updated_at = ? WHERE xf_path = ?",
                Instant.now(), xfPath);

        log.info("Deleted variation '{}' from Experience Fragment {}", variationType, xfPath);
    }

    // =========================================================================
    // Internal helpers
    // =========================================================================

    /**
     * Builds the full dot-separated path of the XF folder node.
     * Example: {@code experience-fragments.wknd.en.site.header}
     */
    private String buildXfPath(String siteId, String locale, String category, String name) {
        StringBuilder sb = new StringBuilder(XF_ROOT)
                .append(".").append(siteId)
                .append(".").append(locale);
        if (category != null && !category.isBlank()) {
            sb.append(".").append(slugify(category));
        }
        return sb.append(".").append(slugify(name)).toString();
    }

    /**
     * Ensures every ancestor path segment exists in {@code content_nodes}.
     * Creates missing intermediary nodes as {@code flexcms/container} placeholders.
     */
    private void ensureAncestors(String fullPath, String siteId, String locale, String userId) {
        String[] segments = fullPath.split("\\.");
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < segments.length - 1; i++) {   // stop before the XF folder itself
            if (i > 0) current.append(".");
            current.append(segments[i]);
            String p = current.toString();
            if (!nodeRepository.existsByPath(p)) {
                String parentOfP = i == 0 ? null : p.substring(0, p.lastIndexOf('.'));
                Map<String, Object> props = Map.of("jcr:title", capitalize(segments[i]));
                saveNode(p, segments[i], "flexcms/container", parentOfP, siteId, locale, props, userId);
            }
        }
    }

    /** Creates and saves a {@link ContentNode} directly via the repository. */
    private ContentNode saveNode(String path, String name, String resourceType,
                                  String parentPath, String siteId, String locale,
                                  Map<String, Object> properties, String userId) {
        ContentNode node = new ContentNode(path, name, resourceType);
        node.setParentPath(parentPath);
        node.setSiteId(siteId);
        node.setLocale(locale);
        node.setProperties(properties != null ? properties : new LinkedHashMap<>());
        node.setCreatedBy(userId);
        node.setModifiedBy(userId);
        return nodeRepository.save(node);
    }

    private void persistMetadata(String xfPath, String siteId, String locale,
                                  String title, String description, String userId) {
        jdbc.update(
            "INSERT INTO experience_fragment_metadata " +
            "(id, xf_path, site_id, locale, title, description, created_by) " +
            "VALUES (uuid_generate_v4(), ?, ?, ?, ?, ?, ?) " +
            "ON CONFLICT (xf_path) DO UPDATE SET title = EXCLUDED.title, " +
            "description = EXCLUDED.description, updated_at = NOW()",
            xfPath, siteId, locale, title, description, userId);
    }

    private static String slugify(String value) {
        return value.toLowerCase(Locale.ROOT)
                    .replaceAll("[^a-z0-9]+", "-")
                    .replaceAll("^-|-$", "");
    }

    private static String capitalize(String value) {
        if (value == null || value.isBlank()) return value;
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}

