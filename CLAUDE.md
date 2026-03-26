# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Identity

FlexCMS is an enterprise headless CMS with three independent pillars: **Content (CMS)**, **Digital Assets (DAM)**, and **Products (PIM)**. Backend is Spring Boot 3.3 + Java 21 + PostgreSQL 16 (ltree + JSONB). Frontend is a TypeScript pnpm monorepo (Turborepo) with Next.js 14 and a `@flexcms/ui` design system (Radix + Tailwind + CVA). **The backend NEVER generates HTML — it returns JSON only. All rendering is done by the frontend.**

## Work Board Protocol

**Before starting ANY work, read `WORK_BOARD.md`.** It is the single source of truth: task status, module lock table (prevents two agents from editing the same module), context packets (exactly which files to read), and acceptance criteria.

The workflow for each task:
1. Pick a 🟢 OPEN item (🔴 P0 first), check §2 Module Lock Table for conflicts
2. Update status to 🔵 IN PROGRESS, add your lock entry
3. Read the §4 Context Packet for the task
4. Implement → validate (`mvn clean compile` / TypeScript check) → verify all ACs
5. Update status to ✅ DONE, clear lock, add §5 Completion Note, commit and push

If blocked mid-task: change to 🟠 PAUSED with a detailed handoff note in §5.

**Slash commands automate the full protocol:**
```
/implement     Pick next open task, implement, validate, update board
/pick P1-04    Implement a specific task by ID
/continue      Resume a paused task (reads handoff notes)
/status        Show work board summary
/finish        Complete or pause current task with documentation
/validate      Full build + work board consistency check
```

## Build Commands

```bash
# Flex CLI (recommended — from project root)
flex start local all                    # Start everything (infra + author + publish + admin)
flex start local author                 # Infra + Author only
flex start local author,publish,admin   # Pick services
flex stop local                         # Stop everything
flex status                             # Health-check all services
flex logs author                        # Tail Author log

# Backend — build all modules
cd flexcms && mvn clean install

# Backend — compile only (faster, no tests)
cd flexcms && mvn clean compile

# Backend — run single module tests
cd flexcms/flexcms-core && mvn test

# Backend — run app (author mode)
cd flexcms/flexcms-app && mvn spring-boot:run -Dspring-boot.run.profiles=author,local

# Infrastructure only (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch)
cd flexcms && docker-compose up -d

# Frontend — install all deps
cd frontend && pnpm install

# Frontend — build all packages (dependency order: sdk → adapters → apps)
cd frontend && pnpm build

# Frontend — dev mode admin UI (port 3000)
cd frontend/apps/admin && pnpm dev

# Frontend — typecheck
cd frontend && pnpm tsc --noEmit
```

## Architecture

```
flexcms/                          # Maven multi-module backend
├── flexcms-core/                 # Domain models, JPA repositories, core services
├── flexcms-plugin-api/           # Extension SPI (ComponentModel, CdnProvider, WorkflowStep)
├── flexcms-author/               # Read-write APIs + workflow engine
├── flexcms-publish/              # Read-only JSON page resolver
├── flexcms-headless/             # REST + GraphQL delivery APIs
├── flexcms-dam/                  # Digital asset management (S3/MinIO + renditions)
├── flexcms-replication/          # Author→Publish async replication via RabbitMQ
├── flexcms-cache/                # Redis + Caffeine + HTTP Cache-Control
├── flexcms-cdn/                  # CDN purge SPI + surrogate keys
├── flexcms-i18n/                 # Multi-language + translation workflows
├── flexcms-search/               # Elasticsearch integration
├── flexcms-pim/                  # Product Info Management (own DB: flexcms_pim)
└── flexcms-app/                  # Spring Boot entry point, security config, Flyway migrations

frontend/                         # pnpm + Turborepo monorepo
├── packages/
│   ├── sdk/                      # @flexcms/sdk — framework-agnostic core client + mapper
│   ├── react/                    # @flexcms/react — FlexCmsProvider, FlexCmsPage, hooks
│   ├── vue/                      # @flexcms/vue — plugin, composables
│   └── ui/                       # @flexcms/ui — design system (Button, Input, DataTable, etc.)
└── apps/
    ├── admin/                    # Next.js Admin UI (port 3000)
    ├── site-nextjs/              # Reference site: React SSR (port 3001)
    ├── site-nuxt/                # Reference site: Vue SSR (port 3002)
    └── build-worker/             # Static site compilation worker (Node.js)
```

