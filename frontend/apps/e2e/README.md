# @flexcms/e2e — Playwright test suite

This package holds every browser and API test level for FlexCMS. The full standard — test levels, test-case format, conventions, gates — is in [`docs/process/TESTING.md`](../../../docs/process/TESTING.md).

| Folder | Level | Backend |
|---|---|---|
| `tests/ui/` | Admin UI behaviour | mocked (`/api/**` routes) |
| `tests/a11y/`, `tests/visual/` | Accessibility, screenshots | mocked |
| `tests/api/` | REST/GraphQL contracts | real Author + Publish |
| `tests/e2e/` | Full-stack journeys | real stack |
| `tests/setup/` | Live-stack guard run before `api`, `e2e`, `ui-live` | — |

```bash
pnpm test                               # mocked UI on chromium (needs `cd frontend && pnpm build`)
pnpm test:live                          # api + e2e + ui-live (needs `flex start local all`)
pnpm exec playwright test --grep @ECMS-01   # every test of one task
pnpm typecheck
pnpm report
```

These files are the patterns to copy: `tests/api/platform-smoke.spec.ts` for the api level, `tests/e2e/admin-smoke.spec.ts` for e2e, and `tests/ui/content-tree.spec.ts` for mocked ui.

Every test title starts with its test-case ID (`ECMS-01-TC03 …`), and every test is tagged with its task (`{ tag: ['@ECMS-01'] }`).
