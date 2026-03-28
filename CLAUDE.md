# CLAUDE.md

> **This file is binding for ALL AI assistants working in this repository — Claude Code, GitHub Copilot,
> Cursor, JetBrains AI, ChatGPT, Gemini, or any other tool. The workflow, commands, and rules defined
> here are not optional and apply regardless of which IDE or AI product you are using. If your environment
> does not support slash commands natively, read the "Commands Reference" section below and execute the
> steps manually whenever the user invokes a command by name.**

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Identity

FlexCMS is an enterprise headless CMS with three independent pillars: **Content (CMS)**, **Digital Assets (DAM)**, and **Products (PIM)**. Backend is Spring Boot 3.3 + Java 21 + PostgreSQL 16 (ltree + JSONB). Frontend is a TypeScript pnpm monorepo (Turborepo) with Next.js 14 and a `@flexcms/ui` design system (Radix + Tailwind + CVA). **The backend NEVER generates HTML — it returns JSON only. All rendering is done by the frontend.**

## Engineering Principle: Architecture Over Speed

> **CRITICAL — applies to every agent, every task, no exceptions.**

**NEVER choose a faster or shorter implementation over the architecturally correct one.**

Before writing a single line of code, ask:
1. Does this follow the established layer separation (model → repository → service → controller)?
2. Am I introducing a shortcut that violates a pattern already present in the codebase?
3. Would a senior engineer on this project consider this approach production-quality?

If the correct approach takes longer to implement — write it anyway. Shortcuts create compounding technical debt that future agents and engineers must undo. The extra time spent doing it right is always less than the time lost fixing it later.

**Specific rules:**
- Never bypass the service layer by calling repositories directly from controllers.
- Never inline business logic in controllers — it belongs in services.
- Never skip transactions on write operations.
- Never return internal model entities from APIs when a DTO/projection is appropriate.
- Never use `FetchType.EAGER` to avoid lazy-loading issues — solve the session/transaction boundary instead.
- Never add workarounds (e.g., `@JsonIgnore`, `JOIN FETCH`) as the primary fix without understanding why the session boundary is wrong.
- Never duplicate code to avoid refactoring — extract and reuse.

---

## Work Board Protocol (SDLC)

**Before starting ANY work, read `WORK_BOARD.md`.** It is the single source of truth for all implementation coordination: task status, module lock table (prevents two agents from editing the same module), context packets (exactly which files to read), acceptance criteria, and completion/handoff notes.

### Task Lifecycle

```
🟢 OPEN ──→ 🔵 IN PROGRESS ──→ ✅ DONE
                  │
                  └──→ 🟠 PAUSED (handoff notes in §5)
                          │
                          └──→ 🔵 IN PROGRESS (via /continue)
```

### Mandatory Workflow (every task, no exceptions)

| Step | Action | Validation Gate |
|------|--------|-----------------|
| 1. **Pick** | Find 🟢 OPEN item (🔴 P0 first, then 🟠 PAUSED). Check §2 Module Lock — skip if locked. | Blocker items must be ✅ DONE |
| 2. **Claim** | Update §3 status → 🔵 IN PROGRESS. Lock modules in §2 (your task ID + date). | — |
| 3. **Context** | Read §4 Context Packet. Read ALL `read_first` files. If no packet exists, read source files in "Modules Touched". | Do NOT start coding until you understand the current code |
| 4. **Implement** | Follow `CLAUDE.md` conventions. Verify each AC as you go. | No mock/dummy data in production code |
| 5. **Build** | Backend: `cd flexcms && mvn clean compile`. Frontend: `cd frontend && pnpm build`. | ❌ MUST pass — do not proceed if build fails |
| 6. **Unit Tests** | Run `cd flexcms && mvn test`. Fix any failures before continuing. | ❌ MUST pass — all tests green, no skips |
| 7. **E2E Tests** | If `admin-e2e` package exists: `cd frontend/apps/admin-e2e && pnpm exec playwright test`. Apply the **Test Failure Protocol** (see below) on any failure. | ❌ MUST pass — 0 failing tests |
| 8. **Pre-Push Gate** | Run the **full local validation** (see below). Fix any failures. **NEVER push to GitHub until every check passes locally.** | ❌ ALL must pass — zero exceptions |
| 9. **Update Board** | §3: status → ✅ DONE. §2: clear locks. §5: add Completion Note (template in §5). | Every field in the template must be filled |
| 10. **Commit & Push** | `git add -A && git commit -m "feat(<ID>): <description>" && git push` | Use item ID as commit scope |

