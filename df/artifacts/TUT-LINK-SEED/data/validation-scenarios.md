# TUT-LINK-SEED validation scenarios

| ID | Scenario | Automated evidence | Result |
|---|---|---|---|
| DQ-01 | Internal route exists; query strings and trailing slashes normalize to the path authority. | `test_internal_routes_allow_query_and_normalize_trailing_slash` | PASS |
| DQ-02 | Missing internal route fails with source component/field diagnostics. | `test_missing_internal_route_reports_source_field_path` | PASS |
| DQ-03 | Fragments are accepted only when declared for the normalized destination. | `test_fragments_require_a_declared_destination_id` | PASS |
| DQ-04 | HTTP/HTTPS external and mailto/tel special schemes are accepted. | `test_external_and_special_schemes_are_accepted` | PASS |
| DQ-05 | Empty, hash-only, relative, protocol-relative, JavaScript, data, and control-character URLs fail. | `test_empty_placeholder_malformed_and_unsafe_urls_are_rejected` | PASS |
| DQ-06 | Nested dict/list URL fields are discovered with exact JSON-style paths. | `test_recursive_collection_covers_nested_lists_with_diagnostics` | PASS |
| DQ-07 | Navigation primary/utility/account values conform to V18 explicit object shape. | `test_global_navigation_uses_explicit_v18_link_objects`; live persisted V18 check | PASS |
| DQ-08 | Complete generated pages, components, and global fragments form a resolvable graph with no duplicate deterministic names. | `test_complete_generated_graph_has_no_unresolved_links_or_duplicate_nodes` | PASS |
| DQ-09 | Invalid generated data aborts before Author reachability or mutation. | `test_main_validates_before_author_api_access` | PASS |
| DQ-10 | Page inventory count and generated graph keys are exact. | `validate_seed_graph`; `65` pages including root | PASS |
| DQ-11 | Required live node fields and page properties are non-null. | `validate_live_seed.py`; `nullRequiredFields=[]`, `pagesWithMissingRequiredProperties=[]` | PASS |
| DQ-12 | Every deterministic owned path exists exactly once. | `validate_live_seed.py`; `missingOwnedPaths=[]`, `duplicateInventoryPaths=[]` | PASS |
| DQ-13 | Referential integrity: all explicit internal destinations resolve to the page inventory. | `validate_seed_graph`; `unresolvedInternalDestinations=0` | PASS |
| DQ-14 | Every owned root/page/component/global component is published. | `validate_live_seed.py`; `unpublishedOwnedPaths=[]` | PASS |
| DQ-15 | Repeated live imports are idempotent. | fresh stack auto-seed followed by explicit reseed; identical `65/515/423/0` metrics; no duplicate paths | PASS |
| DQ-16 | Consuming backend accepts the dataset/contracts. | `mvn clean compile`, `mvn test` | PASS |
| DQ-17 | Consuming frontend compiles and browser suites retain functional behavior. | `pnpm build`, Selenium smoke rerun, Selenium full | PASS |

## Coverage statement

These scenarios cover schema shape, counts, nulls, deduplication, referential integrity, URL normalization/security, recursive nested extraction, pre-write ordering, publication, idempotency, and consuming application behavior for 100% of the changed data-generation and validation functionality.

