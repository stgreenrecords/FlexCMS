# ECMS-25 — i18n dictionary REST API with import/export

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `backend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Expose UI-string dictionaries so the Translations page and delivery can use them.

## Current state in FlexCMS

`I18nService` (setTranslation, importTranslations, getDictionary) and tables exist, but no controller exposes them (test doc GAP-080).

## Acceptance criteria

- [ ] AC1: CRUD endpoints for dictionary keys per site and locale, with pagination and search.
- [ ] AC2: Import/export in JSON and XLIFF 1.2/2.0.
- [ ] AC3: Headless endpoint returns a locale dictionary with the documented fallback chain.
- [ ] AC4: Validation and RFC 7807 errors; audit entries for changes.
- [ ] AC5: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-25/backend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `backend-dev`. Follow `CLAUDE.md` layering (model → repository → service → controller) and existing exception/RFC 7807 conventions.

## Out of scope

- Translations page (ECMS-26).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-i18n/src/main/java/com/flexcms/i18n/service/I18nService.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
