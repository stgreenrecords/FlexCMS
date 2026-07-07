#!/usr/bin/env python3
"""
live_smoke.py — FlexCMS live-stack verification probe (Tier T3/T5).

Unlike the mocked Playwright suite, this hits the REAL running services and seeded
database. It is the fast evidence gate for the retest plan (docs/RETEST_PLAN.md) and
directly reproduces the two reported failures:

  * "can't edit page dummy data"  -> page-edit round-trip check
  * "missing images on the demo website" -> image integrity check

Zero dependencies (Python 3 stdlib only). Prereq: `flex start local all` + seed.

Usage:
    python3 scripts/live_smoke.py --page content/tut-usa/home
    python3 scripts/live_smoke.py --page content/tut-usa/home --no-edit   # skip write test
    python3 scripts/live_smoke.py --author http://localhost:8080 \
        --site http://localhost:3001 --page content/tut-usa/home

Exit code is non-zero if ANY check fails, so it can gate CI.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import quote, urljoin

TIMEOUT = 15


class Report:
    def __init__(self) -> None:
        self.passed = 0
        self.failed = 0

    def ok(self, name: str, detail: str = "") -> None:
        self.passed += 1
        print(f"  \u2705 {name}" + (f"  — {detail}" if detail else ""))

    def fail(self, name: str, detail: str = "") -> None:
        self.failed += 1
        print(f"  \u274c {name}" + (f"  — {detail}" if detail else ""))

    def summary(self) -> int:
        print(f"\n  {self.passed} passed, {self.failed} failed")
        return 1 if self.failed else 0


def http(method: str, url: str, body: bytes | None = None, headers: dict | None = None):
    req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status, resp.read(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers)
    except Exception as e:  # noqa: BLE001 — surface any connectivity failure
        return None, str(e).encode(), {}


def get_json(url: str):
    status, raw, _ = http("GET", url)
    if status != 200:
        return status, None
    try:
        return status, json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        return status, None


# --------------------------------------------------------------------------- checks
def check_health(r: Report, author: str, publish: str | None, site: str | None) -> None:
    print("\n[health]")
    s, _, _ = http("GET", f"{author}/actuator/health")
    (r.ok if s == 200 else r.fail)("Author API health", f"HTTP {s}")
    if publish:
        s, _, _ = http("GET", f"{publish}/actuator/health")
        (r.ok if s == 200 else r.fail)("Publish API health", f"HTTP {s}")
    if site:
        s, _, _ = http("GET", site)
        (r.ok if s == 200 else r.fail)("Demo site up", f"HTTP {s}")


def check_registry(r: Report, author: str) -> None:
    print("\n[component registry]")
    status, data = get_json(f"{author}/api/content/v1/component-registry")
    if status != 200 or data is None:
        r.fail("component-registry reachable", f"HTTP {status}")
        return
    items = data if isinstance(data, list) else data.get("items") or data.get("components") or []
    tut = [c for c in items if json.dumps(c).find("tut-usa/") != -1]
    (r.ok if items else r.fail)("registry returns components", f"{len(items)} total")
    (r.ok if tut else r.fail)("tut-usa components registered", f"{len(tut)} tut-usa")


def check_page(r: Report, author: str, page_path: str):
    print("\n[headless page]")
    url = f"{author}/api/content/v1/pages/{page_path.lstrip('/')}"
    status, data = get_json(url)
    if status != 200 or data is None:
        r.fail("page resolves via headless API", f"HTTP {status} {url}")
        return None
    comps = data.get("components") if isinstance(data, dict) else None
    (r.ok if comps else r.fail)("page has a component tree", f"{len(comps or [])} components")
    return data


def check_edit_roundtrip(r: Report, author: str, page_path: str) -> None:
    """Reproduce 'can't edit page dummy data': GET props -> PUT sentinel -> GET confirms -> revert."""
    print("\n[page-edit round-trip]")
    ltree = "content." + page_path.strip("/").removeprefix("content/").replace("/", ".")
    node_url = f"{author}/api/author/content/node?path={quote(ltree)}"
    status, node = get_json(node_url)
    if status != 200 or not isinstance(node, dict):
        r.fail("read node properties", f"HTTP {status} {node_url}")
        return
    props = dict(node.get("properties") or {})
    original = props.get("jcr:title")
    sentinel = "SMOKE-EDIT-CHECK"
    props["jcr:title"] = sentinel

    payload = json.dumps({"path": ltree, "properties": props, "userId": "smoke"}).encode()
    hdr = {"Content-Type": "application/json"}
    s, raw, _ = http("PUT", f"{author}/api/author/content/node/properties", payload, hdr)
    if s not in (200, 204):
        r.fail("PUT node properties accepted", f"HTTP {s} {raw[:120].decode(errors='replace')}")
        return
    r.ok("PUT node properties accepted", f"HTTP {s}")

    # confirm persistence
    _, node2 = get_json(node_url)
    got = (node2 or {}).get("properties", {}).get("jcr:title") if isinstance(node2, dict) else None
    (r.ok if got == sentinel else r.fail)(
        "edit actually persisted", f"expected '{sentinel}', got '{got}'"
    )

    # revert to leave seed data clean
    props["jcr:title"] = original if original is not None else ""
    revert = json.dumps({"path": ltree, "properties": props, "userId": "smoke"}).encode()
    http("PUT", f"{author}/api/author/content/node/properties", revert, hdr)


