# FlexCMS Admin UI — Test Automation Implementation Plan

> **Author:** Test Automation Principal Engineer
> **Date:** 2026-03-28
> **Status:** APPROVED FOR IMPLEMENTATION
> **Scope:** End-to-end UI test automation for all 15 Admin UI pages (430+ test cases)

---

## Executive Summary

This document defines the complete approach to automate UI testing for the FlexCMS Admin interface. The plan covers technology stack, project structure, phased implementation, CI/CD integration, and a timeline. The goal is **100% automation of the 105 UI test cases** (UI-001 → UI-105) documented in `docs/QA_TEST_PLAN.md`, plus cross-cutting accessibility, visual regression, and browser compatibility tests.

---

## 1. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Test Runner** | [Playwright](https://playwright.dev/) v1.45+ | Best-in-class for modern Next.js apps: auto-waits, network interception, multi-browser, iframe support, built-in drag-and-drop API, visual regression via `toHaveScreenshot()` |
| **Language** | TypeScript 5.x | Matches the frontend codebase; type-safe selectors and fixtures |
| **Assertion Library** | `@playwright/test` (built-in `expect`) | Includes web-first assertions (`toBeVisible`, `toHaveText`, `toHaveURL`) with auto-retry |
| **Accessibility Testing** | [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) | WCAG 2.1 AA compliance checks (maps to COMPAT/A11Y test cases) |
| **API Mocking** | Playwright Route Interception (`page.route()`) | Zero external dependencies; intercepts `fetch` at browser level; deterministic fixtures |
| **Visual Regression** | Playwright `toHaveScreenshot()` | Built-in pixel comparison; no extra tooling; CI-compatible |
| **Reporting** | Playwright HTML Reporter + GitHub Actions Artifacts | Interactive test report with traces, screenshots, and video on failure |
| **CI/CD** | GitHub Actions | Matrix testing (Chromium + Firefox + WebKit); parallel sharding |
| **Package Manager** | pnpm (existing monorepo) | Integrated into `frontend/` Turborepo workspace |

### Why Playwright Over Cypress

| Criteria | Playwright | Cypress |
|----------|-----------|---------|
| Multi-browser (Chrome, FF, Safari) | ✅ Native | ❌ Limited WebKit |
| Network interception | ✅ Per-route, full control | ✅ But different API |
| Iframe support | ✅ Native `frame()` API | ❌ Very limited |
| Drag-and-drop (@dnd-kit) | ✅ `dragTo()` + low-level mouse API | ⚠️ Requires plugins |
| Parallel execution | ✅ Built-in worker sharding | ❌ Requires Cypress Cloud |
| TypeScript support | ✅ First-class | ✅ Good |
| Visual regression | ✅ Built-in `toHaveScreenshot()` | ❌ Requires plugins |
| Next.js SSR testing | ✅ Full support | ⚠️ Limited |

**Verdict:** Playwright is the clear winner for this project due to iframe-based preview testing, @dnd-kit drag-and-drop, and native multi-browser support.

---

## 2. Project Structure