### If you must stop mid-task (PAUSE)
1. Ensure code compiles (never leave a broken build)
2. §3: status → 🟠 PAUSED
3. §5: add Handoff Note with exact continuation instructions (template in §5)
4. Keep module locks in §2 (next agent needs them)

### Multi-Agent Rules
- **ONE agent per task** — never touch a 🔵 IN PROGRESS task
- **Module locks are mandatory** — verify §2 before editing ANY file in a module
- **No data assumptions** — always read current source; another agent may have changed it
- **Leave compilable code** — `mvn clean compile` must pass at all times

### ⛔ Pre-Push Local Validation (MANDATORY — zero exceptions)

> **IMPORTANT: NEVER push to GitHub until ALL of the following pass locally.**
> A failed CI build wastes time, blocks other agents, and may break the QA deployment pipeline.
> Run these checks in order. If ANY step fails, fix it before proceeding.

```bash
# Step 1: Backend compile (all modules)
cd flexcms && mvn clean compile
# ❌ If this fails → fix compile errors before anything else

# Step 2: Backend unit + integration tests
cd flexcms && mvn test
# ❌ If this fails → fix failing tests; never skip or @Ignore them

# Step 3: Frontend build (all packages in dependency order)
cd frontend && pnpm install && pnpm build
# ❌ If this fails → fix TypeScript/build errors

# Step 4: E2E tests — mock API mode (no running backend required)
# Run only if admin-e2e package exists
if [ -d "frontend/apps/admin-e2e" ]; then
  cd frontend/apps/admin-e2e && pnpm exec playwright test --project=chromium
fi
# ❌ If this fails → apply Test Failure Protocol (see below)

# Step 5: Docker image build (if you changed backend code)
cd flexcms && docker build -t flexcms-app:local-test .
# ❌ If this fails → fix Dockerfile or packaging issues
# ℹ️  Skip this step ONLY if your changes are frontend-only
```

**After ALL steps pass → you may commit and push.**

If you cannot get a step to pass after 3 attempts, **PAUSE the task** (update WORK_BOARD.md §3 → 🟠 PAUSED, add Handoff Note in §5 with the exact error) rather than pushing broken code.

---

### 🧪 Test Failure Protocol (applies to E2E Playwright tests)

When a Playwright test fails after you implement a feature, fix a bug, or write a new test:

**Step 1 — Diagnose the failure:**
- Read the Playwright error output carefully
- Check if it's a **test syntax/selector error** or a **real product defect**

**Step 2a — If the test itself is wrong** (bad selector, wrong assertion, race condition):
- Fix the test code
- Re-run the specific test: `pnpm exec playwright test <spec-file> --project=chromium`
- Continue fixing until it passes
- No bug entry needed

**Step 2b — If the product is wrong** (expected behaviour not achieved):
- The feature/fix you just implemented has a defect
- Record the bug **inline in the current task's §4 Context Packet** in `WORK_BOARD.md`
  using the `🐛 BUG-INLINE` format (see WORK_BOARD.md §6)
- Fix the **code** (not the test — the test is correct)
- Re-run the test until it passes
- Update the inline bug entry with resolution notes

**Step 3 — Never mark a TA-xx task DONE while any test is failing.**
The task stays 🔵 IN PROGRESS until every test in that spec file passes on the first run
(no skips, no retries relied upon).

**Step 4 — After all tests pass:**
- Inline bug entries in §4 are updated to `✅ FIXED`
- The TA task completion note in §5 summarises bugs found + fixes applied

### Commands Reference

> **All AI assistants MUST follow these command definitions, regardless of environment.**
> In Claude Code (VS Code / CLI) these are invoked as `/implement`, `/pick`, etc.
> In GitHub Copilot, Cursor, JetBrains AI, or any other tool, execute the **exact same steps**
> listed below whenever the user types the command name — with or without the `/` prefix.
> The command definitions below are the authoritative specification. The slash syntax is just shorthand.

---

#### `implement` — Pick next open task and implement it

1. Read `WORK_BOARD.md` in full.
2. Find the highest-priority 🟢 OPEN task (🔴 P0 → 🟠 P1 → 🟡 P2 → 🟢 P3 → 🧪 TA). Skip any 🔴 BLOCKED task whose blocker is not ✅ DONE. Skip any task whose modules are locked in §2.
3. If a 🟠 PAUSED task exists for the same priority band — resume it instead (follow `/continue`).
4. Execute the **Mandatory Workflow** steps 1–10 from the top of this file for that task.
5. After the task is ✅ DONE, immediately loop back to step 1 and pick the next task. Continue until the user says stop.

---

#### `pick <TASK-ID>` — Implement a specific task by ID (e.g., `pick TA-00`, `pick P1-04`)

