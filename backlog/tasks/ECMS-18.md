# ECMS-18 — Editable templates: write API, lifecycle, and structure propagation

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Template authors create and change page types in the browser, without a deployment, and existing pages follow structure changes.

## Current state

`TemplateDefinition` already models `structure`, `initialContent`, `pageProperties`, `allowedSites`, but the API is read-only and templates exist only as seed data (V17).

## Acceptance criteria

- [ ] AC1: Template CRUD API with enable/disable and per-site availability.
- [ ] AC2: Structure (locked components) changes propagate to every page using the template; initial content affects only new pages.
- [ ] AC3: Server-side enforcement: creating a component in a container its template/policy disallows returns 422.
- [ ] AC4: Templates are versioned; deleting a template in use returns 409.
- [ ] AC5: Technical design covers propagation strategy (render-time merge vs. write-time sync) and migration of the 21 seeded templates.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-18-TC01 | AC1 | api | _Draft:_ Template CRUD API with enable/disable and per-site availability. | — |
| ECMS-18-TC02 | AC2 | api | _Draft:_ Structure (locked components) changes propagate to every page using the template; initial content affects only new pages. | — |
| ECMS-18-TC03 | AC3 | api | _Draft:_ Server-side enforcement: creating a component in a container its template/policy disallows returns 422. | — |
| ECMS-18-TC04 | AC4 | api | _Draft:_ Templates are versioned; deleting a template in use returns 409. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-18.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- Template editor UI (ECMS-20).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/TemplateDefinition.java`
- `flexcms/flexcms-app/src/main/resources/db/migration/V17__tut_usa_page_templates.sql`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-18/task.md`). |