```
frontend/
├── apps/
│   ├── admin/                          # Existing admin app
│   │   └── src/
│   │       ├── app/(admin)/            # All admin pages
│   │       └── components/             # AppShell, SidebarNav, etc.
│   └── admin-e2e/                      # ← NEW: E2E test package
│       ├── package.json
│       ├── tsconfig.json
│       ├── playwright.config.ts        # Main config (baseURL, projects, reporters)
│       ├── global-setup.ts             # Optional: seed data for live API mode
│       ├── src/
│       │   ├── fixtures/
│       │   │   ├── base.fixture.ts     # Extended test with API mock helpers
│       │   │   ├── api-mocks.ts        # Route interception for all APIs
│       │   │   ├── data/               # Deterministic JSON response fixtures
│       │   │   │   ├── content-children.json
│       │   │   │   ├── content-node.json
│       │   │   │   ├── sites-list.json
│       │   │   │   ├── assets-list.json
│       │   │   │   ├── pim-products.json
│       │   │   │   ├── pim-catalogs.json
│       │   │   │   ├── pim-schemas.json
│       │   │   │   ├── workflow-list.json
│       │   │   │   ├── component-registry.json
│       │   │   │   └── dashboard-stats.json
│       │   │   └── selectors.ts        # Centralized CSS/data-testid selectors
│       │   │
│       │   ├── pages/                  # Page Object Models (POM)
│       │   │   ├── DashboardPage.ts
│       │   │   ├── ContentTreePage.ts
│       │   │   ├── PageEditorPage.ts
│       │   │   ├── DamBrowserPage.ts
│       │   │   ├── DamDetailPage.ts
│       │   │   ├── PimCatalogPage.ts
│       │   │   ├── PimEditorPage.ts
│       │   │   ├── PimSchemaPage.ts
│       │   │   ├── PimImportPage.ts
│       │   │   ├── SitesPage.ts
│       │   │   ├── WorkflowsPage.ts
│       │   │   ├── PreviewPage.ts
│       │   │   ├── ExperienceFragmentsPage.ts
│       │   │   ├── ComponentsPage.ts
│       │   │   └── TranslationsPage.ts
│       │   │
│       │   └── helpers/
│       │       ├── api-assertions.ts   # Assert specific API calls were made
│       │       ├── dnd-helpers.ts      # Drag-and-drop simulation for @dnd-kit
│       │       └── wait-helpers.ts     # Custom wait conditions
│       │
│       ├── tests/
│       │   ├── phase1-critical/        # Phase 1: Critical priority
│       │   │   ├── dashboard.spec.ts           # UI-001 → UI-006
│       │   │   ├── content-tree.spec.ts        # UI-007 → UI-022
│       │   │   ├── page-editor.spec.ts         # UI-021 → UI-037
│       │   │   ├── dam-browser.spec.ts         # UI-038 → UI-051
│       │   │   └── workflows.spec.ts           # UI-080 → UI-086
│       │   │
│       │   ├── phase2-high/            # Phase 2: High priority
│       │   │   ├── sites.spec.ts               # UI-087 → UI-095
│       │   │   ├── pim-catalog.spec.ts         # UI-052 → UI-055
│       │   │   ├── pim-editor.spec.ts          # UI-056 → UI-061
│       │   │   ├── pim-import.spec.ts          # UI-062 → UI-068
│       │   │   └── pim-schema.spec.ts          # UI-069 → UI-079
│       │   │
│       │   ├── phase3-medium/          # Phase 3: Medium + Cross-cutting
│       │   │   ├── preview.spec.ts             # UI-096 → UI-105
│       │   │   ├── experience-fragments.spec.ts
│       │   │   ├── translations.spec.ts
│       │   │   ├── components-registry.spec.ts
│       │   │   └── error-states.spec.ts        # UIERR-001 → UIERR-005
│       │   │
│       │   ├── accessibility/          # Phase 3: WCAG + Compatibility
│       │   │   ├── axe-audit.spec.ts           # A11Y-001 → A11Y-008
│       │   │   └── browser-compat.spec.ts      # COMPAT-001 → COMPAT-006
│       │   │
│       │   └── visual-regression/      # Phase 4: Visual regression
│       │       ├── dark-theme.spec.ts
│       │       └── responsive.spec.ts
│       │
│       └── screenshots/                # Baseline images for visual regression
│           └── chromium/
│               └── dark-theme/
```

---

## 3. Implementation Phases

### Phase 0: Foundation & Instrumentation (Week 1)

**Goal:** Set up the test project and add `data-testid` attributes to the admin UI.

