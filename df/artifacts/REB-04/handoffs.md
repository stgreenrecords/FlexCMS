# REB-04 handoffs

## 2026-07-07 local — backend-dev to qa

- Task: `REB-04`
- Current state: `READY_FOR_QA`
- Previous role result: generated canonical TUT component, template, page-tree, and static asset inventory artifacts from approved source inputs.
- Files changed or created:
  - `scripts/generate_tut_contract_artifacts.py`
  - `Design/tut-usa/generated/component-contracts.json`
  - `Design/tut-usa/generated/template-contracts.json`
  - `Design/tut-usa/generated/page-tree.json`
  - `Design/tut-usa/generated/static-asset-url-inventory.json`
  - `Design/tut-usa/generated/asset-download-plan.md`
  - `df/artifacts/REB-04/backend/summary.md`
- Checks performed:
  - `python3 scripts/generate_tut_contract_artifacts.py --check` — PASS (`components=406 templates=20 pages=61 static_assets=103`).
  - `python3 scripts/generate_tut_contract_artifacts.py` — PASS, generated outputs.
  - Python JSON quality check — PASS: counts, unique URL paths/content paths, template references.
  - `python3 -m py_compile scripts/generate_tut_contract_artifacts.py` — PASS.
  - IDE error check on `scripts/generate_tut_contract_artifacts.py` — PASS, no errors found.
- Known risks:
  - `brand-story-about-tut-page` is a valid template contract but intentionally has no page in `page-tree.json` because the approved page tree does not assign it.
  - `tut_sovereign` source folders contain `DESIGN.md` only and no executable `code.html`; they were intentionally excluded from generated page/template contracts.
  - Static asset URL inventory is source-backed but not final browser capture; `REB-02` must supersede it with Selenium network capture before runtime/DAM import.
- Next role instructions:
  - QA should verify generated JSON structure, counts, and source traceability against `V16`, `V17`, `scripts/seed_tut_usa_website.py`, and `Design/sample-website-tut/template-libs/`.
  - If QA passes, route to PO for acceptance of REB-04 only.
  - Downstream DevOps/Data should use `Design/tut-usa/generated/asset-download-plan.md` and `static-asset-url-inventory.json` as input, but browser/Selenium capture remains authoritative for actual asset downloads.


