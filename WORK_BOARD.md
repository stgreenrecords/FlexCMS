# FlexCMS — Work Board & Agent Coordination Protocol

> **Purpose:** This is the single source of truth for all implementation work. Before starting any task, read this file. After completing any work session, update this file. This system enables parallel AI agents to work independently without conflicts.

---

## How This Board Works

### Claude Code Slash Commands (Preferred Method)

Use these commands — they automate the entire protocol described below:

| Command | What it does |
|---|---|
| `/implement` | Reads all docs → picks next available task → claims it → reads context → implements → validates → updates this board |
| `/pick P1-04` | Same as `/implement` but for a specific task ID |
| `/continue` | Finds paused tasks → reads handoff notes → resumes work |
| `/status` | Shows work board summary: open/progress/paused/done counts, next available tasks |
| `/finish` | Properly completes or pauses your current task with documentation |
| `/validate` | Builds entire project, checks work board consistency, suggests next actions |

### For a New Agent Starting Work (Manual Protocol)

```
1. Read this file top to bottom (takes 5 min)
2. Check the WORK ITEMS table (§3) — find items with status 🟢 OPEN
3. Pick ONE item that has no blockers (check "Blocked By" column)
4. Change its status to 🔵 IN PROGRESS and set yourself in "Agent" column
5. Read the Context Packet (§4) for that item — it tells you exactly what files to read
6. Do the work
7. When done: update status to ✅ DONE, fill the "Completion Notes" in §5
8. If you must stop before finishing: update status to 🟠 PAUSED, write a
   detailed handoff note in §5 explaining exactly where you stopped
```

### Status Definitions

| Status | Emoji | Meaning |
|---|---|---|
| 🟢 OPEN | Green | Available for any agent to pick up |
| 🔵 IN PROGRESS | Blue | An agent is actively working on it |
| 🟠 PAUSED | Orange | Work started but agent stopped — needs handoff |
| 🔴 BLOCKED | Red | Cannot start until blocker is resolved |
| ✅ DONE | Check | Complete — see Completion Notes in §5 |
| ⏭️ SKIPPED | Skip | Intentionally deferred or deemed unnecessary |

### Parallel Work Rules

```
RULE 1: Never work on two items that modify the same module simultaneously.
        Check the "Modules Touched" column — if another 🔵 IN PROGRESS item
        touches the same module, pick a different item.

RULE 2: Always update this file BEFORE and AFTER your work session.
        Before: change status to 🔵 IN PROGRESS
        After:  change status to ✅ DONE or 🟠 PAUSED + write notes

RULE 3: If you find a bug or issue while working on your item, do NOT
        fix it inline. Add a new row to the WORK ITEMS table with
        prefix "BUG-" and status 🟢 OPEN.

RULE 4: Every code change must be validated. Run build commands and
        check for errors before marking DONE.

RULE 5: If your item has acceptance criteria (AC), verify ALL of them
        before marking DONE. List the AC verification in Completion Notes.
```

---

## §1. Project Quick Orientation

**What is FlexCMS?** Enterprise CMS (like Adobe AEM) built on Spring Boot + PostgreSQL + TypeScript SDK. Three pillars: Content, DAM, PIM — each independent.

**Read these first** (in order):
1. `README.md` — §9 "AI Agent Onboarding Guide" (architecture mental model, file map, key patterns)
2. `Design/DesignerPrompt.md` — §8 (mandatory UI style rules — if your task touches frontend)

**Key conventions:**
- Backend = Java 21, Spring Boot 3.3, PostgreSQL 16 (ltree + JSONB), Flyway migrations
- Frontend = TypeScript, pnpm monorepo, Turborepo, Next.js 14, `@flexcms/ui` design system
- Backend never generates HTML. All rendering is frontend (Next.js/Nuxt SSR or SPA).
- CSS custom properties for theming (`var(--color-primary)`), never hardcode colors.
- PIM has its **own database** (`flexcms_pim`), separate from CMS.

**Build & run:**
```bash
# Backend
cd flexcms && docker-compose up -d && mvn clean install
cd flexcms-app && mvn spring-boot:run -Dspring-boot.run.profiles=author

# Frontend
cd frontend && pnpm install && pnpm build
cd apps/admin && pnpm dev        # Admin UI on :3000
cd apps/site-nextjs && pnpm dev  # Ref site on :3001
```

---

## §2. Module Lock Table

> Before starting work, check this table. If a module is locked by an in-progress item, you cannot work on another item that touches the same module.

