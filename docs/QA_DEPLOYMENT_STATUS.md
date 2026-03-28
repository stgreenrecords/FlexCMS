# FlexCMS QA Deployment Status

**Last updated:** 2026-03-28
**Target environment:** AWS Account 698643712979, Region `eu-central-1`

---

## ✅ QA Environment — LIVE

**Approach: Single EC2 instance with Docker Compose** (replaced CloudFormation/ECS Fargate)

| Resource | Value |
|---|---|
| Instance ID | `i-0b24a45dae8b17021` |
| Instance Type | `m7i-flex.large` (2 vCPU, 8GB RAM, Free Tier) |
| Public IP | `3.78.187.128` |
| Region | `eu-central-1` |
| Security Group | `sg-0ce6fba45747dd5b3` (ports: 22, 8080, 8081, 9001, 15672) |
| SSH Key | `flexcms-qa` (`~/.ssh/flexcms-qa.pem`) |

### Endpoints

| Service | URL |
|---|---|
| **Author API** | http://3.78.187.128:8080 |
| **Publish API** | http://3.78.187.128:8081 |
| **RabbitMQ Management** | http://3.78.187.128:15672 (flexcms / FlexCmsQA2024!) |
| **MinIO Console** | http://3.78.187.128:9001 (minioadmin / minioadmin) |
| Health Check | http://3.78.187.128:8080/actuator/health |

### SSH Access
```bash
ssh -i ~/.ssh/flexcms-qa.pem ec2-user@3.78.187.128
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
