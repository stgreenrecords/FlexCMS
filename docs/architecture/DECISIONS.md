# Architecture Decision Log

Decisions that current and future work must respect. Newest first. Add an entry whenever a task makes a choice that is hard to reverse, or that other tasks depend on: data model, public contract, cross-module dependency, or process. Reference entries by ID (`DEC-…`) from task specs and code comments.

Decisions made under the retired workflow and no longer relevant (for example, role and state rules of the old process) are available in `git show archive/dark-factory:df/runtime/decisions.md`.

**Template**

```markdown
## DEC-<AREA>-<NNN> — <Title>
- Date: YYYY-MM-DD · Status: Accepted | Superseded by DEC-… · Task: <ID>
- Context: <why a decision was needed>
- Decision: <what was decided>
- Consequences: <what follows, including trade-offs>
```

---

## DEC-PROC-001 — One backlog SDLC, and Playwright as the only test framework

- Date: 2026-09-26 · Status: Accepted (human) · Supersedes: the Dark Factory role/state workflow, the Kyle/Erik work boards, the `agents/queue.json` dispatcher, and the Copilot instructions.
- Context: Three overlapping agent workflows made it hard for agents to find the current task. Tests were split across Playwright (mocked admin UI) and Selenium (live stack).
- Decision:
  - `backlog/BOARD.md` is the single source of task status, and `backlog/tasks/<ID>.md` holds the specs. The process is defined in `docs/process/SDLC.md`, and `AGENTS.md` is the only agent rulebook (`CLAUDE.md` imports it).
  - One agent carries a task from Ready to Done, including its tests. No separate QA/PO roles.
  - Every task spec has a test-case table. Every behavioural AC is proven by Playwright (`api`, `ui` or `e2e`), as described in `docs/process/TESTING.md`.
  - The Playwright suite `frontend/apps/e2e` (renamed from `admin-e2e`) covers the mocked UI, live API, and full-stack levels. Selenium is frozen, is no longer a gate, and is ported by the `TEST-*` tasks.
- Consequences: All earlier process artifacts are in git tag `archive/dark-factory`.

## DEC-ECMS-002 — Publish-tier asset delivery via replicated metadata and a canonical `/dam/renditions` URL

- Date: 2026-09-24 · Status: Accepted · Task: ECMS-03 (design: `backlog/designs/ECMS-03.md`)
- Context: Published pages could not render DAM assets. Content stored author-only URLs, the publish database had no asset rows, and nothing served `/dam/renditions/**`.
- Decision:
  - Canonical public asset URLs are `/dam/renditions/{assetId}` and `/dam/renditions/{assetId}/{renditionKey}`, owned by `com.flexcms.core.util.AssetUrls`. Legacy `/api/author/assets/{id}/content` references are rewritten on delivery, not in stored content.
  - Asset **metadata** is replicated to publish (upserted by the author's id). Binaries stay in the shared object store. Publish serves only assets whose row was replicated.
  - Publishing content replicates the assets it references. Assets also have explicit publish/unpublish, and asset deletion replicates. Unpublishing a page does not retract its assets until reference counting exists (ECMS-02).
  - Moving binaries to a dedicated static/CDN bucket later is possible without changing the URL contract.
- Consequences: `flexcms-headless` depends on `flexcms-dam`. `ReplicationEvent` carries asset payloads. The reference site proxies `/dam/renditions` (live) and `/draft-dam/renditions` (preview) to its API hosts.

## DEC-ECMS-001 — Scope and conventions of the enterprise-CMS parity program

- Date: 2026-09-24 · Status: Accepted (human naming instruction) · Task: ECMS-00 (`docs/product/ECMS_GAP_ANALYSIS.md`)
- Decision:
  - Program prefix `ECMS`. The reference product is never named: no vendor or branded feature names in IDs, titles, code, or docs. Use generic terms such as "historical as-of view", "component style variants", or "staged releases".
  - The baseline is native platform capability only. Third-party integrations and AI-dependent features (auto-tagging, similarity search, automated form conversion) are excluded until a model/vendor decision exists.
  - The backend stays JSON-only. Capabilities that produce HTML are delivered by the frontend render service.
  - Capabilities where FlexCMS already exceeds the baseline (PIM, multi-framework SDKs, static build dependency graph) must not regress.

## DEC-TEST-001 — Never encode missing capability as passing behaviour

- Date: 2026-08-19 · Status: Accepted · Origin: the page-editor authoring suite (formerly REB-19)
- Context: Some required test scenarios touch capabilities that do not exist yet. A test could assert the broken behaviour as "expected" and go green forever.
- Decision: The test probes the real capability. If it is missing, the test stays failing or is `test.fixme('… — blocked by <TASK-ID>')`. It is never rewritten to assert the current behaviour. Where a working alternative path exists for the required outcome, the test asserts the outcome through that path and names the gap. `AuthorableField.isLossyInEditor` marks list, object, and asset fields, so no test authors structured content through a control that would stringify it.
- Consequences: The suites never report a false green, and pending tests turn green without edits once the capability ships.

## DEC-DATA-002 — Seed resets are opt-in and environment-guarded

- Date: 2026-07-07 · Status: Accepted
- Decision: Historical Flyway migrations are never rewritten. Reset/reseed tooling deletes only deterministic TUT/demo seed records, and requires an explicit confirmation flag or environment gate.
- Consequences: Local and QA demo data can be reset, while production-like data is protected by default. Tests never modify seeded data.

## DEC-DATA-001 — Original design sources are immutable

- Date: 2026-07-07 · Status: Accepted
- Decision: `Design/sample-website-tut/` is immutable input evidence. Normalized templates, captured assets, manifests, generated contracts, and test mappings are written under `Design/tut-usa/`.
- Consequences: Processing is reversible, and source references stay auditable.
