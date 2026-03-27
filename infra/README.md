# FlexCMS Infrastructure & Deployment Guide

## Application Architecture — Three Pillars

FlexCMS has three independent functional pillars that **run inside the same Java application**:

| Pillar | API Prefix | Database | Description |
|---|---|---|---|
| **Content (CMS)** | `/api/author/*`, `/api/content/*` | `flexcms_author` / `flexcms_publish` | Content tree, pages, components, workflows, replication |
| **Digital Assets (DAM)** | `/api/dam/*` | Same as CMS + S3 bucket | Asset upload, rendition pipeline, CDN delivery |
| **Products (PIM)** | `/api/pim/*` | `flexcms_pim` (separate DB) | Product catalog, schemas, import, year-over-year carryforward |

**Key design:** One Docker image (`flexcms-app`), two deployment modes:
- **Author** (`SPRING_PROFILES_ACTIVE=author`) — read-write, serves all three pillar APIs
- **Publish** (`SPRING_PROFILES_ACTIVE=publish`) — read-only, headless delivery, receives replicated content from Author via RabbitMQ

```
┌─────────────────────────────────────────────────────────────────┐
│                    Single Docker Image                          │
│                  ghcr.io/.../flexcms-app                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Content    │  │     DAM      │  │     PIM      │         │
│  │   (CMS)      │  │  (Assets)    │  │  (Products)  │         │
│  │              │  │              │  │              │          │
│  │ flexcms-core │  │ flexcms-dam  │  │ flexcms-pim  │         │
│  │ flexcms-     │  │ (S3Service,  │  │ (own DB,     │         │
│  │  author/     │  │  renditions) │  │  own entity  │         │
│  │  publish/    │  │              │  │  manager)    │         │
│  │  headless    │  │              │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│    flexcms_author    S3 Bucket         flexcms_pim             │
│    flexcms_publish   (MinIO/AWS S3)    (separate DB)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
infra/
├── README.md                  # This file
├── local/
│   ├── docker-compose.dev.yml # Full local dev stack (infra + app + frontend)
│   └── .env.local             # Local env var template
├── cfn/
│   ├── main.yml               # Root CloudFormation stack (orchestrator)
│   ├── network.yml            # VPC, subnets, NAT, security groups
│   ├── database.yml           # RDS PostgreSQL 16
│   ├── cache.yml              # ElastiCache Redis 7
│   ├── messaging.yml          # Amazon MQ RabbitMQ
│   ├── storage.yml            # S3 buckets (assets, static, templates)
│   └── params/
│       ├── qa.json            # QA parameter overrides
│       └── prod.json          # Production parameter overrides
└── scripts/
    ├── deploy.sh              # CLI deploy helper
    └── init-rds.sh            # One-time RDS database initialization
```

---

## Kubernetes — Helm Charts

FlexCMS ships a production-ready Helm chart at `infra/helm/flexcms/`.

### Chart Structure

```
infra/helm/flexcms/
├── Chart.yaml               # Chart metadata (name, version, appVersion)
├── values.yaml              # Default values (all environments)
├── values-qa.yaml           # QA overrides
├── values-prod.yaml         # Production overrides
└── templates/
    ├── _helpers.tpl         # Named template helpers
    ├── NOTES.txt            # Post-install hints
    ├── serviceaccount.yaml  # ServiceAccount
    ├── secret.yaml          # Credentials Secret (optional — prefers existingSecret)
    ├── configmap.yaml       # Non-sensitive configuration
    ├── author-deployment.yaml    # Author tier Deployment (read-write, fixed replicas)
    ├── author-service.yaml       # Author ClusterIP Service
    ├── publish-deployment.yaml   # Publish tier Deployment (read-only, auto-scalable)
    ├── publish-service.yaml      # Publish ClusterIP Service
    ├── publish-hpa.yaml          # HorizontalPodAutoscaler (autoscaling/v2)
    ├── publish-pdb.yaml          # PodDisruptionBudget
    ├── admin-deployment.yaml     # Admin UI (Next.js) Deployment
    ├── admin-service.yaml        # Admin ClusterIP Service + optional HPA
    └── ingress.yaml              # Ingress (nginx) — multi-host routing
```

### External Dependencies

The chart does **not** deploy PostgreSQL, Redis, RabbitMQ, Elasticsearch, or S3.
Use separate charts (e.g. `bitnami/postgresql`, `bitnami/redis`, `bitnami/rabbitmq`,
`elastic/elasticsearch`) or managed cloud services, then point the chart at them.

### Quick Install (QA)

```bash
# 1. Add chart dependencies (if using in-cluster infra)
helm repo add bitnami https://charts.bitnami.com/bitnami

# 2. Install FlexCMS (QA)
helm upgrade --install flexcms ./infra/helm/flexcms \
  -f infra/helm/flexcms/values-qa.yaml \
  --namespace flexcms-qa --create-namespace \
  --set postgresql.password="$DB_PASSWORD" \
  --set rabbitmq.password="$MQ_PASSWORD" \
  --set s3.accessKeyId="$S3_KEY_ID" \
  --set s3.secretAccessKey="$S3_SECRET"
```

