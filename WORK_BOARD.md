# WORK_BOARD.md — FlexCMS Task Coordination Board

> **This file is the single source of truth for all implementation work.**
> Every AI agent MUST read this file before starting any task.
> Updated: 2026-03-26

---

## §1 — Overview & Legend

### Status Icons
| Icon | Status | Meaning |
|------|--------|---------|
| 🟢 | OPEN | Available for pickup |
| 🔵 | IN PROGRESS | An agent is actively working on it |
| 🟠 | PAUSED | Partially done — needs handoff (see §5) |
| 🔴 | BLOCKED | Cannot start until blocker items are ✅ DONE |
| ✅ | DONE | Completed and validated |

### Priority Levels
| Label | Meaning |
|-------|---------|
| 🔴 P0 | Critical — blocks production or other tasks |
| 🟠 P1 | High — blocks enterprise deployment |
| 🟡 P2 | Medium — enhances enterprise value |
| 🟢 P3 | Nice-to-have — polish & optimization |

### Agent Workflow (mandatory for every task)
1. **Pick** → Find a 🟢 OPEN item (🔴 P0 first), check §2 for module conflicts
2. **Claim** → Update status to 🔵 IN PROGRESS, lock modules in §2
3. **Context** → Read §4 Context Packet (or source files in "Modules Touched")
4. **Implement** → Follow `CLAUDE.md` conventions; verify every AC
5. **Validate** → `cd flexcms && mvn clean compile` (backend) + frontend type-check
6. **CI Gate** → Ensure GitHub Actions CI passes (push & check workflow results)
7. **Update** → Move to ✅ DONE, clear locks in §2, add notes in §5
8. **Push** → `git add -A && git commit && git push`

### Rules
- **ONE agent per task.** Never work on a task that is 🔵 IN PROGRESS by another agent.
- **Always lock modules.** Before editing any module, verify it's unlocked in §2.
- **Leave code compilable.** If you must pause, ensure `mvn clean compile` passes.
- **No mock data.** Real data only — mock data is acceptable ONLY in unit tests.
- **Commit messages:** `feat(<item-id>): <description>` for features, `fix(<item-id>): ...` for bugs.

---

## §2 — Module Lock Table

When an agent starts a task, it MUST lock every module listed in the task's "Modules Touched" column. When the task is DONE or PAUSED, update accordingly.

### Backend Modules

| Module | Locked By Item | Agent | Since |
|--------|---------------|-------|-------|
| `flexcms-core` | — | — | — |
| `flexcms-plugin-api` | — | — | — |
| `flexcms-author` | — | — | — |
| `flexcms-publish` | — | — | — |
| `flexcms-headless` | — | — | — |
| `flexcms-dam` | — | — | — |
| `flexcms-replication` | — | — | — |
| `flexcms-cache` | — | — | — |
| `flexcms-cdn` | — | — | — |
| `flexcms-i18n` | — | — | — |
| `flexcms-multisite` | — | — | — |
| `flexcms-search` | — | — | — |
| `flexcms-clientlibs` | — | — | — |
| `flexcms-pim` | — | — | — |
| `flexcms-app` | — | — | — |

### Frontend Packages

| Package | Locked By Item | Agent | Since |
|---------|---------------|-------|-------|
| `packages/sdk` | — | — | — |
| `packages/react` | — | — | — |
| `packages/vue` | — | — | — |
| `packages/ui` | — | — | — |
| `apps/admin` | P1-15 | AI Agent | 2026-03-26 |
| `apps/site-nextjs` | — | — | — |
| `apps/site-nuxt` | — | — | — |
| `apps/build-worker` | — | — | — |

### Infrastructure & Config

| Area | Locked By Item | Agent | Since |
|------|---------------|-------|-------|
| `infra/local` | — | — | — |
| `infra/cfn` | — | — | — |
| `.github/workflows` | — | — | — |
| `flexcms/docker-compose.yml` | — | — | — |
| Flyway migrations (CMS) | — | — | — |
| Flyway migrations (PIM) | — | — | — |

---

## §3 — Task Board

### 🔴 P0 — Critical (Blocks Production)

