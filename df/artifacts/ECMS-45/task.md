# ECMS-45 — Collections, share links, bulk ingestion, and asset reports

## Summary

- Priority: P3
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Package assets for partners without email attachments and measure asset reuse.

## Current state in FlexCMS

Only single-file download; no collections, sharing, bulk import, or reports.

## Acceptance criteria

- [ ] AC1: Static and query-based collections.
- [ ] AC2: Expiring share links and multi-asset download with rendition choice (optional watermark).
- [ ] AC3: Folder upload and bulk import from object storage.
- [ ] AC4: Reports: usage, downloads, expiry, storage.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-41

## Read first

- `df/artifacts/ECMS-41/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