### Production Install (with Sealed Secrets)

```bash
# Pre-create a Secret named "flexcms-credentials" in the target namespace, then:
helm upgrade --install flexcms ./infra/helm/flexcms \
  -f infra/helm/flexcms/values-prod.yaml \
  --namespace flexcms-prod --create-namespace \
  --set postgresql.existingSecret="flexcms-credentials" \
  --set rabbitmq.existingSecret="flexcms-credentials" \
  --set s3.existingSecret="flexcms-credentials" \
  --set image.backend.tag="$IMAGE_TAG" \
  --set image.admin.tag="$IMAGE_TAG"
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| One image, two profiles | `SPRING_PROFILES_ACTIVE=author` or `publish` — no rebuild needed |
| Publish HPA (autoscaling/v2) | Scale on CPU + memory; separate scale-up (fast) and scale-down (slow, 5 min stabilisation) |
| Author: fixed replicas | Author requires sticky session for Admin UI; auto-scaling adds complexity without benefit |
| PDB on Publish | Prevents all publish pods from being evicted during cluster maintenance |
| `existingSecret` support | Integrates with Sealed Secrets, AWS Secrets Manager, and Vault without storing secrets in values files |

### Option A: Infrastructure-only (Recommended — fastest iteration)

Start only infrastructure services in Docker; run backend and frontend from your IDE with hot-reload.

```bash
# 1. Start infrastructure (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch)
cd infra/local
cp .env.local .env          # first time only
docker compose up -d

# 2. Verify infrastructure is healthy
docker compose ps           # all should show "healthy" or "running"

# 3. Build & run backend from IDE (author mode — serves Content + DAM + PIM)
cd ../../flexcms
mvn clean compile
mvn spring-boot:run -pl flexcms-app -Dspring-boot.run.profiles=author

# 4. (Optional) Run a second publish instance in another terminal
mvn spring-boot:run -pl flexcms-app -Dspring-boot.run.profiles=publish

# 5. Run Admin UI with hot-reload
cd ../frontend
pnpm install
cd apps/admin
pnpm dev
```

### Option B: Full-stack Docker (CI-like, tests deployment image)

```bash
cd infra/local
cp .env.local .env                          # first time only
docker compose --profile app up -d --build  # infra + author + publish
docker compose --profile full up -d --build # + admin UI
```

### Option C: Backend in Docker, frontend in IDE

```bash
cd infra/local
docker compose --profile app up -d --build  # infra + author + publish
# then separately:
cd ../../frontend/apps/admin && pnpm dev    # admin UI with hot-reload
```

### Local Endpoints

| Service | URL | Credentials |
|---|---|---|
| **Author API** (Content + DAM + PIM) | http://localhost:8080 | — |
| **Publish API** (headless delivery) | http://localhost:8081 | — |
| **Admin UI** | http://localhost:3000 | — |
| Component Registry Contract | http://localhost:8080/api/content/v1/component-registry | — |
| GraphiQL | http://localhost:8080/graphiql | — |
| Actuator (Author) | http://localhost:8080/actuator/health | — |
| PostgreSQL | localhost:5432 | flexcms / flexcms |
| RabbitMQ Console | http://localhost:15672 | guest / guest |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| Elasticsearch | http://localhost:9200 | — |

### API Quick-Test Cheat Sheet

```bash
# === Content (CMS) ===
# Get component registry (the backend-frontend contract)
curl http://localhost:8080/api/content/v1/component-registry | jq .

# Create a site
curl -X POST http://localhost:8080/api/admin/sites \
  -H "Content-Type: application/json" \
  -d '{"siteId":"corporate","title":"Corporate Website"}'

# Get a page (headless delivery)
curl http://localhost:8080/api/content/v1/pages/content/corporate/en/homepage

# === DAM ===
# Upload an asset
curl -X POST http://localhost:8080/api/dam/upload \
  -F "file=@hero.jpg" -F "folder=/dam/corporate/images"

# === PIM ===
# List products
curl http://localhost:8080/api/pim/v1/products

# Create a product
curl -X POST http://localhost:8080/api/pim/v1/products \
  -H "Content-Type: application/json" \
  -d '{"sku":"PROD-001","name":"Example Product","catalogId":"..."}'

