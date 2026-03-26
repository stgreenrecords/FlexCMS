package com.flexcms.pim.controller;

import com.flexcms.pim.importer.ImportConfig;
import com.flexcms.pim.importer.ImportResult;
import com.flexcms.pim.service.ImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * PIM Import REST API.
 *
 * <p>Provides two capabilities:
 * <ol>
 *   <li><b>Schema inference</b> — upload a sample file and get back a draft JSON Schema
 *       describing its fields (useful for wiring up the import wizard field-mapping step).</li>
 *   <li><b>Product import</b> — upload a full file to create/update products in a catalog.</li>
 * </ol>
 */
@Tag(name = "PIM Import", description = "Upload files to import products or infer schema")
@RestController
@RequestMapping("/api/pim/v1/imports")
public class ImportApiController {

    @Autowired
    private ImportService importService;

    // =========================================================================
    // Schema inference
    // =========================================================================

    /**
     * Infer a draft JSON Schema from an uploaded sample file.
     *
     * <p>Sends back the column/field names and their inferred types so the UI
     * can pre-populate the field-mapping step of the import wizard.
     *
     * <p>Example:
     * <pre>POST /api/pim/v1/imports/infer-schema?sourceType=CSV
     * Content-Type: multipart/form-data
     * file = products_sample.csv
     * </pre>
     */
    @Operation(
        summary = "Infer JSON Schema from a sample import file",
        description = "Upload a CSV, Excel, or JSON file and receive a draft JSON Schema " +
                      "describing the detected fields. Use the result to pre-populate the " +
                      "field-mapping step in the import wizard."
    )
    @PostMapping(value = "/infer-schema", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> inferSchema(
            @Parameter(description = "Sample file (CSV, .xlsx, or JSON)")
            @RequestPart("file") MultipartFile file,
            @Parameter(description = "Source format: CSV | EXCEL | JSON")
            @RequestParam @NotBlank String sourceType) throws IOException {

        Map<String, Object> schema = importService.inferSchema(file.getInputStream(), sourceType);
        if (schema.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "message", "Source type '" + sourceType + "' does not support schema inference",
                    "properties", Map.of()
            ));
        }
        return ResponseEntity.ok(schema);
    }

    // =========================================================================
    // Product import
    // =========================================================================

    /**
     * Import products from an uploaded file using an explicit configuration.
     *
     * <p>Example:
     * <pre>POST /api/pim/v1/imports?catalogId=...&amp;sourceType=CSV&amp;userId=admin
     * Content-Type: multipart/form-data
     * file = products.csv
     * </pre>
     */
    @Operation(
        summary = "Import products from a file",
        description = "Upload a CSV, Excel, or JSON file to create or update products in the " +
                      "specified catalog. Optional query params configure field mapping."
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportResult> importProducts(
            @Parameter(description = "Upload file (CSV, .xlsx, or JSON)")
            @RequestPart("file") MultipartFile file,
            @Parameter(description = "Target catalog ID")
            @RequestParam UUID catalogId,
            @Parameter(description = "Source format: CSV | EXCEL | JSON")
            @RequestParam @NotBlank String sourceType,
            @Parameter(description = "User performing the import")
            @RequestParam(defaultValue = "system") String userId,
            @Parameter(description = "Field that maps to SKU (default: sku)")
            @RequestParam(defaultValue = "sku") String skuField,
            @Parameter(description = "Field that maps to product name (default: name)")
            @RequestParam(defaultValue = "name") String nameField,
            @Parameter(description = "Update existing products if SKU matches (default: true)")
            @RequestParam(defaultValue = "true") boolean updateExisting) throws IOException {

        ImportConfig config = new ImportConfig();
        config.setCatalogId(catalogId);
        config.setSourceType(sourceType);
        config.setSkuField(skuField);
        config.setNameField(nameField);
        config.setUpdateExisting(updateExisting);
        config.setUserId(userId);

        ImportResult result = importService.importProducts(file.getInputStream(), config);
        return ResponseEntity.ok(result);
    }

    /**
     * Import products using a saved field-mapping profile.
     */
    @Operation(
        summary = "Import products using a saved mapping profile",
        description = "Upload a file and apply a previously saved field-mapping profile " +
                      "to create or update products."
    )
    @PostMapping(value = "/with-profile/{profileId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportResult> importWithProfile(
            @Parameter(description = "Upload file")
            @RequestPart("file") MultipartFile file,
            @PathVariable UUID profileId,
            @RequestParam(defaultValue = "system") String userId) throws IOException {

        ImportResult result = importService.importFromProfile(
                file.getInputStream(), profileId, userId);
        return ResponseEntity.ok(result);
    }
}
