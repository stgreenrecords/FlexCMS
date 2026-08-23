# REB-23 — PIM catalog and product authoring E2E

Suite: `frontend/apps/selenium-e2e/src/cases/admin/pim-authoring-suite.spec.ts`
Commands: `pnpm test:reb23` / `pnpm test:reb23:ci` (added to the gate's `full` mode)
Matrix: `df/artifacts/REB-23/devops/pim-operation-matrix.csv`

**Result: 10 scenarios, 10 passing. 11 matrix rows — 10 PASS, 1 BLOCKED.**

## Coverage against the required scenarios

| Spec scenario | Suite | Evidence |
|---|---|---|
| 1 PIM route smoke | `S1` | `/pim`, `/pim/schema`, `/pim/import`, `/pim/{id}` all render; catalog detail shows API data |
| 2 Product create | `S2` | catalog + product created; get-by-SKU and catalog listing both resolve it; new product is `DRAFT` |
| 3 Product update | `S3` | marker attribute read back, **and** an untouched attribute survives (merge, not replace) |
| 4 Product status | `S4` | `PUBLISHED` → `ARCHIVED` → `DRAFT`, each verified by re-read |
| 5 Variant lifecycle | `S5` | create/list/update/delete, each checked against a re-read of the variant list |
| 6 Asset reference lifecycle | `S6` | link/list/update/unlink by DAM **path** — the PIM holds no FK into the DAM schema |
| 7 Version history/restore | `S7` | history rows distinct per write; restore reverts the attribute |
| 8 Carryforward/delta/merge | `S8` | `carriedForward > 0`, delta counts agree, `merge-inherited` 200 — test catalogs only (AC4) |
| 9 Import smoke | `S9` | `infer-schema` returns the CSV columns; omitting `sourceType` answers **400** |
| 10 Search + rendered integration | `S10` | search recorded as BLOCKED with the version analysis; rendered integration recorded as not applicable |

## Seven defects found and fixed

The PIM was substantially broken. Every one of these was found by probing the running
API before writing an assertion — the endpoints' signatures alone would have told me
nothing.

**1. A search-index failure blocked all product authoring.**
`ProductSearchService.index()` ran inline from create, update, status change,
carryforward and merge, and rethrew. With Elasticsearch unreachable, **every product
write answered 500** — the PIM looked broken when only search was. The index is derived
data with `/search/reindex/*` endpoints of its own, so `index()` and `remove()` are now
best effort and log a warning naming the rebuild path. `indexAll` and the reindex
endpoints still fail loudly: there, the reindex *is* the operation.

**2. Every product update collided on its version snapshot.**
`Product.version` is bumped by `@PreUpdate`, which JPA runs at flush — but each write
did `save(...)` then immediately `ProductVersion.fromProduct(product)`, reading the
version from before the increment. Create stored version 1; the first update stored
version 1 again and hit `product_versions_product_id_version_number_key`. **A product
could not be updated at all.** Five call sites now `saveAndFlush` before snapshotting —
including `restoreVersion`, which I initially missed and which would have failed
identically on the first restore.

**3. Variant and asset-reference endpoints all returned 500.**
`ProductVariant` and `ProductAssetRef` carry a lazy `Product` back-reference with no
`@JsonIgnore`, so serialising the child dragged in a proxy and failed outside the
session. `Product` already ignored the inverse side for exactly this reason.

**4. Status change and merge-inherited returned 500.**
Those paths load the product by SKU and never touch its `catalog`/`schema`, so the
proxies were unresolved at serialisation. A `withAssociationsLoaded` helper now
initialises them on every path that returns a Product as a response body. Chosen over
making the associations `EAGER` (which would change every query, including list pages)
or `@JsonIgnore` (which would drop catalog and schema from responses that carry them).

**5. Carrying a product forward made the target catalog unlistable.**
`GET /products?catalogId=…` 500'd for any catalog holding a carried-forward product:
the serialised `resolvedAttributes` walks the inheritance chain, and `sourceProduct` was
a proxy. The listing query now `LEFT JOIN FETCH`es it, and `sourceProduct` itself is no
longer serialised — nesting an entire parent product with its catalog and schema inside
every child is unbounded, and the useful view is already `resolvedAttributes` plus
`overriddenFields`.

This one hid itself: my first cleanup script read the 500 body as an empty list and
concluded the catalog had no products, which is why the leftovers below accumulated.

**6. The admin catalog list showed "No catalogs found" while the API returned catalogs.**
`/pim` did `data.map(apiToCatalog)` on `{items: [...], totalCount}` — a TypeError,
swallowed by `.catch(() => setCatalogs([]))`. It now reads the envelope and surfaces a
load error instead of rendering an empty state over a failure. (The catalog *detail*
route handled the shapes correctly; only the list was wrong.)

**7. Two more error mappings, both reaching the catch-all as 500.**
`DataIntegrityViolationException` → **409** with the constraint named, so "this catalog
still holds products" and "this product is a carryforward source" are legible instead
of opaque. `MissingServletRequestParameterException` → **400** naming the parameter;
found on `imports/infer-schema`, which needs a `sourceType`, but it applied to every
endpoint with a required parameter.

## Deliberately not fixed

**Product search is unavailable — a version decision, not a code defect.** Boot 4.1
manages `spring-data-elasticsearch 6.1.0`, which brings `elasticsearch-java 9.4.2`,
while `docker-compose.yml` pins the server to `elasticsearch:8.13.4`. The 9.x client
sends a `compatible-with=9` media type that an 8.x server rejects:

```
[es/index] failed: [media_type_header_exception]
Invalid media-type value on headers [Accept, Content-Type]
```

`flexcms/pom.xml` still declares `<elasticsearch.version>8.13.4</elasticsearch.version>`,
which no longer takes effect under Boot 4. Two ways out — move the container to 9.x, or
hold the client at 8.x and accept an older `spring-data-elasticsearch` — and picking one
is a platform call. `S10` records it as the suite's only BLOCKED row, and asserts that
product authoring keeps working while search is down, which is the point of fix 1.

**Rendered integration has nothing to verify.** The spec makes scenario 10 conditional
on a TUT component consuming PIM data; no renderer references `/api/pim` or a product
SKU, so `S10` records that rather than inventing a scenario.

## Two mistakes of mine

- My probe misread a 500 response body as an empty product list, which sent me looking
  for a query bug (I guessed at an inner join on `schema`, checked, and was wrong)
  before I read the raw response and found the lazy-proxy failure. Checking the body
  rather than my parse of it would have been quicker.
- Those probe runs left **10 catalogs and 9 products** behind, because deletion was
  broken by defects 2 and 5 while I was still diagnosing them. All removed once the
  listing fix let the teardown see carried-forward children; `GET /catalogs` is back to
  the single seeded `TUT 2026 Model Lineup`, verified.

## Tests

| Module | Tests | Notes |
|---|---|---|
| `flexcms-pim` | 128 unit + 13 IT, 0 failures | +3 for index resilience; 12 stubs re-pointed to `saveAndFlush` across four test classes |
| `flexcms-app` | 47, 0 failures | error-mapping handlers |

The re-pointed stubs are worth a note: `carryforward` and the restore path use different
persistence calls, so a blanket rename over the test files was wrong twice — once
leaving an unnecessary stub, once leaving a real one unstubbed. Each stub now matches
the call its test actually exercises.

## Acceptance criteria

- **AC1** — the suite talks only to `/api/pim/v1`; no CMS content-node assumptions.
- **AC2** — every catalog, SKU and variant is run-unique, and teardown removes them in
  dependency order (children before sources, products before catalogs).
- **AC3** — not applicable: no CMS page renders product data, recorded as an observation.
- **AC4** — carryforward runs between two test catalogs only, and the import scenario
  performs *inference* on a two-row CSV without importing into any catalog.
- **AC5** — this file, plus the matrix CSV.
