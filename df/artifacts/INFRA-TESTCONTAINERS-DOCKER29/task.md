# INFRA-TESTCONTAINERS-DOCKER29 — Integration tests cannot run on Docker Engine 29+

## Summary

- Priority: P1
- Type: Bug
- Owner role/lane: `devops`
- Source: discovered during `BUG-CONTENT-DELETE`

## Problem

Every `*IT` integration test in the repository fails before it starts:

```
Could not find a valid Docker environment. Please check configuration. Attempted configurations were:
  NpipeSocketClientProviderStrategy: failed with exception BadRequestException (Status 400 ...)
```

The parent pom pins `testcontainers-bom` to `1.19.8`. That line bundles a
docker-java whose API version negotiation is rejected by Docker Engine 29
(`server API 1.55, min 1.40`) with HTTP 400.

Affected suites: `ContentNodeRepositoryIT`, `ProductRepositoryIT`,
`ReplicationAgentIT`, `ReplicationReceiverIT`.

## What was already tried

- `DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine` — no change.
- `DOCKER_API_VERSION=1.44` — no change.
- Inheriting the Spring Boot 4.1-managed `testcontainers.version` (`2.0.5`) — fails
  to resolve: Testcontainers 2.x renames the `org.testcontainers:junit-jupiter`,
  `postgresql`, and `rabbitmq` coordinates, so this is a migration, not a bump.

## Second, independent problem

Even when they can run, the ITs are **not wired into any build stage**. Surefire's
default includes do not match `*IT`, and nothing runs `mvn verify`. A pre-existing
`ContentNodeRepositoryIT.deleteSubtree_removesNodeAndAllDescendants` test would
have caught `BUG-CONTENT-DELETE` long ago, but has never executed.

## Deliverables

- Migrate to the Spring Boot-managed Testcontainers line, updating artifact
  coordinates and any renamed imports across `flexcms-core`, `flexcms-pim`, and
  `flexcms-replication`.
- Wire the ITs into a build stage (failsafe bound to `verify`, or a surefire
  include) so they actually gate.
- Add the IT stage to the pre-push validation sequence in `CLAUDE.md`.

## Acceptance criteria

- AC1: `ContentNodeRepositoryIT`, `ProductRepositoryIT`, `ReplicationAgentIT`, and
  `ReplicationReceiverIT` all run and pass on Docker Engine 29+.
- AC2: A build stage executes them; a deliberately broken repository query fails it.
- AC3: `CLAUDE.md` pre-push validation documents the stage.
- AC4: The `pom.xml` comment about the 1.19.8 constraint is removed once resolved.
