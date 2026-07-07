#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
TMP_ROOT="$(mktemp -d -t df-router-test.XXXXXX)"
trap 'rm -rf "$TMP_ROOT"' EXIT

copy_router() {
  mkdir -p "$TMP_ROOT/df/agent-router"
  cp "$SOURCE_ROOT/df/agent-router/start-factory.bash" "$TMP_ROOT/df/agent-router/"
  cp "$SOURCE_ROOT/df/agent-router/board-parser.bash" "$TMP_ROOT/df/agent-router/"
  cp "$SOURCE_ROOT/df/agent-router/state-role-map.bash" "$TMP_ROOT/df/agent-router/"
  cp "$SOURCE_ROOT/df/agent-router/quality-gate.bash" "$TMP_ROOT/df/agent-router/"
  cp "$SOURCE_ROOT/df/agent-router/render-subboards.bash" "$TMP_ROOT/df/agent-router/"
  cp "$SOURCE_ROOT/df/agent-router/worktree-manager.bash" "$TMP_ROOT/df/agent-router/"
}

write_task() {
  local task_id="$1"
  local state="$2"
  local deps="$3"

  mkdir -p "$TMP_ROOT/df/artifacts/$task_id"
  cat > "$TMP_ROOT/df/artifacts/$task_id/task.md" <<EOF
# Task - $task_id

## Current state

$state

## Dependencies
$deps

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-05-29 00:00 local | sa | $state | Test fixture |
EOF
}

write_board() {
  cat > "$TMP_ROOT/df/runtime/board.md" <<'EOF'
# The Factory Runtime Board

| Priority | Task ID | Title | Type | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|---|
| P0 | TASK-001 | Dependency | Task | DONE | factory | No | 2026-05-29 00:00 local | closed |
| P0 | TASK-002 | Blocked child | Task | BLOCKED | factory | Yes | 2026-05-29 00:00 local | wait for TASK-001 |
EOF
}

write_board_with_actionable() {
  cat > "$TMP_ROOT/df/runtime/board.md" <<'EOF'
# The Factory Runtime Board

| Priority | Task ID | Title | Type | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|---|
| P0 | TASK-001 | Dependency | Task | DONE | factory | No | 2026-05-29 00:00 local | closed |
| P0 | TASK-002 | Blocked child | Task | BLOCKED | factory | Yes | 2026-05-29 00:00 local | wait for TASK-001 |
| P0 | TASK-003 | Ready QA item | Task | READY_FOR_QA | qa | No | 2026-05-29 00:00 local | qa review |
EOF
}

run_router() {
  (cd "$TMP_ROOT" && bash "$TMP_ROOT/df/agent-router/start-factory.bash" --dry-run 2>&1)
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  if ! printf '%s' "$haystack" | grep -Fq -- "$needle"; then
    printf 'Expected output to contain: %s\n' "$needle" >&2
    printf 'Actual output:\n%s\n' "$haystack" >&2
    exit 1
  fi
}

assert_not_contains() {
  local haystack="$1"
  local needle="$2"
  if printf '%s' "$haystack" | grep -Fq -- "$needle"; then
    printf 'Did not expect output to contain: %s\n' "$needle" >&2
    printf 'Actual output:\n%s\n' "$haystack" >&2
    exit 1
  fi
}

copy_router
mkdir -p "$TMP_ROOT/df/runtime"

write_board
write_task "TASK-001" "DONE" ""
write_task "TASK-002" "BLOCKED" "- TASK-001"

output="$(run_router)"
assert_contains "$output" "role='sa' task='TASK-002' state='BLOCKED'"
assert_contains "$output" "Role: sa"
assert_contains "$output" "Task: TASK-002"

write_board_with_actionable
output="$(run_router)"
assert_contains "$output" "role='qa' task='TASK-003' state='READY_FOR_QA'"
assert_not_contains "$output" "task='TASK-002' state='BLOCKED'"

write_board
write_task "TASK-002" "BLOCKED" "- TASK-999"
output="$(run_router)"
assert_contains "$output" "no actionable tasks remain"
assert_not_contains "$output" "task='TASK-002'"

printf 'PASS: blocked-task dependency resumption behaves as expected.\n'

