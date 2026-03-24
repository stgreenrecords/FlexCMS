package com.flexcms.core.repository;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for {@link ContentNodeRepository} against a real PostgreSQL database.
 *
 * <p>These tests exercise the native SQL queries that use PostgreSQL-specific syntax
 * ({@code LIKE} path-prefix matching, {@code ILIKE} for text search) which cannot
 * be validated with H2.
 */
@DataJpaTest
@Testcontainers
@ActiveProfiles("integration")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ContentNodeRepositoryIT {

    @Container
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("flexcms_test")
                    .withUsername("flexcms")
                    .withPassword("flexcms");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private ContentNodeRepository nodeRepository;

    // ── Fixture helpers ───────────────────────────────────────────────────────

    private ContentNode node(String path, String name, String parentPath) {
        ContentNode n = new ContentNode(path, name, "flexcms/page");
        n.setParentPath(parentPath);
        n.setSiteId("corporate");
        n.setLocale("en");
        n.setStatus(NodeStatus.DRAFT);
        n.setOrderIndex(0);
        return n;
    }

    @BeforeEach
    void cleanUp() {
        nodeRepository.deleteAll();
    }

    // ── findByPath ─────────────────────────────────────────────────────────────

    @Test
    void findByPath_returnsNode() {
        nodeRepository.save(node("content.corporate.en.home", "home", "content.corporate.en"));

        Optional<ContentNode> found = nodeRepository.findByPath("content.corporate.en.home");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("home");
    }

    @Test
    void findByPath_missingPath_returnsEmpty() {
        assertThat(nodeRepository.findByPath("content.nonexistent")).isEmpty();
    }

    // ── findByParentPathOrderByOrderIndex ──────────────────────────────────────

    @Test
    void findByParentPath_orderedByIndex() {
        ContentNode first = node("content.home.hero", "hero", "content.home");
        first.setOrderIndex(0);
        ContentNode second = node("content.home.text", "text", "content.home");
        second.setOrderIndex(1);
        ContentNode third = node("content.home.image", "image", "content.home");
        third.setOrderIndex(2);

        nodeRepository.saveAll(List.of(third, first, second));  // save out-of-order

        List<ContentNode> children = nodeRepository.findByParentPathOrderByOrderIndex("content.home");

        assertThat(children).extracting(ContentNode::getName)
                .containsExactly("hero", "text", "image");
    }

    @Test
    void findByParentPath_noChildren_returnsEmpty() {
        assertThat(nodeRepository.findByParentPathOrderByOrderIndex("content.empty")).isEmpty();
    }

    // ── findDescendants ────────────────────────────────────────────────────────

    @Test
    void findDescendants_returnsAllNestedDescendants() {
        nodeRepository.save(node("content.site", "site", null));
        nodeRepository.save(node("content.site.en", "en", "content.site"));
        nodeRepository.save(node("content.site.en.home", "home", "content.site.en"));
        nodeRepository.save(node("content.site.en.about", "about", "content.site.en"));
        nodeRepository.save(node("content.site.en.home.hero", "hero", "content.site.en.home"));

        List<ContentNode> descendants = nodeRepository.findDescendants("content.site.en");

        assertThat(descendants).extracting(ContentNode::getPath)
                .containsExactlyInAnyOrder(
                        "content.site.en.home",
                        "content.site.en.about",
                        "content.site.en.home.hero");
    }

    @Test
    void findDescendants_noDescendants_returnsEmpty() {
        nodeRepository.save(node("content.leaf", "leaf", "content"));

        assertThat(nodeRepository.findDescendants("content.leaf")).isEmpty();
    }

    @Test
    void findDescendants_doesNotIncludeRootNode() {
        nodeRepository.save(node("content.root", "root", null));
        nodeRepository.save(node("content.root.child", "child", "content.root"));

        List<ContentNode> descendants = nodeRepository.findDescendants("content.root");

        assertThat(descendants).extracting(ContentNode::getPath)
                .containsExactly("content.root.child")
                .doesNotContain("content.root");
    }

    // ── findAncestors ──────────────────────────────────────────────────────────

    @Test
    void findAncestors_returnsAllAncestorsOrderedByDepth() {
        nodeRepository.save(node("content", "content", null));
        nodeRepository.save(node("content.site", "site", "content"));
        nodeRepository.save(node("content.site.en", "en", "content.site"));
        nodeRepository.save(node("content.site.en.home", "home", "content.site.en"));

        List<ContentNode> ancestors = nodeRepository.findAncestors("content.site.en.home");

        // Should include the node itself + all ancestors, shortest path first
        assertThat(ancestors).extracting(ContentNode::getPath)
                .containsExactly("content", "content.site", "content.site.en", "content.site.en.home");
    }

    // ── existsByPath ───────────────────────────────────────────────────────────

    @Test
    void existsByPath_existingPath_returnsTrue() {
        nodeRepository.save(node("content.home", "home", "content"));

        assertThat(nodeRepository.existsByPath("content.home")).isTrue();
    }

    @Test
    void existsByPath_missingPath_returnsFalse() {
        assertThat(nodeRepository.existsByPath("content.nonexistent")).isFalse();
    }

    // ── deleteSubtree ──────────────────────────────────────────────────────────

    @Test
    void deleteSubtree_removesNodeAndAllDescendants() {
        nodeRepository.save(node("content.site", "site", null));
        nodeRepository.save(node("content.site.en", "en", "content.site"));
        nodeRepository.save(node("content.site.en.home", "home", "content.site.en"));
        nodeRepository.save(node("content.other", "other", null));  // should NOT be deleted

        nodeRepository.deleteSubtree("content.site");

        assertThat(nodeRepository.findByPath("content.site")).isEmpty();
        assertThat(nodeRepository.findByPath("content.site.en")).isEmpty();
        assertThat(nodeRepository.findByPath("content.site.en.home")).isEmpty();
        assertThat(nodeRepository.findByPath("content.other")).isPresent();  // preserved
    }

    // ── searchContent ──────────────────────────────────────────────────────────

    @Test
    void searchContent_matchesOnName() {
        ContentNode home = node("content.site.en.homepage", "homepage", "content.site.en");
        ContentNode about = node("content.site.en.aboutus", "aboutus", "content.site.en");
        nodeRepository.saveAll(List.of(home, about));

        var results = nodeRepository.searchContent("corporate", "en", "homepage",
                PageRequest.of(0, 10));

        assertThat(results.getContent()).extracting(ContentNode::getName)
                .containsExactly("homepage");
    }

    @Test
    void searchContent_caseInsensitive() {
        ContentNode node = node("content.site.en.homepage", "Homepage", "content.site.en");
        nodeRepository.save(node);

        var results = nodeRepository.searchContent("corporate", "en", "HOMEPAGE",
                PageRequest.of(0, 10));

        assertThat(results.getTotalElements()).isEqualTo(1);
    }

    @Test
    void searchContent_noMatch_returnsEmpty() {
        nodeRepository.save(node("content.site.en.home", "home", "content.site.en"));

        var results = nodeRepository.searchContent("corporate", "en", "zzz-no-match",
                PageRequest.of(0, 10));

        assertThat(results.getTotalElements()).isZero();
    }

    // ── findBySiteIdAndStatus ──────────────────────────────────────────────────

    @Test
    void findBySiteIdAndStatus_filtersCorrectly() {
        ContentNode published = node("content.home", "home", "content");
        published.setStatus(NodeStatus.PUBLISHED);
        ContentNode draft = node("content.about", "about", "content");
        draft.setStatus(NodeStatus.DRAFT);
        nodeRepository.saveAll(List.of(published, draft));

        var page = nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED,
                PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1)
                .extracting(ContentNode::getStatus)
                .containsOnly(NodeStatus.PUBLISHED);
    }
}
