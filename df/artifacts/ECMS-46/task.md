# ECMS-46 — On-demand image delivery: URL transforms, presets, focal-point crop

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Deliver one master image in any size, crop, and format on demand, cutting production cost and improving page speed.

## Current state in FlexCMS

Only pre-generated renditions; `hero-desktop`, `hero-mobile`, and `og-image` profiles are unreachable (GAP-082).

## Acceptance criteria

- [ ] AC1: Image endpoint accepting width, height, crop, fit, quality, and format (auto WebP/AVIF by Accept header).
- [ ] AC2: Named presets defined by admins; authors and renderers reference presets, not raw parameters.
- [ ] AC3: Focal point stored per asset and used for crops; in-browser crop/rotate UI.
- [ ] AC4: Results cached and CDN-served; purge on asset change.
- [ ] AC5: Renderers emit responsive `srcset` from presets.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-03

## Read first

- `flexcms/flexcms-dam/src/main/java/com/flexcms/dam/service/ImageProcessingService.java`
- `flexcms/flexcms-dam/src/main/java/com/flexcms/dam/service/RenditionPipelineService.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
