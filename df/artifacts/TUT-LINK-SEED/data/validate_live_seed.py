#!/usr/bin/env python3
"""Reproducible live Author quality check for TUT-LINK-SEED evidence."""

from __future__ import annotations

import json
import os
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import requests

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPOSITORY_ROOT))

from scripts.seed_tut_usa_website import PAGES, build_seed_graph, validate_seed_graph

AUTHOR_API = os.environ.get("FLEXCMS_AUTHOR_API", "http://localhost:8080")
OUTPUT = Path(__file__).with_name("live-data-quality.json")


def fetch_inventory() -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    page = 0
    while True:
        response = requests.get(
            f"{AUTHOR_API}/api/author/content/list",
            params={"site": "tut-usa", "page": page, "size": 200},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        nodes.extend(payload["content"])
        if payload["last"]:
            return nodes
        page += 1


def expected_component_paths(parent: str, nodes: list[dict[str, Any]]) -> set[str]:
    paths: set[str] = set()
    for node in nodes:
        path = f"{parent}.{node['name']}"
        paths.add(path)
        paths.update(expected_component_paths(path, node.get("children", [])))
    return paths


def main() -> int:
    graph = build_seed_graph()
    graph_report = validate_seed_graph(graph)
    expected_paths = {"content.tut-usa"}
    for page in PAGES:
        page_path = "content." + page.path.replace("/", ".")
        expected_paths.add(page_path)
        expected_paths.update(expected_component_paths(page_path, graph.page_components[page.path]))
    expected_paths.update(
        {
            "content.experience-fragments.tut-usa.global.navigation.master.navigation",
            "content.experience-fragments.tut-usa.global.footer.master.footer",
        }
    )

    inventory = fetch_inventory()
    path_counts = Counter(node.get("path") for node in inventory)
    by_path = {node["path"]: node for node in inventory if node.get("path")}
    missing = sorted(expected_paths - set(by_path))
    duplicate_paths = sorted(path for path, count in path_counts.items() if path and count > 1)
    unpublished = sorted(path for path in expected_paths if path in by_path and by_path[path].get("status") != "PUBLISHED")
    null_required_fields = sorted(
        path
        for path in expected_paths
        if path in by_path
        and any(by_path[path].get(field) in (None, "") for field in ("path", "name", "resourceType", "status"))
    )
    pages_with_missing_properties = sorted(
        "content." + page.path.replace("/", ".")
        for page in PAGES
        if any(
            by_path.get("content." + page.path.replace("/", "."), {}).get("properties", {}).get(key) in (None, "")
            for key in ("jcr:title", "jcr:description", "template")
        )
    )

    navigation = by_path.get("content.experience-fragments.tut-usa.global.navigation.master.navigation", {}).get("properties", {})
    footer = by_path.get("content.experience-fragments.tut-usa.global.footer.master.footer", {}).get("properties", {})
    persisted_links = [
        *navigation.get("primaryLinks", []),
        *navigation.get("utilityLinks", []),
        navigation.get("accountEntry"),
        *[link for group in footer.get("footerLinkGroups", []) for link in group.get("links", [])],
        *footer.get("socialLinks", []),
        *footer.get("legalLinks", []),
    ]
    malformed_persisted_links = [
        value
        for value in persisted_links
        if not isinstance(value, dict) or not value.get("label") or not value.get("url")
    ]

    report = {
        "authorApi": AUTHOR_API,
        "inventoryNodeCount": len(inventory),
        "ownedExpectedNodeCount": len(expected_paths),
        "generatedPageCountIncludingRoot": graph_report.page_count,
        "generatedComponentCount": graph_report.component_count,
        "generatedLinkCountByType": graph_report.link_counts,
        "unresolvedInternalDestinations": graph_report.unresolved_internal_destinations,
        "missingOwnedPaths": missing,
        "duplicateInventoryPaths": duplicate_paths,
        "unpublishedOwnedPaths": unpublished,
        "nullRequiredFields": null_required_fields,
        "pagesWithMissingRequiredProperties": pages_with_missing_properties,
        "malformedPersistedV18Links": malformed_persisted_links,
    }
    failures = {key: value for key, value in report.items() if key in {
        "missingOwnedPaths",
        "duplicateInventoryPaths",
        "unpublishedOwnedPaths",
        "nullRequiredFields",
        "pagesWithMissingRequiredProperties",
        "malformedPersistedV18Links",
    } and value}
    report["result"] = "PASS" if not failures else "FAIL"
    OUTPUT.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["result"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())


