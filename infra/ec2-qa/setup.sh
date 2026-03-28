#!/bin/bash
# =============================================================================
# FlexCMS QA — EC2 bootstrap script (user-data)
# Provisions a single EC2 instance with Docker Compose running all services.
# Total setup time: ~5 minutes.
#
# Prerequisites:
#   - Amazon Linux 2023 or AL2 EC2 instance (m7i-flex.large recommended)
#   - Security group allowing: 22 (SSH), 8080 (Author), 8081 (Publish),
#     9001 (MinIO Console), 15672 (RabbitMQ Management)
# =============================================================================
set -euo pipefail

exec > >(tee /var/log/flexcms-setup.log) 2>&1
echo "=== FlexCMS QA setup started at $(date) ==="

# --- Install Docker + Docker Compose ---
yum update -y
yum install -y docker git
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Install Docker Compose v2
DOCKER_COMPOSE_VERSION="v2.27.1"
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# --- Set vm.max_map_count for Elasticsearch ---
sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" >> /etc/sysctl.conf

# --- Deploy FlexCMS ---
APP_DIR="/opt/flexcms"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Create docker-compose.yml inline
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: flexcms-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: flexcms
      POSTGRES_USER: flexcms
      POSTGRES_PASSWORD: FlexCmsQA2024!
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flexcms"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: flexcms-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: flexcms-rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: flexcms
      RABBITMQ_DEFAULT_PASS: FlexCmsQA2024!
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmqctl", "status"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: flexcms-minio
    command: server /data --console-address ":9001"
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  minio-init:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_started
    restart: "no"
    entrypoint: >
      /bin/sh -c "
      sleep 3;
      mc alias set local http://minio:9000 minioadmin minioadmin;
      mc mb --ignore-existing local/flexcms-assets;
      mc mb --ignore-existing local/flexcms-static;
      echo 'MinIO buckets created';
      "

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.4
    container_name: flexcms-elasticsearch
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - xpack.security.http.ssl.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - cluster.name=flexcms-qa
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:9200/_cluster/health || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 10

  author:
    image: ghcr.io/stgreenrecords/flexcms-app:latest
    container_name: flexcms-author
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: author,local
      SERVER_PORT: "8080"
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/flexcms_author
      SPRING_DATASOURCE_USERNAME: flexcms
      SPRING_DATASOURCE_PASSWORD: FlexCmsQA2024!
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: "6379"
      SPRING_RABBITMQ_HOST: rabbitmq
      SPRING_RABBITMQ_PORT: "5672"
      SPRING_RABBITMQ_USERNAME: flexcms
      SPRING_RABBITMQ_PASSWORD: FlexCmsQA2024!
      SPRING_ELASTICSEARCH_URIS: http://elasticsearch:9200
      FLEXCMS_PIM_DATASOURCE_URL: jdbc:postgresql://postgres:5432/flexcms_pim
      FLEXCMS_PIM_DATASOURCE_USERNAME: flexcms
      FLEXCMS_PIM_DATASOURCE_PASSWORD: FlexCmsQA2024!
      FLEXCMS_DAM_S3_ENDPOINT: http://minio:9000
      FLEXCMS_DAM_S3_ACCESS_KEY: minioadmin
      FLEXCMS_DAM_S3_SECRET_KEY: minioadmin
      FLEXCMS_DAM_S3_BUCKET: flexcms-assets
      FLEXCMS_DAM_S3_REGION: us-east-1
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy

  publish:
    image: ghcr.io/stgreenrecords/flexcms-app:latest
    container_name: flexcms-publish
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      SPRING_PROFILES_ACTIVE: publish,local
      SERVER_PORT: "8081"
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/flexcms_publish
      SPRING_DATASOURCE_USERNAME: flexcms
      SPRING_DATASOURCE_PASSWORD: FlexCmsQA2024!
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: "6379"
      SPRING_RABBITMQ_HOST: rabbitmq
      SPRING_RABBITMQ_PORT: "5672"
      SPRING_RABBITMQ_USERNAME: flexcms
      SPRING_RABBITMQ_PASSWORD: FlexCmsQA2024!
      SPRING_ELASTICSEARCH_URIS: http://elasticsearch:9200
      FLEXCMS_PIM_DATASOURCE_URL: jdbc:postgresql://postgres:5432/flexcms_pim
      FLEXCMS_PIM_DATASOURCE_USERNAME: flexcms
      FLEXCMS_PIM_DATASOURCE_PASSWORD: FlexCmsQA2024!
      FLEXCMS_DAM_S3_ENDPOINT: http://minio:9000
      FLEXCMS_DAM_S3_ACCESS_KEY: minioadmin
      FLEXCMS_DAM_S3_SECRET_KEY: minioadmin
      FLEXCMS_DAM_S3_BUCKET: flexcms-assets
      FLEXCMS_DAM_S3_REGION: us-east-1
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  minio_data:
  es_data:
COMPOSE_EOF

# Create init-db.sql
cat > init-db.sql << 'SQL_EOF'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE DATABASE flexcms_author;
CREATE DATABASE flexcms_publish;
CREATE DATABASE flexcms_pim;

\c flexcms_author;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c flexcms_publish;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c flexcms_pim;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
SQL_EOF

# Start everything
docker compose up -d

echo "=== FlexCMS QA setup completed at $(date) ==="
echo "Services will be healthy in ~60 seconds."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<public-ip>")
echo "  Author API:      http://${PUBLIC_IP}:8080"
echo "  Publish API:     http://${PUBLIC_IP}:8081"
echo "  RabbitMQ Mgmt:   http://${PUBLIC_IP}:15672"
echo "  MinIO Console:   http://${PUBLIC_IP}:9001"
