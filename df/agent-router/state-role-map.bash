#!/usr/bin/env bash
# The Factory - state -> role mapping and task-selection ranking.
# Pure helpers, no side effects. Compatible with bash 3.2 (no associative arrays).

# df_role_for_state STATE -> echoes the responsible role short-name.
# Delivery states resolve to the generic "delivery" owner; the concrete lane
# (backend-dev/frontend-dev/devops/data-engineer) is read from the board row.
df_role_for_state() {
  case "$1" in
    OPEN|INTAKE|REFINEMENT_IN_PROGRESS) echo "sa" ;;
    REFINED|NEEDS_ARCHITECTURE|ARCHITECTURE_REVIEW|ARCHITECTURE_IN_PROGRESS) echo "sa" ;;
    # PO automation is disabled by human decision until further notice.
    # Product/refinement decisions remain human-owned and are not auto-routed.
    REFINEMENT_QUESTIONS) echo "" ;;
    READY_FOR_DESIGN|DESIGN_IN_PROGRESS) echo "designer" ;;
    READY_FOR_DEV|DEV_IN_PROGRESS|RETURNED_TO_DEV) echo "delivery" ;;
    READY_FOR_QA|QA_IN_PROGRESS|QA_FAILED) echo "qa" ;;
    READY_FOR_PO|PO_REVIEW|PO_REJECTED) echo "" ;;
    DONE|NO_TASKS|BLOCKED) echo "" ;;
    *) echo "" ;;
  esac
}

# df_state_is_actionable STATE -> exit 0 if a role can act on it now.
df_state_is_actionable() {
  case "$1" in
    REFINEMENT_QUESTIONS|READY_FOR_PO|PO_REVIEW|PO_REJECTED) return 1 ;;
    DONE|NO_TASKS|BLOCKED|"") return 1 ;;
    *) return 0 ;;
  esac
}

# df_state_rank STATE -> lower number = higher selection priority.
# Mirrors df/00-start-here.md "Task selection order".
df_state_rank() {
  case "$1" in
    DEV_IN_PROGRESS|DESIGN_IN_PROGRESS|QA_IN_PROGRESS|PO_REVIEW|ARCHITECTURE_IN_PROGRESS) echo 1 ;;
    RETURNED_TO_DEV) echo 2 ;;
    QA_FAILED|PO_REJECTED) echo 3 ;;
    REFINEMENT_QUESTIONS) echo 4 ;;
    READY_FOR_DESIGN|READY_FOR_DEV) echo 5 ;;
    REFINED) echo 6 ;;
    NEEDS_ARCHITECTURE|ARCHITECTURE_REVIEW) echo 7 ;;
    INTAKE|REFINEMENT_IN_PROGRESS) echo 7 ;;
    OPEN) echo 8 ;;
    *) echo 50 ;;
  esac
}
