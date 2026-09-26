# ECMS-34 — Structured content fragment models and fragments

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-01](ECMS-01.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

One source of truth for channel-neutral structured content (FAQs, bios, product copy) authored once and used everywhere.

## Current state

Only page components and PIM schemas exist; there is no model-driven structured content in the CMS.

## Acceptance criteria

- [ ] AC1: Fragment models with typed fields: single/multi-line text (plain, markdown, rich), number, boolean, date/time, enumeration, tags, content reference (asset/page), fragment reference, JSON.
- [ ] AC2: Field rules: required, default, validation, help text; models versioned and lockable once in use.
- [ ] AC3: Fragments stored in folders with CRUD, variations, versioning, and publish/unpublish (replicated like pages).
- [ ] AC4: Technical design decides storage (content tree nodes vs. dedicated tables) given the existing ltree/JSONB model, and whether PIM schema validation can be reused.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-34-TC01 | AC1 | api | _Draft:_ Fragment models with typed fields: single/multi-line text (plain, markdown, rich), number, boolean, date/time, enumeration, tags, content reference (asset/page), fragment reference, JSON. | — |
| ECMS-34-TC02 | AC2 | api | _Draft:_ Field rules: required, default, validation, help text; models versioned and lockable once in use. | — |
| ECMS-34-TC03 | AC3 | api | _Draft:_ Fragments stored in folders with CRUD, variations, versioning, and publish/unpublish (replicated like pages). | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-34.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- GraphQL (ECMS-35); UI (ECMS-36).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-pim/src/main/java/com/flexcms/pim/service/SchemaValidationService.java`
- `flexcms/flexcms-core/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-34/task.md`). |