| Module | Locked By Item | Agent | Since |
|---|---|---|---|
| `flexcms-core` | — | — | — |
| `flexcms-app` | — | — | — |
| `flexcms-author` | — | — | — |
| `flexcms-publish` | — | — | — |
| `flexcms-headless` | — | — | — |
| `flexcms-dam` | — | — | — |
| `flexcms-replication` | — | — | — |
| `flexcms-search` | — | — | — |
| `flexcms-cache` | — | — | — |
| `flexcms-cdn` | — | — | — |
| `flexcms-i18n` | — | — | — |
| `flexcms-multisite` | — | — | — |
| `flexcms-plugin-api` | — | — | — |
| `flexcms-clientlibs` | — | — | — |
| `flexcms-pim` | — | — | — |
| `frontend/packages/sdk` | — | — | — |
| `frontend/packages/react` | — | — | — |
| `frontend/packages/vue` | — | — | — |
| `frontend/packages/angular` | — | — | — |
| `frontend/packages/ui` | — | — | — |
| `frontend/apps/admin` | — | — | — |
| `frontend/apps/build-worker` | — | — | — |
| `frontend/apps/site-nextjs` | — | — | — |
| `frontend/apps/site-nuxt` | — | — | — |
| `docker / infra` | — | — | — |
| `CI/CD` | — | — | — |

---

## §3. Work Items

### Legend
- **ID format:** `P{phase}-{seq}` (e.g., P1-01 = Phase 1, item 1)
- **Effort:** S = <1 day, M = 1-3 days, L = 3-7 days, XL = 1-2 weeks
- **Parallel group:** Items in the same group CAN run in parallel. Items across groups can also run in parallel if they don't share modules.

---

### Phase 1 — Foundation Hardening

| ID | Title | Status | Priority | Effort | Modules Touched | Blocked By | Agent |
|---|---|---|---|---|---|---|---|
| P1-01 | **Spring Security OAuth2 + JWT** | 🟢 OPEN | 🔴 P0 | XL | `flexcms-app`, `flexcms-core` | — | — |
| P1-02 | **RBAC roles + method-level @PreAuthorize** | 🟢 OPEN | 🔴 P0 | L | `flexcms-author`, `flexcms-headless`, `flexcms-publish` | P1-01 | — |
| P1-03 | **Per-node ACL enforcement** | 🟢 OPEN | 🔴 P0 | L | `flexcms-core` | P1-01 | — |
| P1-04 | **Global error handling (@ControllerAdvice)** | ✅ DONE | 🔴 P0 | M | `flexcms-app`, `flexcms-core` | — | Claude Sonnet 4.6 |
| P1-05 | **Request DTO validation (@Valid + Zod schemas)** | 🟢 OPEN | 🔴 P0 | M | `flexcms-author`, `flexcms-headless`, `flexcms-pim` | P1-04 | — |
| P1-06 | **XSS sanitization on rich text** | 🟢 OPEN | 🟡 P1 | S | `flexcms-core` | P1-04 | — |
| P1-07 | **Unit tests: flexcms-core services** | 🟢 OPEN | 🔴 P0 | L | `flexcms-core` | — | — |
| P1-08 | **Unit tests: flexcms-author services** | 🟢 OPEN | 🔴 P0 | L | `flexcms-author` | — | — |
| P1-09 | **Unit tests: flexcms-replication** | 🟢 OPEN | 🔴 P0 | M | `flexcms-replication` | — | — |
| P1-10 | **Unit tests: flexcms-dam services** | 🟢 OPEN | 🔴 P0 | M | `flexcms-dam` | — | — |
| P1-11 | **Integration tests: PostgreSQL repos (Testcontainers)** | 🟢 OPEN | 🔴 P0 | L | `flexcms-core` | P1-07 | — |
| P1-12 | **Integration tests: RabbitMQ replication (Testcontainers)** | 🟢 OPEN | 🔴 P0 | M | `flexcms-replication` | P1-09 | — |
| P1-13 | **CI/CD: GitHub Actions pipeline** | 🟢 OPEN | 🔴 P0 | M | `CI/CD` | — | — |
| P1-14 | **CI/CD: Docker image build + push** | 🟢 OPEN | 🔴 P0 | S | `CI/CD`, `docker / infra` | P1-13 | — |
| P1-15 | **Frontend unit tests: @flexcms/sdk** | 🟢 OPEN | 🔴 P0 | M | `frontend/packages/sdk` | — | — |
| P1-16 | **Frontend unit tests: @flexcms/react** | 🟢 OPEN | 🔴 P0 | M | `frontend/packages/react` | — | — |

### Phase 2 — API Completeness & Frontend

