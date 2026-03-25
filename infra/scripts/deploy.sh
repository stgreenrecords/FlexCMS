#!/usr/bin/env bash
# =============================================================================
# FlexCMS — Deploy CloudFormation stacks to AWS
# Usage: ./deploy.sh --env qa|prod --action create|update [--image-tag TAG]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CFN_DIR="${SCRIPT_DIR}/../cfn"

# Defaults
ENV=""
ACTION=""
IMAGE_TAG="latest"
REGION="${AWS_DEFAULT_REGION:-eu-central-1}"

usage() {
  echo "Usage: $0 --env <qa|prod> --action <create|update> [--image-tag TAG] [--region REGION]"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --env)      ENV="$2"; shift 2;;
    --action)   ACTION="$2"; shift 2;;
    --image-tag) IMAGE_TAG="$2"; shift 2;;
    --region)   REGION="$2"; shift 2;;
    *)          usage;;
  esac
done

[[ -z "$ENV" || -z "$ACTION" ]] && usage
[[ "$ENV" != "qa" && "$ENV" != "prod" ]] && { echo "Error: --env must be qa or prod"; exit 1; }
[[ "$ACTION" != "create" && "$ACTION" != "update" ]] && { echo "Error: --action must be create or update"; exit 1; }

STACK_NAME="flexcms-${ENV}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
TEMPLATE_BUCKET="flexcms-${ENV}-cfn-templates-${ACCOUNT_ID}"

echo "=== FlexCMS Infrastructure Deploy ==="
echo "  Environment:  ${ENV}"
echo "  Action:       ${ACTION}"
echo "  Region:       ${REGION}"
echo "  Image Tag:    ${IMAGE_TAG}"
echo "  Stack Name:   ${STACK_NAME}"
echo "  Template S3:  s3://${TEMPLATE_BUCKET}"
echo ""

# Step 1: Create template bucket if not exists
echo ">>> Ensuring S3 template bucket exists..."
aws s3 mb "s3://${TEMPLATE_BUCKET}" --region "${REGION}" 2>/dev/null || true

# Step 2: Upload nested templates to S3
echo ">>> Uploading CloudFormation templates to S3..."
for f in "${CFN_DIR}"/*.yml; do
  [[ "$(basename "$f")" == "main.yml" ]] && continue
  echo "  Uploading $(basename "$f")..."
  aws s3 cp "$f" "s3://${TEMPLATE_BUCKET}/$(basename "$f")" --region "${REGION}"
done

TEMPLATE_URL="https://${TEMPLATE_BUCKET}.s3.${REGION}.amazonaws.com"

# Step 3: Read passwords from environment or prompt
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

# Step 4: Deploy
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
    $(cat "${CFN_DIR}/params/${ENV}.json" | python3 -c "
import json, sys
params = json.load(sys.stdin)
for p in params:
    if p['ParameterKey'] not in ['EnvironmentName']:
        print(f\"{p['ParameterKey']}={p['ParameterValue']}\")
") \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "${REGION}" \
  --no-fail-on-empty-changeset

echo ">>> Stack ${STACK_NAME} deployed successfully!"
echo ""

# Step 5: Show outputs
echo "=== Stack Outputs ==="
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" \
  --output table \
  --region "${REGION}"

