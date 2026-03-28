-- =============================================================================
-- FlexCMS QA — PostgreSQL init script
-- Runs once on first container start (docker-entrypoint-initdb.d)
-- Creates all required databases and extensions.
-- =============================================================================

-- Extensions on the default 'flexcms' database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create application databases
CREATE DATABASE flexcms_author;
CREATE DATABASE flexcms_publish;
CREATE DATABASE flexcms_pim;

-- Enable extensions on flexcms_author
\c flexcms_author;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable extensions on flexcms_publish
\c flexcms_publish;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable extensions on flexcms_pim (no ltree needed)
\c flexcms_pim;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

