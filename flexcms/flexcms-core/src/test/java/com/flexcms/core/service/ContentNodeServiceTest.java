package com.flexcms.core.service;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.ContentNodeVersion;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.ContentNodeVersionRepository;
import com.flexcms.core.util.RichTextSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentNodeServiceTest {

    @Mock
    private ContentNodeRepository nodeRepository;

    @Mock
    private ContentNodeVersionRepository versionRepository;

    @Mock
    private RichTextSanitizer richTextSanitizer;

    @InjectMocks
    private ContentNodeService contentNodeService;

    @BeforeEach
    void configureSanitizer() {
        // Lenient: pass-through default so existing tests need no changes.
        // Lenient avoids UnnecessaryStubbingException in tests that don't call sanitizeIfHtml.
        org.mockito.Mockito.lenient()
                .when(richTextSanitizer.sanitizeIfHtml(org.mockito.ArgumentMatchers.anyString()))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private ContentNode buildNode(String path, String name) {
        ContentNode node = new ContentNode(path, name, "flexcms/page");
        node.setId(UUID.randomUUID());
        node.setSiteId("corporate");
        node.setLocale("en");
        node.setProperties(new HashMap<>());
        node.setChildren(new ArrayList<>());
        return node;
    }

    // --- getByPath ---

    @Test
    void getByPath_returnsEmpty_whenNotFound() {
        when(nodeRepository.findByPath("content.corporate.en.missing")).thenReturn(Optional.empty());

        Optional<ContentNode> result = contentNodeService.getByPath("content.corporate.en.missing");

        assertThat(result).isEmpty();
    }

    @Test
    void getByPath_returnsNode_whenExists() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));

        Optional<ContentNode> result = contentNodeService.getByPath("content.corporate.en.home");

        assertThat(result).contains(node);
    }

    // --- create ---

    @Test
    void create_throwsConflict_whenPathAlreadyExists() {
        when(nodeRepository.existsByPath("content.corporate.en.home")).thenReturn(true);

        assertThatThrownBy(() ->
                contentNodeService.create("content.corporate.en", "home", "flexcms/page", null, "user1"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void create_throwsNotFound_whenParentDoesNotExist() {
        when(nodeRepository.existsByPath(any())).thenReturn(false);
        when(nodeRepository.findByPath("content.corporate.en")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                contentNodeService.create("content.corporate.en", "home", "flexcms/page", null, "user1"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void create_savesNode_withInheritedSiteAndLocale() {
        ContentNode parent = buildNode("content.corporate.en", "en");
        when(nodeRepository.existsByPath("content.corporate.en.home")).thenReturn(false);
        when(nodeRepository.findByPath("content.corporate.en")).thenReturn(Optional.of(parent));
        when(nodeRepository.findByParentPathOrderByOrderIndex("content.corporate.en")).thenReturn(List.of());
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        contentNodeService.create("content.corporate.en", "home", "flexcms/page",
                Map.of("jcr:title", "Home"), "user1");

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository).save(captor.capture());
        ContentNode captured = captor.getValue();
        assertThat(captured.getSiteId()).isEqualTo("corporate");
        assertThat(captured.getLocale()).isEqualTo("en");
        assertThat(captured.getCreatedBy()).isEqualTo("user1");
        assertThat(captured.getOrderIndex()).isEqualTo(0);
    }

    @Test
    void create_setsOrderIndexAfterLastSibling() {
        ContentNode parent = buildNode("content.corporate.en", "en");
        ContentNode sibling = buildNode("content.corporate.en.about", "about");
        sibling.setOrderIndex(5);
        when(nodeRepository.existsByPath(any())).thenReturn(false);
        when(nodeRepository.findByPath("content.corporate.en")).thenReturn(Optional.of(parent));
        when(nodeRepository.findByParentPathOrderByOrderIndex("content.corporate.en")).thenReturn(List.of(sibling));
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        contentNodeService.create("content.corporate.en", "home", "flexcms/page", null, "user1");

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository).save(captor.capture());
        assertThat(captor.getValue().getOrderIndex()).isEqualTo(6);
    }

    @Test
    void create_sanitizesNameInPath() {
        ContentNode parent = buildNode("content.corporate.en", "en");
        when(nodeRepository.existsByPath(any())).thenReturn(false);
        when(nodeRepository.findByPath("content.corporate.en")).thenReturn(Optional.of(parent));
        when(nodeRepository.findByParentPathOrderByOrderIndex(any())).thenReturn(List.of());
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        contentNodeService.create("content.corporate.en", "My Page!", "flexcms/page", null, "user1");

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository).save(captor.capture());
        // "My Page!" -> lowercase "my page!" -> replace non-alphanum -> "my_page_" -> trim edges -> "my_page"
        assertThat(captor.getValue().getPath()).isEqualTo("content.corporate.en.my_page");
    }

    // --- updateProperties ---

    @Test
    void updateProperties_throwsNotFound_whenNodeMissing() {
        when(nodeRepository.findByPath("content.corporate.en.missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                contentNodeService.updateProperties("content.corporate.en.missing", Map.of(), "user1"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void updateProperties_throwsConflict_whenLockedByOtherUser() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        node.setLockedBy("otherUser");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));

        assertThatThrownBy(() ->
                contentNodeService.updateProperties("content.corporate.en.home", Map.of(), "user1"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void updateProperties_mergesProperties_andSavesVersion() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        node.setProperties(new HashMap<>(Map.of("existing", "value")));
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ContentNode result = contentNodeService.updateProperties("content.corporate.en.home",
                Map.of("newKey", "newValue"), "user1");

        verify(versionRepository).save(any(ContentNodeVersion.class));
        assertThat(result.getProperties())
                .containsEntry("existing", "value")
                .containsEntry("newKey", "newValue");
        assertThat(result.getModifiedBy()).isEqualTo("user1");
    }

    @Test
    void updateProperties_allowsOwnerToEditLockedNode() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        node.setLockedBy("user1");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThatCode(() ->
                contentNodeService.updateProperties("content.corporate.en.home", Map.of(), "user1"))
                .doesNotThrowAnyException();
    }

    // --- move ---

    @Test
    void move_throwsNotFound_whenSourceNotFound() {
        when(nodeRepository.findByPath("content.corporate.en.missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                contentNodeService.move("content.corporate.en.missing", "content.corporate.en.other", "user1"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void move_throwsNotFound_whenTargetNotFound() {
        ContentNode source = buildNode("content.corporate.en.home", "home");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(source));
        when(nodeRepository.findByPath("content.corporate.en.other")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                contentNodeService.move("content.corporate.en.home", "content.corporate.en.other", "user1"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void move_updatesPathsForNodeAndDescendants() {
        ContentNode source = buildNode("content.corporate.en.home", "home");
        ContentNode target = buildNode("content.corporate.en.section", "section");
        ContentNode child = buildNode("content.corporate.en.home.hero", "hero");
        child.setParentPath("content.corporate.en.home");

        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(source));
        when(nodeRepository.findByPath("content.corporate.en.section")).thenReturn(Optional.of(target));
        when(nodeRepository.findDescendants("content.corporate.en.home")).thenReturn(new ArrayList<>(List.of(child)));
        when(nodeRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        ContentNode moved = contentNodeService.move("content.corporate.en.home",
                "content.corporate.en.section", "user1");

        // newPath = targetParent + "." + node.name = "...section.home"
        // child path: replace sourcePath prefix with newPath
        assertThat(moved.getPath()).isEqualTo("content.corporate.en.section.home");
        assertThat(child.getPath()).isEqualTo("content.corporate.en.section.home.hero");
        assertThat(child.getParentPath()).isEqualTo("content.corporate.en.section.home");
    }

    @Test
    void move_setsModifiedBy_onAllNodes() {
        ContentNode source = buildNode("content.corporate.en.home", "home");
        ContentNode target = buildNode("content.corporate.en.section", "section");

        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(source));
        when(nodeRepository.findByPath("content.corporate.en.section")).thenReturn(Optional.of(target));
        when(nodeRepository.findDescendants("content.corporate.en.home")).thenReturn(new ArrayList<>());
        when(nodeRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        ContentNode moved = contentNodeService.move("content.corporate.en.home",
                "content.corporate.en.section", "user1");

        assertThat(moved.getModifiedBy()).isEqualTo("user1");
    }

    // --- delete ---

    @Test
    void delete_callsDeleteSubtree() {
        contentNodeService.delete("content.corporate.en.home");

        verify(nodeRepository).deleteSubtree("content.corporate.en.home");
    }

    // --- lock ---

    @Test
    void lock_throwsConflict_whenLockedByOther() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        node.setLockedBy("otherUser");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));

        assertThatThrownBy(() ->
                contentNodeService.lock("content.corporate.en.home", "user1"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void lock_setsLockedByAndLockedAt() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ContentNode locked = contentNodeService.lock("content.corporate.en.home", "user1");

        assertThat(locked.getLockedBy()).isEqualTo("user1");
        assertThat(locked.getLockedAt()).isNotNull();
    }

    @Test
    void lock_allowsRelock_bySameUser() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        node.setLockedBy("user1");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThatCode(() -> contentNodeService.lock("content.corporate.en.home", "user1"))
                .doesNotThrowAnyException();
    }

    // --- unlock ---

    @Test
    void unlock_clearsLock() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        node.setLockedBy("user1");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ContentNode unlocked = contentNodeService.unlock("content.corporate.en.home", "user1");

        assertThat(unlocked.getLockedBy()).isNull();
        assertThat(unlocked.getLockedAt()).isNull();
    }

    @Test
    void unlock_throwsConflict_whenLockedByOther() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        node.setLockedBy("otherUser");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));

        assertThatThrownBy(() ->
                contentNodeService.unlock("content.corporate.en.home", "user1"))
                .isInstanceOf(ConflictException.class);
    }

    // --- updateStatus ---

    @Test
    void updateStatus_updatesNodeStatus() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ContentNode updated = contentNodeService.updateStatus("content.corporate.en.home",
                NodeStatus.PUBLISHED, "user1");

        assertThat(updated.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
        assertThat(updated.getModifiedBy()).isEqualTo("user1");
    }

    @Test
    void updateStatus_throwsNotFound_whenNodeMissing() {
        when(nodeRepository.findByPath("content.corporate.en.missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                contentNodeService.updateStatus("content.corporate.en.missing", NodeStatus.PUBLISHED, "user1"))
                .isInstanceOf(NotFoundException.class);
    }

    // --- getChildren ---

    @Test
    void getChildren_delegatesToRepository() {
        ContentNode child1 = buildNode("content.corporate.en.home.hero", "hero");
        ContentNode child2 = buildNode("content.corporate.en.home.text", "text");
        when(nodeRepository.findByParentPathOrderByOrderIndex("content.corporate.en.home"))
                .thenReturn(List.of(child1, child2));

        List<ContentNode> children = contentNodeService.getChildren("content.corporate.en.home");

        assertThat(children).containsExactly(child1, child2);
    }

    // --- XSS sanitization ---

    @Test
    void create_sanitizesHtmlProperties_viaRichTextSanitizer() {
        ContentNode parent = buildNode("content.corporate.en", "en");
        when(nodeRepository.existsByPath(any())).thenReturn(false);
        when(nodeRepository.findByPath("content.corporate.en")).thenReturn(Optional.of(parent));
        when(nodeRepository.findByParentPathOrderByOrderIndex(any())).thenReturn(List.of());
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        // Sanitizer strips script tag
        when(richTextSanitizer.sanitizeIfHtml("<p>Hello</p><script>xss()</script>"))
                .thenReturn("<p>Hello</p>");
        when(richTextSanitizer.sanitizeIfHtml("plain text")).thenReturn("plain text");

        contentNodeService.create("content.corporate.en", "home", "flexcms/page",
                Map.of("body", "<p>Hello</p><script>xss()</script>", "title", "plain text"),
                "user1");

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository).save(captor.capture());
        assertThat(captor.getValue().getProperties())
                .containsEntry("body", "<p>Hello</p>")
                .containsEntry("title", "plain text");
    }

    @Test
    void updateProperties_sanitizesHtmlValues_viaRichTextSanitizer() {
        ContentNode node = buildNode("content.corporate.en.home", "home");
        node.setProperties(new HashMap<>());
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(node));
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(richTextSanitizer.sanitizeIfHtml("<img src=x onerror=alert(1)>"))
                .thenReturn("<img src=\"x\" />");

        ContentNode result = contentNodeService.updateProperties("content.corporate.en.home",
                Map.of("hero", "<img src=x onerror=alert(1)>"), "user1");

        assertThat(result.getProperties()).containsEntry("hero", "<img src=\"x\" />");
    }

    @Test
    void create_skipsNonStringProperties_withoutSanitization() {
        ContentNode parent = buildNode("content.corporate.en", "en");
        when(nodeRepository.existsByPath(any())).thenReturn(false);
        when(nodeRepository.findByPath("content.corporate.en")).thenReturn(Optional.of(parent));
        when(nodeRepository.findByParentPathOrderByOrderIndex(any())).thenReturn(List.of());
        when(nodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> props = new HashMap<>();
        props.put("count", 42);
        props.put("enabled", true);

        contentNodeService.create("content.corporate.en", "home", "flexcms/page", props, "user1");

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository).save(captor.capture());
        assertThat(captor.getValue().getProperties())
                .containsEntry("count", 42)
                .containsEntry("enabled", true);
        // sanitizeIfHtml must not be called for non-String values
        org.mockito.Mockito.verify(richTextSanitizer,
                org.mockito.Mockito.never()).sanitizeIfHtml(null);
    }
}
