# AGENTS.md — FlexCMS guide for AI agents

This file is the entry point for **every** AI coding agent (Claude Code, Cursor, Codex, JetBrains AI, …) and for humans who work like one. `CLAUDE.md` imports this file, so there is only one set of rules.

## Start here (every session)

1. **Find the work:** open [`backlog/BOARD.md`](backlog/BOARD.md), the only source of task status.
2. **Know the process:** [`docs/process/SDLC.md`](docs/process/SDLC.md) covers the lifecycle, how to pick a task, and the Definitions of Ready and Done.
3. **Know the testing bar:** [`docs/process/TESTING.md`](docs/process/TESTING.md). Every feature ships with Playwright tests that prove its acceptance criteria.
4. **Avoid known dead ends:** skim [`docs/process/HINTS.md`](docs/process/HINTS.md) for the stack you will touch.
5. **Read the task spec** `backlog/tasks/<ID>.md` and every file in its `Read first` list, then read the current source.

## Commands

When the user types one of these words, with or without a leading `/`, do exactly this. In Claude Code, these are also slash commands (`.claude/commands/`).

| Command | What to do |
|---|---|
| `implement` | Pick the next task using [SDLC §3](docs/process/SDLC.md#3-picking-the-next-task): resume **In Progress**, else the first **Ready** task with its dependencies **Done**, else refine the first eligible **Needs Refinement** task. Then carry it to **Done** ([SDLC §5](docs/process/SDLC.md#5-implementation-workflow)). Afterwards, report the result and stop, unless the user asked you to keep going. |
| `pick <ID>` | Same as `implement`, but for that task. Refuse to build it if a dependency is not **Done**, and say which one. |
| `new-task <description>` | Draft the task(s) from [`backlog/templates/`](backlog/templates/), show them, and write them to the backlog only after the user confirms ([SDLC §8](docs/process/SDLC.md#8-adding-new-work)). |
| `status` | Summarize `BOARD.md`: counts per status, what is **In Progress**, the next 5 eligible **Ready** tasks, **Blocked** tasks and their questions, and anomalies such as a Ready task with a missing spec or a Done task with unticked ACs. |
| `validate` | Run every quality gate ([TESTING.md §7](docs/process/TESTING.md#7-quality-gates)), check backlog consistency (every board row has a spec, every spec has a row, no two tasks In Progress, Done tasks have every **Automated in** filled), and report PASS/FAIL per item with the fix for each failure. |

---

## Project identity

FlexCMS is an enterprise **headless** CMS with three independent pillars: **Content (CMS)**, **Digital Assets (DAM)**, and **Products (PIM)**.

- **Backend:** Spring Boot 3.3, Java 21, PostgreSQL 16 (ltree + JSONB), Redis, RabbitMQ, MinIO/S3, Elasticsearch. **The backend never generates HTML. It returns JSON only, and all rendering happens in the frontend.**
- **Frontend:** a TypeScript pnpm + Turborepo monorepo with Next.js 14 (admin and reference site), Nuxt (reference site), and the `@flexcms/ui` design system (Radix + Tailwind + CVA).
- **Product rules and domain context:** [`docs/product/BUSINESS_CONTEXT.md`](docs/product/BUSINESS_CONTEXT.md).

```
Author (:8080, read-write) ──RabbitMQ──► Publish (:8081, read-only) ──► CDN ──► Browser
        │                                      │
        ▼                                      ▼
PostgreSQL (ltree + JSONB)              Redis + Caffeine
```

## Repository map

```
AGENTS.md / CLAUDE.md             # agent rules (this file)
backlog/                          # BOARD.md (status), tasks/<ID>.md (specs), designs/, templates/
docs/
├── process/                      # SDLC.md, TESTING.md, HINTS.md
├── architecture/                 # DECISIONS.md (architecture decision log)
├── product/                      # business context, XF guide, client guide, ECMS gap analysis
├── ops/                          # deployment, dev-environment reliability, QA env status
└── testing/                      # test data spec, manual authoring test catalogue
Design/UI/stitch_flexcms_admin_ui_requirements_summary/<page>/   # reference admin UI designs
flexcms/                          # Maven multi-module backend
├── flexcms-core/                 # domain models, JPA repositories, core services
├── flexcms-plugin-api/           # extension SPI (ComponentModel, CdnProvider, WorkflowStep)
├── flexcms-author/               # read-write APIs + workflow engine
├── flexcms-publish/              # read-only JSON page resolver
├── flexcms-headless/             # REST + GraphQL delivery APIs
├── flexcms-dam/                  # digital asset management (S3/MinIO + renditions)
├── flexcms-replication/          # author → publish replication via RabbitMQ
├── flexcms-cache/  flexcms-cdn/  # Redis/Caffeine/HTTP caching, CDN purge SPI
├── flexcms-i18n/  flexcms-multisite/  flexcms-search/  flexcms-clientlibs/
├── flexcms-pim/                  # product information management (own DB: flexcms_pim)
└── flexcms-app/                  # Spring Boot entry point, security, CMS Flyway migrations
frontend/
├── packages/  sdk/ react/ vue/ ui/ site-renderers/
└── apps/
    ├── admin/                    # Next.js admin UI (:3000)
    ├── site-nextjs/  site-nuxt/  # reference sites (:3001 / :3002)
    ├── build-worker/             # static site compilation worker
    ├── e2e/                      # Playwright suite — ui / api / e2e / a11y / visual
    └── selenium-e2e/             # LEGACY, frozen — being ported to Playwright
scripts/                          # seeding and import scripts (Python)
infra/                            # deployment infrastructure
flex, flex.ps1, flex.cmd          # local dev CLI
```

## Build, run, test

```bash
# Local stack — `flex` CLI from the repo root (Windows: flex.cmd / flex.ps1)
flex start local all                    # infra + author + publish + admin + sites
flex start local author                 # infra + author only
flex status                             # health of every service
flex logs author                        # tail a service log
flex stop local

# Backend
cd flexcms && mvn clean compile         # compile all modules
cd flexcms && mvn test                  # unit tests
cd flexcms && mvn verify                # unit + *IT integration tests (Docker required)
cd flexcms/flexcms-app && mvn spring-boot:run -Dspring-boot.run.profiles=author,local

# Frontend
cd frontend && pnpm install && pnpm build   # dependency order: sdk → adapters → apps
cd frontend && pnpm test                    # Vitest unit tests
cd frontend/apps/admin && pnpm dev          # admin dev server (:3000)

# Playwright (details: docs/process/TESTING.md §6)
cd frontend && pnpm test:e2e                # mocked admin UI, no backend needed
cd frontend && pnpm test:e2e:live           # api + e2e + ui-live against the running stack
cd frontend/apps/e2e && pnpm exec playwright test --grep @ECMS-01   # one task's tests
```

| Service | URL |
|---|---|
| Author API | http://localhost:8080/api/author/ |
| Headless REST | http://localhost:8080/api/content/v1/ |
| GraphiQL | http://localhost:8080/graphiql |
| Publish | http://localhost:8081 |
| Admin UI | http://localhost:3000 |
| Reference site (React / Vue) | http://localhost:3001 / http://localhost:3002 |
| RabbitMQ | http://localhost:15672 (guest/guest) |
| MinIO console | http://localhost:9001 (minioadmin/minioadmin) |
| Elasticsearch | http://localhost:9200 |
| pgAdmin | http://localhost:5050 (no login; DB password `flexcms`) |

**Local auth bypass:** run the backend with the `author,local` profiles. `application-local.yml` sets `flexcms.local-dev=true`, so `SecurityConfig` permits every request and grants `ROLE_ADMIN` to anonymous users. Keycloak is not needed locally.

---

## Engineering rules

### Architecture over speed

**Never choose a faster or shorter implementation over the architecturally correct one.** Before writing code, ask three questions:

1. Does this follow the layer separation?
2. Does it bypass a pattern already present in the codebase?
3. Would a senior engineer on this project call it production quality?

If the correct approach takes longer, do it anyway.

| Layer | Contains | Never contains |
|---|---|---|
| `model/` | JPA entities, enums | Business logic |
| `repository/` | Spring Data interfaces, JPQL/native queries | Service calls |
| `service/` | All business logic, `@Transactional` on writes | HTTP concerns |
| `controller/` | Request mapping, DTO ↔ service | Repository calls, business logic |

- Controllers call services, and services call repositories. Never skip a layer.
- Return **DTOs or projections** from APIs, never raw JPA entities.
- **`FetchType.EAGER` is forbidden.** Fix the session/transaction boundary instead. Do not paper over a problem with `@JsonIgnore` or `JOIN FETCH` without understanding why the boundary is wrong.
- Every write operation runs in a transaction.
- Errors are RFC 7807 problem responses via `GlobalExceptionHandler` and the existing exception types. User errors are never HTTP 500.
- Do not duplicate code to avoid a refactor. Extract and reuse.

### Java conventions

- Packages follow `com.flexcms.{module}.{layer}`, for example `com.flexcms.core.service`.
- `@Autowired` field injection is the existing convention.
- A new dependency goes in the module `pom.xml` **and** in the parent `pom.xml` dependency management.

### Content paths

- **Database (ltree):** dot-separated, e.g. `content.site.en.home`. **URLs:** slash-separated, e.g. `/site/en/home`. Controllers convert between the two.
- `PathUtils.toContentPath(urlPath)` converts a URL path to ltree and adds the `content.` prefix.
- `GET /api/author/content/children` takes an ltree path directly and does not convert it. This is intentional: it avoids a `content.content.*` double prefix.
- GraphQL `node()` uses the path verbatim. GraphQL `page()` uses `toContentPath()`, which adds `content.`.

### Data and migrations

- **CMS Flyway migrations:** `flexcms-app/src/main/resources/db/migration/V{N}__description.sql`. **PIM migrations:** `flexcms-pim/src/main/resources/db/pim/V{N}__description.sql`. Versions are sequential and never reused, so check the existing files first.
- **PIM is isolated.** Its database is `flexcms_pim`, with its own `DataSource`. Never use the CMS `DataSource` for PIM.
- **`NodeStatus`:** `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`. There is **no** `LIVE`.
- **Seed resets are opt-in and environment-guarded.** Tests never modify seeded data.

### Components (backend ↔ frontend contract)

- Every component has a `dataSchema` (JSON Schema) in `component_definitions.data_schema`, served by `GET /api/content/v1/component-registry`. The frontend renders from that schema, and the backend guarantees its output matches it.
- **To add a backend component:** extend `AbstractComponentModel`, annotate fields with `@ValueMapValue`, annotate the class with `@FlexCmsComponent`, and add a `component_definitions` row (Flyway) with its `data_schema`.
- **To add a frontend renderer:** register it in `frontend/apps/site-nextjs/src/components/component-map.tsx`, and in the Vue map when the Nuxt site needs it.

### Frontend and admin UI

- **Never hardcode colors.** Use the `var(--color-*)` tokens.
- **Never use raw HTML elements for interactive UI.** Use `@flexcms/ui` components.
- Every admin page has a **breadcrumb**, a **loading skeleton**, and an **empty state**.
- Use named exports only; no `export default` for components. Components are `PascalCase.tsx`; utilities are `camelCase.ts`.
- **Before building any admin UI,** read `Design/UI/stitch_flexcms_admin_ui_requirements_summary/<page>/screen.png` and `code.html`. If there is no reference, the task's `## UI design` section is the spec. It is written during refinement, and you should match the nearest existing screen.

### Code quality

- No mock or dummy data in production code. Mock data belongs in tests only.
- No `System.out.println` or `console.log` debugging, and no commented-out code blocks.

### Gotchas

- **Spring MVC 6:** a catch-all `{*varName}` cannot be followed by more path segments. Use `@RequestParam String path` for non-terminal dynamic paths.
- **`@EnableElasticsearchRepositories`** in `FlexCmsApplication` must list every package: `{"com.flexcms.search.repository", "com.flexcms.pim.search"}`.
- **`mvn test` runs no `*IT` suites.** Surefire matches `*Test`, `Test*` and `*Tests` only. Integration tests run with `mvn verify` (failsafe, Testcontainers, Docker required).
- **Technical debt:** `SecurityConfig` has `permitAll()` in the production profile. It is a placeholder, not permanent.
- More problems and their fixes are in [`docs/process/HINTS.md`](docs/process/HINTS.md). Add a hint whenever something took two or more failed attempts to solve.
