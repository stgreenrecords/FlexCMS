#!/usr/bin/env bash
# =============================================================================
# flex -- FlexCMS Development CLI (macOS / Linux)
# =============================================================================
# Usage:
#   flex start local all                 Start everything
#   flex start local author              Infra + Author only
#   flex start local author publish      Infra + Author + Publish
#   flex start local author,publish,admin
#   flex stop local                      Stop everything
#   flex status                          Health-check all services
#   flex logs author                     Tail author log
#   flex reset                           Wipe all data & volumes
# =============================================================================

set -euo pipefail

# ── Resolve script location (follows symlinks) ──────────────────────────────
SOURCE="${BASH_SOURCE[0]}"
while [ -L "$SOURCE" ]; do
  DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
ROOT_DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"

FLEXCMS_DIR="$ROOT_DIR/flexcms"
FRONTEND_DIR="$ROOT_DIR/frontend"
COMPOSE_FILE="$ROOT_DIR/infra/local/docker-compose.dev.yml"
COMPOSE_DIR="$ROOT_DIR/infra/local"
LOG_DIR="$ROOT_DIR/.dev-logs"
PID_FILE="$LOG_DIR/.pids"

# ── Colors ───────────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  C_RESET="\033[0m"; C_CYAN="\033[36m"; C_GREEN="\033[32m"
  C_YELLOW="\033[33m"; C_RED="\033[31m"; C_DIM="\033[2m"; C_WHITE="\033[1;37m"
else
  C_RESET=""; C_CYAN=""; C_GREEN=""; C_YELLOW=""; C_RED=""; C_DIM=""; C_WHITE=""
fi

# ── Helpers ──────────────────────────────────────────────────────────────────

banner() {
  echo ""
  echo -e "  ${C_CYAN}--------------------------------------------------------${C_RESET}"
  echo -e "  ${C_CYAN}$1${C_RESET}"
  echo -e "  ${C_CYAN}--------------------------------------------------------${C_RESET}"
  echo ""
}

ensure_env() {
  local env_file="$COMPOSE_DIR/.env"
  local env_local="$COMPOSE_DIR/.env.local"
  if [ ! -f "$env_file" ]; then
    if [ -f "$env_local" ]; then
      cp "$env_local" "$env_file"
    else
      echo "POSTGRES_USER=flexcms" > "$env_file"
      echo "POSTGRES_PASSWORD=flexcms" >> "$env_file"
    fi
  fi
}

ensure_log_dir() {
  mkdir -p "$LOG_DIR"
}

save_pid() {
  # $1 = label, $2 = pid
  ensure_log_dir
  echo "$1:$2" >> "$PID_FILE"
}

write_svc() {
  # $1=name, $2=url, $3=note (optional)
  printf "    %-26s %s" "$1" "$2"
  [ -n "${3:-}" ] && printf "  ${C_DIM}%s${C_RESET}" "$3"
  echo ""
}

# ── Alias resolution ────────────────────────────────────────────────────────

resolve_alias() {
  case "$1" in
    pim|dam|cms) echo "author" ;;
    frontend|ui) echo "admin" ;;
    *)           echo "$1" ;;
  esac
}

resolve_services() {
  # If no args or "all", return everything
  if [ $# -eq 0 ] || { [ $# -eq 1 ] && [ "$1" = "all" ]; }; then
    echo "infra author publish admin"
    return
  fi
  local result="infra"  # always include infra
  for raw in "$@"; do
    # Split on commas
    IFS=',' read -ra parts <<< "$raw"
    for s in "${parts[@]}"; do
      s="$(echo "$s" | tr '[:upper:]' '[:lower:]' | xargs)"
      [ -z "$s" ] && continue
      local mapped
      mapped="$(resolve_alias "$s")"
      case "$mapped" in
        infra|author|publish|admin) ;;
        *)
          echo -e "  ${C_RED}Unknown service: '$s'${C_RESET}" >&2
          echo -e "  ${C_DIM}Valid: all, infra, author, publish, admin, pim, dam, cms, ui${C_RESET}" >&2
          exit 1
          ;;
      esac
      # Add if not already present
      case " $result " in
        *" $mapped "*) ;;
        *) result="$result $mapped" ;;
      esac
    done
  done
  echo "$result"
}

