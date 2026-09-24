# ECMS-47 — Video and rich media: adaptive streaming, sets, viewers

## Summary

- Priority: P3
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

High-quality video on any network from one upload, and rich product media without custom code.

## Current state in FlexCMS

Video is stored as an original file only.

## Acceptance criteria

- [ ] AC1: Transcode to adaptive streams (HLS/DASH) with profiles; posters and thumbnails; captions.
- [ ] AC2: Image sets and spin sets managed as single assets.
- [ ] AC3: Responsive, accessible viewers (zoom, 360, video) usable from components.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-46

## Read first

- `df/artifacts/ECMS-46/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
