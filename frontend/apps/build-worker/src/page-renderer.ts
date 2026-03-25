/**
 * PageRenderer — Renders CMS pages to static HTML using React SSR.
 *
 * Uses @flexcms/sdk to fetch page JSON and @flexcms/react to render
 * the component tree to an HTML string. Wraps output in a full HTML document.
 *
 * Key features:
 *  - Per-site component map caching (avoids repeated dynamic imports)
 *  - Built-in default renderers for all standard FlexCMS component types
 *  - Staleness check via ManifestManager (skips pages with unchanged content)
 *  - Retry with exponential backoff for transient API failures
 *  - SHA-256 content hash for cache-busting
 */
import { createHash } from 'node:crypto';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { FlexCmsClient, type PageResponse, type ComponentNode } from '@flexcms/sdk';
import { FlexCmsProvider, FlexCmsPage, type FlexCmsRenderer } from '@flexcms/react';
import { ComponentMapper } from '@flexcms/sdk';
import type { BuildWorkerConfig } from './index';
import type { ManifestManager } from './manifest-manager';
import { createLogger } from './logger';

const log = createLogger('page-renderer');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RenderResult {
  pagePath: string;
  html: string;
  contentVersion: string;
  hash: string;
  dependencies: DependencyEntry[];
  /** true when page was skipped because content version had not changed */
  skipped?: boolean;
}

export interface DependencyEntry {
  type: 'COMPONENT' | 'ASSET' | 'NAVIGATION';
  key: string;
}

// ---------------------------------------------------------------------------
// Default component renderers
// Built-in renderers for all standard FlexCMS component types.
// Site-specific component maps can override or extend these.
// ---------------------------------------------------------------------------

const richText: FlexCmsRenderer = ({ data }) =>
  React.createElement('div', {
    className: 'flexcms-rich-text',
    dangerouslySetInnerHTML: { __html: (data['content'] as string) ?? '' },
  });

const imageRenderer: FlexCmsRenderer = ({ data }) =>
  React.createElement(
    'figure',
    { className: 'flexcms-image' },
    React.createElement('img', {
      src: data['src'] as string,
      alt: (data['alt'] as string) ?? '',
      width: data['width'] as number | undefined,
      height: data['height'] as number | undefined,
      loading: 'lazy',
    }),
    data['caption']
      ? React.createElement('figcaption', null, data['caption'] as string)
      : null
  );

const hero: FlexCmsRenderer = ({ data }) =>
  React.createElement(
    'section',
    {
      className: 'flexcms-hero',
      style: {
        backgroundImage: data['backgroundImage']
          ? `url(${data['backgroundImage'] as string})`
          : undefined,
        padding: '6rem 2rem',
        textAlign: (data['textAlign'] as string) ?? 'center',
      },
    },
    React.createElement('h1', null, data['headline'] as string),
    data['subtext']
      ? React.createElement('p', null, data['subtext'] as string)
      : null,
    data['ctaLabel']
      ? React.createElement(
          'a',
          { href: (data['ctaHref'] as string) ?? '/' },
          data['ctaLabel'] as string
        )
      : null
  );

const container: FlexCmsRenderer = ({ data, children }) =>
  React.createElement(
    'div',
    {
      className: `flexcms-container flexcms-container--${(data['layout'] as string) ?? 'single'}`,
    },
    children
  );

const sharedHeader: FlexCmsRenderer = ({ data }) =>
  React.createElement(
    'header',
    { className: 'flexcms-header' },
    React.createElement('a', { href: '/' }, (data['logo'] as string) ?? 'FlexCMS')
  );

const sharedFooter: FlexCmsRenderer = ({ data }) =>
  React.createElement(
    'footer',
    { className: 'flexcms-footer' },
    React.createElement(
      'p',
      null,
      (data['copyright'] as string) ??
        `© ${new Date().getFullYear()} FlexCMS Site`
    )
  );

