You are an autonomous FlexCMS engineer. Follow CLAUDE.md conventions strictly (layer separation, DTOs, no FetchType.EAGER, named exports, CSS tokens). Implement ONLY the assigned task and satisfy every acceptance criterion. Return file changes using this exact protocol: for each changed/created file emit a line '### FILE: <relative/path>' followed by a fenced code block containing the FULL new file contents. Do not include prose outside those blocks.

# Task RT-01 [P0]
Asset integrity — resolve the 152 missing images so the demo site has zero broken images

## Acceptance criteria
- Every asset in missing-assets.txt is either generated/uploaded to DAM OR mapped to an approved placeholder — none left dangling
- python3 scripts/live_smoke.py --page content/tut-usa/home --no-edit reports 0 broken images
- Repeat the image check for at least 5 representative pages (home, a vehicle detail, innovation, news, contact) — all images HTTP 200
- missing-assets.txt is reduced to 0 outstanding entries (or annotated with the placeholder used)
- Evidence (image-URL/status lists + screenshots) saved under docs/retest-runs/RT-01/

## Modules you may touch
scripts, flexcms-dam

## Context files

### docs/RETEST_PLAN.md
```
# FlexCMS — Retest & Verification Plan

> **Purpose:** Replace formal, box-ticking "testing" with **evidence-based verification against a
> live, seeded stack.** Every functional area is retested the way a real user exercises it, and
> nothing is marked done without a captured artifact proving it works.
>
> **Owner:** runs through the Agent Factory (`agents/FACTORY.md`). Each area below is a queued
> retest task (`RT-xx`) with evidence-based acceptance criteria.

---

## 1. Why the current results are untrustworthy (root cause)

| Symptom you saw | Root cause |
|---|---|
| "All tasks DONE" but can't edit page dummy data | The page-editor "save" test asserts against a **mocked** API that always returns `{"success":true}`. The real `PUT /api/author/content/node/properties` round-trip was never verified. |
| Missing images on the demo website | 152 assets are listed in `Design/sample-website-tut/missing-assets.txt` — **specified but never generated/uploaded**. Seeded pages reference DAM paths that 404. |
| Green E2E suite, broken product | **All 19 Playwright specs intercept `**/api/**`** and serve fixture JSON. Tests exercise the UI against fake data, never the backend/DB/seed. |
| "Live mode" doesn't help | `USE_LIVE_API` is only honored by the shared fixture; the 19 per-spec inline `page.route` blocks ignore it, so mocks are never actually turned off. |
| Formal ACs passed, feature absent | ACs were "component implemented / build passes", not "user action produces the expected observable outcome." |

**Principle going forward:** *A test that cannot fail when the feature is broken is not a test.*
Mocked-UI tests are kept only for fast component-rendering checks — they are **never** evidence that a
feature works end to end.

---

## 2. The verification pyramid (tiers)

Run bottom-up. A higher tier may not be marked green while a lower tier for the same area is red.

| Tier | What it proves | Runs against | Can be mocked? |
|---|---|---|---|
| **T0 Build** | It compiles / type-checks | — | n/a |
| **T1 Unit** | Logic in isolation | in-process | yes |
| **T2 Contract** | `component_definitions.data_schema` matches what each renderer reads | schema JSON + renderer props | fixtures ok |
| **T3 Live API/DB** | Real endpoints + real Postgres/seed behave per spec | **running Author/Publish + seeded DB** | **NO** |
| **T4 E2E journeys** | Real user flows in the browser, **no API mocks** | **Admin UI + live backend** | **NO** |
| **T5 Asset & render integrity** | Demo site renders every page; **every image resolves (HTTP 200)** | **site-nextjs + Author/DAM** | **NO** |
| **T6 Exploratory smoke** | Human sanity pass on the top journeys | full stack | no |

The quick automated gate for T3/T5 is `scripts/live_smoke.py` (see §5). It targets exactly the two
reported failures: page-edit round-trip and broken images.

---

## 3. Definition of Done (upgraded)

A retest task may only reach the factory `done` station when **all** of these hold:

1. The relevant tier(s) pass **against the live seeded stack** (not mocks).
2. **Evidence is attached** to the task (see §4) — no evidence, no pass.
3. Any defect found is filed as a new factory task in `ready` (bug-driven loop, §6) — not silently fixed and forgotten.
4. The reviewer at the `review` station **re-ran the evidence command themselves** (or replayed the trace) — a different person than the builder.

> "It builds" and "the mocked test is green" are **necessary but not sufficient**. They never close a retest task.

---

## 4. Evidence requirements (per tier)

Store evidence under `docs/retest-runs/<RT-id>/` and link it in the task's completion note.

| Tier | Required artifact |
|---|---|
| T3 Live API/DB | Saved request+response transcript (method, URL, status, key response fields) **and**, where state changes, a before/after `SELECT` from Postgres (via pgAdmin/`psql`). |
| T4 E2E journeys | Playwright **trace.zip** + screenshot, run with mocks OFF (`USE_LIVE_API=1`). The spec must fail if the backend is down. |
| T5 Asset/render | For each tested page: a screenshot **and** a list of every `<img>`/background URL with its HTTP status — all must be 200. |
| T6 Exploratory | Dated checklist (§7) with pass/fail + notes per journey. |

Evidence must show the **real value**, e.g. the edited title string appearing in the headless JSON,
not just a 200 status.

---

## 5. Automated live smoke (`scripts/live_smoke.py`)

A zero-dependency probe of the running stack. It is the fast T3/T5 gate and directly reproduces the
two reported bugs. Run after `flex start local all` + seeding:

```bash
python3 scripts/live_smoke.py --page content/tut-usa/home
```

It checks: service health; component-registry non-empty; a page returns a component tree;
**page-edit round-trip** (GET props → PUT a sentinel prop → GET confirms it persisted → revert);
and **image integrity** (fetch the rendered demo page, extract every image URL, HEAD each, fail on any non-200).
Exit code ≠ 0 on any failure. This should be wired into CI as a stack-up job and into
`factory.py validate` usage for retest tasks.

---

## 6. Bug-driven loop (how findings feed the factory)

1. A retest task at T3–T6 finds a real defect.
2. File it immediately: `flex agent add --id BUG-xx --title "…" --priority P0 --modules <mod> --station ready`
   with a reproduction (the failing evidence) in the description.
3. The retest task goes to `fail` → `rework` only if it cannot proceed; otherwise it stays open and
   lists the `BUG-xx` it spawned.
4. A worker fixes `BUG-xx`, attaches the now-passing evidence, and the reviewer replays it.
5. The retest task closes only when its area is green **and** every spawned `BUG-xx` is `done`.

---

## 7. Functional-area retest matrix

Each row is a queued `RT-xx` task. "Cases" reference the existing `docs/QA_TEST_PLAN.md` IDs so we
reuse the 430 documented cases instead of reinventing them — but they must be executed **live**, with
evidence, per §3–§4.

| RT | Area | Tier focus | Reuses QA cases | Directly targets |
|----|------|-----------|-----------------|------------------|
| **RT-00** | Live test harness — make `USE_LIVE_API` truly disable all mocks; add stack-up Playwright project | T4 infra | — | "green tests, broken product" |
| **RT-01** | Asset integrity — generate/upload (or placeholder) the 152 missing images; verify every DAM ref resolves | T5 | TUT-007→010, TUT-030, SDK-016 | **missing images** |
| **RT-02** | Page-edit round-trip — edit dummy data in the editor → persist → headless reflects → site renders | T3+T4 | UI-021→037, AUTH-017/018, HEAD-001 | **can't edit page data** |
| **RT-03** | Content/Author/Headless/GraphQL live API | T3 | CMS-*, AUTH-*, HEAD-*, GQL-* | data correctness |
| **RT-04** | Demo site end-to-end render — all 61 pages render with components + images | T5 | TUT-016→030, SDK-010→019 | broken demo site |
| **RT-05** | DAM + PIM live | T3+T4 | DAM-*, PIM-*, UI-038→079 | asset/product flows |
| **RT-06** | Workflow + replication + cache/CDN | T3 | WF-*, REP-*, CACHE-* | publish pipeline |
| **RT-07** | Admin UI journeys in LIVE mode (tree, DAM, PIM, sites, preview, workflows) | T4 | UI-001→105 | admin usability |
| **RT-08** | Evidence gate — wire `live_smoke.py` into CI (stack-up job) + factory validate usage | infra | Appendix D | prevent regression |

Dependencies: RT-00 unblocks RT-02/04/05/07; RT-01 unblocks RT-04; RT-08 after RT-00.

---

## 8. Execution order (recommended sprint)

1. **RT-00 + RT-01** (P0) — get a real test harness and stop the image bleed. Without these, everything else stays fake.
2. **RT-02** (P0) — prove the single most-reported flow (editing) works end to end.
3. **RT-03, RT-04** (P1) — data correctness + demo site render.
4. **RT-05, RT-06, RT-07** (P1) — remaining pillars and admin journeys.
5. **RT-08** (P2) — lock the gains into CI so this can't silently rot again.

Track all of it on the factory board: `flex agent status`.
```

## 9. What changes permanently

- **`validate` is no 
… (truncated)
```

### Design/sample-website-tut/missing-assets.txt
```
missing asset number 1 tut-usa-home-hero.jpg, content/tut-usa/home (Hero Banner), 1920x820, Front three-quarter hero scene showing the TUT lineup at sunrise on a modern coastal residence drive, polished concrete, warm gold light, premium understated luxury mood.
missing asset number 2 tut-usa-home-tut-s-card.jpg, content/tut-usa/home (Product Grid), 600x600, Premium studio image of TUT S, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 3 tut-usa-home-tut-x-card.jpg, content/tut-usa/home (Product Grid), 600x600, Premium studio image of TUT X, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 4 tut-usa-home-tut-eon-card.jpg, content/tut-usa/home (Product Grid), 600x600, Premium studio image of TUT Eon, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 5 tut-usa-vehicles-page-header.jpg, content/tut-usa/vehicles (Page Header), 1920x600, Wide cinematic banner for Vehicles, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.
missing asset number 6 tut-usa-vehicles-tut-s-card.jpg, content/tut-usa/vehicles (Product Grid), 600x600, Premium studio image of TUT S, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 7 tut-usa-vehicles-tut-e-card.jpg, content/tut-usa/vehicles (Product Grid), 600x600, Premium studio image of TUT E, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 8 tut-usa-vehicles-tut-x-card.jpg, content/tut-usa/vehicles (Product Grid), 600x600, Premium studio image of TUT X, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 9 tut-usa-vehicles-tut-q-card.jpg, content/tut-usa/vehicles (Product Grid), 600x600, Premium studio image of TUT Q, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 10 tut-usa-vehicles-tut-eon-card.jpg, content/tut-usa/vehicles (Product Grid), 600x600, Premium studio image of TUT Eon, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 11 tut-usa-vehicles-tut-s-compare.jpg, content/tut-usa/vehicles (Comparison Tool), 600x400, TUT S comparison image on a premium dealership forecourt with overcast editorial lighting.
missing asset number 12 tut-usa-vehicles-tut-e-compare.jpg, content/tut-usa/vehicles (Comparison Tool), 600x400, TUT E comparison image on a premium dealership forecourt with overcast editorial lighting.
missing asset number 13 tut-usa-vehicles-tut-x-compare.jpg, content/tut-usa/vehicles (Comparison Tool), 600x400, TUT X comparison image on a premium dealership forecourt with overcast editorial lighting.
missing asset number 14 tut-usa-vehicles-tut-q-compare.jpg, content/tut-usa/vehicles (Comparison Tool), 600x400, TUT Q comparison image on a premium dealership forecourt with overcast editorial lighting.
missing asset number 15 tut-usa-vehicles-tut-eon-compare.jpg, content/tut-usa/vehicles (Comparison Tool), 600x400, TUT Eon comparison image on a premium dealership forecourt with overcast editorial lighting.
missing asset number 16 tut-usa-innovation-page-header.jpg, content/tut-usa/innovation (Page Header), 1920x600, Wide cinematic banner for Innovation, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.
missing asset number 17 tut-usa-news-and-updates-page-header.jpg, content/tut-usa/news-and-updates (Page Header), 1920x600, Wide cinematic banner for News & Updates, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.
missing asset number 18 tut-usa-owners-page-header.jpg, content/tut-usa/owners (Page Header), 1920x600, Wide cinematic banner for Owners, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.
missing asset number 19 tut-usa-owners-concierge.jpg, content/tut-usa/owners (Contact Card), 80x80, Portrait of a professional luxury automotive concierge, studio headshot, warm neutral background, approachable premium service tone.
missing asset number 20 tut-usa-offers-and-finance-page-header.jpg, content/tut-usa/offers-and-finance (Page Header), 1920x600, Wide cinematic banner for Offers & Finance, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.
missing asset number 21 tut-usa-accessories-page-header.jpg, content/tut-usa/accessories (Page Header), 1920x600, Wide cinematic banner for Accessories, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.
missing asset number 22 tut-usa-accessories-item-1.jpg, content/tut-usa/accessories (Product Grid), 600x600, Luxury accessory still-life for Performance charging cable set, premium studio product photography, soft directional light.
missing asset number 23 tut-usa-accessories-item-2.jpg, content/tut-usa/accessories (Product Grid), 600x600, Luxury accessory still-life for All-weather floor collection, tactile materials, premium neutral backdrop.
missing asset number 24 tut-usa-accessories-item-3.jpg, content/tut-usa/accessories (Product Grid), 600x600, Luxury accessory still-life for Signature travel luggage, refined brand styling, high-end retail photography.
missing asset number 25 tut-usa-learn-page-header.jpg, content/tut-usa/learn (Page Header), 1920x600, Wide cinematic banner for Learn, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.
missing asset number 26 tut-usa-contact-and-concierge-page-header.jpg, content/tut-usa/contact-and-concierge (Page Header), 1920x600, Wide cinematic banner for Contact & Concierge, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.
missing asset number 27 tut-usa-contact-and-concierge-concierge.jpg, content/tut-usa/contact-and-concierge (Contact Card), 80x80, Portrait of a luxury brand concierge specialist, studio headshot, tailored attire, confident and welcoming expression.
missing asset number 28 tut-usa-vehicles-vehicle-lineup-page-header.jpg, content/tut-usa/vehicles/vehicle-lineup (Page Header), 1920x600, Wide cinematic banner for Vehicle Lineup, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.
missing asset number 29 tut-usa-vehicles-vehicle-lineup-tut-s-card.jpg, content/tut-usa/vehicles/vehicle-lineup (Product Grid), 600x600, Premium studio image of TUT S, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 30 tut-usa-vehicles-vehicle-lineup-tut-e-card.jpg, content/tut-usa/vehicles/vehicle-lineup (Product Grid), 600x600, Premium studio image of TUT E, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 31 tut-usa-vehicles-vehicle-lineup-tut-x-card.jpg, content/tut-usa/vehicles/vehicle-lineup (Product Grid), 600x600, Premium studio image of TUT X, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 32 tut-usa-vehicles-vehicle-lineup-tut-q-card.jpg, content/tut-usa/vehicles/vehicle-lineup (Product Grid), 600x600, Premium studio image of TUT Q, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography.
missing asset number 33 tut-usa-vehicles-vehicle-lineup-tut-eon-card.jpg, content/tut-us
… (truncated)
```

### scripts/import_tut_usa_assets.py
```
#!/usr/bin/env python3
"""Upload provided TUT USA assets into DAM and rewrite seeded content references."""

from __future__ import annotations

import json
import mimetypes
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

AUTHOR_API = os.environ.get("FLEXCMS_AUTHOR_API", "http://localhost:8080")
USER_ID = "admin"
SITE_ID = "tut-usa"
MISSING_ASSETS_DIR = Path(__file__).resolve().parent.parent / "Design" / "missing-assets"
MISSING_ASSETS_LOG = Path(__file__).resolve().parent.parent / "Design" / "sample-website-tut" / "missing-assets.txt"
DAM_FOLDER = "content/dam/tut-usa"
PLACEHOLDER_PREFIX = "/dam/tut-usa/missing/"


@dataclass(frozen=True)
class AssetRecord:
    number: int
    expected_name: str
    page_path: str
    component_name: str
    resolution: str
    description: str


def api_request(method: str, path: str, **kwargs: Any) -> requests.Response:
    response = requests.request(method, f"{AUTHOR_API}{path}", timeout=60, **kwargs)
    if not response.ok:
        raise RuntimeError(f"{method} {path} failed with {response.status_code}: {response.text[:400]}")
    return response


def verify_author_reachable() -> None:
    try:
        api_request("GET", "/actuator/health")
    except Exception as exc:
        raise RuntimeError("Author API is not reachable. Start the local author app before importing assets.") from exc


def parse_missing_assets_log() -> dict[int, AssetRecord]:
    records: dict[int, AssetRecord] = {}
    line_re = re.compile(
        r"^missing asset number (?P<number>\d+) (?P<name>[^,]+), (?P<page>.+?) \((?P<component>.+?)\), (?P<resolution>[^,]+), (?P<description>.+)$"
    )
    for raw_line in MISSING_ASSETS_LOG.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        match = line_re.match(line)
        if not match:
            raise RuntimeError(f"Unable to parse missing-assets entry: {line}")
        number = int(match.group("number"))
        records[number] = AssetRecord(
            number=number,
            expected_name=match.group("name"),
            page_path=match.group("page"),
            component_name=match.group("component"),
            resolution=match.group("resolution"),
            description=match.group("description"),
        )
    return records


def discover_source_files() -> dict[int, Path]:
    files: dict[int, Path] = {}
    pattern = re.compile(r"^missing asset number (\d+) (.+)$")
    for path in sorted(MISSING_ASSETS_DIR.iterdir()):
        if not path.is_file():
            continue
        match = pattern.match(path.stem)
        if not match:
            continue
        number = int(match.group(1))
        files[number] = path
    return files


def upload_asset(source_path: Path, asset_name: str) -> str:
    asset_path = f"{DAM_FOLDER}/{asset_name}"
    delete_response = requests.delete(
        f"{AUTHOR_API}/api/author/assets",
        params={"path": asset_path},
        timeout=60,
    )
    if delete_response.status_code not in (200, 404):
        raise RuntimeError(f"DELETE asset {asset_path} failed with {delete_response.status_code}: {delete_response.text[:300]}")

    mime_type = mimetypes.guess_type(source_path.name)[0] or "application/octet-stream"
    with source_path.open("rb") as handle:
        response = requests.post(
            f"{AUTHOR_API}/api/author/assets",
            params={"path": asset_path, "siteId": SITE_ID, "userId": USER_ID},
            files={"file": (asset_name, handle, mime_type)},
            timeout=120,
        )
    if not response.ok:
        raise RuntimeError(f"Upload asset {asset_path} failed with {response.status_code}: {response.text[:300]}")
    asset = response.json()
    return f"/api/author/assets/{asset['id']}/content"


def replace_placeholders(value: Any, url_by_placeholder: dict[str, str]) -> tuple[Any, bool]:
    changed = False
    if isinstance(value, str):
        replacement = url_by_placeholder.get(value)
        if replacement is not None:
            return replacement, True
        return value, False
    if isinstance(value, list):
        updated_items = []
        for item in value:
            updated, item_changed = replace_placeholders(item, url_by_placeholder)
            changed = changed or item_changed
            updated_items.append(updated)
        return updated_items, changed
    if isinstance(value, dict):
        updated_map: dict[str, Any] = {}
        for key, item in value.items():
            updated, item_changed = replace_placeholders(item, url_by_placeholder)
            changed = changed or item_changed
            updated_map[key] = updated
        return updated_map, changed
    return value, False


def update_node_properties(node_path: str, properties: dict[str, Any]) -> None:
    api_request(
        "PUT",
        "/api/author/content/node/properties",
        json={"path": node_path, "properties": properties, "userId": USER_ID},
        headers={"Content-Type": "application/json"},
    )


def publish_path(path: str) -> None:
    api_request("POST", "/api/author/content/node/status", params={"path": path, "status": "PUBLISHED", "userId": USER_ID})


def walk_and_update(node: dict[str, Any], url_by_placeholder: dict[str, str], updated_nodes: list[str]) -> None:
    properties = node.get("properties") or {}
    updated_properties, changed = replace_placeholders(properties, url_by_placeholder)
    if changed:
        node_path = node["path"].replace(".", "/").replace("content/", "", 1)
        update_node_properties(node_path, updated_properties)
        updated_nodes.append(node_path)
    for child in node.get("children", []):
        walk_and_update(child, url_by_placeholder, updated_nodes)


def page_tree(path: str) -> dict[str, Any]:
    return api_request("GET", "/api/author/content/page", params={"path": path}).json()


def main() -> int:
    print("=== TUT USA asset importer ===")
    verify_author_reachable()

    records = parse_missing_assets_log()
    source_files = discover_source_files()
    if len(records) != len(source_files):
        raise RuntimeError(f"Mismatch between missing-assets log ({len(records)}) and provided files ({len(source_files)})")

    url_by_placeholder: dict[str, str] = {}
    for number, record in sorted(records.items()):
        source_path = source_files.get(number)
        if source_path is None:
            raise RuntimeError(f"Missing source file for asset number {number}")
        asset_url = upload_asset(source_path, record.expected_name)
        url_by_placeholder[f"{PLACEHOLDER_PREFIX}{record.expected_name}"] = asset_url

    updated_nodes: list[str] = []
    for root in ["tut-usa", "experience-fragments/tut-usa/global/navigation/master", "experience-fragments/tut-usa/global/footer/master"]:
        walk_and_update(page_tree(root), url_by_placeholder, updated_nodes)

    for node_path in updated_nodes:
        publish_path(node_path)

    print(f"Uploaded {len(url_by_placeholder)} assets into DAM.")
    print(f"Updated {len(updated_nodes)} content/XF nodes with real DAM URLs.")
    sample = {
        placeholder: asset_url
        for placeholder, asset_url in list(url_by_placeholder.items())[:3]
    }
    print(json.dumps(sample, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # pragma: no cover - CLI path
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)

```

## Omitted context files
- scripts/seed_tut_usa_website.py (omitted: max_read_first_files)