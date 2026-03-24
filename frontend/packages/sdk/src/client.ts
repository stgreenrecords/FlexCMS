import type {
  FlexCmsConfig,
  PageResponse,
  NavigationItem,
  SearchResult,
  SearchOptions,
  ComponentRegistryResponse,
  Asset,
} from './types';

/**
 * Framework-agnostic client for the FlexCMS headless API.
 *
 * Works in any environment — browser, Node.js SSR (Next.js getServerSideProps),
 * Nuxt useAsyncData, Angular HttpClient wrapper, etc.
 *
 * @example
 * ```ts
 * const client = new FlexCmsClient({ apiUrl: 'https://api.example.com' });
 * const page = await client.getPage('/about', { site: 'corporate', locale: 'en' });
 * ```
 */
export class FlexCmsClient {
  private readonly config: Required<Pick<FlexCmsConfig, 'apiUrl'>> & FlexCmsConfig;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(config: FlexCmsConfig) {
    this.config = config;
    this.fetcher = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  // ---------------------------------------------------------------------------
  // Pages
  // ---------------------------------------------------------------------------

  /** Fetch a page with its full component tree */
  async getPage(
    path: string,
    options?: { site?: string; locale?: string }
  ): Promise<PageResponse> {
    const headers: Record<string, string> = {};
    const site = options?.site ?? this.config.defaultSite;
    const locale = options?.locale ?? this.config.defaultLocale;

    if (site) headers['X-FlexCMS-Site'] = site;
    if (locale) headers['X-FlexCMS-Locale'] = locale;

    return this.get<PageResponse>(`/api/content/v1/pages/${stripLeadingSlash(path)}`, headers);
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /** Fetch the navigation tree for a site */
  async getNavigation(
    site: string,
    locale: string,
    depth = 3
  ): Promise<NavigationItem[]> {
    return this.get<NavigationItem[]>(
      `/api/content/v1/navigation/${site}/${locale}?depth=${depth}`
    );
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  /** Full-text content search */
  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query });
    if (options?.site) params.set('site', options.site);
    if (options?.locale) params.set('locale', options.locale);
    if (options?.page != null) params.set('page', String(options.page));
    if (options?.size != null) params.set('size', String(options.size));

    return this.get<SearchResult>(`/api/content/v1/search?${params}`);
  }

  // ---------------------------------------------------------------------------
  // Component Registry (the contract)
  // ---------------------------------------------------------------------------

  /** Fetch the full component registry with data schemas */
  async getComponentRegistry(): Promise<ComponentRegistryResponse> {
    return this.get<ComponentRegistryResponse>('/api/content/v1/component-registry');
  }

  // ---------------------------------------------------------------------------
  // Assets
  // ---------------------------------------------------------------------------

  /** Fetch asset details by ID */
  async getAsset(id: string): Promise<Asset> {
    return this.get<Asset>(`/api/dam/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async get<T>(path: string, extraHeaders?: Record<string, string>): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.config.headers,
      ...extraHeaders,
    };

    const response = await this.fetcher(url, { headers });

    if (!response.ok) {
      throw new FlexCmsApiError(response.status, response.statusText, url);
    }

    return response.json() as Promise<T>;
  }
}

/** Error thrown when a FlexCMS API call fails */
export class FlexCmsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string
  ) {
    super(`FlexCMS API error: ${status} ${statusText} at ${url}`);
    this.name = 'FlexCmsApiError';
  }
}

function stripLeadingSlash(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

