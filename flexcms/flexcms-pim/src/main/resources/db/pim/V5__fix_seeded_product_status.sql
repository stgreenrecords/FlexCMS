-- =============================================================================
-- V5: correct the seeded product status
--
-- Problem (INFRA-TESTCONTAINERS-DOCKER29 blocker I29-1): V4__tut_pim_sample_seed.sql
-- inserts products with status 'ACTIVE', but com.flexcms.pim.model.ProductStatus
-- defines only DRAFT, REVIEW, PUBLISHED, ARCHIVED. Product.status is mapped
-- @Enumerated(EnumType.STRING), so hydrating any seeded product throws
--
--   IllegalArgumentException: No enum constant com.flexcms.pim.model.ProductStatus.ACTIVE
--
-- Every seeded TUT product was therefore unreadable through the PIM JPA layer —
-- confirmed on the live database, where all four seeded products carried 'ACTIVE'.
--
-- Fix direction: the data is corrected to a status the domain defines, rather than
-- ACTIVE being added to the enum. The seeded catalogue is sample content meant to be
-- visible, so PUBLISHED is its intended state, and the enum's four values are
-- coherent as a lifecycle (DRAFT -> REVIEW -> PUBLISHED -> ARCHIVED) that an extra
-- ACTIVE would blur. Note 'ACTIVE' remains valid for *catalogs*
-- (Catalog.CatalogStatus) and for product_variants.status, which is a plain string —
-- this migration deliberately touches neither.
--
-- V4 itself is corrected in place for fresh installs; this migration repairs
-- databases where V4 has already run. pimFlyway is configured
-- validateOnMigrate(false), so the V4 checksum change does not break existing
-- deployments.
-- =============================================================================

UPDATE products
SET status = 'PUBLISHED'
WHERE status = 'ACTIVE';