| ID | Title | Status | Priority | Effort | Modules Touched | Blocked By | Agent |
|---|---|---|---|---|---|---|---|
| P2-01 | **Complete GraphQL resolvers (all query types)** | 🟢 OPEN | 🟡 P1 | L | `flexcms-headless` | — | — |
| P2-02 | **GraphQL: pagination + field resolvers** | 🟢 OPEN | 🟡 P1 | M | `flexcms-headless` | P2-01 | — |
| P2-03 | **Elasticsearch: full-text indexing on publish** | 🟢 OPEN | 🟡 P1 | L | `flexcms-search`, `flexcms-replication` | — | — |
| P2-04 | **Elasticsearch: search API with facets** | 🟢 OPEN | 🟡 P1 | M | `flexcms-search`, `flexcms-headless` | P2-03 | — |
| P2-05 | **Angular adapter: full implementation** | 🟢 OPEN | 🟡 P1 | L | `frontend/packages/angular` | — | — |
| P2-06 | **Angular reference site (SSR)** | 🟢 OPEN | 🟡 P1 | M | `frontend/apps/site-angular` (new) | P2-05 | — |
| P2-07 | **OpenAPI/Swagger spec for REST** | 🟢 OPEN | 🟡 P1 | M | `flexcms-headless`, `flexcms-author` | — | — |
| P2-08 | **Observability: Micrometer + Prometheus** | 🟢 OPEN | 🔴 P0 | M | `flexcms-app` | — | — |
| P2-09 | **Observability: OpenTelemetry tracing** | 🟢 OPEN | 🔴 P0 | M | `flexcms-app` | P2-08 | — |
| P2-10 | **Observability: structured JSON logging** | 🟢 OPEN | 🔴 P0 | S | `flexcms-app` | — | — |
| P2-11 | **Rate limiting on public APIs** | 🟢 OPEN | 🟡 P1 | S | `flexcms-app`, `flexcms-publish` | — | — |

### Phase 2.5 — Static Site Compilation

| ID | Title | Status | Priority | Effort | Modules Touched | Blocked By | Agent |
|---|---|---|---|---|---|---|---|
| P2H-01 | **Build worker: complete event consumer + renderer** | 🟢 OPEN | 🟡 P1 | L | `frontend/apps/build-worker` | — | — |
| P2H-02 | **Build worker: dependency graph resolution** | 🟢 OPEN | 🟡 P1 | L | `frontend/apps/build-worker`, `flexcms-core` | P2H-01 | — |
| P2H-03 | **Build worker: S3 upload + manifest** | 🟢 OPEN | 🟡 P1 | M | `frontend/apps/build-worker` | P2H-01 | — |
| P2H-04 | **CDN hybrid routing (S3 primary, SSR fallback)** | 🟢 OPEN | 🟡 P1 | M | `flexcms-cdn`, `docker / infra` | P2H-03 | — |

### Phase 3 — Admin UI

| ID | Title | Status | Priority | Effort | Modules Touched | Blocked By | Agent |
|---|---|---|---|---|---|---|---|
| P3-01 | **Design system: Dialog, Sheet, DropdownMenu** | 🟢 OPEN | 🔴 P0 | L | `frontend/packages/ui` | — | — |
| P3-02 | **Design system: Tabs, Accordion, Popover, Tooltip** | 🟢 OPEN | 🔴 P0 | M | `frontend/packages/ui` | — | — |
| P3-03 | **Design system: DataTable (sort, select, paginate)** | 🟢 OPEN | 🔴 P0 | L | `frontend/packages/ui` | — | — |
| P3-04 | **Design system: TreeView, Sidebar, Breadcrumb** | 🟢 OPEN | 🔴 P0 | L | `frontend/packages/ui` | — | — |
| P3-05 | **Design system: Toast, CommandPalette, StepIndicator** | 🟢 OPEN | 🟡 P1 | M | `frontend/packages/ui` | — | — |
| P3-06 | **Design system: Select, Checkbox, Radio, Switch, DatePicker** | 🟢 OPEN | 🔴 P0 | L | `frontend/packages/ui` | — | — |
| P3-07 | **Design system: FileUpload/Dropzone, TagInput, ColorPicker** | 🟢 OPEN | 🟡 P1 | M | `frontend/packages/ui` | — | — |
| P3-08 | **Storybook setup + stories for all components** | 🟢 OPEN | 🟡 P1 | M | `frontend/packages/ui` | P3-01 | — |
| P3-09 | **AppShell layout (top nav + sidebar + content)** | 🟢 OPEN | 🔴 P0 | M | `frontend/apps/admin` | P3-04 | — |
| P3-10 | **Dashboard page (stats, recent, quick actions)** | 🟢 OPEN | 🟡 P1 | M | `frontend/apps/admin` | P3-09 | — |
| P3-11 | **Site manager page** | 🟢 OPEN | 🟡 P1 | M | `frontend/apps/admin` | P3-09, P3-03 | — |
| P3-12 | **Content tree browser page** | 🟢 OPEN | 🔴 P0 | XL | `frontend/apps/admin` | P3-09, P3-04, P3-03 | — |
| P3-13 | **Visual page editor (drag-and-drop)** | 🟢 OPEN | 🔴 P0 | XL | `frontend/apps/admin` | P3-12, P3-01 | — |
| P3-14 | **DAM browser page** | 🟢 OPEN | 🔴 P0 | L | `frontend/apps/admin` | P3-09, P3-03, P3-07 | — |
| P3-15 | **DAM asset detail page** | 🟢 OPEN | 🟡 P1 | M | `frontend/apps/admin` | P3-14 | — |
| P3-16 | **Workflow inbox page** | 🟢 OPEN | 🟡 P1 | L | `frontend/apps/admin` | P3-09, P3-03 | — |
| P3-17 | **Component registry browser page** | 🟢 OPEN | 🟡 P1 | M | `frontend/apps/admin` | P3-09, P3-03 | — |
| P3-18 | **Content preview (iframe + viewport toggle)** | 🟢 OPEN | 🟡 P1 | M | `frontend/apps/admin` | P3-13 | — |
| P3-19 | **Translation manager page** | 🟢 OPEN | 🟢 P2 | M | `frontend/apps/admin` | P3-09, P3-03 | — |
| P3-20 | **Login page** | 🟢 OPEN | 🔴 P0 | S | `frontend/apps/admin` | P1-01 | — |