| ID | Status | Title | Effort | Modules Touched | Blocked By |
|----|--------|-------|--------|-----------------|------------|
| P0-01 | 🟢 OPEN | **Global error handling — `@ControllerAdvice` + RFC 7807 Problem Details** | 1d | `flexcms-core`, `flexcms-author`, `flexcms-headless`, `flexcms-app` | — |
| P0-02 | 🟢 OPEN | **Input validation — `@Valid` DTOs + request constraints** | 1d | `flexcms-author`, `flexcms-headless`, `flexcms-pim` | — |
| P0-03 | 🟢 OPEN | **Fix `PageApiController.getChildren()` — DI instead of `new ContentNodeService()`** | 1h | `flexcms-headless` | — |
| P0-04 | 🟢 OPEN | **Fix N+1 in `ContentNode.getChildren()` / `loadChildrenRecursive()`** | 4h | `flexcms-core` | — |
| P0-05 | 🟢 OPEN | **Add pagination to all list endpoints** | 1d | `flexcms-headless`, `flexcms-author`, `flexcms-pim` | — |
| P0-06 | 🟢 OPEN | **Remove all mock/dummy data from frontend markup** | 4h | `apps/admin` | — |
| P0-07 | 🟢 OPEN | **Ensure SQL seed data uses only valid `NodeStatus` enum values** | 2h | `flexcms-app` (migrations) | — |
| P0-08 | 🟢 OPEN | **Database constraint: CHECK on `content_nodes.status`** | 1h | `flexcms-app` (Flyway migration) | P0-07 |
| P0-09 | 🟢 OPEN | **Fix headless module test failure (Mockito stubbing mismatch)** | 2h | `flexcms-headless` | — |
| P0-10 | ✅ DONE | **Register 18 TUT component definitions (V14 migration)** | 4h | `flexcms-app` (Flyway migration) | — |
| P0-11 | ✅ DONE | **Seed TUT sample website — DAM assets + PIM products + sites + XFs + 85 pages** | 3d | `flexcms-app`, `flexcms-pim`, `flexcms-dam`, `scripts` | P0-10 |
| P0-12 | 🟢 OPEN | **Implement 18 TUT frontend component renderers in site-nextjs** | 2d | `apps/site-nextjs` | P0-10 |

### 🟠 P1 — High (Blocks Enterprise Deployment)

| ID | Status | Title | Effort | Modules Touched | Blocked By |
|----|--------|-------|--------|-----------------|------------|
| P1-01 | 🟢 OPEN | **Complete GraphQL resolvers — all Query types** | 3d | `flexcms-headless` | P0-01 |
| P1-02 | 🟢 OPEN | **Elasticsearch integration — full-text indexing on publish** | 3d | `flexcms-search`, `flexcms-core`, `flexcms-replication` | — |
| P1-03 | 🟢 OPEN | **Unit tests — core services (ContentNodeService, ContentDeliveryService, WorkflowEngine)** | 3d | `flexcms-core`, `flexcms-author` | — |
| P1-04 | 🟢 OPEN | **Unit tests — PIM services (ProductService, CarryforwardService)** | 2d | `flexcms-pim` | — |
| P1-05 | 🟢 OPEN | **Integration tests — Testcontainers for repositories** | 3d | `flexcms-core`, `flexcms-pim` | P1-03, P1-04 |
| P1-06 | 🟢 OPEN | **Security — Spring Security OAuth2 Resource Server + JWT + RBAC** | 5d | `flexcms-app`, `flexcms-core` | — |
| P1-07 | 🟢 OPEN | **API documentation — SpringDoc OpenAPI for all REST endpoints** | 2d | `flexcms-headless`, `flexcms-author`, `flexcms-pim`, `flexcms-app` | — |
| P1-08 | 🟢 OPEN | **Observability — Micrometer + Prometheus metrics + structured logging** | 3d | `flexcms-app`, `flexcms-core`, `flexcms-replication` | — |
| P1-09 | 🟢 OPEN | **Admin UI — Content tree browser** | 5d | `apps/admin`, `packages/ui` | P0-06 |
| P1-10 | 🟢 OPEN | **Admin UI — DAM browser with upload** | 4d | `apps/admin`, `packages/ui` | P0-06 |
| P1-11 | 🟢 OPEN | **Admin UI — Site management page (real data, no mocks)** | 2d | `apps/admin` | P0-06 |
| P1-12 | 🟢 OPEN | **PIM ↔ CMS integration — product enrichment in ComponentModels** | 3d | `flexcms-pim`, `flexcms-core`, `flexcms-plugin-api` | — |
| P1-13 | 🟢 OPEN | **PIM ↔ DAM integration — product asset linking** | 2d | `flexcms-pim`, `flexcms-dam` | — |
| P1-14 | ✅ DONE | **Automated data seeding script — re-runnable setup for TUT sample website** | 2d | `scripts`, `flexcms-app` | P0-11 |
| P1-15 | 🔵 IN PROGRESS | **Admin UI — Content Tree folder-style navigation (lazy-load children on row click)** | 4h | `apps/admin`, `flexcms-author` | — |

