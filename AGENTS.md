# AGENTS.md — FlexCMS Dark Factory Agent Reference

> **Primary workflow: Dark Factory.** Run the SDLC exactly as defined in `df/`.
> `DF-master/` is the reusable upstream example only; this repository's active
> runtime is `df/runtime/` and task evidence lives in `df/artifacts/{task-id}/`.
>
> The old `WORK_BOARD_*.md`, Kyle/Erik flow, and `agents/queue.json` dispatcher are
> historical/legacy unless a human explicitly asks for legacy inspection. For new
> work, use Dark Factory role states, role files, runtime board, evidence, QA gate,
> and PO acceptance.

## Dark Factory boot sequence — mandatory

Before starting or continuing work, read in this order:

1. `df/00-start-here.md`
2. `df/01-operating-model.md`
3. `df/02-state-machine.md`
4. `df/03-orchestration-rules.md`
5. `df/04-documentation-standards.md`
6. the responsible role file in `df/roles/`
7. `df/runtime/board.md` plus relevant subboards
8. `docs/FLEXCMS_BUSINESS_CONTEXT.md` for product-specific rules

## Required behavior

- Execute exactly **one Dark Factory role per session**.
- Update runtime evidence on every meaningful action.
- Write task artifacts under `df/artifacts/{task-id}/`.
- Do not finish work unless `qa` has passed it and `po` has accepted it.
- If work is rejected, return it to the responsible role/lane with evidence and defects.
- Preserve user work and prefer minimal, reversible changes.

## Dark Factory commands

```bash
./start factory --dry-run              # show the next role-session plan
./start factory --adapter manual       # prepare one role-session prompt
./start factory                        # autonomous router; requires DF_AGENT_CMD
./flex agent run                       # FlexCMS shortcut to Dark Factory router
./flex agent validate                  # deterministic FlexCMS build/test gate
./flex agent legacy status             # inspect the old agents/queue.json dispatcher
```

Legacy implementation details for the old dispatcher are in `agents/FACTORY.md`.
Use them only for migration/troubleshooting, not as the active SDLC source.

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

1. Complete the Dark Factory boot sequence and identify the responsible role from `df/runtime/board.md`.
2. Read the role file in `df/roles/` and the task artifact under `df/artifacts/{task-id}/`.
3. For delivery lanes, use the router/worktree isolation when available; do not hand-edit legacy module locks.
4. **Never start coding before reading the current source** — another role-session may have changed it.
5. Record evidence and handoff notes in `df/runtime/` and `df/artifacts/{task-id}/` before ending the role session.

---

## Mandatory Build Gates (every task)

> **⛔ NEVER push to GitHub until ALL of these pass locally. No exceptions.**

```bash
# 1. Backend compile (must pass — no exceptions)
cd flexcms && mvn clean compile

# 2. Backend unit tests (must pass — never skip or @Ignore)
cd flexcms && mvn test

# 3. Frontend build (must pass)
cd frontend && pnpm install && pnpm build

# 4. Docker image build (if backend code changed)
cd flexcms && docker build -t flexcms-app:local-test .
# Skip ONLY if changes are frontend-only
```

**If ANY step fails → fix it locally. Do NOT push broken code.**
If you cannot fix after 3 attempts → move the task to the appropriate Dark Factory blocked/rework state and document the exact blocker in `df/runtime/activity-log.md` plus `df/artifacts/{task-id}/handoffs.md`.

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

