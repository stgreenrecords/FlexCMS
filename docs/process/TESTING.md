# FlexCMS Testing Standard

**Every feature ships with tests that prove its acceptance criteria, and user-visible behaviour is always proven with Playwright.** The agent that builds a feature also designs, writes and runs its tests. There is no separate QA stage, so the tests are the acceptance.

---

## 1. Principles

1. **Test cases before code.** Every task spec has a `## Test cases` table (§4), and every row becomes an automated test.
2. **Playwright proves behaviour.** Each AC with observable behaviour, whether an API response, UI state or persisted data, has at least one Playwright test at level `api`, `ui` or `e2e`. Unit and integration tests complement Playwright tests but never replace them.
3. **Traceable.** Test titles start with the test-case ID, and tests carry the task tag. `--grep @ECMS-01` runs everything for a task.
4. **No false greens.** A test must fail when the feature is broken. A live test must fail when the backend is down. Never assert current broken behaviour as "expected". If a capability does not exist yet, the test stays failing, or it is `test.fixme` with the blocking task ID in the reason; it is never rewritten to pass.
5. **Deterministic.** No `waitForTimeout` as synchronisation. Wait on locators, responses or state. No dependency on test order. Data created by a test is unique to the run, and the test cleans it up.

---

## 2. Test levels

| Level | Tool | Location | Talks to | Use it for |
|---|---|---|---|---|
| `unit` | JUnit 5 + Mockito / Vitest | `flexcms/*/src/test/**/*Test.java`, `frontend/**/*.test.ts(x)` | nothing | Services, mappers, validators, utilities, React/Vue logic |
| `integration` | JUnit 5 + Testcontainers | `flexcms/*/src/test/**/*IT.java` | real PostgreSQL / RabbitMQ in containers | Native SQL, ltree/JSONB queries, Flyway migrations, replication |
| `api` | Playwright `request` | `frontend/apps/e2e/tests/api/` | real Author and Publish | REST/GraphQL contracts: status codes, bodies, RFC 7807 errors, persistence |
| `ui` | Playwright browser, **API mocked** | `frontend/apps/e2e/tests/ui/` | Admin UI + route mocks | Admin UI behaviour and states (loading, empty, error, validation), fast and deterministic |
| `e2e` | Playwright browser, **no mocks** | `frontend/apps/e2e/tests/e2e/` | Admin + Author + Publish + site | User journeys across the stack: author, then publish, then see it on the site |
| `a11y` | Playwright + axe | `frontend/apps/e2e/tests/a11y/` | Admin UI (mocked) | WCAG checks on pages |
| `visual` | Playwright screenshots | `frontend/apps/e2e/tests/visual/` | Admin UI (mocked) | Screenshot baselines for key screens |

### What each type of task must include

| Task touches | Required tests |
|---|---|
| Backend API only | `unit` for service logic + `api` for every endpoint/AC (+ `integration` for new native SQL or migrations) |
| Admin UI only | `unit` for non-trivial logic + `ui` (mocked) for every AC and state + at least one `e2e` happy path against the real backend |
| Full stack | All of the above. The `e2e` journey verifies the **backend result**, not only what the UI shows. |
| Reference site / renderers | `unit` (Vitest) + `e2e` that loads the rendered page and asserts the visible result |
| Bug fix | A regression test that fails before the fix, at the lowest level that reproduces the bug, + Playwright if the bug is user- or API-visible |
| Refactoring (no behaviour change) | Existing tests stay green. Add tests first if the touched code is uncovered. |

---

## 3. Playwright suite layout

The package is `@flexcms/e2e` in `frontend/apps/e2e/`:

```
frontend/apps/e2e/
├── playwright.config.ts     # one project per level (see below)
├── src/
│   ├── env.ts               # service URLs (ADMIN_URL, AUTHOR_URL, PUBLISH_URL, SITE_URL, PUBLISH_SITE_URL)
│   ├── fixtures/
│   │   ├── api.fixture.ts   # authorApi / publishApi request contexts — for api and e2e tests
│   │   ├── api-mocks.ts     # shared route mocks — for ui tests
│   │   ├── base.fixture.ts
│   │   └── data/            # JSON bodies served by the mocks
│   ├── helpers/             # waits, drag-and-drop, test-data (uniqueName), assertions
│   └── pages/               # Page Objects — one class per admin screen
└── tests/
    ├── ui/                  # admin UI, mocked API
    ├── api/                 # REST/GraphQL, live
    ├── e2e/                 # full-stack journeys, live
    ├── a11y/  visual/       # mocked
    └── setup/               # live-stack.setup.ts — runs before live projects
```