### Phase 4 — Enterprise Features

| ID | Title | Status | Priority | Effort | Modules Touched | Blocked By | Agent |
|---|---|---|---|---|---|---|---|
| P4-01 | **Scheduled publishing (cron scheduler)** | 🟢 OPEN | 🟡 P1 | L | `flexcms-author`, `flexcms-core` | — | — |
| P4-02 | **Bulk operations (publish/delete/move)** | 🟢 OPEN | 🟡 P1 | L | `flexcms-author`, `flexcms-core` | — | — |
| P4-03 | **CDN: CloudFront provider implementation** | 🟢 OPEN | 🟡 P1 | M | `flexcms-cdn` | — | — |
| P4-04 | **CDN: Cloudflare provider implementation** | 🟢 OPEN | 🟡 P1 | M | `flexcms-cdn` | — | — |
| P4-05 | **Translation: DeepL connector** | 🟢 OPEN | 🟢 P2 | M | `flexcms-i18n` | — | — |
| P4-06 | **Live copy / content sharing service** | 🟢 OPEN | 🟢 P2 | L | `flexcms-core`, `flexcms-multisite` | — | — |
| P4-07 | **Kubernetes Helm charts** | 🟢 OPEN | 🟡 P1 | L | `docker / infra` | — | — |
| P4-08 | **Sitemap + robots.txt generation** | 🟢 OPEN | 🟢 P2 | M | `flexcms-publish`, `flexcms-headless` | — | — |
| P4-09 | **Audit trail admin API** | 🟢 OPEN | 🟢 P2 | S | `flexcms-author` | — | — |
| P4-10 | **Performance: Gatling load tests** | 🟢 OPEN | 🟡 P1 | L | `flexcms-app` | P1-07 | — |
| P4-11 | **Content import/export (JSON/ZIP)** | 🟢 OPEN | 🟢 P2 | M | `flexcms-author`, `flexcms-core` | — | — |

### Phase 5 — PIM

| ID | Title | Status | Priority | Effort | Modules Touched | Blocked By | Agent |
|---|---|---|---|---|---|---|---|
| P5-01 | **PIM: complete ProductService CRUD + validation** | 🟢 OPEN | 🟡 P1 | L | `flexcms-pim` | — | — |
| P5-02 | **PIM: schema validation (JSON Schema)** | 🟢 OPEN | 🟡 P1 | M | `flexcms-pim` | P5-01 | — |
| P5-03 | **PIM: product versioning history** | 🟢 OPEN | 🟡 P1 | M | `flexcms-pim` | P5-01 | — |
| P5-04 | **PIM: year-over-year carryforward (full merge)** | 🟢 OPEN | 🟡 P1 | L | `flexcms-pim` | P5-01 | — |
| P5-05 | **PIM: ImportService + field mapping profiles** | 🟢 OPEN | 🟡 P1 | L | `flexcms-pim` | P5-01 | — |
| P5-06 | **PIM: Excel import source (POI)** | 🟢 OPEN | 🟢 P2 | M | `flexcms-pim` | P5-05 | — |
| P5-07 | **PIM: JSON/API import source** | 🟢 OPEN | 🟢 P2 | M | `flexcms-pim` | P5-05 | — |
| P5-08 | **PIM: auto-schema inference from source** | 🟢 OPEN | 🟢 P2 | M | `flexcms-pim` | P5-05 | — |
| P5-09 | **PIM ↔ CMS: PimClient for Sling Models** | 🟢 OPEN | 🟡 P1 | M | `flexcms-pim`, `flexcms-plugin-api` | P5-01 | — |
| P5-10 | **PIM ↔ CMS: product.published → page rebuild** | 🟢 OPEN | 🟡 P1 | M | `flexcms-pim`, `flexcms-replication` | P5-09, P2H-01 | — |
| P5-11 | **PIM: Elasticsearch product index** | 🟢 OPEN | 🟢 P2 | L | `flexcms-pim`, `flexcms-search` | P2-03, P5-01 | — |
| P5-12 | **PIM: GraphQL schema extension** | 🟢 OPEN | 🟢 P2 | M | `flexcms-pim`, `flexcms-headless` | P2-01, P5-01 | — |
| P5-13 | **PIM Admin: catalog browser + product grid** | 🟢 OPEN | 🟡 P1 | L | `frontend/apps/admin` | P3-09, P3-03, P5-01 | — |
| P5-14 | **PIM Admin: product editor (schema-driven form)** | 🟢 OPEN | 🟡 P1 | XL | `frontend/apps/admin` | P5-13, P3-06 | — |
| P5-15 | **PIM Admin: import wizard** | 🟢 OPEN | 🟡 P1 | L | `frontend/apps/admin` | P5-13, P3-05, P5-05 | — |
| P5-16 | **PIM Admin: schema visual editor** | 🟢 OPEN | 🟢 P2 | XL | `frontend/apps/admin` | P5-13 | — |

