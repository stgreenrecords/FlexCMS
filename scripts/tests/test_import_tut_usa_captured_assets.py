from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.import_tut_usa_captured_assets import collect_local_asset_records, run, sha256_file


class ImportCapturedAssetsTests(unittest.TestCase):
    def test_collect_records_deduplicates_asset_usage(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            asset = root / "Design/tut-usa/assets/images/example.png"
            asset.parent.mkdir(parents=True, exist_ok=True)
            asset.write_bytes(b"abc123")

            page_manifest = {
                "resources": [
                    {
                        "status": "downloaded",
                        "localPath": "Design/tut-usa/assets/images/example.png",
                        "byteSize": 6,
                        "sha256": sha256_file(asset),
                        "contentType": "image/png",
                        "sourceUrl": "https://example.com/image.png",
                        "category": "image",
                    },
                    {
                        "status": "downloaded",
                        "localPath": "Design/tut-usa/assets/images/example.png",
                        "byteSize": 6,
                        "sha256": sha256_file(asset),
                        "contentType": "image/png",
                        "sourceUrl": "https://example.com/image2.png",
                        "category": "image",
                    },
                    {
                        "status": "missing",
                        "sourceUrl": "https://example.com/missing.png",
                        "category": "image",
                    },
                ],
                "blockers": [],
            }
            page_manifest_path = root / "Design/tut-usa/templates/foo/assets-manifest.json"
            page_manifest_path.parent.mkdir(parents=True, exist_ok=True)
            page_manifest_path.write_text(json.dumps(page_manifest), encoding="utf-8")

            global_manifest = {
                "pages": [
                    {
                        "kind": "templates",
                        "slug": "foo",
                        "manifestPath": "Design/tut-usa/templates/foo/assets-manifest.json",
                    }
                ]
            }

            records, blockers = collect_local_asset_records(root, global_manifest)
            self.assertEqual(1, len(records))
            record = next(iter(records.values()))
            self.assertEqual("images/example.png", record.relative_asset_path.as_posix())
            self.assertEqual(2, len(record.usages))
            self.assertEqual(1, blockers["missing"])

    def test_run_generates_map_and_public_copies(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            asset = root / "Design/tut-usa/assets/styles/site.css"
            asset.parent.mkdir(parents=True, exist_ok=True)
            asset.write_bytes(b"body{}")

            page_manifest_path = root / "Design/tut-usa/components/bar/assets-manifest.json"
            page_manifest_path.parent.mkdir(parents=True, exist_ok=True)
            page_manifest_path.write_text(
                json.dumps(
                    {
                        "resources": [
                            {
                                "status": "downloaded",
                                "localPath": "Design/tut-usa/assets/styles/site.css",
                                "byteSize": 6,
                                "sha256": sha256_file(asset),
                                "contentType": "text/css",
                                "sourceUrl": "https://example.com/site.css",
                                "category": "stylesheet",
                            }
                        ],
                        "blockers": [],
                    }
                ),
                encoding="utf-8",
            )

            global_manifest_path = root / "Design/tut-usa/manifest.json"
            global_manifest_path.parent.mkdir(parents=True, exist_ok=True)
            global_manifest_path.write_text(
                json.dumps(
                    {
                        "pages": [
                            {
                                "kind": "components",
                                "slug": "bar",
                                "manifestPath": "Design/tut-usa/components/bar/assets-manifest.json",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            class Args:
                repo_root = str(root)
                manifest = "Design/tut-usa/manifest.json"
                map_output = "df/artifacts/REB-07/data/dam-import-map.json"
                checksum_output = "df/artifacts/REB-07/data/checksum-evidence.md"
                rollback_output = "df/artifacts/REB-07/data/rollback-notes.md"
                upload_dam = False
                author_api = "http://localhost:8080"
                site_id = "tut-usa"
                user_id = "admin"

            result = run(Args)
            self.assertEqual(1, len(result.records))

            copied_site = root / "frontend/apps/site-nextjs/public/tut-usa/assets/styles/site.css"
            copied_admin = root / "frontend/apps/admin/public/tut-usa/assets/styles/site.css"
            self.assertTrue(copied_site.exists())
            self.assertTrue(copied_admin.exists())

            map_file = root / "df/artifacts/REB-07/data/dam-import-map.json"
            self.assertTrue(map_file.exists())
            payload = json.loads(map_file.read_text(encoding="utf-8"))
            self.assertEqual(1, payload["totals"]["uniqueLocalAssets"])
            self.assertEqual("not-uploaded", payload["resources"][0]["dam"]["status"])


if __name__ == "__main__":
    unittest.main()