IMG_SRC = re.compile(r"""<img[^>]+src=["']([^"']+)["']""", re.IGNORECASE)
BG_URL = re.compile(r"""url\((["']?)([^)"']+)\1\)""", re.IGNORECASE)


def check_images(r: Report, site: str, page_path: str) -> None:
    """Reproduce 'missing images': render the demo page, HEAD every image URL, fail on non-200."""
    print("\n[image integrity]")
    url_path = "/" + page_path.strip("/").removeprefix("content/")
    page_url = urljoin(site + "/", url_path.lstrip("/"))
    status, raw, _ = http("GET", page_url)
    if status != 200:
        r.fail("demo page renders", f"HTTP {status} {page_url}")
        return
    r.ok("demo page renders", page_url)
    html = raw.decode("utf-8", errors="replace")
    urls = set(IMG_SRC.findall(html)) | {m[1] for m in BG_URL.findall(html)}
    urls = {u for u in urls if not u.startswith("data:")}
    if not urls:
        r.fail("page references images", "0 <img>/background URLs found")
        return
    broken = []
    for u in sorted(urls):
        full = u if u.startswith("http") else urljoin(site + "/", u.lstrip("/"))
        s, _, _ = http("HEAD", full)
        if s is None or s >= 400:
            broken.append(f"{u} -> HTTP {s}")
    if broken:
        r.fail(f"all {len(urls)} images resolve", f"{len(broken)} broken: " + "; ".join(broken[:5]))
    else:
        r.ok(f"all {len(urls)} images resolve", "no broken images")


def main(argv: list[str]) -> int:
    p = argparse.ArgumentParser(description="FlexCMS live-stack smoke probe")
    p.add_argument("--author", default="http://localhost:8080")
    p.add_argument("--publish", default="http://localhost:8081")
    p.add_argument("--site", default="http://localhost:3001")
    p.add_argument("--page", default="content/tut-usa/home",
                   help="content path, e.g. content/tut-usa/home")
    p.add_argument("--no-edit", action="store_true", help="skip the write/round-trip check")
    p.add_argument("--no-images", action="store_true", help="skip the image integrity check")
    args = p.parse_args(argv)

    print("FlexCMS live smoke — real stack, no mocks")
    r = Report()
    check_health(r, args.author, args.publish, args.site)
    check_registry(r, args.author)
    check_page(r, args.author, args.page)
    if not args.no_edit:
        check_edit_roundtrip(r, args.author, args.page)
    if not args.no_images:
        check_images(r, args.site, args.page)
    return r.summary()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

