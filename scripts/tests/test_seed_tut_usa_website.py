from __future__ import annotations

import unittest
from unittest.mock import patch

from scripts.seed_tut_usa_website import (
    LinkReference,
    SeedGraphValidationError,
    build_seed_graph,
    collect_link_references,
    main,
    navigation_properties,
    validate_seed_graph,
    validate_url,
)


class SeedTutUsaWebsiteTests(unittest.TestCase):
    routes = {"/tut-usa", "/tut-usa/home", "/tut-usa/search"}

    def reference(self, url: str, field_path: str = "$.cta.url") -> LinkReference:
        return LinkReference("tut-usa/home", field_path, url)

    def test_internal_routes_allow_query_and_normalize_trailing_slash(self) -> None:
        self.assertEqual("internal", validate_url(self.reference("/tut-usa/search/?q=eon"), self.routes))

    def test_fragments_require_a_declared_destination_id(self) -> None:
        fragments = {"/tut-usa/home": {"models"}}
        self.assertEqual(
            "internal-fragment",
            validate_url(self.reference("/tut-usa/home?view=all#models"), self.routes, fragments),
        )
        with self.assertRaisesRegex(SeedGraphValidationError, r"\$\.cta\.url: unresolved fragment 'missing'"):
            validate_url(self.reference("/tut-usa/home#missing"), self.routes, fragments)

    def test_missing_internal_route_reports_source_field_path(self) -> None:
        with self.assertRaisesRegex(
            SeedGraphValidationError,
            r"tut-usa/home \$\.components\[2\]\.cta\.url: unresolved internal route '/tut-usa/missing'",
        ):
            validate_url(
                self.reference("/tut-usa/missing?from=home", "$.components[2].cta.url"),
                self.routes,
            )

    def test_external_and_special_schemes_are_accepted(self) -> None:
        self.assertEqual("external", validate_url(self.reference("https://example.com/path?q=1#top"), self.routes))
        self.assertEqual("external", validate_url(self.reference("http://example.com"), self.routes))
        self.assertEqual("special", validate_url(self.reference("mailto:owners@example.com"), self.routes))
        self.assertEqual("special", validate_url(self.reference("tel:+18008880101"), self.routes))

    def test_empty_placeholder_malformed_and_unsafe_urls_are_rejected(self) -> None:
        invalid_urls = ["", "#", "relative/path", "//example.com/path", "javascript:alert(1)", "data:text/html,x", "/tut-usa/home\n"]
        for url in invalid_urls:
            with self.subTest(url=url), self.assertRaises(SeedGraphValidationError):
                validate_url(self.reference(url), self.routes)

    def test_recursive_collection_covers_nested_lists_with_diagnostics(self) -> None:
        value = {"cards": [{"cta": {"label": "One", "url": "/tut-usa/home"}}]}
        self.assertEqual(
            [LinkReference("fixture", "$.cards[0].cta.url", "/tut-usa/home")],
            collect_link_references(value, "fixture"),
        )

    def test_global_navigation_uses_explicit_v18_link_objects(self) -> None:
        navigation = navigation_properties()
        link_values = [*navigation["primaryLinks"], *navigation["utilityLinks"], navigation["accountEntry"]]
        self.assertTrue(link_values)
        for value in link_values:
            self.assertIsInstance(value, dict)
            self.assertTrue(value["label"])
            self.assertTrue(value["url"])
            self.assertIsInstance(value["openInNewTab"], bool)

    def test_complete_generated_graph_has_no_unresolved_links_or_duplicate_nodes(self) -> None:
        report = validate_seed_graph(build_seed_graph())
        self.assertEqual(65, report.page_count)
        self.assertGreater(report.component_count, report.page_count)
        self.assertGreater(report.link_counts["internal"], 0)
        self.assertGreater(report.link_counts["external"], 0)
        self.assertEqual(0, report.unresolved_internal_destinations)

    def test_main_validates_before_author_api_access(self) -> None:
        with (
            patch("scripts.seed_tut_usa_website.validate_seed_graph", side_effect=SeedGraphValidationError("bad graph")),
            patch("scripts.seed_tut_usa_website.verify_author_reachable") as verify_author,
        ):
            with self.assertRaisesRegex(SeedGraphValidationError, "bad graph"):
                main()
        verify_author.assert_not_called()


if __name__ == "__main__":  # pragma: no cover
    unittest.main()

