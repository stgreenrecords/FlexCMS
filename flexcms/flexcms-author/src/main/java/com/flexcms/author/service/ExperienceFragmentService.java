package com.flexcms.author.service;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.service.ContentNodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
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
 *   experience-fragments.{site}.{locale}.{category}.{xf-name}      ← flexcms/xf-folder
 *   experience-fragments.{site}.{locale}.{category}.{xf-name}.master  ← flexcms/xf-page
 *   experience-fragments.{site}.{locale}.{category}.{xf-name}.mobile  ← flexcms/xf-page
 * </pre>
 *
 * <p>Pages reference an XF variation via a component with
 * {@code resourceType = "flexcms/experience-fragment"} and property
 * {@code fragmentPath} pointing at an {@code flexcms/xf-page} node.
 * The delivery layer resolves this reference and embeds the variation's
 * component tree inline.
 *
 * <p>AEM equivalent: {@code /content/experience-fragments} + XF template.
 */
@Service
public class ExperienceFragmentService {

    private static final Logger log = LoggerFactory.getLogger(ExperienceFragmentService.class);

    /** Prefix for all XF paths — keeps XFs separate from regular content. */
    public static final String XF_ROOT = "experience-fragments";

    /** Maximum inline resolution depth to prevent circular XF references. */
    public static final int MAX_RESOLUTION_DEPTH = 5;

    @Autowired
    private ContentNodeService nodeService;

    @Autowired
    private JdbcTemplate jdbc;

    // =========================================================================
    // Create
    // =========================================================================

    /**
     * Creates a new Experience Fragment root node (flexcms/xf-folder).
     *
     * @param siteId   owning site
     * @param locale   content locale (e.g. "en")
     * @param category grouping path segment (e.g. "site", "adventures")
     * @param name     machine name of the XF (e.g. "header")
     * @param title    human-readable title
     * @param description optional description
     * @param userId   author creating the XF
     * @return the created root {@link ContentNode}
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTENT_AUTHOR')")
    public ContentNode createExperienceFragment(String siteId, String locale,
                                                String category, String name,
                                                String title, String description,
                                                String userId) {
        // Build path: experience-fragments.{site}.{locale}.{category}.{name}
        String parentPath = buildCategoryPath(siteId, locale, category);
        String xfPath     = parentPath + "." + slugify(name);

        // Ensure the parent category node exists
        ensurePath(parentPath, siteId, locale, userId);

        if (nodeService.getByPath(xfPath).isPresent()) {
            throw new ConflictException("Experience Fragment already exists at: " + xfPath);
        }

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("jcr:title",       title);
        props.put("jcr:description", description);
        props.put("xfType",          "experience-fragment");

        ContentNode xfFolder = nodeService.create(
                xfPath, name, "flexcms/xf-folder", props, siteId, locale, userId);

        // Track in metadata table for fast admin listing
        persistMetadata(xfPath, siteId, locale, title, description, userId);

        log.info("Created Experience Fragment '{}' at path {}", title, xfPath);
        return xfFolder;
    }

    /**
     * Adds a named variation (e.g. "master", "mobile", "email") to an existing XF.
     *
     * @param xfPath       path of the {@code flexcms/xf-folder} node
     * @param variationType variation name (conventionally lowercase: master, mobile, email)
     * @param title        variation title
     * @param userId       author
     * @return the created variation {@link ContentNode}
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTENT_AUTHOR')")
    public ContentNode addVariation(String xfPath, String variationType, String title, String userId) {
        // Verify parent XF folder exists
        ContentNode xfFolder = nodeService.getByPath(xfPath)
                .orElseThrow(() -> new NotFoundException("Experience Fragment not found: " + xfPath));

        if (!"flexcms/xf-folder".equals(xfFolder.getResourceType())) {
            throw new IllegalArgumentException("Node at " + xfPath + " is not an Experience Fragment folder");
        }

        String variationPath = xfPath + "." + slugify(variationType);
        if (nodeService.getByPath(variationPath).isPresent()) {
            throw new ConflictException("Variation '" + variationType + "' already exists on XF: " + xfPath);
        }

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("jcr:title",       title != null ? title : capitalize(variationType) + " Variation");
        props.put("variationType",   variationType);
        props.put("xfMasterVariation", "master".equalsIgnoreCase(variationType));

        ContentNode variation = nodeService.create(
                variationPath, variationType, "flexcms/xf-page",
                props, xfFolder.getSiteId(), xfFolder.getLocale(), userId);

        // Update XF metadata timestamp
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
     * Fast — queries the metadata table, not the full content tree.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listExperienceFragments(String siteId, String locale) {
        String sql = "SELECT xf_path, title, description, created_at, updated_at " +
                     "FROM experience_fragment_metadata " +
                     "WHERE site_id = ? AND locale = ? " +
                     "ORDER BY updated_at DESC";
        return jdbc.queryForList(sql, siteId, locale);
    }

    /**
     * Returns the XF folder node (without children — use {@link #getVariations} for children).
     */
    @Transactional(readOnly = true)
    public Optional<ContentNode> getExperienceFragment(String xfPath) {
        return nodeService.getByPath(xfPath)
                .filter(n -> "flexcms/xf-folder".equals(n.getResourceType()));
    }