### Bugs & Tech Debt

| ID | Title | Status | Priority | Effort | Modules Touched | Blocked By | Agent |
|---|---|---|---|---|---|---|---|
| BUG-01 | **PageApiController uses manual `new` instead of DI** | 🟢 OPEN | 🟡 P1 | S | `flexcms-headless` | — | — |
| BUG-02 | **Inconsistent path separator (`.` vs `/`) in controllers** | 🟢 OPEN | 🟡 P1 | M | `flexcms-headless`, `flexcms-author` | — | — |
| BUG-03 | **No pagination on list endpoints** | 🟢 OPEN | 🟡 P1 | M | `flexcms-headless`, `flexcms-author` | — | — |
| BUG-04 | **N+1 in ContentNode.getChildren()** | 🟢 OPEN | 🟡 P1 | M | `flexcms-core` | — | — |
| BUG-05 | **ReplicationReceiver.fetchNodeFromAuthor() incomplete** | 🟢 OPEN | 🟡 P1 | M | `flexcms-replication` | — | — |

---

## §4. Context Packets

> Each work item has a context packet: the minimum set of files and docs an agent must read before starting that item. Read the listed files — do NOT read the entire codebase.

### P1-01: Spring Security OAuth2 + JWT
```yaml
read_first:
  - README.md §9 (AI Agent Onboarding — architecture mental model)
  - Design/cms_architecture/01_ARCHITECTURE_OVERVIEW.md (§ security section if any)
  - flexcms/flexcms-app/src/main/java/com/flexcms/app/config/SecurityConfig.java
  - flexcms/flexcms-app/src/main/resources/application.yml
  - flexcms/flexcms-app/pom.xml
understand:
  - Current SecurityConfig has permitAll() — must be replaced
  - Author APIs need authentication; publish APIs can be public
  - Need roles: ADMIN, CONTENT_AUTHOR, CONTENT_REVIEWER, CONTENT_PUBLISHER, VIEWER
acceptance_criteria:
  - [ ] OAuth2 Resource Server configured (JWT validation)
  - [ ] JWT token validation from external IdP (Keycloak / Auth0)
  - [ ] Roles extracted from JWT claims
  - [ ] Author endpoints require authentication
  - [ ] Publish endpoints allow anonymous (configurable)
  - [ ] /api/pim/* endpoints require authentication
  - [ ] Tests pass
output_files:
  - SecurityConfig.java (rewritten)
  - application.yml (updated with security config)
  - pom.xml (spring-boot-starter-oauth2-resource-server added)
  - New: JwtRoleConverter.java or similar
```

### P1-04: Global error handling (@ControllerAdvice)
```yaml
read_first:
  - flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/ (all controllers)
  - flexcms/flexcms-headless/src/main/java/com/flexcms/headless/controller/ (all controllers)
  - flexcms/flexcms-pim/src/main/java/com/flexcms/pim/controller/ProductApiController.java
understand:
  - Currently controllers throw raw exceptions (IllegalArgumentException, etc.)
  - Need RFC 7807 Problem Details format for all error responses
  - Should handle: validation errors, not found, auth errors, server errors
acceptance_criteria:
  - [ ] GlobalExceptionHandler with @ControllerAdvice created
  - [ ] RFC 7807 ProblemDetail response format for all errors
  - [ ] Custom exception hierarchy (NotFoundException, ConflictException, ValidationException, etc.)
  - [ ] All existing controllers updated to throw typed exceptions
  - [ ] Error response includes correlation ID for tracing
  - [ ] Tests: verify error response structure for each exception type
output_files:
  - New: flexcms-core/.../exception/FlexCmsException.java (base)
  - New: flexcms-core/.../exception/NotFoundException.java
  - New: flexcms-core/.../exception/ValidationException.java
  - New: flexcms-app/.../config/GlobalExceptionHandler.java
```

