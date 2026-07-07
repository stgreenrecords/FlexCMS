#!/usr/bin/env python3
"""Safe reset planner/executor for deterministic TUT/TUT-USA demo seed data."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlparse

try:  # pragma: no cover - import is environment-dependent
    import psycopg2
except ImportError:  # pragma: no cover - exercised indirectly in CLI error path
    psycopg2 = None

try:  # pragma: no cover - import is environment-dependent
    import requests
except ImportError:  # pragma: no cover - exercised indirectly in CLI error path
    requests = None

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_REPORT_PATH = PROJECT_ROOT / "df" / "artifacts" / "REB-03" / "data" / "reset-scope.json"
AUTHOR_API = os.environ.get("FLEXCMS_AUTHOR_API", "http://localhost:8080")
USER_ID = os.environ.get("FLEXCMS_RESET_USER_ID", "admin")
CURRENT_SITE_ID = "tut-usa"
LEGACY_SITE_IDS = ("tut-gb", "tut-de", "tut-fr", "tut-ca")
CURRENT_COMPONENT_PREFIX = "tut-usa/%"
LEGACY_COMPONENT_PREFIX = "tut/%"
CURRENT_CONTENT_ROOT = "content.tut-usa"
CURRENT_XF_ROOT = "content.experience-fragments.tut-usa"
CURRENT_XF_MASTERS = (
    "content.experience-fragments.tut-usa.global.navigation.master",
    "content.experience-fragments.tut-usa.global.footer.master",
)
LEGACY_CONTENT_ROOTS = tuple(f"content.{site_id}" for site_id in LEGACY_SITE_IDS)
LEGACY_XF_ROOTS = tuple(f"content.experience-fragments.{site_id}" for site_id in LEGACY_SITE_IDS)
LEGACY_TEMPLATE_SITE_IDS = LEGACY_SITE_IDS
LEGACY_PIM_SCHEMA = ("Luxury Vehicle v2026", "1.0")
LEGACY_PIM_CATALOG = "TUT 2026 Model Lineup"
LEGACY_PIM_PRODUCT_SKUS = (
    "TUT-SOVEREIGN-2026",
    "TUT-VANGUARD-2026",
    "TUT-ECLIPSE-2026",
    "TUT-APEX-2026",
)
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}
NON_LOCAL_RESET_OVERRIDE = "FLEXCMS_ALLOW_NON_LOCAL_RESET"


@dataclass(frozen=True)
class DbConfig:
    host: str
    port: int
    dbname: str
    user: str
    password: str


@dataclass(frozen=True)
class EnvironmentDecision:
    name: str
    reason: str
    requires_override: bool = False


@dataclass(frozen=True)
class ResetPlan:
    report_path: Path
    author_api: str
    include_legacy_pim: bool
    preserved_current_definitions: bool = True
    preserved_current_templates: bool = True
    preserved_current_pim_seed: bool = True

    def as_dict(self) -> dict[str, Any]:
        return {
            "preserved": {
                "currentComponentDefinitions": {
                    "selector": "component_definitions.resource_type LIKE 'tut-usa/%'",
                    "reason": "Migration-owned via V16; kept intact so reseed does not depend on replaying Flyway history.",
                },
                "currentTemplateDefinitions": {
                    "selector": "template_definitions.allowed_sites contains 'tut-usa' OR page_properties.siteId='tut-usa'",
                    "reason": "Migration-owned via V17; preserved to avoid mutating template registry outside Flyway.",
                },
                "currentPimSampleData": {
                    "selector": "product_schemas/catalogs/products for the legacy TUT sample catalog",
                    "reason": "Preserved by default until a dedicated TUT-USA PIM reseed replaces the legacy sample records.",
                },
            },
            "resetTargets": {
                "currentMutableContent": {
                    "selector": [
                        f"content_nodes.parent_path = '{CURRENT_CONTENT_ROOT}'",
                        *[f"content_nodes.parent_path = '{path}'" for path in CURRENT_XF_MASTERS],
                    ],
                    "execution": "DELETE via Author bulk content API on top-level deterministic paths",
                },
                "currentDamAssets": {
                    "selector": [
                        "assets.site_id = 'tut-usa'",
                        "assets.path LIKE '%dam/tut-usa%'",
                        "dam_folders.site_id = 'tut-usa'",
                    ],
                    "execution": "DELETE via Author asset API, then deterministic DAM folder cleanup in SQL",
                },
                "legacyDemoContentAndMetadata": {
                    "selector": [
                        "legacy site roots content.tut-gb/de/fr/ca",
                        "legacy XF roots content.experience-fragments.tut-gb/de/fr/ca",
                        "experience_fragment_metadata.site_id in legacy TUT sites",
                        "domain_mappings.site_id in legacy TUT sites",
                        "sites.site_id in legacy TUT sites",
                        "component_definitions.resource_type LIKE 'tut/%'",
                    ],
                    "execution": "DELETE via Author bulk content API for content roots; SQL cleanup for metadata, domains, sites, legacy definitions",
                },
                "legacyPimSampleData": {
                    "selector": {
                        "schema": LEGACY_PIM_SCHEMA,
                        "catalog": LEGACY_PIM_CATALOG,
                        "products": list(LEGACY_PIM_PRODUCT_SKUS),
                    },
                    "execution": "Optional SQL cleanup enabled only with --include-legacy-pim",
                },
            },
            "reseedCommands": [
                "python3 scripts/seed_tut_usa_website.py",
                "python3 scripts/import_tut_usa_assets.py",
            ],
            "rollbackNotes": [
                "Do not rewrite or delete existing Flyway migration history.",
                "If reset was applied accidentally, restore the affected database from backup/snapshot before reseeding.",
                "Current TUT-USA component/template definitions are preserved specifically to keep rollback surface small.",
            ],
        }


class ResetError(RuntimeError):
    """Raised when the reset tool must stop safely."""


class SqlCounter:
    def __init__(self, cursor: Any):
        self.cursor = cursor

    def scalar(self, query: str, params: Iterable[Any] | None = None) -> int:
        self.cursor.execute(query, tuple(params or ()))
        value = self.cursor.fetchone()
        return int(value[0] if value else 0)

    def values(self, query: str, params: Iterable[Any] | None = None) -> list[str]:
        self.cursor.execute(query, tuple(params or ()))
        return [row[0] for row in self.cursor.fetchall()]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Execute the reset. Without this flag the tool stays in dry-run mode.")
    parser.add_argument(
        "--confirm-reset-tut-usa",
        action="store_true",
        help="Mandatory acknowledgement that this reset targets deterministic TUT/TUT-USA demo seed data only.",
    )
    parser.add_argument(
        "--include-legacy-pim",
        action="store_true",
        help="Also remove the legacy TUT sample PIM schema/catalog/products from flexcms_pim.",
    )
    parser.add_argument(
        "--environment",
        choices=("local", "qa"),
        help="Explicitly declare the target environment. Unknown/production-like environments are refused.",
    )
    parser.add_argument(
        "--allow-non-local-reset",
        action="store_true",
        help="Required together with --environment qa (or FLEXCMS_ALLOW_NON_LOCAL_RESET=true) to run outside local-only defaults.",
    )
    parser.add_argument(
        "--report-json",
        type=Path,
        default=DEFAULT_REPORT_PATH,
        help="Where to write the machine-readable plan/report.",
    )
    return parser.parse_args(argv)


def bool_env(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in {"1", "true", "yes", "y", "on"}


def build_author_db_config() -> DbConfig:
    return DbConfig(
        host=os.environ.get("FLEXCMS_DB_HOST", "localhost"),
        port=int(os.environ.get("FLEXCMS_DB_PORT", "5432")),
        dbname=os.environ.get("FLEXCMS_DB_NAME", "flexcms_author"),
        user=os.environ.get("FLEXCMS_DB_USER", "flexcms"),
        password=os.environ.get("FLEXCMS_DB_PASSWORD", "flexcms"),
    )


def build_pim_db_config(author_db: DbConfig) -> DbConfig:
    return DbConfig(
        host=os.environ.get("FLEXCMS_PIM_DB_HOST", author_db.host),
        port=int(os.environ.get("FLEXCMS_PIM_DB_PORT", str(author_db.port))),
        dbname=os.environ.get("FLEXCMS_PIM_DB_NAME", "flexcms_pim"),
        user=os.environ.get("FLEXCMS_PIM_DB_USER", author_db.user),
        password=os.environ.get("FLEXCMS_PIM_DB_PASSWORD", author_db.password),
    )


def classify_environment(author_db: DbConfig, author_api: str, explicit: str | None) -> EnvironmentDecision:
    if explicit == "local":
        return EnvironmentDecision("local", "Explicit local environment requested.")
    if explicit == "qa":
        return EnvironmentDecision("qa", "Explicit QA environment requested.", requires_override=True)

    parsed = urlparse(author_api)
    api_host = parsed.hostname or ""
    api_port = parsed.port or (443 if parsed.scheme == "https" else 80)

    if author_db.host in LOCAL_HOSTS and api_host in LOCAL_HOSTS and author_db.port == 5432 and api_port == 8080:
        return EnvironmentDecision("local", "Author DB/API both point to standard localhost development ports.")

    if author_db.host in LOCAL_HOSTS and api_host in LOCAL_HOSTS and (author_db.port, api_port) == (15432, 18080):
        return EnvironmentDecision("qa", "Author DB/API point to localhost QA tunnel ports.", requires_override=True)

    if api_host not in LOCAL_HOSTS or author_db.host not in LOCAL_HOSTS:
        return EnvironmentDecision("unknown", "At least one endpoint is non-local; refusing automatic reset classification.", requires_override=True)

    return EnvironmentDecision("unknown", "Environment does not match approved local or QA port patterns.", requires_override=True)


def require_safe_environment(args: argparse.Namespace, author_db: DbConfig, author_api: str) -> EnvironmentDecision:
    decision = classify_environment(author_db, author_api, args.environment)
    if decision.name == "unknown":
        raise ResetError(
            f"Refusing to continue: {decision.reason} Pass --environment local or --environment qa only after verifying the target manually."
        )
    if decision.requires_override and not (args.allow_non_local_reset or bool_env(NON_LOCAL_RESET_OVERRIDE)):
        raise ResetError(
            f"Refusing to continue in {decision.name} mode without an explicit override. Re-run with --allow-non-local-reset or set {NON_LOCAL_RESET_OVERRIDE}=true."
        )
    return decision


def require_runtime_dependencies(*, need_db: bool, need_http: bool) -> None:
    missing: list[str] = []
    if need_db and psycopg2 is None:
        missing.append("psycopg2")
    if need_http and requests is None:
        missing.append("requests")
    if missing:
        raise ResetError(f"Missing runtime dependency/dependencies: {', '.join(missing)}")


def connect_db(config: DbConfig) -> Any:
    require_runtime_dependencies(need_db=True, need_http=False)
    return psycopg2.connect(  # type: ignore[union-attr]
        host=config.host,
        port=config.port,
        dbname=config.dbname,
        user=config.user,
        password=config.password,
    )


def dot_path_to_url(path: str) -> str:
    if path.startswith("content."):
        path = path[len("content.") :]
    return path.replace(".", "/")


def build_plan(args: argparse.Namespace) -> ResetPlan:
    return ResetPlan(
        report_path=args.report_json,
        author_api=AUTHOR_API,
        include_legacy_pim=args.include_legacy_pim,
    )


def collect_author_counts(conn: Any) -> tuple[dict[str, int], dict[str, list[str]]]:
    with conn.cursor() as cursor:
        counter = SqlCounter(cursor)
        preserved_current_templates_query = (
            "SELECT COUNT(*) FROM template_definitions "
            "WHERE %s = ANY(COALESCE(allowed_sites, ARRAY[]::text[])) "
            "   OR COALESCE(page_properties->>'siteId', '') = %s"
        )
        current_asset_where = (
            "site_id = %s OR path LIKE %s OR folder_path LIKE %s"
        )
        legacy_asset_where = (
            "site_id = ANY(%s) OR path LIKE %s OR folder_path LIKE %s"
        )
        counts = {
            "currentSiteDescendants": counter.scalar(
                "SELECT COUNT(*) FROM content_nodes WHERE path LIKE %s",
                (f"{CURRENT_CONTENT_ROOT}.%",),
            ),
            "currentExperienceFragmentDescendants": counter.scalar(
                "SELECT COUNT(*) FROM content_nodes WHERE path LIKE %s OR path LIKE %s",
                tuple(f"{path}.%" for path in CURRENT_XF_MASTERS),
            ),
            "currentAssets": counter.scalar(
                f"SELECT COUNT(*) FROM assets WHERE {current_asset_where}",
                (CURRENT_SITE_ID, "%dam/tut-usa%", "%dam/tut-usa%"),
            ),
            "currentDamFolders": counter.scalar(
                "SELECT COUNT(*) FROM dam_folders WHERE site_id = %s OR path LIKE %s",
                (CURRENT_SITE_ID, "%dam/tut-usa%"),
            ),
            "legacyContentRootsAndDescendants": counter.scalar(
                "SELECT COUNT(*) FROM content_nodes WHERE path LIKE %s OR path LIKE %s OR path LIKE %s OR path LIKE %s "
                "OR path LIKE %s OR path LIKE %s OR path LIKE %s OR path LIKE %s",
                tuple(f"{prefix}%" for prefix in (*LEGACY_CONTENT_ROOTS, *LEGACY_XF_ROOTS)),
            ),
            "legacyExperienceFragmentMetadata": counter.scalar(
                "SELECT COUNT(*) FROM experience_fragment_metadata WHERE site_id = ANY(%s)",
                (list(LEGACY_SITE_IDS),),
            ),
            "legacyComponentDefinitions": counter.scalar(
                "SELECT COUNT(*) FROM component_definitions WHERE resource_type LIKE %s",
                (LEGACY_COMPONENT_PREFIX,),
            ),
            "legacyTemplateDefinitions": counter.scalar(
                "SELECT COUNT(*) FROM template_definitions "
                "WHERE allowed_sites && %s::text[] OR COALESCE(page_properties->>'siteId', '') = ANY(%s)",
                (list(LEGACY_TEMPLATE_SITE_IDS), list(LEGACY_TEMPLATE_SITE_IDS)),
            ),
            "legacyAssets": counter.scalar(
                f"SELECT COUNT(*) FROM assets WHERE {legacy_asset_where}",
                (list(LEGACY_SITE_IDS), "%dam/tut/%", "%dam/tut/%"),
            ),
            "legacyDamFolders": counter.scalar(
                "SELECT COUNT(*) FROM dam_folders WHERE site_id = ANY(%s) OR path LIKE %s",
                (list(LEGACY_SITE_IDS), "%dam/tut/%"),
            ),
            "legacySites": counter.scalar(
                "SELECT COUNT(*) FROM sites WHERE site_id = ANY(%s)",
                (list(LEGACY_SITE_IDS),),
            ),
            "legacyDomainMappings": counter.scalar(
                "SELECT COUNT(*) FROM domain_mappings WHERE site_id = ANY(%s)",
                (list(LEGACY_SITE_IDS),),
            ),
            "preservedCurrentComponentDefinitions": counter.scalar(
                "SELECT COUNT(*) FROM component_definitions WHERE resource_type LIKE %s",
                (CURRENT_COMPONENT_PREFIX,),
            ),
            "preservedCurrentTemplateDefinitions": counter.scalar(
                preserved_current_templates_query,
                (CURRENT_SITE_ID, CURRENT_SITE_ID),
            ),
        }
        paths = {
            "currentContentDeletePaths": [
                dot_path_to_url(path)
                for path in counter.values(
                    "SELECT path FROM content_nodes WHERE parent_path = %s ORDER BY path",
                    (CURRENT_CONTENT_ROOT,),
                )
            ],
            "currentExperienceFragmentDeletePaths": [
                dot_path_to_url(path)
                for path in counter.values(
                    "SELECT path FROM content_nodes WHERE parent_path = %s OR parent_path = %s ORDER BY path",
                    CURRENT_XF_MASTERS,
                )
            ],
            "legacyContentDeletePaths": [
                dot_path_to_url(path)
                for path in counter.values(
                    "SELECT path FROM content_nodes WHERE path = ANY(%s) ORDER BY path",
                    (list((*LEGACY_CONTENT_ROOTS, *LEGACY_XF_ROOTS)),),
                )
            ],
            "currentAssetDeletePaths": counter.values(
                f"SELECT path FROM assets WHERE {current_asset_where} ORDER BY path",
                (CURRENT_SITE_ID, "%dam/tut-usa%", "%dam/tut-usa%"),
            ),
            "legacyAssetDeletePaths": counter.values(
                f"SELECT path FROM assets WHERE {legacy_asset_where} ORDER BY path",
                (list(LEGACY_SITE_IDS), "%dam/tut/%", "%dam/tut/%"),
            ),
        }
        return counts, paths


def collect_pim_counts(conn: Any) -> dict[str, int]:
    with conn.cursor() as cursor:
        counter = SqlCounter(cursor)
        return {
            "legacySampleSchemas": counter.scalar(
                "SELECT COUNT(*) FROM product_schemas WHERE name = %s AND version = %s",
                LEGACY_PIM_SCHEMA,
            ),
            "legacySampleCatalogs": counter.scalar(
                "SELECT COUNT(*) FROM catalogs WHERE name = %s",
                (LEGACY_PIM_CATALOG,),
            ),
            "legacySampleProducts": counter.scalar(
                "SELECT COUNT(*) FROM products WHERE sku = ANY(%s)",
                (list(LEGACY_PIM_PRODUCT_SKUS),),
            ),
        }


def delete_content_paths(author_api: str, paths: list[str]) -> dict[str, Any]:
    if not paths:
        return {"deleted": 0, "paths": []}
    response = requests.delete(  # type: ignore[union-attr]
        f"{author_api}/api/author/content/bulk",
        json={"paths": paths, "userId": USER_ID},
        headers={"Content-Type": "application/json"},
        timeout=120,
    )
    if not response.ok:
        raise ResetError(f"Bulk content delete failed with {response.status_code}: {response.text[:500]}")
    return {"deleted": len(paths), "paths": paths, "result": response.json()}


def delete_asset_paths(author_api: str, paths: list[str]) -> dict[str, Any]:
    deleted: list[str] = []
    missing: list[str] = []
    for path in paths:
        response = requests.delete(  # type: ignore[union-attr]
            f"{author_api}/api/author/assets",
            params={"path": path},
            timeout=120,
        )
        if response.status_code == 404:
            missing.append(path)
            continue
        if not response.ok:
            raise ResetError(f"Asset delete failed for {path} with {response.status_code}: {response.text[:500]}")
        deleted.append(path)
    return {"deleted": len(deleted), "missing": len(missing), "paths": deleted, "missingPaths": missing}


def apply_author_sql_cleanup(conn: Any) -> dict[str, int]:
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM component_definitions WHERE resource_type LIKE %s", (LEGACY_COMPONENT_PREFIX,))
        deleted_legacy_component_definitions = cursor.rowcount

        cursor.execute(
            "DELETE FROM template_definitions WHERE allowed_sites && %s::text[] OR COALESCE(page_properties->>'siteId', '') = ANY(%s)",
            (list(LEGACY_TEMPLATE_SITE_IDS), list(LEGACY_TEMPLATE_SITE_IDS)),
        )
        deleted_legacy_templates = cursor.rowcount

        cursor.execute("DELETE FROM experience_fragment_metadata WHERE site_id = ANY(%s)", (list(LEGACY_SITE_IDS),))
        deleted_legacy_xf_metadata = cursor.rowcount

        cursor.execute("DELETE FROM domain_mappings WHERE site_id = ANY(%s)", (list(LEGACY_SITE_IDS),))
        deleted_legacy_domains = cursor.rowcount

        cursor.execute("DELETE FROM sites WHERE site_id = ANY(%s)", (list(LEGACY_SITE_IDS),))
        deleted_legacy_sites = cursor.rowcount

        cursor.execute(
            "DELETE FROM dam_folders WHERE site_id = %s OR site_id = ANY(%s) OR path LIKE %s OR path LIKE %s",
            (CURRENT_SITE_ID, list(LEGACY_SITE_IDS), "%dam/tut-usa%", "%dam/tut/%"),
        )
        deleted_dam_folders = cursor.rowcount
    conn.commit()
    return {
        "legacyComponentDefinitions": deleted_legacy_component_definitions,
        "legacyTemplateDefinitions": deleted_legacy_templates,
        "legacyExperienceFragmentMetadata": deleted_legacy_xf_metadata,
        "legacyDomainMappings": deleted_legacy_domains,
        "legacySites": deleted_legacy_sites,
        "damFolders": deleted_dam_folders,
    }


def apply_pim_sql_cleanup(conn: Any) -> dict[str, int]:
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM products WHERE sku = ANY(%s)", (list(LEGACY_PIM_PRODUCT_SKUS),))
        deleted_products = cursor.rowcount
        cursor.execute("DELETE FROM catalogs WHERE name = %s", (LEGACY_PIM_CATALOG,))
        deleted_catalogs = cursor.rowcount
        cursor.execute(
            "DELETE FROM product_schemas WHERE name = %s AND version = %s",
            LEGACY_PIM_SCHEMA,
        )
        deleted_schemas = cursor.rowcount
    conn.commit()
    return {
        "legacySampleProducts": deleted_products,
        "legacySampleCatalogs": deleted_catalogs,
        "legacySampleSchemas": deleted_schemas,
    }


def render_report(
    args: argparse.Namespace,
    plan: ResetPlan,
    environment: EnvironmentDecision,
    author_counts_before: dict[str, int],
    author_paths: dict[str, list[str]],
    pim_counts_before: dict[str, int],
    actions: dict[str, Any],
    author_counts_after: dict[str, int] | None,
    pim_counts_after: dict[str, int] | None,
) -> dict[str, Any]:
    return {
        "mode": "apply" if args.apply else "dry-run",
        "environment": {
            "name": environment.name,
            "reason": environment.reason,
        },
        "safety": {
            "confirmationFlag": bool(args.confirm_reset_tut_usa),
            "nonLocalOverride": bool(args.allow_non_local_reset or bool_env(NON_LOCAL_RESET_OVERRIDE)),
        },
        "plan": plan.as_dict(),
        "before": {
            "author": author_counts_before,
            "pim": pim_counts_before,
            "deletePaths": author_paths,
        },
        "actions": actions,
        "after": {
            "author": author_counts_after,
            "pim": pim_counts_after,
        },
    }


def unavailable_counts(reason: str) -> tuple[dict[str, Any], dict[str, list[str]], dict[str, Any]]:
    marker = {"status": "unavailable", "reason": reason}
    return marker.copy(), {
        "currentContentDeletePaths": [],
        "currentExperienceFragmentDeletePaths": [],
        "legacyContentDeletePaths": [],
        "currentAssetDeletePaths": [],
        "legacyAssetDeletePaths": [],
    }, marker.copy()


def write_report(report_path: Path, report: dict[str, Any]) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    if not args.confirm_reset_tut_usa:
        raise ResetError("Refusing to continue without --confirm-reset-tut-usa.")

    author_db = build_author_db_config()
    pim_db = build_pim_db_config(author_db)
    environment = require_safe_environment(args, author_db, AUTHOR_API)
    plan = build_plan(args)
    actions: dict[str, Any] = {"executed": args.apply, "author": {}, "pim": {}}
    author_counts_after: dict[str, int] | None = None
    pim_counts_after: dict[str, int] | None = None

    if args.apply:
        require_runtime_dependencies(need_db=True, need_http=True)
        with connect_db(author_db) as author_conn, connect_db(pim_db) as pim_conn:
            author_counts_before, author_paths = collect_author_counts(author_conn)
            pim_counts_before = collect_pim_counts(pim_conn)

            actions["author"]["currentContentDelete"] = delete_content_paths(
                AUTHOR_API,
                author_paths["currentContentDeletePaths"] + author_paths["currentExperienceFragmentDeletePaths"],
            )
            actions["author"]["legacyContentDelete"] = delete_content_paths(AUTHOR_API, author_paths["legacyContentDeletePaths"])
            actions["author"]["currentAssetDelete"] = delete_asset_paths(AUTHOR_API, author_paths["currentAssetDeletePaths"])
            actions["author"]["legacyAssetDelete"] = delete_asset_paths(AUTHOR_API, author_paths["legacyAssetDeletePaths"])
            actions["author"]["sqlCleanup"] = apply_author_sql_cleanup(author_conn)
            if args.include_legacy_pim:
                actions["pim"]["sqlCleanup"] = apply_pim_sql_cleanup(pim_conn)
            else:
                actions["pim"]["sqlCleanup"] = {"skipped": True, "reason": "Run again with --include-legacy-pim to purge legacy PIM sample rows."}
            author_counts_after, _ = collect_author_counts(author_conn)
            pim_counts_after = collect_pim_counts(pim_conn)
    else:
        if psycopg2 is None:
            reason = "psycopg2 is not installed in the current shell, so dry-run DB counts were not collected."
            author_counts_before, author_paths, pim_counts_before = unavailable_counts(reason)
            actions["author"]["counts"] = {"skipped": True, "reason": reason}
            actions["pim"]["counts"] = {"skipped": True, "reason": reason}
        else:
            with connect_db(author_db) as author_conn, connect_db(pim_db) as pim_conn:
                author_counts_before, author_paths = collect_author_counts(author_conn)
                pim_counts_before = collect_pim_counts(pim_conn)

    report = render_report(
        args,
        plan,
        environment,
        author_counts_before,
        author_paths,
        pim_counts_before,
        actions,
        author_counts_after,
        pim_counts_after,
    )
    write_report(plan.report_path, report)

    print(json.dumps({
        "mode": report["mode"],
        "environment": report["environment"],
        "report": str(plan.report_path),
        "authorBefore": report["before"]["author"],
        "pimBefore": report["before"]["pim"],
        "actionsExecuted": args.apply,
    }, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
    except ResetError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)

