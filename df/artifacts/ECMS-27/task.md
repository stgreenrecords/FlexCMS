# ECMS-27 — Translation projects, jobs, delta updates, and translation rules

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Batch, track, and audit translation work, and pay only for changed content.

## Current state in FlexCMS

Only one-shot language-copy creation exists; the DeepL connector is unreachable (GAP-081).

## Acceptance criteria

- [ ] AC1: Translation project and job entities with states (draft → submitted → in progress → ready for review → approved/rejected → complete).
- [ ] AC2: Jobs can contain pages, fragments, assets metadata, tags, and dictionaries.
- [ ] AC3: Delta update re-sends only content modified since the last completed job.
- [ ] AC4: Translation rules declare which component properties are translatable, so URLs and ids are never sent.
- [ ] AC5: Machine translation via the existing connector framework; human review step.
- [ ] AC6: Language-copy sync status is updated from real modification dates.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- Vendor-specific connectors.

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-25

## Read first

- `flexcms/flexcms-i18n/src/main/java/com/flexcms/i18n/service/TranslationService.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