| Task | Details | Effort |
|------|---------|--------|
| **0.1** Create `admin-e2e` package | `package.json`, `tsconfig.json`, `playwright.config.ts`, register in `pnpm-workspace.yaml` and `turbo.json` | 2h |
| **0.2** Install dependencies | `@playwright/test`, `@axe-core/playwright`, `playwright` browsers | 0.5h |
| **0.3** Playwright config | `baseURL: http://localhost:3000`, 3 projects (Chromium, Firefox, WebKit), HTML reporter, trace on failure, video on first retry | 1h |
| **0.4** Add `data-testid` to `@flexcms/ui` components | `Button`, `Input`, `DataTable`, `Dialog`, `Card`, `Badge`, `Skeleton`, `Tabs` — forward `data-testid` prop | 4h |
| **0.5** Add `data-testid` to admin pages | Sidebar nav links, breadcrumb items, content table rows, action menu buttons, status badges, search inputs, upload dialogs | 6h |
| **0.6** Create fixture infrastructure | `base.fixture.ts` with API mock helpers, `selectors.ts`, JSON fixture files extracted from live API responses | 4h |
| **0.7** Create Page Object Models (POMs) | Base POM class + 15 page-specific POMs with navigation helpers and element locators | 8h |
| **0.8** Global setup script | `global-setup.ts` for live-API mode (calls seed script, waits for API health) | 2h |
| **0.9** CI workflow skeleton | `.github/workflows/e2e.yml` — build admin, run Playwright with mocks | 2h |

**Phase 0 Total: ~30 hours (1 engineer, 1 week)**

---

### Phase 1: Critical Priority Tests (Weeks 2–3)

**Goal:** Automate all Critical priority UI test cases — the "smoke test" suite.

#### 1.1 Dashboard (`dashboard.spec.ts`) — UI-001 → UI-006

```typescript
// Example test structure
test.describe('Dashboard', () => {
  test('UI-001: Dashboard loads without errors', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page).toHaveTitle(/FlexCMS Admin/);
  });

  test('UI-002: Real data displayed (not hardcoded)', async ({ page }) => {
    // Assert API calls were made
    const apiCalled = page.waitForResponse('**/api/author/content/list*');
    await page.goto('/dashboard');
    const response = await apiCalled;
    expect(response.status()).toBe(200);
  });

  test('UI-004: Loading skeletons shown during fetch', async ({ page }) => {
    // Delay API response to observe skeletons
    await page.route('**/api/author/content/**', async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ json: [] });
    });
    await page.goto('/dashboard');
    await expect(page.getByTestId('loading-skeleton')).toBeVisible();
  });

  test('UI-006: Sidebar navigation links present', async ({ page }) => {
    await page.goto('/dashboard');
    for (const label of ['Content', 'DAM', 'Sites', 'Workflows', 'PIM']) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }
  });
});
```

#### 1.2 Content Tree (`content-tree.spec.ts`) — UI-007 → UI-022

| Test ID | Automation Approach |
|---------|-------------------|
| UI-007 | Assert `page.waitForResponse('**/children?path=content')` returns data; verify table rows match |
| UI-008 | Click a folder row → assert new API call with child path → verify table updates |
| UI-009 | Navigate 3 levels → assert breadcrumb has 3+ segments |
| UI-010 | Click breadcrumb segment → assert navigation back; verify API call path |
| UI-011 | Click up-button → verify breadcrumb pops last segment |
| UI-012 | Check status badge colors via `getComputedStyle` on badge elements |
| UI-013 | Type in search → assert filtered rows only contain matching text |
| UI-014 | Navigate to empty folder → assert "empty state" element visible |
| UI-015 | Delay API → assert skeleton rows visible before data |
| UI-016 | Click action menu ⋮ → assert dropdown with Edit, Preview, Publish, etc. |
| UI-019 | Network tab assertion: no localhost fetch, only relative `/api/` calls |
| UI-022 | Direct URL navigation with `?path=content.tut-gb.en` → verify correct children |

#### 1.3 Page Editor (`page-editor.spec.ts`) — UI-021 → UI-037

| Test ID | Automation Approach |
|---------|-------------------|
| UI-021 | Navigate to `/editor?path=content.tut-gb.en.home`; verify component tree loaded |
| UI-022 | Assert component palette sidebar has items from `/api/content/v1/component-registry` |
| UI-023 | Click component → right panel shows property form fields matching `dataSchema` |
| UI-024–UI-028 | For each field type (string→input, enum→select, boolean→toggle, number→number, text→textarea), verify correct HTML element rendered |
| UI-030 | Fill form, click Save → intercept `PUT /api/author/content/node/properties` and assert body |
| UI-032–UI-036 | Drag-and-drop: use `page.mouse.move/down/up` sequences to simulate @dnd-kit pointer sensor |
| UI-037 | Click viewport toggle buttons → assert canvas width changes |

