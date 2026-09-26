# ECMS-22 — Generic core component library

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Provide a maintained, accessible, SEO-friendly component set any new site can use without building from scratch.

## Current state

Of 420 registered components, only ~10 are generic (`flexcms/rich-text`, `image`, `container`, header/footer, fragment types); the rest are sample-site specific.

## Acceptance criteria

- [ ] AC1: Technical design lists the core set (title, text, image, button, teaser, list, carousel, accordion, tabs, breadcrumb, navigation, search, embed, separator, container, download) with contracts.
- [ ] AC2: Each component: `dataSchema`, dialog, React and Vue renderers, WCAG 2.1 AA, semantic HTML, JSON-LD where relevant.
- [ ] AC3: Sample-site components may extend core components rather than duplicate them.
- [ ] AC4: Split into contract (backend migration) and renderer (frontend) child tasks, batched by group.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-22-TC01 | AC2 | ui | _Draft:_ Each component: `dataSchema`, dialog, React and Vue renderers, WCAG 2.1 AA, semantic HTML, JSON-LD where relevant. | — |
| ECMS-22-TC02 | AC3 | api | _Draft:_ Sample-site components may extend core components rather than duplicate them. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-22.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-app/src/main/resources/db/migration/V16__tut_usa_component_definitions.sql`
- `frontend/packages/site-renderers/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-22/task.md`). |
