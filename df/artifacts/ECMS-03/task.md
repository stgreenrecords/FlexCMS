# ECMS-03 — Publish-tier asset delivery and asset replication

## Summary

- Priority: P0
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Published pages must be able to show their images and documents to the public; today they cannot.

## Current state in FlexCMS

Open risk R-REB-21-003: no publish-side asset delivery exists, so a published page referencing a DAM asset renders a dead image. `ReplicationAgent.replicateAsset()` exists but is never called (test doc GAP-084).

## Acceptance criteria

- [ ] AC1: Solution design decides: publish-tier asset controller serving binaries/renditions vs. publishing binaries to static/CDN storage at activation. Records the decision in `df/runtime/decisions.md`.
- [ ] AC2: Publishing a page publishes (or verifies published) every asset it references; unpublishing/deleting an asset retracts it from public delivery.
- [ ] AC3: A published page's asset URLs resolve with 200 on the publish tier and never point at `/api/author/...`.
- [ ] AC4: Correct `Cache-Control` and CDN purge on asset republish.
- [ ] AC5: Selenium: publish a page with an image, load it from the publish URL, assert the image loads (naturalWidth > 0).

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- On-demand image transforms (ECMS-46).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `df/runtime/risks.md` (R-REB-21-003)
- `flexcms/flexcms-replication/`
- `flexcms/flexcms-dam/`
- `df/artifacts/REB-21/devops/blockers.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