#### 1.4 DAM Browser (`dam-browser.spec.ts`) — UI-038 → UI-051

| Test ID | Automation Approach |
|---------|-------------------|
| UI-038 | Assert API call to `/api/author/assets`; verify grid renders |
| UI-042/043 | Click Upload → verify drag-drop zone; mock file input; intercept `POST /api/author/assets` |
| UI-046 | Click multiple checkboxes → verify bulk action toolbar appears |
| UI-051 | Network assertion: all data from API, no mock constants |

#### 1.5 Workflows (`workflows.spec.ts`) — UI-080 → UI-086

| Test ID | Automation Approach |
|---------|-------------------|
| UI-080 | Navigate to `/workflows`; assert API fetch; verify list renders |
| UI-082 | Click Approve → intercept `POST /api/author/workflow/advance` with `action: "approve"` |
| UI-083 | Click Reject → intercept with `action: "reject"` |
| UI-084 | Type comment before action → assert comment in API request body |

**Phase 1 Total: ~60 hours (1 engineer, 2 weeks)**

---

### Phase 2: High Priority Tests (Weeks 4–5)

#### 2.1 Sites Management (`sites.spec.ts`) — UI-087 → UI-095
#### 2.2 PIM Catalog (`pim-catalog.spec.ts`) — UI-052 → UI-055
#### 2.3 PIM Product Editor (`pim-editor.spec.ts`) — UI-056 → UI-061
#### 2.4 PIM Import Wizard (`pim-import.spec.ts`) — UI-062 → UI-068
#### 2.5 PIM Schema Editor (`pim-schema.spec.ts`) — UI-069 → UI-079

**Key challenges in Phase 2:**
- PIM Schema Editor has complex drag-and-drop (field reorder, group reorder)
- Import Wizard is multi-step with file upload and server-side schema inference
- Sites page has grid/list view toggle with session persistence

**Phase 2 Total: ~50 hours (1 engineer, 2 weeks)**

---

### Phase 3: Medium Priority + Cross-Cutting (Weeks 6–7)

#### 3.1 Content Preview (`preview.spec.ts`) — UI-096 → UI-105
- **Iframe testing:** Use `page.frameLocator('iframe')` to interact with the preview iframe
- **Viewport toggle:** Assert iframe width changes on button click
- **Draft/Published toggle:** Assert API URL changes between author and publish endpoints

#### 3.2 Experience Fragments, Translations, Components Registry
- Standard page-load and data-from-API assertions

#### 3.3 Error States (`error-states.spec.ts`) — UIERR-001 → UIERR-005
- Mock API failures (500, timeout, unreachable)
- Assert user-friendly error messages, retry buttons
- Simulate network timeout via delayed route fulfillment

#### 3.4 Accessibility (`axe-audit.spec.ts`) — A11Y-001 → A11Y-008

