# ECMS-59 — SEO foundation: vanity URLs, redirects, hreflang, canonical, social metadata

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-06](ECMS-06.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Protect organic traffic during migrations and campaigns.

## Current state

No vanity URLs, redirects, hreflang, canonical, OG/Twitter, or JSON-LD support (code probe 2026-09-24).

## Acceptance criteria

- [ ] AC1: Vanity URL resolution on publish delivery, unique per site.
- [ ] AC2: Redirect rules (page-level and a managed map, 301/302) with an API.
- [ ] AC3: Page JSON includes canonical, robots, OG/Twitter fields, and hreflang alternates derived from language copies.
- [ ] AC4: Sitemap includes hreflang alternates and excludes noindex pages.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-59-TC01 | AC1 | api | _Draft:_ Vanity URL resolution on publish delivery, unique per site. | — |
| ECMS-59-TC02 | AC2 | api | _Draft:_ Redirect rules (page-level and a managed map, 301/302) with an API. | — |
| ECMS-59-TC03 | AC3 | api | _Draft:_ Page JSON includes canonical, robots, OG/Twitter fields, and hreflang alternates derived from language copies. | — |
| ECMS-59-TC04 | AC4 | api | _Draft:_ Sitemap includes hreflang alternates and excludes noindex pages. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-59.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- Site rendering and admin UI (ECMS-60).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-headless/src/main/java/com/flexcms/headless/service/SitemapService.java`
- `flexcms/flexcms-publish/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-59/task.md`). |
