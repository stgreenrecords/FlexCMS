#!/usr/bin/env python3
"""Publish every seeded TUT USA page to the publish environment (REB-19).

`seed_tut_usa_website.py` creates content on the author instance only. Nothing in
the local bring-up path replicates it, so on a fresh database every
publish-environment check fails with `500` or "author has N components but publish
has 0" even though the author side is correct.

This script closes that gap. It walks the author content tree, bulk-publishes each
page, and verifies the result on the publish delivery API.

Bulk publish is used deliberately: `POST /api/author/content/bulk/publish`
triggers `replicationAgent.replicateTree()` for `flexcms/page` and
`flexcms/site-root` nodes, whereas `POST /api/author/content/node/status` only
changes status and never replicates.

Usage:
    python scripts/publish_tut_usa_site.py
    python scripts/publish_tut_usa_site.py --verify-only
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from typing import Any

import requests

AUTHOR_API = os.environ.get("FLEXCMS_AUTHOR_API", "http://localhost:8080")
PUBLISH_API = os.environ.get("FLEXCMS_PUBLISH_API", "http://localhost:8081")
USER_ID = "admin"
SITE_ID = "tut-usa"
ROOT_LTREE = f"content.{SITE_ID}"
PAGE_RESOURCE_TYPES = {"flexcms/page", "flexcms/site-root"}
BATCH_SIZE = 25
REQUEST_TIMEOUT = 60


def author_children(ltree_path: str) -> list[dict[str, Any]]:
    response = requests.get(
        f"{AUTHOR_API}/api/author/content/children",
        params={"path": ltree_path},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    payload = response.json()
    return payload if isinstance(payload, list) else []


def discover_page_paths() -> list[str]:
    """Every page-like node under the site root, root included, breadth first."""
    discovered: list[str] = [ROOT_LTREE]
    seen: set[str] = {ROOT_LTREE}
    queue: list[str] = [ROOT_LTREE]

    while queue:
        current = queue.pop(0)
        for child in author_children(current):
            path = child.get("path")
            if not path or path in seen:
                continue
            seen.add(path)
            queue.append(path)
            if child.get("resourceType") in PAGE_RESOURCE_TYPES:
                discovered.append(path)

    return discovered


def bulk_publish(paths: list[str]) -> dict[str, Any]:
    response = requests.post(
        f"{AUTHOR_API}/api/author/content/bulk/publish",
        json={"paths": paths, "userId": USER_ID},
        timeout=REQUEST_TIMEOUT * 4,
    )
    response.raise_for_status()
    return response.json()


def to_url_path(ltree_path: str) -> str:
    return "/" + ltree_path.replace("content.", "", 1).replace(".", "/")


def publish_component_count(url_path: str) -> int | None:
    """Component count on the publish instance, or None when it is not served."""
    response = requests.get(
        f"{PUBLISH_API}/api/content/v1/pages{url_path}",
        headers={
            "Accept": "application/json",
            "X-FlexCMS-Site": SITE_ID,
            "X-FlexCMS-Locale": "en",
        },
        timeout=REQUEST_TIMEOUT,
    )
    if not response.ok:
        return None
    return len(response.json().get("components") or [])


def author_component_count(ltree_path: str) -> int:
    return len([child for child in author_children(ltree_path) if child.get("resourceType") not in PAGE_RESOURCE_TYPES])


def verify(paths: list[str], timeout_seconds: int) -> tuple[int, list[str]]:
    """Polls until every page is visible on publish, or the timeout expires.

    Replication is asynchronous (author -> RabbitMQ -> publish), and larger
    section pages routinely need more than a few seconds, so a single sleep
    produces false failures.
    """
    pending = list(paths)
    problems: dict[str, str] = {}
    deadline = time.monotonic() + timeout_seconds

    while True:
        still_pending: list[str] = []

        for ltree_path in pending:
            url_path = to_url_path(ltree_path)
            published = publish_component_count(url_path)

            if published is None:
                problems[url_path] = f"{url_path}: not served by the publish instance"
                still_pending.append(ltree_path)
                continue

            expected = author_component_count(ltree_path)
            if expected > 0 and published == 0:
                problems[url_path] = f"{url_path}: author has {expected} components but publish has 0"
                still_pending.append(ltree_path)
                continue

            problems.pop(url_path, None)

        pending = still_pending
        if not pending or time.monotonic() >= deadline:
            break

        print(f"  waiting for replication of {len(pending)} page(s)...")
        time.sleep(3)

    return len(paths) - len(pending), sorted(problems.values())


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish the seeded TUT USA site to the publish environment.")
    parser.add_argument("--verify-only", action="store_true", help="Check publish visibility without publishing.")
    parser.add_argument(
        "--verify-timeout-seconds",
        type=int,
        default=120,
        help="How long to poll the publish instance for asynchronous replication to land.",
    )
    args = parser.parse_args()

    try:
        paths = discover_page_paths()
    except requests.RequestException as error:
        print(f"ERROR: could not read the author content tree: {error}", file=sys.stderr)
        return 1

    if not paths:
        print("ERROR: no TUT USA pages found; run scripts/seed_tut_usa_website.py first.", file=sys.stderr)
        return 1

    print(f"Discovered {len(paths)} page nodes under {ROOT_LTREE}.")

    if not args.verify_only:
        succeeded = 0
        failed = 0
        for start in range(0, len(paths), BATCH_SIZE):
            batch = paths[start : start + BATCH_SIZE]
            try:
                result = bulk_publish(batch)
            except requests.RequestException as error:
                print(f"ERROR: bulk publish failed for batch starting at {start}: {error}", file=sys.stderr)
                return 1
            succeeded += int(result.get("succeeded") or 0)
            failed += int(result.get("failed") or 0)
            for message in result.get("errors") or []:
                print(f"  publish error: {message}", file=sys.stderr)
        print(f"Bulk publish complete: succeeded={succeeded}, failed={failed}.")

    verified, problems = verify(paths, args.verify_timeout_seconds)
    print(f"Verified {verified}/{len(paths)} pages on {PUBLISH_API}.")

    if problems:
        print(f"{len(problems)} page(s) are not correctly published:", file=sys.stderr)
        for problem in problems:
            print(f"  - {problem}", file=sys.stderr)
        return 1

    print("All discovered TUT USA pages are published and visible on the publish environment.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
