# FlexCMS Infrastructure

## Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │          CloudFront CDN              │
                    │    (prod only — static + API cache)  │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────▼──────────┐  ┌─────▼───────────┐        │
    │  Publish ALB       │  │  Author ALB     │        │
    │  (internet-facing) │  │  (internal)     │        │
    │  Round-robin       │  │  Sticky session │        │
    └─────────┬──────────┘  └─────┬───────────┘        │
              │                    │                     │
    ┌─────────▼──────────┐  ┌─────▼───────────┐        │
    │  Publish ECS Tasks │  │  Author ECS     │        │
    │  (Fargate + Spot)  │  │  (Fargate)      │        │
    │  Auto-scaling      │  │  Fixed count    │        │
    │  QA: 2, Prod: 5-20 │  │  QA:1, Prod:2  │        │
    └─────────┬──────────┘  └─────┬───────────┘        │
              │                    │                     │
    ┌─────────┴────────────────────┴───────────────────┐│
    │              Private Subnets (2 AZs)             ││
    │  ┌──────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ ││
    │  │ RDS  │ │ElastiCache│ │Amazon MQ │ │   S3   │ ││
    │  │PG 16 │ │ Redis 7   │ │RabbitMQ  │ │ Assets │ ││
    │  └──────┘ └───────────┘ └──────────┘ └────────┘ ││
    └──────────────────────────────────────────────────┘│
                                                        │
    ┌───────────────────────────────────────────────────┘
    │  S3 Static Site Bucket (compiled HTML/CSS/JS)
    └──────────────────────────────────────────────────┘
```

## Directory Structure

```
infra/
├── README.md                  # This file
├── local/
│   ├── docker-compose.dev.yml # Full local dev stack (author+publish+infra)
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

## Environments

| Setting | QA | Production |
|---|---|---|
| Author instances | 1 | 2 |
| Publish instances | 2 (min) → 6 (max) | 5 (min) → 20 (max) |
| RDS | db.t3.medium, single-AZ | db.r6g.large, Multi-AZ |
| Redis | cache.t3.micro, 1 node | cache.r6g.large, 2 nodes |
| RabbitMQ | mq.m5.large, single | mq.m5.large, HA cluster |
| Publish capacity | FARGATE + FARGATE_SPOT | FARGATE + FARGATE_SPOT |
| Auto-scaling trigger | CPU > 60% or 1000 req/target/min | Same |
| CloudFront | No | Yes |
| WAF | No | Yes (future) |

## Local Development

```bash
# Start everything (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch, Author, Publish)
cd infra/local
cp .env.local .env    # first time only — customize if needed
docker compose -f docker-compose.dev.yml up -d

# Check health
docker compose -f docker-compose.dev.yml ps

# View author logs
docker compose -f docker-compose.dev.yml logs -f author

# Frontend (run separately for hot-reload)
cd frontend && pnpm install && pnpm dev
```

### Endpoints (Local)

| Service | URL |
|---|---|
| Author API | http://localhost:8080 |
| Publish API | http://localhost:8081 |
| Admin UI | http://localhost:3000 (run `pnpm dev` in frontend/apps/admin) |
| RabbitMQ Console | http://localhost:15672 (guest/guest) |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin) |

## AWS Deployment

### Prerequisites

1. AWS CLI v2 installed and configured
2. GitHub repository secrets configured:
   - `AWS_ACCESS_KEY_ID` — IAM user access key
   - `AWS_SECRET_ACCESS_KEY` — IAM user secret key
   - `AWS_REGION` — target region (default: `eu-central-1`)
   - `FLEXCMS_DB_PASSWORD` — RDS master password (min 8 chars)
   - `FLEXCMS_MQ_PASSWORD` — RabbitMQ password (min 8 chars)

### Deploy via GitHub Actions (Recommended)

1. Go to **Actions** → **Deploy Environment**
2. Click **Run workflow**
3. Select environment (`qa` or `prod`), set instance counts, image tag
4. Click **Run workflow**

QA auto-deploys after every successful CI build on `main`.

### Deploy via CLI

```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=eu-central-1
export FLEXCMS_DB_PASSWORD=...
export FLEXCMS_MQ_PASSWORD=...

# Deploy QA
bash infra/scripts/deploy.sh --env qa --action create --image-tag latest

# Update production with specific image
bash infra/scripts/deploy.sh --env prod --action update --image-tag sha-abc1234
```

### First-Time Setup (After Initial Deploy)

```bash
# Get RDS endpoint from stack outputs
RDS_EP=$(aws cloudformation describe-stacks --stack-name flexcms-qa \
  --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" --output text)

# Initialize databases (requires network access to RDS — use SSM tunnel)
bash infra/scripts/init-rds.sh qa "$RDS_EP"
```

## Load Balancing Strategy

### Author ALB (Internal)
- **Scheme:** Internal (private subnets only)
- **Sticky sessions:** Enabled (LB cookie, 1-hour TTL)
- **Routing:** `/api/author/*` → Author, `/api/pim/*` → Author, `/api/dam/*` → Author
- **Health check:** `/actuator/health/readiness`
- **Why sticky:** Admin UI maintains session state; ensures consistent authoring experience

### Publish ALB (Internet-facing)
- **Scheme:** Internet-facing (public subnets)
- **Round-robin:** Default (stateless reads)
- **Routing:** `/api/content/*` → Publish, `/graphql` → Publish
- **Health check:** `/actuator/health/readiness`
- **Auto-scaling:** CPU target tracking (60%) + ALB request count (1000/target/min)
- **FARGATE_SPOT:** 75% of publish tasks use Spot (stateless, replaceable, 70% cost savings)

## Cost Estimates (Monthly)

| Resource | QA | Production |
|---|---|---|
| ECS Fargate (Author) | ~$35 | ~$140 |
| ECS Fargate (Publish) | ~$70 | ~$350 + Spot savings |
| RDS PostgreSQL | ~$60 | ~$400 |
| ElastiCache Redis | ~$15 | ~$300 |
| Amazon MQ RabbitMQ | ~$150 | ~$300 |
| NAT Gateway | ~$35 | ~$35 |
| ALB (x2) | ~$40 | ~$40 |
| S3 | ~$5 | ~$20 |
| **Total** | **~$410/mo** | **~$1,585/mo** |

*Estimates based on eu-central-1 pricing. Actual costs vary with traffic.*

