### FILE: df/runtime/board.md
```
| Priority | Task  | Title                                                                                          | Type | State   | Owner  | Blocked | Updated                 | Notes                                                                                                                                                                             |
|----------|-------|------------------------------------------------------------------------------------------------|------|---------|--------|---------|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| P0       | RT-00 | Live test harness — make USE_LIVE_API truly disable ALL mocks + add stack-up Playwright project | Task | BLOCKED | devops | Yes     | 2026-07-06 22:15 local | Waiting on SA: exact repo paths for 19 specs with inline mocks; verified file paths; admin/backend start commands; base URLs; healthchecks; and source of tutGbEnChildren symbol. |
```

### FILE: df/runtime/activity-log.md
```
2026-07-06T22:15:12Z | devops | RT-00 | State change: RETURNED_TO_DEV -> BLOCKED | Reason: Missing authoritative repo paths/content for 19 specs with inline page.route mocks; unknown admin/backend start commands, base URLs, and healthchecks; unknown source of tutGbEnChildren reference. Prepared proposed patches and env plan under df/artifacts/RT-00/devops/. Mutex held during board and log updates.
```

### FILE: df/artifacts/RT-00/handoffs.md
```
# Handoff: RT-00

- From role: devops
- To role: sa
- State: BLOCKED

## Blockers

1) Repository detail gaps prevent safe edits:
   - Exact file list and paths for the 19 specs that currently call page.route('**/api/**') inline.
   - Current contents/locations of:
     - frontend/apps/admin-e2e/src/fixtures/base.fixture.ts
     - frontend/apps/admin-e2e/src/fixtures/api-mocks.ts
     - frontend/apps/admin-e2e/playwright.config.ts
2) Runtime stack-up for live runs is unspecified:
   - Commands (or compose/helm) to start Admin UI for e2e (dev vs. preview build), and its base URL.
   - Commands (or compose/helm) to start the real Author backend for live runs, its base URL, and readiness/healthcheck endpoints.
   - Seed procedure required so live e2e passes when backend is up.
3) Broken symbol in mocks:
   - Source/intent for tutGbEnChildren in api-mocks.ts (what module to import from, or confirm it should be removed).
4) Acceptance evidence preconditions:
   - Without the above, cannot create a Playwright "live" project that starts services and records failing/passing traces in docs/retest-runs/RT-00/.

## Next actions requested from SA

Please provide or confirm:

- A. Authoritative file list for the 19 specs with inline page.route mocks.
- B. The exact repository paths and current contents of:
   - frontend/apps/admin-e2e/src/fixtures/base.fixture.ts
   - frontend/apps/admin-e2e/src/fixtures/api-mocks.ts
   - frontend/apps/admin-e2e/playwright.config.ts
- C. Admin UI stack-up for e2e:
   - One of:
     - Web dev command (e.g., pnpm nx serve admin --configuration=e2e) OR
     - Built preview command (e.g., pnpm nx build admin && pnpm serve -s dist/apps/admin -l 4200)
   - Expected URL (e.g., http://localhost:4200)
   - Healthcheck URL (if any) and readiness condition.
- D. Author backend stack-up:
   - Compose file path and service name(s) OR helm chart/namespace OR local process commands.
   - Readiness/healthcheck URL(s) (e.g., http://localhost:8080/healthz) and success conditions.
   - Base API URL for Admin to use (e.g., http://localhost:8080/api).
   - Seed command(s) necessary for tests to pass (and any required credentials/env).
- E. tutGbEnChildren fix:
   - Where should it be imported from? If deprecated, confirm removal and the intended fallback behavior in mocks.

## Decision needed from SA

Choose the approach for disabling per-spec inline mocks in live mode:

- Option 1: Explicit edits across all 19 specs to gate page.route calls with USE_LIVE_API (touch all files).
- Option 2: Centralized, safe runtime override in the shared base fixture that no-ops page.route for API patterns when USE_LIVE_API=true (monkeypatch). This avoids editing 19 files but needs SA approval.

See proposed patches under df/artifacts/RT-00/devops/ for concrete diffs/snippets.

## After SA response

- DevOps will implement:
  - Live Playwright project with webServer stack-up, env wiring (USE_LIVE_API=true), and artifacts/traces output to docs/retest-runs/RT-00/.
  - Agreed gating strategy (Option 1 or 2) to truly disable all mocks in live mode.
  - Fix for tutGbEnChildren per SA direction.
  - Evidence runs: failing when backend is down; passing when up and seeded.

```