1. Read `WORK_BOARD.md` in full.
2. Locate the task with the given ID in §3.
3. Verify its blockers are all ✅ DONE. If not, report which blocker is outstanding and stop.
4. Verify no module lock conflicts in §2. If a conflict exists, report it and stop.
5. Execute the **Mandatory Workflow** steps 1–10 for that task.

---

#### `continue` — Resume a paused task

1. Read `WORK_BOARD.md` §5 (Completion & Handoff Notes) — find the most recent 🟠 PAUSED entry.
2. Read the Handoff Note for that task (exact files touched, last completed step, blocking error if any).
3. Read all files listed in `read_first` for that task's §4 Context Packet.
4. Resume from the step indicated in the Handoff Note.
5. Complete the task following the **Mandatory Workflow** from that step onward.

---

#### `status` — Show work board summary

1. Read `WORK_BOARD.md` §2, §3.
2. Print a summary table:
   - Count of tasks by status: 🟢 OPEN / 🔵 IN PROGRESS / 🟠 PAUSED / 🔴 BLOCKED / ✅ DONE
   - List every 🟢 OPEN and 🟠 PAUSED task by ID + title
   - List every 🔵 IN PROGRESS task with its locked modules
   - List the next recommended task to pick up (highest priority available)
3. Flag any anomalies: orphaned IN PROGRESS tasks, stale locks, missing completion notes.

---

#### `finish` — Complete or pause the current task with documentation

1. Identify which task is currently 🔵 IN PROGRESS (from §2 module locks or §3 status).
2. If the task is fully implemented and all ACs are met:
   a. Run the full Pre-Push Local Validation (all 5 steps).
   b. If all pass: update §3 status → ✅ DONE, clear locks in §2, add Completion Note in §5, commit and push.
3. If the task cannot be completed right now:
   a. Ensure code compiles (`mvn clean compile`).
   b. Update §3 status → 🟠 PAUSED, keep locks in §2.
   c. Add Handoff Note in §5 with: last completed step, files modified, exact error or blocker, instructions for the next agent.
   d. Commit and push the partial work with message `wip(<ID>): <description>`.

---

#### `validate` — Full build + work board consistency check

Execute every item in `WORK_BOARD.md §7 — Validation Checklist`:

1. `cd flexcms && mvn clean compile` — must exit 0
2. `cd flexcms && mvn test` — must exit 0, 0 failures
3. `cd frontend && pnpm install && pnpm build` — must exit 0
4. If `frontend/apps/admin-e2e` exists: `cd frontend/apps/admin-e2e && pnpm exec playwright test --project=chromium` — must exit 0
5. Work Board checks: no orphaned IN PROGRESS, no stale locks, every ✅ DONE has a §5 note, all BLOCKED blockers verified, all BUG-INLINE entries for DONE TA tasks are ✅ FIXED.
6. Code quality checks: no mock data in production code, no `System.out.println`, no commented-out blocks.
7. Report a ✅ PASS / ❌ FAIL for each item. If any item fails, list the exact fix required.

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

# E2E tests — run all (mock API mode, no backend needed)
cd frontend/apps/admin-e2e && pnpm exec playwright test

# E2E tests — run single spec
cd frontend/apps/admin-e2e && pnpm exec playwright test tests/phase1-critical/dashboard.spec.ts

# E2E tests — run with browser UI (headed mode, for debugging)
cd frontend/apps/admin-e2e && pnpm exec playwright test --headed --project=chromium

# E2E tests — show HTML report after run
cd frontend/apps/admin-e2e && pnpm exec playwright show-report

# E2E tests — run only smoke suite across all browsers
cd frontend/apps/admin-e2e && pnpm exec playwright test --grep @smoke

# E2E tests — update visual regression snapshots (after intentional UI change)
cd frontend/apps/admin-e2e && pnpm exec playwright test --update-snapshots
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

**Content is a tree:** all content lives as PostgreSQL rows with `ltree` paths (`.` separator, e.g. `content.mysite.en.homepage`). URLs use `/` — conversion happens in controllers. JSONB stores component properties per node.

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
| **pgAdmin 4 (DB Browser)** | **http://localhost:5050** (no login — opens directly; DB password: `flexcms`) |

## Known Technical Debt

- `SecurityConfig` has `permitAll()` in production profile — placeholder only, not permanent.
- `PageApiController.getChildren()` manually `new ContentNodeService()` instead of DI — this is a bug.
- `ContentNode.getChildren()` via `loadChildrenRecursive()` is an N+1 risk at scale.
- Several list endpoints lack pagination.
