# ECMS-22 — Generic core component library

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Provide a maintained, accessible, SEO-friendly component set any new site can use without building from scratch.

## Current state in FlexCMS

Of 420 registered components, only ~10 are generic (`flexcms/rich-text`, `image`, `container`, header/footer, fragment types); the rest are sample-site specific.

## Acceptance criteria

- [ ] AC1: Solution design lists the core set (title, text, image, button, teaser, list, carousel, accordion, tabs, breadcrumb, navigation, search, embed, separator, container, download) with contracts.
- [ ] AC2: Each component: `dataSchema`, dialog, React and Vue renderers, WCAG 2.1 AA, semantic HTML, JSON-LD where relevant.
- [ ] AC3: Sample-site components may extend core components rather than duplicate them.
- [ ] AC4: Split into contract (backend migration) and renderer (frontend) child tasks, batched by group.

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

- `flexcms/flexcms-app/src/main/resources/db/migration/V16__tut_usa_component_definitions.sql`
- `frontend/packages/site-renderers/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