### 🟡 P2 — Medium (Enhances Enterprise Value)

| ID | Status | Title | Effort | Modules Touched | Blocked By |
|----|--------|-------|--------|-----------------|------------|
| P2-01 | 🟢 OPEN | **Admin UI — Page editor with auto-generated forms from component schema** | 5d | `apps/admin`, `packages/ui` | P1-09 |
| P2-02 | 🟢 OPEN | **Admin UI — Workflow inbox (submit/approve/reject)** | 3d | `apps/admin`, `packages/ui` | P1-09 |
| P2-03 | 🟢 OPEN | **Admin UI — PIM product grid + editor** | 4d | `apps/admin`, `packages/ui` | P0-06 |
| P2-04 | 🟢 OPEN | **Content preview — iframe-based preview in admin** | 3d | `apps/admin`, `apps/site-nextjs` | P2-01 |
| P2-05 | 🟢 OPEN | **Scheduled publishing — timer-based workflow step** | 2d | `flexcms-author`, `flexcms-core` | — |
| P2-06 | 🟢 OPEN | **Live copy / content sharing — cross-site inheritance** | 3d | `flexcms-core`, `flexcms-i18n` | — |
| P2-07 | 🟢 OPEN | **Translation connector — DeepL / Google Translate SPI** | 2d | `flexcms-i18n` | — |
| P2-08 | 🟢 OPEN | **Audit trail — admin API for `audit_log` table** | 1d | `flexcms-author`, `flexcms-core` | — |
| P2-09 | 🟢 OPEN | **Bulk operations — publish/delete/import multiple nodes** | 2d | `flexcms-author`, `flexcms-core` | — |
| P2-10 | 🟢 OPEN | **Sitemap.xml + robots.txt generation** | 1d | `flexcms-publish`, `flexcms-headless` | — |
| P2-11 | 🟢 OPEN | **Static site compilation — complete build worker** | 5d | `apps/build-worker`, `flexcms-cdn` | P1-01 |

### 🟢 P3 — Nice-to-have (Polish & Optimization)

| ID | Status | Title | Effort | Modules Touched | Blocked By |
|----|--------|-------|--------|-----------------|------------|
| P3-01 | 🟢 OPEN | **CDN provider — CloudFront implementation** | 2d | `flexcms-cdn` | — |
| P3-02 | 🟢 OPEN | **CDN provider — Cloudflare implementation** | 2d | `flexcms-cdn` | P3-01 |
| P3-03 | 🟢 OPEN | **Cache warming service** | 1d | `flexcms-cache` | — |
| P3-04 | 🟢 OPEN | **Kubernetes Helm charts** | 3d | `infra/` | — |
| P3-05 | 🟢 OPEN | **Performance load testing with Gatling** | 2d | `flexcms-app` | P1-05 |
| P3-06 | 🟢 OPEN | **Admin UI — visual drag-and-drop page editor (dnd-kit)** | 5d | `apps/admin`, `packages/ui` | P2-01 |
| P3-07 | 🟢 OPEN | **PIM — visual schema editor** | 4d | `apps/admin`, `flexcms-pim` | P2-03 |
| P3-08 | 🟢 OPEN | **PIM — GraphQL extension (Product, Catalog types)** | 3d | `flexcms-headless`, `flexcms-pim` | P1-01 |

