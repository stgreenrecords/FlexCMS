#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import tempfile
import unittest
import subprocess
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

import copilot_cloud_agent as cca


class FakeClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, body=None):
        self.calls.append((method, url, body))
        if not self.responses:
            return {}
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class CopilotCloudAgentTest(unittest.TestCase):
    def make_repo(self):
        tmp = tempfile.TemporaryDirectory()
        root = Path(tmp.name)
        (root / "df" / "runtime").mkdir(parents=True)
        (root / "df" / "artifacts" / "TASK-1").mkdir(parents=True)
        (root / "prompt.md").write_text("# Prompt\n\nDo one role only.\n", encoding="utf-8")
        (root / "df" / "runtime" / "board.md").write_text(
            "# The Factory Runtime Board\n\n"
            "| Priority | Task ID | Title | Type | State | Owner role | Blocked? | Last updated | Next action |\n"
            "|---|---|---|---|---|---|---|---|---|\n"
            "| P0 | TASK-1 | Cloud task | Task | READY_FOR_DEV | devops | No | 2026-07-07 local | implement |\n",
            encoding="utf-8",
        )
        (root / "df" / "runtime" / "activity-log.md").write_text("# log\n", encoding="utf-8")
        return tmp, root

    def make_config(self, root: Path, **env_overrides):
        env = {
            "DF_SESSION_ROOT": str(root),
            "DF_GITHUB_OWNER": "octo-org",
            "DF_GITHUB_REPO": "octo-repo",
            "DF_COPILOT_AGENT_BASE_BRANCH": "main",
            "DF_COPILOT_AGENT_MODEL": "gpt-5.5",
            "DF_GITHUB_TOKEN": "github_pat_SECRET1234567890abcdefghijklmnopqrstuvwxyz",
            "DF_COPILOT_AGENT_POLL_SECONDS": "1",
            "DF_COPILOT_AGENT_TIMEOUT_SECONDS": "5",
        }
        env.update(env_overrides)
        return cca.build_config("devops", "TASK-1", "READY_FOR_DEV", root / "prompt.md", env)

    def test_payload_contains_dark_factory_context(self):
        tmp, root = self.make_repo()
        with tmp:
            config = self.make_config(root)
            payload = cca.build_create_payload(config)
            self.assertEqual(payload["base_branch"], "main")
            self.assertEqual(payload["model"], "gpt-5.5")
            self.assertEqual(payload["metadata"]["task_id"], "TASK-1")
            self.assertEqual(payload["metadata"]["role"], "devops")
            self.assertIn("Role: devops", payload["prompt"])
            self.assertIn("must not perform QA or PO acceptance", payload["prompt"])
            self.assertTrue(payload["create_pull_request"])

    def test_role_specific_model_override(self):
        tmp, root = self.make_repo()
        with tmp:
            config = self.make_config(root, DF_COPILOT_AGENT_MODEL_DEVOPS="GPT-5.3-Codex")
            self.assertEqual(config.model, "gpt-5.3-codex")

    def test_token_command_fallback(self):
        tmp, root = self.make_repo()
        with tmp, patch("copilot_cloud_agent.subprocess.run") as run:
            run.return_value = subprocess.CompletedProcess(args="fake", returncode=0, stdout="ghp_FROM_COMMAND\n", stderr="")
            config = self.make_config(root, DF_GITHUB_TOKEN="", DF_GITHUB_TOKEN_COMMAND="fake-token-command")
            self.assertEqual(config.token, "ghp_FROM_COMMAND")

    def test_parse_github_remote(self):
        self.assertEqual(cca.parse_github_remote("git@github.com:Acme/FlexCMS.git"), ("Acme", "FlexCMS"))
        self.assertEqual(cca.parse_github_remote("https://github.com/Acme/FlexCMS.git"), ("Acme", "FlexCMS"))
        self.assertIsNone(cca.parse_github_remote("https://example.com/Acme/FlexCMS.git"))

    def test_redaction_hides_tokens_and_secret_fields(self):
        token = "github_pat_SECRET1234567890abcdefghijklmnopqrstuvwxyz"
        data = {
            "Authorization": f"Bearer {token}",
            "message": f"failed with {token}",
            "nested": {"token": token, "safe": "visible"},
        }
        redacted = cca.redact(data, [token])
        rendered = json.dumps(redacted)
        self.assertNotIn(token, rendered)
        self.assertIn("[REDACTED]", rendered)
        self.assertEqual(redacted["nested"]["safe"], "visible")

    def test_dry_run_writes_sanitized_status_without_board_advance(self):
        tmp, root = self.make_repo()
        with tmp:
            config = self.make_config(root, DF_COPILOT_CLOUD_DRY_RUN="true")
            result = cca.run(config)
            self.assertTrue(result["dry_run"])
            self.assertFalse(result["success"])
            board = (root / "df" / "runtime" / "board.md").read_text(encoding="utf-8")
            self.assertIn("READY_FOR_DEV", board)
            status = json.loads((root / "df" / "artifacts" / "TASK-1" / "cloud-agent-status.json").read_text())
            self.assertEqual(status["cloud_task_id"], "dry-run")
            self.assertNotIn(config.token, json.dumps(status))

    def test_dry_run_endpoint_is_not_over_redacted_without_token(self):
        tmp, root = self.make_repo()
        with tmp:
            config = self.make_config(root, DF_COPILOT_CLOUD_DRY_RUN="true", DF_GITHUB_TOKEN="")
            cca.run(config)
            status = json.loads((root / "df" / "artifacts" / "TASK-1" / "cloud-agent-status.json").read_text())
            self.assertEqual(status["endpoint"], "https://api.github.com/agents/repos/octo-org/octo-repo/tasks")

    def test_dry_run_advance_updates_board_for_adapter_contract_testing(self):
        tmp, root = self.make_repo()
        with tmp:
            config = self.make_config(root, DF_COPILOT_CLOUD_DRY_RUN="true", DF_COPILOT_CLOUD_DRY_RUN_ADVANCE="true")
            result = cca.run(config)
            self.assertTrue(result["success"])
            board = (root / "df" / "runtime" / "board.md").read_text(encoding="utf-8")
            self.assertIn("READY_FOR_QA", board)
            self.assertIn("qa", board)

    def test_poll_cloud_task_transitions_from_running_to_success(self):
        tmp, root = self.make_repo()
        with tmp, patch("copilot_cloud_agent.time.sleep", lambda _seconds: None):
            config = self.make_config(root)
            info = {"cloud_task_id": "42", "status": "queued", "status_url": "https://api.github.test/task/42"}
            client = FakeClient([
                {"id": "42", "status": "in_progress", "status_url": "https://api.github.test/task/42"},
                {"id": "42", "status": "completed", "branch": "df/cloud/TASK-1/devops"},
            ])
            result = cca.poll_cloud_task(client, config, info)
            self.assertEqual(result["status"], "completed")
            self.assertEqual(len(client.calls), 2)

    def test_aggregate_ci_detects_failure(self):
        tmp, root = self.make_repo()
        with tmp:
            config = self.make_config(root)
            client = FakeClient([
                {"check_runs": [{"name": "build", "status": "completed", "conclusion": "failure"}]},
                {"statuses": [{"context": "lint", "state": "success"}]},
            ])
            ci = cca.aggregate_ci(client, config, "df/cloud/TASK-1/devops")
            self.assertEqual(ci["state"], "failure")
            self.assertEqual(ci["summary"], "1 check runs, 1 commit statuses, 0 API errors")

    def test_live_success_updates_board_and_records_evidence(self):
        tmp, root = self.make_repo()
        with tmp, patch("copilot_cloud_agent.time.sleep", lambda _seconds: None):
            config = self.make_config(root)
            client = FakeClient([
                {
                    "id": "42",
                    "status": "queued",
                    "status_url": "https://api.github.test/task/42",
                    "branch": "df/cloud/TASK-1/devops",
                    "pull_request": {"number": 7, "html_url": "https://github.test/pr/7"},
                },
                {
                    "id": "42",
                    "status": "completed",
                    "branch": "df/cloud/TASK-1/devops",
                    "pull_request": {"number": 7, "html_url": "https://github.test/pr/7"},
                },
                {"check_runs": [{"name": "build", "status": "completed", "conclusion": "success"}]},
                {"statuses": []},
            ])
            result = cca.run(config, client=client)
            self.assertTrue(result["success"])
            board = (root / "df" / "runtime" / "board.md").read_text(encoding="utf-8")
            self.assertIn("READY_FOR_QA", board)
            status = json.loads((root / "df" / "artifacts" / "TASK-1" / "cloud-agent-status.json").read_text())
            self.assertEqual(status["cloud_task_id"], "42")
            self.assertEqual(status["ci"]["state"], "success")
            self.assertNotIn(config.token, json.dumps(status))

    def test_create_task_retries_without_unavailable_model(self):
        tmp, root = self.make_repo()
        with tmp:
            config = self.make_config(root, DF_COPILOT_AGENT_MODEL_DEVOPS="Raptor mini")
            payload = cca.build_create_payload(config)
            client = FakeClient([
                RuntimeError("GitHub API POST failed with HTTP 400: model not found or not enabled for user"),
                {"id": "99", "status": "queued"},
            ])
            response = cca.create_cloud_task(client, config, payload)
            self.assertEqual(response["id"], "99")
            self.assertEqual(len(client.calls), 2)
            self.assertIn("model", client.calls[0][2])
            self.assertNotIn("model", client.calls[1][2])
            self.assertEqual(response["model_fallback"]["requested_model"], "Raptor mini")


if __name__ == "__main__":
    unittest.main()



