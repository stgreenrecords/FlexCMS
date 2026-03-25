package com.flexcms.app.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI / Swagger configuration for FlexCMS.
 *
 * <p>Exposes two separate API groups reachable via Swagger UI:
 * <ul>
 *   <li><b>Author API</b> — {@code /api/author/**} (requires Bearer JWT)</li>
 *   <li><b>Headless Delivery API</b> — {@code /api/content/**} and {@code /api/graphql/**} (public read)</li>
 * </ul>
 *
 * <p>Swagger UI is available at {@code /swagger-ui.html}.
 * Raw OpenAPI JSON at {@code /v3/api-docs}.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI flexCmsOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("FlexCMS REST API")
                        .description("""
                                Enterprise headless CMS platform.

                                **Author API** (`/api/author/**`) — requires a valid Bearer JWT issued by your IdP.

                                **Headless Delivery API** (`/api/content/**`) — public read; no auth required.

                                **GraphQL** — available at `/graphql` (not shown here; use the GraphiQL UI at `/graphiql`).
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("FlexCMS Team")
                                .url("https://github.com/flexcms/flexcms"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local author instance"),
                        new Server().url("http://localhost:8081").description("Local publish instance")))
                .components(new Components()
                        .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT issued by the configured OAuth2/OIDC provider (e.g. Keycloak, Auth0)")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
    }

    /**
     * Author API group — all endpoints under {@code /api/author/**}.
     * Requires authentication.
     */
    @Bean
    public GroupedOpenApi authorApiGroup() {
        return GroupedOpenApi.builder()
                .group("author")
                .displayName("Author API")
                .pathsToMatch("/api/author/**")
                .build();
    }

    /**
     * Headless delivery API group — content and asset delivery endpoints.
     * Publicly accessible (anonymous GET).
     */
    @Bean
    public GroupedOpenApi headlessApiGroup() {
        return GroupedOpenApi.builder()
                .group("headless")
                .displayName("Headless Delivery API")
                .pathsToMatch("/api/content/**", "/api/pages/**")
                .build();
    }
}
