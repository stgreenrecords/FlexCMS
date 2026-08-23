package com.flexcms.author.service;

import com.flexcms.core.util.PathUtils;
import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.service.ContentNodeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExperienceFragmentServiceTest {

    @Mock private ContentNodeRepository nodeRepository;
    @Mock private ContentNodeService nodeService;
    @Mock private JdbcTemplate jdbc;

    @InjectMocks
    private ExperienceFragmentService xfService;

    // ── Helpers ────────────────────────────────────────────────────────────────

    private ContentNode xfFolder(String path) {
        ContentNode n = new ContentNode(path, path.substring(path.lastIndexOf('.') + 1), "flexcms/xf-folder");
        n.setSiteId("demo-site");
        n.setLocale("en");
        return n;
    }

    private ContentNode xfPage(String path) {
        ContentNode n = new ContentNode(path, path.substring(path.lastIndexOf('.') + 1), "flexcms/xf-page");
        n.setSiteId("demo-site");
        n.setLocale("en");
        return n;
    }

    // ── createExperienceFragment ────────────────────────────────────────────

    @Test
    void createExperienceFragment_savesXfFolderAndMetadata() {
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        ContentNode result = xfService.createExperienceFragment(
                "demo-site", "en", "site", "header", "Site Header", "Global header", "admin");

        assertThat(result.getResourceType()).isEqualTo("flexcms/xf-folder");
        assertThat(result.getSiteId()).isEqualTo("demo-site");
        assertThat(result.getLocale()).isEqualTo("en");
        verify(nodeRepository, atLeastOnce()).save(any(ContentNode.class));
    }

    /**
     * The created path must sit under {@code content.}, because that is where every
     * other operation looks.
     *
     * <p>This was previously only a comment in the test above, and the value it
     * described was wrong: fragments were written to a second tree at the database
     * root while the controller, {@code getExperienceFragment} and
     * {@code deleteExperienceFragment} all normalise onto {@code content.}. Create
     * reported success and the fragment was then unreachable — 404 on read, 404 on
     * delete, invisible from the content tree.</p>
     */
    @Test
    void createExperienceFragment_rootsThePathUnderContent() {
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        ContentNode result = xfService.createExperienceFragment(
                "demo-site", "en", "site", "header", "Site Header", "Global header", "admin");

        assertThat(result.getPath())
                .isEqualTo("content.experience-fragments.demo-site.en.site.header");
    }

    /**
     * The path create writes to must be the path read and delete resolve, or the API
     * cannot address what it just made. Both of those go through
     * {@code PathUtils.toContentPath}, which prefixes {@code content.} when it is
     * absent — so an already-rooted path has to survive it unchanged.
     */
    @Test
    void createExperienceFragment_pathSurvivesContentPathNormalisation() {
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        ContentNode result = xfService.createExperienceFragment(
                "demo-site", "en", "site", "header", "Site Header", "Global header", "admin");

        assertThat(PathUtils.toContentPath(result.getPath()))
                .as("a created fragment must be addressable by the API that created it")
                .isEqualTo(result.getPath());
    }

    @Test
    void createExperienceFragment_ancestorsAreRootedUnderContentToo() {
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        xfService.createExperienceFragment(
                "demo-site", "en", "site", "header", "Site Header", "Global header", "admin");

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository, atLeastOnce()).save(captor.capture());

        // Every node the create touched — containers included — belongs in the content
        // tree. A stray ancestor is how the orphaned parallel tree came about.
        // The tree root itself is the bare "content", so it is matched separately
        // rather than by prefix.
        assertThat(captor.getAllValues())
                .allSatisfy(node -> assertThat(node.getPath())
                        .matches(p -> p.equals("content") || p.startsWith("content."),
                                "rooted at or under content"));
    }

    @Test
    void createExperienceFragment_throwsConflictWhenPathAlreadyExists() {
        when(nodeRepository.existsByPath(contains("header"))).thenReturn(true);

        assertThatThrownBy(() ->
                xfService.createExperienceFragment("demo-site", "en", "site", "header",
                        "Site Header", "Global header", "admin"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void createExperienceFragment_noCategoryProducesShortPath() {
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        ContentNode result = xfService.createExperienceFragment(
                "demo-site", "en", null, "footer", "Footer", null, "admin");

        // path should not contain a category segment
        assertThat(result.getPath()).doesNotContain("null");
    }

    // ── metadata timestamp binding ──────────────────────────────────────────

    /**
     * The {@code updated_at} bump must not bind a Java temporal value.
     *
     * <p>Both variation operations used to pass {@code Instant.now()} as a statement
     * parameter. The driver cannot infer a SQL type for it, so every add and every
     * delete failed with a 500 — which a mocked {@code JdbcTemplate} happily accepts,
     * which is why the unit tests never noticed. Asserting the call shape catches it:
     * the timestamp belongs in the SQL, as {@code NOW()}, not in the arguments.</p>
     */
    @Test
    void addVariation_doesNotBindATemporalParameter() {
        String xfPath = "content.experience-fragments.demo-site.en.site.header";
        when(nodeRepository.findByPath(xfPath)).thenReturn(Optional.of(xfFolder(xfPath)));
        when(nodeRepository.existsByPath(anyString())).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        xfService.addVariation(xfPath, "mobile", "Mobile", "admin");

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object> args = ArgumentCaptor.forClass(Object.class);
        verify(jdbc).update(sql.capture(), args.capture());

        assertThat(sql.getValue()).contains("NOW()");
        assertThat(args.getAllValues())
                .as("a temporal value bound as a parameter is what the driver rejects")
                .noneMatch(a -> a instanceof java.time.temporal.Temporal);
    }

    @Test
    void deleteVariation_doesNotBindATemporalParameter() {
        String xfPath = "content.experience-fragments.demo-site.en.site.header";
        String varPath = xfPath + ".mobile";
        when(nodeRepository.findByPath(varPath)).thenReturn(Optional.of(xfPage(varPath)));

        xfService.deleteVariation(xfPath, "mobile", "admin");

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object> args = ArgumentCaptor.forClass(Object.class);
        verify(jdbc).update(sql.capture(), args.capture());

        assertThat(sql.getValue()).contains("NOW()");
        assertThat(args.getAllValues())
                .noneMatch(a -> a instanceof java.time.temporal.Temporal);
    }

    // ── addVariation ────────────────────────────────────────────────────────

    @Test
    void addVariation_createsXfPageUnderFolder() {
        String xfPath = "experience-fragments.demo-site.en.site.header";
        ContentNode folder = xfFolder(xfPath);
        when(nodeRepository.findByPath(xfPath)).thenReturn(Optional.of(folder));
        when(nodeRepository.existsByPath(xfPath + ".master")).thenReturn(false);
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        ContentNode variation = xfService.addVariation(xfPath, "master", "Master Variation", "admin");

        assertThat(variation.getResourceType()).isEqualTo("flexcms/xf-page");
        assertThat(variation.getPath()).isEqualTo(xfPath + ".master");
    }

    @Test
    void addVariation_throwsConflictWhenVariationAlreadyExists() {
        String xfPath = "experience-fragments.demo-site.en.site.header";
        when(nodeRepository.findByPath(xfPath)).thenReturn(Optional.of(xfFolder(xfPath)));
        when(nodeRepository.existsByPath(xfPath + ".master")).thenReturn(true);

        assertThatThrownBy(() -> xfService.addVariation(xfPath, "master", "Master", "admin"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void addVariation_throwsNotFoundForMissingXfFolder() {
        when(nodeRepository.findByPath(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                xfService.addVariation("experience-fragments.demo-site.en.site.missing",
                        "master", "Master", "admin"))
                .isInstanceOf(NotFoundException.class);
    }

    // ── read operations ────────────────────────────────────────────────────

    @Test
    void listExperienceFragments_returnsRowsFromJdbc() {
        List<Map<String, Object>> rows = List.of(
                Map.of("xf_path", "experience-fragments.demo-site.en.site.header", "title", "Header"),
                Map.of("xf_path", "experience-fragments.demo-site.en.site.footer", "title", "Footer")
        );
        when(jdbc.queryForList(anyString(), eq("demo-site"), eq("en"))).thenReturn(rows);

        List<Map<String, Object>> result = xfService.listExperienceFragments("demo-site", "en");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).get("title")).isEqualTo("Header");
    }

    @Test
    void getExperienceFragment_returnsNodeWhenResourceTypeMatches() {
        String path = "experience-fragments.demo-site.en.site.header";
        when(nodeRepository.findByPath(path)).thenReturn(Optional.of(xfFolder(path)));

        Optional<ContentNode> result = xfService.getExperienceFragment(path);

        assertThat(result).isPresent();
        assertThat(result.get().getResourceType()).isEqualTo("flexcms/xf-folder");
    }

    @Test
    void getExperienceFragment_returnsEmptyForWrongResourceType() {
        String path = "experience-fragments.demo-site.en.site.header";
        ContentNode notAFolder = new ContentNode(path, "header", "flexcms/page");
        when(nodeRepository.findByPath(path)).thenReturn(Optional.of(notAFolder));

        Optional<ContentNode> result = xfService.getExperienceFragment(path);

        assertThat(result).isEmpty();
    }

    @Test
    void listVariations_returnsOnlyXfPageChildren() {
        String xfPath = "experience-fragments.demo-site.en.site.header";
        ContentNode masterPage = xfPage(xfPath + ".master");
        ContentNode mobilePage = xfPage(xfPath + ".mobile");
        ContentNode container  = new ContentNode(xfPath + ".meta", "meta", "flexcms/container");

        when(nodeService.getChildren(xfPath))
                .thenReturn(List.of(masterPage, mobilePage, container));

        List<ContentNode> variations = xfService.listVariations(xfPath);

        assertThat(variations).hasSize(2)
                .extracting(ContentNode::getResourceType)
                .containsOnly("flexcms/xf-page");
    }

    @Test
    void getVariation_returnsVariationByType() {
        String xfPath = "experience-fragments.demo-site.en.site.header";
        ContentNode master = xfPage(xfPath + ".master");
        when(nodeRepository.findByPath(xfPath + ".master")).thenReturn(Optional.of(master));

        Optional<ContentNode> result = xfService.getVariation(xfPath, "master");

        assertThat(result).isPresent();
    }

    @Test
    void getDefaultVariation_prefersMasterVariation() {
        String xfPath = "experience-fragments.demo-site.en.site.header";
        ContentNode master = xfPage(xfPath + ".master");
        when(nodeRepository.findByPath(xfPath + ".master")).thenReturn(Optional.of(master));

        Optional<ContentNode> result = xfService.getDefaultVariation(xfPath);

        assertThat(result).isPresent();
        assertThat(result.get().getPath()).contains("master");
    }

    @Test
    void getDefaultVariation_fallsBackToFirstVariationIfNoMaster() {
        String xfPath = "experience-fragments.demo-site.en.site.header";
        ContentNode email = xfPage(xfPath + ".email");
        when(nodeRepository.findByPath(xfPath + ".master")).thenReturn(Optional.empty());
        when(nodeService.getChildren(xfPath)).thenReturn(List.of(email));

        Optional<ContentNode> result = xfService.getDefaultVariation(xfPath);

        assertThat(result).isPresent();
        assertThat(result.get().getPath()).contains("email");
    }

    // ── resolveReference ───────────────────────────────────────────────────

    @Test
    void resolveReference_returnsVariationWithChildren() {
        String varPath = "experience-fragments.demo-site.en.site.header.master";
        ContentNode loaded = xfPage(varPath);
        when(nodeService.getWithChildren(varPath)).thenReturn(Optional.of(loaded));

        Optional<ContentNode> result = xfService.resolveReference(varPath);

        assertThat(result).isPresent();
    }

    @Test
    void resolveReference_returnsEmptyForNonXfPage() {
        String path = "experience-fragments.demo-site.en.site.header.master";
        ContentNode wrongType = new ContentNode(path, "master", "flexcms/page");
        when(nodeService.getWithChildren(path)).thenReturn(Optional.of(wrongType));

        Optional<ContentNode> result = xfService.resolveReference(path);

        assertThat(result).isEmpty();
    }

    // ── delete operations ──────────────────────────────────────────────────

    @Test
    void deleteExperienceFragment_deletesSubtreeAndMetadata() {
        String path = "experience-fragments.demo-site.en.site.header";
        when(nodeRepository.findByPath(path)).thenReturn(Optional.of(xfFolder(path)));

        xfService.deleteExperienceFragment(path, "admin");

        verify(nodeRepository).deleteSubtree(path);
        verify(jdbc).update(contains("DELETE FROM experience_fragment_metadata"), eq(path));
    }

    @Test
    void deleteExperienceFragment_throwsNotFoundForMissingPath() {
        when(nodeRepository.findByPath(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                xfService.deleteExperienceFragment("experience-fragments.demo-site.en.site.missing", "admin"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void deleteVariation_deletesSubtreeAndUpdatesTimestamp() {
        String xfPath = "experience-fragments.demo-site.en.site.header";
        String varPath = xfPath + ".mobile";
        when(nodeRepository.findByPath(varPath)).thenReturn(Optional.of(xfPage(varPath)));

        xfService.deleteVariation(xfPath, "mobile", "admin");

        verify(nodeRepository).deleteSubtree(varPath);
        // One bound argument, the path. This used to expect two — the second being an
        // `Instant` the PostgreSQL driver cannot type, so the assertion described a
        // call that always failed in production. The timestamp is now SQL `NOW()`.
        verify(jdbc).update(contains("UPDATE experience_fragment_metadata"), eq(xfPath));
    }
}
