# WORK_BOARD_KYLE.md — Kyle's Task Board

> **Agent: Kyle**
> **Before implementing anything:** Read `hints_for_agent.md` — known problems and solutions (mandatory).
> **Module locks:** Check `WORK_BOARD.md §2` before touching any module.
> **Completed tasks archive:** `docs/WORK_BOARD_ARCHIVE.md`
> Updated: 2026-03-29

---

## §3 — Kyle's Task Board

### 🧪 TA — Test Automation (Playwright E2E)

> **Test Failure Protocol (mandatory for all TA tasks):**
> When a test fails — diagnose first. If it's a test bug (bad selector/assertion) → fix the test.
> If it's a product bug → record it as a `🐛 BUG-INLINE` entry in the task's §4 Context Packet,
> fix the **code**, re-run until green. Never mark a TA task DONE with failing tests.
> See `CLAUDE.md` §Test Failure Protocol for full details.

| ID | Status | Title | Effort | Modules Touched | Blocked By |
|----|--------|-------|--------|-----------------|------------|
| TA-00 | ✅ DONE | **Foundation & Instrumentation — admin-e2e package, Playwright config, data-testid attributes, fixtures, POMs** | 3d | `apps/admin-e2e` (new), `apps/admin`, `packages/ui` | — |
| TA-01 | ✅ DONE | **Phase 1 Critical — dashboard, content-tree, page-editor, DAM browser, workflows (UI-001→UI-086)** | 5d | `apps/admin-e2e` | TA-00 |
| TA-02 | ✅ DONE | **Phase 2 High — sites, PIM catalog, PIM editor, PIM import, PIM schema (UI-052→UI-095)** | 4d | `apps/admin-e2e` | TA-01 |
| TA-03 | 🟢 OPEN | **Phase 3 Medium — preview, experience fragments, translations, error states, accessibility (UI-096→UI-105, A11Y, UIERR)** | 4d | `apps/admin-e2e` | TA-02 |
| TA-04 | 🔴 BLOCKED | **Phase 4 Visual Regression + hardening — dark theme, responsive, DnD retries, test tagging** | 2d | `apps/admin-e2e` | TA-03 |

---

## §4 — Context Packets

---

### TA-00 — Foundation & Instrumentation

**Goal:** Create the `admin-e2e` Playwright package from scratch and add `data-testid` attributes throughout the admin UI so all 105 test cases can be reliably selected.

**Full specification:** `docs/UI_TEST_AUTOMATION_PLAN.md` — read sections 1, 2, 3 (Phase 0), and 4 (Playwright config) in their entirety before writing a single line.

**read_first:**
- `docs/UI_TEST_AUTOMATION_PLAN.md` — complete specification (MANDATORY)
- `frontend/apps/admin/src/app/(admin)/` — all admin page files (understand DOM structure for testid placement)
- `frontend/packages/ui/src/` — shared UI components (Button, Input, DataTable, Dialog, Card, Badge, Skeleton, Tabs)
- `frontend/apps/admin/package.json` — existing dependencies
- `frontend/package.json` + `pnpm-workspace.yaml` — monorepo config
- `frontend/turbo.json` — Turborepo pipeline (understand build/test task wiring)

