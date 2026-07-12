# BUG-TUT-VEHICLE-RENDERER

## Goal
Replace generic contract-driven renderers with authored TUT vehicle and campaign UI, including the offers-and-finance page.

## Scope
- Register the full CMS resource type `tut-usa/commerce-catalog-merchandising/product-card`.
- Render authored product name, image, price, description, and CTA.
- Register concrete `pricing-table`, `plan-card`, and `offer-card` renderers.
- Route all unmapped `Calls to Action, Promotions & Campaigns` contracts to a semantic campaign renderer instead of metadata output.
- Preserve the generic grouped fallback for unrelated unknown component types.

## Role
`frontend-dev`

## Current state
`DONE`

## Design note
This is a renderer bug fix using the existing TUT reference-site visual tokens and conventions; no new page design package is required.

## Completion record

- 2026-07-12 local: Frontend implementation and developer-owned verification completed. Concrete vehicle/campaign/learning renderers, image-object normalization, unit coverage, full frontend builds, live seeded route probes, and Selenium smoke/full gates passed. See `frontend/summary.md` and `handoffs.md`.