has_service() {
  # $1=service, $2=service list (space-separated)
  case " $2 " in
    *" $1 "*) return 0 ;;
    *) return 1 ;;
  esac
}

# ── Service launchers ────────────────────────────────────────────────────────

start_infra() {
  banner "Infrastructure  (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch, pgAdmin)"
  ensure_env
  docker compose -f "$COMPOSE_FILE" up -d 2>&1 | sed 's/^/    /'

  echo -ne "    ${C_YELLOW}Waiting for healthy...${C_RESET}"
  for i in $(seq 1 30); do
    sleep 2
    pg=$(docker exec flexcms-postgres pg_isready -U flexcms 2>/dev/null || true)
    rd=$(docker exec flexcms-redis redis-cli ping 2>/dev/null || true)
    if echo "$pg" | grep -q "accepting" && echo "$rd" | grep -q "PONG"; then
      echo -e " ${C_GREEN}OK${C_RESET}"
      return
    fi
    echo -n "."
  done
  echo -e " ${C_YELLOW}still starting (check 'flex status')${C_RESET}"
}

start_backend_service() {
  # $1=profile, $2=label, $3=port, $4=log_name
  local profile="$1" label="$2" port="$3" log_name="$4"
  ensure_log_dir
  local log_file="$LOG_DIR/${log_name}.log"

  banner "$label  :$port"
  (
    cd "$FLEXCMS_DIR"
    mvn spring-boot:run -pl flexcms-app -Dspring-boot.run.profiles="$profile" \
      > "$log_file" 2>&1
  ) &
  local pid=$!
  save_pid "$log_name" "$pid"
  echo -e "    ${C_DIM}PID $pid  |  Log: $log_file${C_RESET}"
}

start_author()  { start_backend_service "author,local"  "Author  (Content + DAM + PIM read-write)" "8080" "author"; }
start_publish() { start_backend_service "publish,local" "Publish  (Content + DAM read-only)"       "8081" "publish"; }

start_admin() {
  ensure_log_dir
  local log_file="$LOG_DIR/admin.log"
  local admin_dir="$FRONTEND_DIR/apps/admin"

  banner "Admin UI  (Next.js)  :3000"
  (
    cd "$FRONTEND_DIR"
    pnpm install --silent >/dev/null 2>&1 || true
    cd "$admin_dir"
    pnpm dev > "$log_file" 2>&1
  ) &
  local pid=$!
  save_pid "admin" "$pid"
  echo -e "    ${C_DIM}PID $pid  |  Log: $log_file${C_RESET}"
}

# ── Commands ─────────────────────────────────────────────────────────────────