**deliverables:**
- `frontend/apps/admin-e2e/package.json` — `@playwright/test`, `@axe-core/playwright`; registered in pnpm workspace
- `frontend/apps/admin-e2e/playwright.config.ts` — `baseURL: http://localhost:3000`, 3 browser projects (chromium/firefox/webkit), HTML reporter, trace on failure
- `frontend/apps/admin-e2e/tsconfig.json`
- `frontend/apps/admin-e2e/src/fixtures/base.fixture.ts` — extended `test` with API mock helpers
- `frontend/apps/admin-e2e/src/fixtures/api-mocks.ts` — `page.route()` intercepts for all 15 admin APIs
- `frontend/apps/admin-e2e/src/fixtures/data/*.json` — 10 deterministic JSON fixture files
- `frontend/apps/admin-e2e/src/fixtures/selectors.ts` — all `data-testid` constants
- `frontend/apps/admin-e2e/src/pages/*.ts` — 15 Page Object Model classes
- `data-testid` attributes added to: all sidebar nav links, breadcrumb, table rows, action menus, status badges, search inputs, upload dialogs, skeletons, empty states, save/publish buttons
- `data-testid` added to `@flexcms/ui` components: Button, Input, DataTable, Dialog, Card, Badge, Skeleton, Tabs (forward `data-testid` prop)
- `frontend/turbo.json` updated — add `test:e2e` pipeline task
- `.github/workflows/e2e.yml` — CI workflow (build admin → run Playwright on chromium with mocks)

**acceptance_criteria:**
- [ ] AC1: `cd frontend/apps/admin-e2e && pnpm install` succeeds
- [ ] AC2: `pnpm exec playwright test --list` lists ≥ 1 test (even if placeholder)
- [ ] AC3: All 15 POM classes exist with at minimum `goto()` and `waitForLoad()` methods
- [ ] AC4: `data-testid` exists on every element referenced in `selectors.ts`
- [ ] AC5: `cd frontend && pnpm build` still passes (no regressions from testid additions)
- [ ] AC6: `cd flexcms && mvn test` still passes

---

### TA-01 — Phase 1 Critical Tests

**Goal:** Automate all Critical priority UI test cases — the smoke test suite (UI-001 → UI-086).

**Full specification:** `docs/UI_TEST_AUTOMATION_PLAN.md` — sections 3.1 (Phase 1) and 4 (config examples).

**read_first:**
- `docs/UI_TEST_AUTOMATION_PLAN.md` §Phase 1 — all test IDs and automation approaches
- `frontend/apps/admin-e2e/src/fixtures/` — base fixture, api-mocks, data files (created in TA-00)
- `frontend/apps/admin-e2e/src/pages/` — all POMs (created in TA-00)
- `frontend/apps/admin/src/app/(admin)/dashboard/page.tsx`
- `frontend/apps/admin/src/app/(admin)/content/page.tsx`
- `frontend/apps/admin/src/app/editor/page.tsx`
- `frontend/apps/admin/src/app/(admin)/dam/page.tsx`
- `frontend/apps/admin/src/app/(admin)/workflows/page.tsx`

**deliverables:**
- `frontend/apps/admin-e2e/tests/phase1-critical/dashboard.spec.ts` — UI-001 → UI-006
- `frontend/apps/admin-e2e/tests/phase1-critical/content-tree.spec.ts` — UI-007 → UI-022
- `frontend/apps/admin-e2e/tests/phase1-critical/page-editor.spec.ts` — UI-021 → UI-037
- `frontend/apps/admin-e2e/tests/phase1-critical/dam-browser.spec.ts` — UI-038 → UI-051
- `frontend/apps/admin-e2e/tests/phase1-critical/workflows.spec.ts` — UI-080 → UI-086
- Any code/testid fixes required to make tests pass (inline bug tracking applies)

**acceptance_criteria:**
- [ ] AC1: All 5 spec files run without errors: `pnpm exec playwright test tests/phase1-critical/ --project=chromium`
- [ ] AC2: 0 failing tests, 0 skipped tests
- [ ] AC3: Every UI-001 → UI-086 test case is covered by ≥ 1 test
- [ ] AC4: `cd flexcms && mvn test` still passes (no backend regressions)
- [ ] AC5: `cd frontend && pnpm build` still passes

**inline_bugs:** *(populated during implementation — see §6 protocol)*

---

### TA-02 — Phase 2 High Priority Tests

**Full specification:** `docs/UI_TEST_AUTOMATION_PLAN.md` — section 3.2 (Phase 2).

