# ECMS-46 — On-demand image delivery: URL transforms, presets, focal-point crop

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-03](ECMS-03.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Deliver one master image in any size, crop, and format on demand, cutting production cost and improving page speed.

## Current state

Only pre-generated renditions; `hero-desktop`, `hero-mobile`, and `og-image` profiles are unreachable (GAP-082).

## Acceptance criteria

- [ ] AC1: Image endpoint accepting width, height, crop, fit, quality, and format (auto WebP/AVIF by Accept header).
- [ ] AC2: Named presets defined by admins; authors and renderers reference presets, not raw parameters.
- [ ] AC3: Focal point stored per asset and used for crops; in-browser crop/rotate UI.
- [ ] AC4: Results cached and CDN-served; purge on asset change.
- [ ] AC5: Renderers emit responsive `srcset` from presets.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-46-TC01 | AC1 | api | _Draft:_ Image endpoint accepting width, height, crop, fit, quality, and format (auto WebP/AVIF by Accept header). | — |
| ECMS-46-TC02 | AC2 | api | _Draft:_ Named presets defined by admins; authors and renderers reference presets, not raw parameters. | — |
| ECMS-46-TC03 | AC3 | ui | _Draft:_ Focal point stored per asset and used for crops; in-browser crop/rotate UI. | — |
| ECMS-46-TC04 | AC4 | api | _Draft:_ Results cached and CDN-served; purge on asset change. | — |
| ECMS-46-TC05 | AC5 | api | _Draft:_ Renderers emit responsive `srcset` from presets. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-46.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-dam/src/main/java/com/flexcms/dam/service/ImageProcessingService.java`
- `flexcms/flexcms-dam/src/main/java/com/flexcms/dam/service/RenditionPipelineService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-46/task.md`). |
