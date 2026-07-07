#!/usr/bin/env bash
# The Factory - tests for the router-enforced quality gate and rework cap.
#
# Exercises start-factory.bash end-to-end with the auto adapter and a fake agent
# that deterministically advances the board, verifying that:
#   1. a FAILING gate overrides a delivery lane's READY_FOR_QA claim and routes
#      the task back to RETURNED_TO_DEV;
#   2. repeated failures hit the rework cap and force the task to BLOCKED;
#   3. a PASSING gate lets the task flow through to DONE untouched;
#   4. an unset gate is skipped (with a warning) and does not block flow.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
TMP_ROOT="$(mktemp -d -t df-gate-test.XXXXXX)"
trap 'rm -rf "$TMP_ROOT"' EXIT

ROUTER_DIR="$TMP_ROOT/df/agent-router"
BOARD="$TMP_ROOT/df/runtime/board.md"

setup() {
  mkdir -p "$ROUTER_DIR" "$TMP_ROOT/df/runtime" "$TMP_ROOT/df/artifacts"
  for f in start-factory.bash board-parser.bash state-role-map.bash quality-gate.bash render-subboards.bash worktree-manager.bash; do
    cp "$SOURCE_ROOT/df/agent-router/$f" "$ROUTER_DIR/"
  done

  # Fake agent: advances the task one step per session so the loop progresses.
  cat > "$TMP_ROOT/fake-agent.bash" <<AGENT
#!/usr/bin/env bash
set -euo pipefail
role="\$1"; task="\$2"; state="\$3"
. "$ROUTER_DIR/board-parser.bash"
. "$ROUTER_DIR/quality-gate.bash"
case "\$state" in
  READY_FOR_DEV|RETURNED_TO_DEV|DEV_IN_PROGRESS) df_set_board_state "$BOARD" "\$task" READY_FOR_QA qa "ready for verification" ;;
  READY_FOR_QA|QA_IN_PROGRESS) df_set_board_state "$BOARD" "\$task" READY_FOR_PO po "qa passed" ;;
  READY_FOR_PO|PO_REVIEW) df_set_board_state "$BOARD" "\$task" DONE factory "accepted" ;;
esac
echo "fake-agent: \$role advanced \$task from \$state"
AGENT
  chmod +x "$TMP_ROOT/fake-agent.bash"
}

reset_board() {
  cat > "$BOARD" <<'EOF'
# The Factory Runtime Board

| Priority | Task ID | Title | Type | State | Owner role | Blocked? | Last updated | Next action |
|---|---|---|---|---|---|---|---|---|
| P2 | TASK-002 | Add API endpoint | Story | READY_FOR_DEV | backend-dev | No | 2026-05-29 16:00 local | Implement handler |

## Queue notes
- note
EOF
  : > "$TMP_ROOT/df/runtime/activity-log.md"
}

final_state() {
  ( . "$ROUTER_DIR/board-parser.bash"; df_parse_board "$BOARD" | awk -F'\t' '$2=="TASK-002"{print $3}' )
}

run_router() {
  ( cd "$TMP_ROOT" && DF_AGENT_CMD="$TMP_ROOT/fake-agent.bash" DF_FACTORY_MAX_PARALLEL=1 \
      "$@" bash "$ROUTER_DIR/start-factory.bash" --max-iterations 25 2>&1 )
}

fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }

setup

# 1 + 2: failing gate overrides READY_FOR_QA and the rework cap forces BLOCKED.
reset_board
out="$(DF_GATE_CMD='exit 1' DF_MAX_REWORK=3 run_router)"
printf '%s' "$out" | grep -Fq "quality gate FAILED for task='TASK-002'" \
  || fail "expected gate failure override log"
printf '%s' "$out" | grep -Fq "rework cycle 3/3" \
  || fail "expected rework cap to reach 3/3"
printf '%s' "$out" | grep -Fq "Forcing BLOCKED" \
  || fail "expected force-BLOCKED at rework cap"
[ "$(final_state)" = "BLOCKED" ] || fail "expected final state BLOCKED, got '$(final_state)'"

# 3: passing gate lets the task flow all the way to DONE.
reset_board
out="$(DF_GATE_CMD='exit 0' DF_MAX_REWORK=3 run_router)"
printf '%s' "$out" | grep -Fq "quality gate PASSED for task='TASK-002'" \
  || fail "expected gate pass log"
printf '%s' "$out" | grep -Fq "quality gate FAILED" \
  && fail "did not expect any gate failure on the passing path"
[ "$(final_state)" = "DONE" ] || fail "expected final state DONE, got '$(final_state)'"

# 4: unset gate is skipped with a warning and does not block flow.
reset_board
out="$(DF_MAX_REWORK=3 run_router)"
printf '%s' "$out" | grep -Fq "DF_GATE_CMD is not set" \
  || fail "expected disabled-gate warning"
[ "$(final_state)" = "DONE" ] || fail "expected final state DONE with gate disabled, got '$(final_state)'"

printf 'PASS: quality gate override, rework cap, pass-through, and disabled-gate behave as expected.\n'