### 🐛 BUG — Defects

| ID | Status | Title | Effort | Modules Touched | Blocked By |
|----|--------|-------|--------|-----------------|------------|
| BUG-01 | 🟢 OPEN | **GraphQL `node()` resolver should NOT prepend `content.` prefix** | 1h | `flexcms-headless` | — |
| BUG-02 | 🟢 OPEN | **`@EnableElasticsearchRepositories` must scan all packages** | 30m | `flexcms-app` | — |
| BUG-03 | 🟢 OPEN | **Content path `.` vs `/` conversion inconsistent across controllers** | 4h | `flexcms-headless`, `flexcms-author`, `flexcms-publish` | — |

---

## §4 — Context Packets

Each task below lists the files to read and acceptance criteria to verify.

---

### P0-01 — Global Error Handling

**read_first:**
- `flexcms-author/src/main/java/com/flexcms/author/controller/` — all controllers (see current error patterns)
- `flexcms-headless/src/main/java/com/flexcms/headless/controller/` — all controllers
- `flexcms-app/src/main/java/com/flexcms/app/` — entry point, existing config

**understand:**
- RFC 7807 Problem Details (`application/problem+json`)
- Spring's `ResponseEntityExceptionHandler`
- How `@ControllerAdvice` intercepts exceptions globally

**acceptance_criteria:**
- [ ] AC1: A `@ControllerAdvice` class exists that catches all exceptions
- [ ] AC2: 404 (Not Found), 400 (Bad Request), 409 (Conflict), 500 (Internal Error) return RFC 7807 JSON
- [ ] AC3: Stack traces are NOT exposed in error responses (production)
- [ ] AC4: Custom exception hierarchy: `FlexCmsException`, `ContentNotFoundException`, `ValidationException`
- [ ] AC5: `mvn clean compile` passes

**output_files:**
- `flexcms-core/src/main/java/com/flexcms/core/exception/FlexCmsException.java`
- `flexcms-core/src/main/java/com/flexcms/core/exception/ContentNotFoundException.java`
- `flexcms-core/src/main/java/com/flexcms/core/exception/ValidationException.java`
- `flexcms-app/src/main/java/com/flexcms/app/config/GlobalExceptionHandler.java`

---

### P0-02 — Input Validation

**read_first:**
- `flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`
- `flexcms-headless/src/main/java/com/flexcms/headless/controller/PageApiController.java`
- `flexcms-pim/src/main/java/com/flexcms/pim/controller/ProductApiController.java`

**understand:**
- Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Size`, `@Pattern`)
- Request DTO pattern (never bind JPA entities directly to request body)
- XSS sanitization for rich text fields

**acceptance_criteria:**
- [ ] AC1: All `@PostMapping` and `@PutMapping` endpoints use `@Valid` on request DTOs
- [ ] AC2: DTOs have `@NotBlank`, `@Size`, `@Pattern` where appropriate
- [ ] AC3: Validation errors return 400 with field-level error details (RFC 7807)
- [ ] AC4: `mvn clean compile` passes

**output_files:**
- `flexcms-author/src/main/java/com/flexcms/author/dto/CreateNodeRequest.java`
- `flexcms-author/src/main/java/com/flexcms/author/dto/UpdateNodeRequest.java`
- `flexcms-pim/src/main/java/com/flexcms/pim/dto/CreateProductRequest.java`

---

### P0-03 — Fix PageApiController DI Bug

**read_first:**
- `flexcms-headless/src/main/java/com/flexcms/headless/controller/PageApiController.java`
- `flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`

**understand:**
- Spring dependency injection via `@Autowired` field injection
- Why `new ServiceClass()` bypasses Spring's bean lifecycle

**acceptance_criteria:**
- [ ] AC1: `ContentNodeService` is injected via `@Autowired` (not `new`)
- [ ] AC2: `getChildren()` method uses the injected service
- [ ] AC3: `mvn clean compile` passes

**output_files:**
- `flexcms-headless/src/main/java/com/flexcms/headless/controller/PageApiController.java` (modified)

---

### P0-05 — Pagination on List Endpoints

**read_first:**
- `flexcms-headless/src/main/java/com/flexcms/headless/controller/` — all controllers
- `flexcms-author/src/main/java/com/flexcms/author/controller/` — all controllers
- `flexcms-pim/src/main/java/com/flexcms/pim/controller/ProductApiController.java`
- `flexcms-core/src/main/java/com/flexcms/core/repository/` — repositories

**understand:**
- Spring Data `Pageable`, `Page<T>`, `PageRequest`
- `@RequestParam` for `page`, `size`, `sort`
- Pagination response envelope: `{ content: [...], totalElements, totalPages, page, size }`

**acceptance_criteria:**
- [ ] AC1: All list endpoints accept `page`, `size`, `sort` query parameters
- [ ] AC2: Default page size is 20, max is 100
- [ ] AC3: Response includes pagination metadata (totalElements, totalPages, etc.)
- [ ] AC4: `mvn clean compile` passes

---

### P0-06 — Remove Mock Data from Frontend

**read_first:**
- `frontend/apps/admin/src/` — all page files and components
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/` — reference designs

