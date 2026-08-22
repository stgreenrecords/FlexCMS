# REB-19 — Local environment provisioning (devops)

Session start: 2026-08-19 21:22 CEDT · Mode B (interactive) · role `devops`

## Why this document exists

REB-19 is a live-stack Selenium suite: it needs the Author API, the headless
JSON API, the admin editor, the rendered public site, and the publish
environment. This workstation had **no toolchain at all**, so none of the
developer testing bar in `df/03-orchestration-rules.md` could be met until the
stack existed. The human explicitly authorised provisioning before delivery work
started.

## Starting state (verified, not assumed)

Verified through PowerShell using the real user PATH, not only the Git Bash shell:

| Check | Result |
|---|---|
| `mvn` | NOT FOUND — no install, no `~/.m2`, no `mvnw` wrapper in the repo |
| `pnpm` | NOT FOUND |
| `node` | `C:\Program Files\nodejs\node.exe` (v24.19.0) |
| `java` | JDK 26.0.2.1 (matches `<java.version>26</java.version>`) |
| `docker` | Docker Desktop running, **0 images, 0 containers** |
| `frontend/node_modules`, `flexcms/*/target` | absent |
| Chrome | 151.0.7922.170 |
| author :8080 / publish :8081 / admin :3000 / site :3001 | all down |

## Steps performed

### 1. Apache Maven 3.9.16

Not available in `winget` (only unrelated `Tag: maven` packages), and no
Chocolatey admin install was wanted, so the official Apache binary distribution
was installed into the user profile — no administrator rights required.

```bash
curl -sSL -o maven.zip https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip
curl -sSL -o maven.zip.sha512 https://downloads.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip.sha512
```

SHA-512 verified against the Apache-published checksum — **match**:

```
ed41650d42485cfc243fad22158caf9cbb5dc408ce7a09ddb94dd42a019de929ca43065bfa450612cf12bf78b5cafa3884b96c090de326ff590448c933454af3
```

Extracted to `C:\Users\Viach\tools\apache-maven-3.9.16`. Shims written to
`C:\Users\Viach\bin` (already on PATH): `mvn.cmd` for Windows shells and `mvn`
for Git Bash.

```
Apache Maven 3.9.16
Java version: 26.0.2.1, vendor: Oracle Corporation
```

### 2. Corporate TLS interception — Maven Central untrusted

First build failed:

```
[FATAL] Non-resolvable parent POM for com.flexcms:flexcms-parent:1.0.0-SNAPSHOT:
  org.springframework.boot:spring-boot-starter-parent:pom:4.1.0 (absent):
  (certificate_unknown) PKIX path building failed:
  unable to find valid certification path to requested target
```

The network MITM-inspects TLS. The corporate root CA is trusted by Windows but
not by the JDK's bundled `cacerts`. Fixed without editing the JDK truststore by
pointing Java at the Windows root store, and persisted as a user environment
variable so future sessions inherit it:

```
MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=Windows-ROOT
```

Recorded as a hint in `hints_for_agent.md`.

### 3. pnpm 9.0.0

`frontend/package.json` pins `"packageManager": "pnpm@9.0.0"`, so the exact
version was installed globally through npm into
`C:\Users\Viach\AppData\Roaming\npm` (on PATH, no admin):

```bash
npm install -g pnpm@9.0.0     # -> 9.0.0
```

### 4. Infrastructure containers

`flex start local` uses `infra/local/docker-compose.dev.yml`, which is the richer
file (adds `minio-init` bucket bootstrap plus profiled `author`/`publish`/`cdn`
services) and shares container names with `flexcms/docker-compose.yml`. The
`infra/local` file is therefore the one used here; the default profile starts
infrastructure only.

```bash
docker compose -f infra/local/docker-compose.dev.yml up -d
```

Started: postgres 16, redis 7, rabbitmq 3-management, minio (+ `minio-init`),
elasticsearch 8.13.4, pgadmin 4.

### 5. Backend build

```bash
cd flexcms && mvn clean install -DskipTests -B --no-transfer-progress
```

Result: **BUILD SUCCESS**, total time 01:23.

### 6. Python seed dependency

```bash
python -m pip install --user psycopg2-binary   # -> psycopg2 2.9.12
```

### 7. Author runtime

```bash
cd flexcms && mvn spring-boot:run -pl flexcms-app -am -Dspring-boot.run.profiles=author,local
```

`Started FlexCmsApplication in 11.213 seconds`, Tomcat on port 8080. The `-am`
flag is used deliberately per the existing hint about stale module jars.

## Blockers found and fixed in the repository

See `df/artifacts/REB-19/devops/repo-defects.md`.
