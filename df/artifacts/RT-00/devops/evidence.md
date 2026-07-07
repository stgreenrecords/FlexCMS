# RT-00 Evidence (in progress)

Environment:
- Date/time (local): 2026-07-06
- Role: devops
- Node/PNPM versions: [to be filled when running]
- Docker: [to be filled when running]
- OS: [to be filled when running]

Planned commands:
1) Live run expecting failure (backend down)
   - ADMIN_URL=http://localhost:4200 AUTHOR_API_URL=http://localhost:8080 USE_LIVE_API=1 npx playwright test -c frontend/apps/admin-e2e/playwright.live.config.ts
   - Expected: Tests fail early due to network errors; collect Playwright trace and HTML report.

2) Start backend stack
   - docker compose -f <compose-file-provided-by-SA> up -d <services>
   - wait for AUTHOR_API_URL/health to return 200

3) Live run expecting success (backend up + seeded)
   - ADMIN_URL=http://localhost:4200 AUTHOR_API_URL=http://localhost:8080 USE_LIVE_API=1 npx playwright test -c frontend/apps/admin-e2e/playwright.live.config.ts
   - Expected: All live-enabled specs pass; collect traces/screenshots for any retries/failures.

Artifacts to be saved:
- docs/retest-runs/RT-00/run-1-backend-stopped/trace.zip, report/
- docs/retest-runs/RT-00/run-2-backend-running/trace.zip, report/

Current status:
- BLOCKED pending SA details (repo paths, commands, backend stack info).
- No live run executed yet; artifacts not generated.

Links:
- See handoff for exact blockers and required info.
