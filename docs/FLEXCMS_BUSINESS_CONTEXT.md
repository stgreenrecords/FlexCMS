# FlexCMS Business and Architecture Context for Dark Factory

This file is the project-specific business context that Dark Factory role sessions should use. The SDLC process itself is defined in `df/`; this file only describes FlexCMS product rules, architecture, and engineering guardrails.

## Product identity

FlexCMS is an enterprise, headless-only CMS with three pillars:

- **CMS / Content** — hierarchical content tree, pages, components, workflow, author/publish separation.
- **DAM / Assets** — digital asset management with object storage, renditions, metadata, references, and CDN-ready delivery.
- **PIM / Products** — product catalog services backed by a separate `flexcms_pim` database.

The backend returns JSON only. It must never generate HTML. All rendering is performed by frontend applications, SDKs, or adapters.

## Core architecture

```text
Author (8080) ──RabbitMQ──▶ Publish (8081) ──▶ CDN/browser
    │                           │
    ▼                           ▼
PostgreSQL (ltree+JSONB)    Redis + Caffeine
```

- Author is read/write.
- Publish is read-only.
- Replication uses RabbitMQ.
- Content paths in PostgreSQL use ltree dot notation, e.g. `content.site.en.home`.
- URL paths use slash notation, e.g. `/site/en/home`.

## Technology stack

- Backend: Spring Boot 3.3, Java 21, Maven multi-module project under `flexcms/`.
- Database: PostgreSQL 16 with `ltree`, `JSONB`, and Flyway migrations.
- Frontend: TypeScript pnpm monorepo under `frontend/`.
- Admin UI: Next.js with `@flexcms/ui` design system.
- Reference sites: Next.js / Nuxt using framework adapters.
- Local infrastructure: Docker Compose, PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch.

## Layer rules

Backend code must preserve layer separation:

| Layer | Allowed | Forbidden |
|---|---|---|
| `model/` | JPA entities, enums | Business logic |
| `repository/` | Spring Data repositories, JPQL | Service calls |
| `service/` | Business logic, transactions | HTTP/controller concerns |
| `controller/` | Request mapping, DTO mapping | Repository calls, business logic |

Rules:

- Controllers call services.
- Services call repositories.
- Do not return internal JPA entities from APIs when DTOs/projections are appropriate.
- Do not use `FetchType.EAGER` as a lazy-loading workaround.
- Write production-quality implementations; do not choose speed over architecture.

## Content path conventions

- Database ltree path: `content.site.en.home`.
- URL path: `/site/en/home`.
- `PathUtils.toContentPath(urlPath)` converts URL path to ltree and adds `content.`.
- `GET /api/author/content/children` accepts ltree path directly and intentionally does not call `toContentPath()`.
- GraphQL `node()` uses path verbatim.
- GraphQL `page()` calls `toContentPath()`.

## Key backend files

### CMS

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ContentNode.java`
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`
- `flexcms/flexcms-headless/src/main/java/com/flexcms/headless/controller/PageApiController.java`
- `flexcms/flexcms-headless/src/main/java/com/flexcms/headless/graphql/ContentQueryResolver.java`

### DAM

- `flexcms/flexcms-dam/src/main/java/com/flexcms/dam/service/AssetIngestService.java`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorAssetController.java`

### PIM

- `flexcms/flexcms-pim/src/main/java/com/flexcms/pim/service/ProductService.java`
- `flexcms/flexcms-pim/src/main/java/com/flexcms/pim/controller/ProductApiController.java`
- PIM always uses its own datasource and migrations, never the CMS datasource.

## Migration rules

- CMS migrations: `flexcms/flexcms-app/src/main/resources/db/migration/V{N}__description.sql`.
- PIM migrations: `flexcms/flexcms-pim/src/main/resources/db/pim/V{N}__description.sql`.
- Migration version numbers are sequential and never reused.
- Check existing migrations before adding a new one.

## Node status enum

Valid values only:

- `DRAFT`
- `IN_REVIEW`
- `APPROVED`
- `PUBLISHED`
- `ARCHIVED`

Never use `LIVE`; it is not a valid enum value.

## Admin UI rules

- Before implementing a visible admin UI page, check `Design/UI/stitch_flexcms_admin_ui_requirements_summary/<page-name>/` for `screen.png` and `code.html`.
- Do not hardcode colors; use `var(--color-*)` tokens.
- Do not use raw HTML for interactive UI when `@flexcms/ui` components exist.
- Every admin page needs breadcrumb, loading skeleton, and empty state.
- Use named exports for components; no `export default` for components.

## Mandatory validation commands

Use the strongest relevant validation for the role and task. The deterministic router gate should also run these where appropriate.

```bash
cd flexcms && mvn clean compile
cd flexcms && mvn test
cd frontend && pnpm install && pnpm build
```

If backend code changed and Docker is available:

```bash
cd flexcms && docker build -t flexcms-app:local-test .
```

If admin E2E tests exist and the task touches UI behavior:

```bash
cd frontend/apps/admin-e2e && pnpm exec playwright test --project=chromium
```

## Local development

Use the local author profile to bypass external Keycloak during development:

```bash
cd flexcms/flexcms-app
mvn spring-boot:run -Dspring-boot.run.profiles=author,local
```

or use the project CLI from the repo root:

```bash
./flex start local all
```

## Service endpoints

| Service | URL |
|---|---|
| Author API | `http://localhost:8080/api/author/` |
| Headless REST | `http://localhost:8080/api/content/v1/` |
| GraphiQL | `http://localhost:8080/graphiql` |
| Publish API | `http://localhost:8081` |
| Admin UI | `http://localhost:3000` |
| Reference site | `http://localhost:3001` |
| pgAdmin 4 | `http://localhost:5050` |

## Quality policy

- Do not fabricate test evidence, approvals, screenshots, or command results.
- Mocked tests are not enough to accept live functionality.
- Editing functionality must be proven with a live round trip: UI/API edit, persisted data, headless response, and rendered output where applicable.
- Broken images, dummy markup, or uneditable authored data are product defects even if formal build checks pass.