**understand:**
- Every admin page must fetch real data from the Author API (`http://localhost:8080`)
- Empty states should show a meaningful message when no data exists
- Loading states must use `@flexcms/ui` `Skeleton` components

**acceptance_criteria:**
- [ ] AC1: No hardcoded arrays of fake data in any `.tsx` file
- [ ] AC2: All data-driven pages call actual API endpoints
- [ ] AC3: Empty states render when API returns empty results
- [ ] AC4: Loading skeletons render while API calls are in flight
- [ ] AC5: Frontend builds without errors

---

### P1-01 — Complete GraphQL Resolvers

**read_first:**
- `flexcms-headless/src/main/resources/graphql/schema.graphqls`
- `flexcms-headless/src/main/java/com/flexcms/headless/graphql/ContentQueryResolver.java`
- `flexcms-core/src/main/java/com/flexcms/core/service/ContentDeliveryService.java`

**understand:**
- Spring GraphQL resolver pattern (`@QueryMapping`, `@SchemaMapping`)
- Pagination in GraphQL (connection pattern or offset-based)
- `node()` resolver uses path directly; `page()` uses `toContentPath()` — different semantics

**acceptance_criteria:**
- [ ] AC1: All Query types defined in schema.graphqls have working resolvers
- [ ] AC2: `page`, `pages`, `node`, `search`, `navigation`, `asset` queries work
- [ ] AC3: Pagination supported on list queries
- [ ] AC4: Field-level resolvers for nested types (e.g., Component → children)
- [ ] AC5: GraphiQL at `/graphiql` works for all queries
- [ ] AC6: `mvn clean compile` passes

---

### P1-03 — Unit Tests for Core Services

**read_first:**
- `flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`
- `flexcms-core/src/main/java/com/flexcms/core/service/ContentDeliveryService.java`
- `flexcms-author/src/main/java/com/flexcms/author/service/WorkflowEngine.java`
- `flexcms-core/src/main/java/com/flexcms/core/model/` — all entities

**understand:**
- JUnit 5 + Mockito `@ExtendWith(MockitoExtension.class)`
- `@Mock` for repository dependencies, `@InjectMocks` for the service under test
- Every `@Autowired` field in the service MUST have a corresponding `@Mock` in the test

**acceptance_criteria:**
- [ ] AC1: `ContentNodeServiceTest` with ≥10 test methods covering CRUD + tree operations
- [ ] AC2: `ContentDeliveryServiceTest` with ≥5 test methods covering page resolution
- [ ] AC3: `WorkflowEngineTest` with ≥8 test methods covering state transitions
- [ ] AC4: All tests pass: `cd flexcms && mvn test -pl flexcms-core,flexcms-author`
- [ ] AC5: No mock data outside of test classes

---

### P1-06 — Security Implementation

**read_first:**
- `flexcms-app/src/main/java/com/flexcms/app/config/SecurityConfig.java`
- `flexcms-app/src/main/resources/application.yml`
- `flexcms-app/src/main/resources/application-local.yml`
- `flexcms-app/src/main/resources/application-author.yml`
- `docs/DEV_ENVIRONMENT_RELIABILITY.md` — §5 (Keycloak requirement)

