# REB-25 — Harden cross-cutting admin E2E quality gates for navigation, errors, accessibility, and cleanup

## Summary

- Priority: P2
- Owner role/lane: `devops`
- Parent planning task: `REB-17`

## Goal

Harden the expanded admin Selenium automation program with cross-cutting checks for route health, browser errors, network failures, accessibility smoke, deterministic data cleanup, environment guards, and publish-environment assertions before CI/local gates are expanded.

## Read first

- `df/artifacts/REB-17/task.md`
- `df/artifacts/REB-18/task.md`
- `df/artifacts/REB-19/task.md`
- `df/artifacts/REB-20/task.md`
- `df/artifacts/REB-21/task.md`
- `df/artifacts/REB-22/task.md`
- `df/artifacts/REB-23/task.md`
- `df/artifacts/REB-24/task.md`
- `df/artifacts/REB-26/task.md`
- `df/artifacts/REB-14/task.md`
- `frontend/apps/selenium-e2e/README.md`
- `frontend/apps/selenium-e2e/src/driver/env.ts`
- `frontend/apps/selenium-e2e/src/driver/browser.ts`
- `frontend/apps/selenium-e2e/src/reports/hooks.ts`

## Dependencies

- REB-18
- REB-19
- REB-20
- REB-21
- REB-22
- REB-23
- REB-24
- REB-26

## Functional scope

- Shared Selenium environment configuration for admin, author API, publish API/site, and public site URLs.
- Test-owned data namespace generation and cleanup helpers.
- Browser console and network error capture.
- Screenshot/JUnit artifact consistency.
- Accessibility smoke helpers for headings, labels, focus order, and keyboard interaction.
- Publish-environment verification helper used by all publish tests.
- Retry policy and failure classification without hiding product defects.

## Required E2E hardening scenarios

1. **Environment preflight**: verify configured admin, author API, publish API/site, and public site endpoints are reachable before mutation suites run; fail with a clear environment diagnostic when unavailable.
2. **Publish verification helper**: add a shared helper that verifies a path/marker on publish environment and cannot accidentally fall back to author URL.
3. **Test data namespace**: add helper for unique path/SKU/asset/XF/live-copy names and a cleanup registry for created entities.
4. **Cleanup audit**: after each mutation suite, verify test-owned content/assets/products/fragments are deleted or intentionally retained with artifact note.
5. **Browser console/network errors**: capture severe console errors and failed resource requests for admin/editor/public pages; fail only on relevant app/runtime failures and document ignore list if needed.
6. **Broken media checks**: reusable image/video/font health checks for public and admin-preview pages.
7. **Accessibility smoke**: reusable checks for page heading, landmark/main area, labelled interactive controls, modal focus, keyboard tab reachability, and visible focus indicator where feasible.
8. **Selector stability**: centralize selectors/page objects and document missing `data-testid` needs for frontend follow-up rather than using brittle text-only selectors everywhere.
9. **Artifact retention**: ensure JUnit XML and failure screenshots are produced consistently for all admin suites and are compatible with REB-14 CI retention.
10. **Failure taxonomy**: classify failures as product defect, environment blocker, unsupported UI, or test bug in summary evidence.

## Acceptance criteria

- AC1: Shared helpers exist for environment preflight, publish-environment verification, unique test data, cleanup, screenshots, console/network checks, and basic accessibility smoke.
- AC2: Publish tests from REB-18/REB-19/REB-20/REB-21/REB-22/REB-23/REB-26 use the shared publish verification helper.
- AC3: Mutation suites leave no untracked test-owned data unless explicitly documented.
- AC4: Missing selectors and unsupported UI actions are captured as actionable defects or blockers with file references.
- AC5: Evidence is recorded in `df/artifacts/REB-25/devops/summary.md` and is ready for REB-14 CI gate integration.