```typescript
import AxeBuilder from '@axe-core/playwright';

test('Dashboard meets WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

Run for each page. Also test keyboard navigation (Tab order), focus indicators, and screen reader labels.

#### 3.5 Browser Compatibility (`browser-compat.spec.ts`)
- Leverage Playwright's multi-browser projects (Chromium, Firefox, WebKit)
- Run the smoke suite across all 3 browsers
- Add viewport tests for tablet (768px) and mobile (375px)

**Phase 3 Total: ~40 hours (1 engineer, 2 weeks)**

---

### Phase 4: Visual Regression + Hardening (Week 8)

#### 4.1 Visual Regression (`dark-theme.spec.ts`, `responsive.spec.ts`)

```typescript
test('Content tree page - dark theme', async ({ page }) => {
  await page.goto('/content');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('content-tree-dark.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

- Capture baselines for Chromium + dark theme (the primary design)
- Key pages: Dashboard, Content Tree, Page Editor, DAM Browser, PIM Catalog
- Store in `admin-e2e/screenshots/` (add to `.gitattributes` as binary)

#### 4.2 Test Hardening
- Add retry logic for flaky DnD tests (`test.describe.configure({ retries: 2 })`)
- Add `test.slow()` for drag-and-drop and multi-step wizard tests
- Create test tagging: `@smoke`, `@regression`, `@visual`, `@a11y`, `@dnd`

**Phase 4 Total: ~20 hours (1 engineer, 1 week)**

---

## 4. Playwright Configuration

```typescript
// frontend/apps/admin-e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  use: {
    baseURL: process.env.ADMIN_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'cd ../admin && pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

---

## 5. API Mocking Strategy

### Dual Mode: Mock (default) vs Live API

```
┌─────────────────────────────────────────────┐
│  Test Execution Mode                         │
│                                              │
│  ┌──────────────┐   ┌───────────────────┐   │
│  │  MOCK MODE   │   │   LIVE API MODE   │   │
│  │  (default)   │   │ (USE_LIVE_API=1)  │   │
│  │              │   │                   │   │
│  │ Playwright   │   │ Docker Compose    │   │
│  │ route()      │   │ Full stack        │   │
│  │ intercepts   │   │ Real DB + APIs    │   │
│  │ all /api/*   │   │                   │   │
│  │ calls        │   │ seed_test_data.py │   │
│  │              │   │ runs in setup     │   │
│  │ Deterministic│   │                   │   │
│  │ JSON fixtures│   │ Real responses    │   │
│  └──────────────┘   └───────────────────┘   │
│                                              │
│  Speed: ~2 min      Speed: ~8 min            │
│  CI: Every PR       CI: Nightly / Release    │
└─────────────────────────────────────────────┘
```

### Mock Fixture Example

```typescript
// src/fixtures/base.fixture.ts
import { test as base, Page } from '@playwright/test';
import contentChildren from './data/content-children.json';
import sitesList from './data/sites-list.json';

type Fixtures = {
  mockApis: Page;
};

export const test = base.extend<Fixtures>({
  mockApis: async ({ page }, use) => {
    if (!process.env.USE_LIVE_API) {
      // Content API
      await page.route('**/api/author/content/children*', route =>
        route.fulfill({ json: contentChildren })
      );
      // Sites API
      await page.route('**/api/admin/sites', route =>
        route.fulfill({ json: sitesList })
      );
      // Component Registry
      await page.route('**/api/content/v1/component-registry', route =>
        route.fulfill({ json: componentRegistry })
      );
      // Add more routes...
    }
    await use(page);
  },
});
```

### What to Mock vs What to Test Live

| API Endpoint | Mock Mode | Live Mode | Rationale |
|-------------|-----------|-----------|-----------|
| `GET /api/author/content/children` | ✅ Mock | ✅ Live | Core navigation — must work both ways |
| `POST /api/author/content/node` | ✅ Mock (201) | ✅ Live | Write operations: verify request shape in mock, verify persistence in live |
| `PUT /api/author/content/node/properties` | ✅ Mock (200) | ✅ Live | Same |
| `POST /api/author/assets` (upload) | ✅ Mock (201) | ✅ Live | File upload: verify FormData in mock, verify MinIO storage in live |
| `GET /api/pim/v1/products` | ✅ Mock | ✅ Live | PIM data |
| `POST /api/author/workflow/advance` | ✅ Mock | ✅ Live | Workflow actions |

---

## 6. Page Object Model (POM) Design

```typescript
// src/pages/ContentTreePage.ts
import { Page, Locator, expect } from '@playwright/test';

