from __future__ import annotations

import unittest
from pathlib import Path
from types import SimpleNamespace

from scripts.reset_tut_usa_seed import (
    CURRENT_SITE_ID,
    DbConfig,
    EnvironmentDecision,
    LEGACY_PIM_CATALOG,
    LEGACY_PIM_PRODUCT_SKUS,
    LEGACY_PIM_SCHEMA,
    build_plan,
    classify_environment,
    dot_path_to_url,
    require_safe_environment,
    unavailable_counts,
)


class ResetTutUsaSeedTests(unittest.TestCase):
    def make_args(self, **overrides):
        values = {
            "apply": False,
            "confirm_reset_tut_usa": True,
            "include_legacy_pim": False,
            "environment": None,
            "allow_non_local_reset": False,
            "report_json": Path("/tmp/reset-report.json"),
        }
        values.update(overrides)
        return SimpleNamespace(**values)

    def test_dot_path_to_url_converts_content_prefix(self):
        self.assertEqual(dot_path_to_url("content.tut-usa.home"), "tut-usa/home")
        self.assertEqual(
            dot_path_to_url("content.experience-fragments.tut-usa.global.footer.master.footer"),
            "experience-fragments/tut-usa/global/footer/master/footer",
        )

    def test_classify_environment_detects_local_defaults(self):
        decision = classify_environment(
            DbConfig("localhost", 5432, "flexcms_author", "flexcms", "flexcms"),
            "http://localhost:8080",
            None,
        )
        self.assertEqual(decision, EnvironmentDecision("local", "Author DB/API both point to standard localhost development ports."))

    def test_classify_environment_detects_qa_tunnel(self):
        decision = classify_environment(
            DbConfig("localhost", 15432, "flexcms_author", "flexcms", "secret"),
            "http://localhost:18080",
            None,
        )
        self.assertEqual(decision.name, "qa")
        self.assertTrue(decision.requires_override)

    def test_require_safe_environment_rejects_qa_without_override(self):
        with self.assertRaisesRegex(RuntimeError, "override"):
            require_safe_environment(
                self.make_args(environment="qa"),
                DbConfig("localhost", 15432, "flexcms_author", "flexcms", "secret"),
                "http://localhost:18080",
            )

    def test_build_plan_includes_legacy_pim_targets(self):
        args = self.make_args(include_legacy_pim=True)
        plan = build_plan(args).as_dict()
        pim_target = plan["resetTargets"]["legacyPimSampleData"]["selector"]
        self.assertEqual(tuple(pim_target["schema"]), LEGACY_PIM_SCHEMA)
        self.assertEqual(pim_target["catalog"], LEGACY_PIM_CATALOG)
        self.assertEqual(tuple(pim_target["products"]), LEGACY_PIM_PRODUCT_SKUS)
        self.assertIn(CURRENT_SITE_ID, plan["preserved"]["currentTemplateDefinitions"]["selector"])

    def test_unavailable_counts_returns_markers_and_empty_paths(self):
        author_counts, delete_paths, pim_counts = unavailable_counts("psycopg2 missing")
        self.assertEqual(author_counts["status"], "unavailable")
        self.assertEqual(author_counts["reason"], "psycopg2 missing")
        self.assertEqual(pim_counts["status"], "unavailable")
        self.assertTrue(all(not paths for paths in delete_paths.values()))


if __name__ == "__main__":  # pragma: no cover
    unittest.main()

