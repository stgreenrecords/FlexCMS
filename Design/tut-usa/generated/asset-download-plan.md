# TUT USA asset download and storage plan

## Source-backed static inventory

- Template HTML files scanned: 20
- Unique direct remote URLs found: 103
- Static inventory file: `Design/tut-usa/generated/static-asset-url-inventory.json`

## Required download approach

1. Treat `Design/sample-website-tut/` as immutable source evidence.
2. Use Selenium/Chromium to open each template `code.html` in `Design/sample-website-tut/template-libs/*/`.
3. Wait for network idle, `document.fonts.ready`, and full-page scroll completion to reveal lazy-loaded resources.
4. Capture network requests for `image`, `font`, `stylesheet`, and media resource types. Skip remote scripts for runtime use; keep script URLs only as provenance/blocker evidence.
5. Download permitted static resources into `Design/tut-usa/assets/{images,fonts,media,styles}/` using a content hash plus a readable slug.
6. Write one `assets-manifest.json` per template under `Design/tut-usa/templates/{template-slug}/` with source URL, local path, content type, checksum, byte size, status, and license/provenance notes.
7. Rewrite browser-normalized HTML to `Design/tut-usa/templates/{template-slug}/normalized.html` with local relative asset references.
8. Copy or publish runtime-safe assets from the canonical manifest to `frontend/apps/site-nextjs/public/tut-usa/` or import them into DAM with a generated DAM URL map.
9. Record unavailable, disallowed, or license-unclear resources as manifest blockers instead of silently replacing them.

## Storage convention

```text
Design/tut-usa/assets/images/      # captured image assets
Design/tut-usa/assets/fonts/       # captured font files grouped by family where possible
Design/tut-usa/assets/media/       # videos/audio/other media
Design/tut-usa/assets/styles/      # captured static CSS only, no third-party runtime scripts
Design/tut-usa/templates/{slug}/assets-manifest.json
Design/tut-usa/templates/{slug}/normalized.html
frontend/apps/site-nextjs/public/tut-usa/  # generated runtime copy, not hand-maintained
```

## Notes for REB-02

- The static inventory is not a replacement for browser capture because template assets include fonts, remote images, Tailwind CDN scripts, and may include runtime/lazy resources.
- Direct remote hosts observed in static HTML are summarized in the inventory; DevOps should use Selenium evidence as the authoritative capture output.