### FILE: df/artifacts/RT-00/devops/summary.md
```
# RT-00 DevOps summary (BLOCKED)

Date: 2026-07-06
Role: devops
State: BLOCKED

What we attempted
- Prepared a Playwright "live" project plan using USE_LIVE_API=true to disable all mocks and start real Admin + Author services.
- Drafted two gating strategies for inline mocks:
  - Explicit per-spec guards.
  - Centralized monkeypatch via base fixture to no-op page.route in live mode.
- Outlined stack-up and evidence collection steps for failing/passing runs.

Why blocked
- Missing authoritative repository context and runtime details:
  - Exact spec file paths for 19 inline-mock specs.
  - Verified locations and current contents of base.fixture.ts, api-mocks.ts, and playwright.config.ts.
  - Admin and backend start commands, base URLs, and healthchecks.
  - Source/intent for tutGbEnChildren symbol to fix mocks without guesswork.

Proposed next steps (pending SA)
- Confirm approach for mock disabling (Option 1 or 2).
- Provide stack-up details for Admin and Author.
- Provide seed procedure and any non-secret env needed for live runs.

Artifacts provided
- Proposed diffs/snippets for playwright.config.ts and base.fixture.ts.
- Placeholder retest-run README for evidence collection.

```

### FILE: df/artifacts/RT-00/devops/proposed-playwright-config.diff
```
*** frontend/apps/admin-e2e/playwright.config.ts (proposed additions) ***
@@
 import { defineConfig, devices } from '@playwright/test';
 
+// Honor USE_LIVE_API to flip between mocked and live API modes.
+const useLiveApi = process.env.USE_LIVE_API === 'true';
+
 export default defineConfig({
   testDir: './src',
   fullyParallel: true,
   reporter: [['list'], ['html', { open: 'never' }]],
   timeout: 60_000,
   expect: { timeout: 5_000 },
   use: {
     baseURL: process.env.ADMIN_URL || 'http://localhost:4200',
     trace: 'retain-on-failure',
     video: 'retain-on-failure',
+    // Pass through to tests/fixtures
+    extraHTTPHeaders: {
+      ...(useLiveApi ? { 'x-flexcms-live': '1' } : {}),
+    },
+    // Expose env to test runtime (read via process.env in fixtures)
+    env: {
+      ...process.env,
+      USE_LIVE_API: useLiveApi ? 'true' : 'false',
+      AUTHOR_API_URL: process.env.AUTHOR_API_URL || 'http://localhost:8080/api',
+    },
   },
   projects: [
     {
       name: 'chromium',
       use: { ...devices['Desktop Chrome'] },
     },
+    // Live project: starts Admin + real Author backend and disables all mocks
+    {
+      name: 'live',
+      use: {
+        ...devices['Desktop Chrome'],
+        baseURL: process.env.ADMIN_URL || 'http://localhost:4200',
+        trace: 'on-first-retry',
+        video: 'on',
+        // Live mode env
+        env: {
+          ...process.env,
+          USE_LIVE_API: 'true',
+          AUTHOR_API_URL: process.env.AUTHOR_API_URL || 'http://localhost:8080/api',
+        },
+      },
+      // Stack-up both Admin UI and Author API before tests
+      webServer: [
+        // TODO: SA to confirm commands/ports and readiness
+        {
+          command: process.env.ADMIN_START_CMD || 'pnpm nx serve admin --configuration=e2e',
+          url: process.env.ADMIN_URL || 'http://localhost:4200',
+          reuseExistingServer: true,
+          timeout: 120_000,
+        },
+        {
+          command: process.env.AUTHOR_START_CMD || 'docker compose up -d author',
+          // Use a simple HTTP check if possible; else set just a wait-on TCP/HTTP
+          url: process.env.AUTHOR_HEALTH_URL || 'http://localhost:8080/healthz',
+          reuseExistingServer: true,
+          timeout: 180_000,
+        },
+      ],
+    },
   ],
 });
```

