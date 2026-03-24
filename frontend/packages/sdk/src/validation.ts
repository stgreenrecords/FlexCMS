/**
 * @flexcms/sdk — Zod validation schemas
 *
 * Runtime validators for all inputs passed into the SDK. These can be used by
 * application code to validate user-provided configuration and request options
 * before they are forwarded to the FlexCMS API.
 *
 * @example
 * ```ts
 * import { FlexCmsConfigSchema, SearchOptionsSchema } from '@flexcms/sdk/validation';
 *
 * const config = FlexCmsConfigSchema.parse({ apiUrl: 'https://api.example.com' });
 * const opts   = SearchOptionsSchema.parse({ page: 0, size: 20 });
 * ```
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

export const FlexCmsConfigSchema = z.object({
  /** Base URL of the FlexCMS API — must be a non-empty string */
  apiUrl: z.string().min(1, 'apiUrl is required'),
  /** Optional default site ID */
  defaultSite: z.string().min(1).optional(),
  /** Optional default locale (e.g., "en", "de", "fr") */
  defaultLocale: z.string().min(1).optional(),
  /** Custom fetch implementation (for SSR environments) */
  fetch: z.function().optional(),
  /** Additional headers for every request */
  headers: z.record(z.string()).optional(),
});

export type ValidatedFlexCmsConfig = z.infer<typeof FlexCmsConfigSchema>;

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export const SearchOptionsSchema = z.object({
  site: z.string().min(1).optional(),
  locale: z.string().min(1).optional(),
  /** Zero-based page index */
  page: z.number().int().nonnegative().optional(),
  /** Maximum items per page (1–100) */
  size: z.number().int().min(1).max(100).optional(),
});

export type ValidatedSearchOptions = z.infer<typeof SearchOptionsSchema>;

/** Query string passed to search — must be non-empty */
export const SearchQuerySchema = z
  .string()
  .min(1, 'Search query must not be empty')
  .max(500, 'Search query must not exceed 500 characters');

// ---------------------------------------------------------------------------
// Page fetch options
// ---------------------------------------------------------------------------

export const PageFetchOptionsSchema = z.object({
  site: z.string().min(1).optional(),
  locale: z.string().min(1).optional(),
});

export type ValidatedPageFetchOptions = z.infer<typeof PageFetchOptionsSchema>;

// ---------------------------------------------------------------------------
// Navigation fetch options
// ---------------------------------------------------------------------------

export const NavigationOptionsSchema = z.object({
  /** Depth of the navigation tree (1–10) */
  depth: z.number().int().min(1).max(10).default(3),
});

export type ValidatedNavigationOptions = z.infer<typeof NavigationOptionsSchema>;

// ---------------------------------------------------------------------------
// Path validation
// ---------------------------------------------------------------------------

/** Content path — alphanumeric segments separated by "/" */
export const ContentPathSchema = z
  .string()
  .min(1, 'Content path must not be empty')
  .regex(/^[a-zA-Z0-9/_-]+$/, 'Content path must only contain letters, numbers, hyphens, underscores, and slashes');

/** Site ID — lowercase alphanumeric with hyphens */
export const SiteIdSchema = z
  .string()
  .min(1, 'siteId must not be empty')
  .regex(/^[a-z0-9-]+$/, 'siteId must be lowercase alphanumeric with hyphens');

/** Locale — BCP 47 format (e.g., "en", "en-US", "de-DE") */
export const LocaleSchema = z
  .string()
  .min(2, 'locale must be at least 2 characters')
  .regex(/^[a-z]{2,3}(-[A-Z]{2,3})?$/, 'locale must be a valid BCP 47 tag (e.g., "en", "en-US")');