export class ContentTreePage {
  readonly page: Page;
  readonly breadcrumb: Locator;
  readonly searchInput: Locator;
  readonly contentTable: Locator;
  readonly loadingSkeletons: Locator;
  readonly emptyState: Locator;
  readonly upButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.breadcrumb = page.getByTestId('breadcrumb');
    this.searchInput = page.getByTestId('content-search');
    this.contentTable = page.getByTestId('content-table');
    this.loadingSkeletons = page.getByTestId('skeleton-row');
    this.emptyState = page.getByTestId('empty-state');
    this.upButton = page.getByTestId('navigate-up');
  }

  async goto(path?: string) {
    const url = path ? `/content?path=${path}` : '/content';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async getRowCount(): Promise<number> {
    return this.contentTable.locator('tr[data-testid="content-row"]').count();
  }

  async clickRow(name: string) {
    await this.contentTable.getByText(name).click();
  }

  async getBreadcrumbSegments(): Promise<string[]> {
    return this.breadcrumb.locator('[data-testid="breadcrumb-item"]')
      .allTextContents();
  }

  async clickBreadcrumb(name: string) {
    await this.breadcrumb.getByText(name).click();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async openActionMenu(rowName: string) {
    const row = this.contentTable.getByText(rowName).locator('..');
    await row.getByTestId('action-menu-trigger').click();
  }

  async assertApiCallMade(pathParam: string) {
    // Verify the correct API was called
  }
}
```

---

## 7. Drag-and-Drop Testing Strategy

The Page Editor and PIM Schema Editor use `@dnd-kit/core` + `@dnd-kit/sortable`. Standard Playwright `dragTo()` may not reliably trigger `@dnd-kit`'s `PointerSensor`.

### Recommended Approach: Low-Level Mouse Simulation

```typescript
// src/helpers/dnd-helpers.ts
import { Page, Locator } from '@playwright/test';

export async function dragAndDrop(
  page: Page,
  source: Locator,
  target: Locator,
  options: { steps?: number } = {}
) {
  const steps = options.steps ?? 10;

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('Elements not visible');

  const sourceCenter = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };
  const targetCenter = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  };

  // Simulate real pointer events for @dnd-kit
  await page.mouse.move(sourceCenter.x, sourceCenter.y);
  await page.mouse.down();

  // Move gradually (required for @dnd-kit's activation distance)
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      sourceCenter.x + (targetCenter.x - sourceCenter.x) * (i / steps),
      sourceCenter.y + (targetCenter.y - sourceCenter.y) * (i / steps),
    );
    await page.waitForTimeout(50); // Small delay for @dnd-kit to register
  }

  await page.mouse.up();
}
```

### DnD Tests: Isolated & Tagged

```typescript
test.describe('Page Editor — Drag and Drop', () => {
  test.describe.configure({ retries: 2 }); // DnD is inherently flaky

  test('UI-032: Reorder components via drag', async ({ page }) => {
    test.slow(); // Allow extra time
    // ... test implementation
  });
});
```

---

## 8. CI/CD Integration

### 8.1 Mock Mode — Every PR (`.github/workflows/e2e.yml`)

```yaml
name: E2E Tests (Mocked APIs)

on:
  pull_request:
    paths: ['frontend/**']
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm, cache-dependency-path: frontend/pnpm-lock.yaml }

      - name: Install dependencies
        run: cd frontend && pnpm install

      - name: Build admin
        run: cd frontend && pnpm --filter @flexcms/admin build

      - name: Install Playwright browsers
        run: cd frontend/apps/admin-e2e && npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run E2E tests
        run: cd frontend/apps/admin-e2e && npx playwright test --project=${{ matrix.browser }}
        env:
          ADMIN_URL: http://localhost:3000

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: frontend/apps/admin-e2e/playwright-report/
```

### 8.2 Live API Mode — Nightly (`.github/workflows/e2e-integration.yml`)

```yaml
name: E2E Integration Tests (Live APIs)

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:

jobs:
  e2e-live:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: flexcms
          POSTGRES_USER: flexcms
          POSTGRES_PASSWORD: flexcms
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      # ... setup pnpm, node, build backend, start services
      - name: Seed test data
        run: python scripts/seed_test_data.py
      - name: Run E2E tests (live API)
        run: cd frontend/apps/admin-e2e && npx playwright test --project=chromium
        env:
          USE_LIVE_API: 'true'
          ADMIN_URL: http://localhost:3000