| Project | Runs | Needs |
|---|---|---|
| `chromium`, `firefox`, `webkit` | `ui`, `a11y`, `visual` with mocks | Admin production build only |
| `ui-live` | the `ui` specs with mocks **off** | Live stack |
| `api` | `tests/api` | Live stack |
| `e2e` | `tests/e2e` | Live stack (plus the publish-backed site for publish-tier checks) |

The live projects depend on `live-setup`. It fails fast with a clear message when `USE_LIVE_API` is not set or Author/Publish are unreachable.

**Reference examples to copy:** `tests/api/platform-smoke.spec.ts` (api), `tests/e2e/admin-smoke.spec.ts` (e2e), `tests/ui/content-tree.spec.ts` (mocked ui).

---

## 4. Test cases in the task spec

Each task spec has this table. It is drafted when the task is created, finalized during refinement (Definition of Ready), and completed during implementation (Definition of Done).

```markdown
## Test cases

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-01-TC01 | AC1 | api | Given no tag `products:suv`, when POST /api/author/tags {namespace:"products", name:"suv"}, then 201 and GET returns it | tests/api/tags.spec.ts |
| ECMS-01-TC02 | AC1 | api | Given tag exists, when POST the same tag again, then 409 problem+json | tests/api/tags.spec.ts |
| ECMS-01-TC03 | AC4 | unit | TagService.merge re-points content and asset references | TagServiceTest.java |
```

- **TC ID:** `<TASK-ID>-TC<nn>`, never renumbered. Removed cases are struck through, not reused.
- **Covers:** the AC(s) this case proves. Every AC appears at least once.
- **Level:** one of the levels in §2.
- **Scenario:** Given / When / Then, concrete enough that two people would write the same test.
- **Automated in:** the spec or test file path, filled in when the test exists. A task is not Done while any row says `—`.
- Include negative and edge cases: validation, 404, 409, 422, empty lists, permissions, and concurrent edits where relevant.

---

## 5. Writing Playwright tests

**Naming and tagging (mandatory):**

```ts
import { test, expect } from '../../src/fixtures/api.fixture';

test.describe('ECMS-01 Taxonomy and tagging', { tag: ['@ECMS-01'] }, () => {
  test('ECMS-01-TC01 creates a hierarchical tag', async ({ authorApi }) => { /* ... */ });
  test('ECMS-01-TC02 rejects a duplicate tag with 409', async ({ authorApi }) => { /* ... */ });
});
```

- **File per feature area**, named after the area and not the task (`tests/api/tags.spec.ts`, `tests/ui/page-properties.spec.ts`), so tests outlive tasks. Several tasks may add describes to one file.
- **Tags:** `@<TASK-ID>` on every describe or test, plus `@smoke` for a handful of critical-path checks. Bug regressions carry `@BUG-###`.
- **Locators:** prefer `getByRole`, `getByLabel`, `getByText`, then `getByTestId`. Add `data-testid` to the product when nothing semantic exists. Avoid CSS/class selectors.
- **Page Objects:** screen interactions live in `src/pages/<Screen>Page.ts`. Specs read as user intent.
- **Mocked `ui` tests:** mock only `/api/**`, with fixture data in `src/fixtures/data/`. Guard every mock with `if (process.env['USE_LIVE_API']) return;` so the same spec runs under `ui-live`. Cover the loading, empty and error states by mocking delays and 4xx/5xx responses.
- **Live `api` and `e2e` tests:** use the `authorApi`/`publishApi` fixtures, and never mock. Assert the backend result of every write. Read it back through the API, and for publish, through `publishApi` or the publish-backed site.
- **Test data (live):** create what you need with `uniqueName()` from `src/helpers/test-data.ts`. Delete it in `afterEach`/`afterAll`, even on failure. Never modify or delete seeded data (`tut-usa`, `tut-gb`, …).
- **Waiting:** `await expect(locator).toBeVisible()`, `page.waitForResponse(...)`, and `expect.poll(...)` for eventual consistency such as replication. No fixed sleeps.

---

## 6. Running tests

