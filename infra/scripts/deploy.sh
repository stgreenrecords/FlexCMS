#!/usr/bin/env bash
# =============================================================================
# FlexCMS — Deploy CloudFormation stacks to AWS
#
# Usage:
#   ./deploy.sh --env qa|prod --action create|update [OPTIONS]
#
# Options:
#   --image-tag TAG        Backend image tag (default: latest)
#   --admin-image URI      Admin UI ECR image URI (skip if omitted)
#   --site-image URI       Site-nextjs ECR image URI (skip if omitted)
#   --cert-arn ARN         ACM cert ARN for ALBs (eu-central-1). Optional.
#   --cf-cert-arn ARN      ACM cert ARN for CloudFront (us-east-1). Optional.
#   --build-frontend       Build + push Admin UI and Site-nextjs images to ECR before deploying.
#   --region REGION        AWS region (default: eu-central-1)
#
# Two-phase QA workflow (recommended for first deploy):
#   Phase 1 — backend only:
#     ./deploy.sh --env qa --action create
#   Phase 2 — build and deploy frontend:
#     ./deploy.sh --env qa --action update --build-frontend
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CFN_DIR="${SCRIPT_DIR}/../cfn"
FRONTEND_DIR="${SCRIPT_DIR}/../../frontend"

# Defaults
ENV=""
ACTION=""
IMAGE_TAG="latest"
ADMIN_IMAGE_URI=""
SITE_IMAGE_URI=""
CERT_ARN=""
CF_CERT_ARN=""
BUILD_FRONTEND=false
REGION="${AWS_DEFAULT_REGION:-eu-central-1}"

usage() {
  echo "Usage: $0 --env <qa|prod> --action <create|update> [OPTIONS]"
  echo "  --image-tag TAG        Backend Docker image tag (default: latest)"
  echo "  --admin-image URI      Admin UI ECR image URI"
  echo "  --site-image URI       Site-nextjs ECR image URI"
  echo "  --cert-arn ARN         ACM certificate ARN for ALBs (eu-central-1)"
  echo "  --cf-cert-arn ARN      ACM certificate ARN for CloudFront (us-east-1)"
  echo "  --build-frontend       Build + push frontend Docker images to ECR"
  echo "  --region REGION        AWS region (default: eu-central-1)"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --env)             ENV="$2"; shift 2;;
    --action)          ACTION="$2"; shift 2;;
    --image-tag)       IMAGE_TAG="$2"; shift 2;;
    --admin-image)     ADMIN_IMAGE_URI="$2"; shift 2;;
    --site-image)      SITE_IMAGE_URI="$2"; shift 2;;
    --cert-arn)        CERT_ARN="$2"; shift 2;;
    --cf-cert-arn)     CF_CERT_ARN="$2"; shift 2;;
    --build-frontend)  BUILD_FRONTEND=true; shift;;
    --region)          REGION="$2"; shift 2;;
    *)                 usage;;
  esac
done

[[ -z "$ENV" || -z "$ACTION" ]] && usage
[[ "$ENV" != "qa" && "$ENV" != "prod" ]] && { echo "Error: --env must be qa or prod"; exit 1; }
[[ "$ACTION" != "create" && "$ACTION" != "update" ]] && { echo "Error: --action must be create or update"; exit 1; }

STACK_NAME="flexcms-${ENV}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
TEMPLATE_BUCKET="flexcms-${ENV}-cfn-templates-${ACCOUNT_ID}"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "=== FlexCMS Infrastructure Deploy ==="
echo "  Environment:  ${ENV}"
echo "  Action:       ${ACTION}"
echo "  Region:       ${REGION}"
echo "  Image Tag:    ${IMAGE_TAG}"
echo "  Stack Name:   ${STACK_NAME}"
echo "  Template S3:  s3://${TEMPLATE_BUCKET}"
echo "  ECR Registry: ${ECR_REGISTRY}"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Create S3 template bucket if not exists
# ---------------------------------------------------------------------------
echo ">>> Ensuring S3 template bucket exists..."
aws s3 mb "s3://${TEMPLATE_BUCKET}" --region "${REGION}" 2>/dev/null || true

