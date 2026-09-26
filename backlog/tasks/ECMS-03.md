# ECMS-03 — Publish-tier asset delivery and asset replication

| Field | Value |
|---|---|
| Type | Story |
| Priority | P0 |
| Area | Full-stack |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Published pages must be able to show their images and documents to the public; today they cannot.

## Current state

Open risk R-REB-21-003: no publish-side asset delivery exists, so a published page referencing a DAM asset renders a dead image. `ReplicationAgent.replicateAsset()` exists but is never called (test doc GAP-084).

## Acceptance criteria

- [x] AC1: Technical design decides: publish-tier asset controller serving binaries/renditions vs. publishing binaries to static/CDN storage at activation. Records the decision in `docs/architecture/DECISIONS.md`.
- [ ] AC2: Publishing a page publishes (or verifies published) every asset it references; unpublishing/deleting an asset retracts it from public delivery.
- [ ] AC3: A published page's asset URLs resolve with 200 on the publish tier and never point at `/api/author/...`.
- [ ] AC4: Correct `Cache-Control` and CDN purge on asset republish.
- [ ] AC5: Playwright E2E: publish a page with an image, load it from the publish URL, assert the image loads (naturalWidth > 0).

## Delivery

This task is the parent. Its design is [`backlog/designs/ECMS-03.md`](../designs/ECMS-03.md) (decision DEC-ECMS-002). AC2–AC5 are delivered and tested by the children: [ECMS-03A](ECMS-03A.md) (backend, Done) and [ECMS-03B](ECMS-03B.md) (frontend + Playwright E2E, In Progress). This task counts as Done because refinement is complete; the open ACs are tracked on the children.

## Test cases

Delivered before the Playwright test-case standard; no test-case table was recorded. Regression coverage for this capability is tracked by the Selenium→Playwright port tasks on the board.

## Out of scope

- On-demand image transforms (ECMS-46).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-replication/`
- `flexcms/flexcms-dam/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-03/task.md`). |