**understand:**
- Spring Security OAuth2 Resource Server with JWT
- RBAC roles: `ADMIN`, `CONTENT_AUTHOR`, `CONTENT_REVIEWER`, `CONTENT_PUBLISHER`, `VIEWER`
- Local dev bypass: `flexcms.local-dev=true` → permit all + ROLE_ADMIN for anonymous
- Author endpoints require write roles; Publish/Headless endpoints are read-only

**acceptance_criteria:**
- [ ] AC1: `SecurityConfig` validates JWT tokens from configurable issuer URI
- [ ] AC2: RBAC roles control access to author/admin endpoints
- [ ] AC3: Publish and headless endpoints remain public (read-only)
- [ ] AC4: Local dev profile (`-Dspring-boot.run.profiles=author,local`) bypasses auth
- [ ] AC5: `mvn clean compile` passes
- [ ] AC6: Existing functionality not broken (author endpoints still work with local profile)

---

### BUG-01 — GraphQL node() Resolver Bug

**read_first:**
- `flexcms-headless/src/main/java/com/flexcms/headless/graphql/ContentQueryResolver.java`
- `docs/DEV_ENVIRONMENT_RELIABILITY.md` — §7

**understand:**
- `node(path)` takes an explicit content path — must use it verbatim
- `page(path)` takes a URL-style path — needs `toContentPath()` conversion
- These are DIFFERENT semantics — never share the same path helper

**acceptance_criteria:**
- [ ] AC1: `node()` resolver uses the `path` argument directly (no `content.` prefix)
- [ ] AC2: `page()` resolver still uses `toContentPath()` correctly
- [ ] AC3: `mvn clean compile` passes

---

### BUG-02 — Elasticsearch Package Scan

**read_first:**
- `flexcms-app/src/main/java/com/flexcms/app/FlexCmsApplication.java`
- `flexcms-search/src/main/java/com/flexcms/search/repository/`
- `flexcms-pim/src/main/java/com/flexcms/pim/search/`
- `docs/DEV_ENVIRONMENT_RELIABILITY.md` — §4

**understand:**
- `@EnableElasticsearchRepositories` must list ALL packages that contain ES repos
- Both `com.flexcms.search.repository` AND `com.flexcms.pim.search` must be scanned

**acceptance_criteria:**
- [ ] AC1: `@EnableElasticsearchRepositories` scans both `com.flexcms.search.repository` and `com.flexcms.pim.search`
- [ ] AC2: `mvn clean compile` passes
- [ ] AC3: Application starts without missing bean errors

---

### P0-09 — Fix Headless Module Test Failure

**read_first:**
- `flexcms-headless/src/test/java/com/flexcms/headless/` — find the failing test class
- `flexcms-headless/target/surefire-reports/` — read XML/text reports for the exact error

**understand:**
- The error is `PotentialStubbingProblem` — Mockito strict stubs mode rejects unused stubs
- Fix by either: removing the unused stub, or marking the test as `@MockitoSettings(strictness = Strictness.LENIENT)`
- Prefer removing the unused stub — it usually means the test expectation is wrong

**acceptance_criteria:**
- [ ] AC1: `cd flexcms && mvn clean test` passes — 0 errors across all modules
- [ ] AC2: No tests skipped or ignored to hide failures
- [ ] AC3: `mvn clean compile` passes

---

### P0-10 — Register 18 TUT Component Definitions

**read_first:**
- `docs/TEST_DATA_SPECIFICATION.md` — §2 "Component Definitions Required" (all 18 components with JSONB schemas)
- `flexcms-app/src/main/resources/db/migration/V6__seed_data.sql` — existing component definitions format
- `flexcms-app/src/main/resources/db/migration/` — check latest migration version number

**understand:**
- New components go in a new Flyway migration file (V14 or next available number)
- Each component needs: `resource_type`, `name`, `title`, `group_name`, `is_container`, `active`, `data_schema` (JSONB)
- `data_schema` must match the JSON Schema definitions from TEST_DATA_SPECIFICATION.md §2.3
- This is a prerequisite for P0-11 (sample website content) and P0-12 (frontend renderers)