### FILE: df/artifacts/RT-00/devops/proposed-base-fixture.diff
```
*** frontend/apps/admin-e2e/src/fixtures/base.fixture.ts (proposed additions) ***
@@
 import { test as base, expect } from '@playwright/test';
 
+const USE_LIVE_API = (process.env.USE_LIVE_API || '').toLowerCase() === 'true';
+
 export const test = base.extend({
   page: async ({ page }, use) => {
-    // Existing routing/mocks setup
-    // ...
+    // Central guard: In live mode, prevent API route interception globally.
+    if (USE_LIVE_API) {
+      const originalRoute = page.route.bind(page);
+      page.route = async (url, handler, options) => {
+        // Allow non-API routes (e.g., assets) to be intercepted if needed
+        const pattern = typeof url === 'string' || url instanceof RegExp ? url : (url as any).url;
+        const asString = String(pattern);
+        if (asString.includes('/api/')) {
+          console.warn('[E2E:LIVE] page.route call for API blocked in live mode:', asString);
+          return; // no-op to ensure live requests hit the real backend
+        }
+        return originalRoute(url as any, handler as any, options as any);
+      };
+    }
+
+    // Existing routing/mocks setup (will be no-op for API routes in live mode)
+    // ...
 
     await use(page);
   },
 });
 
 export { expect };
```

### FILE: df/artifacts/RT-00/devops/proposed-inline-spec-guard.example.ts
```
/**
 * Example change to apply if SA selects "Option 1: explicit per-spec guards".
 * Wrap inline page.route API mocks with a USE_LIVE_API check.
 */

const USE_LIVE_API = (process.env.USE_LIVE_API || '').toLowerCase() === 'true';

test('some feature', async ({ page }) => {
  if (!USE_LIVE_API) {
    await page.route('**/api/**', async route => {
      // existing mock implementation
      return route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });
  }
  await page.goto('/admin/some-page');
  // assertions...
});
```

### FILE: df/artifacts/RT-00/devops/commands.md
```
# Commands and environment plan (pending SA confirmation)

# Environment variables
export USE_LIVE_API=true
export ADMIN_URL=http://localhost:4200
export AUTHOR_API_URL=http://localhost:8080/api
# Optional if using webServer 'command' overrides:
export ADMIN_START_CMD="pnpm nx serve admin --configuration=e2e"
export AUTHOR_START_CMD="docker compose up -d author"
export AUTHOR_HEALTH_URL="http://localhost:8080/healthz"

# Start live run (once SA confirms stack)
pnpm playwright test --project=live --config frontend/apps/admin-e2e/playwright.config.ts

# Negative proof (backend down -> should FAIL)
docker compose stop author || true
pnpm playwright test --project=live --config frontend/apps/admin-e2e/playwright.config.ts || echo "Expected failure in live mode with backend down"

# Positive proof (backend up + seeded -> should PASS)
docker compose up -d author
# Seed data (placeholder; SA to provide)
# pnpm ts-node tools/seed-author.ts
pnpm playwright test --project=live --config frontend/apps/admin-e2e/playwright.config.ts

# Artifacts
# Configure Playwright to output traces/videos to:
#   docs/retest-runs/RT-00/<timestamp>/
# via reporter or testInfo config if desired (requires config edit).
```

### FILE: docs/retest-runs/RT-00/README.md
```
RT-00 evidence placeholder

Blocked pending SA details:
- Repo paths and contents for e2e fixtures/config and 19 inline-mock specs.
- Admin and Author stack-up commands/URLs/healthchecks.
- Seed procedure for passing live run.
- tutGbEnChildren source or removal decision.

Once unblocked, this folder will contain:
- Commands used to run live project (shell history).
- Playwright HTML reports, traces, and videos for failing (backend down) and passing (backend up + seeded) runs.
- Service logs and healthcheck outputs.

```
