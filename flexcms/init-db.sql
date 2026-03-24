-- Initialization script for PostgreSQL
-- Creates required extensions and additional databases

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create separate databases for author and publish environments
CREATE DATABASE flexcms_author;
CREATE DATABASE flexcms_publish;

-- Create separate database for PIM (independent module)
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

