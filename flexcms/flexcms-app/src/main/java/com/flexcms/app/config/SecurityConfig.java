package com.flexcms.app.config;

import com.flexcms.core.security.NodePermissionEvaluator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security configuration for FlexCMS.
 *
 * <p><b>Auth model:</b> OAuth2 Resource Server validating JWTs issued by an external
 * IdP (Keycloak, Auth0, Okta, etc.). Sessions are stateless — every request must
 * carry a valid Bearer token for protected endpoints.
 *
 * <p><b>Path rules (in evaluation order):</b>
 * <pre>
 *  PUBLIC  GET  /api/content/**          — headless delivery (anonymous read)
 *  PUBLIC       /graphql/**              — GraphQL endpoint (anonymous read)
 *  PUBLIC  GET  /dam/renditions/**       — asset renditions (CDN-friendly)
 *  PUBLIC       /clientlibs/**           — JS/CSS bundles
 *  PUBLIC       /static/**              — static resources
 *  PUBLIC       /actuator/health        — liveness/readiness probes
 *
 *  AUTH         /api/author/**           — all author-mode operations
 *  AUTH         /api/pim/**             — PIM product management
 *  AUTH  POST/PUT/DELETE /api/dam/**   — asset upload/management
 *  AUTH         /actuator/**           — other actuator endpoints
 *  AUTH         (anything else)
 * </pre>
 *
 * <p>Fine-grained role checks use {@code @PreAuthorize} annotations on service
 * methods — enabled here via {@code @EnableMethodSecurity}.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${flexcms.local-dev:false}")
    private boolean localDev;

    /**
     * Registers the per-node {@link NodePermissionEvaluator} so that
     * {@code @PreAuthorize("hasPermission(#path, 'WRITE')")} expressions work.
     *
     * <p>The {@code static} modifier is required — Spring processes method-security
     * infrastructure beans before regular beans, so the handler must be available
     * without first instantiating {@code SecurityConfig}.
     */
    @Bean
    static MethodSecurityExpressionHandler methodSecurityExpressionHandler(
            NodePermissionEvaluator permissionEvaluator) {
        DefaultMethodSecurityExpressionHandler handler =
                new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(permissionEvaluator);
        return handler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        if (localDev) {
            // Local development: permit everything, anonymous user has ROLE_ADMIN
            // so @PreAuthorize and ACL checks pass without Keycloak running.
            http
                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                    .anonymous(anon -> anon.authorities("ROLE_ADMIN", "ROLE_USER"));
        } else {
            http
                    .authorizeHttpRequests(auth -> auth
                            // ── Public: headless content delivery ──────────────────────────
                            .requestMatchers(HttpMethod.GET, "/api/content/**").permitAll()
                            .requestMatchers("/graphql/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/dam/renditions/**").permitAll()
                            .requestMatchers("/clientlibs/**").permitAll()
                            .requestMatchers("/static/**").permitAll()

                            // ── Public: infrastructure ──────────────────────────────────────
                            .requestMatchers("/actuator/health", "/actuator/health/**",
                                             "/actuator/info", "/actuator/prometheus").permitAll()

                            // ── Protected: author & PIM APIs ────────────────────────────────
                            .requestMatchers("/api/author/**").authenticated()
                            .requestMatchers("/api/pim/**").authenticated()

                            // ── Protected: DAM management (reads are public, mutations need auth) ──
                            .requestMatchers(HttpMethod.POST, "/api/dam/**").authenticated()
                            .requestMatchers(HttpMethod.PUT, "/api/dam/**").authenticated()
                            .requestMatchers(HttpMethod.DELETE, "/api/dam/**").authenticated()

                            // ── Protected: actuator management ──────────────────────────────
                            .requestMatchers("/actuator/**").authenticated()

                            // ── Everything else requires authentication ──────────────────────
                            .anyRequest().authenticated()
                    )
                    .oauth2ResourceServer(oauth2 -> oauth2
                            .jwt(jwt -> jwt.jwtAuthenticationConverter(new JwtRoleConverter()))
                    );
        }

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