    /**
     * Lists all variations (flexcms/xf-page children) of an XF.
     */
    @Transactional(readOnly = true)
    public List<ContentNode> listVariations(String xfPath) {
        return nodeService.getChildren(xfPath).stream()
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()))
                .toList();
    }

    /**
     * Returns a specific variation of an XF, including its component children.
     *
     * @param xfPath       path of the XF root folder
     * @param variationType variation name (e.g. "master")
     */
    @Transactional(readOnly = true)
    public Optional<ContentNode> getVariation(String xfPath, String variationType) {
        String variationPath = xfPath + "." + slugify(variationType);
        return nodeService.getWithChildren(variationPath)
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()));
    }

    /**
     * Returns the default variation of an XF: prefers "master"; falls back to first available.
     */
    @Transactional(readOnly = true)
    public Optional<ContentNode> getDefaultVariation(String xfPath) {
        // Try "master" first
        Optional<ContentNode> master = getVariation(xfPath, "master");
        if (master.isPresent()) return master;

        // Fall back to first variation found
        List<ContentNode> variations = listVariations(xfPath);
        if (variations.isEmpty()) return Optional.empty();

        String firstPath = variations.get(0).getPath();
        return nodeService.getWithChildren(firstPath);
    }

    /**
     * Resolves an XF reference by its full variation path (the value stored in
     * {@code fragmentPath} on a {@code flexcms/experience-fragment} component).
     *
     * <p>This is called by {@link com.flexcms.core.service.ContentDeliveryService}
     * during page rendering to embed XF content inline.
     *
     * @param fragmentPath full path of the variation node (flexcms/xf-page)
     * @return the variation node with its component children, or empty if not found
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
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTENT_AUTHOR')")
    public void deleteExperienceFragment(String xfPath, String userId) {
        nodeService.getByPath(xfPath)
                .filter(n -> "flexcms/xf-folder".equals(n.getResourceType()))
                .orElseThrow(() -> new NotFoundException("Experience Fragment not found: " + xfPath));

        // Delete entire subtree (XF folder + all variations + their children)
        nodeService.delete(xfPath, userId);

        // Remove from metadata table
        jdbc.update("DELETE FROM experience_fragment_metadata WHERE xf_path = ?", xfPath);

        log.info("Deleted Experience Fragment at {}", xfPath);
    }

    /**
     * Deletes a single variation of an XF.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTENT_AUTHOR')")
    public void deleteVariation(String xfPath, String variationType, String userId) {
        String variationPath = xfPath + "." + slugify(variationType);
        nodeService.getByPath(variationPath)
                .filter(n -> "flexcms/xf-page".equals(n.getResourceType()))
                .orElseThrow(() -> new NotFoundException(
                        "Variation '" + variationType + "' not found on XF: " + xfPath));

        nodeService.delete(variationPath, userId);

        jdbc.update("UPDATE experience_fragment_metadata SET updated_at = ? WHERE xf_path = ?",
                Instant.now(), xfPath);

        log.info("Deleted variation '{}' from Experience Fragment {}", variationType, xfPath);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private String buildCategoryPath(String siteId, String locale, String category) {
        if (category == null || category.isBlank()) {
            return XF_ROOT + "." + siteId + "." + locale;
        }
        return XF_ROOT + "." + siteId + "." + locale + "." + slugify(category);
    }

    /** Creates intermediate path nodes if they do not exist yet. */
    private void ensurePath(String path, String siteId, String locale, String userId) {
        String[] segments = path.split("\\.");
        StringBuilder current = new StringBuilder();
        for (String segment : segments) {
            if (!current.isEmpty()) current.append(".");
            current.append(segment);
            String p = current.toString();
            if (nodeService.getByPath(p).isEmpty()) {
                Map<String, Object> props = new LinkedHashMap<>();
                props.put("jcr:title", capitalize(segment));
                String parent = p.contains(".") ? p.substring(0, p.lastIndexOf('.')) : null;
                nodeService.create(p, segment, "flexcms/container", props, siteId, locale, userId);
            }
        }
    }

    private void persistMetadata(String xfPath, String siteId, String locale,
                                  String title, String description, String userId) {
        jdbc.update(
            "INSERT INTO experience_fragment_metadata (id, xf_path, site_id, locale, title, description, created_by) " +
            "VALUES (uuid_generate_v4(), ?, ?, ?, ?, ?, ?) " +
            "ON CONFLICT (xf_path) DO UPDATE SET title = EXCLUDED.title, " +
            "description = EXCLUDED.description, updated_at = NOW()",
            xfPath, siteId, locale, title, description, userId);
    }

    private static String slugify(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }

    private static String capitalize(String value) {
        if (value == null || value.isBlank()) return value;
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}

