# INFRA-TESTCONTAINERS-DOCKER29 — findings

The four `*IT` suites had never executed. Running them for the first time exposed
one product defect and three test-context gaps. Everything below was **observed at
runtime** against the running local stack or reproduced directly against the
database, and each item names the exact file and symbol.

The three test-context gaps were fixed inside this task (they are test code, the
`devops` lane owns them, and each is described here so the reasoning survives).
The product defect is outside this lane and is reported for SA routing.

---

## I29-1 — The PIM sample seed writes a `products.status` the application cannot read

> **RESOLVED 2026-08-23.** PIM migration `V5__fix_seeded_product_status.sql` rewrites the
> existing rows and `V4` is corrected for fresh installs. `PUBLISHED` was chosen over
> adding `ACTIVE` to the enum: the seeded catalogue is sample content meant to be
> visible, and the four existing values form a coherent lifecycle. `catalogs.status` and
> `product_variants.status` were left alone — `ACTIVE` is valid for both. Verified live:
> all four seeded products now read `PUBLISHED`.


**Severity:** high. Every seeded TUT product is unreadable through the PIM JPA
layer, in the real environment and not only in tests.

**Where:**
- `flexcms-pim` → `src/main/resources/db/pim/V4__tut_pim_sample_seed.sql`
- `flexcms-pim` → `com.flexcms.pim.model.ProductStatus`

**What:** the seed inserts products with `status = 'ACTIVE'`:

```sql
INSERT INTO products (id, sku, name, catalog_id, schema_id, attributes, status, created_by, updated_by)
SELECT uuid_generate_v4(), 'TUT-SOVEREIGN-2026', 'TUT Sovereign', …
       'ACTIVE',
       'system', 'system'
```

`ProductStatus` does not define that constant:

```java
public enum ProductStatus {
    DRAFT,
    REVIEW,
    PUBLISHED,
    ARCHIVED
}
```

Hibernate maps the column with `EnumType.STRING`, so hydrating any seeded row
throws `IllegalArgumentException: No enum constant
com.flexcms.pim.model.ProductStatus.ACTIVE`. It is not a test-only condition — the
value is in the shipped migration.

**Observed** (live `flexcms_pim`, the database the running author app uses):

```
flexcms_pim=> select status, count(*) from products group by status;
 status | count
--------+-------
 ACTIVE |     4

flexcms_pim=> select status, count(*) from catalogs group by status;
 status | count
--------+-------
 ACTIVE |     1        <-- legitimate: Catalog.CatalogStatus does define ACTIVE
```

Only `products` is affected. `catalogs.status` is fine because
`Catalog.CatalogStatus` is `{DRAFT, ACTIVE, ARCHIVED}`, and
`product_variants.status` is a plain `String` (`ProductVariant.status`, default
`"ACTIVE"`), so neither collides with `ProductStatus`.

**How it surfaced:** `ProductRepositoryIT.setUp()` called
`productRepository.deleteAll()`, which Spring Data implements as *load every
entity, then delete each one*. Loading the seeded rows threw before any test body
ran, so all 13 tests errored identically.

**Consequence beyond this task:** `REB-23` (PIM catalog/product authoring E2E) will
hit the same wall the moment it reads a seeded product.

**Suggested lane:** `backend-dev`, with `sa` choosing the semantics — either add
`ACTIVE` to `ProductStatus` or change the seed to a defined constant such as
`PUBLISHED`. Note the seed is already-applied migration history in every existing
database (`flyway_schema_history` shows V4 succeeded), so a seed edit needs either
a follow-up migration that rewrites the rows or an accepted checksum change;
`pimFlyway` is configured `validateOnMigrate(false)`, which softens but does not
remove that concern.

---

## Test-context gaps fixed in this task

These three are why the suites could not run even once Testcontainers worked. All
are test-side; none masks a product defect.

### G-1 — The PIM IT container had no database extensions

`V1__pim_schema.sql` uses `uuid_generate_v4()` without creating `uuid-ossp`, so
the PIM Flyway run failed on a bare `postgres:16-alpine` with
`ERROR: function uuid_generate_v4() does not exist`.

This is **not** a migration defect: extensions are an environment concern in this
platform, provisioned before migrations run. `.github/workflows/ci.yml` creates
them per database with `psql`, and `flexcms/init-db.sql` does the same for the
compose database. Only the Testcontainers container had nobody doing it.

**Fix:** `flexcms-pim/src/test/resources/db/it/pim-extensions.sql`, wired through
`.withInitScript(...)`, creating `uuid-ossp` and `pg_trgm` — the exact pair
`ci.yml` uses for `flexcms_pim`, deliberately without `ltree` since the PIM schema
has no hierarchical paths.