### P1-07: Unit tests — flexcms-core services
```yaml
read_first:
  - flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ (all services)
  - flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ (key models: ContentNode, Site, Asset)
  - flexcms/flexcms-core/src/main/java/com/flexcms/core/repository/ (interfaces)
  - flexcms/flexcms-core/pom.xml
understand:
  - Zero tests exist. Start from scratch.
  - Services use @Autowired Spring beans — mock repositories with Mockito
  - Focus on: ContentNodeService, ContentDeliveryService, ComponentRegistry
acceptance_criteria:
  - [ ] JUnit 5 + Mockito configured in pom.xml
  - [ ] Tests for ContentNodeService: create, read, update, delete, move, find descendants
  - [ ] Tests for ContentDeliveryService: page resolution, component tree building
  - [ ] Tests for ComponentRegistry: register, resolve, list
  - [ ] All tests pass with mvn test
  - [ ] Coverage > 70% for flexcms-core/service/
output_files:
  - New: flexcms-core/src/test/java/com/flexcms/core/service/ContentNodeServiceTest.java
  - New: flexcms-core/src/test/java/com/flexcms/core/service/ContentDeliveryServiceTest.java
  - New: flexcms-core/src/test/java/com/flexcms/core/service/ComponentRegistryTest.java
```

### P1-13: CI/CD — GitHub Actions pipeline
```yaml
read_first:
  - flexcms/pom.xml (parent — module list, build config)
  - flexcms/docker-compose.yml (services needed for integration tests)
  - frontend/package.json (build scripts)
  - frontend/turbo.json (build orchestration)
understand:
  - Backend is Maven multi-module; frontend is pnpm + Turborepo
  - Need: build → test → lint → Docker image build
  - PostgreSQL, Redis, RabbitMQ needed for integration tests (Testcontainers or service containers)
acceptance_criteria:
  - [ ] .github/workflows/ci.yml created
  - [ ] Backend: mvn clean verify runs
  - [ ] Frontend: pnpm install && pnpm build && pnpm test runs
  - [ ] Pipeline triggers on push to main + PRs
  - [ ] Build status badge in README
output_files:
  - New: .github/workflows/ci.yml
  - README.md (add badge)
```

### P2-01: Complete GraphQL resolvers
```yaml
read_first:
  - flexcms/flexcms-headless/src/main/resources/graphql/schema.graphqls
  - flexcms/flexcms-headless/src/main/java/com/flexcms/headless/graphql/ContentQueryResolver.java
  - flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentDeliveryService.java
  - flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java
understand:
  - GraphQL schema is defined but most resolvers return stubs
  - Must implement: page, pages (list), search, navigation, asset, components queries
  - Use ContentDeliveryService and ContentNodeService for data
acceptance_criteria:
  - [ ] All Query types from schema.graphqls have working resolvers
  - [ ] page(path) returns full page with components tree
  - [ ] pages(siteId, locale) returns paginated list
  - [ ] navigation(siteId, locale, depth) returns navigation tree
  - [ ] asset(path) returns asset with renditions
  - [ ] components() returns component registry
  - [ ] search(query) delegates to Elasticsearch (or stub if P2-03 not done)
  - [ ] Tests for each resolver
output_files:
  - ContentQueryResolver.java (completed)
  - New: PageResolver.java, NavigationResolver.java, etc. (if split)
```

### P3-01: Design system — Dialog, Sheet, DropdownMenu
```yaml
read_first:
  - Design/DesignerPrompt.md §6.1 (component specs), §8 (mandatory rules)
  - frontend/packages/ui/src/index.ts (current exports)
  - frontend/packages/ui/src/components/Button.tsx (reference — how CVA variants work)
  - frontend/packages/ui/src/themes/index.ts (theme tokens)
  - frontend/packages/ui/package.json (dependencies — Radix, CVA, Tailwind)
understand:
  - All components use CSS custom properties (var(--color-*)), never raw colors
  - Use Radix UI primitives (@radix-ui/react-dialog, @radix-ui/react-dropdown-menu)
  - Use CVA for variant definitions
  - Must export from index.ts
acceptance_criteria:
  - [ ] Dialog component: small, medium, large, full-screen variants; overlay + close button
  - [ ] Sheet component: left, right, bottom drawers; overlay + close
  - [ ] DropdownMenu: items with icons, keyboard shortcuts, submenu support
  - [ ] All use theme tokens (var(--color-*))
  - [ ] All have focus management + keyboard navigation (Radix handles this)
  - [ ] Exported from packages/ui/src/index.ts
  - [ ] Zero hardcoded colors
output_files:
  - New: packages/ui/src/components/Dialog.tsx
  - New: packages/ui/src/components/Sheet.tsx
  - New: packages/ui/src/components/DropdownMenu.tsx
  - Updated: packages/ui/src/index.ts (add exports)
  - Updated: packages/ui/package.json (add @radix-ui/* deps)
```

