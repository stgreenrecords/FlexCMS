#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DF_ENV_FILE="${DF_FACTORY_ENV_FILE:-$SCRIPT_DIR/.df-factory.env}"

if [ -f "$DF_ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$DF_ENV_FILE"
  set +a
fi

exec "${BASH:-bash}" "$SCRIPT_DIR/df/agent-router/start-factory.bash" "$@"

