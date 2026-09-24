# ECMS-61 — Content search v2: reindex, facets, suggestions

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `backend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Visitors and authors find content quickly without an external search product.

## Current state in FlexCMS

Content search has no reindex endpoint (GAP-083), no facets, suggestions, or boosting; the index only updates as a side effect of replication.

## Acceptance criteria

- [ ] AC1: Admin reindex endpoint for content (full and per site) using `IndexRebuildService`.
- [ ] AC2: Facets (template, tag, locale, site), suggestions/autocomplete, field boosting, language analysers.
- [ ] AC3: Author-side search across drafts for omnisearch (ECMS-62).
- [ ] AC4: IT coverage against the Elasticsearch container.
- [ ] AC5: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-61/backend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `backend-dev`. Follow `CLAUDE.md` layering (model → repository → service → controller) and existing exception/RFC 7807 conventions.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-search/src/main/java/com/flexcms/search/service/IndexRebuildService.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
