package com.flexcms.app.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Converts a JWT into a Spring Security authentication token with roles.
 *
 * <p>Role extraction strategy (in priority order):
 * <ol>
 *   <li>{@code realm_access.roles} — Keycloak realm roles</li>
 *   <li>{@code resource_access.flexcms.roles} — Keycloak client roles</li>
 *   <li>{@code roles} — standard/Auth0 flat array claim</li>
 *   <li>{@code https://flexcms.io/roles} — Auth0 custom namespace claim</li>
 * </ol>
 *
 * <p>Each extracted role is prefixed with {@code ROLE_} to integrate with
 * Spring Security's hasRole() checks and @PreAuthorize("hasRole('ADMIN')") etc.
 */
public class JwtRoleConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    /** Auth0 custom namespace claim for roles */
    public static final String AUTH0_ROLES_CLAIM = "https://flexcms.io/roles";

    /** Keycloak realm_access claim key */
    private static final String REALM_ACCESS = "realm_access";

    /** Keycloak resource_access claim key */
    private static final String RESOURCE_ACCESS = "resource_access";

    /** Client ID used to look up client-level roles in resource_access */
    private static final String CLIENT_ID = "flexcms";

    /** Inner key inside realm_access / resource_access objects */
    private static final String ROLES_KEY = "roles";

    /** Default Spring Security scope converter — handles "scope" / "scp" claims */
    private final JwtGrantedAuthoritiesConverter defaultConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>(defaultConverter.convert(jwt));
        authorities.addAll(extractRoles(jwt));
        return new JwtAuthenticationToken(jwt, authorities);
    }

    /**
     * Extract FlexCMS role authorities from the JWT.
     * Tries multiple claim formats for maximum IdP compatibility.
     */
    Collection<GrantedAuthority> extractRoles(Jwt jwt) {
        List<String> roles = new ArrayList<>();

        // 1. Keycloak realm_access.roles
        Map<String, Object> realmAccess = jwt.getClaimAsMap(REALM_ACCESS);
        if (realmAccess != null) {
            roles.addAll(extractStringList(realmAccess, ROLES_KEY));
        }

        // 2. Keycloak resource_access.flexcms.roles (client roles)
        Map<String, Object> resourceAccess = jwt.getClaimAsMap(RESOURCE_ACCESS);
        if (resourceAccess != null) {
            Object clientAccess = resourceAccess.get(CLIENT_ID);
            if (clientAccess instanceof Map<?, ?> clientMap) {
                roles.addAll(extractStringList(clientMap, ROLES_KEY));
            }
        }

        // 3. Flat "roles" claim (Auth0 default, Okta, generic IdPs)
        List<String> flatRoles = jwt.getClaimAsStringList(ROLES_KEY);
        if (flatRoles != null) {
            roles.addAll(flatRoles);
        }

        // 4. Auth0 custom namespace claim
        List<String> auth0Roles = jwt.getClaimAsStringList(AUTH0_ROLES_CLAIM);
        if (auth0Roles != null) {
            roles.addAll(auth0Roles);
        }

        return roles.stream()
                .distinct()
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .map(a -> (GrantedAuthority) a)
                .toList();
    }

    private List<String> extractStringList(Map<?, ?> map, String key) {
        Object value = map.get(key);
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .toList();
        }
        return Collections.emptyList();
    }
}
