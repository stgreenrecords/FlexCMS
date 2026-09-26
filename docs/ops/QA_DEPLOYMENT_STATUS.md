# FlexCMS QA Deployment Status

**Last updated:** 2026-03-28
**Target environment:** AWS Account 698643712979, Region `eu-central-1`

---

## 🟡 QA Environment — Infrastructure Running, App Pending Docker Image

**Approach: Single EC2 instance with Docker Compose** (replaced CloudFormation/ECS Fargate)

| Resource | Value |
|---|---|
| Instance ID | `i-0b24a45dae8b17021` |
| Instance Type | `m7i-flex.large` (2 vCPU, 8GB RAM, Free Tier) |
| Public IP | `63.182.174.144` (Elastic IP — permanent) |
| Region | `eu-central-1` |
| Security Group | `sg-0ce6fba45747dd5b3` (ports: 22, 80, 8080, 8081, 9001, 15672) |
| SSH Key | `flexcms-qa` (`~/.ssh/flexcms-qa.pem`) |

### Endpoints (via Nginx reverse proxy on port 80)

| Service | URL |
|---|---|
| **Admin UI** | http://admin.flexcmsdemo.store |
| **Reference Site** | http://flexcmsdemo.store |
| **Author API** | http://api.flexcmsdemo.store |
| **Publish API** | http://publish.flexcmsdemo.store |
| **Swagger/OpenAPI** | http://api.flexcmsdemo.store/swagger-ui.html |
| **GraphiQL** | http://api.flexcmsdemo.store/graphiql |
| **RabbitMQ Management** | http://63.182.174.144:15672 (flexcms / FlexCmsQA2024!) |
| **MinIO Console** | http://63.182.174.144:9001 (minioadmin / minioadmin) |
| Health Check | http://api.flexcmsdemo.store/actuator/health |

### SSH Access
```bash
ssh -i ~/.ssh/flexcms-qa.pem ec2-user@63.182.174.144
```

### Manage Services
```bash
# SSH into the instance, then:
cd /opt/flexcms
sudo docker compose ps          # Check status
sudo docker compose logs -f     # Tail all logs
sudo docker compose logs author # Author logs only
sudo docker compose restart     # Restart all
sudo docker compose pull && sudo docker compose up -d  # Update to latest image
```

---

## Why EC2 Instead of ECS/CloudFormation

| | CloudFormation + ECS Fargate | EC2 + Docker Compose |
|---|---|---|
| Setup time | 30-40 min (RDS + MQ + CF) | **5 minutes** |
| Cost of failure | ~1 hour (create + rollback) | Terminate + relaunch = 2 min |
| Monthly cost (QA) | ~$400+ (RDS + MQ + ElastiCache + NAT + ALBs) | ~$65 (m7i-flex.large) |
| Complexity | 950-line CFN template, 6 nested stacks | 1 setup script |
| Suitable for | Production | **QA / staging / demo** |

The CloudFormation templates (`infra/cfn/`) remain available for production deployment with managed services (RDS, MQ, ElastiCache, CloudFront).

---

## Current Service Status (2026-03-28)

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| SSH | 22 | ✅ Reachable | |
| PostgreSQL | 5432 | ✅ Running | Internal only (not exposed externally) |
| Redis | 6379 | ✅ Running | Internal only |
| RabbitMQ | 5672/15672 | ✅ Running | Management UI verified via API |
| Elasticsearch | 9200 | ✅ Running | Internal only |
| **Author App** | 8080 | ❌ **Not running** | Docker image not available |
| **Publish App** | 8081 | ❌ **Not running** | Docker image not available |
| MinIO | 9000/9001 | ❓ Not deployed yet | Not in current compose on instance |

### Root Cause

The Docker image `ghcr.io/stgreenrecords/flexcms-app:latest` has **never been built and pushed** to GitHub Container Registry. The `author` and `publish` containers failed to start because `docker compose pull` cannot find the image.

---

## How to Fix — Build & Push Docker Image

### Option 1: GitHub Actions (automated — recommended)

The workflow `.github/workflows/docker-build.yml` builds and pushes on every `main` push:

1. Push code to `main` (or trigger manually via GitHub → Actions → "Build & Push Docker Image" → Run workflow)
2. Wait for the workflow to complete (~5-8 minutes)
3. SSH into QA instance and pull the new image:
   ```bash
   ssh -i ~/.ssh/flexcms-qa.pem ec2-user@63.182.174.144
   cd /opt/flexcms
   sudo docker compose pull
   sudo docker compose up -d
   ```

### Option 2: Build locally and push

```bash
# 1. Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 2. Build
cd flexcms
docker build -t ghcr.io/stgreenrecords/flexcms-app:latest .

# 3. Push
docker push ghcr.io/stgreenrecords/flexcms-app:latest

# 4. SSH into QA and pull
ssh -i ~/.ssh/flexcms-qa.pem ec2-user@63.182.174.144
cd /opt/flexcms
sudo docker compose pull && sudo docker compose up -d
```

### Option 3: Build on QA instance directly

```bash
ssh -i ~/.ssh/flexcms-qa.pem ec2-user@63.182.174.144

# Install git + clone repo
sudo yum install -y git
git clone https://github.com/stgreenrecords/FlexCMS.git /tmp/flexcms-build
cd /tmp/flexcms-build/flexcms

# Build image locally on the instance
sudo docker build -t ghcr.io/stgreenrecords/flexcms-app:latest .

# Restart compose
cd /opt/flexcms
sudo docker compose up -d
```

---

## Security Group Checklist

Ensure `sg-0ce6fba45747dd5b3` has these inbound rules:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Your IP | SSH |
| 8080 | TCP | 0.0.0.0/0 | Author API |
| 8081 | TCP | 0.0.0.0/0 | Publish API |
| 9001 | TCP | Your IP | MinIO Console |
| 15672 | TCP | Your IP | RabbitMQ Management |

> **Note:** Port 8080 returned CLOSED/FILTERED during testing — verify the security group rule exists in AWS Console.

---