cmd_start() {
  local sub="${1:-}"
  shift || true
  if [ "$sub" != "local" ]; then
    echo -e "  ${C_RED}Usage: flex start local [services...]${C_RESET}"
    echo -e "  ${C_DIM}Example: flex start local all${C_RESET}"
    exit 1
  fi

  local services
  services="$(resolve_services "$@")"

  banner "FlexCMS -- Starting: $(echo "$services" | tr ' ' ' + ')"

  # 1) Infra
  if has_service "infra" "$services"; then
    start_infra
  fi

  # 2) Compile backend once
  local backend_ok=true
  if has_service "author" "$services" || has_service "publish" "$services"; then
    echo -e "    ${C_YELLOW}Compiling backend...${C_RESET}"
    # Run Maven without -q so compile errors are visible; indent output
    set +e  # disable errexit so we can capture the exit code
    (cd "$FLEXCMS_DIR" && mvn clean compile -B 2>&1) | sed 's/^/    /'
    local mvn_exit=${PIPESTATUS[0]}
    set -e
    if [ "$mvn_exit" -ne 0 ]; then
      backend_ok=false
      echo ""
      echo -e "    ${C_RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
      echo -e "    ${C_RED}ERROR: Maven compile failed (exit code $mvn_exit)${C_RESET}"
      echo -e "    ${C_RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
      echo -e "    ${C_YELLOW}Fix the compilation errors above, then run:${C_RESET}"
      echo -e "    ${C_WHITE}  flex start local author${C_RESET}   ${C_DIM}(or whichever services you need)${C_RESET}"
      echo ""
      echo -e "    ${C_DIM}Infrastructure is still running. Non-backend services will still start.${C_RESET}"
      echo ""
    else
      echo -e "    ${C_GREEN}Build OK${C_RESET}"
    fi
  fi

  # 3) Author (skip if compile failed)
  if has_service "author" "$services"; then
    if [ "$backend_ok" = true ]; then
      start_author
    else
      echo -e "    ${C_YELLOW}Skipping Author — backend compile failed${C_RESET}"
    fi
  fi

  # 4) Publish (skip if compile failed)
  if has_service "publish" "$services"; then
    if [ "$backend_ok" = true ]; then
      has_service "author" "$services" && sleep 5
      start_publish
    else
      echo -e "    ${C_YELLOW}Skipping Publish — backend compile failed${C_RESET}"
    fi
  fi

  # 5) Admin UI (always starts — no backend dependency)
  if has_service "admin" "$services"; then
    start_admin
  fi

  # Summary
  echo ""
  echo -e "    ${C_WHITE}SERVICE                    URL${C_RESET}"
  echo -e "    ${C_DIM}$(printf '%0.s-' {1..48})${C_RESET}"
  if has_service "infra" "$services"; then
    write_svc "PostgreSQL"    "localhost:5432"
    write_svc "Redis"         "localhost:6379"
    write_svc "RabbitMQ"      "localhost:5672"       "mgmt :15672"
    write_svc "MinIO (S3)"    "localhost:9000"       "console :9001"
    write_svc "Elasticsearch" "localhost:9200"
    write_svc "pgAdmin 4 (DB)" "localhost:5050"      "no login · DB pwd: flexcms"
  fi
  if [ "$backend_ok" = true ]; then
    has_service "author"  "$services" && write_svc "Author (CMS+DAM+PIM)" "localhost:8080" ".dev-logs/author.log"
    has_service "publish" "$services" && write_svc "Publish (read-only)"  "localhost:8081" ".dev-logs/publish.log"
  else
    has_service "author"  "$services" && echo -e "    ${C_RED}Author (CMS+DAM+PIM)       SKIPPED  (compile error)${C_RESET}"
    has_service "publish" "$services" && echo -e "    ${C_RED}Publish (read-only)        SKIPPED  (compile error)${C_RESET}"
  fi
  has_service "admin"   "$services" && write_svc "Admin UI"             "localhost:3000" ".dev-logs/admin.log"
  echo ""
  echo -e "    ${C_DIM}flex status      check health${C_RESET}"
  echo -e "    ${C_DIM}flex stop local  stop everything${C_RESET}"
  echo -e "    ${C_DIM}flex logs author tail logs${C_RESET}"
  echo ""
  if [ "$backend_ok" = false ]; then
    echo -e "    ${C_YELLOW}⚠  Backend was not started due to compile errors.${C_RESET}"
    echo -e "    ${C_YELLOW}   Fix the errors and run: flex start local author${C_RESET}"
    echo ""
  fi
}

cmd_stop() {
  banner "Stopping all FlexCMS services"

  # Kill tracked PIDs
  if [ -f "$PID_FILE" ]; then
    while IFS=: read -r label pid; do
      if kill -0 "$pid" 2>/dev/null; then
        echo -e "    ${C_DIM}Stopping $label (PID $pid)${C_RESET}"
        kill "$pid" 2>/dev/null || true
        # Wait briefly, then force
        sleep 1
        kill -9 "$pid" 2>/dev/null || true
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  # Also kill any remaining flexcms Java processes
  pkill -f "spring-boot.*flexcms" 2>/dev/null || true

  # Kill any Next.js dev for admin
  pkill -f "next dev.*admin" 2>/dev/null || true

  # Stop containers
  ensure_env
  docker compose -f "$COMPOSE_FILE" --profile full down 2>&1 | sed 's/^/    /'
  echo ""
  echo -e "    ${C_GREEN}All stopped.${C_RESET}"
  echo ""
}