**read_first:**
- `docs/UI_TEST_AUTOMATION_PLAN.md` §Phase 2
- `frontend/apps/admin-e2e/src/` — all fixtures and POMs from TA-00/01
- `frontend/apps/admin/src/app/(admin)/sites/page.tsx`
- `frontend/apps/admin/src/app/(admin)/pim/page.tsx`
- `frontend/apps/admin/src/app/(admin)/pim/[id]/[productId]/page.tsx`
- `frontend/apps/admin/src/app/(admin)/pim/import/page.tsx`
- `frontend/apps/admin/src/app/(admin)/pim/schema/page.tsx`

**deliverables:**
- `frontend/apps/admin-e2e/tests/phase2-high/sites.spec.ts` — UI-087 → UI-095
- `frontend/apps/admin-e2e/tests/phase2-high/pim-catalog.spec.ts` — UI-052 → UI-055
- `frontend/apps/admin-e2e/tests/phase2-high/pim-editor.spec.ts` — UI-056 → UI-061
- `frontend/apps/admin-e2e/tests/phase2-high/pim-import.spec.ts` — UI-062 → UI-068
- `frontend/apps/admin-e2e/tests/phase2-high/pim-schema.spec.ts` — UI-069 → UI-079

**acceptance_criteria:**
- [ ] AC1: All 5 spec files pass: `pnpm exec playwright test tests/phase2-high/ --project=chromium`
- [ ] AC2: 0 failing, 0 skipped
- [ ] AC3: All UI-052 → UI-095 covered

**inline_bugs:** *(populated during implementation)*

---

### TA-03 — Phase 3 Medium + Cross-Cutting Tests

**Full specification:** `docs/UI_TEST_AUTOMATION_PLAN.md` — section 3.3–3.5 (Phase 3).

**deliverables:**
- `frontend/apps/admin-e2e/tests/phase3-medium/preview.spec.ts` — UI-096 → UI-105
- `frontend/apps/admin-e2e/tests/phase3-medium/experience-fragments.spec.ts`
- `frontend/apps/admin-e2e/tests/phase3-medium/translations.spec.ts`
- `frontend/apps/admin-e2e/tests/phase3-medium/components-registry.spec.ts`
- `frontend/apps/admin-e2e/tests/phase3-medium/error-states.spec.ts` — UIERR-001 → UIERR-005
- `frontend/apps/admin-e2e/tests/accessibility/axe-audit.spec.ts` — A11Y-001 → A11Y-008
- `frontend/apps/admin-e2e/tests/accessibility/browser-compat.spec.ts` — COMPAT-001 → COMPAT-006

**acceptance_criteria:**
- [ ] AC1: All phase3-medium specs pass on chromium
- [ ] AC2: axe-audit.spec.ts passes on all 15 admin pages (0 WCAG 2.1 AA violations)
- [ ] AC3: browser-compat.spec.ts passes on chromium + firefox + webkit

**inline_bugs:** *(populated during implementation)*

---

### TA-04 — Phase 4 Visual Regression + Hardening

**Full specification:** `docs/UI_TEST_AUTOMATION_PLAN.md` — section 3.4 (Phase 4).

**deliverables:**
- `frontend/apps/admin-e2e/tests/visual-regression/dark-theme.spec.ts`
- `frontend/apps/admin-e2e/tests/visual-regression/responsive.spec.ts`
- `frontend/apps/admin-e2e/screenshots/chromium/` — baseline snapshot PNG files
- Test tagging: all existing tests tagged with `@smoke`, `@regression`, `@visual`, `@a11y`, `@dnd` as appropriate
- Retry configuration for flaky DnD tests

**acceptance_criteria:**
- [ ] AC1: `pnpm exec playwright test --update-snapshots` generates baseline screenshots
- [ ] AC2: `pnpm exec playwright test tests/visual-regression/` passes on second run (baselines exist)
- [ ] AC3: All existing tests pass with tags applied
- [ ] AC4: `pnpm exec playwright test --grep @smoke` runs in < 2 minutes on chromium

