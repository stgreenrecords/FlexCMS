# syntax=docker/dockerfile:1
# Multi-stage build for FlexCMS application server

# ---------------------------------------------------------------------------
# Stage 1: Build
# ---------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Copy only POM files first to leverage Docker layer caching for dependencies
COPY pom.xml .
COPY flexcms-plugin-api/pom.xml flexcms-plugin-api/
COPY flexcms-core/pom.xml flexcms-core/
COPY flexcms-author/pom.xml flexcms-author/
COPY flexcms-publish/pom.xml flexcms-publish/
COPY flexcms-headless/pom.xml flexcms-headless/
COPY flexcms-dam/pom.xml flexcms-dam/
COPY flexcms-replication/pom.xml flexcms-replication/
COPY flexcms-search/pom.xml flexcms-search/
COPY flexcms-cache/pom.xml flexcms-cache/
COPY flexcms-cdn/pom.xml flexcms-cdn/
COPY flexcms-i18n/pom.xml flexcms-i18n/
COPY flexcms-multisite/pom.xml flexcms-multisite/
COPY flexcms-clientlibs/pom.xml flexcms-clientlibs/
COPY flexcms-pim/pom.xml flexcms-pim/
COPY flexcms-app/pom.xml flexcms-app/

# Resolve dependencies (cached unless pom.xml changes)
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B --no-transfer-progress -q 2>/dev/null || true

# Copy sources
COPY . .

# Build — skip tests (already run in CI before Docker build)
RUN --mount=type=cache,target=/root/.m2 \
    mvn package -DskipTests -B --no-transfer-progress -pl flexcms-app -am

# Extract Spring Boot layered JAR
RUN java -Djarmode=layertools -jar flexcms-app/target/*.jar extract --destination extracted

# ---------------------------------------------------------------------------
# Stage 2: Runtime image
# ---------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Non-root user for security
RUN addgroup -S flexcms && adduser -S flexcms -G flexcms
USER flexcms

WORKDIR /app

# Copy layered JAR in order of change-frequency (least → most)
COPY --from=builder /workspace/extracted/dependencies/ ./
COPY --from=builder /workspace/extracted/spring-boot-loader/ ./
COPY --from=builder /workspace/extracted/snapshot-dependencies/ ./
COPY --from=builder /workspace/extracted/application/ ./

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "org.springframework.boot.loader.launch.JarLauncher"]
