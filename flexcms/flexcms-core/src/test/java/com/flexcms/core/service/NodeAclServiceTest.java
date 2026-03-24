package com.flexcms.core.service;

import com.flexcms.core.model.NodeAcl;
import com.flexcms.core.model.NodePermission;
import com.flexcms.core.repository.NodeAclRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NodeAclServiceTest {

    @Mock
    private NodeAclRepository aclRepository;

    @InjectMocks
    private NodeAclService nodeAclService;

    private static final String NODE_PATH = "content.corporate.en.homepage";

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Authentication auth(String userId, String... roles) {
        Authentication mock = mock(Authentication.class);
        lenient().when(mock.isAuthenticated()).thenReturn(true);
        lenient().when(mock.getName()).thenReturn(userId);
        Collection<GrantedAuthority> authorities = java.util.Arrays.stream(roles)
                .map(SimpleGrantedAuthority::new)
                .collect(java.util.stream.Collectors.toList());
        lenient().doReturn(authorities).when(mock).getAuthorities();
        return mock;
    }

    private NodeAcl allowAcl(String principal, NodePermission... perms) {
        return acl(principal, true, true, perms);
    }

    private NodeAcl denyAcl(String principal, NodePermission... perms) {
        return acl(principal, false, true, perms);
    }

    private NodeAcl acl(String principal, boolean allow, boolean inherit,
                         NodePermission... perms) {
        List<String> permNames = java.util.Arrays.stream(perms)
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toList());
        return new NodeAcl(NODE_PATH, principal, permNames, allow, inherit);
    }

    // ── Tests: ADMIN bypass ───────────────────────────────────────────────────

    @Test
    void admin_bypassesAcl_alwaysAllowed() {
        Authentication admin = auth("admin1", "ROLE_ADMIN");

        assertThat(nodeAclService.isAllowed(admin, NODE_PATH, NodePermission.DELETE)).isTrue();
        // Repository should never be consulted for ADMIN
        verify(aclRepository, never()).findEffectiveAcls(any());
    }

    // ── Tests: unauthenticated ─────────────────────────────────────────────────

    @Test
    void unauthenticated_denied() {
        Authentication unauthenticated = mock(Authentication.class);
        when(unauthenticated.isAuthenticated()).thenReturn(false);

        assertThat(nodeAclService.isAllowed(unauthenticated, NODE_PATH, NodePermission.READ)).isFalse();
    }

    @Test
    void nullAuthentication_denied() {
        assertThat(nodeAclService.isAllowed(null, NODE_PATH, NodePermission.READ)).isFalse();
    }

    // ── Tests: user principal ─────────────────────────────────────────────────

    @Test
    void userAcl_allow_grants() {
        Authentication user = auth("alice", "ROLE_CONTENT_AUTHOR");
        when(aclRepository.findEffectiveAcls(NODE_PATH))
                .thenReturn(List.of(allowAcl("user:alice", NodePermission.READ)));

        assertThat(nodeAclService.isAllowed(user, NODE_PATH, NodePermission.READ)).isTrue();
    }

    @Test
    void userAcl_deny_blocks() {
        Authentication user = auth("alice", "ROLE_CONTENT_AUTHOR");
        when(aclRepository.findEffectiveAcls(NODE_PATH))
                .thenReturn(List.of(denyAcl("user:alice", NodePermission.READ)));

        assertThat(nodeAclService.isAllowed(user, NODE_PATH, NodePermission.READ)).isFalse();
    }

    @Test
    void otherUserAcl_doesNotMatch() {
        Authentication user = auth("alice", "ROLE_CONTENT_AUTHOR");
        when(aclRepository.findEffectiveAcls(NODE_PATH))
                .thenReturn(List.of(allowAcl("user:bob", NodePermission.READ)));

        assertThat(nodeAclService.isAllowed(user, NODE_PATH, NodePermission.READ)).isFalse();
    }

    // ── Tests: role principal ─────────────────────────────────────────────────

    @Test
    void roleAcl_allow_grantsIfUserHasRole() {
        Authentication user = auth("alice", "ROLE_CONTENT_AUTHOR");
        when(aclRepository.findEffectiveAcls(NODE_PATH))
                .thenReturn(List.of(allowAcl("role:CONTENT_AUTHOR", NodePermission.WRITE)));

        assertThat(nodeAclService.isAllowed(user, NODE_PATH, NodePermission.WRITE)).isTrue();
    }

    @Test
    void roleAcl_noMatchingRole_denied() {
        Authentication user = auth("alice", "ROLE_CONTENT_REVIEWER");
        when(aclRepository.findEffectiveAcls(NODE_PATH))
                .thenReturn(List.of(allowAcl("role:CONTENT_AUTHOR", NodePermission.WRITE)));

        assertThat(nodeAclService.isAllowed(user, NODE_PATH, NodePermission.WRITE)).isFalse();
    }

    // ── Tests: everyone principal ─────────────────────────────────────────────

    @Test
    void everyoneAcl_matchesAnyAuthenticatedUser() {
        Authentication user = auth("alice", "ROLE_CONTENT_REVIEWER");
        when(aclRepository.findEffectiveAcls(NODE_PATH))
                .thenReturn(List.of(allowAcl("everyone", NodePermission.READ)));

        assertThat(nodeAclService.isAllowed(user, NODE_PATH, NodePermission.READ)).isTrue();
    }

    // ── Tests: deny wins over allow ───────────────────────────────────────────

    @Test
    void denyCloserToNode_winsOverAllowOnAncestor() {
        // Effective ACLs are ordered closest-first (by node_path length DESC)
        Authentication user = auth("alice", "ROLE_CONTENT_AUTHOR");
        NodeAcl deny = denyAcl("user:alice", NodePermission.WRITE);
        NodeAcl allow = allowAcl("everyone", NodePermission.WRITE);
        when(aclRepository.findEffectiveAcls(NODE_PATH))
                .thenReturn(List.of(deny, allow));  // deny is first (closer node)

        assertThat(nodeAclService.isAllowed(user, NODE_PATH, NodePermission.WRITE)).isFalse();
    }

    @Test
    void noMatchingPermission_denied() {
        Authentication user = auth("alice", "ROLE_CONTENT_AUTHOR");
        // ACL only covers READ, not WRITE
        when(aclRepository.findEffectiveAcls(NODE_PATH))
                .thenReturn(List.of(allowAcl("user:alice", NodePermission.READ)));

        assertThat(nodeAclService.isAllowed(user, NODE_PATH, NodePermission.WRITE)).isFalse();
    }

    @Test
    void noAclEntries_denied() {
        Authentication user = auth("alice", "ROLE_CONTENT_AUTHOR");
        when(aclRepository.findEffectiveAcls(NODE_PATH)).thenReturn(List.of());

        assertThat(nodeAclService.isAllowed(user, NODE_PATH, NodePermission.READ)).isFalse();
    }

    // ── Tests: grant / revoke ─────────────────────────────────────────────────

    @Test
    void grant_savesAcl() {
        NodeAcl saved = allowAcl("user:alice", NodePermission.READ, NodePermission.WRITE);
        when(aclRepository.save(any())).thenReturn(saved);

        NodeAcl result = nodeAclService.grant(NODE_PATH, "user:alice",
                Set.of(NodePermission.READ, NodePermission.WRITE), true, true);

        verify(aclRepository).deleteByNodePathAndPrincipal(NODE_PATH, "user:alice");
        verify(aclRepository).save(any(NodeAcl.class));
        assertThat(result).isEqualTo(saved);
    }

    @Test
    void revoke_deletesEntry() {
        nodeAclService.revoke(NODE_PATH, "user:alice");
        verify(aclRepository).deleteByNodePathAndPrincipal(NODE_PATH, "user:alice");
    }

    @Test
    void deleteAclsForNode_deletesAll() {
        nodeAclService.deleteAclsForNode(NODE_PATH);
        verify(aclRepository).deleteByNodePath(NODE_PATH);
    }
}