cmd_status() {
  banner "FlexCMS Service Status"

  check_docker() {
    local name="$1" cmd="$2" expect="$3"
    local out
    out=$(eval "$cmd" 2>/dev/null || true)
    if echo "$out" | grep -q "$expect"; then
      echo -e "    ${C_GREEN}UP${C_RESET}  $name"
    else
      echo -e "    ${C_DIM}--  $name${C_RESET}"
    fi
  }

  check_http() {
    local name="$1" url="$2"
    if curl -sf --max-time 3 "$url" >/dev/null 2>&1; then
      echo -e "    ${C_GREEN}UP${C_RESET}  $name"
    else
      echo -e "    ${C_DIM}--  $name${C_RESET}"
    fi
  }

  check_docker "PostgreSQL     :5432" "docker exec flexcms-postgres pg_isready -U flexcms" "accepting"
  check_docker "Redis          :6379" "docker exec flexcms-redis redis-cli ping"           "PONG"
  check_http   "RabbitMQ       :5672" "http://localhost:15672"
  check_http   "MinIO          :9000" "http://localhost:9001"
  check_http   "Elasticsearch  :9200" "http://localhost:9200"
  check_http   "pgAdmin 4      :5050" "http://localhost:5050"
  check_http   "Author API     :8080" "http://localhost:8080/actuator/health"
  check_http   "Publish API    :8081" "http://localhost:8081/actuator/health"
  check_http   "Admin UI       :3000" "http://localhost:3000"
  echo ""
}

cmd_logs() {
  local target="${1:-author}"
  local log_file="$LOG_DIR/${target}.log"
  if [ -f "$log_file" ]; then
    echo -e "  ${C_CYAN}Tailing $log_file  (Ctrl+C to stop)${C_RESET}"
    tail -f -n 100 "$log_file"
  else
    echo -e "  ${C_RED}Log not found: $log_file${C_RESET}"
    if [ -d "$LOG_DIR" ]; then
      echo -e "  ${C_DIM}Available: $(ls "$LOG_DIR"/*.log 2>/dev/null | xargs -n1 basename 2>/dev/null | tr '\n' ', ')${C_RESET}"
    fi
  fi
}

cmd_reset() {
  banner "Resetting all data (volumes will be deleted)"
  ensure_env
  docker compose -f "$COMPOSE_FILE" --profile full down -v 2>&1 | sed 's/^/    /'
  [ -d "$LOG_DIR" ] && rm -rf "$LOG_DIR"
  echo -e "    ${C_GREEN}Done. Run 'flex start local all' to start fresh.${C_RESET}"
  echo ""
}

cmd_help() {
  cat <<'EOF'

  flex -- FlexCMS Development CLI
  --------------------------------------------

  USAGE
    flex start local <services...>     Start services
    flex stop  local                   Stop everything
    flex status                        Health-check all
    flex logs  <service>               Tail service log
    flex reset                         Wipe all data & volumes

  SERVICES (pick any combination)
    all        Everything (infra + author + publish + admin)
    infra      PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch
    author     Author backend -- CMS + DAM + PIM (read-write)  :8080
    publish    Publish backend -- CMS + DAM (read-only)         :8081
    admin      Admin UI -- Next.js                              :3000

  ALIASES (map to the service that contains them)
    pim        -> author   (PIM is part of the Author instance)
    dam        -> author   (DAM is part of the Author instance)
    cms        -> author
    ui         -> admin
    frontend   -> admin

  EXAMPLES
    flex start local all                 Start everything
    flex start local author              Infra + Author only
    flex start local author publish      Infra + Author + Publish
    flex start local author,publish,admin   Comma-separated works too
    flex start local pim                 Infra + Author (PIM lives in Author)
    flex stop local                      Stop all services
    flex logs author                     Tail Author backend log
    flex status                          Check what's running

EOF
}

# ── Main dispatch ────────────────────────────────────────────────────────────

case "${1:-help}" in
  start)  shift; cmd_start "$@" ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  logs)   shift; cmd_logs "$@" ;;
  reset)  cmd_reset ;;
  *)      cmd_help ;;
esac

