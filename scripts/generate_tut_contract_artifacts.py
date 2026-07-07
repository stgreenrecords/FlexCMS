#!/usr/bin/env python3
"""Generate TUT USA contract artifacts from approved repository sources.

Inputs are intentionally read-only:
- Flyway component definitions (V16)
- Flyway page template definitions (V17)
- TUT page specs in scripts/seed_tut_usa_website.py
- Raw template HTML under Design/sample-website-tut/template-libs

Outputs are written under design/tut-usa/generated/ so downstream frontend,
data, DevOps, QA, and PO roles can consume one canonical, auditable source.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
import re
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
COMPONENT_SQL = ROOT / "flexcms/flexcms-app/src/main/resources/db/migration/V16__tut_usa_component_definitions.sql"
TEMPLATE_SQL = ROOT / "flexcms/flexcms-app/src/main/resources/db/migration/V17__tut_usa_page_templates.sql"
SEED_SCRIPT = ROOT / "scripts/seed_tut_usa_website.py"
TEMPLATE_LIB = ROOT / "Design/sample-website-tut/template-libs"
OUTPUT_DIR = ROOT / "Design/tut-usa/generated"

COMPONENT_PATTERN = re.compile(
    r"\(uuid_generate_v4\(\),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(TRUE|FALSE),\s*TRUE,\s*\n?\s*'(.+?)'::jsonb,\s*'\{\}'::jsonb\)(?=,|\s*;)",
    re.S,
)
TEMPLATE_PATTERN = re.compile(
    r"\(\s*uuid_generate_v4\(\),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'(.+?)'::jsonb,\s*NULL,\s*'(.+?)'::jsonb,\s*ARRAY\['tut-usa'\]::text\[\],\s*TRUE\s*\)(?=,|\s+ON CONFLICT|;)",
    re.S,
)
PAGE_SPEC_PATTERN = re.compile(r"PageSpec\((.*?)\)(?:,|\n\])", re.S)

TEMPLATE_SOURCE_ALIASES = {
    "contact-concierge-support-page": "contact_concierge_page",
}


@dataclass(frozen=True)
class PageSpec:
    path: str
    title: str
    template: str
    description: str
    kind: str
    meta: dict[str, Any]


class StaticAssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for attr, value in attrs:
            if value and attr in {"src", "href", "data-src", "poster"} and (value.startswith("http") or value.startswith("//")):
                normalized_url = value if value.startswith("http") else f"https:{value}"
                parsed = urlparse(normalized_url)
                self.assets.append(
                    {
                        "tag": tag,
                        "attribute": attr,
                        "url": normalized_url,
                        "host": parsed.netloc,
                        "path": parsed.path,
                    }
                )


def slug_to_source_folder(template_name: str) -> str:
    return TEMPLATE_SOURCE_ALIASES.get(template_name, template_name.replace("-", "_"))


def to_content_path(url_path: str) -> str:
    return "content." + url_path.strip("/").replace("/", ".")


def field_summary(schema: dict[str, Any]) -> list[dict[str, Any]]:
    properties = schema.get("properties", {})
    return [
        {
            "name": name,
            "type": definition.get("type", "object"),
            "format": definition.get("format"),
            "isAsset": bool(definition.get("x-asset")),
            "isRichText": bool(definition.get("x-rich-text")),
            "isReference": bool(definition.get("x-reference")),
            "enum": definition.get("enum", []),
        }
        for name, definition in sorted(properties.items())
    ]


def read_components() -> list[dict[str, Any]]:
    sql = COMPONENT_SQL.read_text()
    components: list[dict[str, Any]] = []
    for index, match in enumerate(COMPONENT_PATTERN.finditer(sql), start=1):
        schema = json.loads(match.group(6))
        components.append(
            {
                "index": index,
                "resourceType": match.group(1),
                "name": match.group(2),
                "title": match.group(3),
                "groupName": match.group(4),
                "isContainer": match.group(5) == "TRUE",
                "active": True,
                "dataSchema": schema,
                "fields": field_summary(schema),
                "source": str(COMPONENT_SQL.relative_to(ROOT)),
            }
        )
    return components


def read_templates() -> list[dict[str, Any]]:
    sql = TEMPLATE_SQL.read_text()
    templates: list[dict[str, Any]] = []
    for index, match in enumerate(TEMPLATE_PATTERN.finditer(sql), start=1):
        structure = json.loads(match.group(5))
        page_properties = json.loads(match.group(6))
        source_folder = slug_to_source_folder(match.group(1))
        code_path = TEMPLATE_LIB / source_folder / "code.html"
        screen_path = TEMPLATE_LIB / source_folder / "screen.png"
        templates.append(
            {
                "index": index,
                "name": match.group(1),
                "title": match.group(2),
                "description": match.group(3),
                "resourceType": match.group(4),
                "structure": structure,
                "embeddedComponents": structure.get("embeddedComponents", []),
                "allowedComponents": structure.get("allowedComponents", []),
                "embeddedComponentTypes": structure.get("embeddedComponentTypes", []),
                "allowedComponentTypes": structure.get("allowedComponentTypes", []),
                "pageProperties": page_properties,
                "allowedSites": ["tut-usa"],
                "active": True,
                "source": str(TEMPLATE_SQL.relative_to(ROOT)),
                "templateSource": {
                    "folder": str((TEMPLATE_LIB / source_folder).relative_to(ROOT)),
                    "codeHtml": str(code_path.relative_to(ROOT)) if code_path.exists() else None,
                    "screenPng": str(screen_path.relative_to(ROOT)) if screen_path.exists() else None,
                    "hasCodeHtml": code_path.exists(),
                    "hasScreenPng": screen_path.exists(),
                },
            }
        )
    return templates


def read_page_specs() -> list[PageSpec]:
    source = SEED_SCRIPT.read_text()
    pages_block_match = re.search(r"PAGES: list\[PageSpec\] = \[(.*?)\]\n\nPAGE_INDEX", source, re.S)
    if not pages_block_match:
        raise ValueError("Could not locate canonical PAGES list in seed_tut_usa_website.py")
    pages_block = pages_block_match.group(1)
    pages: list[PageSpec] = [
        PageSpec(
            "tut-usa",
            "TUT USA Website Root",
            "global-home-page",
            "US market root for all public TUT brand, vehicle, innovation, ownership, commerce-support, and help content.",
            "home",
            {},
        )
    ]
    for line in pages_block.splitlines():
        stripped = line.strip()
        if not stripped.startswith("PageSpec("):
            continue
        entry = stripped.removesuffix(",")
        values = ast.literal_eval(entry.replace("PageSpec", "", 1))
        meta = values[5] if len(values) > 5 else {}
        pages.append(PageSpec(values[0], values[1], values[2], values[3], values[4], meta))
    return pages


def build_page_tree(pages: list[PageSpec], template_lookup: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for index, page in enumerate(pages, start=1):
        template = template_lookup[page.template]
        result.append(
            {
                "index": index,
                "title": page.title,
                "urlPath": f"/{page.path}",
                "contentPath": to_content_path(page.path),
                "template": page.template,
                "templateTitle": template["title"],
                "kind": page.kind,
                "description": page.description,
                "meta": page.meta,
                "requiredSeedComponents": template["embeddedComponentTypes"],
                "optionalComponentTypes": template["allowedComponentTypes"],
                "parentUrlPath": parent_url_path(page.path),
                "source": str(SEED_SCRIPT.relative_to(ROOT)),
            }
        )
    return result


def parent_url_path(path: str) -> str | None:
    parts = path.split("/")
    if len(parts) <= 1:
        return None
    return "/" + "/".join(parts[:-1])


def read_static_asset_inventory() -> dict[str, Any]:
    templates: dict[str, Any] = {}
    unique: dict[str, dict[str, Any]] = {}
    for code_path in sorted(TEMPLATE_LIB.glob("*/code.html")):
        parser = StaticAssetParser()
        parser.feed(code_path.read_text(errors="ignore"))
        seen_page_urls: set[str] = set()
        page_assets: list[dict[str, Any]] = []
        for asset in parser.assets:
            url = asset["url"]
            digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
            asset_with_id = {"id": digest, **asset}
            if url not in seen_page_urls:
                page_assets.append(asset_with_id)
                seen_page_urls.add(url)
            unique.setdefault(url, asset_with_id)
        templates[code_path.parent.name] = {
            "source": str(code_path.relative_to(ROOT)),
            "assetCount": len(page_assets),
            "assets": page_assets,
        }
    return {
        "generatedFrom": str(TEMPLATE_LIB.relative_to(ROOT)),
        "captureMode": "static-html-inventory; Selenium/browser capture must supersede this for lazy/runtime assets",
        "uniqueAssetCount": len(unique),
        "templateCount": len(templates),
        "uniqueAssets": sorted(unique.values(), key=lambda item: item["url"]),
        "templates": templates,
    }


def validate(
    components: list[dict[str, Any]],
    templates: list[dict[str, Any]],
    pages: list[dict[str, Any]],
) -> list[str]:
    errors: list[str] = []
    if len(components) != 406:
        errors.append(f"Expected 406 components from V16, found {len(components)}")
    if len(templates) != 20:
        errors.append(f"Expected 20 template definition rows from V17, found {len(templates)}")
    if len(pages) != 61:
        errors.append(f"Expected 61 TUT USA pages from seed PageSpec list, found {len(pages)}")

    component_types = {component["resourceType"] for component in components}
    template_names = {template["name"] for template in templates}
    for template in templates:
        missing = sorted(
            component_type
            for component_type in template["embeddedComponentTypes"] + template["allowedComponentTypes"]
            if component_type not in component_types
        )
        if missing:
            errors.append(f"Template {template['name']} references unknown component types: {', '.join(missing)}")
        if not template["templateSource"]["hasCodeHtml"]:
            errors.append(f"Template {template['name']} is missing code.html source")
        if not template["templateSource"]["hasScreenPng"]:
            errors.append(f"Template {template['name']} is missing screen.png source")
    for page in pages:
        if page["template"] not in template_names:
            errors.append(f"Page {page['urlPath']} references unknown template {page['template']}")
    return errors


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")


def write_asset_download_plan(path: Path, inventory: dict[str, Any]) -> None:
    path.write_text(
        "\n".join(
            [
                "# TUT USA asset download and storage plan",
                "",
                "## Source-backed static inventory",
                "",
                f"- Template HTML files scanned: {inventory['templateCount']}",
                f"- Unique direct remote URLs found: {inventory['uniqueAssetCount']}",
                "- Static inventory file: `Design/tut-usa/generated/static-asset-url-inventory.json`",
                "",
                "## Required download approach",
                "",
                "1. Treat `Design/sample-website-tut/` as immutable source evidence.",
                "2. Use Selenium/Chromium to open each template `code.html` in `Design/sample-website-tut/template-libs/*/`.",
                "3. Wait for network idle, `document.fonts.ready`, and full-page scroll completion to reveal lazy-loaded resources.",
                "4. Capture network requests for `image`, `font`, `stylesheet`, and media resource types. Skip remote scripts for runtime use; keep script URLs only as provenance/blocker evidence.",
                "5. Download permitted static resources into `Design/tut-usa/assets/{images,fonts,media,styles}/` using a content hash plus a readable slug.",
                "6. Write one `assets-manifest.json` per template under `Design/tut-usa/templates/{template-slug}/` with source URL, local path, content type, checksum, byte size, status, and license/provenance notes.",
                "7. Rewrite browser-normalized HTML to `Design/tut-usa/templates/{template-slug}/normalized.html` with local relative asset references.",
                "8. Copy or publish runtime-safe assets from the canonical manifest to `frontend/apps/site-nextjs/public/tut-usa/` or import them into DAM with a generated DAM URL map.",
                "9. Record unavailable, disallowed, or license-unclear resources as manifest blockers instead of silently replacing them.",
                "",
                "## Storage convention",
                "",
                "```text",
                "Design/tut-usa/assets/images/      # captured image assets",
                "Design/tut-usa/assets/fonts/       # captured font files grouped by family where possible",
                "Design/tut-usa/assets/media/       # videos/audio/other media",
                "Design/tut-usa/assets/styles/      # captured static CSS only, no third-party runtime scripts",
                "Design/tut-usa/templates/{slug}/assets-manifest.json",
                "Design/tut-usa/templates/{slug}/normalized.html",
                "frontend/apps/site-nextjs/public/tut-usa/  # generated runtime copy, not hand-maintained",
                "```",
                "",
                "## Notes for REB-02",
                "",
                "- The static inventory is not a replacement for browser capture because template assets include fonts, remote images, Tailwind CDN scripts, and may include runtime/lazy resources.",
                "- Direct remote hosts observed in static HTML are summarized in the inventory; DevOps should use Selenium evidence as the authoritative capture output.",
                "",
            ]
        )
        + "\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate TUT USA contract artifacts.")
    parser.add_argument("--check", action="store_true", help="Validate generated artifacts without writing files.")
    args = parser.parse_args()

    components = read_components()
    templates = read_templates()
    template_lookup = {template["name"]: template for template in templates}
    page_specs = read_page_specs()
    page_tree = build_page_tree(page_specs, template_lookup)
    inventory = read_static_asset_inventory()

    errors = validate(components, templates, page_tree)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    if not args.check:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        write_json(OUTPUT_DIR / "component-contracts.json", components)
        write_json(OUTPUT_DIR / "template-contracts.json", templates)
        write_json(OUTPUT_DIR / "page-tree.json", page_tree)
        write_json(OUTPUT_DIR / "static-asset-url-inventory.json", inventory)
        write_asset_download_plan(OUTPUT_DIR / "asset-download-plan.md", inventory)

    print(f"components={len(components)} templates={len(templates)} pages={len(page_tree)} static_assets={inventory['uniqueAssetCount']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