const DEFAULT_COMPONENTS: Record<string, FlexCmsRenderer> = {
  'flexcms/rich-text':     richText,
  'flexcms/image':         imageRenderer,
  'flexcms/hero':          hero,
  'flexcms/container':     container,
  'flexcms/shared-header': sharedHeader,
  'flexcms/shared-footer': sharedFooter,
};

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      log.warn({ attempt, delay }, 'Retrying after transient error');
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}

// ---------------------------------------------------------------------------
// PageRenderer
// ---------------------------------------------------------------------------

export class PageRenderer {
  private client: FlexCmsClient;

  /**
   * Per-site component map cache.
   * Key: siteId | Value: resolved ComponentMapper
   */
  private mapperCache = new Map<string, ComponentMapper<FlexCmsRenderer>>();

  constructor(
    private config: BuildWorkerConfig,
    private manifest?: ManifestManager
  ) {
    this.client = new FlexCmsClient({ apiUrl: config.cmsApiUrl });
  }

  /**
   * Load (or retrieve from cache) the component map for a given site.
   *
   * Resolution order:
   *   1. In-memory cache (fastest path)
   *   2. Dynamic import from `SITE_COMPONENT_MAP_{SITE_ID}` env var (custom bundle path)
   *   3. Dynamic import from the site's compiled bundle at a conventional path
   *   4. Built-in default renderers (always works, covers standard component types)
   */
  async loadSiteComponentMap(siteId: string): Promise<ComponentMapper<FlexCmsRenderer>> {
    // 1. Cache hit
    const cached = this.mapperCache.get(siteId);
    if (cached) return cached;

    const mapper = new ComponentMapper<FlexCmsRenderer>();

    // 2. Register built-in defaults first (lowest priority)
    for (const [type, renderer] of Object.entries(DEFAULT_COMPONENTS)) {
      mapper.register(type, renderer);
    }

    // 3. Try to load a site-specific component map that can override defaults
    const envBundlePath = process.env[`SITE_COMPONENT_MAP_${siteId.toUpperCase().replace(/-/g, '_')}`];
    const conventionalPath = `./sites/${siteId}/component-map`;

    const pathsToTry = [envBundlePath, conventionalPath].filter(Boolean) as string[];

    for (const bundlePath of pathsToTry) {
      try {
        const mod = await import(bundlePath);
        const customMap: Record<string, FlexCmsRenderer> =
          mod.componentMap ?? mod.default ?? {};

        for (const [type, renderer] of Object.entries(customMap)) {
          if (typeof renderer === 'function') {
            mapper.register(type, renderer as FlexCmsRenderer);
          }
        }

        log.info({ siteId, bundlePath, count: Object.keys(customMap).length },
          'Loaded site-specific component map');
        break;
      } catch {
        // Not found at this path — try next or fall through to defaults
      }
    }

    // 4. Set a catch-all fallback renderer for unknown types
    mapper.setFallback(({ data, children }: { data: Record<string, unknown>; children?: React.ReactNode }) =>
      React.createElement(
        'div',
        { 'data-flexcms-component': 'true' },
        ...(children ? [children] : []),
        data?.['content']
          ? React.createElement('div', {
              dangerouslySetInnerHTML: { __html: data['content'] as string },
            })
          : null
      )
    );

    this.mapperCache.set(siteId, mapper);
    log.debug({ siteId }, 'Component map ready');
    return mapper;
  }

  /**
   * Invalidate the cached component map for a site (e.g., after a deployment).
   */
  invalidateCache(siteId?: string): void {
    if (siteId) {
      this.mapperCache.delete(siteId);
    } else {
      this.mapperCache.clear();
    }
  }

  /**
   * Render a batch of pages with bounded concurrency.
   * Skips pages whose content version is unchanged (via ManifestManager).
   */
  async renderBatch(
    pagePaths: string[],
    siteId: string,
    locale: string,
    concurrency: number
  ): Promise<RenderResult[]> {
    const results: RenderResult[] = [];
    const queue = [...pagePaths];

    const workers = Array.from(
      { length: Math.min(concurrency, Math.max(queue.length, 1)) },
      async () => {
        while (queue.length > 0) {
          const path = queue.shift()!;
          try {
            const result = await this.renderPage(path, siteId, locale);
            results.push(result);
          } catch (err) {
            log.error({ err, path, siteId }, 'Failed to render page');
          }
        }
      }
    );

    await Promise.all(workers);
    return results;
  }

