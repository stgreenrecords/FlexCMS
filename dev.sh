#!/usr/bin/env bash
# =============================================================================
# FlexCMS — Local Development Helper
# =============================================================================
# Quick commands for the most common local development tasks.
#
# Usage:
#   ./dev.sh infra          Start infrastructure services
#   ./dev.sh infra:stop     Stop infrastructure services
#   ./dev.sh infra:reset    Stop + delete volumes (fresh start)
#   ./dev.sh backend        Build + run Author backend
#   ./dev.sh backend:publish  Run Publish backend
#   ./dev.sh frontend       Install + run Admin UI
#   ./dev.sh full            Start everything in Docker
#   ./dev.sh status         Show service status
#   ./dev.sh logs <svc>     Tail logs for a service
#   ./dev.sh test:api       Quick smoke test of Author API
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}"
COMPOSE_DIR="${ROOT_DIR}/infra/local"
COMPOSE_FILE="${COMPOSE_DIR}/docker-compose.dev.yml"

red()    { echo -e "\033[31m$*\033[0m"; }
green()  { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue()   { echo -e "\033[34m$*\033[0m"; }

ensure_env() {
  if [[ ! -f "${COMPOSE_DIR}/.env" ]]; then
    yellow ">>> .env not found — copying from .env.local"
    cp "${COMPOSE_DIR}/.env.local" "${COMPOSE_DIR}/.env"
  fi
}

cmd_infra() {
  ensure_env
  blue ">>> Starting infrastructure services (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch)..."
  docker compose -f "${COMPOSE_FILE}" up -d
  green ">>> Infrastructure started! Waiting for health checks..."
  sleep 5
  docker compose -f "${COMPOSE_FILE}" ps
  echo ""
  green "Ready! Services:"
  echo "  PostgreSQL:     localhost:5432 (flexcms/flexcms)"
  echo "  Redis:          localhost:6379"
  echo "  RabbitMQ:       localhost:5672  (console: http://localhost:15672)"
  echo "  MinIO (S3):     localhost:9000  (console: http://localhost:9001)"
  echo "  Elasticsearch:  localhost:9200"
}

cmd_infra_stop() {
  blue ">>> Stopping infrastructure services..."
  docker compose -f "${COMPOSE_FILE}" --profile full down
  green ">>> Stopped."
}

cmd_infra_reset() {
  yellow ">>> Stopping services and deleting ALL data volumes..."
  docker compose -f "${COMPOSE_FILE}" --profile full down -v
  green ">>> Clean slate. Run './dev.sh infra' to start fresh."
}

cmd_backend() {
  blue ">>> Building and starting Author backend (Content + DAM + PIM)..."
  cd "${ROOT_DIR}/flexcms"
  mvn clean compile -B -q
  green ">>> Build complete. Starting on http://localhost:8080 ..."
  mvn spring-boot:run -pl flexcms-app -Dspring-boot.run.profiles=author
}

cmd_backend_publish() {
  blue ">>> Starting Publish backend on http://localhost:8081 ..."
  cd "${ROOT_DIR}/flexcms"
  mvn spring-boot:run -pl flexcms-app -Dspring-boot.run.profiles=publish
}

cmd_frontend() {
  blue ">>> Installing dependencies and starting Admin UI..."
  cd "${ROOT_DIR}/frontend"
  pnpm install
  cd apps/admin
  green ">>> Admin UI starting on http://localhost:3000 ..."
  pnpm dev
}

cmd_full() {
  ensure_env
  blue ">>> Starting FULL stack in Docker (infra + author + publish + admin UI)..."
  docker compose -f "${COMPOSE_FILE}" --profile full up -d --build
  green ">>> Full stack starting. Use './dev.sh status' to check progress."
}

cmd_status() {
  docker compose -f "${COMPOSE_FILE}" --profile full ps 2>/dev/null || docker compose -f "${COMPOSE_FILE}" ps
  echo ""

  # Check Author health
  if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
    green "✓ Author API (localhost:8080) is healthy"
  else
    yellow "✗ Author API (localhost:8080) is not responding"
  fi

  # Check Publish health
  if curl -sf http://localhost:8081/actuator/health > /dev/null 2>&1; then
    green "✓ Publish API (localhost:8081) is healthy"
  else
    yellow "✗ Publish API (localhost:8081) is not responding"
  fi

  # Check Admin UI
  if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    green "✓ Admin UI (localhost:3000) is running"
  else
    yellow "✗ Admin UI (localhost:3000) is not responding"
  fi
}

cmd_logs() {
  local svc="${1:-author}"
  docker compose -f "${COMPOSE_FILE}" --profile full logs -f "${svc}"
}

cmd_test_api() {
  blue ">>> Smoke testing Author API..."
  echo ""

  echo "1. Health check:"
  curl -sf http://localhost:8080/actuator/health | python3 -m json.tool 2>/dev/null || curl -sf http://localhost:8080/actuator/health || red "   FAILED"
  echo ""

  echo "2. Info endpoint:"
  curl -sf http://localhost:8080/actuator/info | python3 -m json.tool 2>/dev/null || echo "   (empty — OK)"
  echo ""

  echo "3. Prometheus metrics (sample):"
  curl -sf http://localhost:8080/actuator/prometheus | head -5 || red "   FAILED"
  echo ""

  green ">>> Smoke test complete."
}

# =============================================================================
# Main dispatcher
# =============================================================================
case "${1:-help}" in
  infra)          cmd_infra ;;
  infra:stop)     cmd_infra_stop ;;
  infra:reset)    cmd_infra_reset ;;
  backend)        cmd_backend ;;
  backend:publish) cmd_backend_publish ;;
  frontend)       cmd_frontend ;;
  full)           cmd_full ;;
  status)         cmd_status ;;
  logs)           cmd_logs "${2:-}" ;;
  test:api)       cmd_test_api ;;
  *)
    echo "FlexCMS Development Helper"
    echo ""
    echo "Usage: ./dev.sh <command>"
    echo ""
    echo "Infrastructure:"
    echo "  infra          Start PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch"
    echo "  infra:stop     Stop all services"
    echo "  infra:reset    Stop + delete all data (fresh start)"
    echo ""
    echo "Application:"
    echo "  backend        Build + run Author backend (Content + DAM + PIM)"
    echo "  backend:publish  Run Publish backend (headless delivery)"
    echo "  frontend       Run Admin UI (Next.js dev mode)"
    echo "  full           Start everything in Docker"
    echo ""
    echo "Utilities:"
    echo "  status         Show health status of all services"
    echo "  logs <svc>     Tail logs (author|publish|postgres|redis|rabbitmq|...)"
    echo "  test:api       Quick smoke test of Author endpoints"
    ;;
esac

