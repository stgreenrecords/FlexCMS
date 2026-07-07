# DevOps Implementation Plan for RT-00

Goal: Make USE_LIVE_API truly disable ALL mocks and add a 'live' Playwright project that runs against the real backend, with reproducible evidence.

Planned changes (pending SA details):

1) Mock gating (two options; need SA decision):
   - Option A (explicit gating in specs):
     - For each spec that uses inline `page.route('**/api/**', ...)`, wrap the route registration in:
       ```
       if (!process.env.USE_LIVE_API) {
         await page.route('**/api/**', handler);
       }
       ```
     - Ensure any per-spec mock data builders also check this flag.
   - Option B (runtime override via base fixture):
     - In `frontend/apps/admin-e2e/src/fixtures/base.fixture.ts`, during fixture setup, when `process.env.USE_LIVE_API === '1'`:
       - Monkeypatch `page.route` so calls matching `/\/api\//` or glob `'**/api/**'` log a warning and no-op (do not intercept).
       - Optionally throw if a spec attempts to route APIs in live mode, to catch accidental mocking.

2) Fix dead reference in api-mocks.ts:
   - In `frontend/apps/admin-e2e/src/fixtures/api-mocks.ts`, correct the undefined `tutGbEnChildren` import:
     - Either import from the right module or remove usage if obsolete.
     - If it is sample data, define it locally with proper type.
   - Exact fix depends on what it should be; SA to confirm.

3) Live Playwright project:
   - Create `frontend/apps/admin-e2e/playwright.live.config.ts` exporting a single 'live' project:
     - `env: { USE_LIVE_API: '1', AUTHOR_API_URL, ADMIN_URL }`
     - `use.baseURL` points to Admin base URL.
     - `webServer` array:
       - Entry to start Admin UI (command provided by SA).
       - Optional entry or globalSetup to bring up Author backend via docker compose (compose file path and service names provided by SA).
     - `globalSetup` script:
       - Waits for backend readiness (AUTHOR_API_URL/health).
       - Seeds data if a seeder endpoint or script is available (optional).
     - `use.trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.

4) Stack-up helper (if Compose is used):
   - Add `frontend/apps/admin-e2e/scripts/ensure-backend.ts` (Node) or `.sh`:
     - Runs `docker compose -f <file> up -d <services>`.
     - Polls health endpoints until ready or timeout.
     - Respect env SKIP_STACK_UP to use an existing stack.

5) Evidence capture:
   - Add npm scripts (or document commands) to run:
     - Live run with backend stopped (expect failure) with traces saved.
     - Live run with backend started (expect pass) with traces saved.
   - Save artifacts under `docs/retest-runs/RT-00/`:
     - `run-1-backend-stopped/` (fail)
     - `run-2-backend-running/` (pass)
     - Include console logs, Playwright HTML reports, traces, and screenshots.

6) CI integration (optional if time permits):
   - Add a GitHub Actions job `admin-e2e-live` gated by label or manual dispatch:
     - Spins up backend services.
     - Runs Playwright with live config.
     - Uploads artifacts.

Commands (to be finalized once SA provides details):
- Local live run (expected fail when backend down):
  - AUTHOR_API_URL=http://localhost:8080 ADMIN_URL=http://localhost:4200 USE_LIVE_API=1 npx playwright test -c frontend/apps/admin-e2e/playwright.live.config.ts
- Bring up backend (example):
  - docker compose -f tools/e2e/author.compose.yml up -d author db
- Live run (expected pass):
  - same as above, with backend running.

Risks:
- Unknown repo structure and commands for Admin UI.
- Unknown backend provisioning and health checks.
- Modifying test fixtures without current file contents risks breaking tests.

Next steps after SA unblocks:
- Implement selected gating option and live project.
- Validate locally.
- Produce evidence for QA.
