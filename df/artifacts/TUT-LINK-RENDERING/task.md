# Task - TUT-LINK-RENDERING

## Summary

Render authored TUT-USA links end to end and prove every seeded-site link is clickable and resolves.

## Type

Bug

## Priority

P0

## Current state

DONE

Implementation completed; the authored-link unit, focused link-integrity, full frontend, Selenium smoke, and Selenium full gates all pass.

## Business goal

Visitors can use every visible navigation, card, CTA, breadcrumb, footer, legal, and external link across the complete seeded site.

## Acceptance criteria

- [x] Navigation renders authored brand/home, primary, utility, account/test-drive, and dealer destinations instead of static labels or `#`.
- [x] Hero primary/secondary CTAs, product cards/grids, featured-content cards, breadcrumbs, CTA components, footer groups, legal links, and social links render the authored destination.
- [x] Invalid or absent link data is omitted/disabled accessibly and never rendered as `href="#"`, empty href, or `javascript:`.
- [x] Navigational elements are keyboard-focusable anchors with accessible names and existing visible focus/hover behavior.
- [x] External new-tab links use `target="_blank"` with `rel="noopener noreferrer"`; internal links remain same-tab unless explicitly configured otherwise.
- [x] Unit tests cover every changed renderer with authored links and missing/invalid data, asserting zero placeholder hrefs.
- [x] Selenium discovers all seeded pages, inventories all anchors, validates every unique internal route and fragment by navigation/click, and reports zero error shells, missing targets, empty/hash-only hrefs, or browser console errors caused by navigation.
- [x] External links are URI/security validated without requiring third-party availability; failure diagnostics identify source page, link text, and href.
- [x] The site package tests, full frontend build, and Selenium smoke/full gates pass with zero failures. Selenium template coverage is `22 tests / 0 failures`; smoke and full retained-artifact gates pass.

## Out of scope

- New visual design or layout changes.
- Following third-party links in deterministic CI.
- Non-navigation form/business behavior unrelated to link clickability.

## Assumptions

- This is a non-visual behavior correction using the existing approved TUT design package, so no designer task is required.
- The data child delivers complete authored link objects before this task starts.

## Dependencies

- TUT-LINK-SEED
- BUG-TUT-VEHICLE-RENDERER

## Risks

- Shared files `component-map.tsx` and renderer modules are under active frontend work; dependency ordering prevents clobbering those changes.
- Rendering every collection item as a link must not create nested anchors; tests must cover composed card/CTA markup.

## Links

- Issue: n/a
- PR: n/a
- Design: `df/artifacts/TUT-LINK-INTEGRITY/solution-design.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-07-11 17:24 CEST | sa | OPEN → READY_FOR_DEV | Defined renderer correction, accessibility requirements, and full-site Selenium link gate. |
| 2026-07-12 local | frontend-dev | READY_FOR_DEV → DEV_IN_PROGRESS | Dependency completed; implemented authored link normalization/rendering, renderer unit coverage, and full-site link-integrity coverage. |
| 2026-07-12 local | frontend-dev | DEV_IN_PROGRESS → DONE | Expanded the shared Selenium CTA detector for valid authored action labels; site runtime returned HTTP 200; template coverage passed 22/22, Selenium smoke passed, and Selenium full passed with retained artifacts. |
