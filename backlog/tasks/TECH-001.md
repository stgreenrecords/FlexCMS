# TECH-001 — Asset cache headers let withdrawn images live in browsers for a day

| Field | Value |
|---|---|
| Type | Tech |
| Priority | P3 |
| Area | Backend (`flexcms-dam` / asset delivery) |
| Depends on | [ECMS-03B](ECMS-03B.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

A withdrawn or deleted asset stops being shown quickly, including to visitors who already loaded it, without losing CDN caching.

## Current state

`/dam/renditions/**` responses carry `Cache-Control: public, max-age=86400` (DEC-ECMS-002). CDN copies are purged on withdraw/delete, but browsers keep their copy for up to 24 h. This was found while verifying ECMS-03B (scenarios S4/S6).

## Acceptance criteria

- [ ] AC1: Rendition responses use `s-maxage` for shared caches and browser revalidation (e.g. `max-age=0, must-revalidate`), with `ETag`/`304` support so revalidation stays cheap. The exact values are decided in refinement and recorded in `docs/architecture/DECISIONS.md`.
- [ ] AC2: After withdrawal, a revalidating browser request receives 404.

## Test cases

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| TECH-001-TC01 | AC1 | api | GET a published rendition → the Cache-Control header matches the decided policy, and a conditional GET with its ETag → 304 | — |
| TECH-001-TC02 | AC2 | api | Given a published asset, when it is unpublished, then a conditional GET with the old ETag → 404 | — |

## Refinement needed

Decide the header policy, weighing legal takedown needs against CDN and origin load.

## Log

| Date | Note |
|---|---|
| 2026-09-26 | Created from the ECMS-03B finding (2026-09-24). |