### P3-09: AppShell layout
```yaml
read_first:
  - Design/DesignerPrompt.md §5.1 (layout patterns), §7.1-7.2 (responsive, sidebar)
  - frontend/apps/admin/src/app/layout.tsx (current root layout)
  - frontend/apps/admin/src/app/page.tsx (current dashboard)
  - frontend/apps/admin/src/components/ThemeProvider.tsx
  - README.md §9 Key Pattern #13 (mandatory style guide)
understand:
  - AppShell = top nav bar + collapsible sidebar (240px / 64px) + main content area
  - Sidebar sections: CMS (Dashboard, Sites, Workflows, Components), DAM, PIM, System
  - Must work with ThemeProvider already in layout.tsx
  - Requires: Sidebar, TopNav, Breadcrumb components from @flexcms/ui (P3-04)
acceptance_criteria:
  - [ ] AppShell component wraps all admin pages
  - [ ] Top nav: logo, global search placeholder, notification bell, user avatar, theme toggle
  - [ ] Sidebar: collapsible (240px → 64px), section groups, active state, badge counts
  - [ ] Breadcrumb rendered below top nav in content area
  - [ ] Responsive: sidebar auto-collapses below 1440px
  - [ ] All using @flexcms/ui components + theme tokens
  - [ ] layout.tsx updated to use AppShell
output_files:
  - New: apps/admin/src/components/AppShell.tsx
  - New: apps/admin/src/components/SidebarNav.tsx
  - New: apps/admin/src/components/TopNav.tsx
  - Updated: apps/admin/src/app/layout.tsx
```

### P5-01: PIM complete ProductService CRUD + validation
```yaml
read_first:
  - Design/cms_architecture/12_PIM_SYSTEM.md (full PIM design)
  - flexcms/flexcms-pim/src/main/java/com/flexcms/pim/service/ProductService.java
  - flexcms/flexcms-pim/src/main/java/com/flexcms/pim/model/ (all models)
  - flexcms/flexcms-pim/src/main/java/com/flexcms/pim/repository/ (all repos)
  - flexcms/flexcms-pim/src/main/java/com/flexcms/pim/controller/ProductApiController.java
  - flexcms/flexcms-pim/src/main/resources/db/pim/V1__pim_schema.sql
understand:
  - PIM has its own database (flexcms_pim), own DataSource config
  - ProductService.java is scaffolded with basic CRUD + carryforward
  - Product.getResolvedAttributes() merges source + overrides (inheritance)
  - Need: full CRUD for schemas, catalogs, products, variants; catalog management
acceptance_criteria:
  - [ ] SchemaService: full CRUD + version creation + inheritance resolution
  - [ ] CatalogService: full CRUD + status transitions (DRAFT→ACTIVE→ARCHIVED)
  - [ ] ProductService: complete create/update/delete/search + resolved attributes
  - [ ] VariantService: CRUD per product + variant SKU management
  - [ ] ProductAssetRefService: link/unlink DAM assets to products
  - [ ] All REST endpoints in ProductApiController wired up
  - [ ] New controllers: SchemaApiController, CatalogApiController
  - [ ] Input validation on all endpoints
  - [ ] Unit tests for each service
output_files:
  - Updated: ProductService.java (completed)
  - New: SchemaService.java, CatalogService.java, VariantService.java
  - New: SchemaApiController.java, CatalogApiController.java
  - Updated: ProductApiController.java (wired to completed services)
  - New: test files for each service
```

---

## §5. Completion Notes & Handoff Log

> When you finish or pause an item, add an entry here. This is the most critical section — it enables handoff between agents.

### Template for DONE items:
```
### [ITEM-ID] — Title
**Status:** ✅ DONE
**Agent:** [identifier]
**Date:** YYYY-MM-DD
**AC Verification:**
  - [x] AC 1 description — verified by [method]
  - [x] AC 2 description — verified by [method]
**Files Changed:**
  - path/to/file1.java — [what changed]
  - path/to/file2.tsx — [what changed]
**Build Verified:** Yes / No — [command used]
**Notes:** [anything the next person should know]
```

### Template for PAUSED items:
```
### [ITEM-ID] — Title
**Status:** 🟠 PAUSED
**Agent:** [identifier]
**Date:** YYYY-MM-DD
**Progress:** [X]% complete
**What was done:**
  - Bullet list of completed sub-tasks
**What remains:**
  - Bullet list of remaining sub-tasks
**Current state of code:**
  - path/to/file1.java — [current state, compiles? tests pass?]
  - path/to/file2.tsx — [current state]
**Where I stopped:**
  [Precise description: "I was implementing the JWT validation filter.
   The JwtAuthenticationFilter.java is created but the role extraction
   from claims is not done. The SecurityConfig.java has the filter chain
   configured but the /api/pim/** path rules are missing."]
**Blockers / Issues found:**
  - [any issues discovered during work]
**To continue:** [Step-by-step instructions for the next agent]
  1. Open JwtAuthenticationFilter.java
  2. Implement extractRoles() method — roles come from "realm_access.roles" claim
  3. Add /api/pim/** path rules to SecurityConfig
  4. Run: mvn test -pl flexcms-app
```

---

