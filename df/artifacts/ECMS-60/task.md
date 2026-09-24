# ECMS-60 — SEO delivery on the site and redirect manager

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Search engines see correct metadata; marketers manage redirects themselves.

## Current state in FlexCMS

Site renderers emit no SEO metadata; no redirect UI.

## Acceptance criteria

- [ ] AC1: Design package for a redirect manager.
- [ ] AC2: `site-nextjs` and `site-nuxt` emit title, description, canonical, robots, hreflang, OG/Twitter, and JSON-LD; honour redirects and vanity URLs.
- [ ] AC3: Admin redirect manager with CSV import/export.
- [ ] AC4: Selenium: assert meta tags and redirect responses on the public site.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-59

## Read first

- `frontend/apps/site-nextjs/`
- `frontend/apps/site-nuxt/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
