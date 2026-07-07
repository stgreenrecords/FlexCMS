# Handoff: RT-00

- From role: devops
- To role: sa
- Next action:
  1) Provide authoritative details to unblock implementation:
     - Exact repository paths and file list for the 19 specs that currently use inline `page.route('**/api/**')` so gating can be applied (or confirm acceptance of a runtime monkeypatch approach via base fixture).
     - Confirm the path and shape of:
       - frontend/apps/admin-e2e/src/fixtures/base.fixture.ts
       - frontend/apps/admin-e2e/src/fixtures/api-mocks.ts
       - frontend/apps/admin-e2e/playwright.config.ts
     - Provide the correct commands to start the Admin UI for e2e (dev server or built preview) that the Playwright webServer should use.
     - Provide the real Author backend stack-up method for live runs:
       - Docker Compose file path(s) and service names, or
       - K8s namespace and helm release, or
       - Local process start commands
       - Healthcheck URL(s) and expected readiness conditions
     - Provide the base URLs for Admin and Author in live mode (e.g., ADMIN_URL, AUTHOR_API_URL).
     - Provide the source for the broken `tutGbEnChildren` reference in api-mocks.ts (what it should import from, or confirm it should be removed), so we can fix it correctly.
  2) Decide acceptance of one of two approaches for disabling per-spec mocks in live mode:
     - A) Explicit gating edit in each spec (touching all 19 files), or
     - B) A safe runtime override in the shared base fixture that no-ops `page.route` for API patterns when `USE_LIVE_API=1`.
  3) Confirm where to store live traces and logs; default is docs/retest-runs/RT-00/.

Once SA provides the above, devops will:
- Implement the agreed gating approach (A or B).
- Add a 'live' Playwright project/config that starts Admin and ensures Author backend is up (via docker compose or provided command).
- Run the harness twice to capture evidence:
  - Backend stopped: ensure tests fail and save trace.
  - Backend running + seeded: ensure tests pass and save trace.
- Save all evidence under docs/retest-runs/RT-00/ and hand off to QA.

Blockers recorded on 2026-07-06 21:45 local:
- Unknown file contents/structure prevents safe edits to base.fixture.ts and 19 spec files.
- Unknown admin start command for Playwright webServer.
- Unknown real Author backend stack-up method and health endpoints for live mode.
- Cannot produce required live evidence without environment access.
