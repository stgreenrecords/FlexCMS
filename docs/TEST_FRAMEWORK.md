# FlexCMS — Automated Test Framework

> **Goal:** full functional coverage by **automated** tests that run against the **live seeded
> stack** (no mocks). This is the engineering counterpart to `docs/RETEST_PLAN.md`: the plan says
> *what* to verify and with *what evidence*; this doc defines the *framework* that automates it.
>
> Work is tracked as `TF-xx` tasks on the Agent Factory board (`flex agent status`).

---

## 1. Engine choice — Playwright (Selenium-equivalent)

We standardise on **Playwright** as the browser-automation engine (the modern Selenium): it is
already in the repo (`frontend/apps/admin-e2e`), supports Chromium/Firefox/WebKit, has first-class
network control, tracing, and a request API for backend calls. We do **not** add Selenium/WebDriver
in parallel — that would fragment tooling and CI. Where a JVM-native API layer is preferred, backend
functional tests may use **REST Assured** inside the existing Maven test lifecycle.

> The important shift is **not** the tool — it is running **against real services with mocks OFF**
> and asserting on **observable outcomes** (DB state, API payloads, rendered pixels), never on a
> stubbed `{"success":true}`.

---

## 2. Test pyramid & where each layer lives

| Layer | Framework / location | Runs against |
|---|---|---|
| **L1 Backend unit** | JUnit 5 (`flexcms/**/src/test`) | in-process |
| **L2 API functional** | REST Assured *or* Playwright `request` (`frontend/apps/admin-e2e/tests/api/`) | live Author/Publish + seeded DB |
| **L3 UI functional (E2E)** | Playwright + **Page Object Model** (`frontend/apps/admin-e2e`, live project) | Admin UI + live backend |
| **L4 Demo-site functional** | Playwright (`tests/site/`) | site-nextjs + live backend/DAM |
| **L5 Visual regression** | Playwright snapshots (`tests/visual/`) | full stack |
| **L6 Smoke gate** | `scripts/live_smoke.py` | full stack (CI + local) |

Coverage target maps 1:1 to the **430 cases in `docs/QA_TEST_PLAN.md`** — each case gets an
automated test tagged with its ID (e.g. `@CMS-001`), enabling a traceability report.

---

## 3. Framework architecture (L3 UI — the "Selenium-style" part)

```
frontend/apps/admin-e2e/
├── playwright.config.ts        # projects: chromium/firefox/webkit + "live" (mocks OFF)
├── src/
│   ├── pages/                  # Page Object Model — one class per screen (already 15 POMs)
│   │   ├── BasePage.ts         # goto(), waitForLoad(), common actions
│   │   ├── ContentTreePage.ts  # locators + actions for /content
│   │   ├── PageEditorPage.ts   # editField(), addComponent(), save(), publish()
│   │   └── …                   # DAM, PIM, Sites, Workflows, Preview, …
│   ├── flows/                  # reusable business flows (login, create+publish page)
│   ├── fixtures/
│   │   ├── live.fixture.ts     # NEW: mocks OFF, real backend, seed reset per suite
│   │   ├── api.ts              # typed API client for arrange/assert (backend truth)
│   │   └── data/…              # deterministic seed inputs
│   └── helpers/                # dnd, waits, api-assertions, image-check
└── tests/
    ├── api/                    # L2 — API functional per module
    ├── admin/                  # L3 — one spec per admin screen, tagged @UI-xxx
    ├── site/                   # L4 — demo-site render + journeys, tagged @TUT-xxx/@SDK-xxx
    └── visual/                 # L5 — snapshots per screen × viewport × theme
```

**Rules for the POM layer (Selenium best practices):**
- No raw selectors in specs — only Page Object methods and `data-testid` constants.
- Every action returns the POM (or the next POM) for chaining.
- Arrange state via the **API client** (fast, reliable), assert via **UI + API** (double-check).
- Tests are **independent and idempotent** — each seeds/cleans its own data with a `qa-*` prefix.

---

## 4. Test data management

- Deterministic seed via `scripts/seed_tut_usa_website.py` + a `--reset` path.
- A `live.fixture` `beforeAll` ensures the seed baseline; destructive tests use disposable
  `qa-test-*` nodes and clean up in `afterEach`.
- No test depends on another test's leftover state.

---

## 5. Reporting, CI & coverage gate

- **Reporters:** Playwright HTML report + JUnit XML (for CI) + trace-on-failure.
- **CI:** a stack-up job (Postgres/Redis/RabbitMQ/MinIO + Author + admin/site + seed) runs L2–L4
  live, plus `live_smoke.py`. Build fails on any failure or broken image.
- **Traceability:** a generated matrix maps each QA case ID → automated test(s); CI fails if a
  Critical case has no linked passing test. Target: **100% of Critical + High cases automated**.
- **Tagging:** `@smoke @regression @visual @a11y @<CASE-ID>` for selective runs.

---

## 6. Backlog (TF-xx tasks)

| TF | Scope |
|----|-------|
| TF-00 | Framework foundation: live fixture (mocks OFF), API client, POM base, config projects, reporting |
| TF-01 | L2 API functional suite — CMS/Author/Headless/GraphQL live |
| TF-02 | L3 UI POM buildout — POM + specs for all 18 admin screens (live) |
| TF-03 | L4 demo-site functional + render coverage (all 61 pages, SDK cases) |
| TF-04 | DAM + PIM full functional coverage (API + UI) |
| TF-05 | Workflow / replication / cache / CDN / search live coverage |
| TF-06 | Cross-cutting: security, error-handling, a11y (axe), CORS/rate-limit, perf smoke |
| TF-07 | L5 visual regression across screens × viewport (desktop/tablet/mobile) × theme, vs `Design/UI` refs |
| TF-08 | Reporting, CI stack-up gate, JUnit artifacts, tagging |
| TF-09 | Traceability matrix + coverage gate (QA case ID → test; fail CI on uncovered Critical/High) |

Dependencies: TF-00 → (TF-01, TF-02); TF-02 → (TF-03, TF-04, TF-05, TF-06, TF-07);
(TF-01, TF-02) → TF-08 → TF-09. TF-00 depends on **RT-00** (the live harness fix).

