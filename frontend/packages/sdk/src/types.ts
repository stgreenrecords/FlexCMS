/**
 * @flexcms/sdk — TypeScript interfaces
 *
 * These types define the contract between the FlexCMS backend and any frontend.
 * They mirror the JSON shapes returned by the REST/GraphQL APIs.
 */

// ---------------------------------------------------------------------------
// Page & Component Response (THE CONTRACT)
// ---------------------------------------------------------------------------

/** Full page response from the headless API */
export interface PageResponse {
  page: PageMeta;
  components: ComponentNode[];
}

/** Page-level metadata */
export interface PageMeta {
  path: string;
  title: string;
  description: string;
  template: string;
  locale: string;
  lastModified: string;
}

/** A single component in the page tree (recursive) */
export interface ComponentNode {
  name: string;
  resourceType: string;
  data: Record<string, unknown>;
  children?: ComponentNode[];
  /** Present only if the backend Sling Model threw an error */
  _error?: string;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavigationItem {
  title: string;
  url: string;
  path?: string;
  active?: boolean;
  children?: NavigationItem[];
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResult {
  totalCount: number;
  items: SearchHit[];
}

export interface SearchHit {
  path: string;
  title: string;
  excerpt?: string;
  score: number;
  type?: string;
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export interface Asset {
  id: string;
  path: string;
  title?: string;
  mimeType: string;
  width?: number;
  height?: number;
  renditions: AssetRendition[];
}

export interface AssetRendition {
  key: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
}

// ---------------------------------------------------------------------------
// Component Registry (schema contract)
// ---------------------------------------------------------------------------

export interface ComponentRegistryResponse {
  components: ComponentDefinition[];
  version: string;
  generatedAt: string;
}

export interface ComponentDefinition {
  resourceType: string;
  name: string;
  title?: string;
  description?: string;
  group?: string;
  icon?: string;
  isContainer: boolean;
  /** JSON Schema (draft-07) describing the component's output data shape */
  dataSchema?: Record<string, unknown>;
  /** Dialog definition for the authoring UI */
  dialog?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Client Configuration
// ---------------------------------------------------------------------------

export interface FlexCmsConfig {
  /** Base URL of the FlexCMS API (e.g., "https://api.example.com") */
  apiUrl: string;
  /** Default site ID (e.g., "corporate") */
  defaultSite?: string;
  /** Default locale (e.g., "en") */
  defaultLocale?: string;
  /** Custom fetch implementation (for SSR environments) */
  fetch?: typeof globalThis.fetch;
  /** Custom headers to include in every request */
  headers?: Record<string, string>;
}

export interface SearchOptions {
  site?: string;
  locale?: string;
  page?: number;
  size?: number;
}