  /**
   * Render a single page to static HTML.
   * Checks the manifest first and skips if the content version is unchanged.
   */
  async renderPage(pagePath: string, siteId: string, locale: string): Promise<RenderResult> {
    // 1. Fetch page JSON from FlexCMS API (with retry)
    const pageData = await withRetry(() =>
      this.client.getPage(pagePath, { site: siteId, locale })
    );

    // 2. Staleness check — skip rendering if content version unchanged
    if (this.manifest) {
      const stale = await this.manifest.isStale(
        siteId,
        locale,
        pagePath,
        pageData.page.lastModified
      );
      if (!stale) {
        log.debug({ pagePath }, 'Skipping unchanged page');
        return {
          pagePath,
          html: '',
          contentVersion: pageData.page.lastModified,
          hash: '',
          dependencies: [],
          skipped: true,
        };
      }
    }

    // 3. Load component map for this site
    const componentMap = await this.loadSiteComponentMap(siteId);

    // 4. Collect dependency metadata from the component tree
    const dependencies = this.collectDependencies(pageData);

    // 5. Render React component tree to HTML string
    const pageElement = React.createElement(FlexCmsPage, { pageData });
    const bodyHtml = ReactDOMServer.renderToString(
      React.createElement(FlexCmsProvider, {
        client: this.client,
        componentMap,
        children: pageElement,
      })
    );

    // 6. Wrap in full HTML document
    const fullHtml = this.wrapInDocument(bodyHtml, pageData, siteId, locale);

    // 7. Compute SHA-256 content hash for cache busting
    const hash = createHash('sha256').update(fullHtml).digest('hex').substring(0, 16);

    log.debug({ pagePath, hash, deps: dependencies.length }, 'Page rendered');

    return {
      pagePath,
      html: fullHtml,
      contentVersion: pageData.page.lastModified,
      hash,
      dependencies,
    };
  }

  /**
   * Wrap rendered body HTML in a full HTML document.
   */
  private wrapInDocument(body: string, pageData: PageResponse, siteId: string, locale: string): string {
    const { page } = pageData;
    const title = this.escapeHtml(page.title);
    const description = this.escapeHtml(page.description ?? '');
    const canonicalPath = page.path.replace(/\./g, '/');

    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <!-- FlexCMS metadata -->
  <meta name="generator" content="FlexCMS Static Build">
  <meta name="flexcms:site" content="${siteId}">
  <meta name="flexcms:locale" content="${locale}">
  <meta name="flexcms:path" content="${page.path}">
  <meta name="flexcms:version" content="${page.lastModified}">
</head>
<body>
  <div id="__flexcms" data-flexcms-path="${canonicalPath}">${body}</div>
</body>
</html>`;
  }

  /**
   * Walk the component tree and collect dependency entries.
   */
  private collectDependencies(pageData: PageResponse): DependencyEntry[] {
    const deps: DependencyEntry[] = [];
    const seen = new Set<string>();

    const addDep = (dep: DependencyEntry) => {
      const key = `${dep.type}:${dep.key}`;
      if (!seen.has(key)) {
        seen.add(key);
        deps.push(dep);
      }
    };

    addDep({ type: 'NAVIGATION', key: 'nav' }); // All pages depend on nav

    const walk = (components: ComponentNode[]) => {
      for (const c of components) {
        addDep({ type: 'COMPONENT', key: c.resourceType });

        // Check for asset references in data values
        for (const value of Object.values(c.data)) {
          if (
            typeof value === 'string' &&
            (value.startsWith('/dam/') || value.startsWith('dam/'))
          ) {
            addDep({ type: 'ASSET', key: value });
          }
        }

        if (c.children?.length) walk(c.children);
      }
    };

    walk(pageData.components);
    return deps;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
