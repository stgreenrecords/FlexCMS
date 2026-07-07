#!/usr/bin/env python3
"""Import captured TUT USA assets into frontend public folders and optionally DAM.

This script consumes `Design/tut-usa/manifest.json` plus per-page manifests produced by
REB-02, copies downloaded local assets into public app folders, and writes a deterministic
`dam-import-map.json` for REB-07 evidence.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_SITE_PUBLIC_ROOT = Path("frontend/apps/site-nextjs/public/tut-usa/assets")
DEFAULT_ADMIN_PUBLIC_ROOT = Path("frontend/apps/admin/public/tut-usa/assets")
DEFAULT_GLOBAL_MANIFEST = Path("Design/tut-usa/manifest.json")
DEFAULT_MAP_OUTPUT = Path("df/artifacts/REB-07/data/dam-import-map.json")
DEFAULT_CHECKSUM_OUTPUT = Path("df/artifacts/REB-07/data/checksum-evidence.md")
DEFAULT_ROLLBACK_OUTPUT = Path("df/artifacts/REB-07/data/rollback-notes.md")


@dataclass
class AssetUsage:
    source_url: str
    category: str
    page_slug: str
    kind: str


@dataclass
class LocalAssetRecord:
    local_path: Path
    relative_asset_path: Path
    sha256: str
    byte_size: int
    content_type: str
    usages: list[AssetUsage] = field(default_factory=list)
    integrity_warnings: list[str] = field(default_factory=list)


@dataclass
class ImportResult:
    records: list[LocalAssetRecord]
    blocker_counts: Counter
    copied_site_nextjs: int
    copied_admin: int
    dam_uploaded: int


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parent.parent


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_relative_to_design_assets(local_path: Path) -> Path:
    parts = local_path.parts
    try:
        design_idx = parts.index("Design")
    except ValueError as exc:
        raise ValueError(f"Local asset path is not under Design/: {local_path}") from exc
    sub_parts = parts[design_idx:]
    if len(sub_parts) < 4 or sub_parts[1] != "tut-usa" or sub_parts[2] != "assets":
        raise ValueError(f"Local asset path is not under Design/tut-usa/assets: {local_path}")
    return Path(*sub_parts[3:])


def collect_local_asset_records(repo_root: Path, global_manifest: dict[str, Any]) -> tuple[dict[str, LocalAssetRecord], Counter]:
    records: dict[str, LocalAssetRecord] = {}
    blocker_counts: Counter = Counter()
    for page in global_manifest.get("pages", []):
        page_slug = str(page.get("slug", "unknown"))
        kind = str(page.get("kind", "unknown"))
        page_manifest_path = repo_root / str(page["manifestPath"])
        page_manifest = load_json(page_manifest_path)

        for blocker in page_manifest.get("blockers", []):
            blocker_counts[str(blocker.get("status", "unknown"))] += 1

        for resource in page_manifest.get("resources", []):
            status = str(resource.get("status", "unknown"))
            if status != "downloaded":
                if status in {"missing", "disallowed", "error"}:
                    blocker_counts[status] += 1
                continue

            local_path_value = resource.get("localPath")
            if not local_path_value:
                continue
            rel_local = Path(str(local_path_value))
            abs_local = (repo_root / rel_local).resolve()
            if not abs_local.exists():
                raise FileNotFoundError(f"Manifest local asset does not exist: {rel_local}")

            relative_asset_path = ensure_relative_to_design_assets(rel_local)
            actual_size = abs_local.stat().st_size
            actual_sha = sha256_file(abs_local)
            manifest_size = resource.get("byteSize")
            manifest_sha = resource.get("sha256")

            integrity_warnings: list[str] = []
            if manifest_size is not None and int(manifest_size) != actual_size:
                integrity_warnings.append(
                    f"size mismatch manifest={manifest_size} actual={actual_size}"
                )
            if manifest_sha and str(manifest_sha) != actual_sha:
                integrity_warnings.append(
                    f"sha mismatch manifest={manifest_sha} actual={actual_sha}"
                )

            key = rel_local.as_posix()
            record = records.get(key)
            if record is None:
                content_type = str(resource.get("contentType") or mimetypes.guess_type(abs_local.name)[0] or "application/octet-stream")
                record = LocalAssetRecord(
                    local_path=rel_local,
                    relative_asset_path=relative_asset_path,
                    sha256=actual_sha,
                    byte_size=actual_size,
                    content_type=content_type,
                    integrity_warnings=integrity_warnings,
                )
                records[key] = record
            elif integrity_warnings:
                for warning in integrity_warnings:
                    if warning not in record.integrity_warnings:
                        record.integrity_warnings.append(warning)

            record.usages.append(
                AssetUsage(
                    source_url=str(resource.get("sourceUrl") or ""),
                    category=str(resource.get("category") or "unknown"),
                    page_slug=page_slug,
                    kind=kind,
                )
            )

    return records, blocker_counts


def copy_asset(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(source.read_bytes())


def maybe_upload_dam(
    *,
    repo_root: Path,
    records: list[LocalAssetRecord],
    author_api: str,
    site_id: str,
    user_id: str,
) -> dict[str, dict[str, str]]:
    # requests is optional unless DAM upload is explicitly requested.
    import requests  # type: ignore

    uploaded: dict[str, dict[str, str]] = {}
    for record in records:
        source = repo_root / record.local_path
        dam_asset_path = f"content/dam/{site_id}/{record.relative_asset_path.as_posix()}"

        delete_response = requests.delete(
            f"{author_api}/api/author/assets",
            params={"path": dam_asset_path},
            timeout=120,
        )
        if delete_response.status_code not in (200, 404):
            raise RuntimeError(
                f"DELETE {dam_asset_path} failed with {delete_response.status_code}: {delete_response.text[:300]}"
            )

        with source.open("rb") as handle:
            upload_response = requests.post(
                f"{author_api}/api/author/assets",
                params={"path": dam_asset_path, "siteId": site_id, "userId": user_id},
                files={"file": (source.name, handle, record.content_type)},
                timeout=180,
            )
        if not upload_response.ok:
            raise RuntimeError(
                f"POST {dam_asset_path} failed with {upload_response.status_code}: {upload_response.text[:300]}"
            )
        asset = upload_response.json()
        uploaded[record.local_path.as_posix()] = {
            "damAssetPath": dam_asset_path,
            "damContentUrl": f"/api/author/assets/{asset['id']}/content",
        }

    return uploaded


def build_map_json(
    *,
    records: list[LocalAssetRecord],
    source_manifest: Path,
    copied_site_nextjs: int,
    copied_admin: int,
    dam_uploaded: int,
    dam_by_local_path: dict[str, dict[str, str]],
    blocker_counts: Counter,
) -> dict[str, Any]:
    resources_payload: list[dict[str, Any]] = []
    category_counter: Counter = Counter()
    total_bytes = 0

    for record in records:
        categories = sorted({usage.category for usage in record.usages})
        source_urls = sorted({usage.source_url for usage in record.usages if usage.source_url})
        pages = sorted({f"{usage.kind}:{usage.page_slug}" for usage in record.usages})
        category_counter.update(categories)
        total_bytes += record.byte_size
        relative_posix = record.relative_asset_path.as_posix()
        local_key = record.local_path.as_posix()
        dam_entry = dam_by_local_path.get(local_key)

        resources_payload.append(
            {
                "localPath": local_key,
                "relativeAssetPath": relative_posix,
                "sha256": record.sha256,
                "byteSize": record.byte_size,
                "contentType": record.content_type,
                "categories": categories,
                "sourceUrls": source_urls,
                "sourcePages": pages,
                "public": {
                    "siteNextjs": {
                        "filesystemPath": str(DEFAULT_SITE_PUBLIC_ROOT / record.relative_asset_path),
                        "publicUrl": f"/tut-usa/assets/{relative_posix}",
                    },
                    "admin": {
                        "filesystemPath": str(DEFAULT_ADMIN_PUBLIC_ROOT / record.relative_asset_path),
                        "publicUrl": f"/tut-usa/assets/{relative_posix}",
                    },
                },
                "dam": {
                    "status": "uploaded" if dam_entry else "not-uploaded",
                    "damAssetPath": dam_entry["damAssetPath"] if dam_entry else None,
                    "damContentUrl": dam_entry["damContentUrl"] if dam_entry else None,
                },
                "integrityWarnings": record.integrity_warnings,
            }
        )

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceManifest": source_manifest.as_posix(),
        "totals": {
            "uniqueLocalAssets": len(records),
            "totalBytes": total_bytes,
            "categories": dict(sorted(category_counter.items())),
            "copiedSiteNextjs": copied_site_nextjs,
            "copiedAdmin": copied_admin,
            "damUploaded": dam_uploaded,
            "blockersSeen": dict(sorted(blocker_counts.items())),
            "assetsWithIntegrityWarnings": sum(1 for item in records if item.integrity_warnings),
        },
        "resources": resources_payload,
    }


def write_checksum_evidence(path: Path, records: list[LocalAssetRecord], map_output: Path) -> None:
    category_counter: Counter = Counter()
    total_bytes = 0
    for record in records:
        total_bytes += record.byte_size
        category_counter.update({usage.category for usage in record.usages})

    lines = [
        "# REB-07 checksum and size evidence",
        "",
        f"- Generated map: `{map_output.as_posix()}`",
        f"- Unique assets: {len(records)}",
        f"- Total bytes: {total_bytes}",
        f"- Category counts: `{dict(sorted(category_counter.items()))}`",
        "",
        "## Sample assets",
        "",
        "| Local path | SHA256 | Bytes |",
        "|---|---|---:|",
    ]
    for record in records[:20]:
        lines.append(f"| `{record.local_path.as_posix()}` | `{record.sha256}` | {record.byte_size} |")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_rollback_notes(path: Path) -> None:
    lines = [
        "# REB-07 rollback notes",
        "",
        "If REB-07 imported assets need to be rolled back:",
        "",
        "1. Remove copied public assets:",
        f"   - `rm -rf {DEFAULT_SITE_PUBLIC_ROOT.as_posix()}`",
        f"   - `rm -rf {DEFAULT_ADMIN_PUBLIC_ROOT.as_posix()}`",
        "2. If DAM upload was used, delete imported DAM folder from author API:",
        "   - DELETE `/api/author/assets?path=content/dam/tut-usa` (or remove child paths from `dam-import-map.json`).",
        "3. Re-run deterministic reseed workflow (REB-03 evidence):",
        "   - `python3 scripts/seed_tut_usa_website.py`",
        "   - `python3 scripts/import_tut_usa_captured_assets.py`.",
        "4. Re-publish impacted TUT-USA nodes after reseed.",
        "",
        "Note: preserve backup/snapshot procedures for non-local environments per reset guards in REB-03.",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def run(args: argparse.Namespace) -> ImportResult:
    repo_root = Path(args.repo_root).resolve()
    global_manifest_path = (repo_root / args.manifest).resolve()
    global_manifest = load_json(global_manifest_path)

    records_by_path, blocker_counts = collect_local_asset_records(repo_root, global_manifest)
    records = sorted(records_by_path.values(), key=lambda item: item.local_path.as_posix())

    copied_site_nextjs = 0
    copied_admin = 0
    site_root = repo_root / DEFAULT_SITE_PUBLIC_ROOT
    admin_root = repo_root / DEFAULT_ADMIN_PUBLIC_ROOT

    for record in records:
        source = repo_root / record.local_path
        site_target = site_root / record.relative_asset_path
        admin_target = admin_root / record.relative_asset_path
        copy_asset(source, site_target)
        copy_asset(source, admin_target)
        copied_site_nextjs += 1
        copied_admin += 1

    dam_by_local_path: dict[str, dict[str, str]] = {}
    dam_uploaded = 0
    if args.upload_dam:
        dam_by_local_path = maybe_upload_dam(
            repo_root=repo_root,
            records=records,
            author_api=args.author_api,
            site_id=args.site_id,
            user_id=args.user_id,
        )
        dam_uploaded = len(dam_by_local_path)

    map_output = (repo_root / args.map_output).resolve()
    map_payload = build_map_json(
        records=records,
        source_manifest=Path(args.manifest),
        copied_site_nextjs=copied_site_nextjs,
        copied_admin=copied_admin,
        dam_uploaded=dam_uploaded,
        dam_by_local_path=dam_by_local_path,
        blocker_counts=blocker_counts,
    )
    map_output.parent.mkdir(parents=True, exist_ok=True)
    map_output.write_text(json.dumps(map_payload, indent=2) + "\n", encoding="utf-8")

    checksum_output = (repo_root / args.checksum_output).resolve()
    rollback_output = (repo_root / args.rollback_output).resolve()
    write_checksum_evidence(checksum_output, records, map_output.relative_to(repo_root))
    write_rollback_notes(rollback_output)

    print(f"Imported/cached {len(records)} unique assets from {args.manifest}.")
    print(f"Copied to site-nextjs public: {copied_site_nextjs}")
    print(f"Copied to admin public: {copied_admin}")
    print(f"DAM uploaded: {dam_uploaded}")
    print(f"Blockers seen in source manifests: {dict(sorted(blocker_counts.items()))}")
    print(f"Map output: {map_output}")

    return ImportResult(
        records=records,
        blocker_counts=blocker_counts,
        copied_site_nextjs=copied_site_nextjs,
        copied_admin=copied_admin,
        dam_uploaded=dam_uploaded,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import captured TUT USA assets into public folders and optional DAM.")
    parser.add_argument("--repo-root", default=str(repo_root_from_script()), help="Repository root (default: script parent root)")
    parser.add_argument("--manifest", default=str(DEFAULT_GLOBAL_MANIFEST), help="Path to global capture manifest")
    parser.add_argument("--map-output", default=str(DEFAULT_MAP_OUTPUT), help="Output path for dam-import map JSON")
    parser.add_argument("--checksum-output", default=str(DEFAULT_CHECKSUM_OUTPUT), help="Output path for checksum evidence markdown")
    parser.add_argument("--rollback-output", default=str(DEFAULT_ROLLBACK_OUTPUT), help="Output path for rollback notes markdown")
    parser.add_argument("--upload-dam", action="store_true", help="Upload assets into DAM through author API")
    parser.add_argument("--author-api", default=os.environ.get("FLEXCMS_AUTHOR_API", "http://localhost:8080"), help="Author API base URL")
    parser.add_argument("--site-id", default="tut-usa", help="Site id used in DAM path")
    parser.add_argument("--user-id", default="admin", help="User id for author API operations")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    run(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


