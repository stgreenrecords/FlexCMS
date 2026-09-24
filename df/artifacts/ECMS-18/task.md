# ECMS-18 — Editable templates: write API, lifecycle, and structure propagation

## Summary

- Priority: P1
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Template authors create and change page types in the browser, without a deployment, and existing pages follow structure changes.

## Current state in FlexCMS

`TemplateDefinition` already models `structure`, `initialContent`, `pageProperties`, `allowedSites`, but the API is read-only and templates exist only as seed data (V17).

## Acceptance criteria

- [ ] AC1: Template CRUD API with enable/disable and per-site availability.
- [ ] AC2: Structure (locked components) changes propagate to every page using the template; initial content affects only new pages.
- [ ] AC3: Server-side enforcement: creating a component in a container its template/policy disallows returns 422.
- [ ] AC4: Templates are versioned; deleting a template in use returns 409.
- [ ] AC5: Solution design covers propagation strategy (render-time merge vs. write-time sync) and migration of the 21 seeded templates.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- Template editor UI (ECMS-20).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/TemplateDefinition.java`
- `flexcms/flexcms-app/src/main/resources/db/migration/V17__tut_usa_page_templates.sql`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
