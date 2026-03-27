# FlexCMS QA Deployment Status

**Last updated:** 2026-03-27
**Target environment:** `qa.flexcmsdemo.store` (AWS Account: 698643712979, Region: eu-central-1)
**AWS IAM User:** `spa-deployer` (AdministratorAccess)

---

## Overall Progress

| Phase | Status | Notes |
|---|---|---|
| Infrastructure CFN templates | ✅ Done | All templates fixed and committed |
| ACM Certificates requested | ✅ Done | Pending DNS validation |
| Route53 hosted zone created | ✅ Done | flexcmsdemo.store |
| ACM DNS validation record added | ✅ Done | Added to Route53 |
| CloudFormation first deploy attempt | ❌ Failed | ECS SLR propagation delay |
| ECS Service-Linked Role | ✅ Fixed | Created at 17:43 UTC — needs ~2 min to propagate |
| Stack cleanup | 🔄 In progress | Deleting ROLLBACK_COMPLETE stack |
| **Stack redeploy** | ⏳ Pending | Ready to retry after delete completes |
| RDS initialization | ⏳ Pending | Run init-rds.sh after stack is up |
| Frontend Docker images | ⏳ Pending | Build after Author ALB DNS is known |
| Admin UI + Site-nextjs deploy | ⏳ Pending | Phase 2 after backend confirmed |
| DNS CNAME records | ⏳ Pending | Point subdomains at ALBs/CloudFront |
| ACM cert activation | ⏳ Pending | Auto-activates once DNS propagates |
| HTTPS listeners | ⏳ Pending | Redeploy with cert ARNs after validation |
| Endpoint verification | ⏳ Pending | Final step |

---

## What Was Done This Session

### CloudFormation Templates (all committed, pushed to main)

**`infra/cfn/network.yml`**
- Added `EcsElasticIngress` rule: port 9200 self-ingress within ECS security group
  (allows Elasticsearch container to receive from other ECS tasks)

**`infra/cfn/messaging.yml`**
- Added `BrokerHostname` output: parses `amqps://hostname:5671` AMQP endpoint to extract
  just the hostname (needed for `SPRING_RABBITMQ_HOST` env var)

**`infra/cfn/main.yml`** — major update:
- **Fixed:** Added `SPRING_RABBITMQ_HOST` to Author + Publish task definitions
- **Fixed:** Added `SPRING_ELASTICSEARCH_URIS` to Author + Publish task definitions
- **Fixed:** Author ALB is now `internet-facing` for QA, `internal` for prod
- **New:** Cloud Map private DNS namespace (`flexcms-qa.local`) for ECS service discovery
- **New:** Elasticsearch ECS Fargate service with Cloud Map service discovery
  (Spring connects via `http://elasticsearch.flexcms-qa.local:9200`)
- **New:** Admin UI ALB + ECS service (conditional on `AdminImageUri` parameter)
- **New:** Site-nextjs ALB + ECS service (conditional on `SiteImageUri` parameter)
- **New:** HTTPS listeners for all 4 ALBs (conditional on `CertificateArn`)
- **New:** CloudFront custom domain + ACM cert (conditional on `CloudFrontCertificateArn`)
- **New parameters:** `AdminImageUri`, `SiteImageUri`, `DomainName`, `CertificateArn`,
  `CloudFrontCertificateArn`, `AdminDesiredCount`, `SiteDesiredCount`

**`infra/cfn/params/qa.json`** — added new parameters:
- `DomainName=qa.flexcmsdemo.store`
- `AdminImageUri=` (empty = skip until phase 2)
- `SiteImageUri=` (empty = skip until phase 2)
- `CertificateArn=` (fill after cert validates)
- `CloudFrontCertificateArn=` (fill after cert validates)

**`infra/scripts/deploy.sh`** — complete rewrite:
- Two-phase deployment: `--action create` (backend) then `--build-frontend` (phase 2)
- `--build-frontend` flag: builds Admin UI + Site-nextjs Docker images, pushes to ECR
- `--cert-arn` / `--cf-cert-arn` flags: enable HTTPS after cert validation
- Post-deploy hints: prints all DNS CNAME records needed + initialization commands

**`frontend/apps/site-nextjs/next.config.js`**
- Added `STANDALONE=1` support (same as admin app) for Docker standalone output

**`frontend/apps/site-nextjs/Dockerfile`** — created (was missing):
- Multi-stage build: deps → builder → runtime
- Builds SDK → React → Site-nextjs in dependency order
- Same pattern as `frontend/apps/admin/Dockerfile`

---

## ACM Certificates

| Certificate | Region | ARN | Status |
|---|---|---|---|
| `*.qa.flexcmsdemo.store` (CloudFront) | us-east-1 | `arn:aws:acm:us-east-1:698643712979:certificate/ee155dbc-06e2-44f6-b778-8512066410d1` | PENDING_VALIDATION |
| `*.qa.flexcmsdemo.store` (ALBs) | eu-central-1 | `arn:aws:acm:eu-central-1:698643712979:certificate/b83a48ac-2fe5-47ef-85a5-32585202cc16` | PENDING_VALIDATION |

**DNS validation record added to Route53:**
```
Name:  _5e40f07113a4a2a38d538e17bdd3e954.qa.flexcmsdemo.store.
Type:  CNAME
Value: _8e641d9bb9ae07d8af268bff7f183340.jkddzztszm.acm-validations.aws.
```
Both certs use the same validation record. They will auto-validate once DNS propagates (~5-30 min).