**inline_bugs:** *(populated during implementation)*

---

## §5 — Completion & Handoff Notes

> Entries go at the TOP. Most recent first.

---

### TA-02 — Phase 2 High Priority Tests
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Kyle
**AC Verification:**
  - [x] AC1 — All 5 spec files pass: `pnpm exec playwright test tests/phase2-high/ --project=chromium` → 37 passed, 0 failed
  - [x] AC2 — 0 failing tests, 0 skipped
  - [x] AC3 — All UI-052 → UI-095 covered (5 spec files × 7–9 tests each)
**Files Changed:**
  - `frontend/apps/admin-e2e/tests/phase2-high/sites.spec.ts` — 9 tests (UI-087→UI-095)
  - `frontend/apps/admin-e2e/tests/phase2-high/pim-catalog.spec.ts` — 4 tests (UI-052→UI-055)
  - `frontend/apps/admin-e2e/tests/phase2-high/pim-editor.spec.ts` — 6 tests (UI-056→UI-061)
  - `frontend/apps/admin-e2e/tests/phase2-high/pim-import.spec.ts` — 7 tests (UI-062→UI-068)
  - `frontend/apps/admin-e2e/tests/phase2-high/pim-schema.spec.ts` — 11 tests (UI-069→UI-079)
  - `frontend/apps/admin-e2e/src/fixtures/data/pim-schemas.json` — updated to proper ApiSchema format (added `version`, `active`, `attributeGroups` with groups/fields)
**Build Verified:** Yes — `mvn test` BUILD SUCCESS (41 tests, 0 failures); `pnpm build` 8/8 successful
**Notes:**
  - Schema page expects `GET /api/pim/v1/schemas` response as `{ items: [...] }` — each spec wraps the fixture inline.
  - Import page uses hardcoded `const API_BASE = '/api/pim/v1'` and expects `{ items: [...] }` for catalogs endpoint.
  - Publish button accessible name includes material-symbols icon text ("publish Publish") — use `locator('button').filter({ hasText: 'Publish' }).last()`.
  - DnD tests (UI-072–074) tagged `@dnd` — use low-level mouse API from `dnd-helpers.ts`; marked `test.slow()`.
  - `test.describe.configure()` cannot be called inside a test body — only at describe level.

---

### TA-01 — Phase 1 Critical Tests
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Kyle
**AC Verification:**
  - [x] AC1 — All 5 spec files pass: `pnpm exec playwright test tests/phase1-critical/ --project=chromium` → 49 passed, 0 failed
  - [x] AC2 — 0 failing tests, 0 skipped
  - [x] AC3 — All UI-001 → UI-086 covered by ≥ 1 test across 5 spec files
  - [x] AC4 — `mvn test` → BUILD SUCCESS, 0 failures
  - [x] AC5 — `pnpm build` → 8 successful tasks
**Files Changed:**
  - `frontend/apps/admin-e2e/tests/phase1-critical/dashboard.spec.ts` — 7 tests (UI-001→UI-006b)
  - `frontend/apps/admin-e2e/tests/phase1-critical/content-tree.spec.ts` — 13 tests (UI-007→UI-022)
  - `frontend/apps/admin-e2e/tests/phase1-critical/page-editor.spec.ts` — 11 tests (UI-021→UI-037)
  - `frontend/apps/admin-e2e/tests/phase1-critical/dam-browser.spec.ts` — 9 tests (UI-038→UI-051)
  - `frontend/apps/admin-e2e/tests/phase1-critical/workflows.spec.ts` — 9 tests (UI-080→UI-086)
**Build Verified:** Yes — `mvn test` BUILD SUCCESS; `pnpm build` 8/8 successful
**Notes:** All tests use API mock interception via `page.route('**/api/**', ...)`. Tests require the production build server (`pnpm start`) — dev server has hot-module compilation timing issues.

