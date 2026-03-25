# FlexCMS — Deployment & Operations Guide

> Version: 1.0 | Updated: 2026-03-25

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Application Deployment Model](#2-application-deployment-model)
3. [Local Development Setup](#3-local-development-setup)
4. [AWS QA Environment](#4-aws-qa-environment)
5. [AWS Production Environment](#5-aws-production-environment)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Scaling Strategy](#7-scaling-strategy)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Disaster Recovery](#9-disaster-recovery)
10. [Runbook — Common Operations](#10-runbook--common-operations)

---

## 1. Architecture Overview

FlexCMS is a headless CMS with three independent functional pillars:

| Pillar | Purpose | API Prefix | Storage |
|--------|---------|------------|---------|
| **Content (CMS)** | Pages, components, content tree, workflows, replication | `/api/author/*`, `/api/content/*` | PostgreSQL (ltree) |
| **Digital Assets (DAM)** | Binary assets, renditions, metadata | `/api/dam/*` | PostgreSQL + S3 |
| **Products (PIM)** | Product catalog, schemas, variants, import | `/api/pim/*` | PostgreSQL (separate DB) |

**Critical design decision:** All three pillars are packaged into a **single Spring Boot application** (`flexcms-app`). There is ONE Docker image, deployed in two modes:

| Mode | Spring Profile | Behavior |
|------|---------------|----------|
| **Author** | `author` | Read-write. Content editing, DAM upload, PIM management, workflows |
| **Publish** | `publish` | Read-only. Headless delivery, receives replicated content via RabbitMQ |

```
┌───────────────────────────────────────────────────────┐
│              flexcms-app (single JAR)                 │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │   CMS Core  │  │     DAM     │  │     PIM      │ │
│  │  (content   │  │  (assets,   │  │  (products,  │ │
│  │   tree,     │  │  renditions,│  │  catalogs,   │ │
│  │   i18n,     │  │  S3 storage)│  │  schemas)    │ │
│  │   workflow)  │  │             │  │              │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘ │
│         │                │                 │          │
│    flexcms_author   S3 bucket        flexcms_pim     │
│    flexcms_publish                   (separate DB)   │
└───────────────────────────────────────────────────────┘
```

### Database Topology

| Database | Owner | Contains |
|----------|-------|----------|
| `flexcms_author` | Author instances | Content nodes (ltree), components, workflows, DAM metadata, sites, languages |
| `flexcms_publish` | Publish instances | Replicated content (read-only copy of author content after publish action) |
| `flexcms_pim` | Both Author & Publish | Products, catalogs, schemas, variants — shared because PIM has its own transaction manager |

### Infrastructure Dependencies

| Service | Local (Docker) | AWS |
|---------|---------------|-----|
| PostgreSQL 16 | `postgres:16-alpine` | RDS PostgreSQL 16 |
| Redis 7 | `redis:7-alpine` | ElastiCache Redis 7 |
| RabbitMQ 3 | `rabbitmq:3-management-alpine` | Amazon MQ (RabbitMQ) |
| S3-compatible storage | MinIO | Amazon S3 |
| Full-text search | Elasticsearch 8.13 | Amazon OpenSearch (future) |

---

## 2. Application Deployment Model

### Build Artifact

```
mvn clean package -DskipTests
→ flexcms-app/target/flexcms-app-1.0.0-SNAPSHOT.jar (layered Spring Boot JAR)
```

### Docker Image

```
ghcr.io/<org>/flexcms-app:<tag>
```

Tags:
- `latest` — most recent main build
- `sha-<7chars>` — specific commit SHA (immutable, used for deployments)

### Runtime Configuration

The same image serves both Author and Publish — behavior is controlled by environment variables:

| Variable | Author Value | Publish Value |
|----------|-------------|---------------|
| `SPRING_PROFILES_ACTIVE` | `author` | `publish` |
| `SERVER_PORT` | `8080` | `8081` |
| `SPRING_DATASOURCE_URL` | `...flexcms_author` | `...flexcms_publish` |
| `FLEXCMS_PIM_DATASOURCE_URL` | `...flexcms_pim` | `...flexcms_pim` |
| All DAM/Redis/RabbitMQ/ES vars | Same for both | Same for both |

---

## 3. Local Development Setup

### Prerequisites

- Java 21 (Temurin recommended)
- Maven 3.9+
- Docker Desktop (for infrastructure services)
- Node.js 20 + pnpm 9 (for frontend)

### Three Development Modes

#### Mode A: IDE-First (Recommended — fastest iteration)

Best for daily backend/frontend development. Infrastructure in Docker, apps from IDE.

```bash
# Terminal 1: Start infrastructure
cd infra/local
cp .env.local .env                      # first time only
docker compose -f docker-compose.dev.yml up -d

# Terminal 2: Run Author backend (hot-reload with spring-boot-devtools)
cd flexcms
mvn clean compile
mvn spring-boot:run -pl flexcms-app -Dspring-boot.run.profiles=author

# Terminal 3 (optional): Run Publish backend
mvn spring-boot:run -pl flexcms-app -Dspring-boot.run.profiles=publish

# Terminal 4: Run Admin UI with hot-reload
cd frontend
pnpm install
cd apps/admin
pnpm dev
```

#### Mode B: Backend in Docker

Tests the actual Docker image locally. Slower iteration.

```bash
cd infra/local
docker compose -f docker-compose.dev.yml --profile app up -d --build
```

#### Mode C: Full-Stack Docker

Mirrors the CI environment exactly. Useful before merging to main.

```bash
cd infra/local
docker compose -f docker-compose.dev.yml --profile full up -d --build
```

### Local Endpoint Map

| Service | URL |
|---------|-----|
| Author API (Content + DAM + PIM) | http://localhost:8080 |
| Publish API (headless delivery) | http://localhost:8081 |
| Admin UI (Next.js) | http://localhost:3000 |
| GraphiQL | http://localhost:8080/graphiql |
| Health Check (Author) | http://localhost:8080/actuator/health |
| Health Check (Publish) | http://localhost:8081/actuator/health |
| PostgreSQL | `localhost:5432` (flexcms/flexcms) |
| RabbitMQ Console | http://localhost:15672 (guest/guest) |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin) |
| Elasticsearch | http://localhost:9200 |

### Cleanup

```bash
# Stop everything
cd infra/local
docker compose -f docker-compose.dev.yml --profile full down

# Stop + delete data volumes
docker compose -f docker-compose.dev.yml --profile full down -v
```

---

## 4. AWS QA Environment

### Sizing

| Component | Configuration |
|-----------|--------------|
| Author ECS Tasks | **1** × Fargate (1 vCPU, 2 GB) |
| Publish ECS Tasks | **2** × Fargate + Spot (1 vCPU, 2 GB), auto-scale to **6** |
| RDS PostgreSQL | db.t3.medium, single-AZ, 50 GB |
| ElastiCache Redis | cache.t3.micro, 1 node |
| Amazon MQ | mq.m5.large, single instance |

### Auto-Deploy

QA receives automatic deployments after every successful CI build on `main`:

```
Push to main → CI (build+test) → Docker image → GHCR → Deploy to QA
```

No manual intervention required.

### Manual Deploy

```bash
# GitHub Actions UI
Go to Actions → Deploy Environment → Run workflow → environment=qa

# CLI
bash infra/scripts/deploy.sh --env qa --action update --image-tag sha-abc1234
```

---

## 5. AWS Production Environment

### Sizing

| Component | Configuration |
|-----------|--------------|
| Author ECS Tasks | **2** × Fargate (2 vCPU, 4 GB) — fixed count |
| Publish ECS Tasks | **5→20** × Fargate + Spot (2 vCPU, 4 GB) — auto-scaling |
| RDS PostgreSQL | db.r6g.large, Multi-AZ, encrypted, 100 GB |
| ElastiCache Redis | cache.r6g.large, 2 nodes, Multi-AZ |
| Amazon MQ | mq.m5.large, HA cluster |
| CloudFront | Yes — CDN caching for publish API |

### Deployment Process

1. **Manual trigger only** — production never auto-deploys
2. Go to **Actions → Deploy Environment**
3. Select `prod`, specify the image tag (use a SHA tag tested in QA)
4. Deployment uses ECS rolling update — zero downtime

### Production Deploy Checklist

- [ ] Feature was tested in QA for ≥24h
- [ ] No regressions in QA monitoring dashboards
- [ ] DB migrations (if any) reviewed and tested
- [ ] Image tag matches what was validated in QA
- [ ] Stakeholders notified

---

## 6. CI/CD Pipeline

### Pipeline Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Push /     │────▶│   Backend    │────▶│   Frontend   │────▶│   Docker     │
│    PR to      │     │   Build &    │     │   Build &    │     │   Build &    │
│    main       │     │   Test       │     │   Test       │     │   Push       │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                       │
                          ┌──────────────┐     ┌──────────────┐       │
                          │   Prod       │◀────│   QA         │◀──────┘
                          │  (manual)    │     │  (auto)      │
                          └──────────────┘     └──────────────┘
```

### CI Workflow (`ci.yml`)

| Job | What | Runs On |
|-----|------|---------|
| `backend` | Maven build + test (all modules, including PIM + DAM) | ubuntu-latest + PG + Redis + RabbitMQ |
| `frontend` | pnpm install + build + test + lint | ubuntu-latest |
| `docker` | Build layered Docker image, push to GHCR on main merge | ubuntu-latest |

### Deploy Workflow (`deploy-environment.yml`)

| Trigger | Target |
|---------|--------|
| CI success on main | Auto-deploy to QA |
| Manual dispatch | Deploy to QA or Prod with configurable params |

Configurable parameters:
- `environment` (qa/prod)
- `author_count`, `publish_count`, `publish_max` — override instance counts
- `image_tag` — Docker image tag to deploy

---

## 7. Scaling Strategy

### Author (Write Tier)

- **Fixed instance count** — QA: 1, Prod: 2
- Sticky sessions via ALB cookie (1hr TTL)
- Internal ALB only — not internet-exposed
- Scale manually if authoring load increases (rare)

### Publish (Read Tier)

- **Auto-scaling** with two triggers:
  1. CPU utilization > 60% → scale out (cooldown: 60s out, 300s in)
  2. ALB requests > 1000/target/minute → scale out
- **FARGATE_SPOT** for ~75% of tasks (stateless, safe to interrupt, ~70% cost savings)
- FARGATE for base capacity (guaranteed availability)

### PIM Scaling

PIM shares the same instances as CMS (Author/Publish). If PIM load becomes dominant:
- Option 1: Increase Author instance count
- Option 2: Add PIM-specific read replicas for `flexcms_pim` database
- Option 3: (Future) Split PIM into its own ECS service with dedicated task definition

---

## 8. Monitoring & Observability

### Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/actuator/health` | Overall health |
| `/actuator/health/liveness` | Kubernetes/ECS liveness probe |
| `/actuator/health/readiness` | ALB target group health check |
| `/actuator/prometheus` | Prometheus metrics scrape endpoint |

### Key Metrics

| Metric | Alert Threshold |
|--------|----------------|
| `http.server.requests` (p99 latency) | > 1s for publish, > 3s for author |
| CPU utilization | > 80% sustained (5min) |
| RDS connections | > 80% of max |
| RabbitMQ queue depth | > 10,000 messages |
| S3 error rate | > 1% |

### Distributed Tracing

- OpenTelemetry (OTLP) integration built-in
- Trace sampling: 100% in dev, configurable via `FLEXCMS_TRACE_SAMPLE_RATE` in prod
- Every request tagged with correlation ID (`X-Correlation-Id` header)

---

## 9. Disaster Recovery

### Database Backups

| Environment | Strategy |
|-------------|----------|
| QA | RDS automated backups, 7-day retention |
| Prod | RDS Multi-AZ + automated backups, 30-day retention + manual snapshots before releases |

### Recovery Scenarios

| Scenario | RTO | RPO | Action |
|----------|-----|-----|--------|
| Single publish instance failure | < 1 min | 0 | ECS auto-replaces; ALB routes around |
| Author instance failure | < 5 min | 0 | ECS auto-replaces; sticky session re-established |
| RDS failover (prod Multi-AZ) | < 2 min | 0 | Automatic failover |
| S3 asset loss | N/A | 0 | S3 has 99.999999999% durability |
| Full region outage | 4-8 hours | < 1 hour | Restore from cross-region backup (manual) |

---

## 10. Runbook — Common Operations

### Scale Publish Instances

```bash
# Immediate (until next deploy resets it)
aws ecs update-service \
  --cluster flexcms-prod \
  --service flexcms-prod-publish \
  --desired-count 10

# Persistent (survives deploys)
# Go to Actions → Deploy Environment → publish_count=10 → Run
```

### Roll Back a Deployment

```bash
# Find the previous image tag
aws ecs describe-services --cluster flexcms-prod --services flexcms-prod-author \
  --query "services[0].taskDefinition"

# Deploy the previous good tag
# Actions → Deploy Environment → environment=prod → image_tag=sha-<previous> → Run
```

### View Logs

```bash
# Author logs (last 30 minutes)
aws logs filter-log-events \
  --log-group-name /ecs/flexcms-prod-author \
  --start-time $(date -d '30 minutes ago' +%s000)

# Publish logs
aws logs filter-log-events \
  --log-group-name /ecs/flexcms-prod-publish \
  --start-time $(date -d '30 minutes ago' +%s000)
```

### Force Restart (No Code Change)

```bash
aws ecs update-service --cluster flexcms-prod --service flexcms-prod-author --force-new-deployment
aws ecs update-service --cluster flexcms-prod --service flexcms-prod-publish --force-new-deployment
```

### Connect to RDS (via SSM Session Manager)

```bash
# Start SSM tunnel to RDS
aws ssm start-session \
  --target <bastion-instance-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<rds-endpoint>"],"portNumber":["5432"],"localPortNumber":["15432"]}'

# Then in another terminal
psql -h localhost -p 15432 -U flexcms -d flexcms_author
```

### Check Replication Queue Health

```bash
# Local
curl -u guest:guest http://localhost:15672/api/queues | jq '.[].name'

# AWS (requires VPN/tunnel to Amazon MQ)
# Use the Amazon MQ console: https://console.aws.amazon.com/amazon-mq/
```

