# AGENTS.md — FlexCMS AI Agent Quick Reference

> Read **`CLAUDE.md`** and **`WORK_BOARD.md`** first — they are the primary source of truth.
> This file is a compressed reference for AI coding agents to get productive immediately.

---

## Architecture at a Glance

FlexCMS is a **headless-only** CMS: backend returns JSON only, never HTML.

```
Author (8080) ──RabbitMQ──→ Publish (8081) ──→ CDN → Browser
    │                           │
    ▼                           ▼
PostgreSQL (ltree+JSONB)    Redis + Caffeine
```

Three pillars share the Spring Boot monorepo: **CMS** (content tree), **DAM** (assets), **PIM** (products in separate DB `flexcms_pim`).

---

## Before Any Implementation

1. `cat WORK_BOARD.md` — check §2 Module Lock Table, §3 Task Status, §5 Handoff Notes
2. Lock modules in §2 before editing any file
3. Read §4 Context Packet for your task (lists exact files to read first)
4. **Never start coding before reading the current source** — another agent may have changed it

---

## Mandatory Build Gates (every task)

```bash
# Backend compile (must pass — no exceptions)
cd flexcms && mvn clean compile

# Backend unit tests
cd flexcms && mvn test

# Frontend (must pass)
cd frontend && pnpm build
```

Commit format: `feat(P2-01): description` or `fix(BUG-03): description`

---

## Layer Rules (violations = tech debt)

| Layer | What lives here | What NEVER lives here |
|---|---|---|
| `model/` | JPA entities, enums | Business logic |
| `repository/` | Spring Data interfaces + JPQL | Service calls |
| `service/` | All business logic, `@Transactional` | HTTP/controllers |
| `controller/` | Request mapping, DTO→service | Repository calls, business logic |

- Controllers call services. Services call repositories. Never skip a layer.
- Return DTOs/projections from APIs, not raw JPA entities.
- `FetchType.EAGER` is forbidden — fix the session boundary instead.

---

## Content Path Convention

- Database (ltree): dot-separated — `content.site.en.home`
- URLs: slash-separated — `/site/en/home`
- `PathUtils.toContentPath(urlPath)` converts URL → ltree (adds `content.` prefix)
- **`GET /api/author/content/children`** accepts ltree path directly (no conversion)
- **GraphQL `node()`** uses path verbatim (no `content.` prefix added)
- **GraphQL `page()`** uses `toContentPath()` (adds `content.` prefix)

---

## Key Files for Each Pillar

### CMS (Content)
- Model: `flexcms-core/…/model/ContentNode.java`
- Service: `flexcms-core/…/service/ContentNodeService.java`
- Author API: `flexcms-author/…/controller/AuthorContentController.java`
- Headless API: `flexcms-headless/…/controller/PageApiController.java`
- GraphQL: `flexcms-headless/…/graphql/ContentQueryResolver.java`

### DAM
- Service: `flexcms-dam/…/service/AssetIngestService.java`
- Author API: `flexcms-author/…/controller/AuthorAssetController.java`

### PIM (isolated DB)
- Service: `flexcms-pim/…/service/ProductService.java`
- API: `flexcms-pim/…/controller/ProductApiController.java`
- **Always use PIM's own DataSource** — never the CMS `DataSource`

---

## Flyway Migration Rules

- CMS migrations: `flexcms-app/src/main/resources/db/migration/V{N}__description.sql`
- PIM migrations: `flexcms-pim/src/main/resources/db/pim/V{N}__description.sql`
- Version numbers must be sequential and **never reused**
- Check existing files for next version number before creating a new migration

---

## NodeStatus Enum

Valid values only: `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`
**Never use `LIVE`** — it does not exist in the enum.

---

## Admin UI Rules

1. Look for reference design in `Design/UI/stitch_flexcms_admin_ui_requirements_summary/<page-name>/` before writing any UI
2. **Never hardcode colors** — use `var(--color-*)` CSS tokens
3. **Never use raw HTML for interactive UI** — use `@flexcms/ui` components
4. Every admin page needs: breadcrumb, loading skeleton, empty state
5. Named exports only — no `export default` for components

---

## Local Dev Auth Bypass

Run with `-Dspring-boot.run.profiles=author,local` — this sets `flexcms.local-dev=true` which bypasses OAuth2/Keycloak and grants `ROLE_ADMIN` to anonymous users. No Keycloak required for local development.

---

## Service Endpoints

| Service | URL |
|---|---|
| Author API | http://localhost:8080/api/author/ |
| Headless REST | http://localhost:8080/api/content/v1/ |
| GraphiQL | http://localhost:8080/graphiql |
| Publish API | http://localhost:8081 |
| Admin UI | http://localhost:3000 |
| pgAdmin 4 | http://localhost:5050 (no login; DB password: `flexcms`) |

---

## Component Model SPI

To add a new backend component:
1. Extend `AbstractComponentModel`, annotate fields with `@ValueMapValue`
2. Annotate with `@FlexCmsComponent` → auto-registered in `ComponentRegistry`
3. Register the frontend renderer in `component-map.tsx`
4. Add a `component_definitions` row (Flyway migration) with the `data_schema` JSONB

---

## Common Gotchas

- Spring MVC 6: catch-all path variable `{*varName}` cannot have subsequent path segments — use `@RequestParam String path` instead
- `@EnableElasticsearchRepositories` must list ALL packages explicitly: `{"com.flexcms.search.repository", "com.flexcms.pim.search"}`
- Content path double-prefix bug: `AuthorContentController.getChildren()` does NOT call `toContentPath()` to avoid `content.content.*` — this is intentional
- PIM tests: `**/*IT.java` are excluded from `mvn test` (require Docker) — run explicitly with `-Dtest=ProductRepositoryIT`