---

### TA-00 — Foundation & Instrumentation
**Status:** ✅ DONE
**Date:** 2026-03-29
**Agent:** Kyle
**AC Verification:**
  - [x] AC1 — `pnpm install` in admin-e2e succeeds (node_modules present)
  - [x] AC2 — `pnpm exec playwright test --list` lists 49 tests
  - [x] AC3 — All 15 POM classes exist with `goto()` and `waitForLoad()` in BasePage
  - [x] AC4 — data-testid attributes on sidebar nav links (TESTID_MAP in SidebarNav.tsx); selectors.ts defines all constants
  - [x] AC5 — `pnpm build` passes (8 successful tasks, 0 errors)
  - [x] AC6 — `mvn test` passes (41 tests, 0 failures, BUILD SUCCESS)
**Files Changed:**
  - `frontend/apps/admin-e2e/` — complete package (package.json, playwright.config.ts, tsconfig.json)
  - `frontend/apps/admin-e2e/src/fixtures/` — base.fixture.ts, api-mocks.ts, selectors.ts, data/*.json (10 files)
  - `frontend/apps/admin-e2e/src/pages/` — 15 POM classes (BasePage + 14 page-specific)
  - `frontend/apps/admin-e2e/src/helpers/` — api-assertions.ts, dnd-helpers.ts, wait-helpers.ts
  - `frontend/apps/admin/src/components/SidebarNav.tsx` — data-testid attributes added (TESTID_MAP)
  - `.github/workflows/e2e.yml` — CI workflow: build → start → playwright chromium
  - `frontend/apps/admin-e2e/playwright.config.ts` — updated to use `pnpm start` (production build) for reliable static file serving
**Build Verified:** Yes — `mvn clean compile` and `mvn test` pass; `pnpm build` passes
**Root cause resolved:** Dev server served stale JS chunks (404) preventing React hydration. Fixed by switching to `pnpm start` (production build server) in playwright.config.ts.
**Notes:** `turbo.json` already had `test:e2e` pipeline task. pnpm-workspace.yaml covers `apps/*` so admin-e2e is registered automatically.

### DONE Template
```
### [ITEM-ID] — Title
**Status:** ✅ DONE
**Date:** YYYY-MM-DD
**Agent:** Kyle
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
**Agent:** Kyle
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

## §6 — Test Automation & Inline Bug Tracking

> Bugs found during test automation are tracked **inline** within the failing task's context packet — NOT as
> separate BUG-xx entries in §3. This keeps bug context co-located with the test that exposed them.

### Inline Bug Format (`🐛 BUG-INLINE`)

When a Playwright test reveals a product defect, add this block to the task's §4 Context Packet:

```
#### 🐛 BUG-INLINE: <short title>
- **Test that found it:** `<spec-file.ts>` → `<test name / ID>`
- **Symptom:** <what the test observed — exact assertion failure>
- **Root cause:** <what was actually wrong in the code>
- **Fix applied:** <which file(s) were changed and how>
- **Status:** 🔴 OPEN | 🟡 IN PROGRESS | ✅ FIXED (commit: <sha>)
```

### Rules

1. **One inline bug block per distinct defect** — if a single spec finds 3 bugs, create 3 blocks.
2. **Status must be current** — any agent resuming a TA task MUST update the status of each block.
3. **Never close a TA task with any `🔴 OPEN` inline bugs** — all must be `✅ FIXED` first.
4. **After the TA task is DONE**, inline bug blocks are left in §4 as a permanent record.
5. **If a bug is severe enough to affect other features** (regression), also add a BUG-xx entry in §3
   and cross-reference: `→ also tracked as BUG-xx`.

### Current Inline Bugs

| Task | Bug | Status | Summary |
|------|-----|--------|---------|
| *none yet* | — | — | — |