# ---------------------------------------------------------------------------
# Step 2: Upload nested templates to S3
# ---------------------------------------------------------------------------
echo ">>> Uploading CloudFormation templates to S3..."
for f in "${CFN_DIR}"/*.yml; do
  [[ "$(basename "$f")" == "main.yml" ]] && continue
  echo "  Uploading $(basename "$f")..."
  aws s3 cp "$f" "s3://${TEMPLATE_BUCKET}/$(basename "$f")" --region "${REGION}"
done

TEMPLATE_URL="https://${TEMPLATE_BUCKET}.s3.${REGION}.amazonaws.com"

# ---------------------------------------------------------------------------
# Step 3: Read passwords from environment or prompt
# ---------------------------------------------------------------------------
DB_PASSWORD="${FLEXCMS_DB_PASSWORD:-}"
MQ_PASSWORD="${FLEXCMS_MQ_PASSWORD:-}"

if [[ -z "$DB_PASSWORD" ]]; then
  read -rsp "Enter DB master password (min 8 chars): " DB_PASSWORD
  echo
fi
if [[ -z "$MQ_PASSWORD" ]]; then
  read -rsp "Enter RabbitMQ password (min 8 chars): " MQ_PASSWORD
  echo
fi

# ---------------------------------------------------------------------------
# Step 4: Ensure ECR repositories exist (if building or deploying frontend)
# ---------------------------------------------------------------------------
if [[ "$BUILD_FRONTEND" == true || -n "$ADMIN_IMAGE_URI" || -n "$SITE_IMAGE_URI" ]]; then
  echo ">>> Ensuring ECR repositories exist..."
  for repo in "flexcms-admin" "flexcms-site-nextjs"; do
    aws ecr describe-repositories --repository-names "$repo" --region "${REGION}" >/dev/null 2>&1 || \
      aws ecr create-repository --repository-name "$repo" --region "${REGION}" \
        --image-scanning-configuration scanOnPush=true \
        --tags Key=Environment,Value="${ENV}" >/dev/null
    echo "  ECR repo: ${ECR_REGISTRY}/${repo}"
  done
fi

# ---------------------------------------------------------------------------
# Step 5: Build and push frontend Docker images (optional)
# ---------------------------------------------------------------------------
if [[ "$BUILD_FRONTEND" == true ]]; then
  echo ""
  echo ">>> Getting Author ALB DNS from existing stack (needed for Admin UI build)..."
  AUTHOR_ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='AuthorALBDns'].OutputValue" \
    --output text --region "${REGION}" 2>/dev/null || echo "")

  DOMAIN_NAME=$(node -e "const p=require('${CFN_DIR}/params/${ENV}.json');
    const d=p.find(x=>x.ParameterKey==='DomainName');
    console.log(d?d.ParameterValue:'')" 2>/dev/null || echo "")

  if [[ -n "$DOMAIN_NAME" && -n "$CERT_ARN" ]]; then
    ADMIN_API_URL="https://api.${DOMAIN_NAME}"
    SITE_URL="https://site.${DOMAIN_NAME}"
  elif [[ -n "$AUTHOR_ALB_DNS" ]]; then
    ADMIN_API_URL="http://${AUTHOR_ALB_DNS}"
    SITE_URL=""
  else
    echo "  WARNING: Author ALB DNS not found. Deploy backend first with --action create."
    echo "  Falling back to placeholder URL. Rebuild after stack is up."
    ADMIN_API_URL="http://localhost:8080"
    SITE_URL=""
  fi

  echo "  Admin API URL (baked into bundle): ${ADMIN_API_URL}"

  # Log into ECR
  aws ecr get-login-password --region "${REGION}" | \
    docker login --username AWS --password-stdin "${ECR_REGISTRY}"

  # Build Admin UI
  echo ">>> Building Admin UI Docker image..."
  ADMIN_ECR="${ECR_REGISTRY}/flexcms-admin:${IMAGE_TAG}"
  docker build \
    --build-arg NEXT_PUBLIC_FLEXCMS_API="${ADMIN_API_URL}" \
    --build-arg NEXT_PUBLIC_FLEXCMS_SITE_URL="${SITE_URL}" \
    -f "${FRONTEND_DIR}/apps/admin/Dockerfile" \
    -t "${ADMIN_ECR}" \
    "${FRONTEND_DIR}"
  docker push "${ADMIN_ECR}"
  ADMIN_IMAGE_URI="${ADMIN_ECR}"
  echo "  Pushed: ${ADMIN_ECR}"

  # Build Site-nextjs
  echo ">>> Building Site-nextjs Docker image..."
  SITE_ECR="${ECR_REGISTRY}/flexcms-site-nextjs:${IMAGE_TAG}"
  docker build \
    -f "${FRONTEND_DIR}/apps/site-nextjs/Dockerfile" \
    -t "${SITE_ECR}" \
    "${FRONTEND_DIR}"
  docker push "${SITE_ECR}"
  SITE_IMAGE_URI="${SITE_ECR}"
  echo "  Pushed: ${SITE_ECR}"
fi

# ---------------------------------------------------------------------------
# Step 6: Build parameter overrides string
# ---------------------------------------------------------------------------
# Read qa.json / prod.json params (excluding EnvironmentName — passed directly)
PARAM_OVERRIDES_FILE=$(node -e "
const p=require('${CFN_DIR}/params/${ENV}.json');
const out=p.filter(x=>x.ParameterKey!=='EnvironmentName')
           .map(x=>x.ParameterKey+'='+x.ParameterValue)
           .join(' ');
process.stdout.write(out);
" 2>/dev/null || \
  # Fallback: awk-based parsing if node not available
  awk -F'"' '/ParameterKey/{k=$4} /ParameterValue/{if(k!="EnvironmentName")printf k"="$4" "}' \
    "${CFN_DIR}/params/${ENV}.json"
)

# Build optional param overrides
EXTRA_PARAMS=""
[[ -n "$ADMIN_IMAGE_URI" ]] && EXTRA_PARAMS+=" AdminImageUri=${ADMIN_IMAGE_URI}"
[[ -n "$SITE_IMAGE_URI" ]]  && EXTRA_PARAMS+=" SiteImageUri=${SITE_IMAGE_URI}"
[[ -n "$CERT_ARN" ]]        && EXTRA_PARAMS+=" CertificateArn=${CERT_ARN}"
[[ -n "$CF_CERT_ARN" ]]     && EXTRA_PARAMS+=" CloudFrontCertificateArn=${CF_CERT_ARN}"

# ---------------------------------------------------------------------------
# Step 7: Deploy CloudFormation stack
# ---------------------------------------------------------------------------
echo ""
echo ">>> Deploying stack ${STACK_NAME}..."
aws cloudformation deploy \
  --stack-name "${STACK_NAME}" \
  --template-file "${CFN_DIR}/main.yml" \
  --parameter-overrides \
    "EnvironmentName=${ENV}" \
    "DockerImageTag=${IMAGE_TAG}" \
    "DBMasterPassword=${DB_PASSWORD}" \
    "BrokerPassword=${MQ_PASSWORD}" \
    "TemplateBucketUrl=${TEMPLATE_URL}" \
    ${PARAM_OVERRIDES_FILE} \
    ${EXTRA_PARAMS} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "${REGION}" \
  --no-fail-on-empty-changeset

echo ""
echo ">>> Stack ${STACK_NAME} deployed successfully!"

# ---------------------------------------------------------------------------
# Step 8: Show outputs
# ---------------------------------------------------------------------------
echo ""
echo "=== Stack Outputs ==="
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" \
  --output table \
  --region "${REGION}"

# ---------------------------------------------------------------------------
# Step 9: Post-deploy hints
# ---------------------------------------------------------------------------
echo ""
echo "=== Next Steps ==="

AUTHOR_DNS=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='AuthorALBDns'].OutputValue" \
  --output text --region "${REGION}" 2>/dev/null || echo "<AuthorALBDns>")

ADMIN_DNS=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='AdminALBDns'].OutputValue" \
  --output text --region "${REGION}" 2>/dev/null || echo "<AdminALBDns>")

SITE_DNS=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='SiteALBDns'].OutputValue" \
  --output text --region "${REGION}" 2>/dev/null || echo "<SiteALBDns>")

CF_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue" \
  --output text --region "${REGION}" 2>/dev/null || echo "<CloudFrontDomain>")

RDS_EP=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" \
  --output text --region "${REGION}" 2>/dev/null || echo "<RDSEndpoint>")

echo ""
echo "1. Initialize RDS databases (first deploy only):"
echo "   bash infra/scripts/init-rds.sh ${ENV} ${RDS_EP}"
echo ""
echo "2. Build and deploy frontend images (if not done):"
echo "   ./deploy.sh --env ${ENV} --action update --build-frontend"
echo ""
echo "3. Set up DNS records in Route53 (flexcmsdemo.store hosted zone):"
echo "   qa.flexcmsdemo.store      → CNAME → ${CF_DOMAIN}   (CloudFront)"
echo "   api.qa.flexcmsdemo.store  → CNAME → ${AUTHOR_DNS}   (Author API)"
echo "   admin.qa.flexcmsdemo.store→ CNAME → ${ADMIN_DNS}   (Admin UI)"
echo "   site.qa.flexcmsdemo.store → CNAME → ${SITE_DNS}   (Site)"
echo ""
echo "4. Request ACM certificates (us-east-1 for CF, eu-central-1 for ALBs):"
echo "   us-east-1: aws acm request-certificate --domain-name '*.qa.flexcmsdemo.store' --validation-method DNS --region us-east-1"
echo "   eu-central-1: aws acm request-certificate --domain-name '*.qa.flexcmsdemo.store' --validation-method DNS --region eu-central-1"
echo "   Then re-deploy with --cert-arn and --cf-cert-arn flags."
echo ""
echo "5. Verify endpoints:"
echo "   curl http://${AUTHOR_DNS}/actuator/health/readiness    # Author API"
echo "   curl https://qa.flexcmsdemo.store                     # CloudFront / Site"
echo "   curl https://admin.qa.flexcmsdemo.store               # Admin UI"