# === Replication ===
# Publish content → author sends to RabbitMQ → publish receives
# Check RabbitMQ queue status:
curl -u guest:guest http://localhost:15672/api/queues | jq '.[].name'
```

### Verifying Author-to-Publish Replication Locally

1. Create content on Author (:8080) via `/api/author/content/node`
2. Publish it via the workflow or `/api/author/content/.../status`
3. Content appears on Publish (:8081) via `/api/content/v1/pages/...`
4. Monitor RabbitMQ at http://localhost:15672 → Queues tab

---

## AWS Environments

### Architecture

```
                    ┌──────────────────────────────┐
                    │     CloudFront CDN (prod)     │
                    └──────────────┬───────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                        │
 ┌─────────▼──────────┐  ┌────────▼────────┐              │
 │  Publish ALB       │  │  Author ALB     │              │
 │  (internet-facing) │  │  (internal)     │              │
 │  Round-robin       │  │  Sticky session │              │
 └─────────┬──────────┘  └────────┬────────┘              │
           │                       │                        │
 ┌─────────▼──────────┐  ┌────────▼────────┐              │
 │  Publish Tasks     │  │  Author Tasks   │              │
 │  (Fargate+Spot)    │  │  (Fargate)      │              │
 │  Content+DAM+PIM   │  │  Content+DAM+PIM│              │
 │  READ-ONLY         │  │  READ-WRITE     │              │
 │  Auto-scaling      │  │  Fixed count    │              │
 └─────────┬──────────┘  └────────┬────────┘              │
           │                       │                        │
 ┌─────────┴───────────────────────┴──────────────────────┐│
 │              Private Subnets (2 AZs)                   ││
 │  ┌──────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ ││
 │  │ RDS  │  │ElastiCache│  │Amazon MQ │  │   S3     │ ││
 │  │PG 16 │  │ Redis 7   │  │RabbitMQ  │  │ Assets   │ ││
 │  │3 DBs │  │           │  │          │  │ Static   │ ││
 │  └──────┘  └───────────┘  └──────────┘  └──────────┘ ││
 └────────────────────────────────────────────────────────┘│
```

### Environment Comparison

| Setting | QA | Production |
|---|---|---|
| Author instances | **1** | **2** |
| Publish instances | **2** (min) → 6 (max) | **5** (min) → 20 (max) |
| RDS | db.t3.medium, single-AZ | db.r6g.large, Multi-AZ, encrypted |
| Redis | cache.t3.micro, 1 node | cache.r6g.large, 2 nodes, Multi-AZ |
| RabbitMQ | mq.m5.large, single | mq.m5.large, HA cluster |
| Publish capacity | FARGATE + FARGATE_SPOT | FARGATE + FARGATE_SPOT |
| Auto-scaling triggers | CPU > 60%, 1000 req/target/min | Same |
| CloudFront CDN | No | Yes |
| WAF | No | Yes (future) |

### Databases in AWS (Single RDS, 3 Databases)

| Database | Used By | Purpose |
|---|---|---|
| `flexcms_author` | Author instances | Content tree, workflows, DAM metadata |
| `flexcms_publish` | Publish instances | Replicated content (read-only) |
| `flexcms_pim` | Both Author + Publish | Product catalog, schemas, variants |

### Deployment

#### Via GitHub Actions (Recommended)

1. Configure repository secrets:
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
   - `FLEXCMS_DB_PASSWORD`, `FLEXCMS_MQ_PASSWORD`
2. Go to **Actions → Deploy Environment → Run workflow**
3. QA auto-deploys after every successful CI build on `main`

#### Via CLI

```bash
export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... AWS_DEFAULT_REGION=eu-central-1
export FLEXCMS_DB_PASSWORD=... FLEXCMS_MQ_PASSWORD=...

# Create QA
bash infra/scripts/deploy.sh --env qa --action create

# Update production
bash infra/scripts/deploy.sh --env prod --action update --image-tag sha-abc1234
```

#### First-Time RDS Setup

```bash
RDS_EP=$(aws cloudformation describe-stacks --stack-name flexcms-qa \
  --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" --output text)
bash infra/scripts/init-rds.sh qa "$RDS_EP"
```

---

## Load Balancing Strategy

### Author ALB (Internal)
- **Internal only** — not exposed to the internet
- **Sticky sessions** (LB cookie, 1hr) — Admin UI needs consistent backend connection
- **Routes:** `/api/author/*`, `/api/pim/*`, `/api/dam/*` → Author target group
- **Health check:** `/actuator/health/readiness`

### Publish ALB (Internet-facing)
- **Round-robin** — all publish instances are stateless, any can handle any request
- **Routes:** `/api/content/*`, `/graphql`, `/dam/renditions/*` → Publish target group
- **Auto-scaling:** CPU target 60% + 1000 requests/target/minute
- **FARGATE_SPOT:** ~75% of publish tasks use Spot capacity (70% cheaper, safe because stateless)
- **Health check:** `/actuator/health/readiness`

---

## Cost Estimates (Monthly, eu-central-1)

| Resource | QA | Production |
|---|---|---|
| ECS Fargate (Author) | ~$35 | ~$140 |
| ECS Fargate (Publish) | ~$70 | ~$350 + Spot savings |
| RDS PostgreSQL | ~$60 | ~$400 |
| ElastiCache Redis | ~$15 | ~$300 |
| Amazon MQ RabbitMQ | ~$150 | ~$300 |
| NAT Gateway | ~$35 | ~$35 |
| ALB (×2) | ~$40 | ~$40 |
| S3 | ~$5 | ~$20 |
| **Total** | **~$410/mo** | **~$1,585/mo** |

