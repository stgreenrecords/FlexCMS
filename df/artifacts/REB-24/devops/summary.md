# REB-24 — secondary admin routes E2E

Suite: `frontend/apps/selenium-e2e/src/cases/admin/secondary-routes-suite.spec.ts`
Commands: `pnpm test:reb24` / `pnpm test:reb24:ci` (added to the gate's `full` mode)
Matrix: `df/artifacts/REB-24/devops/secondary-routes-matrix.csv`

**Result: 8 scenarios, 8 passing. 8 matrix rows — 6 PASS, 2 BLOCKED.**

Both BLOCKED rows are deliberate: they record surfaces that exist as UI but have nothing
behind them, which is exactly what AC1 asks this suite to evidence.

## Coverage against the required scenarios

| Spec scenario | Suite | Outcome |
|---|---|---|
| 1 Admin navigation smoke | `S1` | PASS — 9 routes render, headings asserted |
| 2 Sites route | `S2` | PASS — **backed**, read-only |
| 3 Translations route | `S3` | **BLOCKED** — static UI, no read endpoint exists |
| 4 Component registry | `S4` | PASS — 419 components, searchable, `dataSchema` visible |
| 5 Component authoring bridge | `S5` | **BLOCKED** — no route from registry into the editor |
| 6 Dashboard links | `S6` | PASS — the one in-body link resolves |
| 7 Error/empty states | `S7` | PASS — empty filter acknowledged |
| 8 Accessibility smoke | `S8` | PASS — landmarks, single `h1`, keyboard reaches a control |

## The defect this task existed to find

**`/components` rendered a blank document.** No heading, no navigation, zero focusable
elements — an empty `<body>` with a webpack script tag. The console said:

```
TypeError: Cannot read properties of undefined (reading 'bg')
  at Array.map
```

`apiToComponentDef` cast the registry's group straight to a seven-member union:

```ts
group: ((c.group as string) ?? 'content') as ComponentGroup,
```

The registry publishes **18 descriptive group names** — "Editorial & Article Content",
"Calls to Action, Promotions & Campaigns", "Layout & Page Structure" — so
`GROUP_COLORS[comp.group]` was `undefined` for *every* component, and reading `.bg` off
it threw during render. Not an edge case: the route could never have worked. The `as`
cast is why the compiler stayed quiet, and the `?? 'content'` guarded a *missing* group,
never an unrecognised one.

Fixed in two layers, because either alone leaves it fragile:

- `toComponentGroup()` maps a registry group onto a bucket **by keyword**, so colours,
  icons, labels and the group filter all work, and a group added to the registry later
  lands somewhere sensible instead of nowhere.
- The colour lookup now falls back, so an unmapped value can only ever cost the right
  tint — never the whole page.

The registry's own group name is kept as `groupLabel` and shown on the badge: "Media,
Visual Storytelling & Assets" tells an author more than "Media".

## Two surfaces that are UI without a backend

**Translations is static.** `/translations` issues no request at all. The backend has the
model and the service — `I18nDictionary`, `LanguageCopy`, `TranslationService`, and a
`createLanguageCopy` action on `SiteAdminController` — but **nothing exposes the
dictionary for reading**, so the matrix, its status filters and its pagination have no
data source. The page is honest about it (an empty state, not a fake table), so `S3`
asserts the heading, a working search control, zero rows and the empty state, and records
that the spec's filter/status/pagination coverage cannot be written until a read endpoint
exists.

**The registry has no bridge to the editor.** `/components` renders no link or action
targeting `/editor`, so an author who finds a component there cannot get from it to
authoring it. `S5` asserts the absence and records it, which is what the spec asks for
("otherwise document missing integration as blocker for later REB-19 coverage"). The
assertion is written so that adding a bridge *fails* the scenario — a deliberate prompt
to replace it with real authoring coverage.

## Recorded observations, not failures

- **`/dam` renders no `h1`.** Every other admin route has one, so this is an
  inconsistency rather than a house style, and it leaves that route without an
  accessible page title. `S1` records it; `S8` does not cover `/dam` for that reason.
- **The dashboard has one in-body link.** The spec's "primary dashboard cards/links" are
  stat tiles without navigation, so route coverage reachable from the dashboard is
  thinner than scenario 6 assumes.

## A mistake in the suite

`S1` first asserted that no route's text contains `404`. The component registry
legitimately lists a component called **"Error Page 404"**
(`tut-usa/layout-page-structure/error-page-404`), so the check failed on real content.
It now matches Next's own not-found copy instead. The blank-page detection that actually
matters — "did this route render more than five focusable elements" — is what caught the
`/components` crash, and it is unaffected.

## Acceptance criteria

- **AC1** — every scenario records whether it found backed functionality or static UI:
  sites is backed read-only, the registry is backed, translations is static, and the
  authoring bridge is absent. The two BLOCKED rows carry the evidence.
- **AC2** — `S4` asserts the registry serves 419 components, that its group names survive
  into the UI, that search narrows to a named component, and that components publish a
  `dataSchema` — which is the metadata REB-19's authoring matrix depends on.
