# ECMS-59 — SEO foundation: vanity URLs, redirects, hreflang, canonical, social metadata

## Summary

- Priority: P1
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Protect organic traffic during migrations and campaigns.

## Current state in FlexCMS

No vanity URLs, redirects, hreflang, canonical, OG/Twitter, or JSON-LD support (code probe 2026-09-24).

## Acceptance criteria

- [ ] AC1: Vanity URL resolution on publish delivery, unique per site.
- [ ] AC2: Redirect rules (page-level and a managed map, 301/302) with an API.
- [ ] AC3: Page JSON includes canonical, robots, OG/Twitter fields, and hreflang alternates derived from language copies.
- [ ] AC4: Sitemap includes hreflang alternates and excludes noindex pages.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- Site rendering and admin UI (ECMS-60).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-06

## Read first

- `flexcms/flexcms-headless/src/main/java/com/flexcms/headless/service/SitemapService.java`
- `flexcms/flexcms-publish/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