```

---

## 9. Test Tagging & Execution Suites

| Tag | When to Run | Scope |
|-----|------------|-------|
| `@smoke` | Every PR, every build | UI-001, UI-007, UI-021, UI-038, UI-052, UI-080, UI-087 |
| `@regression` | Every sprint boundary | All Critical + High priority tests |
| `@full` | Before every release | All tests including Medium/Low |
| `@visual` | Weekly / on-demand | Visual regression screenshots |
| `@a11y` | Every sprint | Accessibility audit per page |
| `@dnd` | Nightly (flaky isolation) | Drag-and-drop tests only |

### Running by Tag

```bash
# Smoke suite (~2 min)
npx playwright test --grep @smoke

# Regression suite (~15 min)
npx playwright test --grep "@smoke|@regression"

# Full suite (~30 min)
npx playwright test

# Visual regression only
npx playwright test --grep @visual

# Accessibility only
npx playwright test --grep @a11y
```

---

## 10. Test-to-QA-Plan Mapping

| QA Test Plan Module | Spec File | Test IDs | Phase |
|--------------------|-----------|----------|-------|
| Module 15: Dashboard | `dashboard.spec.ts` | UI-001 → UI-006 | 1 |
| Module 16: Content Tree | `content-tree.spec.ts` | UI-007 → UI-022 | 1 |
| Module 17: Page Editor | `page-editor.spec.ts` | UI-021 → UI-037 | 1 |
| Module 18: DAM Browser | `dam-browser.spec.ts` | UI-038 → UI-051 | 1 |
| Module 19: PIM Pages | `pim-catalog.spec.ts` | UI-052 → UI-055 | 2 |
| Module 19: PIM Editor | `pim-editor.spec.ts` | UI-056 → UI-061 | 2 |
| Module 19: PIM Import | `pim-import.spec.ts` | UI-062 → UI-068 | 2 |
| Module 19: PIM Schema | `pim-schema.spec.ts` | UI-069 → UI-079 | 2 |
| Module 20: Workflows | `workflows.spec.ts` | UI-080 → UI-086 | 1 |
| Module 21: Sites | `sites.spec.ts` | UI-087 → UI-095 | 2 |
| Module 22: Preview | `preview.spec.ts` | UI-096 → UI-105 | 3 |
| Module 42: Accessibility | `axe-audit.spec.ts` | A11Y-001 → A11Y-008 | 3 |
| Module 42: Compatibility | `browser-compat.spec.ts` | COMPAT-001 → COMPAT-006 | 3 |
| Admin Error States | `error-states.spec.ts` | UIERR-001 → UIERR-005 | 3 |

---

## 11. `data-testid` Instrumentation Plan

Before writing tests, add stable `data-testid` attributes:

### Admin Pages (add to each page component)

| Page | Element | `data-testid` |
|------|---------|--------------|
| All pages | Sidebar nav links | `sidebar-nav-{name}` (e.g., `sidebar-nav-content`) |
| All pages | Loading skeleton | `loading-skeleton` |
| All pages | Empty state | `empty-state` |
| Content | Search input | `content-search` |
| Content | Content table | `content-table` |
| Content | Table row | `content-row` |
| Content | Breadcrumb bar | `breadcrumb` |
| Content | Breadcrumb item | `breadcrumb-item` |
| Content | Navigate up button | `navigate-up` |
| Content | Action menu trigger | `action-menu-trigger` |
| Content | Action menu item | `action-{name}` (e.g., `action-edit`) |
| Content | Status badge | `status-badge-{status}` |
| Editor | Component palette | `component-palette` |
| Editor | Property panel | `property-panel` |
| Editor | Canvas | `editor-canvas` |
| Editor | Save button | `editor-save` |
| Editor | Publish button | `editor-publish` |
| Editor | Viewport toggle | `viewport-{size}` |
| DAM | Asset grid | `asset-grid` |
| DAM | Upload button | `dam-upload-btn` |
| DAM | Upload zone | `dam-upload-zone` |
| DAM | View toggle | `view-toggle-{mode}` |
| PIM | Product grid | `product-grid` |
| PIM | Import wizard step | `import-step-{n}` |
| Sites | Site grid | `site-grid` |
| Sites | Create site button | `create-site-btn` |
| Workflows | Workflow list | `workflow-list` |
| Workflows | Approve button | `workflow-approve` |
| Workflows | Reject button | `workflow-reject` |
| Preview | Preview iframe | `preview-iframe` |
| Preview | Viewport toggle | `preview-viewport-{size}` |

### @flexcms/ui Components (forward `data-testid` prop)

| Component | Default `data-testid` |
|-----------|---------------------|
| `<Button>` | Forwarded from caller |
| `<Input>` | Forwarded from caller |
| `<DataTable>` | `data-table` |
| `<Dialog>` | `dialog-{title}` |
| `<Card>` | Forwarded from caller |
| `<Badge>` | Forwarded from caller |
| `<Skeleton>` | `skeleton` |
| `<Tabs>` | `tabs` |
| `<Select>` | Forwarded from caller |

---

## 12. Timeline & Resource Estimate

```
Week 1   │ Phase 0: Foundation + data-testid instrumentation
Week 2-3 │ Phase 1: Critical tests (Dashboard, Content, Editor, DAM, Workflows)
Week 4-5 │ Phase 2: High tests (Sites, PIM Catalog/Editor/Import/Schema)
Week 6-7 │ Phase 3: Medium tests (Preview, XF, Translations, a11y, errors)
Week 8   │ Phase 4: Visual regression + test hardening + CI optimization
```

| Phase | Tests | Effort | Cumulative Coverage |
|-------|-------|--------|-------------------|
| Phase 0 | 0 (infrastructure) | 30h | 0% |
| Phase 1 | ~50 tests (5 suites) | 60h | 48% of UI test cases |
| Phase 2 | ~30 tests (5 suites) | 50h | 76% of UI test cases |
| Phase 3 | ~25 tests (5 suites) | 40h | 100% of UI test cases |
| Phase 4 | ~15 tests (visual + hardening) | 20h | 100% + visual regression |
| **Total** | **~120 tests** | **~200 hours** | **105/105 UI test cases** |

**Team:** 1 senior test automation engineer (full-time, 8 weeks)
**Or:** 2 engineers (4 weeks with parallel Phase 1+2)

---

## 13. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| UI test case coverage | 100% (105/105) | Mapped test IDs in spec files |
| Test pass rate (mock mode) | ≥ 98% | CI dashboard |
| Test pass rate (live mode) | ≥ 95% | Nightly CI dashboard |
| Execution time (mock, Chromium) | < 5 minutes | CI job duration |
| Execution time (full, 3 browsers) | < 15 minutes | CI job duration |
| Flaky test rate | < 2% | Retry analysis over 30 days |
| WCAG violations per page | 0 Critical/Serious | axe-core report |
| Visual regression false positives | < 5% | Screenshot diff review |

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| @dnd-kit drag-and-drop tests flaky | High | Medium | Isolate DnD tests; allow retries; use synthetic events as fallback |
| Admin UI refactors break selectors | Medium | High | Use `data-testid` (not CSS classes); POMs centralize selectors |
| NEXT_PUBLIC env vars not available in test | Medium | Low | Mock API at route level, not env var level |
| Visual regression baselines drift | Medium | Low | Review on each PR; allow `maxDiffPixelRatio: 0.01` |
| CI execution time creeps up | Low | Medium | Parallel sharding; tag-based selective execution |
| Live API tests depend on seed data | High | Medium | `global-setup.ts` runs seed script; assert preconditions in fixtures |

---

## 15. Next Steps

1. **Immediate:** Create `frontend/apps/admin-e2e/` package structure (Phase 0.1)
2. **This week:** Add `data-testid` attributes to admin pages and @flexcms/ui components (Phase 0.4–0.5)
3. **Next sprint:** Implement Phase 1 critical test suites
4. **Ongoing:** Each sprint adds one phase; visual regression stabilizes by Week 8

---

*Document generated: 2026-03-28 | FlexCMS Test Automation Engineering*