```bash
# Unit tests (fast)
cd flexcms && mvn test                         # backend unit
cd frontend && pnpm test                       # all Vitest packages (excludes the Playwright suite)

# Backend unit + integration (Docker must be running)
cd flexcms && mvn verify

# Playwright — mocked admin UI (no backend needed; requires `cd frontend && pnpm build`)
cd frontend && pnpm test:e2e                   # = chromium project
cd frontend/apps/e2e && pnpm test              # same, from the package
cd frontend/apps/e2e && pnpm test:browsers     # chromium + firefox + webkit

# Playwright — live stack (start it first: `flex start local all`)
cd frontend && pnpm test:e2e:live              # api + e2e + ui-live
cd frontend/apps/e2e && pnpm test:api          # api only
cd frontend/apps/e2e && pnpm test:e2e          # e2e only

# One task, one file, debugging
cd frontend/apps/e2e && pnpm exec playwright test --grep @ECMS-01
cd frontend/apps/e2e && pnpm exec playwright test tests/ui/content-tree.spec.ts
cd frontend/apps/e2e && pnpm test:headed       # visible browser
cd frontend/apps/e2e && pnpm report            # open the HTML report (traces for failures)
cd frontend/apps/e2e && pnpm exec playwright test --update-snapshots   # only after an intended visual change
```

**Publish-tier site checks:** the default site on `:3001` reads live pages from **author**. To prove what a visitor gets, start a site instance backed by publish on `:3005`:

```bash
cd frontend/apps/site-nextjs
NEXT_DIST_DIR=.next-publish FLEXCMS_API_URL=http://localhost:8081 \
  FLEXCMS_PREVIEW_API_URL=http://localhost:8080 pnpm exec next dev -p 3005
```

---

## 7. Quality gates

Run the gates in this order before marking a task Done or pushing. **All applicable gates must pass. Never push a failing gate.**

| # | Gate | Command | When |
|---|---|---|---|
| 1 | Backend compile | `cd flexcms && mvn clean compile` | backend changed |
| 2 | Backend unit + integration | `cd flexcms && mvn verify` (Docker running; runs the unit tests too) | backend changed |
| 3 | Frontend build | `cd frontend && pnpm install && pnpm build` | always |
| 4 | Frontend unit | `cd frontend && pnpm test` | frontend changed |
| 5 | Playwright mocked | `cd frontend && pnpm test:e2e` | always |
| 6 | Playwright live | `flex start local all`, then `cd frontend && pnpm test:e2e:live` | the task added or changed `api`/`e2e` tests, or backend behaviour |
| 7 | Task tests | `cd frontend/apps/e2e && pnpm exec playwright test --grep @<ID>` against the right projects | always; every row in the test-case table passes |
| 8 | Docker image | `cd flexcms && docker build -t flexcms-app:local-test .` | backend changed |

If a gate cannot run in your environment (for example, Docker is unavailable), the task is not Done. Record the gate and the reason in the task Log, and leave the task **In Progress**, or **Blocked** if a human must fix the environment.

---

## 8. When a test fails

1. **Diagnose first.** Read the error, the trace (`pnpm report`) and the screenshot. Decide whether the test or the product is wrong.
2. **The test is wrong** (bad selector, wrong assumption, race): fix the test and re-run that file.
3. **The product is wrong:** fix the product. Never loosen the assertion, and never add `skip` or a retry to get green.
   - If the defect is in this task's scope, note it in the task Log and fix it now.
   - If it is outside the scope, file a `BUG-###`, keep the failing test as `test.fixme('… — blocked by BUG-###')`, and link it from the bug spec.
4. **Flaky tests** are defects in the test. Find the missing wait or shared state and fix it. Do not rely on retries.

---

## 9. Legacy Selenium suite (frozen)

`frontend/apps/selenium-e2e/` (Mocha + selenium-webdriver) holds the older live-stack suites: public-site templates, component library, admin authoring, publishing, DAM and PIM.

- **Do not add or extend Selenium tests.** All new tests are Playwright.
- It is no longer a quality gate. Its suites are being ported to Playwright by the `TEST-*` tasks on the board. After a suite is ported, its Selenium spec is deleted, and the whole package is removed when the port is complete.
- To run a legacy suite while porting: `cd frontend/apps/selenium-e2e && pnpm test:<suite>` (see its `package.json`).