**Route53 Hosted Zone:** `Z05181351Y3HRB0E9SDL8` (flexcmsdemo.store.)

> ⚠️ **Action required:** The domain `flexcmsdemo.store` must be delegated to AWS Route53
> by updating the nameservers at your domain registrar to:
> - `ns-1532.awsdns-63.org`
> - `ns-1859.awsdns-40.co.uk`
> - `ns-134.awsdns-16.com`
> - `ns-746.awsdns-29.net`
> Until this is done, ACM cert validation and DNS routing will not work.

---

## Next Steps (in order)

### Step 1 — Update Domain Registrar NS Records
Point `flexcmsdemo.store` to the AWS Route53 nameservers listed above.

### Step 2 — Wait for Stack Delete + Redeploy Backend

```bash
# Wait for stack deletion to complete (if not already)
aws cloudformation wait stack-delete-complete --stack-name flexcms-qa --region eu-central-1

# Redeploy (ECS SLR now propagated)
export FLEXCMS_DB_PASSWORD="FlexCmsQA2024!"
export FLEXCMS_MQ_PASSWORD="FlexCmsQA2024!"
bash infra/scripts/deploy.sh --env qa --action create
```

### Step 3 — Initialize RDS Databases (first deploy only)

```bash
RDS_EP=$(aws cloudformation describe-stacks --stack-name flexcms-qa \
  --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" \
  --output text --region eu-central-1)

bash infra/scripts/init-rds.sh qa "$RDS_EP" "FlexCmsQA2024!"
```
> Note: RDS is in private subnets. Run this from an EC2 bastion in the VPC or
> via `aws ssm start-session` with port forwarding.

### Step 4 — Build + Deploy Frontend Images

```bash
# After backend stack is confirmed healthy:
bash infra/scripts/deploy.sh --env qa --action update --build-frontend
```

This will:
1. Get Author ALB DNS from stack outputs
2. Build Admin UI Docker image with `NEXT_PUBLIC_FLEXCMS_API=http://<AuthorALB>`
3. Build Site-nextjs Docker image
4. Push both to ECR
5. Update CFN stack with the ECR image URIs → ECS deploys the frontend

### Step 5 — Enable HTTPS (after cert validation)

```bash
# Check cert status
aws acm describe-certificate \
  --certificate-arn "arn:aws:acm:eu-central-1:698643712979:certificate/b83a48ac-2fe5-47ef-85a5-32585202cc16" \
  --region eu-central-1 --query "Certificate.Status"

# When both certs show ISSUED:
bash infra/scripts/deploy.sh --env qa --action update \
  --cert-arn "arn:aws:acm:eu-central-1:698643712979:certificate/b83a48ac-2fe5-47ef-85a5-32585202cc16" \
  --cf-cert-arn "arn:aws:acm:us-east-1:698643712979:certificate/ee155dbc-06e2-44f6-b778-8512066410d1"
```

### Step 6 — Add DNS CNAME Records

After the stack is up, get ALB DNS names from outputs and add to Route53:

```bash
# Get all ALB DNS names
aws cloudformation describe-stacks --stack-name flexcms-qa \
  --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" --output table --region eu-central-1
```

Add these CNAMEs in Route53 (hosted zone `Z05181351Y3HRB0E9SDL8`):

| Subdomain | Points to |
|---|---|
| `qa.flexcmsdemo.store` | CloudFront domain (e.g. `d1abc123.cloudfront.net`) |
| `api.qa.flexcmsdemo.store` | Author ALB DNS |
| `admin.qa.flexcmsdemo.store` | Admin ALB DNS |
| `site.qa.flexcmsdemo.store` | Site ALB DNS |

### Step 7 — Verify All Endpoints

```bash
# After DNS propagates and ECS tasks are healthy:

# 1. Author API health
curl http://api.qa.flexcmsdemo.store/actuator/health/readiness

# 2. Publish API health
curl http://<PublishALBDns>/actuator/health/readiness

# 3. Author API — component registry
curl http://api.qa.flexcmsdemo.store/api/content/v1/component-registry | jq .

# 4. CloudFront / Site
curl https://qa.flexcmsdemo.store

# 5. Admin UI
curl https://admin.qa.flexcmsdemo.store

# 6. RabbitMQ replication test
# POST content to Author, publish it, verify it appears on Publish

# 7. S3/DAM — upload test asset via Admin UI

# 8. Elasticsearch — verify search indexing
curl http://<AuthorALBDns>/api/search/health
```

---

## Known Issues / Risks

| Issue | Severity | Resolution |
|---|---|---|
| `NEXT_PUBLIC_FLEXCMS_API` baked at Docker build time | Medium | Image is built with Author ALB URL; must rebuild if ALB DNS changes |
| Elasticsearch single-node (ephemeral) | Low | QA only — no persistence; data lost on task restart |
| RDS in private subnet — no direct access for init-rds.sh | Medium | Use SSM port forwarding or EC2 bastion |
| ACM certs require NS delegation first | High | Update registrar NS before validation can complete |
| ECS SLR propagation delay (caused first stack failure) | Low | Already fixed — SLR was created at 17:43 UTC |

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
