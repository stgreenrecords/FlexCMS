# ECMS-60 — SEO delivery on the site and redirect manager

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-59](ECMS-59.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Search engines see correct metadata; marketers manage redirects themselves.

## Current state

Site renderers emit no SEO metadata; no redirect UI.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for a redirect manager.
- [ ] AC2: `site-nextjs` and `site-nuxt` emit title, description, canonical, robots, hreflang, OG/Twitter, and JSON-LD; honour redirects and vanity URLs.
- [ ] AC3: Admin redirect manager with CSV import/export.
- [ ] AC4: Playwright E2E: assert meta tags and redirect responses on the public site.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-60-TC01 | AC2 | ui | _Draft:_ `site-nextjs` and `site-nuxt` emit title, description, canonical, robots, hreflang, OG/Twitter, and JSON-LD; honour redirects and vanity URLs. | — |
| ECMS-60-TC02 | AC3 | ui | _Draft:_ Admin redirect manager with CSV import/export. | — |
| ECMS-60-TC03 | AC4 | e2e | _Draft:_ Playwright E2E: assert meta tags and redirect responses on the public site. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/site-nextjs/`
- `frontend/apps/site-nuxt/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-60/task.md`). |
