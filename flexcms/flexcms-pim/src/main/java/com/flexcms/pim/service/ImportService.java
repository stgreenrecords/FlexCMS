package com.flexcms.pim.service;

import com.flexcms.pim.importer.ImportConfig;
import com.flexcms.pim.importer.ImportResult;
import com.flexcms.pim.importer.ProductImportSource;
import com.flexcms.pim.model.FieldMappingProfile;
import com.flexcms.pim.repository.FieldMappingProfileRepository;
import com.flexcms.pim.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates product imports from any registered {@link ProductImportSource}.
 *
 * <h3>Import pipeline</h3>
 * <ol>
 *   <li>Resolve the correct {@link ProductImportSource} by {@code sourceType}</li>
 *   <li>Parse the input stream into raw records (flat key → value maps)</li>
 *   <li>Apply field mappings — rename source keys to schema attribute names</li>
 *   <li>Apply defaults — fill in missing attributes with configured defaults</li>
 *   <li>Apply transforms — modify attribute values (trim, case, prefix/suffix)</li>
 *   <li>Extract {@code sku} and {@code name} from the record</li>
 *   <li>Create or update product via {@link ProductService}</li>
 * </ol>
 *
 * <h3>Field mapping profile</h3>
 * Profiles can be loaded from the database by ID using
 * {@link #importFromProfile(InputStream, UUID, String)} so teams can save and
 * reuse mappings across imports.
 *
 * <h3>Supported transforms</h3>
 * <ul>
 *   <li>{@code trim} — strip leading/trailing whitespace</li>
 *   <li>{@code uppercase} — convert to upper case</li>
 *   <li>{@code lowercase} — convert to lower case</li>
 *   <li>{@code prefix:<value>} — prepend a fixed string</li>
 *   <li>{@code suffix:<value>} — append a fixed string</li>
 * </ul>
 */
@Service
public class ImportService {

    private static final Logger log = LoggerFactory.getLogger(ImportService.class);

    @Autowired
    private List<ProductImportSource> importSources;

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private FieldMappingProfileRepository profileRepository;

    /**
     * Run an import using an explicit {@link ImportConfig}.
     */
    @Transactional("pimTransactionManager")
    public ImportResult importProducts(InputStream input, ImportConfig config) {
        ProductImportSource source = resolveSource(config.getSourceType());
        ImportResult result = new ImportResult();

        try (var stream = source.parse(input, config)) {
            stream.forEach(record -> processRecord(record, config, result));
        }

        log.info("Import complete: created={}, updated={}, skipped={}, failed={}",
                result.getCreated(), result.getUpdated(), result.getSkipped(), result.getFailed());
        return result;
    }

    /**
     * Run an import using a saved {@link FieldMappingProfile}.
     */
    @Transactional("pimTransactionManager")
    public ImportResult importFromProfile(InputStream input, UUID profileId, String userId) {
        FieldMappingProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Mapping profile not found: " + profileId));

        ImportConfig config = profileToConfig(profile, userId);
        return importProducts(input, config);
    }

    /**
     * Infer a draft JSON Schema from a sample of the input stream.
     *
     * <p>Delegates to {@link ProductImportSource#inferSchema} for the resolved source type.
     * Returns an empty map if the source does not support schema inference.
     *
     * @param input      input stream containing sample data (file upload, etc.)
     * @param sourceType one of: CSV, EXCEL, JSON
     * @return draft JSON Schema (draft-07) as a map, or empty map if inference not supported
     */
    public Map<String, Object> inferSchema(InputStream input, String sourceType) {
        ProductImportSource source = resolveSource(sourceType);
        ImportConfig config = new ImportConfig();
        config.setSourceType(sourceType);
        Map<String, Object> schema = source.inferSchema(input, config);
        log.info("Schema inferred from source type '{}': {} properties detected",
                sourceType, countSchemaProperties(schema));
        return schema;
    }

    private int countSchemaProperties(Map<String, Object> schema) {
        if (schema == null || schema.isEmpty()) return 0;
        Object props = schema.get("properties");
        return (props instanceof Map<?, ?> m) ? m.size() : 0;
    }

    /**
     * Save a new field mapping profile.
     */
    @Transactional("pimTransactionManager")
    public FieldMappingProfile saveProfile(FieldMappingProfile profile) {
        return profileRepository.save(profile);
    }

    /**
     * List all field mapping profiles for a catalog.
     */
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<FieldMappingProfile> listProfiles(UUID catalogId) {
        return profileRepository.findByCatalogId(catalogId);
    }

    /**
     * Get a single profile by ID.
     */
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Optional<FieldMappingProfile> getProfile(UUID profileId) {
        return profileRepository.findById(profileId);
    }

    /**
     * Delete a profile.
     */
    @Transactional("pimTransactionManager")
    public void deleteProfile(UUID profileId) {
        profileRepository.deleteById(profileId);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void processRecord(Map<String, Object> rawRecord, ImportConfig config, ImportResult result) {
        try {
            // 1. Apply field mappings
            Map<String, Object> mapped = applyMappings(rawRecord, config.getFieldMappings());

            // 2. Apply defaults
            if (config.getDefaults() != null) {
                config.getDefaults().forEach((attr, defaultVal) ->
                        mapped.putIfAbsent(attr, defaultVal));
            }

            // 3. Apply transforms
            if (config.getTransforms() != null) {
                config.getTransforms().forEach((attr, transform) -> {
                    if (mapped.containsKey(attr)) {
                        mapped.put(attr, applyTransform(mapped.get(attr), transform));
                    }
                });
            }

            // 4. Extract SKU and name
            String skuKey = config.getSkuField() != null ? config.getSkuField() : "sku";
            String nameKey = config.getNameField() != null ? config.getNameField() : "name";

            Object skuVal = mapped.remove(skuKey);
            Object nameVal = mapped.remove(nameKey);

            if (skuVal == null || skuVal.toString().isBlank()) {
                result.incrementFailed();
                result.addError("Record missing SKU field '" + skuKey + "': " + rawRecord);
                return;
            }
            if (nameVal == null || nameVal.toString().isBlank()) {
                result.incrementFailed();
                result.addError("Record missing name field '" + nameKey + "' for SKU " + skuVal);
                return;
            }

            String sku = skuVal.toString().trim();
            String name = nameVal.toString().trim();
            String userId = config.getUserId();

            // 5. Create or update
            boolean exists = productRepository.existsBySku(sku);
            if (exists) {
                if (!config.isUpdateExisting()) {
                    result.incrementSkipped();
                    return;
                }
                productService.update(sku, mapped, userId);
                result.incrementUpdated();
            } else {
                productService.create(sku, name, config.getCatalogId(), mapped, userId);
                result.incrementCreated();
            }

        } catch (Exception e) {
            result.incrementFailed();
            result.addError("Failed to process record " + rawRecord + ": " + e.getMessage());
            log.warn("Import record failed: {}", e.getMessage());
        }
    }

    private Map<String, Object> applyMappings(Map<String, Object> record, Map<String, String> mappings) {
        if (mappings == null || mappings.isEmpty()) {
            return new LinkedHashMap<>(record);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        record.forEach((sourceKey, value) -> {
            String targetKey = mappings.getOrDefault(sourceKey, sourceKey);
            result.put(targetKey, value);
        });
        return result;
    }

    private Object applyTransform(Object value, String transform) {
        if (value == null || transform == null) return value;
        String str = value.toString();
        return switch (transform.toLowerCase()) {
            case "trim"      -> str.trim();
            case "uppercase" -> str.toUpperCase();
            case "lowercase" -> str.toLowerCase();
            default -> {
                if (transform.startsWith("prefix:")) yield transform.substring(7) + str;
                if (transform.startsWith("suffix:")) yield str + transform.substring(7);
                yield value; // unknown transform — pass through
            }
        };
    }

    private ProductImportSource resolveSource(String sourceType) {
        if (sourceType == null) throw new IllegalArgumentException("sourceType is required");
        return importSources.stream()
                .filter(s -> s.getSourceType().equalsIgnoreCase(sourceType))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No import source registered for type '" + sourceType + "'. Available: "
                        + importSources.stream().map(ProductImportSource::getSourceType)
                                .collect(Collectors.joining(", "))));
    }

    @SuppressWarnings("unchecked")
    private ImportConfig profileToConfig(FieldMappingProfile profile, String userId) {
        ImportConfig config = new ImportConfig();
        config.setCatalogId(profile.getCatalogId());
        config.setSourceType(profile.getSourceType());
        config.setSkuField(profile.getSkuField());
        config.setNameField(profile.getNameField());
        config.setUpdateExisting(profile.isUpdateExisting());
        config.setUserId(userId);

        // Cast JSONB maps (stored as Map<String,Object>) to Map<String,String>
        config.setFieldMappings(castToStringMap(profile.getFieldMappings()));
        config.setDefaults(castToStringMap(profile.getDefaults()));
        config.setTransforms(castToStringMap(profile.getTransforms()));
        return config;
    }

    private Map<String, String> castToStringMap(Map<String, Object> source) {
        if (source == null || source.isEmpty()) return Map.of();
        Map<String, String> result = new LinkedHashMap<>();
        source.forEach((k, v) -> result.put(k, v != null ? v.toString() : null));
        return result;
    }
}
