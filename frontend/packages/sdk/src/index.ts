// @flexcms/sdk — Framework-agnostic core for FlexCMS headless API
// This package has ZERO framework dependencies. It works everywhere.

export { FlexCmsClient, FlexCmsApiError } from './client';
export { ComponentMapper } from './mapper';
export {
  walkComponentTree,
  collectResourceTypes,
  findComponentByName,
  findComponentsByType,
} from './walker';
export type {
  FlexCmsConfig,
  PageResponse,
  PageMeta,
  ComponentNode,
  NavigationItem,
  SearchResult,
  SearchHit,
  SearchOptions,
  Asset,
  AssetRendition,
  ComponentRegistryResponse,
  ComponentDefinition,
} from './types';

// Zod validation schemas
export {
  FlexCmsConfigSchema,
  SearchOptionsSchema,
  SearchQuerySchema,
  PageFetchOptionsSchema,
  NavigationOptionsSchema,
  ContentPathSchema,
  SiteIdSchema,
  LocaleSchema,
} from './validation';
export type {
  ValidatedFlexCmsConfig,
  ValidatedSearchOptions,
  ValidatedPageFetchOptions,
  ValidatedNavigationOptions,
} from './validation';

