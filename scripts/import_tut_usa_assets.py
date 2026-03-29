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