**acceptance_criteria:**
- [ ] AC1: Flyway migration file created with all 18 `tut/*` component definitions
- [ ] AC2: Each component has a valid `data_schema` JSONB column matching the spec
- [ ] AC3: Migration runs successfully: `cd flexcms && mvn clean compile` passes
- [ ] AC4: After app start, `GET /api/content/v1/component-registry` returns all 18 TUT components

**output_files:**
- `flexcms-app/src/main/resources/db/migration/V14__tut_component_definitions.sql`

---

### P0-11 — Seed TUT Sample Website

**read_first:**
- `docs/TEST_DATA_SPECIFICATION.md` — ENTIRE file (all 11 sections: sites, DAM, PIM, XFs, pages, compositions)
- `docs/CLIENT_OPERATIONS_GUIDE.md` — §4 (Step-by-step guide for API usage)
- `flexcms-author/src/main/java/com/flexcms/author/controller/` — all controllers (verify API endpoints)
- `flexcms-pim/src/main/java/com/flexcms/pim/controller/` — PIM controllers
- `Design/assets/banner/` — list available banner images
- `Design/assets/1024x1024/` — list available 1024x1024 images

**understand:**
- This task creates a **working demo website** using the TUT luxury car brand
- Implementation order (from TEST_DATA_SPECIFICATION.md §10): components → sites → DAM → PIM → XFs → pages
- The seeding script must call real API endpoints — no direct SQL inserts for content
- 4 sites × multiple locales = 85 page nodes + 12 XF variations + 4 PIM products + 40+ DAM assets
- Images come from `Design/assets/` and must be uploaded via the DAM API

**acceptance_criteria:**
- [ ] AC1: 4 sites created (tut-gb, tut-de, tut-fr, tut-ca) with correct locales
- [ ] AC2: 40+ DAM assets uploaded from `Design/assets/`
- [ ] AC3: PIM schema + catalog + 4 products with full attributes
- [ ] AC4: 12 experience fragment variations (header + footer per site+locale)
- [ ] AC5: 85 content page nodes across all sites and locales
- [ ] AC6: Every page has correct component hierarchy per TEST_DATA_SPECIFICATION.md §6
- [ ] AC7: All pages in PUBLISHED status
- [ ] AC8: `GET /api/content/v1/pages/content/tut-gb/en/home` returns full component tree

**output_files:**
- `scripts/seed_tut_website.py` (or `.sh` / `.ts` — Python preferred for HTTP calls)

---

### P0-12 — Implement 18 TUT Frontend Component Renderers

**read_first:**
- `docs/TEST_DATA_SPECIFICATION.md` — §2.3 (component JSONB schemas — defines data contract for each renderer)
- `frontend/apps/site-nextjs/src/components/component-map.tsx` — existing component map (5 core renderers)
- `frontend/packages/sdk/src/` — SDK types (understand `ComponentMapper`, `FlexCmsRenderer`)
- `frontend/packages/react/src/` — React adapter (understand `FlexCmsComponent` props)

**understand:**
- Each TUT component needs a React function component that receives `{ data, children }` props
- `data` is a `Record<string, unknown>` matching the JSONB schema from the spec
- Components must be registered in `componentMap` via `mapper.registerAll()`
- Product components (`tut/product-teaser`, `tut/product-specs`, `tut/model-comparison`) need to call PIM API
- Container components (`tut/card-grid`, `tut/accordion`) must render `{children}`
- Use Tailwind CSS classes — no hardcoded colors

**acceptance_criteria:**
- [ ] AC1: All 18 TUT component renderers implemented as named-export React components
- [ ] AC2: All 18 registered in `component-map.tsx`
- [ ] AC3: Container components render children correctly
- [ ] AC4: Product components fetch data from PIM API by SKU
- [ ] AC5: `cd frontend && pnpm build` passes
- [ ] AC6: Visiting `http://localhost:3001/` renders the TUT home page with components

