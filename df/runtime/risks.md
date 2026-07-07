# The Factory Risks and Blockers

| ID | Risk/blocker | Severity | Owner | Status | Mitigation |
|---|---|---|---|---|---|
| R-REB-001 | Browser-captured remote assets may be unavailable, volatile, blocked, or not licensed for repository/runtime use. | High | designer/devops | Open | Capture through Selenium into manifests, record license/source metadata, and mark unavailable/disallowed resources as blockers instead of silently embedding them. |
| R-REB-002 | Seed reset can delete non-demo data if path/resource/environment guards are insufficient. | Critical | data-engineer | Open | Reset only deterministic TUT/demo records, require explicit confirmation flag, refuse production/unknown environments by default, and record before/after counts. |
| R-REB-003 | Full frontend reimplementation can start before component/template contracts stabilize, causing large rework. | High | sa/frontend-dev | Open | Enforce dependencies: design normalization and contract generation precede frontend renderer/template work. |
| R-REB-004 | Moving to Selenium may reduce existing automation coverage if Playwright is removed too early. | Medium | devops/qa | Open | Retain Playwright until Selenium suites pass and PO accepts replacement coverage. |
| R-REB-005 | The 406-component inventory is too large for a single frontend task. | High | sa/frontend-dev | Open | Implement contracts and renderers by grouped/prioritized component batches; keep each delivery task single-lane and evidence-based. |
| R-DFCA-001 | GitHub Copilot Cloud Agent task API is public preview and may change endpoint, headers, request schema, or response schema. | High | devops | Open | Isolate all REST calls in one client layer, document exact verified API version/headers, provide dry-run/mock tests, and keep manual/local adapters as rollback. |
| R-DFCA-002 | Cloud-agent token permissions or logs could expose repository secrets if not handled carefully. | Critical | devops | Open | Use environment-only credentials, document least-privilege permissions, redact authorization/token values from all logs/artifacts, and add tests for redaction. |