### G-2 — Library-module test slices boot far more than they need

`PimTestApplication` was `@SpringBootApplication` in `com.flexcms.pim`, so it
component-scanned the whole module. That instantiates the three
`@FlexCmsComponent` models in `com.flexcms.pim.component` (the annotation is
meta-annotated `@Component`), which inject plugin-API collaborators like
`DamClient` that have no implementation on the module's test classpath — and then
the service graph, which needs an `ObjectMapper`. The context failed before any
test ran.

**Fix:** the scan is limited to `com.flexcms.pim.config`. `PimDataSourceConfig` is
all a repository test needs: it builds the datasource, runs the PIM migrations,
declares the entity manager over `com.flexcms.pim.model`, and registers the
repositories itself via `@EnableJpaRepositories`. Verified safe: the JSONB
converter is a plain JPA `@Converter` holding its own static `ObjectMapper`, and
entities arrive through `setPackagesToScan`, so neither depends on component
scanning.

### G-3 — The replication slice lacked the core JPA layer and a Jackson 2 `ObjectMapper`

`ReplicationAgent`, `ReplicationReceiver`, and `ProductPublishListener` inject
`ContentNodeRepository` and `ReplicationLogRepository` from `flexcms-core`. Boot's
repository and entity scans are anchored at the test application's own package, so
neither was found.

Separately, `AuthorNodeClient` takes a
`com.fasterxml.jackson.databind.ObjectMapper` — **Jackson 2**. Spring Boot 4.1
auto-configures **Jackson 3**: `JacksonAutoConfiguration` (in
`spring-boot-jackson-4.1.0.jar`) produces a `tools.jackson.databind.json.JsonMapper`
and never registers the Jackson 2 type, which this codebase injects in a dozen
places. The running application only has one because
`com.flexcms.app.config.JacksonConfig` declares it by hand, and library modules
correctly do not depend on `flexcms-app`.

**Fix:** `ReplicationTestApplication` now adds
`@EntityScan("com.flexcms.core.model")`,
`@EnableJpaRepositories("com.flexcms.core.repository")`, and a bean mirroring
`JacksonConfig#flexCmsObjectMapper()` (`JavaTimeModule` included).

### G-4 — `ReplicationAgentIT` read the queue without stating a type

Three tests used `amqpTemplate.receiveAndConvert(queue, timeout)`, which gives the
converter no target type. `Jackson2JsonMessageConverter` then resolves the payload
from the `__TypeId__` header and `DefaultJackson2JavaTypeMapper` refuses it:
`The class 'com.flexcms.replication.model.ReplicationEvent' is not in the trusted
packages: [java.util, java.lang]`.

Production never takes that path — `ReplicationReceiver` consumes through
`@RabbitListener`, where Spring AMQP infers the payload type from the handler
signature, which is why `ReplicationReceiverIT` passed while these three did not.

**Fix:** the typed `receiveAndConvert(queue, timeout, ParameterizedTypeReference)`
overload, so the test supplies the type through the same production converter.
Deliberately **not** trusted-package widening to `*` (that loosens deserialization
safety to paper over a test-only gap) and **not** a test-only converter bean (the
IT would stop exercising the real one).

---

## Non-blocking observations

- **`mvn test` never ran a single integration test.** Surefire's default includes
  match `*Test`/`Test*`/`*Tests` and never the `*IT` suffix, and nothing ran
  `mvn verify`. `CLAUDE.md`'s pre-push list even labelled Step 2 "Backend unit +
  integration tests", which is how four suites stayed invisible long enough for
  `BUG-CONTENT-DELETE` to ship a defect that
  `ContentNodeRepositoryIT.deleteSubtree_removesNodeAndAllDescendants` would have
  caught. Both are corrected in this task.
- **A stale IDE-compiled class can mask a compile error as a runtime one.** A
  broken test class produced
  `java.lang.Error: Unresolved compilation problems: … EntityScan cannot be
  resolved` *at test runtime* rather than failing `mvn test-compile`: the VS Code
  Java language server had already compiled the file into `target/test-classes`,
  and Maven's incremental check saw the newer `.class` and skipped it. `mvn clean
  verify` is the reliable form after editing test sources.
- **`@EntityScan` moved in Boot 4.** It is
  `org.springframework.boot.persistence.autoconfigure.EntityScan`
  (`spring-boot-persistence-4.1.0.jar`), not
  `org.springframework.boot.autoconfigure.domain.EntityScan`.
- **The author API accepts any `resourceType` string** — unrelated to this task,
  already noted under `REB-20`; repeated here only because the PIM/replication
  slices make it easy to create nodes with types the content model never defines.