**output_files:**
- `frontend/apps/site-nextjs/src/components/tut/HeroBanner.tsx`
- `frontend/apps/site-nextjs/src/components/tut/TextImage.tsx`
- `frontend/apps/site-nextjs/src/components/tut/CardGrid.tsx`
- `frontend/apps/site-nextjs/src/components/tut/Card.tsx`
- `frontend/apps/site-nextjs/src/components/tut/ProductTeaser.tsx`
- `frontend/apps/site-nextjs/src/components/tut/ProductSpecs.tsx`
- `frontend/apps/site-nextjs/src/components/tut/Gallery.tsx`
- `frontend/apps/site-nextjs/src/components/tut/CtaBanner.tsx`
- `frontend/apps/site-nextjs/src/components/tut/Accordion.tsx`
- `frontend/apps/site-nextjs/src/components/tut/AccordionItem.tsx`
- `frontend/apps/site-nextjs/src/components/tut/VideoEmbed.tsx`
- `frontend/apps/site-nextjs/src/components/tut/Navigation.tsx`
- `frontend/apps/site-nextjs/src/components/tut/Breadcrumb.tsx`
- `frontend/apps/site-nextjs/src/components/tut/FooterLinks.tsx`
- `frontend/apps/site-nextjs/src/components/tut/LanguageSelector.tsx`
- `frontend/apps/site-nextjs/src/components/tut/StatCounter.tsx`
- `frontend/apps/site-nextjs/src/components/tut/Testimonial.tsx`
- `frontend/apps/site-nextjs/src/components/tut/ModelComparison.tsx`
- `frontend/apps/site-nextjs/src/components/component-map.tsx` (modified)

---

## §5 — Completion & Handoff Notes

> Agents add entries here when completing or pausing tasks.
> Use the templates below. Most recent entries go at the TOP.

---

*No entries yet. First task completion will be recorded here.*

---

### DONE Template
```
### [ITEM-ID] — Title
**Status:** ✅ DONE
**Date:** YYYY-MM-DD
**Agent:** [agent identifier or session]
**AC Verification:**
  - [x] AC1 — verified by [how you tested]
  - [x] AC2 — verified by [how you tested]
**Files Changed:**
  - path/to/file — [what changed]
**Build Verified:** Yes — `mvn clean compile` passed / frontend build passed
**CI Status:** ✅ GitHub Actions passed (link if available)
**Notes:** [anything relevant for future agents]
```

### PAUSED Template
```
### [ITEM-ID] — Title
**Status:** 🟠 PAUSED
**Date:** YYYY-MM-DD
**Agent:** [agent identifier or session]
**Progress:** [X]% complete
**What was done:**
  - [completed sub-tasks with file references]
**What remains:**
  - [remaining sub-tasks with specific details]
**Current state of code:**
  - Does it compile? Yes/No
  - path/to/file — [state: complete? partial? broken?]
**Where I stopped:**
  [Exact location + reason for stopping]
**To continue:**
  1. [Step-by-step instructions for next agent]
  2. [Be very specific — file names, method names, what to implement next]
  3. [Include any gotchas or design decisions made]
```

---

## §6 — Architecture Decisions Log

> Record significant design decisions made during implementation so future agents understand WHY.

| Date | Task ID | Decision | Rationale |
|------|---------|----------|-----------|
| — | — | *No entries yet* | — |

---

## §7 — Validation Checklist (for `/validate` command)

When running `/validate`, check ALL of the following:

### Build Health
- [ ] `cd flexcms && mvn clean compile` — all backend modules compile
- [ ] `cd flexcms && mvn test` — all unit tests pass
- [ ] `cd frontend && pnpm install && pnpm build` — all frontend packages build
- [ ] No TypeScript errors in frontend

### Work Board Consistency
- [ ] No 🔵 IN PROGRESS items without an active agent (orphaned tasks)
- [ ] No stale module locks in §2 (locks without matching IN PROGRESS task)
- [ ] Every ✅ DONE item has a completion note in §5
- [ ] All blockers for 🔴 BLOCKED items checked — unblock if blocker is ✅ DONE

### Code Quality
- [ ] No mock/dummy data in production code (only in test classes)
- [ ] No `System.out.println` debugging statements
- [ ] No commented-out code blocks (clean up or remove)
- [ ] All new files follow naming conventions from `CLAUDE.md`

### CI/CD
- [ ] Latest commit pushed to `main`
- [ ] GitHub Actions CI workflow passed

