package com.flexcms.pim.repository;

import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.model.ProductStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for {@link ProductRepository} against a real PostgreSQL database.
 *
 * <p>These tests exercise PostgreSQL-specific features (JSONB attributes, LIKE queries)
 * that cannot be validated with H2. The PIM Flyway migrations run automatically,
 * creating the schema before the tests execute.</p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Testcontainers
@ActiveProfiles("integration")
class ProductRepositoryIT {

    @Container
    @SuppressWarnings("resource") // lifecycle managed by @Testcontainers + @Container
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("flexcms_pim_test")
                    .withUsername("flexcms")
                    .withPassword("flexcms");

    @DynamicPropertySource
    static void configurePimDataSource(DynamicPropertyRegistry registry) {
        registry.add("flexcms.pim.datasource.url",      postgres::getJdbcUrl);
        registry.add("flexcms.pim.datasource.username", postgres::getUsername);
        registry.add("flexcms.pim.datasource.password", postgres::getPassword);
    }

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CatalogRepository catalogRepository;

    @Autowired
    private ProductSchemaRepository schemaRepository;

    private Catalog testCatalog;
    private ProductSchema testSchema;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        catalogRepository.deleteAll();
        schemaRepository.deleteAll();

        testSchema = new ProductSchema();
        testSchema.setName("test-schema");
        testSchema.setVersion("2026");
        testSchema.setSchemaDef(Map.of("type", "object", "properties", Map.of()));
        testSchema = schemaRepository.save(testSchema);