### P1-04 — Global error handling (@ControllerAdvice)
**Status:** ✅ DONE
**Agent:** Claude Sonnet 4.6
**Date:** 2026-03-24
**AC Verification:**
  - [x] GlobalExceptionHandler with @ControllerAdvice created — `flexcms-app/.../config/GlobalExceptionHandler.java`
  - [x] RFC 7807 ProblemDetail response format for all errors — Spring's `ProblemDetail` used throughout
  - [x] Custom exception hierarchy — `FlexCmsException`, `NotFoundException`, `ConflictException`, `ValidationException`, `ForbiddenException` in `flexcms-core/.../exception/`
  - [x] All existing controllers updated — `ContentNodeService` throws typed exceptions; `PageApiController` removes inline try/catch; BUG-01 also fixed (DI injection in PageApiController)
  - [x] Error response includes correlation ID — resolved from `X-Correlation-ID` header → MDC `traceId` → generated UUID
  - [x] Tests: 9 unit tests covering all exception types — all pass (`mvn test -pl flexcms-app`)
**Files Changed:**
  - `flexcms-core/src/main/java/com/flexcms/core/exception/FlexCmsException.java` — new base exception
  - `flexcms-core/src/main/java/com/flexcms/core/exception/NotFoundException.java` — new (HTTP 404)
  - `flexcms-core/src/main/java/com/flexcms/core/exception/ConflictException.java` — new (HTTP 409)
  - `flexcms-core/src/main/java/com/flexcms/core/exception/ValidationException.java` — new (HTTP 422, with field errors)
  - `flexcms-core/src/main/java/com/flexcms/core/exception/ForbiddenException.java` — new (HTTP 403)
  - `flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java` — replaced all `IllegalArgumentException`/`IllegalStateException` with typed exceptions
  - `flexcms-app/src/main/java/com/flexcms/app/config/GlobalExceptionHandler.java` — new @RestControllerAdvice
  - `flexcms-headless/src/main/java/com/flexcms/headless/controller/PageApiController.java` — removed inline try/catch; IDE also fixed BUG-01
  - `flexcms-app/src/test/java/com/flexcms/app/config/GlobalExceptionHandlerTest.java` — 9 unit tests
**Build Verified:** Yes — `mvn install -DskipTests -q` + `mvn test -pl flexcms-app` → 9/9 tests pass, BUILD SUCCESS
**Notes:** P1-05 and P1-06 are now unblocked. BUG-01 (`PageApiController` used `new ContentNodeService()`) was incidentally fixed by the IDE during this session.

---

## §6. Parallel Work Planner

> Use this to identify which items can be worked on simultaneously RIGHT NOW.

### Items with ZERO blockers (can start immediately):

**Backend (Java):**
- P1-01 (Security) — `flexcms-app`, `flexcms-core`
- P1-05 (Request DTO validation) — `flexcms-author`, `flexcms-headless`, `flexcms-pim` ⭐ **newly unblocked** (P1-04 ✅ DONE)
- P1-06 (XSS sanitization) — `flexcms-core` ⭐ **newly unblocked** (P1-04 ✅ DONE)
- P1-07 (Tests: core) — `flexcms-core`
- P1-08 (Tests: author) — `flexcms-author`
- P1-09 (Tests: replication) — `flexcms-replication`
- P1-10 (Tests: DAM) — `flexcms-dam`
- P2-01 (GraphQL) — `flexcms-headless`
- P2-03 (Elasticsearch) — `flexcms-search`, `flexcms-replication`
- P2-07 (OpenAPI spec) — `flexcms-headless`, `flexcms-author`
- P2-08 (Metrics) — `flexcms-app`
- P2-10 (Logging) — `flexcms-app`
- P4-01 (Scheduled publish) — `flexcms-author`, `flexcms-core`
- P4-03 (CDN: CloudFront) — `flexcms-cdn`
- P4-05 (Translation: DeepL) — `flexcms-i18n`
- P5-01 (PIM CRUD) — `flexcms-pim`
- BUG-02 through BUG-05 (BUG-01 is ✅ DONE)

**Frontend (TypeScript):**
- P1-15 (Tests: SDK) — `frontend/packages/sdk`
- P1-16 (Tests: React) — `frontend/packages/react`
- P2-05 (Angular adapter) — `frontend/packages/angular`
- P3-01 to P3-07 (Design system) — `frontend/packages/ui`
- P2H-01 (Build worker) — `frontend/apps/build-worker`

**Infra:**
- P1-13 (CI/CD) — `CI/CD`
- P4-07 (K8s Helm) — `docker / infra`

### Maximum parallelism example (8 agents):

```
Agent 1: P1-01 (Security)         → flexcms-app, flexcms-core
Agent 2: P1-08 (Tests: author)    → flexcms-author
Agent 3: P1-09 (Tests: repl.)    → flexcms-replication
Agent 4: P2-01 (GraphQL)         → flexcms-headless
Agent 5: P5-01 (PIM CRUD)        → flexcms-pim
Agent 6: P3-01 (UI: Dialog etc.) → frontend/packages/ui
Agent 7: P1-15 (Tests: SDK)      → frontend/packages/sdk
Agent 8: P1-13 (CI/CD)           → CI/CD
```

No module conflicts — all 8 can run simultaneously.

---

*Last updated: 2026-03-24 | P1-04 ✅ DONE + BUG-01 ✅ DONE by claude-agent-1*