**Content is a tree:** all content lives as PostgreSQL rows with `ltree` paths (`.` separator, e.g. `content.wknd.en.homepage`). URLs use `/` — conversion happens in controllers. JSONB stores component properties per node.

**Author/Publish separation:** Author (:8080) is read-write; Publish (:8081) is read-only. Changes replicate via RabbitMQ → cache invalidation → CDN purge.

**Backend/Frontend contract:** Every component has a `dataSchema` (JSON Schema) in `component_definitions.data_schema`. Access via `GET /api/content/v1/component-registry`. Frontend renders based on this schema; backend guarantees its output matches.

**PIM is isolated:** `flexcms_pim` is a separate database with its own `DataSource`, Flyway migrations (`flexcms-pim/src/main/resources/db/pim/`), and REST API (`/api/pim/v1/`). Never use the CMS DataSource for PIM queries.

## Key Patterns

- **ComponentModel SPI:** extend `AbstractComponentModel`, annotate fields with `@ValueMapValue`, inject services with `@Autowired`. Register the component type in `component_definitions`.
- **Frontend component:** create React/Vue component, register in `ComponentMapper` in `site-nextjs/src/components/component-map.tsx`.
- **Flyway migrations:** CMS → `flexcms-app/src/main/resources/db/migration/` (V1–V13+). PIM → `flexcms-pim/src/main/resources/db/pim/`. Version numbers must be sequential and never reused.
- **NodeStatus enum:** `DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED` — never `LIVE`.
- **Spring MVC 6 path patterns:** `{*varName}` (catch-all) cannot have subsequent path segments. Use `@RequestParam String path` for non-terminal dynamic paths.
- **Elasticsearch repos:** `@EnableElasticsearchRepositories` in `FlexCmsApplication` must list all packages explicitly: `{"com.flexcms.search.repository", "com.flexcms.pim.search"}`.
- **Local dev auth bypass:** `application-local.yml` sets `flexcms.local-dev=true` → `SecurityConfig` permits all requests and grants `ROLE_ADMIN` to anonymous users (no Keycloak needed locally). Always run with `-Dspring-boot.run.profiles=author,local` for local development.
- **GraphQL `node()` resolver:** uses path directly (no `content.` prefix added). `page()` resolver uses `toContentPath()` which adds `content.` — these are different.

## Code Conventions

### Java
- Package structure: `com.flexcms.{module}.{layer}` (e.g., `com.flexcms.core.service`)
- Layers: `model/` → `repository/` → `service/` → `controller/`
- Use `@Autowired` field injection (existing convention).
- Content paths use `.` as separator (ltree). URLs use `/`. Convert in controllers.
- New dependencies: add to both the module `pom.xml` and parent `pom.xml` dependency management.

### TypeScript / Frontend
- NEVER hardcode colors — use `var(--color-*)` CSS custom property tokens.
- NEVER use raw HTML elements for interactive UI — use `@flexcms/ui` components.
- Every admin page must have: breadcrumb, empty state, loading skeleton.
- Named exports only — no `export default` for components.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities.

### Admin UI Design
**Before implementing ANY admin UI page or component**, look for its reference design in `Design/UI/stitch_flexcms_admin_ui_requirements_summary/<page-name>/`:
- `screen.png` — visual screenshot (read with the image tool)
- `code.html` — reference HTML implementation

Both files MUST be read before writing any UI code. If no matching folder exists, **stop and ask the user for design files**.

## Service Endpoints

| Service | URL |
|---|---|
| Author API | http://localhost:8080/api/author/ |
| Headless REST | http://localhost:8080/api/content/v1/ |
| GraphiQL | http://localhost:8080/graphiql |
| Publish API | http://localhost:8081 |
| Admin UI | http://localhost:3000 |
| Reference Site (React) | http://localhost:3001 |
| Reference Site (Vue) | http://localhost:3002 |
| RabbitMQ Management | http://localhost:15672 (guest/guest) |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin) |
| Elasticsearch | http://localhost:9200 |

## Known Technical Debt

- `SecurityConfig` has `permitAll()` in production profile — placeholder only, not permanent.
- `PageApiController.getChildren()` manually `new ContentNodeService()` instead of DI — this is a bug.
- `ContentNode.getChildren()` via `loadChildrenRecursive()` is an N+1 risk at scale.
- Several list endpoints lack pagination.
- Admin UI pages still use hardcoded mock data — wire to real APIs incrementally.