        testCatalog = new Catalog();
        testCatalog.setName("Test Catalog 2026");
        testCatalog.setYear(2026);
        testCatalog.setSeason("SS");
        testCatalog.setSchema(testSchema);
        testCatalog = catalogRepository.save(testCatalog);
    }

    // ── Fixture ───────────────────────────────────────────────────────────────

    private Product product(String sku, String name) {
        Product p = new Product();
        p.setSku(sku);
        p.setName(name);
        p.setCatalog(testCatalog);
        p.setSchema(testSchema);
        p.setAttributes(new HashMap<>(Map.of("color", "red", "size", "M")));
        p.setStatus(ProductStatus.DRAFT);
        return p;
    }

    // ── findBySku ─────────────────────────────────────────────────────────────

    @Test
    void findBySku_returnsProduct_whenExists() {
        productRepository.save(product("SKU-001", "Alpine Jacket"));

        Optional<Product> found = productRepository.findBySku("SKU-001");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Alpine Jacket");
        assertThat(found.get().getSku()).isEqualTo("SKU-001");
    }

    @Test
    void findBySku_returnsEmpty_whenMissing() {
        assertThat(productRepository.findBySku("NONEXISTENT")).isEmpty();
    }

    // ── existsBySku ───────────────────────────────────────────────────────────

    @Test
    void existsBySku_returnsTrue_whenExists() {
        productRepository.save(product("SKU-002", "Trail Shorts"));

        assertThat(productRepository.existsBySku("SKU-002")).isTrue();
    }

    @Test
    void existsBySku_returnsFalse_whenMissing() {
        assertThat(productRepository.existsBySku("NONEXISTENT")).isFalse();
    }

    // ── findByCatalogId ───────────────────────────────────────────────────────

    @Test
    void findByCatalogId_returnsPagedProducts_forCatalog() {
        productRepository.save(product("SKU-010", "Jacket A"));
        productRepository.save(product("SKU-011", "Jacket B"));
        productRepository.save(product("SKU-012", "Jacket C"));

        Page<Product> page = productRepository.findByCatalogId(
                testCatalog.getId(), PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getContent())
                .extracting(Product::getSku)
                .containsExactlyInAnyOrder("SKU-010", "SKU-011", "SKU-012");
    }

    @Test
    void findByCatalogId_respectsPagination() {
        for (int i = 1; i <= 5; i++) {
            productRepository.save(product("PAGED-" + i, "Product " + i));
        }

        Page<Product> firstPage  = productRepository.findByCatalogId(testCatalog.getId(), PageRequest.of(0, 2));
        Page<Product> secondPage = productRepository.findByCatalogId(testCatalog.getId(), PageRequest.of(1, 2));

        assertThat(firstPage.getTotalElements()).isEqualTo(5);
        assertThat(firstPage.getContent()).hasSize(2);
        assertThat(secondPage.getContent()).hasSize(2);
        assertThat(firstPage.hasNext()).isTrue();
    }

    @Test
    void findByCatalogId_returnsEmpty_whenNoCatalogProducts() {
        Catalog otherCatalog = new Catalog();
        otherCatalog.setName("Other 2025");
        otherCatalog.setYear(2025);
        otherCatalog.setSchema(testSchema);
        otherCatalog = catalogRepository.save(otherCatalog);

        // Save a product in testCatalog, not otherCatalog
        productRepository.save(product("SKU-020", "Jacket"));

        Page<Product> page = productRepository.findByCatalogId(otherCatalog.getId(), PageRequest.of(0, 10));
        assertThat(page.getTotalElements()).isZero();
    }

    // ── findByCatalogIdAndStatus ───────────────────────────────────────────────

    @Test
    void findByCatalogIdAndStatus_filtersCorrectly() {
        Product draft = product("STATUS-001", "Draft Item");
        draft.setStatus(ProductStatus.DRAFT);
        productRepository.save(draft);

        Product published = product("STATUS-002", "Published Item");
        published.setStatus(ProductStatus.PUBLISHED);
        productRepository.save(published);

        Page<Product> publishedPage = productRepository.findByCatalogIdAndStatus(
                testCatalog.getId(), ProductStatus.PUBLISHED, PageRequest.of(0, 10));

        assertThat(publishedPage.getTotalElements()).isEqualTo(1);
        assertThat(publishedPage.getContent().get(0).getSku()).isEqualTo("STATUS-002");
    }

    @Test
    void findByCatalogIdAndStatus_returnsEmpty_whenNoMatch() {
        productRepository.save(product("STATUS-010", "Draft Only"));

        Page<Product> archived = productRepository.findByCatalogIdAndStatus(
                testCatalog.getId(), ProductStatus.ARCHIVED, PageRequest.of(0, 10));

        assertThat(archived.getTotalElements()).isZero();
    }

    // ── searchGlobal ──────────────────────────────────────────────────────────

    @Test
    void searchGlobal_matchesBySku() {
        productRepository.save(product("UNIQUE-SKU-999", "Regular Name"));
        productRepository.save(product("OTHER-001", "Other Product"));

        Page<Product> results = productRepository.searchGlobal("UNIQUE-SKU", PageRequest.of(0, 10));

        assertThat(results.getTotalElements()).isEqualTo(1);
        assertThat(results.getContent().get(0).getSku()).isEqualTo("UNIQUE-SKU-999");
    }

    @Test
    void searchGlobal_matchesByName_caseInsensitive() {
        productRepository.save(product("SKU-ALPINE", "Alpine Hardshell Jacket"));
        productRepository.save(product("SKU-TRAIL",  "Trail Running Shorts"));

        Page<Product> results = productRepository.searchGlobal("alpine", PageRequest.of(0, 10));

        assertThat(results.getTotalElements()).isEqualTo(1);
        assertThat(results.getContent().get(0).getSku()).isEqualTo("SKU-ALPINE");
    }

    @Test
    void searchGlobal_noMatch_returnsEmpty() {
        productRepository.save(product("SKU-ANY", "Any Product"));

        Page<Product> results = productRepository.searchGlobal("xzxzxz-no-match", PageRequest.of(0, 10));

        assertThat(results.getTotalElements()).isZero();
    }

    // ── JSONB attributes ──────────────────────────────────────────────────────

    @Test
    void save_andReload_preservesJsonbAttributes() {
        Product p = product("JSONB-001", "Attribute Test");
        p.setAttributes(new HashMap<>(Map.of(
                "color",       "midnight-blue",
                "size",        "L",
                "weight_grams", 350,
                "waterproof",  true
        )));
        productRepository.save(p);

        Product loaded = productRepository.findBySku("JSONB-001").orElseThrow();

        assertThat(loaded.getAttributes())
                .containsEntry("color", "midnight-blue")
                .containsEntry("size", "L")
                .containsEntry("weight_grams", 350)
                .containsEntry("waterproof", true);
    }
}
