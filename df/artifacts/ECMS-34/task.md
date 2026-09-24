# ECMS-34 — Structured content fragment models and fragments

## Summary

- Priority: P1
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

One source of truth for channel-neutral structured content (FAQs, bios, product copy) authored once and used everywhere.

## Current state in FlexCMS

Only page components and PIM schemas exist; there is no model-driven structured content in the CMS.

## Acceptance criteria

- [ ] AC1: Fragment models with typed fields: single/multi-line text (plain, markdown, rich), number, boolean, date/time, enumeration, tags, content reference (asset/page), fragment reference, JSON.
- [ ] AC2: Field rules: required, default, validation, help text; models versioned and lockable once in use.
- [ ] AC3: Fragments stored in folders with CRUD, variations, versioning, and publish/unpublish (replicated like pages).
- [ ] AC4: Solution design decides storage (content tree nodes vs. dedicated tables) given the existing ltree/JSONB model, and whether PIM schema validation can be reused.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- GraphQL (ECMS-35); UI (ECMS-36).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-01

## Read first

- `flexcms/flexcms-pim/src/main/java/com/flexcms/pim/service/SchemaValidationService.java`
- `flexcms/flexcms-core/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
