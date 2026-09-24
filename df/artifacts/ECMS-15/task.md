# ECMS-15 — Framework-agnostic visual editing of external frontends

## Summary

- Priority: P3
- Type: Spike
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Offer in-context editing for sites not built on the bundled renderers (SPAs, other frameworks), so authoring is one experience across channels.

## Current state in FlexCMS

The editor only renders the bundled renderers.

## Acceptance criteria

- [ ] AC1: Spike report evaluating an attribute-based instrumentation SDK (editable regions declared in markup) plus an editor shell that loads the external app in an iframe.
- [ ] AC2: Prototype against `site-nuxt` proving edit-in-place round-trips through the author API.
- [ ] AC3: Recommendation with effort estimate and follow-on task split.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `frontend/apps/site-nuxt/`
- `frontend/packages/sdk/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
