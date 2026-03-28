# FlexCMS QA Deployment Status

**Last updated:** 2026-03-28
**Target environment:** AWS Account 698643712979, Region `eu-central-1`
**AWS IAM User:** `spa-deployer` (AdministratorAccess)

---

## Overall Progress

| Phase | Status | Notes |
|---|---|---|
| Infrastructure CFN templates | ✅ Done | Init containers added for DB creation |
| Broker instance type fix | ✅ Done | `mq.t3.micro` → `mq.m5.large` (deprecated April 1 2026) |
| DB init container added | ✅ Done | `db-init` sidecar creates databases before Spring Boot starts |
| Domain DNS | ⛔ Blocked | `flexcmsdemo.store` managed by external org — using ALB DNS directly |
| ACM Certificates | ⛔ Blocked | Cannot validate without DNS control — deploy HTTP-only |
| CloudFormation deploy | 🔄 In progress | Deploying with fixed template |
| RDS initialization | ✅ Automated | Init containers handle `CREATE DATABASE` automatically |
| Frontend Docker images | ⏳ Pending | Phase 2 after backend confirmed healthy |
| Endpoint verification | ⏳ Pending | Use ALB DNS names directly |

---

## Root Cause Analysis — Previous Failure

The stack failed because **ECS services could not stabilize** (3+ hours then timeout):

| Root Cause | Fix Applied |
|---|---|
| `flexcms_author`, `flexcms_publish`, `flexcms_pim` databases didn't exist on fresh RDS (only `postgres`) | Added `db-init` init container to both AuthorTaskDef and PublishTaskDef |
| `mq.t3.micro` deprecated (blocked for new brokers after April 1 2026) | Updated `qa.json` to `mq.m5.large` |
| `flexcmsdemo.store` externally managed — can't validate ACM certs or set DNS | Cleared `DomainName` param — deploy HTTP-only with ALB DNS names |
| `init-rds.sh` connected to non-existent `flexcms` database instead of `postgres` | Fixed to use `-d postgres` |

---

## Template Changes (this session)

### `infra/cfn/main.yml`
- **Added `db-init` init container** to `AuthorTaskDef` and `PublishTaskDef`:
  - Uses `postgres:16-alpine` image (has `psql`)
  - Creates `flexcms_author`, `flexcms_publish`, `flexcms_pim` databases idempotently
  - Main Spring Boot container has `DependsOn: [{ContainerName: db-init, Condition: SUCCESS}]`
  - Eliminates the need for manual `init-rds.sh` execution

### `infra/cfn/params/qa.json`
- `BrokerInstanceType`: `mq.t3.micro` → `mq.m5.large`
- `DomainName`: `qa.flexcmsdemo.store` → `` (empty — HTTP-only, use ALB DNS)

### `infra/cfn/database.yml`
- Fixed misleading comment: databases created by init containers, not Flyway

### `infra/scripts/init-rds.sh`
- Fixed: connect to `postgres` database (not `flexcms` which doesn't exist on fresh RDS)
- Added note that init containers now handle this automatically

---

## Deploy Command (ready to execute)

```powershell
# 1. Cleanup retained S3 buckets (if any from previous rollback)
aws s3 rb s3://flexcms-qa-assets-698643712979 --force --region eu-central-1 2>$null

# 2. Upload nested templates
$BUCKET = "flexcms-qa-cfn-templates-698643712979"
Get-ChildItem "infra\cfn\*.yml" | Where-Object { $_.Name -ne "main.yml" } | ForEach-Object {
    aws s3 cp $_.FullName "s3://$BUCKET/$($_.Name)" --region eu-central-1 --quiet
}

# 3. Deploy stack
aws cloudformation deploy `
  --stack-name flexcms-qa `
  --template-file infra\cfn\main.yml `
  --parameter-overrides `
    EnvironmentName=qa `
    DockerImageTag=latest `
    DBMasterPassword=FlexCmsQA2024! `
    BrokerPassword=FlexCmsQA2024! `
    TemplateBucketUrl=https://flexcms-qa-cfn-templates-698643712979.s3.eu-central-1.amazonaws.com `
    DBInstanceClass=db.t3.micro `
    DBAllocatedStorage=20 `
    CacheNodeType=cache.t3.micro `
    BrokerInstanceType=mq.m5.large `
    AuthorDesiredCount=1 `
    PublishDesiredCount=2 `
    PublishMaxCount=6 `
  --capabilities CAPABILITY_NAMED_IAM `
  --region eu-central-1 `
  --no-fail-on-empty-changeset
```

**Expected timeline:** ~30-40 min (RDS ~10 min, MQ ~20 min, ECS stabilization ~5 min)

---

## QA Access (after deploy succeeds)

All services accessible via HTTP on ALB DNS names (no custom domain needed):

| Service | URL |
|---|---|
| Author API | `http://<AuthorALBDns>/actuator/health/readiness` |
| Publish API | `http://<PublishALBDns>/actuator/health/readiness` |
| CloudFront CDN | `https://<CloudFrontDomain>` |
| Admin UI | Phase 2 — `http://<AdminALBDns>` |
| Site | Phase 2 — `http://<SiteALBDns>` |

Get ALB DNS names after deploy:
```bash
aws cloudformation describe-stacks --stack-name flexcms-qa \
  --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" --output table --region eu-central-1
```

---

## Architecture (deployed on ECS Fargate — NO EC2 instances)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ECS Fargate Cluster                       │
│                                                                   │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐    │
│  │ db-init       │  │ db-init        │  │ Elasticsearch      │    │
│  │ (postgres:16) │  │ (postgres:16)  │  │ (8.13.4)           │    │
│  │ ↓ SUCCESS     │  │ ↓ SUCCESS      │  │ Cloud Map DNS      │    │
│  │ Author App    │  │ Publish App    │  │ :9200              │    │
│  │ :8080         │  │ :8081          │  └────────────────────┘    │
│  └──────┬───────┘  └──────┬────────┘                             │
│         │                  │                                       │
├─────────┼──────────────────┼───────────────────────────────────────┤
│  ALB    │           ALB    │                                       │
│  Auth   ▼           Pub    ▼         CloudFront                    │
│  :80              :80            (S3 + SSR fallback)               │
└─────────────────────────────────────────────────────────────────┘
          │                  │                │
     ┌────┴─────┐     ┌─────┴──────┐    ┌────┴──────┐
     │ RDS PG16 │     │ ElastiCache│    │ Amazon MQ │
     │ Private  │     │ Redis      │    │ RabbitMQ  │
     └──────────┘     └────────────┘    └───────────┘
```

---

## Credentials Reference

| Secret | Value |
|---|---|
| DB master password | `FlexCmsQA2024!` |
| RabbitMQ password | `FlexCmsQA2024!` |
| DB user | `flexcms` |
| RabbitMQ user | `flexcms` |
| AWS Region | `eu-central-1` |
| AWS Account | `698643712979` |

---

## Phase 2 — Frontend Deploy (after backend is healthy)

```bash
# Build and deploy frontend containers to ECR + update stack
bash infra/scripts/deploy.sh --env qa --action update --build-frontend
```

## Custom Domain (future — requires external org cooperation)

If the external org can add a **subdomain delegation** for `qa.flexcmsdemo.store`:
1. Ask them to add NS records for `qa.flexcmsdemo.store` pointing to our Route53 hosted zone
2. Request ACM certificates in both `us-east-1` and `eu-central-1`
3. Redeploy with `--cert-arn` and `--cf-cert-arn` flags

Alternatively, register a new domain we control (e.g., `flexcms-qa.dev`).
