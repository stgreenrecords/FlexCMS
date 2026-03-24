package com.flexcms.app.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JwtRoleConverterTest {

    private JwtRoleConverter converter;

    @BeforeEach
    void setUp() {
        converter = new JwtRoleConverter();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Jwt buildJwt(Map<String, Object> claims) {
        return Jwt.withTokenValue("test-token")
                .header("alg", "RS256")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .claims(c -> c.putAll(claims))
                .build();
    }

    private List<String> authorityNames(Collection<GrantedAuthority> authorities) {
        return authorities.stream().map(GrantedAuthority::getAuthority).toList();
    }

    // ── Keycloak realm_access ─────────────────────────────────────────────────

    @Test
    void extractsRoles_fromKeycloak_realmAccess() {
        Jwt jwt = buildJwt(Map.of(
                "realm_access", Map.of("roles", List.of("ADMIN", "CONTENT_AUTHOR"))
        ));

        Collection<GrantedAuthority> authorities = converter.extractRoles(jwt);

        assertThat(authorityNames(authorities))
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_CONTENT_AUTHOR");
    }

    @Test
    void extractsRoles_fromKeycloak_resourceAccess_clientRoles() {
        Jwt jwt = buildJwt(Map.of(
                "resource_access", Map.of(
                        "flexcms", Map.of("roles", List.of("CONTENT_PUBLISHER")),
                        "other-client", Map.of("roles", List.of("IGNORED"))
                )
        ));

        Collection<GrantedAuthority> authorities = converter.extractRoles(jwt);

        assertThat(authorityNames(authorities)).contains("ROLE_CONTENT_PUBLISHER");
        assertThat(authorityNames(authorities)).doesNotContain("ROLE_IGNORED");
    }

    @Test
    void extractsRoles_fromKeycloak_bothRealmAndClientRoles() {
        Jwt jwt = buildJwt(Map.of(
                "realm_access", Map.of("roles", List.of("CONTENT_AUTHOR")),
                "resource_access", Map.of("flexcms", Map.of("roles", List.of("CONTENT_PUBLISHER")))
        ));

        Collection<GrantedAuthority> authorities = converter.extractRoles(jwt);

        assertThat(authorityNames(authorities))
                .containsExactlyInAnyOrder("ROLE_CONTENT_AUTHOR", "ROLE_CONTENT_PUBLISHER");
    }

    // ── Flat roles claim ──────────────────────────────────────────────────────

    @Test
    void extractsRoles_fromFlatRolesClaim() {
        Jwt jwt = buildJwt(Map.of(
                "roles", List.of("CONTENT_REVIEWER", "VIEWER")
        ));

        Collection<GrantedAuthority> authorities = converter.extractRoles(jwt);

        assertThat(authorityNames(authorities))
                .containsExactlyInAnyOrder("ROLE_CONTENT_REVIEWER", "ROLE_VIEWER");
    }

    // ── Auth0 custom namespace ────────────────────────────────────────────────

    @Test
    void extractsRoles_fromAuth0NamespaceClaim() {
        Jwt jwt = buildJwt(Map.of(
                JwtRoleConverter.AUTH0_ROLES_CLAIM, List.of("ADMIN", "CONTENT_AUTHOR")
        ));

        Collection<GrantedAuthority> authorities = converter.extractRoles(jwt);

        assertThat(authorityNames(authorities))
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_CONTENT_AUTHOR");
    }

    // ── Role prefix handling ──────────────────────────────────────────────────

    @Test
    void doesNotDoublePrefixRoles_thatAlreadyHaveROLE_prefix() {
        Jwt jwt = buildJwt(Map.of(
                "roles", List.of("ROLE_ADMIN", "CONTENT_AUTHOR")
        ));

        Collection<GrantedAuthority> authorities = converter.extractRoles(jwt);

        assertThat(authorityNames(authorities))
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_CONTENT_AUTHOR");
    }

    // ── Deduplication ─────────────────────────────────────────────────────────

    @Test
    void deduplicatesRoles_acrossMultipleSources() {
        Jwt jwt = buildJwt(Map.of(
                "realm_access", Map.of("roles", List.of("ADMIN")),
                "roles", List.of("ADMIN", "CONTENT_AUTHOR")
        ));

        Collection<GrantedAuthority> authorities = converter.extractRoles(jwt);

        assertThat(authorityNames(authorities))
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_CONTENT_AUTHOR");
    }

    // ── Empty / missing claims ────────────────────────────────────────────────

    @Test
    void returnsEmpty_whenNoClaims() {
        Jwt jwt = buildJwt(Map.of("sub", "user123"));

        Collection<GrantedAuthority> authorities = converter.extractRoles(jwt);

        assertThat(authorities).isEmpty();
    }

    @Test
    void returnsEmpty_whenRealmAccessHasNoRoles() {
        Jwt jwt = buildJwt(Map.of(
                "realm_access", Map.of("other_key", "value")
        ));

        Collection<GrantedAuthority> authorities = converter.extractRoles(jwt);

        assertThat(authorities).isEmpty();
    }

    // ── Full convert() ────────────────────────────────────────────────────────

    @Test
    void convert_returnsJwtAuthenticationToken_withRoles() {
        Jwt jwt = buildJwt(Map.of(
                "sub", "user-123",
                "realm_access", Map.of("roles", List.of("ADMIN"))
        ));

        var token = converter.convert(jwt);

        assertThat(token).isNotNull();
        assertThat(token.getPrincipal()).isEqualTo(jwt);
        assertThat(token.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .contains("ROLE_ADMIN");
    }
}
