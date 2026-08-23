-- Integration-test database provisioning for the PIM module.
--
-- The PIM Flyway migrations assume the extensions already exist: V1__pim_schema.sql
-- declares `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()` without creating
-- "uuid-ossp" first. That is the platform's contract rather than an oversight —
-- extensions are an environment concern here, provisioned before migrations run:
--
--   * CI:    .github/workflows/ci.yml creates them per database with psql
--   * local: flexcms/init-db.sql does the same for the compose database
--
-- A Testcontainers postgres:16-alpine starts with neither, so without this script
-- the PIM Flyway run fails on `function uuid_generate_v4() does not exist` and
-- every ProductRepositoryIT test errors during context initialisation.
--
-- Keep this list identical to the flexcms_pim line in ci.yml: uuid-ossp and
-- pg_trgm, but not ltree (the PIM schema has no hierarchical paths).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
