# CONTENT-PUBLISH-DOUBLECLICK

## Request

When an author double-clicks a page in the admin content tree, open that page on the publish environment in a new browser tab.

## Acceptance criteria

- Single-click folder navigation remains unchanged.
- Double-clicking a `flexcms/page` row opens a new tab at the publish origin plus the page URL path.
- Non-page rows do not open a publish tab from double-click.
- The publish origin is configurable with `NEXT_PUBLIC_PUBLISH_URL` and defaults to the local reference site at `http://localhost:3001`.
- Automated browser coverage and the full frontend build pass.

