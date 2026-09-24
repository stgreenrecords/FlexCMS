# ECMS-01 — Taxonomy and tagging service for pages, assets, and fragments

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `backend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Give every content type a shared, governed tag vocabulary so content can be classified, filtered, and searched consistently across sites and languages.

## Current state in FlexCMS

No tag concept exists anywhere. `AssetRepository.search` once referenced a phantom `tags` column (R-REB-21-002). Page, asset, and fragment classification is impossible.

## Acceptance criteria

- [ ] AC1: Tag namespaces and hierarchical tags (e.g. `products:vehicles/suv`) with CRUD API under `/api/author/tags`, following model → repository → service → controller layering.
- [ ] AC2: Each tag stores a title per locale; API returns the locale-appropriate title with fallback to the default locale.
- [ ] AC3: Pages (content nodes) and DAM assets can be tagged and untagged; tags are returned in author and headless JSON.
- [ ] AC4: Deleting or merging a tag in use returns 409 unless an explicit `force`/`mergeInto` is given; merge re-points all references.
- [ ] AC5: Content search and asset search can filter by tag (including a tag's descendants).
- [ ] AC6: Flyway migration for the tag tables; RFC 7807 errors for not-found/conflict via existing exception types.
- [ ] AC7: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-01/backend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `backend-dev`. Follow `CLAUDE.md` layering (model → repository → service → controller) and existing exception/RFC 7807 conventions.

## Out of scope

- Admin tag-manager UI and tag pickers (separate frontend task after design).
- AI auto-tagging.

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/model/ContentNode.java`
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/repository/AssetRepository.java`
- `flexcms/flexcms-search/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
