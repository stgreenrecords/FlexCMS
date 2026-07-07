from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMON_READ_FIRST = [
    "df/artifacts/REB-00/task.md",
    "df/artifacts/REB-00/solution-design.md",
    "docs/FLEXCMS_BUSINESS_CONTEXT.md",
    "docs/list-ofcomponents-tempaltes-and-page-trees.txt",
]

TASKS = [
    {
        "id": "REB-01",
        "priority": "P0",
        "lane": "designer",
        "title": "Normalize TUT design packages and approve storage map",
        "deps": ["REB-00"],
        "acs": [
            "Create `design/tut-usa/README.md` describing canonical storage for normalized templates, components, assets, fonts, manifests, and generated contracts.",
            "Inventory all template/component library folders and record whether each has `code.html`, `screen.png`, and source-reference notes.",
            "Copy/reference approved screenshots without mutating `Design/sample-website-tut/`.",
            "Document any missing design evidence or asset licensing risks in the task artifact.",
            "Hand off approved design package scope to DevOps for browser asset capture.",
        ],
    },
    {
        "id": "REB-02",
        "priority": "P0",
        "lane": "devops",
        "title": "Build Selenium browser asset-capture pipeline for remote template resources",
        "deps": ["REB-01"],
        "acs": [
            "Add a Selenium-based capture runner that opens every design `code.html` in a real browser.",
            "Capture image, font, CSS, and media URLs after network idle, font readiness, and scroll-triggered lazy loading.",
            "Download permitted static resources into `design/tut-usa/assets/` and write per-page `assets-manifest.json` files.",
            "Generate `normalized.html` files with local asset references and capture evidence screenshots.",
            "Record unavailable or disallowed resources as manifest blockers instead of silently ignoring them.",
        ],
    },
    {
        "id": "REB-03",
        "priority": "P0",
        "lane": "data-engineer",
        "title": "Reset existing TUT/demo seed data safely and create idempotent reseed plan",
        "deps": ["REB-01"],
        "acs": [
            "Create a reset plan that targets only deterministic TUT/demo paths, resource types, templates, component definitions, assets, and related seed records.",
            "Reset tooling requires an explicit confirmation flag and refuses unknown/production environments by default.",
            "Reseed process is idempotent and produces no duplicate content, assets, templates, or component definitions across repeated runs.",
            "Existing Flyway migration history is not rewritten.",
            "Record before/after row counts and rollback notes.",
        ],
    },
    {
        "id": "REB-04",
        "priority": "P0",
        "lane": "backend-dev",
        "title": "Generate component/template/page-tree contracts from inventory",
        "deps": ["REB-01"],
        "acs": [
            "Parse or transform the 406-component inventory into a validated `component-contracts.json` artifact.",
            "Generate `template-contracts.json` for all 21 TUT templates with required embedded and allowed optional components.",
            "Generate `page-tree.json` with URL path, content path, title, and template assignment.",
            "Define migration/import approach for `component_definitions` and `template_definitions` without violating Flyway version rules.",
            "Backend contract remains JSON-only and respects layer boundaries.",
        ],
    },
    {
        "id": "REB-05",
        "priority": "P0",
        "lane": "devops",
        "title": "Add Selenium framework foundation and reporting package",
        "deps": ["REB-00"],
        "acs": [
            "Create a new Selenium E2E package in the frontend pnpm workspace without deleting existing Playwright tests.",
            "Provide typed browser/session setup, environment config, waits, screenshots, and report helpers.",
            "Add local scripts for smoke, headed/debug, and CI runs.",
            "Emit JUnit-compatible reports and screenshot artifacts on failure.",
            "Document how to run the Selenium suite locally.",
        ],
    },
    {
        "id": "REB-06",
        "priority": "P1",
        "lane": "devops",
        "title": "Produce Selenium traceability matrix and generated test-case skeletons",
        "deps": ["REB-02", "REB-04", "REB-05"],
        "acs": [
            "Generate a traceability matrix mapping templates/components to Selenium cases and acceptance criteria.",
            "Create skeleton specs for all 21 templates and high-value component groups.",
            "Include broken image/font checks, console error checks, primary CTA checks, responsive breakpoint checks, and basic accessibility assertions where feasible.",
            "Store generated matrix under `design/tut-usa/generated/qa-traceability-matrix.csv` and task evidence under `df/artifacts/REB-06/devops/`.",
            "No generated test is marked passing without implementation evidence.",
        ],
    },
    {
        "id": "REB-07",
        "priority": "P1",
        "lane": "data-engineer",
        "title": "Import captured assets into DAM/public frontend asset pipeline",
        "deps": ["REB-02", "REB-03"],
        "acs": [
            "Import or copy captured assets from the canonical manifest into DAM and frontend public asset locations as appropriate.",
            "Write `dam-import-map.json` mapping local captured assets to DAM content URLs or public app URLs.",
            "Verify no seeded content references remote placeholders or missing assets.",
            "Record checksum/size evidence for imported assets.",
            "Provide rollback instructions for imported demo assets.",
        ],
    },
    {
        "id": "REB-08",
        "priority": "P1",
        "lane": "frontend-dev",
        "title": "Rebuild frontend tokens, fonts, layout shell, and renderer foundation",
        "deps": ["REB-01", "REB-04"],
        "acs": [
            "Implement design tokens and font loading from the approved design package without hardcoded colors.",
            "Update public-site shell/layout foundation for TUT rendering.",
            "Update SDK/React renderer contract only where required by generated component/template contracts.",
            "Preserve named exports and existing workspace conventions.",
            "Frontend build passes for affected packages.",
        ],
    },
    {
        "id": "REB-09",
        "priority": "P1",
        "lane": "frontend-dev",
        "title": "Implement TUT grouped component renderers",
        "deps": ["REB-08"],
        "acs": [
            "Implement renderers for prioritized grouped TUT components using generated component contracts.",
            "Handle optional/missing fields, empty lists, long copy, image fallbacks, and responsive behavior.",
            "Register renderers in the appropriate component map.",
            "Add unit/component-level tests where package patterns support them.",
            "No backend HTML rendering is introduced.",
        ],
    },
    {
        "id": "REB-10",
        "priority": "P1",
        "lane": "frontend-dev",
        "title": "Implement all 21 TUT page templates and page routes",
        "deps": ["REB-07", "REB-09"],
        "acs": [
            "Implement page layouts/routes for all 21 TUT template definitions.",
            "Consume headless JSON and seeded page tree rather than static hardcoded page bodies.",
            "Verify required embedded components render for every template.",
            "Validate desktop/tablet/mobile responsive behavior against design references.",
            "Frontend build passes and evidence is recorded.",
        ],
    },
    {
        "id": "REB-11",
        "priority": "P1",
        "lane": "frontend-dev",
        "title": "Reimplement admin authoring/editor flows for new components/templates",
        "deps": ["REB-04", "REB-08"],
        "acs": [
            "Admin UI supports authoring/editing the generated component fields and template assignments.",
            "Admin pages use `@flexcms/ui` for interactive controls and include breadcrumbs, loading skeletons, and empty states.",
            "Edit/save/preview flow works against real author API in local profile.",
            "Stable selectors needed by Selenium are added without leaking implementation details.",
            "Frontend build passes and evidence is recorded.",
        ],
    },
    {
        "id": "REB-12",
        "priority": "P1",
        "lane": "devops",
        "title": "Implement Selenium public-site template/component suites",
        "deps": ["REB-06", "REB-10"],
        "acs": [
            "Implement Selenium specs for all 21 public-site templates.",
            "Validate no broken images/fonts, required components, primary CTAs, console errors, and key responsive breakpoints.",
            "Attach screenshots and JUnit evidence to task artifacts.",
            "Tests run against the live local stack or explicitly documented stack-up environment.",
            "Failures produce actionable diagnostics.",
        ],
    },
    {
        "id": "REB-13",
        "priority": "P1",
        "lane": "devops",
        "title": "Implement Selenium admin authoring and round-trip suites",
        "deps": ["REB-06", "REB-11"],
        "acs": [
            "Implement Selenium specs for authoring/editing representative new components and templates.",
            "Verify edit persists through author API, headless response, and rendered frontend output where applicable.",
            "Cover asset selection/import references for at least one media-heavy template.",
            "Record screenshots, JUnit report, and exact environment details.",
            "Tests do not rely on Playwright-only helpers.",
        ],
    },
    {
        "id": "REB-14",
        "priority": "P2",
        "lane": "devops",
        "title": "Wire Selenium gates into CI/local validation and retain artifacts",
        "deps": ["REB-12", "REB-13"],
        "acs": [
            "Add local and CI commands for Selenium smoke and full suites.",
            "Publish JUnit, screenshots, and logs as artifacts.",
            "Document how Selenium coexists with or replaces legacy Playwright gates.",
            "Fail CI on critical Selenium failures and uncovered critical/high traceability rows.",
            "Factory validation documentation is updated.",
        ],
    },
    {
        "id": "REB-15",
        "priority": "P0",
        "lane": "qa",
        "title": "QA verification for full rebuild program",
        "deps": ["REB-14"],
        "acs": [
            "Independently run the required backend/frontend/Selenium validation gates.",
            "Verify seed reset/reseed evidence and absence of missing/broken images in seeded pages.",
            "Verify test traceability matrix covers all 21 templates and prioritized component groups.",
            "Record defects with reproduction steps or pass report with exact commands/environment.",
            "Move accepted work to PO review only when objective evidence passes.",
        ],
    },
    {
        "id": "REB-16",
        "priority": "P0",
        "lane": "po",
        "title": "PO acceptance for full rebuild program",
        "deps": ["REB-15"],
        "acs": [
            "Review QA pass evidence and compare delivered frontend against TUT business/design goals.",
            "Confirm seed reset/reseed behavior is acceptable for intended environments.",
            "Confirm Selenium coverage is sufficient for the rebuild program.",
            "Accept or reject with specific product reasons.",
            "If rejected, route rework to the responsible lane with evidence.",
        ],
    },
]

for task in TASKS:
    task_dir = ROOT / task["id"]
    task_dir.mkdir(parents=True, exist_ok=True)
    deps = "\n".join(f"- {dep}" for dep in task["deps"]) if task["deps"] else "- none"
    read_first = "\n".join(f"- `{path}`" for path in COMMON_READ_FIRST)
    acs = "\n".join(f"- AC{index}: {ac}" for index, ac in enumerate(task["acs"], start=1))
    content = f"""# {task['id']} — {task['title']}

## Summary

- Priority: {task['priority']}
- Owner role/lane: `{task['lane']}`
- Parent planning task: `REB-00`

## Goal

{task['title']}.

## Read first

{read_first}

## Dependencies

{deps}

## Acceptance criteria

{acs}

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
"""
    (task_dir / "task.md").write_text(content)

print(f"Generated {len(TASKS)} child task artifacts under {ROOT}")

