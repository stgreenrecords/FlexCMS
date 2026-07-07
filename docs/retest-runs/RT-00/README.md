RT-00 Live E2E Retest Runs

Purpose:
- Demonstrate that the 'live' Playwright project truly disables all API mocks when USE_LIVE_API=1 and exercises the real backend.

How to reproduce:

Prerequisites:
- Node and Playwright installed
- Docker available (if using compose for backend)
- Admin UI and Author backend commands/compose file as provided by SA

Commands:

1) Live run with backend stopped (should FAIL)
- Ensure backend is not running (stop containers or processes)
- Run:
  ADMIN_URL=http://localhost:4200 AUTHOR_API_URL=http://localhost:8080 USE_LIVE_API=1 npx playwright test -c frontend/apps/admin-e2e/playwright.live.config.ts
- Save artifacts to:
  docs/retest-runs/RT-00/run-1-backend-stopped/
  - Copy the Playwright HTML report and trace.zip here.

2) Start backend stack (if using Docker Compose)
- docker compose -f <compose-file> up -d <services>
- Wait until AUTHOR_API_URL/health is 200

3) Live run with backend running (should PASS)
- Run:
  ADMIN_URL=http://localhost:4200 AUTHOR_API_URL=http://localhost:8080 USE_LIVE_API=1 npx playwright test -c frontend/apps/admin-e2e/playwright.live.config.ts
- Save artifacts to:
  docs/retest-runs/RT-00/run-2-backend-running/
  - Copy the Playwright HTML report and trace.zip here.

Placeholders (to be filled by the runner):

- Run 1 (backend stopped):
  - Command used:
  - Node/Playwright versions:
  - Result summary:
  - Artifacts:
    - trace: docs/retest-runs/RT-00/run-1-backend-stopped/trace.zip
    - report: docs/retest-runs/RT-00/run-1-backend-stopped/report/

- Run 2 (backend running):
  - Command used:
  - Node/Playwright versions:
  - Result summary:
  - Artifacts:
    - trace: docs/retest-runs/RT-00/run-2-backend-running/trace.zip
    - report: docs/retest-runs/RT-00/run-2-backend-running/report/
